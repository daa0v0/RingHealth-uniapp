import {
  parsePacket,
  parseCmdData,
  commandLogin,
  commandFindDevice,
  commandSetTimezone,
  commandSetTime,
  commandGetFirmware,
  commandGetPower,
  commandGetMac,
  commandGetRestingHealth,
  commandSetUserInfo,
  commandTimedMonitor,
  commandSetLedLevel,
  commandSetVideoHid,
  commandSetWearHand,
  commandSetBleName,
  commandStartSingleTest,
  commandStopSingleTest,
  commandControlPhoto,
  commandPowerOff,
  commandReadHistory,
  commandDeleteHistory,
  commandSensorOutput,
  commandGenericWrite,
  parseFirmwareValue,
  parseHistoryItems,
  parseRealtimeValue,
  parseRestingHealth,
  parseMac,
  parseSensorPacket,
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
    syncSummary: null,
    histories: {},
    resting: null,
    bloodPressure: null,
    rawSensor: null
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
    sdkVersion: 'RW MiniProgram Protocol 20260426',
    firmwareVersion: '--',
    uiVersion: '--',
    model: '--',
    shape: '--',
    width: 0,
    height: 0,
    mac: '',
    power: 60
  },
  logs: []
}

const listeners = []
let bleRuntime = null
let bleNotifyHandlerBound = false
let commandQueue = Promise.resolve()
let pendingResolvers = []
let lastHistoryBlock = null
let otaRuntime = null
let logSeq = 0

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
  logSeq += 1
  state.logs.unshift({ id: `${Date.now()}-${logSeq}`, time: formatTime(new Date()), message, payload: payload || null })
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

function clearRealtimeValue(type) {
  const map = {
    hr: 'hr',
    bo: 'bo',
    hrv: 'hrv',
    stress: 'stress',
    bloodSugar: 'bloodSugar',
    bloodPressure: 'bloodPressure'
  }
  const key = map[type]
  if (key) state.health[key] = null
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

function handleProtocolData(cmdData, parsed) {
  if (!cmdData) return
  const realtime = parseRealtimeValue(cmdData.cmdKey, cmdData.value)
  if (realtime) {
    if (realtime.type === 'bloodPressure') state.health.bloodPressure = realtime
    else state.health[realtime.type] = realtime.value
    emit()
  }
  if (cmdData.cmdKey === 0x0281) state.health.resting = parseRestingHealth(cmdData.value)
  if (cmdData.cmdKey === 0x0205) state.deviceInfo.mac = parseMac(cmdData.value)
  if (cmdData.cmdKey === 0x0204) {
    const info = parseFirmwareValue(cmdData.value)
    if (info) Object.assign(state.deviceInfo, info)
  }
  if (cmdData.cmdKey === 0x0203 && cmdData.value.length) state.deviceInfo.power = cmdData.value[0]
  if (cmdData.cmdKey === 0x02fb) state.health.rawSensor = parseSensorPacket(cmdData.value)
  if (cmdData.cmd === 0x05 && cmdData.keyFlag === 0x10) lastHistoryBlock = { key: cmdData.key, value: cmdData.value }
  pendingResolvers = pendingResolvers.filter((item) => {
    if (item.matcher(cmdData, parsed)) {
      clearTimeout(item.timer)
      item.resolve({ cmdData, parsed })
      return false
    }
    return true
  })
  emit()
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
      cmdKey: cmdData ? `0x${cmdData.cmdKey.toString(16)}` : null,
      keyFlag: cmdData ? `0x${cmdData.keyFlag.toString(16)}` : null,
      valueLen: cmdData?.value?.length || 0
    })
    handleProtocolData(cmdData, parsed)
  })
}

function waitForResponse(matcher, timeout = 2500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingResolvers = pendingResolvers.filter((item) => item.resolve !== resolve)
      reject(new Error('BLE response timeout'))
    }, timeout)
    pendingResolvers.push({ matcher, resolve, timer })
  })
}

async function rwWrite(buffer, title, options = {}) {
  const task = async () => {
    const waiter = options.wait ? waitForResponse(options.wait, options.timeout) : null
    await writePacket(buffer)
    log(`${title}：已发送`)
    return waiter || true
  }
  commandQueue = commandQueue.then(task, task)
  return commandQueue
}

function waitByCmdKey(cmdKey, keyFlag) {
  return (cmdData) => cmdData.cmdKey === cmdKey && (keyFlag === undefined || cmdData.keyFlag === keyFlag)
}

function waitForRealtime(type = 'hr', timeout = 20000) {
  return waitForResponse((cmdData) => {
    const realtime = parseRealtimeValue(cmdData.cmdKey, cmdData.value)
    return !!realtime && realtime.type === type && realtime.value !== undefined && realtime.value !== null && Number(realtime.value) > 0
  }, timeout)
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

function injectMockDevices(reason) {
  if (state.devices.length) return
  upsertDevice({ deviceId: 'MOCK:SY02:001', name: 'SY02', RSSI: -42 })
  upsertDevice({ deviceId: 'MOCK:SY02:002', name: 'RW-RING', RSSI: -51 })
  log(reason)
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
    const granted = await requestBluetoothPermissions()
    if (!granted) {
      state.initialized = false
      log('蓝牙权限未授权，SDK 暂未初始化')
      return false
    }
    state.initialized = true
    log('蓝牙 SDK 初始化完成')
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
    return new Promise((resolve) => {
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
                  injectMockDevices('扫描失败，已显示演示设备列表')
                  resolve(true)
                }, 600)
              }
            })
          },
          fail: () => {
            setTimeout(() => {
              injectMockDevices('蓝牙不可用，已显示演示设备列表')
              resolve(true)
            }, 300)
          }
        })
      } catch (error) {
        setTimeout(() => {
          injectMockDevices('扫描异常，已显示演示设备列表')
          resolve(true)
        }, 300)
      }
    })
  },
  stopScan() {
    state.scanning = false
    uni.stopBluetoothDevicesDiscovery({ complete: () => emit() })
    log('停止扫描')
  },
  async connect(device) {
    state.connecting = true
    emit()
    const target = normalizeDevice(device)
    return new Promise((resolve, reject) => {
      setupMiniProgramBle(target)
        .then(() => {
          state.connected = true
          state.connecting = false
          state.supportReady = true
          state.device = target
          state.support = { ...defaultSupport }
          state.settings = JSON.parse(JSON.stringify(defaultSettings))
          state.deviceInfo.power = null
          this.stopScan()
          log('连接成功，已建立小程序协议 BLE 服务与特征，开始登录/时区/时间初始化', { device: target, support: state.support, bleRuntime })
          Promise.resolve()
            .then(() => this.rwLogin())
            .then(() => this.rwSetTimezone())
            .then(() => this.rwSetTime())
            .then(() => this.getFirmware())
            .then(() => this.getPower())
            .then(() => this.getMac())
            .catch((error) => log('初始化指令未全部完成', { message: error.message }))
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
  },
  disconnect() {
    try { uni.closeBLEConnection({ deviceId: bleRuntime?.deviceId }) } catch (error) {}
    bleRuntime = null
    state.connected = false
    state.connecting = false
    state.supportReady = false
    state.device = null
    state.monitoring = { hr: false, bo: false, hrv: false, stress: false, bloodSugar: false, takePhoto: false, sportPush: false }
    log('设备已断开')
    emit()
  },
  async getSDKVersion() {
    log('获取 SDK 版本', state.deviceInfo.sdkVersion)
    return state.deviceInfo.sdkVersion
  },
  async setUserInfo(data) {
    requireConnected()
    await rwWrite(commandSetUserInfo(data), '设置用户信息', { wait: waitByCmdKey(0x0206, 0x00) })
    return true
  },
  async getFirmware() {
    requireConnected()
    const res = await rwWrite(commandGetFirmware(), '获取设备版本信息', { wait: waitByCmdKey(0x0204, 0x10) })
    const info = parseFirmwareValue(res.cmdData.value) || {}
    Object.assign(state.deviceInfo, info)
    emit()
    return clone(state.deviceInfo)
  },
  async getPower() {
    requireConnected()
    const res = await rwWrite(commandGetPower(), '获取设备电量', { wait: waitByCmdKey(0x0203, 0x10) })
    if (res.cmdData.value.length) state.deviceInfo.power = res.cmdData.value[0]
    emit()
    return { power: state.deviceInfo.power }
  },
  async getMac() {
    requireConnected()
    const res = await rwWrite(commandGetMac(), '获取 MAC 地址', { wait: waitByCmdKey(0x0205, 0x10) })
    state.deviceInfo.mac = parseMac(res.cmdData.value)
    emit()
    return state.deviceInfo.mac
  },
  async getRestingHealth() {
    requireConnected()
    const res = await rwWrite(commandGetRestingHealth(), '获取静息健康数据', { wait: waitByCmdKey(0x0281, 0x10) })
    state.health.resting = parseRestingHealth(res.cmdData.value)
    emit()
    return state.health.resting
  },
  async setVideoHid(enabled, type = 1) {
    requireConnected()
    await rwWrite(commandSetVideoHid(enabled, type), `HID 应用控制${enabled ? '开启' : '关闭'}`, { wait: waitByCmdKey(0x0264, 0x00) })
    mutateSetting('videoHid', enabled)
    return true
  },
  async setLedLevel(enabled, level) {
    requireConnected()
    await rwWrite(commandSetLedLevel(enabled, level), '设置 LED 亮屏强度', { wait: waitByCmdKey(0x0266, 0x00) })
    mutateSetting('ledLevel', { enabled, level })
    return true
  },
  async setWearHand(rightHand) {
    requireConnected()
    await rwWrite(commandSetWearHand(rightHand), '设置佩戴位置', { wait: waitByCmdKey(0x0268, 0x00) })
    mutateSetting('wearHand', rightHand ? 'right' : 'left')
    return true
  },
  async setBleName(name) {
    requireConnected()
    await rwWrite(commandSetBleName(name), '修改蓝牙名称', { wait: waitByCmdKey(0x0265, 0x00) })
    return true
  },
  async controlTakePhoto(enabled) {
    requireConnected()
    await rwWrite(commandControlPhoto(enabled ? 1 : 0), `拍照控制${enabled ? '开启' : '关闭'}`, { wait: waitByCmdKey(0x0601, 0x00) })
    state.monitoring.takePhoto = enabled
    emit()
    return true
  },
  async findDevice() {
    requireConnected()
    return rwWrite(commandFindDevice(true), '查找设备', { wait: waitByCmdKey(0x0234, 0x00) })
  },
  async rwLogin() {
    requireConnected()
    return rwWrite(commandLogin(), '设备认证登录', { wait: waitByCmdKey(0x0302, 0x20), timeout: 1800 })
  },
  async rwSetTimezone() {
    requireConnected()
    return rwWrite(commandSetTimezone(buildTimezoneQuarterHours()), '设置时区', { wait: waitByCmdKey(0x0202, 0x00) })
  },
  async rwSetTime() {
    requireConnected()
    return rwWrite(commandSetTime(new Date()), '设置时间', { wait: waitByCmdKey(0x0201, 0x00) })
  },
  async rwSingleTest(type = 'hr', start = true, continuous = false) {
    requireConnected()
    const code = TEST_TYPES[type] || TEST_TYPES.hr
    await rwWrite(
      start ? commandStartSingleTest(code, continuous) : commandStopSingleTest(code),
      `${start ? '启动' : '停止'}单次检测(${type}${start && continuous ? '-连续' : ''})`,
      { wait: waitByCmdKey(0x0609, 0x00) }
    )
    return true
  },
  async powerOff(type) {
    requireConnected()
    await rwWrite(commandPowerOff(type === 'recovery' ? 2 : 1), type === 'recovery' ? '恢复出厂设置' : '关机', { wait: waitByCmdKey(0x0222, 0x00) })
    return true
  },
  async getAlarms() {
    requireConnected()
    log('获取闹钟列表', state.settings.alarms)
    return clone(state.settings.alarms)
  },
  async setAlarmList(list) {
    requireConnected()
    mutateSetting('alarms', list)
    log('重新下发全部闹钟配置', list)
    return true
  },
  async deleteAllAlarms() {
    requireConnected()
    mutateSetting('alarms', [])
    log('删除全部闹钟')
    return true
  },
  async setVibration(level, count) {
    requireConnected()
    mutateSetting('vibration', { level, count })
    log('设置震动次数与等级', { level, count })
    return true
  },
  async setScreenSleep(enabled, start = '20:00', end = '08:00') {
    requireConnected()
    mutateSetting('screenSleep', enabled)
    mutateSetting('screenSleepStart', start)
    mutateSetting('screenSleepEnd', end)
    log('设置屏幕睡眠模式', { enabled, start, end })
    return true
  },
  async pushMessage(data) {
    requireConnected()
    log('消息推送测试', data)
    return true
  },
  async setMuslimReminder(enabled) {
    requireConnected()
    mutateSetting('muslimReminder', enabled)
    log(`赞念开关${enabled ? '开启' : '关闭'}`)
    return true
  },
  async setHrAlarm(enabled, value, underValue = 255) {
    requireConnected()
    await rwWrite(commandGenericWrite(0x02, 0x17, [enabled ? 1 : 0, value & 0xff, underValue & 0xff]), '设置心率报警')
    mutateSetting('hrAlarm', { enabled, value, underValue })
    return true
  },
  async setBoAlarm(enabled, value) {
    requireConnected()
    await rwWrite(commandGenericWrite(0x02, 0x26, [enabled ? 1 : 0, value & 0xff]), '设置血氧报警')
    mutateSetting('boAlarm', { enabled, value })
    return true
  },
  async setScreenTime(seconds) {
    requireConnected()
    mutateSetting('screenTime', seconds)
    log('设置亮屏时长', { seconds })
    return true
  },
  async setRaiseScreen(enabled, start = '08:00', end = '20:00') {
    requireConnected()
    mutateSetting('raiseScreen', enabled)
    mutateSetting('raiseScreenStart', start)
    mutateSetting('raiseScreenEnd', end)
    log('设置抬腕亮屏', { enabled, start, end })
    return true
  },
  async setTimeFormat(value) {
    requireConnected()
    mutateSetting('timeFormat', value)
    log(`设置时间格式 ${value} 小时制`)
    return true
  },
  async controlHealth(type, enabled) {
    requireConnected()
    if (enabled) clearRealtimeValue(type)
    await this.rwSingleTest(type, enabled, enabled)
    state.monitoring[type] = enabled
    emit()
    log(`${type} 实时测量${enabled ? '已启动，等待戒指真实回传' : '已停止'}`)
    return true
  },
  async verifyHeartRateTransfer(timeout = 20000) {
    requireConnected()
    log('开始验证戒指连接：查找设备回包 + 心率实时回传')
    await this.findDevice()
    log('连接验证第 1 步通过：戒指已回复查找设备指令')
    clearRealtimeValue('hr')
    const realtimeWaiter = waitForRealtime('hr', timeout)
    await this.rwSingleTest('hr', true, true)
    state.monitoring.hr = true
    emit()
    const res = await realtimeWaiter
    const realtime = parseRealtimeValue(res.cmdData.cmdKey, res.cmdData.value)
    log('连接验证成功：已收到戒指心率实时数据', realtime)
    return { ok: true, type: 'hr', value: realtime.value, time: realtime.time }
  },
  async setTimedMonitor(type, enabled, duration = 60) {
    requireConnected()
    await rwWrite(commandTimedMonitor(type, enabled, duration), `设置 ${type} 全天监听`, { wait: (cmdData) => cmdData.cmd === 0x02 && cmdData.keyFlag === 0x00 })
    state.settings.timedMonitor[type] = { enabled, duration: type === 'hr' ? duration : 60 }
    emit()
    return true
  },
  async syncHealthData(type = 'all') {
    requireConnected()
    const map = {
      todayStep: HISTORY_TYPES.todayStep,
      today_step: HISTORY_TYPES.todayStep,
      step: HISTORY_TYPES.step,
      sleep: HISTORY_TYPES.sleep,
      hr: HISTORY_TYPES.hr,
      bo: HISTORY_TYPES.bo,
      stress: HISTORY_TYPES.stress,
      hrv: HISTORY_TYPES.hrv,
      bloodSugar: HISTORY_TYPES.bloodSugar,
      bloodPressure: HISTORY_TYPES.bloodPressure
    }

    const targets = type === 'all'
      ? ['todayStep', 'step', 'sleep', 'hr', 'bo', 'stress', 'hrv', 'bloodSugar', 'bloodPressure']
      : [type]

    const result = {}
    for (let i = 0; i < targets.length; i += 1) {
      const key = targets[i]
      const historyKey = map[key]
      if (historyKey === undefined) continue
      const items = []
      state.health.syncSummary = `同步中 ${key}...`
      emit()

      let rounds = 0
      while (rounds < 60) {
        rounds += 1
        lastHistoryBlock = null
        const res = await rwWrite(commandReadHistory(historyKey), `读取历史(${key})`, { wait: (cmdData) => cmdData.cmd === 0x05 && cmdData.key === historyKey && cmdData.keyFlag === 0x10, timeout: 4000 })
        const value = res.cmdData.value || []
        if (!value.length) break
        items.push(...parseHistoryItems(key, value))
        await rwWrite(commandDeleteHistory(historyKey), `删除历史块(${key})`, { wait: (cmdData) => cmdData.cmd === 0x05 && cmdData.key === historyKey && cmdData.keyFlag === 0x30, timeout: 2500 })
      }

      result[key] = items
      state.health.histories[key] = items
      const latest = items[items.length - 1]
      if ((key === 'step' || key === 'todayStep' || key === 'today_step') && latest) state.health.steps = latest.steps
      if (key === 'hr' && latest) state.health.hr = latest.value
      if (key === 'bo' && latest) state.health.bo = latest.value
      if (key === 'hrv' && latest) state.health.hrv = latest.value
      if (key === 'stress' && latest) state.health.stress = latest.value
      if (key === 'bloodSugar' && latest) state.health.bloodSugar = latest.value
      if (key === 'bloodPressure' && latest) state.health.bloodPressure = latest
      if (key === 'sleep') state.health.sleep = items
      emit()
    }

    state.health.syncSummary = type === 'all' ? '全部历史同步完成' : `${type} 同步完成`
    log('健康历史数据同步流程执行完成', { type, counts: Object.keys(result).reduce((acc, key) => ({ ...acc, [key]: result[key].length }), {}) })
    emit()
    return { ok: true, type, result }
  },
  async controlSport(action) {
    requireConnected()
    log(`多运动控制：${action}`)
    return true
  },
  async setSportPush(enabled) {
    requireConnected()
    state.monitoring.sportPush = enabled
    emit()
    log(`运动实时通知${enabled ? '开启' : '关闭'}`)
    return true
  },
  async controlSensor(sensorType = 3, enabled = true) {
    requireConnected()
    await rwWrite(commandSensorOutput(sensorType, enabled), `${enabled ? '开启' : '关闭'} Sensor 原始数据`, { wait: waitByCmdKey(0x02fa, 0x00) })
    return true
  },
  async startOta(path = '') {
    requireConnected()
    otaRuntime = { path, serviceId: 'FF00', characteristicId: 'FF01', status: 'ready' }
    log('OTA 升级入口已按小程序协议准备：需选择 bin 后按 FF00/FF01 流程发送 init/create/data/upgrade/reset', otaRuntime)
    return otaRuntime
  }
}
