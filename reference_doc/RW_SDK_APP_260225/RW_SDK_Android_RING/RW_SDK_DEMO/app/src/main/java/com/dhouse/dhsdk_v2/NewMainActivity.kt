package com.dhouse.dhsdk_v2

import android.content.Intent
import android.os.Bundle
import android.os.Message
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import com.dhouse.dhsdk_v2.databinding.ActivityNewMainBinding
import com.dhouse.dhsdk_v2.ui.ScanActivity
import com.dhouse.dhsdk_v2.ui.Workout.WorkoutTypeActivity
import com.dhouse.dhsdk_v2.ui.bean.EventBusBean
import com.example.blesdk.rwbaselibrary.HandlerCallback
import com.example.blesdk.DHBleSdk
import com.example.blesdk.bean.function.AlarmRemainderBean
import com.example.blesdk.bean.function.BoReminderBean
import com.example.blesdk.bean.function.BrightScreenBean
import com.example.blesdk.bean.function.BrightScreenLedBean
import com.example.blesdk.bean.function.BrightScreenTimeBean
import com.example.blesdk.bean.function.DrinkReminderBean
import com.example.blesdk.bean.function.FactoryInBean
import com.example.blesdk.bean.function.FirmVersionBean
import com.example.blesdk.bean.function.HrBoActualReminderBean
import com.example.blesdk.bean.function.HrReminderBean
import com.example.blesdk.bean.function.MsgPushBean
import com.example.blesdk.bean.function.PersonBean
import com.example.blesdk.bean.function.PowerBean
import com.example.blesdk.bean.function.SupportMenuBean
import com.example.blesdk.bean.function.VideoHidBean
import com.example.blesdk.bean.sync.BloodOxySyncBean
import com.example.blesdk.bean.sync.BloodPressSyncBean
import com.example.blesdk.bean.sync.BloodSugarSyncBean
import com.example.blesdk.bean.sync.BodyTempSyncBean
import com.example.blesdk.bean.sync.BreatheSyncBean
import com.example.blesdk.bean.sync.HealthDataSyncBean
import com.example.blesdk.bean.sync.HeartRateSyncBean
import com.example.blesdk.bean.sync.HrvSyncBean
import com.example.blesdk.bean.sync.MuslimCountSyncBean
import com.example.blesdk.bean.sync.PressureSyncBean
import com.example.blesdk.bean.sync.SleepSyncBean
import com.example.blesdk.bean.sync.StepSyncBean
import com.example.blesdk.ble.bean.BleDevice
import com.example.blesdk.blering.RingBleError
import com.example.blesdk.blering.RingConnectBleCallback
import com.example.blesdk.blering.RingConnectBleService
import com.example.blesdk.callback.HealthDataSyncCallback
import com.example.blesdk.callback.OnFileTransferCallback
import com.example.blesdk.callback.data.*
import com.example.blesdk.callback.status.CommonStatusCallback
import com.example.blesdk.callback.status.FindDeviceControlCallback
import com.example.blesdk.callback.status.HealthDataControlCallback
import com.example.blesdk.rwbaselibrary.WeakHandler
import com.example.blesdk.service.PXIOtaService
import com.example.blesdk.utils.CmdConstants
import com.example.blesdk.utils.Constants
import org.greenrobot.eventbus.EventBus
import java.util.*

class NewMainActivity : AppCompatActivity(), View.OnClickListener, RingConnectBleCallback, HealthDataSyncCallback {

    private var isConnected: Boolean = false

    private val binding by lazy {
        ActivityNewMainBinding.inflate(layoutInflater)
    }


    private val hrBoActualReminderCallback by lazy {
        object : HrBoActualReminderCallback{
            override fun onResult(data: HrBoActualReminderBean) {
                Log.e("RWSDK", "output: HrBoActualReminderCallback data " + data.type + " value " + data.remindValue)
                if (data.type == 0){ // HR Over Value Alarm

                }
                else if (data.type == 1){// SP02 Over Value Alarm

                }
                else if (data.type == 2){// HR Under Value Alarm

                }
            }

            override fun onFail(errorCode: Int) {
                Log.e("RWSDK", "output: HrBoActualReminderCallback errorCode " + errorCode)
            }

            override fun onSuccess() {
                Log.e("RWSDK", "output: HrBoActualReminderCallback onSuccess")
            }

        }
    }

    private val muslimCountSwitchCallback by lazy {
        object : MuslimCountSwitchCallback{

            override fun onResult(data: Int) {
                Log.e("RWSDK", "output: BoReminderCallback data " + data)
            }

            override fun onFail(errorCode: Int) {
                Log.e("RWSDK", "output: BoReminderCallback errorCode " + errorCode)
            }

            override fun onSuccess() {
                Log.e("RWSDK", "output: BoReminderCallback onSuccess")
            }

        }
    }
    private val boReminderCallback by lazy {
        object : BoReminderCallback{
            override fun onResult(data: BoReminderBean) {
                Log.e("RWSDK", "output: BoReminderCallback data " + data.isOpen + " value " + data.remindValue)
            }

            override fun onFail(errorCode: Int) {
                Log.e("RWSDK", "output: BoReminderCallback errorCode " + errorCode)
            }

            override fun onSuccess() {
                Log.e("RWSDK", "output: BoReminderCallback onSuccess")
            }

        }
    }

    private val hrReminderCallback by lazy {
        object : HrReminderCallback{
            override fun onResult(data: HrReminderBean) {
                Log.e("RWSDK", "output: HrReminderCallback data " + data.isOpen + " value " + data.remindValue)
            }

            override fun onFail(errorCode: Int) {
                Log.e("RWSDK", "output: HrReminderCallback errorCode " + errorCode)
            }

            override fun onSuccess() {
                Log.e("RWSDK", "output: HrReminderCallback onSuccess")
            }

        }
    }
    private val raiseBrightTimeCallback by lazy {
        object : BrightCallback{
            override fun onResult(data: BrightScreenBean) {
                Log.e("RWSDK", "output: BrightCallback data " + data.isOpen)
            }

            override fun onFail(errorCode: Int) {
                Log.e("RWSDK", "output: BrightCallback errorCode " + errorCode)
            }

            override fun onSuccess() {
                Log.e("RWSDK", "output: BrightCallback onSuccess")
            }

        }
    }

    private val brightTimeCallback by lazy {
        object : BrightTimeCallback{
            override fun onResult(data: BrightScreenTimeBean) {
                Log.e("RWSDK", "output: BrightTimeCallback data " + data.timeSecond)
            }

            override fun onFail(errorCode: Int) {
                Log.e("RWSDK", "output: BrightTimeCallback errorCode " + errorCode)
            }

            override fun onSuccess() {
                Log.e("RWSDK", "output: BrightTimeCallback onSuccess")
            }

        }
    }

    private val alarmCallback by lazy {
        object : AlarmCallback{
            override fun onResult(data: List<AlarmRemainderBean?>?) {
                Log.e("RWSDK", "output: AlarmCallback data " + data?.size)
            }

            override fun onFail(errorCode: Int) {
                Log.e("RWSDK", "output: AlarmCallback errorCode " + errorCode)
            }

            override fun onSuccess() {
                Log.e("RWSDK", "output: AlarmCallback onSuccess")
            }

        }
    }

    private val findDeviceControlCallback by lazy {
        object : FindDeviceControlCallback {
            override fun onSuccess() {
                Log.e("qob", "output: FindDeviceControlCallback onSuccess")
            }

            override fun onFail(errorCode: Int) {

            }

            override fun onResult(data: Int?) {

            }
        }
    }

    private val hrMonitorCallback by lazy {
        object : TimedHeartRateCallback {
            override fun onResult(p0: DrinkReminderBean?) {
                Log.e("qob", "output: TimedHeartRateCallback Get " + p0?.remindDuration + " isOpen " + p0?.isOpen)
                Toast.makeText(applicationContext,"TimedHeartRateCallback Get " + p0?.remindDuration + " isOpen " + p0?.isOpen,Toast.LENGTH_LONG).show()
            }

            override fun onFail(p0: Int) {

            }

            override fun onSuccess() {
                Log.e("qob", "output: TimedHeartRateCallback Setting OK ")
            }
        }
    }

    private val timedBloodOxygenCallback by lazy {
        object : TimedBloodOxygenCallback {
            override fun onResult(p0: DrinkReminderBean?) {
                Log.e("qob", "output: TimedBloodOxygenCallback Get " + p0?.remindDuration + " isOpen " + p0?.isOpen)
                Toast.makeText(applicationContext,"TimedBloodOxygenCallback Get " + p0?.remindDuration + " isOpen " + p0?.isOpen,Toast.LENGTH_LONG).show()

            }

            override fun onFail(p0: Int) {

            }

            override fun onSuccess() {
                Log.e("qob", "output: TimedBloodOxygenCallback Setting OK ")
            }
        }
    }

    private val hrvDataCallback by lazy {
        object : TimedHrvCallback {
            override fun onResult(data: DrinkReminderBean?) {
                Log.e("qob", "output: TimedHrvCallback Get " + data?.remindDuration + " isOpen " + data?.isOpen)
            }

            override fun onFail(errorCode: Int) {

            }

            override fun onSuccess() {
                Log.e("qob", "output: TimedHrvCallback Setting OK ")
            }
        }
    }

    private val stressDataCallback by lazy {
        object : TimedStressCallback {
            override fun onResult(data: DrinkReminderBean?) {
                Log.e("qob", "output: TimedStressCallback Get " + data?.remindDuration + " isOpen " + data?.isOpen)
            }

            override fun onFail(errorCode: Int) {

            }

            override fun onSuccess() {
                Log.e("qob", "output: TimedStressCallback Setting OK ")
            }
        }
    }

    private val bloodSugarDataCallback by lazy {
        object : TimedBloodSugarCallback {
            override fun onResult(data: DrinkReminderBean?) {
                Log.e("qob", "output: TimedBloodSugarCallback Get " + data?.remindDuration + " isOpen " + data?.isOpen)
            }

            override fun onFail(errorCode: Int) {

            }

            override fun onSuccess() {
                Log.e("qob", "output: TimedBloodSugarCallback Setting OK ")
            }
        }
    }

    private val videoHidCallback by lazy {
        object : VideoHidCallback {
            override fun onResult(data: VideoHidBean?) {
                Log.e("qob", "output: VideoHidCallback Get " + data)
            }

            override fun onFail(errorCode: Int) {

            }

            override fun onSuccess() {
                Log.e("qob", "output: VideoHidCallback Setting OK ")
            }
        }
    }

    private val brightLedLevelCallback by lazy {
        object : BrightLedLevelCallback {
            override fun onResult(data: BrightScreenLedBean?) {
                Log.e("qob", "output: BrightLedLevelCallback Get " + data)
            }

            override fun onFail(errorCode: Int) {

            }

            override fun onSuccess() {
                Log.e("qob", "output: BrightLedLevelCallback Setting OK ")
            }
        }
    }

    private val ringWearHandCallback by lazy {
        object : WearHandCallback {
            override fun onSuccess() {
                Log.e("qob", "output: WearHandCallback Setting OK ")
                DHBleSdk.dispose(this)
            }
            override fun onResult(data: FactoryInBean?) {
                Log.e("qob", "output: WearHandCallback Get " + data)
                DHBleSdk.dispose(this)
            }
            override fun onFail(errorCode: Int) {
                DHBleSdk.dispose(this)
            }
        }
    }

    private val healthDataBroCallback by lazy {
        object : HealthDataBroCallback{
            override fun onResult(data: HealthDataSyncBean?) {
                data?.let {
                    when (it.dataType) {
                        Constants.RingHealthType.HR -> { //Heart Rate
                            Log.e("qob", "Output: hr Value " + it.hrPartData.last().hr)
                        }
                        Constants.RingHealthType.HRV -> {//HRV
                            Log.e("qob", "Output: HRV Value " + it.hrPartData.last().hr)
                        }
                        Constants.RingHealthType.BLOOD_OXY -> {//Blood Oxygen(血氧)
                            Log.e("qob", "Output: Blood Oxygen Value " + it.boPartData.last().bo)
                        }
                        Constants.RingHealthType.PRESSURE -> {//压力 Stress
                            Log.e("qob", "Output: Stress Value " + it.pressurePartData.last().pressure)
                        }
                        Constants.RingHealthType.BLOOD_SUGAR -> {//血糖 BloodSugar
                            Log.e("qob", "Output: BloodSugar Value " + it.tempPartData.last().temp)
                        }
                        Constants.RingHealthType.MUSLIM_COUNT -> { //Msulim Count 赞念
                            Log.e("qob", "赞念 Value " + it.muslimCountPartData.count)
                        }
                        else -> {

                        }
                    }
                }
            }
            override fun onFail(errorCode: Int) {

            }

            override fun onSuccess() {

            }

        }
    }

    private val testHrCallback by lazy {
        object : HealthDataControlCallback {
            override fun onSuccess() {
                Log.e("qob", "Output: HealthDataControlCallback Control onSuccess")
            }

            override fun onResult(data: Int?) {
                Log.e("qob", "Output: HealthDataControlCallback onResult " + data)
                data?.let {
                    if (data >= 10){
                        Log.e("qob", "Output: Measurement completed (测量完成)")
                    }
                }
            }

            override fun onFail(errorCode: Int) {

            }
        }
    }

    /**
     * Camera control monitoring 拍照控制监听
     */
    private val takePhotoCallback by lazy {
        object : TakePhotoCallback {
            override fun onSuccess() {
                Log.e("qob", "Output: TakePhotoCallback onSuccess")
            }

            override fun onFail(errorCode: Int) {

            }

            override fun onResult(data: Int?) {
                Log.e("qob", "Output: TakePhotoCallback onResult " + data)
                data.let {
                    when (it){
                        2 -> {
                            //TODO Start the phone's custom camera to take photos 启动手机自定义相机拍照
                        }
                    }
                }
            }
        }
    }

    /**
     * 文件传输进度监听
     */
    private val dialTransferCallback by lazy {
        object : OnFileTransferCallback {
            override fun onProgress(pro: Float) {
                //onInstallProgress(pro * 100)
            }

            override fun onFinish() {
                //   onInstallSuccess()
            }

            override fun onFail(code: Int) {
                // onInstallFail(code)
            }
        }
    }


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(binding.root)
        DHBleSdk.initSDK(this)

        //    EventBus.getDefault().register(this)
        val toolbar:Toolbar = findViewById(R.id.toolbar)
        setSupportActionBar(toolbar)


        if (!isConnected){
            XXApplication.instance.isEnterScanUIPage = true
            startActivity(Intent(this, ScanActivity::class.java))
        }

        binding.disconnect.setOnClickListener(this)
        //Setting
        binding.btSettingTime.setOnClickListener(this)
        binding.btGetPower.setOnClickListener(this)
        binding.btGetFirmwareinfo.setOnClickListener(this)
        binding.btFindDevice.setOnClickListener(this)
        binding.btGetHrmonitor.setOnClickListener(this)
        binding.btSetHrmonitor.setOnClickListener(this)
        binding.btGetBomonitor.setOnClickListener(this)
        binding.btSetBomonitor.setOnClickListener(this)
        binding.btGetHrvmonitor.setOnClickListener(this)
        binding.btSetHrvmonitor.setOnClickListener(this)
        binding.btGetVideoswitch.setOnClickListener(this)
        binding.btSetVideoswitch.setOnClickListener(this)
        binding.btGetLedlevel.setOnClickListener(this)
        binding.btSetLedlevel.setOnClickListener(this)
        binding.btGetWearposition.setOnClickListener(this)
        binding.btSetWearposition.setOnClickListener(this)
        binding.btGetStressmonitor.setOnClickListener(this)
        binding.btSetStressmonitor.setOnClickListener(this)
        binding.btGetBsmonitor.setOnClickListener(this)
        binding.btSetBsmonitor.setOnClickListener(this)
        binding.btGetVibration.setOnClickListener(this)
        binding.btSetVibration.setOnClickListener(this)
        binding.btSetAlarm.setOnClickListener(this)
        binding.btGetAlarm.setOnClickListener(this)
        binding.btDelAlarm.setOnClickListener(this)
        binding.btGetScreenSleepmode.setOnClickListener(this)
        binding.btSetScreenSleepmode.setOnClickListener(this)
        binding.btGetScreenOntime.setOnClickListener(this)
        binding.btSetScreenOntime.setOnClickListener(this)
        binding.btGetRaiseScreen.setOnClickListener(this)
        binding.btSetRaiseScreen.setOnClickListener(this)
        binding.btGetHrAlarm.setOnClickListener(this)
        binding.btSetHrAlarm.setOnClickListener(this)
        binding.btSetBoAlarm.setOnClickListener(this)
        binding.btGetBoAlarm.setOnClickListener(this)
        binding.btGetMuslimcountSwitch.setOnClickListener(this)
        binding.btSetMuslimcountSwitch.setOnClickListener(this)
        binding.btSetTimeformat.setOnClickListener(this)



        binding.btControlOpenHr.setOnClickListener(this)
        binding.btControlCloseHr.setOnClickListener(this)
        binding.btControlOpenBo.setOnClickListener(this)
        binding.btControlCloseBo.setOnClickListener(this)
        binding.btControlOpenHrv.setOnClickListener(this)
        binding.btControlCloseHrv.setOnClickListener(this)
        binding.btOpenControlTakephoto.setOnClickListener(this)
        binding.btCloseControlTakephoto.setOnClickListener(this)
        binding.btControlFinddevice.setOnClickListener(this)
        binding.btControlShutdown.setOnClickListener(this)
        binding.btControlOpenStress.setOnClickListener(this)
        binding.btControlCloseStress.setOnClickListener(this)
        binding.btControlOpenBs.setOnClickListener(this)
        binding.btControlCloseBs.setOnClickListener(this)

        binding.btDataGethealth.setOnClickListener(this)
        binding.btDataGethealthOnlyOne.setOnClickListener(this)

        binding.btSportWorkout.setOnClickListener(this)

        binding.btUpdateOta.setOnClickListener(this)


        DHBleSdk.setConnectBleCallback(this)
    }
    

    override fun onResume() {
        super.onResume()
        XXApplication.instance.isEnterOta = false

        Log.e("RWSDK", "onResume")

        DHBleSdk.setConnectBleCallback(this)

        device = XXApplication.instance.currentConnectDevcie

        this.device?.let { ble ->
            isConnected = DHBleSdk.isBleConnected()
            binding.bleName.text = "Device Bluetooth Name: " + ble.bleName
            binding.bleMac.text = "MAC: " + ble.bleMac
            binding.bleStatus.apply {
                if (isConnected) {
                    text = "Connected"
                }
                else{
                    text = "Disconnected"
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()

    }


    override fun onClick(v: View?) {
        when(v?.id){
            R.id.disconnect -> {
              //  binding.progressBar.visibility = View.VISIBLE

                DHBleSdk.disconnect()
                binding.progressBar.visibility = View.GONE

                if (!XXApplication.instance.isEnterScanUIPage) {
                    XXApplication.instance.isEnterScanUIPage = true
                    startActivity(Intent(this@NewMainActivity, ScanActivity::class.java))
                }

            }
            R.id.clear -> {

            }
            R.id.bt_setting_time -> {
                Log.e("RWSDK", DHBleSdk.getSDKVersion())
            }
            R.id.bt_get_power -> {
                DHBleSdk.subscribeData(object : PowerCallback {
                    override fun onSuccess() {

                    }

                    override fun onFail(errorCode: Int) {
                        Log.e("qob", "output: ERROR CODE " + errorCode)
                    }

                    override fun onResult(data: PowerBean?) {
                        data?.let {
                            Log.e("qob", "output: Battery " + data.power)
                        }
                    }
                })
                DHBleSdk.getPowerJL()
            }
            R.id.bt_get_firmwareinfo -> {
                DHBleSdk.subscribeData(object : FirmwareCallback {
                    override fun onSuccess() {

                    }

                    override fun onFail(errorCode: Int) {
                        Log.e("qob", "output: ERROR CODE " + errorCode)
                    }

                    override fun onResult(data: FirmVersionBean?) {
                        data?.let {
                            Log.e("qob", "output: Firmware Info " + data)
                        }
                    }
                })
                DHBleSdk.getFirmwareVersionJL()
            }

            R.id.bt_find_device -> {
                DHBleSdk.subscribeStatus(object : CommonStatusCallback{
                    override fun onSuccess(id: Int) {
                        Log.e("RWSDK", "user info set ok")
                    }

                    override fun onFail(id: Int, errorCode: Int) {
                        Log.e("RWSDK", "user info set failed")
                    }

                })
                val persionBean = PersonBean()
                persionBean.measureUnit = 0
                persionBean.gender = 1
                persionBean.height = 170.5f
                persionBean.weight = 80f
                persionBean.age = 20
                DHBleSdk.setUserInfo(persionBean)
            }
            R.id.bt_get_hrmonitor -> {
                DHBleSdk.subscribeData(hrMonitorCallback)
                DHBleSdk.getTimedHeartRateJL()
            }
            R.id.bt_set_hrmonitor -> {
                DHBleSdk.subscribeData(hrMonitorCallback)
                val hrMonitorBean = DrinkReminderBean()
                hrMonitorBean.isOpen = true  //Heart rate monitoring switch
                hrMonitorBean.remindDuration = 60 //Heart rate monitoring interval unit is minutes, only 30 minutes and 60 minutes
                hrMonitorBean.startHour = 0 //fixed
                hrMonitorBean.startMin = 0 //fixed
                hrMonitorBean.endHour = 23 //fixed
                hrMonitorBean.endMin = 59  //fixed
                DHBleSdk.setTimedHeartRateJL(hrMonitorBean)
            }
            R.id.bt_get_bomonitor -> {
                Log.e("qob", "output: DHBleSdk.getTimedBloodOxygenJL")
                DHBleSdk.subscribeData(timedBloodOxygenCallback)
                DHBleSdk.getTimedBloodOxygenJL()
            }
            R.id.bt_set_bomonitor -> {
                DHBleSdk.subscribeData(timedBloodOxygenCallback)
                val healthMonitorBean = DrinkReminderBean()
                healthMonitorBean.isOpen = true  //BloodOxygen monitoring switch
                healthMonitorBean.remindDuration = 60 //BloodOxygen monitoring interval unit is minutes, only 30 minutes and 60 minutes
                healthMonitorBean.startHour = 0 //fixed
                healthMonitorBean.startMin = 0 //fixed
                healthMonitorBean.endHour = 23 //fixed
                healthMonitorBean.endMin = 59  //fixed
                DHBleSdk.setTimedBloodOxygenJL(healthMonitorBean)
            }
            R.id.bt_get_hrvmonitor -> {
                val support = XXApplication.instance.currentSupportMenuBean

                DHBleSdk.subscribeData(hrvDataCallback)
                DHBleSdk.getTimedHRVJL()
            }
            R.id.bt_set_hrvmonitor -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isHrv == true) {
                    DHBleSdk.subscribeData(hrvDataCallback)
                    val healthMonitorBean = DrinkReminderBean()
                    healthMonitorBean.isOpen = false  //HRV monitoring switch
                    healthMonitorBean.remindDuration = 60 //HRV monitoring interval unit is minutes, only 30 minutes and 60 minutes
                    healthMonitorBean.startHour = 0 //fixed
                    healthMonitorBean.startMin = 0 //fixed
                    healthMonitorBean.endHour = 23 //fixed
                    healthMonitorBean.endMin = 59  //fixed
                    DHBleSdk.setTimedHRVJL(healthMonitorBean)
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_get_stressmonitor -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isPressure == true) {
                    DHBleSdk.subscribeData(stressDataCallback)
                    DHBleSdk.getTimedStressJL()
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_set_stressmonitor -> {

                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isPressure == true) {
                    DHBleSdk.subscribeData(stressDataCallback)
                    val healthMonitorBean = DrinkReminderBean()
                    healthMonitorBean.isOpen = true  //HRV monitoring switch
                    healthMonitorBean.remindDuration = 60 //HRV monitoring interval unit is minutes, only 30 minutes and 60 minutes
                    healthMonitorBean.startHour = 0 //fixed
                    healthMonitorBean.startMin = 0 //fixed
                    healthMonitorBean.endHour = 23 //fixed
                    healthMonitorBean.endMin = 59  //fixed
                    DHBleSdk.setTimedStressJL(healthMonitorBean)
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }

            }
            R.id.bt_get_bsmonitor -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isBloodSugar == true) {
                    DHBleSdk.subscribeData(bloodSugarDataCallback)
                    DHBleSdk.getTimedBloodSugarJL()
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_set_bsmonitor -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isBloodSugar == true) {
                    DHBleSdk.subscribeData(bloodSugarDataCallback)
                    val healthMonitorBean = DrinkReminderBean()
                    healthMonitorBean.isOpen = true  //HRV monitoring switch
                    healthMonitorBean.remindDuration = 60 //HRV monitoring interval unit is minutes, only 30 minutes and 60 minutes
                    healthMonitorBean.startHour = 0 //fixed
                    healthMonitorBean.startMin = 0 //fixed
                    healthMonitorBean.endHour = 23 //fixed
                    healthMonitorBean.endMin = 59  //fixed
                    DHBleSdk.setTimedBloodSugarJL(healthMonitorBean)
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }

            }
            R.id.bt_get_videoswitch -> {
                DHBleSdk.subscribeData(videoHidCallback)
                DHBleSdk.getVideoHidJL()
            }
            R.id.bt_set_videoswitch -> {
                DHBleSdk.subscribeData(videoHidCallback)
                val videoHidBean = VideoHidBean()
                videoHidBean.hidOpen = 0  //Whether to open short video control
                DHBleSdk.setVideoHidJL(videoHidBean)
            }
            R.id.bt_get_ledlevel -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isLEDLight == true) {
                    DHBleSdk.subscribeData(brightLedLevelCallback)
                    DHBleSdk.getRingLedLevel()
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_set_ledlevel -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isLEDLight == true) {
                    DHBleSdk.subscribeData(brightLedLevelCallback)
                    val tBrightScreenLedBean = BrightScreenLedBean()
                    tBrightScreenLedBean.isOpen = true //false为off,ture为(1-3Level)
                    tBrightScreenLedBean.lcdLevel = 3 //1-3Level: 1 low 2 mid 3 high
                    DHBleSdk.setRingLedLevel(tBrightScreenLedBean)
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_get_wearposition -> {

                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isWearDir == true) {
                    DHBleSdk.subscribeData(ringWearHandCallback)
                    DHBleSdk.getRingWearDir()
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }

            }
            R.id.bt_set_wearposition -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isWearDir == true) {
                    DHBleSdk.subscribeData(ringWearHandCallback)
                    DHBleSdk.setRingWearHand(false) //False is left hand, true is right hand
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_get_vibration -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isSupportMotoVibrationLevel == true) {
                    DHBleSdk.setVibrationCountJL(1, 1)
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }

            }
            R.id.bt_set_vibration -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isSupportMotoVibrationLevel == true) {
                    DHBleSdk.getVibrationCountJL()
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }

            }
            R.id.bt_get_alarm -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isAlarm == true) {
                    DHBleSdk.subscribeData(alarmCallback)
                    DHBleSdk.getAlarmRemindJL()
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_set_alarm -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isAlarm == true) {
                    val params = mutableListOf<AlarmRemainderBean>()
                    val alarmRemainderBean = AlarmRemainderBean()
                    alarmRemainderBean.alarmTag = ""
                    alarmRemainderBean.repeatModel = IntArray(7) //单次；周日至周六,要重复的对应置1
                    alarmRemainderBean.startHour = 7
                    alarmRemainderBean.startMin = 0
                    alarmRemainderBean.isOpen = true
                    alarmRemainderBean.alarmId = 0
                    params += alarmRemainderBean

                    val alarmRemainderBean2 = AlarmRemainderBean()
                    alarmRemainderBean2.alarmTag = ""
                    alarmRemainderBean2.repeatModel = IntArray(7) //单次；周日至周六,要重复的对应置1
                    alarmRemainderBean2.startHour = 8
                    alarmRemainderBean2.startMin = 0
                    alarmRemainderBean2.isOpen = false
                    alarmRemainderBean2.alarmId = 0
                    params += alarmRemainderBean2

                    DHBleSdk.subscribeData(alarmCallback)
                    DHBleSdk.setAlarmRemindJL(params)
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_del_alarm -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isAlarm == true) {
                    DHBleSdk.subscribeData(alarmCallback)
                    DHBleSdk.deleteAllAlarmRemindJL()
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_get_screen_sleepmode -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isBrightScreenSleepTime == true) {
                    DHBleSdk.subscribeData(brightTimeCallback)
                    DHBleSdk.getRingBrightScreenSleepTime()
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_set_screen_sleepmode -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isBrightScreenSleepTime == true) {
                    val briScreenTime = BrightScreenTimeBean()
                    briScreenTime.isOpen = true
                    briScreenTime.startHour = 20 //晚上8点至早上8点睡眠
                    briScreenTime.startMin = 0
                    briScreenTime.endHour = 8
                    briScreenTime.endMin = 0
                    DHBleSdk.subscribeData(brightTimeCallback)
                    DHBleSdk.setRingBrightScreenSleepTime(briScreenTime)
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_get_screen_ontime -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isBrightScreenTime == true) {
                    DHBleSdk.subscribeData(brightTimeCallback)
                    DHBleSdk.getBrightScreenTimeJL()
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_set_screen_ontime -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isBrightScreenTime == true) {
                    val briScreenTime = BrightScreenTimeBean()
                    briScreenTime.timeSecond = 10 //亮屏10s
                    DHBleSdk.subscribeData(brightTimeCallback)
                    DHBleSdk.setBrightScreenTimeJL(briScreenTime)
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_get_raise_screen -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isRaiseBrightScreen == true) {
                    DHBleSdk.subscribeData(raiseBrightTimeCallback)
                    DHBleSdk.getRaiseBrightScreenJL()
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_set_raise_screen -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isRaiseBrightScreen == true) {
                    val rasieScreenTime = BrightScreenBean()
                    rasieScreenTime.isOpen = true
                    rasieScreenTime.startHour = 8 //早上8点至晚上8点 抬腕亮屏
                    rasieScreenTime.startMin = 0
                    rasieScreenTime.endHour = 20
                    rasieScreenTime.endMin = 0
                    DHBleSdk.subscribeData(raiseBrightTimeCallback)
                    DHBleSdk.setRaiseBrightScreenJL(rasieScreenTime)
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_get_hr_alarm -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isSupportHrReminder == true) {
                    DHBleSdk.subscribeData(hrBoActualReminderCallback) //Alert Message
                    DHBleSdk.subscribeData(hrReminderCallback)
                    DHBleSdk.deviceGetHrAlertCmd()
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_set_hr_alarm -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isSupportHrReminder == true) {
                    DHBleSdk.subscribeData(hrBoActualReminderCallback) //Alert Message
                    DHBleSdk.subscribeData(hrReminderCallback)
                    DHBleSdk.deviceSetHrAlertCmd(1, 140, 0xff)
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_get_bo_alarm -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isSupportBoReminder == true) {
                    DHBleSdk.subscribeData(hrBoActualReminderCallback) //Alert Message
                    DHBleSdk.subscribeData(boReminderCallback)
                    DHBleSdk.deviceGetBoAlertCmd()
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_set_bo_alarm -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isSupportBoReminder == true) {
                    DHBleSdk.subscribeData(hrBoActualReminderCallback) //Alert  Message

                    DHBleSdk.subscribeData(boReminderCallback)
                    DHBleSdk.deviceSetBoAlertCmd(1, 90)
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_get_muslimcount_switch -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isRememberSwitch == true) {
                    DHBleSdk.subscribeData(muslimCountSwitchCallback)
                    DHBleSdk.deviceRememberSwitchGet()
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_set_muslimcount_switch -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isRememberSwitch == true) {

                    DHBleSdk.subscribeData(muslimCountSwitchCallback)
                    DHBleSdk.deviceRememberSwitch(1)
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_get_message_push -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isPushMsgEnableSwitch == true) {

                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_set_message_push -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isPushMsgEnableSwitch == true) {
                    val messageBean = MsgPushBean()
                    messageBean.appId = "com.ten.wenxin"
                    messageBean.title = "1111"
                    messageBean.content = "8888"
                    DHBleSdk.setPushMsgJL(messageBean)
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }
            }
            R.id.bt_set_timeformat -> {
                DHBleSdk.subscribeStatus(object : CommonStatusCallback{
                    override fun onSuccess(id: Int) {
                        Log.e("RWSDK", "time format set ok")
                    }

                    override fun onFail(id: Int, errorCode: Int) {
                        Log.e("RWSDK", "time format set failed")
                    }
                })
                DHBleSdk.ringSetTimeformat(0)
            }


            R.id.bt_control_open_hr -> {
                DHBleSdk.subscribeData(healthDataBroCallback) //Monitor real-time health data return (监听实时健康数据返回)
                DHBleSdk.subscribeData(testHrCallback) //Monitor control command results (监听控制指令结果)
                DHBleSdk.controlHealthDataJL(CmdConstants.JL_HR_DATA_TRANSFER_KEY, 1)
            }
            R.id.bt_control_close_hr -> {
                DHBleSdk.subscribeData(testHrCallback)
                DHBleSdk.controlHealthDataJL(CmdConstants.JL_HR_DATA_TRANSFER_KEY, 0)
            }
            R.id.bt_control_open_bo -> {
                DHBleSdk.subscribeData(healthDataBroCallback) //Monitor real-time health data return (监听实时健康数据返回)
                DHBleSdk.subscribeData(testHrCallback) //Monitor control command results (监听控制指令结果)
                DHBleSdk.controlHealthDataJL(CmdConstants.JL_BO_DATA_TRANSFER_KEY, 1)
            }
            R.id.bt_control_close_bo -> {
                DHBleSdk.subscribeData(testHrCallback)
                DHBleSdk.controlHealthDataJL(CmdConstants.JL_BO_DATA_TRANSFER_KEY, 0)
            }
            R.id.bt_control_open_hrv -> {
                DHBleSdk.subscribeData(healthDataBroCallback) //Monitor real-time health data return (监听实时健康数据返回)
                DHBleSdk.subscribeData(testHrCallback) //Monitor control command results (监听控制指令结果)
                DHBleSdk.controlHealthDataJL(CmdConstants.JL_HRV_DATA_TRANSFER_KEY, 1)
            }
            R.id.bt_control_close_hrv -> {
                DHBleSdk.subscribeData(testHrCallback)
                DHBleSdk.controlHealthDataJL(CmdConstants.JL_HRV_DATA_TRANSFER_KEY, 0)
            }
            R.id.bt_control_open_stress -> {
                DHBleSdk.subscribeData(healthDataBroCallback) //Monitor real-time health data return (监听实时健康数据返回)
                DHBleSdk.subscribeData(testHrCallback) //Monitor control command results (监听控制指令结果)
                DHBleSdk.controlHealthDataJL(CmdConstants.JL_PRESSURE_DATA_TRANSFER_KEY, 1)
            }
            R.id.bt_control_close_stress -> {
                DHBleSdk.subscribeData(testHrCallback)
                DHBleSdk.controlHealthDataJL(CmdConstants.JL_PRESSURE_DATA_TRANSFER_KEY, 0)
            }
            R.id.bt_control_open_bs -> {
                DHBleSdk.subscribeData(healthDataBroCallback) //Monitor real-time health data return (监听实时健康数据返回)
                DHBleSdk.subscribeData(testHrCallback) //Monitor control command results (监听控制指令结果)
                DHBleSdk.controlHealthDataJL(CmdConstants.JL_BLOODSUGAR_DATA_TRANSFER_KEY, 1)
            }
            R.id.bt_control_close_bs -> {
                DHBleSdk.subscribeData(testHrCallback)
                DHBleSdk.controlHealthDataJL(CmdConstants.JL_BLOODSUGAR_DATA_TRANSFER_KEY, 0)
            }
            R.id.bt_open_control_takephoto -> {
                DHBleSdk.subscribeData(takePhotoCallback)
                DHBleSdk.controlTakePhotoJL(1) //Open Photo打开拍照
            }
            R.id.bt_close_control_takephoto -> {
                DHBleSdk.dispose(takePhotoCallback)
                DHBleSdk.controlTakePhotoJL(0) //Close photo taking关闭拍照
            }
            R.id.bt_control_finddevice -> {
                DHBleSdk.subscribeData(findDeviceControlCallback)
                DHBleSdk.controlFindDeviceJL()
            }
            R.id.bt_control_shutdown -> {
                //可订阅subscribe DeviceControlCallback回调
                DHBleSdk.setPowerOffJL(Constants.CONTROL_DEVICE_POWER_OFF) //Shutdown (关机)
                //DHBleSdk.setPowerOffJL(Constants.CONTROL_DEVICE_RECOVERY) //Factory Reset(恢复出厂)
            }
            R.id.bt_data_gethealth -> {
                //Implement HealthDataSyncCallback to get health data
                DHBleSdk.syncAllHealthData(this)
            }
            R.id.bt_data_gethealth_onlyOne -> {
                //Implement HealthDataSyncCallback to get health data
                DHBleSdk.syncHealthDataByType(Constants.RingHealthType.TODAY_STEP, this)
            }
            R.id.bt_sport_workout -> {
                val support = XXApplication.instance.currentSupportMenuBean

                if (support?.isNewSport == true) {
                    startActivity(Intent(this@NewMainActivity, WorkoutTypeActivity::class.java))
                } else {
                    Toast.makeText(this, "Not Support!", Toast.LENGTH_SHORT).show()
                }

            }
            R.id.bt_update_ota -> {
                XXApplication.instance.isEnterOta = true
                val otaPath = "" //bin文件,睿幄科技提供
                PXIOtaService.startPXIFileSyncing(otaPath, dialTransferCallback);
            }

        }
    }

    private var device: BleDevice?= null

    override fun onBackPressed() {
//        super.onBackPressed()

        val home = Intent(Intent.ACTION_MAIN)
        home.addCategory(Intent.CATEGORY_HOME)
        startActivity(home)
    }


    override fun onSyncProgress(p0: Int) {

    }

    override fun onSyncFinish() {
        Log.e("qob", "output: onSyncFinish ")
    }

    override fun onSyncError(p0: Int) {

    }

    override fun onSyncStep(p0: MutableList<StepSyncBean>?) {
        Log.e("qob", "onSyncStep " + p0?.size)
    }

    override fun onSyncSleep(p0: MutableList<SleepSyncBean>?) {
        Log.e("qob", "onSyncSleep " + p0?.size)
        p0?.forEachIndexed { index, bean ->
            Log.e("qob", "---- Sleep Segment $index ----")
            Log.e("qob", "time=${bean.time}, asleepTime=${bean.asleepTime}, awakeTime=${bean.awakeTime}")
            Log.e("qob", "totalSleepTime=${bean.totalSleepTime} min, itemCount=${bean.itemCount}")

            bean.items?.forEachIndexed { idx, item ->
                Log.e("qob", "  item $idx -> len=${item.len} min, type=${item.sleepType}")
            }
        }
    }

    override fun onSyncHr(p0: MutableList<HeartRateSyncBean>?) {
        Log.e("qob", "output: onSyncHr " + p0?.size)
    }

    override fun onSyncBp(p0: MutableList<BloodPressSyncBean>?) {

    }

    override fun onSyncBo(p0: MutableList<BloodOxySyncBean>?) {
        Log.e("qob", "output: onSyncBo " + p0?.size)
    }

    override fun onSyncTemp(p0: MutableList<BodyTempSyncBean>?) {

    }

    override fun onSyncPressure(p0: MutableList<PressureSyncBean>?) {

    }

    override fun onSyncBloodSugar(p0: MutableList<BloodSugarSyncBean>?) {

    }

    override fun onSyncBreath(p0: MutableList<BreatheSyncBean>?) {

    }

    override fun onSyncHrv(p0: MutableList<HrvSyncBean>?) {
        Log.e("qob", "output: onSyncHrv " + p0?.size)
    }

    override fun onSyncMuslimCount(p0: MutableList<MuslimCountSyncBean>?) {

    }

    override fun onRingConnecting() {

    }

    override fun onRingConnected() {

    }

    override fun onRingConnectFailed(reason: RingBleError) {
        Log.e("RWSDK", "main onRingConnectFailed " + reason)
        isConnected = false

        EventBus.getDefault().post(EventBusBean.LogEvent("", 1))

        runOnUiThread {
            binding.bleStatus.apply {
                text = "Disconnected"

                postDelayed(Runnable {
                    binding.progressBar.visibility = View.GONE

                    if (!XXApplication.instance.isEnterScanUIPage) {
                        XXApplication.instance.isEnterScanUIPage = true
                        startActivity(Intent(this@NewMainActivity, ScanActivity::class.java))
                    }

                }, 1000)
            }
        }

    }

    override fun onRingDidFunctionMenu(supportMenuBean: SupportMenuBean) {
        Log.e("RWSDK", "onRingDidFunctionMenu " + supportMenuBean)

        EventBus.getDefault().post(EventBusBean.LogEvent("", 0))

    }

}