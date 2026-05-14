const isAppPlus = typeof plus !== 'undefined'
let plugin = null
let registered = false
const listeners = []

function getPlugin() {
  if (!isAppPlus) return null
  if (plugin) return plugin
  try {
    plugin = uni.requireNativePlugin('RWBleModule')
  } catch (error) {
    plugin = null
  }
  return plugin
}

function emit(event) {
  listeners.forEach((listener) => listener(event))
}

function ensureRegister() {
  const nativePlugin = getPlugin()
  if (!nativePlugin || registered) return
  registered = true
  nativePlugin.registerEvent({}, (event) => {
    emit(event)
  })
}

function invoke(method, payload = {}) {
  const nativePlugin = getPlugin()
  if (!nativePlugin || typeof nativePlugin[method] !== 'function') {
    return Promise.reject(new Error(`native plugin method unavailable: ${method}`))
  }
  ensureRegister()
  return new Promise((resolve, reject) => {
    nativePlugin[method](payload, (result) => {
      if (result && result.ok) resolve(result)
      else reject(result || new Error(`native plugin call failed: ${method}`))
    })
  })
}

export default {
  isAvailable() {
    const nativePlugin = getPlugin()
    if (!nativePlugin) return false
    return typeof nativePlugin.init === 'function'
  },
  subscribe(listener) {
    listeners.push(listener)
    ensureRegister()
    return () => {
      const index = listeners.indexOf(listener)
      if (index >= 0) listeners.splice(index, 1)
    }
  },
  init() { return invoke('init') },
  startScan() { return invoke('startScan') },
  stopScan() { return invoke('stopScan') },
  connect(payload) { return invoke('connect', payload) },
  disconnect() { return invoke('disconnect') },
  getSDKVersion() { return invoke('getSDKVersion') },
  setUserInfo(payload) { return invoke('setUserInfo', payload) },
  getPower() { return invoke('getPower') },
  getFirmware() { return invoke('getFirmware') },
  findDevice() { return invoke('findDevice') },
  setTimeFormat(format) { return invoke('setTimeFormat', { format }) },
  setVideoHid(enabled) { return invoke('setVideoHid', { enabled }) },
  setLedLevel(enabled, level) { return invoke('setLedLevel', { enabled, level }) },
  setWearHand(rightHand) { return invoke('setWearHand', { rightHand }) },
  controlTakePhoto(enabled) { return invoke('controlTakePhoto', { enabled }) },
  setScreenTime(seconds) { return invoke('setScreenTime', { seconds }) },
  setRaiseScreen(payload) { return invoke('setRaiseScreen', payload) },
  setScreenSleep(payload) { return invoke('setScreenSleep', payload) },
  setVibration(level, count) { return invoke('setVibration', { level, count }) },
  pushMessage(payload) { return invoke('pushMessage', payload) },
  setMuslimReminder(enabled) { return invoke('setMuslimReminder', { enabled }) },
  setHrAlarm(payload) { return invoke('setHrAlarm', payload) },
  setBoAlarm(payload) { return invoke('setBoAlarm', payload) },
  getAlarms() { return invoke('getAlarms') },
  setAlarmList(alarms) { return invoke('setAlarmList', { alarms }) },
  deleteAllAlarms() { return invoke('deleteAllAlarms') },
  controlHealth(type, enabled) { return invoke('controlHealth', { type, enabled }) },
  syncHealthData(type) { return invoke('syncHealthData', { type }) },
  controlSport(action) { return invoke('controlSport', { action }) },
  setSportPush(enabled) { return invoke('setSportPush', { enabled }) },
  powerOff(type) { return invoke('powerOff', { type }) },
  startOta(path) { return invoke('startOta', { path }) }
}
