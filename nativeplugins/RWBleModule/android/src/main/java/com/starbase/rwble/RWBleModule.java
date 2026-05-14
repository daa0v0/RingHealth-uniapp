package com.starbase.rwble;

import android.app.Activity;
import android.util.Log;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.example.blesdk.DHBleSdk;
import com.example.blesdk.bean.function.AlarmRemainderBean;
import com.example.blesdk.bean.function.BrightScreenBean;
import com.example.blesdk.bean.function.BrightScreenLedBean;
import com.example.blesdk.bean.function.BrightScreenTimeBean;
import com.example.blesdk.bean.function.FirmVersionBean;
import com.example.blesdk.bean.function.MsgPushBean;
import com.example.blesdk.bean.function.PersonBean;
import com.example.blesdk.bean.function.PowerBean;
import com.example.blesdk.bean.function.SupportMenuBean;
import com.example.blesdk.bean.function.VideoHidBean;
import com.example.blesdk.ble.ScanBleService;
import com.example.blesdk.ble.bean.BleDevice;
import com.example.blesdk.blering.RingBleError;
import com.example.blesdk.blering.RingConnectBleCallback;
import com.example.blesdk.callback.HealthDataSyncCallback;
import com.example.blesdk.callback.data.AlarmCallback;
import com.example.blesdk.callback.data.BrightCallback;
import com.example.blesdk.callback.data.BrightLedLevelCallback;
import com.example.blesdk.callback.data.BrightTimeCallback;
import com.example.blesdk.callback.data.FirmwareCallback;
import com.example.blesdk.callback.data.PowerCallback;
import com.example.blesdk.callback.data.VideoHidCallback;
import com.example.blesdk.callback.scan.ScanDeviceCallback;
import com.example.blesdk.callback.status.CommonStatusCallback;
import com.example.blesdk.callback.status.HealthDataControlCallback;
import com.example.blesdk.callback.status.FindDeviceControlCallback;
import com.example.blesdk.bean.sync.BloodOxySyncBean;
import com.example.blesdk.bean.sync.BloodPressSyncBean;
import com.example.blesdk.bean.sync.BloodSugarSyncBean;
import com.example.blesdk.bean.sync.BodyTempSyncBean;
import com.example.blesdk.bean.sync.BreatheSyncBean;
import com.example.blesdk.bean.sync.HeartRateSyncBean;
import com.example.blesdk.bean.sync.HrvSyncBean;
import com.example.blesdk.bean.sync.MuslimCountSyncBean;
import com.example.blesdk.bean.sync.PressureSyncBean;
import com.example.blesdk.bean.sync.SleepSyncBean;
import com.example.blesdk.bean.sync.StepSyncBean;
import com.example.blesdk.service.PXIOtaService;
import com.example.blesdk.utils.CmdConstants;
import com.example.blesdk.utils.Constants;

import java.util.ArrayList;
import java.util.List;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.bridge.UniJSCallback;
import io.dcloud.feature.uniapp.common.UniModule;

public class RWBleModule extends UniModule implements ScanDeviceCallback, RingConnectBleCallback, HealthDataSyncCallback {

    private static final String TAG = "RWBleModule";
    private UniJSCallback eventCallback;
    private final List<BleDevice> scannedDevices = new ArrayList<>();

    @UniJSMethod(uiThread = true)
    public void init(JSONObject options, UniJSCallback callback) {
        Activity activity = mUniSDKInstance.getContext();
        try {
            DHBleSdk.initSDK(activity);
            DHBleSdk.setConnectBleCallback(this);
            ScanBleService.getService().initBle(activity);
            callback.invoke(success("init", "SDK 初始化成功"));
            emit("log", success("init", "DHBleSdk.initSDK 完成"));
        } catch (Throwable error) {
            callback.invoke(error("init_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void registerEvent(JSONObject options, UniJSCallback callback) {
        this.eventCallback = callback;
        emit("log", success("registerEvent", "事件监听已注册"));
    }

    @UniJSMethod(uiThread = true)
    public void startScan(JSONObject options, UniJSCallback callback) {
        try {
            scannedDevices.clear();
            ScanBleService.getService().registerScanBleCallback(this);
            ScanBleService.getService().startScan(true, null);
            callback.invoke(success("startScan", "开始扫描"));
        } catch (Throwable error) {
            callback.invoke(error("start_scan_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void stopScan(JSONObject options, UniJSCallback callback) {
        try {
            ScanBleService.getService().stopScan();
            ScanBleService.getService().unRegisterScanBleCallback();
            callback.invoke(success("stopScan", "停止扫描"));
        } catch (Throwable error) {
            callback.invoke(error("stop_scan_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void connect(JSONObject options, UniJSCallback callback) {
        try {
            String mac = options.getString("bleMac");
            BleDevice device = findDevice(mac);
            if (device == null) {
                callback.invoke(error("device_not_found", "未找到指定设备: " + mac));
                return;
            }
            DHBleSdk.setConnectBleCallback(this);
            DHBleSdk.connectDeviceWithModel(device);
            callback.invoke(success("connect", "连接指令已发送"));
        } catch (Throwable error) {
            callback.invoke(error("connect_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void disconnect(JSONObject options, UniJSCallback callback) {
        try {
            DHBleSdk.disconnect();
            callback.invoke(success("disconnect", "断开指令已发送"));
        } catch (Throwable error) {
            callback.invoke(error("disconnect_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void getSDKVersion(JSONObject options, UniJSCallback callback) {
        try {
            JSONObject data = success("getSDKVersion", "success");
            data.put("sdkVersion", DHBleSdk.getSDKVersion());
            callback.invoke(data);
        } catch (Throwable error) {
            callback.invoke(error("get_sdk_version_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void setUserInfo(JSONObject options, UniJSCallback callback) {
        try {
            PersonBean bean = new PersonBean();
            bean.measureUnit = options.getIntValue("measureUnit");
            bean.gender = options.getIntValue("gender");
            bean.height = options.getFloatValue("height");
            bean.weight = options.getFloatValue("weight");
            bean.age = options.getIntValue("age");
            DHBleSdk.subscribeStatus(new CommonStatusCallback() {
                @Override
                public void onSuccess(int id) {
                    callback.invoke(success("setUserInfo", "设置成功"));
                }

                @Override
                public void onFail(int id, int errorCode) {
                    callback.invoke(error("set_user_info_failed", "errorCode=" + errorCode));
                }
            });
            DHBleSdk.setUserInfo(bean);
        } catch (Throwable error) {
            callback.invoke(error("set_user_info_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void getPower(JSONObject options, UniJSCallback callback) {
        try {
            PowerCallback powerCallback = new PowerCallback() {
                @Override
                public void onSuccess() {}

                @Override
                public void onFail(int errorCode) {
                    callback.invoke(error("get_power_failed", "errorCode=" + errorCode));
                }

                @Override
                public void onResult(PowerBean data) {
                    JSONObject result = success("getPower", "success");
                    result.put("power", data == null ? null : data.power);
                    callback.invoke(result);
                    DHBleSdk.dispose(this);
                }
            };
            DHBleSdk.subscribeData(powerCallback);
            DHBleSdk.getPowerJL();
        } catch (Throwable error) {
            callback.invoke(error("get_power_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void getFirmware(JSONObject options, UniJSCallback callback) {
        try {
            FirmwareCallback firmwareCallback = new FirmwareCallback() {
                @Override
                public void onSuccess() {}

                @Override
                public void onFail(int errorCode) {
                    callback.invoke(error("get_firmware_failed", "errorCode=" + errorCode));
                }

                @Override
                public void onResult(FirmVersionBean data) {
                    JSONObject result = success("getFirmware", "success");
                    result.put("firmware", toJson(data));
                    callback.invoke(result);
                    DHBleSdk.dispose(this);
                }
            };
            DHBleSdk.subscribeData(firmwareCallback);
            DHBleSdk.getFirmwareVersionJL();
        } catch (Throwable error) {
            callback.invoke(error("get_firmware_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void findDevice(JSONObject options, UniJSCallback callback) {
        try {
            DHBleSdk.subscribeData(new FindDeviceControlCallback() {
                @Override
                public void onSuccess() {
                    emit("findDevice", success("findDevice", "success"));
                }

                @Override
                public void onFail(int errorCode) {
                    emit("findDevice", error("find_device_failed", "errorCode=" + errorCode));
                }

                @Override
                public void onResult(Integer data) {}
            });
            DHBleSdk.controlFindDeviceJL();
            callback.invoke(success("findDevice", "查找指令已发送"));
        } catch (Throwable error) {
            callback.invoke(error("find_device_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void setTimeFormat(JSONObject options, UniJSCallback callback) {
        try {
            int format = options.getIntValue("format");
            DHBleSdk.subscribeStatus(new CommonStatusCallback() {
                @Override
                public void onSuccess(int id) {
                    callback.invoke(success("setTimeFormat", "success"));
                }

                @Override
                public void onFail(int id, int errorCode) {
                    callback.invoke(error("set_time_format_failed", "errorCode=" + errorCode));
                }
            });
            DHBleSdk.ringSetTimeformat(format == 24 ? 0 : 1);
        } catch (Throwable error) {
            callback.invoke(error("set_time_format_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void setVideoHid(JSONObject options, UniJSCallback callback) {
        try {
            VideoHidBean bean = new VideoHidBean();
            bean.hidOpen = options.getBooleanValue("enabled") ? 1 : 0;
            VideoHidCallback dataCallback = new VideoHidCallback() {
                @Override
                public void onSuccess() {
                    callback.invoke(success("setVideoHid", "success"));
                }

                @Override
                public void onFail(int errorCode) {
                    callback.invoke(error("set_video_hid_failed", "errorCode=" + errorCode));
                }

                @Override
                public void onResult(VideoHidBean data) {}
            };
            DHBleSdk.subscribeData(dataCallback);
            DHBleSdk.setVideoHidJL(bean);
        } catch (Throwable error) {
            callback.invoke(error("set_video_hid_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void setLedLevel(JSONObject options, UniJSCallback callback) {
        try {
            BrightScreenLedBean bean = new BrightScreenLedBean();
            bean.isOpen = options.getBooleanValue("enabled");
            bean.lcdLevel = options.getIntValue("level");
            BrightLedLevelCallback dataCallback = new BrightLedLevelCallback() {
                @Override
                public void onSuccess() {
                    callback.invoke(success("setLedLevel", "success"));
                }

                @Override
                public void onFail(int errorCode) {
                    callback.invoke(error("set_led_level_failed", "errorCode=" + errorCode));
                }

                @Override
                public void onResult(BrightScreenLedBean data) {}
            };
            DHBleSdk.subscribeData(dataCallback);
            DHBleSdk.setRingLedLevel(bean);
        } catch (Throwable error) {
            callback.invoke(error("set_led_level_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void setWearHand(JSONObject options, UniJSCallback callback) {
        try {
            boolean rightHand = options.getBooleanValue("rightHand");
            DHBleSdk.setRingWearHand(rightHand);
            callback.invoke(success("setWearHand", "success"));
        } catch (Throwable error) {
            callback.invoke(error("set_wear_hand_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void controlTakePhoto(JSONObject options, UniJSCallback callback) {
        try {
            int open = options.getBooleanValue("enabled") ? 1 : 0;
            DHBleSdk.controlTakePhotoJL(open);
            callback.invoke(success("controlTakePhoto", "success"));
        } catch (Throwable error) {
            callback.invoke(error("control_take_photo_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void setScreenTime(JSONObject options, UniJSCallback callback) {
        try {
            BrightScreenTimeBean bean = new BrightScreenTimeBean();
            bean.timeSecond = options.getIntValue("seconds");
            BrightTimeCallback dataCallback = new BrightTimeCallback() {
                @Override
                public void onSuccess() {
                    callback.invoke(success("setScreenTime", "success"));
                }

                @Override
                public void onFail(int errorCode) {
                    callback.invoke(error("set_screen_time_failed", "errorCode=" + errorCode));
                }

                @Override
                public void onResult(BrightScreenTimeBean data) {}
            };
            DHBleSdk.subscribeData(dataCallback);
            DHBleSdk.setBrightScreenTimeJL(bean);
        } catch (Throwable error) {
            callback.invoke(error("set_screen_time_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void setRaiseScreen(JSONObject options, UniJSCallback callback) {
        try {
            BrightScreenBean bean = new BrightScreenBean();
            bean.isOpen = options.getBooleanValue("enabled");
            bean.startHour = options.getIntValue("startHour");
            bean.startMin = options.getIntValue("startMin");
            bean.endHour = options.getIntValue("endHour");
            bean.endMin = options.getIntValue("endMin");
            BrightCallback dataCallback = new BrightCallback() {
                @Override
                public void onSuccess() {
                    callback.invoke(success("setRaiseScreen", "success"));
                }

                @Override
                public void onFail(int errorCode) {
                    callback.invoke(error("set_raise_screen_failed", "errorCode=" + errorCode));
                }

                @Override
                public void onResult(BrightScreenBean data) {}
            };
            DHBleSdk.subscribeData(dataCallback);
            DHBleSdk.setRaiseBrightScreenJL(bean);
        } catch (Throwable error) {
            callback.invoke(error("set_raise_screen_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void setScreenSleep(JSONObject options, UniJSCallback callback) {
        try {
            BrightScreenTimeBean bean = new BrightScreenTimeBean();
            bean.isOpen = options.getBooleanValue("enabled");
            bean.startHour = options.getIntValue("startHour");
            bean.startMin = options.getIntValue("startMin");
            bean.endHour = options.getIntValue("endHour");
            bean.endMin = options.getIntValue("endMin");
            BrightTimeCallback dataCallback = new BrightTimeCallback() {
                @Override
                public void onSuccess() {
                    callback.invoke(success("setScreenSleep", "success"));
                }

                @Override
                public void onFail(int errorCode) {
                    callback.invoke(error("set_screen_sleep_failed", "errorCode=" + errorCode));
                }

                @Override
                public void onResult(BrightScreenTimeBean data) {}
            };
            DHBleSdk.subscribeData(dataCallback);
            DHBleSdk.setRingBrightScreenSleepTime(bean);
        } catch (Throwable error) {
            callback.invoke(error("set_screen_sleep_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void setVibration(JSONObject options, UniJSCallback callback) {
        try {
            DHBleSdk.setVibrationCountJL(options.getIntValue("level"), options.getIntValue("count"));
            callback.invoke(success("setVibration", "success"));
        } catch (Throwable error) {
            callback.invoke(error("set_vibration_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void pushMessage(JSONObject options, UniJSCallback callback) {
        try {
            MsgPushBean bean = new MsgPushBean();
            bean.appId = options.getString("appId");
            bean.title = options.getString("title");
            bean.content = options.getString("content");
            DHBleSdk.setPushMsgJL(bean);
            callback.invoke(success("pushMessage", "success"));
        } catch (Throwable error) {
            callback.invoke(error("push_message_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void setMuslimReminder(JSONObject options, UniJSCallback callback) {
        try {
            DHBleSdk.deviceRememberSwitch(options.getBooleanValue("enabled") ? 1 : 0);
            callback.invoke(success("setMuslimReminder", "success"));
        } catch (Throwable error) {
            callback.invoke(error("set_muslim_reminder_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void setHrAlarm(JSONObject options, UniJSCallback callback) {
        try {
            DHBleSdk.deviceSetHrAlertCmd(
                options.getBooleanValue("enabled") ? 1 : 0,
                options.getIntValue("value"),
                options.getIntValue("underValue")
            );
            callback.invoke(success("setHrAlarm", "success"));
        } catch (Throwable error) {
            callback.invoke(error("set_hr_alarm_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void setBoAlarm(JSONObject options, UniJSCallback callback) {
        try {
            DHBleSdk.deviceSetBoAlertCmd(
                options.getBooleanValue("enabled") ? 1 : 0,
                options.getIntValue("value")
            );
            callback.invoke(success("setBoAlarm", "success"));
        } catch (Throwable error) {
            callback.invoke(error("set_bo_alarm_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void getAlarms(JSONObject options, UniJSCallback callback) {
        try {
            AlarmCallback alarmCallback = new AlarmCallback() {
                @Override
                public void onSuccess() {}

                @Override
                public void onFail(int errorCode) {
                    callback.invoke(error("get_alarms_failed", "errorCode=" + errorCode));
                }

                @Override
                public void onResult(List<AlarmRemainderBean> data) {
                    JSONObject result = success("getAlarms", "success");
                    result.put("alarms", JSONArray.parseArray(JSONArray.toJSONString(data)));
                    callback.invoke(result);
                    DHBleSdk.dispose(this);
                }
            };
            DHBleSdk.subscribeData(alarmCallback);
            DHBleSdk.getAlarmRemindJL();
        } catch (Throwable error) {
            callback.invoke(error("get_alarms_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void setAlarmList(JSONObject options, UniJSCallback callback) {
        try {
            JSONArray array = options.getJSONArray("alarms");
            List<AlarmRemainderBean> list = new ArrayList<>();
            for (int i = 0; i < array.size(); i++) {
                JSONObject item = array.getJSONObject(i);
                AlarmRemainderBean bean = new AlarmRemainderBean();
                bean.alarmId = item.getIntValue("alarmId");
                bean.startHour = item.getIntValue("startHour");
                bean.startMin = item.getIntValue("startMin");
                bean.isOpen = item.getBooleanValue("isOpen");
                bean.alarmTag = "";
                bean.repeatModel = new int[7];
                list.add(bean);
            }
            DHBleSdk.setAlarmRemindJL(list);
            callback.invoke(success("setAlarmList", "success"));
        } catch (Throwable error) {
            callback.invoke(error("set_alarm_list_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void deleteAllAlarms(JSONObject options, UniJSCallback callback) {
        try {
            DHBleSdk.deleteAllAlarmRemindJL();
            callback.invoke(success("deleteAllAlarms", "success"));
        } catch (Throwable error) {
            callback.invoke(error("delete_all_alarms_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void controlHealth(JSONObject options, UniJSCallback callback) {
        try {
            String type = options.getString("type");
            int status = options.getBooleanValue("enabled") ? 1 : 0;
            byte cmd = mapHealthType(type);
            DHBleSdk.subscribeData(new HealthDataControlCallback() {
                @Override
                public void onSuccess() {
                    emit("healthControl", success("controlHealth", "success"));
                }

                @Override
                public void onResult(Integer data) {
                    JSONObject payload = success("healthControlProgress", "progress");
                    payload.put("type", type);
                    payload.put("value", data);
                    emit("healthControlProgress", payload);
                }

                @Override
                public void onFail(int errorCode) {
                    emit("healthControl", error("control_health_failed", "errorCode=" + errorCode));
                }
            });
            DHBleSdk.controlHealthDataJL(cmd, status);
            callback.invoke(success("controlHealth", "指令已发送"));
        } catch (Throwable error) {
            callback.invoke(error("control_health_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void syncHealthData(JSONObject options, UniJSCallback callback) {
        try {
            String type = options.getString("type");
            if ("all".equals(type)) {
                DHBleSdk.syncAllHealthData(this);
            } else {
                DHBleSdk.syncHealthDataByType(mapSyncType(type), this);
            }
            callback.invoke(success("syncHealthData", "同步指令已发送"));
        } catch (Throwable error) {
            callback.invoke(error("sync_health_data_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void controlSport(JSONObject options, UniJSCallback callback) {
        try {
            String action = options.getString("action");
            int control = "finish".equals(action) ? 3 : 0;
            DHBleSdk.controlSportJL(Constants.BleActivityMode.WALK.value.toByte(), (byte) control);
            callback.invoke(success("controlSport", "success"));
        } catch (Throwable error) {
            callback.invoke(error("control_sport_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void setSportPush(JSONObject options, UniJSCallback callback) {
        try {
            DHBleSdk.setExerciseMore(options.getBooleanValue("enabled") ? 1 : 0);
            callback.invoke(success("setSportPush", "success"));
        } catch (Throwable error) {
            callback.invoke(error("set_sport_push_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void powerOff(JSONObject options, UniJSCallback callback) {
        try {
            String type = options.getString("type");
            if ("recovery".equals(type)) {
                DHBleSdk.setPowerOffJL(Constants.CONTROL_DEVICE_RECOVERY);
            } else {
                DHBleSdk.setPowerOffJL(Constants.CONTROL_DEVICE_POWER_OFF);
            }
            callback.invoke(success("powerOff", "success"));
        } catch (Throwable error) {
            callback.invoke(error("power_off_failed", error));
        }
    }

    @UniJSMethod(uiThread = true)
    public void startOta(JSONObject options, UniJSCallback callback) {
        try {
            PXIOtaService.startPXIFileSyncing(options.getString("path"), null);
            callback.invoke(success("startOta", "OTA 已开始"));
        } catch (Throwable error) {
            callback.invoke(error("start_ota_failed", error));
        }
    }

    @Override
    public void onScanDevice(BleDevice device) {
        scannedDevices.add(device);
        JSONObject payload = success("scanDevice", "success");
        payload.put("device", toDeviceJson(device));
        emit("scanDevice", payload);
    }

    @Override
    public void onScanFinish() {
        emit("scanFinish", success("scanFinish", "扫描结束"));
    }

    @Override
    public void onRingConnecting() {
        emit("connect", success("onRingConnecting", "连接中"));
    }

    @Override
    public void onRingConnected() {
        emit("connect", success("onRingConnected", "连接成功"));
    }

    @Override
    public void onRingConnectFailed(RingBleError reason) {
        emit("connect", error("onRingConnectFailed", reason == null ? "unknown" : reason.toString()));
    }

    @Override
    public void onRingDidFunctionMenu(SupportMenuBean supportMenuBean) {
        JSONObject payload = success("onRingDidFunctionMenu", "功能配置表返回");
        payload.put("support", toJson(supportMenuBean));
        emit("support", payload);
    }

    @Override
    public void onSyncProgress(int progress) {
        JSONObject payload = success("syncProgress", "progress");
        payload.put("progress", progress);
        emit("syncProgress", payload);
    }

    @Override
    public void onSyncFinish() {
        emit("syncFinish", success("syncFinish", "同步完成"));
    }

    @Override
    public void onSyncError(int code) {
        emit("syncError", error("sync_error", "errorCode=" + code));
    }

    @Override
    public void onSyncStep(List<StepSyncBean> data) {
        emitSyncData("step", data);
    }

    @Override
    public void onSyncSleep(List<SleepSyncBean> data) {
        emitSyncData("sleep", data);
    }

    @Override
    public void onSyncHr(List<HeartRateSyncBean> data) {
        emitSyncData("hr", data);
    }

    @Override
    public void onSyncBp(List<BloodPressSyncBean> data) {
        emitSyncData("bp", data);
    }

    @Override
    public void onSyncBo(List<BloodOxySyncBean> data) {
        emitSyncData("bo", data);
    }

    @Override
    public void onSyncTemp(List<BodyTempSyncBean> data) {
        emitSyncData("temp", data);
    }

    @Override
    public void onSyncPressure(List<PressureSyncBean> data) {
        emitSyncData("pressure", data);
    }

    @Override
    public void onSyncBloodSugar(List<BloodSugarSyncBean> data) {
        emitSyncData("bloodSugar", data);
    }

    @Override
    public void onSyncBreath(List<BreatheSyncBean> data) {
        emitSyncData("breath", data);
    }

    @Override
    public void onSyncHrv(List<HrvSyncBean> data) {
        emitSyncData("hrv", data);
    }

    @Override
    public void onSyncMuslimCount(List<MuslimCountSyncBean> data) {
        emitSyncData("muslimCount", data);
    }

    private void emitSyncData(String type, Object data) {
        JSONObject payload = success("syncData", "success");
        payload.put("type", type);
        payload.put("data", JSONArray.parse(JSONArray.toJSONString(data)));
        emit("syncData", payload);
    }

    private void emit(String event, JSONObject payload) {
        if (eventCallback == null) return;
        JSONObject wrapper = new JSONObject();
        wrapper.put("event", event);
        wrapper.put("payload", payload);
        eventCallback.invokeAndKeepAlive(wrapper);
    }

    private BleDevice findDevice(String mac) {
        for (BleDevice device : scannedDevices) {
            if (device != null && mac != null && mac.equalsIgnoreCase(device.bleMac)) return device;
        }
        return null;
    }

    private byte mapHealthType(String type) {
        if ("hr".equals(type)) return CmdConstants.JL_HR_DATA_TRANSFER_KEY;
        if ("bo".equals(type)) return CmdConstants.JL_BO_DATA_TRANSFER_KEY;
        if ("hrv".equals(type)) return CmdConstants.JL_HRV_DATA_TRANSFER_KEY;
        if ("stress".equals(type)) return CmdConstants.JL_PRESSURE_DATA_TRANSFER_KEY;
        if ("bloodSugar".equals(type)) return CmdConstants.JL_BLOODSUGAR_DATA_TRANSFER_KEY;
        return CmdConstants.JL_HR_DATA_TRANSFER_KEY;
    }

    private int mapSyncType(String type) {
        if ("today_step".equals(type)) return Constants.RingHealthType.TODAY_STEP;
        return Constants.RingHealthType.TODAY_STEP;
    }

    private JSONObject toDeviceJson(BleDevice device) {
        JSONObject json = new JSONObject();
        if (device == null) return json;
        json.put("bleName", device.bleName);
        json.put("bleMac", device.bleMac);
        json.put("bleRssi", device.rssi);
        return json;
    }

    private JSONObject success(String action, String message) {
        JSONObject json = new JSONObject();
        json.put("ok", true);
        json.put("action", action);
        json.put("message", message);
        return json;
    }

    private JSONObject error(String code, Throwable throwable) {
        return error(code, throwable == null ? "unknown error" : throwable.getMessage());
    }

    private JSONObject error(String code, String message) {
        JSONObject json = new JSONObject();
        json.put("ok", false);
        json.put("code", code);
        json.put("message", message);
        Log.e(TAG, code + ": " + message);
        return json;
    }

    private JSONObject toJson(Object object) {
        return JSONObject.parseObject(JSONObject.toJSONString(object));
    }
}
