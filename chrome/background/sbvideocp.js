(function ($tool) {
    let url = "/sspa/tresah/create-subscription"
    let Payload = function (reportName, date) {
        date = new Date(date.addDay(1).format("yyyy-MM-dd") + " 07:59:59.999");
        return {
            "reportName": reportName,
            "reportProgramType": "sbv",
            "reportType": "CAMPAIGN_PLACEMENTS_REPORT",
            "reportUnit": "day",
            "reportPeriod": "CUSTOM",
            "portfolios": [{"id": -1, "name": "Not grouped"}],
            "recipients": [$tool.reportEmail],
            "reportStartDate": date.getTime(),
            "reportEndDate": date.getTime(),
            "subscriptionDelivery": {"frequency": "SINGLE"}
        };
    }
    let SBVideoCamPlace = function () {
        this.reportType = "sbv-cp"
        this.tabId = null;
    }
    const SETTING_KEY = "sb_video_cp_setting";

    SBVideoCamPlace.prototype = {
        getSetting: function (cb) {
            $tool.localStorage.get([SETTING_KEY], function (result) {
                cb(result[SETTING_KEY])
            })
        },
        saveSetting: function (setting, cb) {
            $tool.log.info("sb_video_cp:" + setting);
            let item = {};
            item[SETTING_KEY] = setting;
            $tool.localStorage.set(item, function () {
                if ($tool.isFunction(cb)) {
                    cb()
                }
            })
        },
        /**
         *
         * @param date 指定下载的报表日期
         * @param site 单个报表站点设置
         * @param setting 报表设置
         * @param save 保存下载日期
         */
        down(date, site, setting, save) {
            let that = this
            date = new Date(date);
            let account = site.account || $tool.setting.setting.account  // 支持对站点自定义账号名
            let siteCode = $tool.sellerSites.getSiteCode(site.site)

            let filename = `${that.reportType}::${account}-${siteCode}::${date.format('yyyy-MM-dd')}`;
            let ajaxOption = {
                url: url,
                data: JSON.stringify(new Payload(filename, date)),
                type: "POST",
                dataType: "json",
                contentType: 'application/json',
            }
            let lk_ajax_options = "lk_ajax_options" + date.format('yyyyMMdd')
            $tool.sendTabMsg(this.tabId, {
                cmd: 'injectjs',
                data: {
                    code: `let ${lk_ajax_options} = ${JSON.stringify(ajaxOption)};\njQuery.ajax(${lk_ajax_options});`
                }
            }, function (resp) {
                if (!save) return
                let sites = setting.sites;
                let length = sites.length;
                for (let i = 0; i < length; i++) {
                    let s = sites[i];
                    if (s.site === site.site) {
                        setting.sites[i]["pre_down_time"] = new Date().format("yyyy-MM-dd hh:mm:ss");
                    }
                }
                that.saveSetting(JSON.stringify(setting))
            })
        },
        /**
         * 范围时间内的单日报表下载
         * @param begin
         * @param end
         * @param site
         * @param setting
         */
        rangeDayDown(begin, end, site, setting, save) {
            $tool.notify("开始下载任务,过程浏览器可能卡顿,请暂时停止切换站点操作")
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
    }
    $tool.registerReport({sbvcp: new SBVideoCamPlace()})
})(adTool)