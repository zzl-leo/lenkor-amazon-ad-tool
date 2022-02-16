(function ($tool) {
    let settingExample = {
        account: "", // 账号名
        sites: [
            {
                site: "www.amazon.com", //站点
                siteCode: "US", //站点短码
                siteUrl: "https://www....",  // 切换到该站点的URL
                pre_down_time: "11:01:00", // 该站点报表上次下载时间
                time: "11:00:00" // 改站点报表下载预设时间
            }
        ]
    }
    const SETTING_KEY = "business_report_setting";


    let BusinessReport = function () {
        this.siteAttr = {
            'www.amazon.com': {
                fromDateFormat: "MM/dd/yyyy",
                urlDateFormat: 'M-dd-yy',
                cols: "/c0/c1/c2/c3/c4/c5/c6/c7/c8/c9/c10/c11/c12/c13/c14/c15"
            },
            'www.amazon.ca': {fromDateFormat: "MM/dd/yyyy", urlDateFormat: 'M-dd-yy'},
            'www.amazon.com.mx': {fromDateFormat: "MM/dd/yyyy", urlDateFormat: 'M-dd-yy'},
            'www.amazon.sg': {fromDateFormat: "MM/dd/yyyy", urlDateFormat: 'M-dd-yy'},
            'www.amazon.com.br': {fromDateFormat: "MM/dd/yyyy", urlDateFormat: 'M-dd-yy'},
            'www.amazon.co.uk': {fromDateFormat: "dd/MM/yyyy", urlDateFormat: 'dd-MM-yyyy'},
            'www.amazon.de': {fromDateFormat: "dd/MM/yyyy", urlDateFormat: 'dd-MM-yyyy'},
            'www.amazon.fr': {fromDateFormat: "dd/MM/yyyy", urlDateFormat: 'dd-MM-yyyy'},
            'www.amazon.it': {fromDateFormat: "dd/MM/yyyy", urlDateFormat: 'dd-MM-yyyy'},
            'www.amazon.es': {fromDateFormat: "dd/MM/yyyy", urlDateFormat: 'dd-MM-yyyy'},
            'www.amazon.nl': {fromDateFormat: "dd/MM/yyyy", urlDateFormat: 'dd-MM-yyyy'},
            'www.amazon.jp': {fromDateFormat: "MM/dd/yyyy", urlDateFormat: 'M-dd-yy'},
            'www.amazon.com.au': {fromDateFormat: "dd/MM/yyyy", urlDateFormat: 'dd-MM-yy'},
        }
    };
    BusinessReport.prototype = {

        /**
         * 构建下载请求体
         * @param date
         * @param site
         * @param cols
         *
         */
        Payload: function (date, site) {
            let body = {
                "reportID": "102:DetailSalesTrafficByChildItem",
                "sortIsAscending": "0",
                "sortColumn": "16",
                "rows": "",
                "dateUnit": "1",
                "currentPage": "0",
                "runDate": "",
                "cols": "/c0/c1/c2/c3/c4/c5/c6/c7/c8/c9/c10/c11/c12/c13/c14/c15/c16/c17/c18"
            };
            let cols = $tool.getDeepValue(this.siteAttr, `${site.site}/cols`, "/")
            if (cols) {
                body.cols = cols
            }
            body.fromDate = date.format($tool.getDeepValue(this.siteAttr, `${site.site}/fromDateFormat`, "/"));
            body.toDate = date.format($tool.getDeepValue(this.siteAttr, `${site.site}/fromDateFormat`, "/"));
            return Qs.stringify(body)
        },

        getSetting: function (cb) {
            $tool.localStorage.get([SETTING_KEY], function (result) {
                cb(result[SETTING_KEY])
            })
        },
        saveSetting: function (setting, cb) {
            $tool.log.info("设置business_report:" + setting);
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
         * @param site
         * @returns {string}
         */
        generateDownUrl: function (site) {
            let siteUrl = $tool.sellerSites.siteList[site.site]  // 从sellerSites 中获取切换站点URL，避免URL的更新导致请求失败
            let index = siteUrl.indexOf("/", 8); // 去掉HTTPS：// 取站点域名
            let date = new Date()
            return `${siteUrl.slice(0, index)}/gp/site-metrics/load/csv/BusinessReport-${date.format($tool.getDeepValue(this.siteAttr, `${site.site}/urlDateFormat`, "/"))}.csv`
        },

        /**
         *
         * @param date
         * @param site
         * @param setting
         * @param save 是否保持下载时间到设置中
         */
        down: function (date, site, setting, save) {
            let that = this
            date = new Date(date);
            let account = site.account || $tool.setting.setting.account  // 支持对站点自定义账号名
            let siteCode = $tool.sellerSites.getSiteCode(site.site)

            let filename = `BusinessReport/${account}-${siteCode}/${date.format('yyyy-MM-dd')}.csv`;
            $tool.notify('下载BR报表文件中:' + `${account}-${siteCode}/${date.format('yyyy-MM-dd')}.csv`, true);
            chrome.downloads.download({
                url: that.generateDownUrl(site),
                method: "POST",
                conflictAction: "overwrite", //"uniquify", "overwrite", or "prompt"
                headers: [
                    {name: 'Content-Type', value: 'application/x-www-form-urlencoded'},
                ],
                filename: filename,
                body: that.Payload(date, site)
            }, function (downloadId) {
                $tool.log.info("success", "开始下载:" + filename);

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
         *
         * @param begin
         * @param end
         * @param site
         * @param setting
         * @param save 是否保持下载时间的设置中
         */
        rangeDayDown: function (begin, end, site, setting, save) {
            $tool.notify("开始下载任务,过程浏览器可能卡顿,请暂时停止切换站点操作")
            begin = new Date(begin);
            end = new Date(end);
            let that = this;
            $tool.creatTab($tool.sellerSites.siteList[site.site], true)
            $tool.sleep($tool.waitForSwitchSite)
            while (begin <= end) {
                let b = new Date(begin)
                that.down(b, site, setting, save)
                $tool.sleep($tool.intervalBetweenDown)
                begin.addDay(1)
            }
        }
    };
    $tool.registerReport({br: new BusinessReport()})
})(adTool);
