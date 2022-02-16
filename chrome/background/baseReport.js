(function ($tool) {
    /**
     * 报表下载模版，抽出保存设置的方法
     * @constructor
     */
    let BaseReport = function () {
        this.reportType = "unset_report"
    }
    BaseReport.prototype = {
        /**
         * 放回报表类型的设置保存键，子类应该重写
         * @returns {string}
         */
        settingKey: function () {
            return this.reportType
        },
        /**
         * 保存站点最近下载报表的时间
         * @param site
         * @param setting
         */
        saveDownTime: function (site, setting) {
            let sites = setting.sites;
            let length = sites.length;
            for (let i = 0; i < length; i++) {
                let s = sites[i];
                if (s.site === site.site) {
                    setting.sites[i]["pre_down_time"] = new Date().format("yyyy-MM-dd hh:mm:ss");
                }
            }
            this.saveSetting(JSON.stringify(setting))
        },
        getSetting: function (cb) {
            let SETTING_KEY = this.settingKey()
            $tool.localStorage.get([SETTING_KEY], function (result) {
                cb(result[SETTING_KEY])
            })
        },
        saveSetting: function (setting, cb) {
            let SETTING_KEY = this.settingKey()
            $tool.log.info(`${SETTING_KEY}:` + setting);
            let item = {};
            item[SETTING_KEY] = setting;
            $tool.localStorage.set(item, function () {
                if ($tool.isFunction(cb)) {
                    cb()
                }
            })
        },
    }
    $tool.fn.newBaseReport = function () {
        return new BaseReport()
    }


    /**
     * 通过在网页中插入JS代码生成报表
     *
     * @constructor
     */

    let AjaxReport = function () {
        this.tabId = null
    }
    AjaxReport.prototype = new BaseReport()
    AjaxReport.prototype.rangeDayDown = function (begin, end, site, setting, save) {
        $tool.notify(`${this.reportType} 报表开始下载，过程浏览器可能卡顿,请暂时停止切换站点操作`)
        begin = new Date(begin);
        end = new Date(end);
        let that = this;
        $tool.creatTab($tool.sellerSites.siteList[site.site], false, function (tab) {
            that.tabId = tab.id
            $tool.sleep($tool.waitForSwitchSite)
            while (begin <= end) {
                let b = new Date(begin)
                that.down(b, site, setting, save)
                $tool.sleep($tool.intervalBetweenDown)
                begin.addDay(1)
            }
            that.tabId = null
        })
    }

    $tool.fn.newAjaxReport = function () {
        return new AjaxReport()
    }


})(adTool)