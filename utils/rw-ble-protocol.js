const HEADER = 0xC6
export const FLAG_WRITE = 0x01
export const FLAG_REPLY = 0x11

export const KEY_FLAG = {
  write: 0x00,
  read: 0x10,
  add: 0x20,
  delete: 0x30
}

const CRC_TABLE = [
  0x72ae,0x2cd6,0x3d6c,0x4ae1,0x6784,0x18be,0x4823,0x0029,0x01eb,0x26e9,0x41bb,0x5af1,0x6df1,0x1649,0x5f90,0x6952,
  0x0099,0x0f3e,0x390c,0x7e87,0x153c,0x12db,0x2ea6,0x0bb3,0x54de,0x1547,0x4db7,0x4d06,0x491c,0x440d,0x305e,0x0124,
  0x26a6,0x428b,0x66bb,0x6443,0x4dc8,0x074d,0x2d12,0x39b3,0x1e1f,0x3b25,0x1238,0x4509,0x767d,0x7a5a,0x5d03,0x701f,
  0x323b,0x4e45,0x7ff5,0x7f96,0x6bfc,0x63cb,0x1ad4,0x6e5d,0x0732,0x56ae,0x0bdb,0x301c,0x030a,0x6b89,0x260d,0x2213,
  0x5cfd,0x6b36,0x5878,0x4b40,0x22ee,0x2350,0x759a,0x0120,0x0ddc,0x5f49,0x797d,0x3a9e,0x3bf6,0x5f32,0x1a49,0x3e12,
  0x1cd0,0x1366,0x2e40,0x4944,0x4df2,0x5e14,0x314f,0x4cad,0x5422,0x15a1,0x2c3b,0x6032,0x7eb7,0x4230,0x66c4,0x366b,
  0x73da,0x121f,0x798b,0x12e1,0x409d,0x5991,0x0822,0x3ef6,0x7049,0x139d,0x5772,0x7bb9,0x0902,0x3699,0x26ca,0x58b0,
  0x4080,0x13e9,0x3cd5,0x6899,0x16c5,0x187e,0x4a80,0x692c,0x3cd6,0x5c67,0x60bf,0x5753,0x48cc,0x23c9,0x33ea,0x5db2,
  0x0d66,0x368e,0x54dc,0x422d,0x047e,0x6ad6,0x2f14,0x0fbf,0x288f,0x6c69,0x2fff,0x3c61,0x2c49,0x4657,0x75ef,0x7983,
  0x6172,0x1916,0x489c,0x5e9d,0x261e,0x7dd1,0x22cd,0x3a61,0x0677,0x494a,0x7f4f,0x0384,0x71f0,0x401d,0x32e6,0x6b72,
  0x0fc9,0x6bcb,0x1953,0x542c,0x5039,0x6be8,0x18d7,0x4402,0x5dd5,0x11f4,0x2b0c,0x249e,0x7874,0x2833,0x5f1e,0x0e12,
  0x07cf,0x0035,0x127e,0x2059,0x5fa4,0x4cd4,0x5a9f,0x6ad4,0x3a2d,0x0e90,0x01d3,0x46cf,0x0ecc,0x1af4,0x6d22,0x6732,
  0x252a,0x591d,0x19d9,0x37e6,0x0975,0x458f,0x57d3,0x6048,0x7b44,0x4087,0x1481,0x5078,0x442b,0x49f7,0x1dc0,0x37e5,
  0x7fbe,0x3a8d,0x7f61,0x16d4,0x2b00,0x1850,0x765f,0x590e,0x251f,0x7282,0x0633,0x773b,0x3807,0x0c15,0x5005,0x0c7b,
  0x3bb1,0x39ce,0x4d54,0x5064,0x19da,0x3492,0x6270,0x1d18,0x3004,0x486a,0x5c46,0x4ff8,0x6a15,0x6d69,0x513e,0x4c85,
  0x5968,0x4d67,0x182f,0x1f16,0x73d9,0x470e,0x5e73,0x1796,0x5876,0x4f68,0x4e57,0x5ed0,0x0a4a,0x3f4a,0x2cf7,0x4ad4
]

function queryCrc16(crc16, value) {
  return (crc16 >>> 8) ^ CRC_TABLE[(crc16 ^ value) & 0xff]
}

export function calculateCrc16(bytes) {
  let crc16 = 0
  for (let i = 0; i < bytes.length; i += 1) crc16 = queryCrc16(crc16, bytes[i])
  return crc16 & 0xffff
}

export function buildPacket(dataBytes, flag = FLAG_WRITE) {
  const data = dataBytes instanceof Uint8Array ? dataBytes : new Uint8Array(dataBytes || [])
  const crc = calculateCrc16(data)
  const out = new Uint8Array(6 + data.length)
  out[0] = HEADER
  out[1] = flag
  out[2] = (data.length >> 8) & 0xff
  out[3] = data.length & 0xff
  out[4] = (crc >> 8) & 0xff
  out[5] = crc & 0xff
  out.set(data, 6)
  return out.buffer
}

export function parsePacket(buffer) {
  const bytes = new Uint8Array(buffer)
  if (bytes.length < 6 || bytes[0] !== HEADER) return null
  const len = (bytes[2] << 8) | bytes[3]
  if (bytes.length < 6 + len) return null
  const crc = (bytes[4] << 8) | bytes[5]
  const data = bytes.slice(6, 6 + len)
  return { flag: bytes[1], len, crc, data, crcOk: calculateCrc16(data) === crc }
}

export function parseCmdData(dataBytes) {
  if (!dataBytes || dataBytes.length < 3) return null
  return {
    cmd: dataBytes[0],
    key: dataBytes[1],
    cmdKey: (dataBytes[0] << 8) | dataBytes[1],
    keyFlag: dataBytes[2],
    value: dataBytes.slice(3)
  }
}

export function cmdData(cmd, key, keyFlag, value = []) {
  const arr = new Uint8Array(3 + value.length)
  arr[0] = cmd
  arr[1] = key
  arr[2] = keyFlag
  arr.set(value instanceof Uint8Array ? value : new Uint8Array(value), 3)
  return arr
}

export function command(cmd, key, keyFlag = KEY_FLAG.write, value = []) {
  return buildPacket(cmdData(cmd, key, keyFlag, value))
}

function float32BE(value) {
  const buffer = new ArrayBuffer(4)
  new DataView(buffer).setFloat32(0, Number(value) || 0, false)
  return Array.from(new Uint8Array(buffer))
}

function utf8Bytes(text) {
  const value = String(text || '')
  if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(value))
  const encoded = unescape(encodeURIComponent(value))
  const out = []
  for (let i = 0; i < encoded.length; i += 1) out.push(encoded.charCodeAt(i))
  return out
}

export function signedByte(value) { return value & 0xff }
export function u16le(value) { return [value & 0xff, (value >> 8) & 0xff] }
export function u16be(value) { return [(value >> 8) & 0xff, value & 0xff] }
export function u32le(value) { return [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff] }
export function u32be(value) { return [(value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff] }

export function readU16BE(bytes, offset) { return ((bytes[offset] || 0) << 8) | (bytes[offset + 1] || 0) }
export function readU16LE(bytes, offset) { return (bytes[offset] || 0) | ((bytes[offset + 1] || 0) << 8) }
export function readU24BE(bytes, offset) { return ((bytes[offset] || 0) << 16) | ((bytes[offset + 1] || 0) << 8) | (bytes[offset + 2] || 0) }
export function readU32BE(bytes, offset) { return (((bytes[offset] || 0) << 24) >>> 0) + ((bytes[offset + 1] || 0) << 16) + ((bytes[offset + 2] || 0) << 8) + (bytes[offset + 3] || 0) }
export function readI16LE(bytes, offset) {
  const value = readU16LE(bytes, offset)
  return value & 0x8000 ? value - 0x10000 : value
}

export const TEST_TYPES = {
  hr: 0x0503,
  bloodPressure: 0x0504,
  bo: 0x0509,
  hrv: 0x050a,
  stress: 0x050d,
  bloodSugar: 0x0510,
  customAll: 0x05ff
}

export const HISTORY_TYPES = {
  todayStep: 0x1a,
  today_step: 0x1a,
  step: 0x02,
  sleep: 0x05,
  hr: 0x03,
  bo: 0x09,
  stress: 0x0d,
  hrv: 0x0a,
  bloodSugar: 0x10,
  bloodPressure: 0x04
}

export const REALTIME_RESULT_KEYS = {
  0x0224: 'hr',
  0x0231: 'bloodPressure',
  0x024e: 'bo',
  0x024f: 'stress',
  0x0269: 'hrv',
  0x026c: 'bloodSugar'
}

export const TIMED_MONITOR_KEYS = {
  hr: 0x16,
  bo: 0x25,
  hrv: 0x6a,
  stress: 0x6b,
  bloodSugar: 0x6e,
  bloodPressure: 0x7c
}

export function commandLogin() { return command(0x03, 0x02, KEY_FLAG.add) }
export function commandFindDevice(enable = true) { return command(0x02, 0x34, KEY_FLAG.write, [enable ? 1 : 0]) }
export function commandSetTimezone(tzQuarterHours) { return command(0x02, 0x02, KEY_FLAG.write, [signedByte(tzQuarterHours)]) }
export function commandSetTime(date = new Date()) {
  return command(0x02, 0x01, KEY_FLAG.write, [date.getFullYear() - 2000, date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()])
}
export function commandGetFirmware() { return command(0x02, 0x04, KEY_FLAG.read) }
export function commandGetPower() { return command(0x02, 0x03, KEY_FLAG.read) }
export function commandGetMac() { return command(0x02, 0x05, KEY_FLAG.read) }
export function commandGetRestingHealth() { return command(0x02, 0x81, KEY_FLAG.read) }
export function commandSetUserInfo({ measureUnit = 0, gender = 1, age = 20, height = 170, weight = 60 } = {}) {
  return command(0x02, 0x06, KEY_FLAG.write, [measureUnit, gender, age, ...float32BE(height), ...float32BE(weight)])
}
export function commandTimedMonitor(type, enabled, duration = 60, read = false) {
  const key = TIMED_MONITOR_KEYS[type]
  if (!key) throw new Error(`unsupported timed monitor: ${type}`)
  if (read) return command(0x02, key, KEY_FLAG.read)
  return command(0x02, key, KEY_FLAG.write, [enabled ? 1 : 0, 0, 0, 23, 59, type === 'hr' ? duration : 60])
}
export function commandSetLedLevel(enabled, level = 3, read = false) {
  return command(0x02, 0x66, read ? KEY_FLAG.read : KEY_FLAG.write, read ? [] : [enabled ? 1 : 0, level])
}
export function commandSetVideoHid(enabled, type = 1, read = false) {
  return command(0x02, 0x64, read ? KEY_FLAG.read : KEY_FLAG.write, read ? [] : [enabled ? type : 0, enabled ? 1 : 0])
}
export function commandSetWearHand(rightHand, read = false) {
  return command(0x02, 0x68, read ? KEY_FLAG.read : KEY_FLAG.write, read ? [] : [rightHand ? 1 : 0])
}
export function commandSetBleName(name) {
  const bytes = utf8Bytes(name).slice(0, 24)
  return command(0x02, 0x65, KEY_FLAG.write, [bytes.length, ...bytes])
}
export function commandStartSingleTest(dataTypeLE, continuous = false) {
  return command(0x06, 0x09, KEY_FLAG.write, [...u16le(dataTypeLE), 1, continuous ? 1 : 0])
}
export function commandStopSingleTest(dataTypeLE) {
  return command(0x06, 0x09, KEY_FLAG.write, [...u16le(dataTypeLE), 0])
}
export function commandControlPhoto(type = 1) { return command(0x06, 0x01, KEY_FLAG.write, [type]) }
export function commandPowerOff(type = 1) { return command(0x02, 0x22, KEY_FLAG.write, [type]) }
export function commandGenericWrite(cmd, key, value = []) { return command(cmd, key, KEY_FLAG.write, value) }
export function commandReadHistory(dataType) { return command(0x05, dataType, KEY_FLAG.read) }
export function commandDeleteHistory(dataType) { return command(0x05, dataType, KEY_FLAG.delete) }
export function commandSensorOutput(sensorType, enabled = true) { return command(0x02, 0xfa, KEY_FLAG.write, [enabled ? 1 : 2, sensorType]) }

export function parseFirmwareValue(value) {
  if (!value || value.length < 9) return null
  const modelBytes = value.slice(8, 16)
  return {
    firmwareVersion: `${value[0]}.${value[1]}.${value[2]}`,
    shape: value[3] === 1 ? 'round' : 'square',
    width: readU16BE(value, 4),
    height: readU16BE(value, 6),
    model: Array.from(modelBytes).filter(Boolean).map((b) => String.fromCharCode(b)).join('')
  }
}

export function protocolTimestamp(secondsFrom2000) {
  return (Number(secondsFrom2000) + 946684800) * 1000
}

function parseSeries(value, size, parser) {
  const out = []
  for (let i = 0; i + size <= value.length; i += size) out.push(parser(value, i))
  return out
}

export function parseHistoryItems(type, value) {
  if (!value || !value.length) return []
  if (type === 'step' || type === 'todayStep' || type === 'today_step') {
    return parseSeries(value, 16, (b, i) => ({ time: protocolTimestamp(readU32BE(b, i)), mode: b[i + 4], steps: readU24BE(b, i + 5), calories: readU32BE(b, i + 8) / 10, distance: readU32BE(b, i + 12) / 10000 }))
  }
  if (type === 'sleep') {
    return parseSeries(value, 7, (b, i) => ({ time: protocolTimestamp(readU32BE(b, i)), status: b[i + 4], reserved1: b[i + 5], reserved2: b[i + 6] }))
  }
  if (type === 'bloodSugar') {
    return parseSeries(value, 6, (b, i) => ({ time: protocolTimestamp(readU32BE(b, i)), value: (readU16BE(b, i + 4) / 10).toFixed(1) }))
  }
  if (type === 'bloodPressure') {
    return parseSeries(value, 6, (b, i) => ({ time: protocolTimestamp(readU32BE(b, i)), systolic: b[i + 4], diastolic: b[i + 5] }))
  }
  return parseSeries(value, 6, (b, i) => ({ time: protocolTimestamp(readU32BE(b, i)), value: b[i + 4] }))
}

export function parseRealtimeValue(cmdKey, value) {
  const type = REALTIME_RESULT_KEYS[cmdKey]
  if (!type || !value || value.length < 6) return null
  if (type === 'bloodSugar') return { type, value: (readU16BE(value, 4) / 10).toFixed(1), time: protocolTimestamp(readU32BE(value, 0)) }
  if (type === 'bloodPressure') return { type, systolic: value[4], diastolic: value[5], time: protocolTimestamp(readU32BE(value, 0)) }
  return { type, value: value[4], time: protocolTimestamp(readU32BE(value, 0)) }
}

export function parseTouchEvent(value) {
  if (!value || value.length < 2) return null
  return { buttonType: value[0], touchType: value[1] }
}

export function parseRestingHealth(value) {
  if (!value || value.length < 3) return null
  return { restingHr: value[0], restingHrv: value[1], restingBo: value[2] }
}

export function parseMac(value) {
  if (!value || value.length < 6) return ''
  return Array.from(value.slice(0, 6)).reverse().map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(':')
}

export function parseSensorPacket(cmdDataValue) {
  const value = cmdDataValue || []
  if (value.length < 1) return null
  const sensorType = value[0]
  if (sensorType === 1) {
    const acc = []
    for (let i = 1; i + 5 < value.length; i += 6) acc.push({ x: readI16LE(value, i), y: readI16LE(value, i + 2), z: readI16LE(value, i + 4) })
    return { sensorType, acc }
  }
  const dataType = value[1]
  const payload = value.slice(2)
  if (dataType === 0 && payload.length >= 4) return { sensorType, dataType, timestamp: readU32BE(payload, 0) }
  const samples = []
  for (let i = 0; i + 3 < payload.length; i += 4) samples.push(readU32BE(payload, i))
  return { sensorType, dataType, samples }
}

export function otaFileCrc(bytes) {
  let crc = 0
  for (let i = 0; i < bytes.length; i += 1) crc = (crc + bytes[i]) & 0xffff
  return crc
}

export const OTA = {
  init(fileLength) { return new Uint8Array([0x27, ...u32le(fileLength)]).buffer },
  create(offset, size) { return new Uint8Array([0x25, ...u32le(offset), ...u32le(size)]).buffer },
  upgrade(fileLength, crc) { return new Uint8Array([0x18, ...u32le(fileLength), ...u16le(crc)]).buffer },
  reset() { return new Uint8Array([0x22, 0x00]).buffer }
}
