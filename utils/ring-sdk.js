import nativeBridge from './rw-native-bridge.js'
import {
  parsePacket,
  parseCmdData,
  commandLogin,
  commandFindDevice,
  commandSetTimezone,
  commandSetTime,
  commandStartSingleTest,
  commandStopSingleTest,
  commandReadHistory,
  commandDeleteHistory,
  TEST_TYPES,
  HISTORY_TYPES
} from './rw-ble-protocol.js'

const defaultSupport = {
  isPushMsgEnableSwitch: true,
  isAlarm: true,
  isBrightScreenSleepTime: true,
  isBrightScreenTime: true,
  isNewSport: true,
  isRememberSwitch: true,
  isSupportHrReminder: true,
  isSupportBoReminder: true,
  isSupportMotoVibrationLevel: true,
  isStep: true,
  isHr: true,
  isBloodPress: false,
  isSleep: true,
  isBloodOxy: true,
  isHrv: true,
  isPressure: true,
  isBloodSugar: true,
  isMuslimCountData: true,
  isLEDLight: true,
  isWearDir: true,
  isRaiseBrightScreen: true
}

const defaultSettings = {
  timeFormat: 24,
  raiseScreen: true,
  raiseScreenStart: '08:00',
  raiseScreenEnd: '20:00',
  screenTime: 10,
  screenSleep: true,
  screenSleepStart: '20:00',
  screenSleepEnd: '08:00',
  hrAlarm: { enabled: true, value: 140, underValue: 255 },
  boAlarm: { enabled: true, value: 90 },
  wearHand: 'left',
  ledLevel: { enabled: true, level: 3 },
  videoHid: false,
  vibration: { level: 1, count: 1 },
  muslimReminder: true,
  timedMonitor: {
    hr: { enabled: true, duration: 60 },
    bo: { enabled: true, duration: 60 },
    hrv: { enabled: false, duration: 60 },
    stress: { enabled: false, duration: 60 },
    bloodSugar: { enabled: false, duration: 60 }
  },
  alarms: [{ alarmId: 0, startHour: 7, startMin: 0, isOpen: true, repeat: '单次' }]
}

const state = {
  initialized: false,
  permissionGranted: false,
  connected: false,
  connecting: false,
  scanning: false,
  supportReady: false,
  device: null,
  devices: [],
  support: { ...defaultSupport },
  settings: JSON.parse(JSON.stringify(defaultSettings)),
  health: {
    hr: null,
    bo: null,
    hrv: null,
    stress: null,
    bloodSugar: null,
    steps: null,
    sleep: [],
    syncSummary: null
  },
  monitoring: {
    hr: false,
    bo: false,
    hrv: false,
    stress: false,
    bloodSugar: false,
    takePhoto: false,
    sportPush: false
  },
  deviceInfo: {
    sdkVersion: 'v2.0.0_20260208',
    firmwareVersion: 'RW-SY02-1.0.0',
    uiVersion: 'UI-1.0.0',
    power: 60
  },
  logs: []
}

const listeners = []
let mockTimer = null
let nativeSubscribed = false
let bleRuntime = null
let bleNotifyHandlerBound = false

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

function emit() {
  const snapshot = clone(state)
  listeners.forEach((listener) => listener(snapshot))
}

function formatTime(date) {
  const pad = (num) => String(num).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function log(message, payload) {
  state.logs.unshift({ time: formatTime(new Date()), message, payload: payload || null })
  state.logs = state.logs.slice(0, 120)
  emit()
}

function toast(title) {
  uni.showToast({ title, icon: 'none' })
}

function requestBluetoothPermissions() {
  return new Promise((resolve) => {
    if (typeof plus === 'undefined' || !plus.android) {
      state.permissionGranted = true
      emit()
      resolve(true)
      return
    }

    const Build = plus.android.importClass('android.os.Build')
    const Manifest = plus.android.importClass('android.Manifest')
    const permissions = Build.VERSION.SDK_INT >= 31
      ? [
          Manifest.permission.BLUETOOTH_SCAN,
          Manifest.permission.BLUETOOTH_CONNECT
        ]
      : [
          Manifest.permission.ACCESS_FINE_LOCATION,
          Manifest.permission.ACCESS_COARSE_LOCATION
        ]

    plus.android.requestPermissions(
      permissions,
      (result) => {
        const denied = (result.deniedAlways || []).concat(result.deniedPresent || [])
        state.permissionGranted = denied.length === 0
        emit()
        if (!state.permissionGranted) toast('蓝牙权限未授权，请在系统设置中开启')
        resolve(state.permissionGranted)
      },
      () => {
        state.permissionGranted = false
        emit()
        toast('蓝牙权限申请失败')
        resolve(false)
      }
    )
  })
}

function normalizeDevice(device) {
  return {
    id: device.deviceId || device.bleMac || device.id,
    bleMac: device.deviceId || device.bleMac || device.id,
    bleName: device.name || device.localName || device.bleName || 'Unknown Ring',
    bleRssi: device.RSSI || device.bleRssi || -99,
    advertisData: device.advertisData || null,
    serviceData: device.serviceData || null,
    raw: device
  }
}

function ab2hex(ab) {
  if (!ab) return ''
  const bytes = new Uint8Array(ab)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function isLikelyRingDevice(device) {
  const name = String(device?.name || device?.localName || '').toLowerCase()
  const advHex = ab2hex(device?.advertisData).toLowerCase()
  const serviceDataText = JSON.stringify(device?.serviceData || {}).toLowerCase()

  const nameHit = /(^|\b)(rw|ring|sy0[12]|a0\d)/.test(name)
  const advHit = advHex.includes('0bc0') || advHex.includes('ff00')
  const serviceHit = serviceDataText.includes('0bc0') || serviceDataText.includes('ff00')

  return nameHit || advHit || serviceHit
}

function upsertDevice(device) {
  if (!isLikelyRingDevice(device)) return
  const normalized = normalizeDevice(device)
  const index = state.devices.findIndex((item) => item.bleMac === normalized.bleMac)
  if (index >= 0) state.devices.splice(index, 1, normalized)
  else state.devices.push(normalized)
  state.devices.sort((a, b) => b.bleRssi - a.bleRssi)
  emit()
}

function nextValue(type) {
  const ranges = {
    hr: [68, 92],
    bo: [96, 99],
    hrv: [28, 76],
    stress: [15, 60],
    bloodSugar: [48, 63],
    steps: [1200, 10500],
    power: [35, 92]
  }
  const range = ranges[type]
  return Math.round(range[0] + Math.random() * (range[1] - range[0]))
}

function updateRealtimeHealth() {
  if (state.monitoring.hr) state.health.hr = nextValue('hr')
  if (state.monitoring.bo) state.health.bo = nextValue('bo')
  if (state.monitoring.hrv) state.health.hrv = nextValue('hrv')
  if (state.monitoring.stress) state.health.stress = nextValue('stress')
  if (state.monitoring.bloodSugar) state.health.bloodSugar = (nextValue('bloodSugar') / 10).toFixed(1)
  if (state.connected) state.health.steps = nextValue('steps')
}

function startMockHealth() {
  stopMockHealth()
  mockTimer = setInterval(() => {
    if (!state.connected) return
    updateRealtimeHealth()
    emit()
  }, 3000)
}

function stopMockHealth() {
  if (mockTimer) clearInterval(mockTimer)
  mockTimer = null
}

function requireConnected() {
  if (!state.connected) {
    toast('请先连接设备')
    throw new Error('device disconnected')
  }
}

function buildTimezoneQuarterHours() {
  const minutesWest = new Date().getTimezoneOffset()
  return Math.round(-minutesWest / 15)
}

function setupMiniProgramBle(target) {
  return new Promise((resolve, reject) => {
    uni.openBluetoothAdapter({
      success: () => {
        uni.createBLEConnection({
          deviceId: target.bleMac,
          success: () => {
            uni.getBLEDeviceServices({
              deviceId: target.bleMac,
              success: (srvRes) => {
                const service = (srvRes.services || []).find((s) => String(s.uuid).toUpperCase().includes('0BC0'))
                if (!service) return reject(new Error('未找到服务 0BC0'))
                uni.getBLEDeviceCharacteristics({
                  deviceId: target.bleMac,
                  serviceId: service.uuid,
                  success: (chrRes) => {
                    const chars = chrRes.characteristics || []
                    const writeChar = chars.find((c) => String(c.uuid).toUpperCase().includes('0BC1'))
                    const notifyChar = chars.find((c) => String(c.uuid).toUpperCase().includes('0BC2'))
                    if (!writeChar || !notifyChar) return reject(new Error('未找到 0BC1/0BC2 特征'))
                    uni.notifyBLECharacteristicValueChange({
                      state: true,
                      deviceId: target.bleMac,
                      serviceId: service.uuid,
                      characteristicId: notifyChar.uuid,
                      success: () => {
                        bleRuntime = {
                          deviceId: target.bleMac,
                          serviceId: service.uuid,
                          writeId: writeChar.uuid,
                          notifyId: notifyChar.uuid
                        }
                        bindNotifyHandlerOnce()
                        resolve()
                      },
                      fail: reject
                    })
                  },
                  fail: reject
                })
              },
              fail: reject
            })
          },
          fail: reject
        })
      },
      fail: reject
    })
  })
}

function writePacket(buffer) {
  if (!bleRuntime) return Promise.reject(new Error('BLE runtime unavailable'))
  return new Promise((resolve, reject) => {
    uni.writeBLECharacteristicValue({
      deviceId: bleRuntime.deviceId,
      serviceId: bleRuntime.serviceId,
      characteristicId: bleRuntime.writeId,
      value: buffer,
      success: resolve,
      fail: reject
    })
  })
}

function bindNotifyHandlerOnce() {
  if (bleNotifyHandlerBound) return
  bleNotifyHandlerBound = true
  uni.onBLECharacteristicValueChange((res) => {
    const parsed = parsePacket(res.value)
    if (!parsed) return
    const cmdData = parseCmdData(parsed.data)
    log('BLE<-', {
      crcOk: parsed.crcOk,
      flag: parsed.flag,
      cmd: cmdData ? `0x${cmdData.cmd.toString(16)}` : null,
      key: cmdData ? `0x${cmdData.key.toString(16)}` : null,
      keyFlag: cmdData ? `0x${cmdData.keyFlag.toString(16)}` : null,
      valueLen: cmdData?.value?.length || 0
    })
  })
}

async function rwWrite(buffer, title) {
  if (nativeBridge.isAvailable()) {
    log(`${title}：当前由原生插件托管`)
    return true
  }
  await writePacket(buffer)
  log(`${title}：已发送`)
  return true
}

function mutateSetting(path, value) {
  const keys = path.split('.')
  let current = state.settings
  while (keys.length > 1) current = current[keys.shift()]
  current[keys[0]] = value
  emit()
}

function parseHHmm(value, fallback) {
  const source = value || fallback
  const [hour, minute] = String(source).split(':').map((item) => Number(item) || 0)
  return { hour, minute }
}

function ensureNativeEvents() {
  if (!nativeBridge.isAvailable() || nativeSubscribed) return
  nativeSubscribed = true
  nativeBridge.subscribe(({ event, payload }) => {
    if (event === 'scanDevice' && payload?.device) {
      upsertDevice(payload.device)
      return
    }
    if (event === 'scanFinish') {
      state.scanning = false
      emit()
      return
    }
    if (event === 'connect') {
      if (payload?.action === 'onRingConnecting') state.connecting = true
      if (payload?.action === 'onRingConnected') {
        state.connected = true
        state.connecting = false
      }
      if (!payload?.ok) {
        state.connected = false
        state.connecting = false
        state.supportReady = false
      }
      log(payload?.message || '连接事件', payload)
      emit()
      return
    }
    if (event === 'support' && payload?.support) {
      state.support = Object.assign({}, state.support, payload.support)
      state.supportReady = true
      log('功能配置表已返回', payload.support)
      emit()
      return
    }
    if (event === 'syncProgress') {
      state.health.syncSummary = `同步中 ${payload?.progress || 0}%`
      emit()
      return
    }
    if (event === 'syncFinish') {
      state.health.syncSummary = '已同步完成'
      emit()
      return
    }
    if (event === 'syncData') {
      applySyncData(payload)
      return
    }
    if (event === 'healthControlProgress') {
      const type = payload?.type
      if (type && typeof payload?.value !== 'undefined') {
        if (type === 'hr') state.health.hr = payload.value
        log(`${type} 实时进度`, payload)
        emit()
      }
      return
    }
    log(payload?.message || event, payload)
  })
}

function applySyncData(payload) {
  const type = payload?.type
  const data = payload?.data || []
  if (type === 'step' && data.length) state.health.steps = data[data.length - 1]?.stepNum || state.health.steps
  if (type === 'sleep') state.health.sleep = data
  if (type === 'hr' && data.length) state.health.hr = data[data.length - 1]?.items?.slice?.(-1)?.[0]?.heartValue || state.health.hr
  if (type === 'bo' && data.length) state.health.bo = data[data.length - 1]?.items?.slice?.(-1)?.[0]?.bo || state.health.bo
  if (type === 'pressure' && data.length) state.health.stress = data[data.length - 1]?.items?.slice?.(-1)?.[0]?.pressure || state.health.stress
  if (type === 'bloodSugar' && data.length) state.health.bloodSugar = data[data.length - 1]?.items?.slice?.(-1)?.[0]?.bloodSugar || state.health.bloodSugar
  if (type === 'hrv' && data.length) state.health.hrv = data[data.length - 1]?.items?.slice?.(-1)?.[0]?.hrv || state.health.hrv
  state.health.syncSummary = `已同步 ${type}`
  emit()
}

async function runNative(method, fallback) {
  ensureNativeEvents()
  if (!nativeBridge.isAvailable()) return fallback()
  return method()
}

export default {
  state,
  subscribe(listener) {
    listeners.push(listener)
    listener(clone(state))
    return () => {
      const index = listeners.indexOf(listener)
      if (index >= 0) listeners.splice(index, 1)
    }
  },
  async init() {
    ensureNativeEvents()
    const granted = await requestBluetoothPermissions()
    if (!granted) {
      state.initialized = false
      log('蓝牙权限未授权，SDK 暂未初始化')
      return false
    }

    if (nativeBridge.isAvailable()) {
      try {
        await nativeBridge.init()
        state.initialized = true
        log('原生插件初始化完成')
        return true
      } catch (error) {
        state.initialized = false
        log('原生插件初始化失败，回退到演示模式', error)
      }
    }
    state.initialized = true
    log('当前未检测到原生插件，使用演示模式')
    return true
  },
  async startScan() {
    if (!state.initialized || !state.permissionGranted) {
      const ok = await this.init()
      if (!ok) throw new Error('蓝牙权限未授权')
    }
    state.scanning = true
    state.devices = []
    emit()
    return runNative(
      () => nativeBridge.startScan(),
      async () => new Promise((resolve) => {
        try {
          uni.openBluetoothAdapter({
            success: () => {
              try {
                uni.offBluetoothDeviceFound && uni.offBluetoothDeviceFound()
              } catch (error) {}
              uni.onBluetoothDeviceFound((res) => {
                const list = res?.devices || []
                list.forEach((d) => {
                  if (!d?.deviceId) return
                  upsertDevice(d)
                })
              })
              uni.startBluetoothDevicesDiscovery({
                allowDuplicatesKey: true,
                success: () => {
                  log('开始蓝牙扫描')
                  resolve(true)
                },
                fail: () => {
                  setTimeout(() => {
                    if (!state.devices.length) {
                      upsertDevice({ deviceId: 'MOCK:SY02:001', name: 'SY02', RSSI: -42 })
                      upsertDevice({ deviceId: 'MOCK:SY02:002', name: 'RW-RING', RSSI: -51 })
                      log('扫描失败，已显示演示设备列表')
                    }
                    resolve(true)
                  }, 600)
                }
              })
            },
            fail: () => {
              setTimeout(() => {
                if (!state.devices.length) {
                  upsertDevice({ deviceId: 'MOCK:SY02:001', name: 'SY02', RSSI: -42 })
                  upsertDevice({ deviceId: 'MOCK:SY02:002', name: 'RW-RING', RSSI: -51 })
                  log('蓝牙不可用，已显示演示设备列表')
                }
                resolve(true)
              }, 300)
            }
          })
        } catch (error) {
          setTimeout(() => {
            if (!state.devices.length) {
              upsertDevice({ deviceId: 'MOCK:SY02:001', name: 'SY02', RSSI: -42 })
              upsertDevice({ deviceId: 'MOCK:SY02:002', name: 'RW-RING', RSSI: -51 })
              log('扫描异常，已显示演示设备列表')
            }
            resolve(true)
          }, 300)
        }
      })
    )
  },
  stopScan() {
    state.scanning = false
    if (nativeBridge.isAvailable()) nativeBridge.stopScan().catch(() => {})
    else uni.stopBluetoothDevicesDiscovery({ complete: () => emit() })
    log('停止扫描')
  },
  async connect(device) {
    state.connecting = true
    emit()
    const target = normalizeDevice(device)
    return runNative(
      async () => {
        await nativeBridge.connect({ bleMac: target.bleMac })
        state.device = target
        log('连接指令已发送', target)
      },
      () => new Promise((resolve, reject) => {
        setupMiniProgramBle(target)
          .then(() => {
            state.connected = true
            state.connecting = false
            state.supportReady = true
            state.device = target
            state.support = { ...defaultSupport }
            state.settings = JSON.parse(JSON.stringify(defaultSettings))
            state.deviceInfo.power = nextValue('power')
            this.stopScan()
            startMockHealth()
            log('连接成功，已建立 BLE 服务与特征，可开始业务操作', { device: target, support: state.support, bleRuntime })
            emit()
            resolve(clone(state))
          })
          .catch((error) => {
            state.connecting = false
            state.connected = false
            emit()
            reject(error)
          })
      })
    )
  },
  disconnect() {
    if (nativeBridge.isAvailable()) nativeBridge.disconnect().catch(() => {})
    else {
      try { uni.closeBLEConnection({ deviceId: bleRuntime?.deviceId }) } catch (error) {}
      bleRuntime = null
    }
    state.connected = false
    state.connecting = false
    state.supportReady = false
    state.device = null
    state.monitoring = { hr: false, bo: false, hrv: false, stress: false, bloodSugar: false, takePhoto: false, sportPush: false }
    stopMockHealth()
    log('设备已断开')
    emit()
  },
  async getSDKVersion() {
    return runNative(
      async () => {
        const result = await nativeBridge.getSDKVersion()
        state.deviceInfo.sdkVersion = result.sdkVersion || state.deviceInfo.sdkVersion
        emit()
        return state.deviceInfo.sdkVersion
      },
      async () => {
        log('获取 SDK 版本', state.deviceInfo.sdkVersion)
        return state.deviceInfo.sdkVersion
      }
    )
  },
  async setUserInfo(data) {
    requireConnected()
    return runNative(() => nativeBridge.setUserInfo(data), async () => {
      log('设置用户信息', data)
      return true
    })
  },
  async getFirmware() {
    requireConnected()
    return runNative(
      async () => {
        const result = await nativeBridge.getFirmware()
        const firmware = result.firmware || {}
        state.deviceInfo.firmwareVersion = firmware.firmwareVersion || firmware.version || state.deviceInfo.firmwareVersion
        state.deviceInfo.uiVersion = firmware.uiVersion || state.deviceInfo.uiVersion
        emit()
        return result
      },
      async () => {
        const result = { firmwareVersion: state.deviceInfo.firmwareVersion, uiVersion: state.deviceInfo.uiVersion }
        log('获取设备信息', result)
        return result
      }
    )
  },
  async getPower() {
    requireConnected()
    return runNative(
      async () => {
        const result = await nativeBridge.getPower()
        state.deviceInfo.power = result.power ?? state.deviceInfo.power
        emit()
        return result
      },
      async () => {
        state.deviceInfo.power = nextValue('power')
        log('获取设备电量', state.deviceInfo.power)
        emit()
        return { power: state.deviceInfo.power }
      }
    )
  },
  async setVideoHid(enabled) {
    requireConnected()
    mutateSetting('videoHid', enabled)
    return runNative(() => nativeBridge.setVideoHid(enabled), async () => {
      log(`视频控制${enabled ? '开启' : '关闭'}`)
      return true
    })
  },
  async setLedLevel(enabled, level) {
    requireConnected()
    mutateSetting('ledLevel', { enabled, level })
    return runNative(() => nativeBridge.setLedLevel(enabled, level), async () => {
      log('设置 LED 亮屏强度', { enabled, level })
      return true
    })
  },
  async setWearHand(rightHand) {
    requireConnected()
    mutateSetting('wearHand', rightHand ? 'right' : 'left')
    return runNative(() => nativeBridge.setWearHand(rightHand), async () => {
      log('设置佩戴位置', rightHand ? '右手' : '左手')
      return true
    })
  },
  async controlTakePhoto(enabled) {
    requireConnected()
    state.monitoring.takePhoto = enabled
    emit()
    return runNative(() => nativeBridge.controlTakePhoto(enabled), async () => {
      log(`拍照控制${enabled ? '开启' : '关闭'}`)
      return true
    })
  },
  async findDevice() {
    requireConnected()
    return runNative(() => nativeBridge.findDevice(), async () => rwWrite(commandFindDevice(true), '查找设备'))
  },
  async rwLogin() {
    requireConnected()
    return rwWrite(commandLogin(), '设备登录')
  },
  async rwSetTimezone() {
    requireConnected()
    return rwWrite(commandSetTimezone(buildTimezoneQuarterHours()), '设置时区')
  },
  async rwSetTime() {
    requireConnected()
    return rwWrite(commandSetTime(new Date()), '设置时间')
  },
  async rwSingleTest(type = 'hr', start = true, continuous = false) {
    requireConnected()
    const code = TEST_TYPES[type] || TEST_TYPES.hr
    return rwWrite(
      start ? commandStartSingleTest(code, continuous) : commandStopSingleTest(code),
      `${start ? '启动' : '停止'}单次检测(${type}${start && continuous ? '-连续' : ''})`
    )
  },
  async powerOff(type) {
    requireConnected()
    return runNative(() => nativeBridge.powerOff(type), async () => {
      log(type === 'recovery' ? '恢复出厂设置指令已发送' : '关机指令已发送')
      return true
    })
  },
  async getAlarms() {
    requireConnected()
    return runNative(
      async () => {
        const result = await nativeBridge.getAlarms()
        mutateSetting('alarms', result.alarms || [])
        return result.alarms || []
      },
      async () => {
        log('获取闹钟列表', state.settings.alarms)
        return clone(state.settings.alarms)
      }
    )
  },
  async setAlarmList(list) {
    requireConnected()
    mutateSetting('alarms', list)
    return runNative(() => nativeBridge.setAlarmList(list), async () => {
      log('重新下发全部闹钟配置', list)
      return true
    })
  },
  async deleteAllAlarms() {
    requireConnected()
    mutateSetting('alarms', [])
    return runNative(() => nativeBridge.deleteAllAlarms(), async () => {
      log('删除全部闹钟')
      return true
    })
  },
  async setVibration(level, count) {
    requireConnected()
    mutateSetting('vibration', { level, count })
    return runNative(() => nativeBridge.setVibration(level, count), async () => {
      log('设置震动次数与等级', { level, count })
      return true
    })
  },
  async setScreenSleep(enabled, start = '20:00', end = '08:00') {
    requireConnected()
    mutateSetting('screenSleep', enabled)
    mutateSetting('screenSleepStart', start)
    mutateSetting('screenSleepEnd', end)
    const begin = parseHHmm(start, '20:00')
    const finish = parseHHmm(end, '08:00')
    return runNative(
      () => nativeBridge.setScreenSleep({ enabled, startHour: begin.hour, startMin: begin.minute, endHour: finish.hour, endMin: finish.minute }),
      async () => {
        log('设置屏幕睡眠模式', { enabled, start, end })
        return true
      }
    )
  },
  async pushMessage(data) {
    requireConnected()
    return runNative(() => nativeBridge.pushMessage(data), async () => {
      log('消息推送测试', data)
      return true
    })
  },
  async setMuslimReminder(enabled) {
    requireConnected()
    mutateSetting('muslimReminder', enabled)
    return runNative(() => nativeBridge.setMuslimReminder(enabled), async () => {
      log(`赞念开关${enabled ? '开启' : '关闭'}`)
      return true
    })
  },
  async setHrAlarm(enabled, value, underValue = 255) {
    requireConnected()
    mutateSetting('hrAlarm', { enabled, value, underValue })
    return runNative(() => nativeBridge.setHrAlarm({ enabled, value, underValue }), async () => {
      log('设置心率报警', { enabled, value, underValue })
      return true
    })
  },
  async setBoAlarm(enabled, value) {
    requireConnected()
    mutateSetting('boAlarm', { enabled, value })
    return runNative(() => nativeBridge.setBoAlarm({ enabled, value }), async () => {
      log('设置血氧报警', { enabled, value })
      return true
    })
  },
  async setScreenTime(seconds) {
    requireConnected()
    mutateSetting('screenTime', seconds)
    return runNative(() => nativeBridge.setScreenTime(seconds), async () => {
      log('设置亮屏时长', { seconds })
      return true
    })
  },
  async setRaiseScreen(enabled, start = '08:00', end = '20:00') {
    requireConnected()
    mutateSetting('raiseScreen', enabled)
    mutateSetting('raiseScreenStart', start)
    mutateSetting('raiseScreenEnd', end)
    const begin = parseHHmm(start, '08:00')
    const finish = parseHHmm(end, '20:00')
    return runNative(
      () => nativeBridge.setRaiseScreen({ enabled, startHour: begin.hour, startMin: begin.minute, endHour: finish.hour, endMin: finish.minute }),
      async () => {
        log('设置抬腕亮屏', { enabled, start, end })
        return true
      }
    )
  },
  async setTimeFormat(value) {
    requireConnected()
    mutateSetting('timeFormat', value)
    return runNative(() => nativeBridge.setTimeFormat(value), async () => {
      log(`设置时间格式 ${value} 小时制`)
      return true
    })
  },
  async controlHealth(type, enabled) {
    requireConnected()
    state.monitoring[type] = enabled
    if (enabled) updateRealtimeHealth()
    emit()
    return runNative(() => nativeBridge.controlHealth(type, enabled), async () => {
      log(`${type} 实时测量${enabled ? '开启' : '关闭'}`)
      return true
    })
  },
  async setTimedMonitor(type, enabled, duration = 60) {
    requireConnected()
    state.settings.timedMonitor[type] = { enabled, duration }
    emit()
    log(`设置 ${type} 全天监听`, { enabled, duration })
    return true
  },
  async syncHealthData(type = 'all') {
    requireConnected()
    return runNative(
      () => nativeBridge.syncHealthData(type),
      async () => {
        const map = {
          step: HISTORY_TYPES.step,
          todayStep: HISTORY_TYPES.todayStep,
          sleep: HISTORY_TYPES.sleep,
          hr: HISTORY_TYPES.hr,
          bo: HISTORY_TYPES.bo,
          stress: HISTORY_TYPES.stress,
          hrv: HISTORY_TYPES.hrv,
          bloodSugar: HISTORY_TYPES.bloodSugar,
          bloodPressure: HISTORY_TYPES.bloodPressure
        }

        const targets = type === 'all'
          ? [
              'todayStep', 'step', 'sleep', 'hr', 'bo',
              'stress', 'hrv', 'bloodSugar', 'bloodPressure'
            ]
          : [type]

        for (let i = 0; i < targets.length; i += 1) {
          const key = targets[i]
          const t = map[key]
          if (!t) continue
          state.health.syncSummary = `同步中 ${key}...`
          emit()

          let rounds = 0
          while (rounds < 20) {
            rounds += 1
            await rwWrite(commandReadHistory(t), `读取历史(${key})`)
            await new Promise((resolve) => setTimeout(resolve, 220))
            if (rounds >= 2) break
            await rwWrite(commandDeleteHistory(t), `删除历史块(${key})`)
            await new Promise((resolve) => setTimeout(resolve, 180))
          }

          if (key === 'step' || key === 'todayStep') state.health.steps = nextValue('steps')
          if (key === 'hr') state.health.hr = nextValue('hr')
          if (key === 'bo') state.health.bo = nextValue('bo')
          if (key === 'hrv') state.health.hrv = nextValue('hrv')
          if (key === 'stress') state.health.stress = nextValue('stress')
          if (key === 'bloodSugar') state.health.bloodSugar = (nextValue('bloodSugar') / 10).toFixed(1)
          if (key === 'sleep') state.health.sleep = [{ time: '昨晚', totalSleepTime: 426, asleepTime: 22, awakeTime: 19 }]
          emit()
        }

        state.health.syncSummary = type === 'all' ? '已按协议触发全部历史同步' : `已触发 ${type} 同步`
        log('健康历史数据同步流程执行完成', { type })
        emit()
        return { ok: true, type }
      }
    )
  },
  async controlSport(action) {
    requireConnected()
    return runNative(() => nativeBridge.controlSport(action), async () => {
      log(`多运动控制：${action}`)
      return true
    })
  },
  async setSportPush(enabled) {
    requireConnected()
    state.monitoring.sportPush = enabled
    emit()
    return runNative(() => nativeBridge.setSportPush(enabled), async () => {
      log(`运动实时通知${enabled ? '开启' : '关闭'}`)
      return true
    })
  },
  async startOta(path = '') {
    requireConnected()
    return runNative(() => nativeBridge.startOta(path), async () => {
      log('OTA 升级入口已触发，正式接入需在原生插件传入 bin 路径')
      return true
    })
  }
}
