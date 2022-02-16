(function ($tool) {
    const SETTING_KEY = "setting_key";
    const ChangeSettingEvent = "onSetting"
    const Setting_Version = "v1.0.0" // 加入设置版本，避免版本升级带来的配置文件错误导致bug
    let Setting = function () {
        this.setting = {}

    };
    Setting.prototype.get = function (cb) {
        $tool.localStorage.get([SETTING_KEY], function (result) {
            let setting = result[SETTING_KEY]
            if (setting) {   //判断配置文件版本是否一致
                let s = JSON.parse(setting)
                let version = s.version;
                if (version && version !== Setting_Version) {  // 如果存在版本号但是版本号和当前不一致，那么返回空，因为第一次给测试时，是不带版本号的 ，折中处理
                    setting = "{}"
                }
            }
            cb(setting)
        })
    };
    Setting.prototype.save = function (setting, cb) {
        let s = JSON.parse(setting)
        s.version = Setting_Version
        this.setting = s
        setting = JSON.stringify(s)
        let item = {};
        item[SETTING_KEY] = setting;
        $tool.localStorage.set(item, function () {
            $tool.isFunction(cb) && cb();
            $tool.log.success("保存设置:" + setting);
            setTimeout(function () {   // 用异步的方式调用事件分发，避免监听事件的方法出错导致流程不能继续
                $tool.emit(ChangeSettingEvent, JSON.parse(setting))
            }, 1000)
        })
    };

    Setting.prototype.init = function () {
        let that = this
        this.get(function (s) {
            if (s)
                that.setting = JSON.parse(s)
        })
    }

    let s = new Setting()
    s.init()
    $tool.fn.setting = s
})(adTool);
