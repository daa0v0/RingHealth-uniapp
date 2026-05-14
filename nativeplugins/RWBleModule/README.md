# RWBleModule

这是给 `uniapp-starbase` 使用的 uni-app Android 原生插件桥接层，用于把 `RW_SDK_Android_RING` 中的 `DHBleSdk` / `ScanBleService` 能力暴露到 JS。

## 当前已桥接的方法

- `init`
- `registerEvent`
- `startScan` / `stopScan`
- `connect` / `disconnect`
- `getSDKVersion`
- `setUserInfo`
- `getPower`
- `getFirmware`
- `findDevice`
- `setTimeFormat`
- `setVideoHid`
- `setLedLevel`
- `setWearHand`
- `controlTakePhoto`
- `setScreenTime`
- `setRaiseScreen`
- `setScreenSleep`
- `setVibration`
- `pushMessage`
- `setMuslimReminder`
- `setHrAlarm`
- `setBoAlarm`
- `getAlarms`
- `setAlarmList`
- `deleteAllAlarms`
- `controlHealth`
- `syncHealthData`
- `controlSport`
- `setSportPush`
- `powerOff`
- `startOta`

## 需要你手动放入的 SDK 文件

请将 SDK 提供的 `.aar` / `.jar` 文件放入：

- `nativeplugins/RWBleModule/android/libs/`

如果 SDK 还依赖其它第三方 aar/jar，也一并放进去。

## 重要说明

1. 当前插件代码是按照 `blesdkandroid_zh.md` 与 `RW_SDK_DEMO/NewMainActivity.kt` 的接口名封装的。
2. 不同 SDK 版本如果方法签名变动，需同步调整 `RWBleModule.java`。
3. `controlSportJL`、`PXIOtaService.startPXIFileSyncing`、部分回调接口在不同 aar 版本中可能存在签名差异，若编译报错，按实际 aar 方法签名微调即可。
4. 真机运行前，请确认 HBuilderX / uni-app 已启用自定义基座或云打包支持本地原生插件。
