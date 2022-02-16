/**
 {"pageOffset":0,"pageSize":300,"sort":{"order":"DESC","field":"SPEND"},"period":"YESTERDAY","startDateUTC":1586822400000,"endDateUTC":1586908799999,"filters":[{"field":"CAMPAIGN_STATE","not":false,"operator":"EXACT","values":["ENABLED","PAUSED","ARCHIVED"]}],"timeSeriesInterval":null,"programType":"SP","fields":["CAMPAIGN_NAME","CAMPAIGN_ELIGIBILITY_STATUS","CAMPAIGN_SMART_BIDDING_STRATEGY","BID_ADJUSTMENT_PERCENTAGE","CAMPAIGN_STATE","CAMPAIGN_START_DATE","CAMPAIGN_END_DATE","CAMPAIGN_BUDGET","CAMPAIGN_BUDGET_CURRENCY","CAMPAIGN_BUDGET_TYPE","CAMPAIGN_TYPE","PORTFOLIO_NAME","NTB_ORDERS","NTB_PERCENT_OF_ORDERS","NTB_SALES","NTB_PERCENT_OF_SALES","IMPRESSIONS","CLICKS","SPEND","CTR","CPC","ORDERS","SALES","ACOS"],"queries":[],"version":"V2"}
 https://advertising.amazon.com/cm/api/campaigns?entityId=ENTITYJ5RO5MD762FO&export=CSV
 https://advertising.amazon.com/cm/api/campaigns?entityId=ENTITYJ5RO5MD762FO&export=CSV

 */

(function ($tool) {
    let settingExample = {
        sites: [
            {
                accountSite: "E-SERVER-US", // 账号站点
                siteUrl: "https://www....",  // 切换到该站点的URL
                pre_down_time: "11:01:00", // 该站点报表上次下载时间
                time: "11:00:00" // 改站点报表下载预设时间
            }
        ]
    }
    const SETTING_KEY = "ams_setting";
    let Payload = function (begin, end) {
        this.body = {
            "pageOffset": 0,
            "pageSize": 300,
            "sort": {"order": "DESC", "field": "SPEND"},
            "period": "CUSTOM",
            /*            "startDateUTC": 1583280000000,
                        "endDateUTC": 1583366399999,*/
            "filters": [{
                "field": "CAMPAIGN_STATE",
                "not": false,
                "operator": "EXACT",
                "values": ["ENABLED", "PAUSED", "ARCHIVED"]
            }],
            "programType": "SP",
            "fields": ["CAMPAIGN_NAME", "CAMPAIGN_ELIGIBILITY_STATUS", "CAMPAIGN_SMART_BIDDING_STRATEGY", "BID_ADJUSTMENT_PERCENTAGE", "CAMPAIGN_STATE", "CAMPAIGN_START_DATE", "CAMPAIGN_END_DATE", "CAMPAIGN_BUDGET", "CAMPAIGN_BUDGET_CURRENCY", "CAMPAIGN_BUDGET_TYPE", "CAMPAIGN_TYPE", "PORTFOLIO_NAME", "NTB_ORDERS", "NTB_PERCENT_OF_ORDERS", "NTB_SALES", "NTB_PERCENT_OF_SALES", "IMPRESSIONS", "CLICKS", "SPEND", "CTR", "CPC", "ORDERS", "SALES", "ACOS"],
            "queries": [],
            "version": "V2"
        };
        // AMS报表下载需要转化为UTC时间，目前观察是以下的装换逻辑
        begin = new Date(begin.format("yyyy-MM-dd") + ' 08:00:00.000');
        end = new Date(end.addDay(1).format("yyyy-MM-dd") + " 07:59:59.999");
        this.body.startDateUTC = begin.getTime();
        this.body.endDateUTC = end.getTime()
    };


    let AmsReport = function () {
    };
    AmsReport.prototype = {
        checkUrl: function (url) {
            let pattern = /^((https|http|ftp|rtsp|mms)?:\/\/)[^\s]+entityId=[^\s]+/;
            return pattern.test(url);
        },
        getSetting: function (cb) {
            $tool.localStorage.get([SETTING_KEY], function (result) {
                cb(result[SETTING_KEY])
            })
        },
        saveSetting: function (setting, cb) {
            $tool.log.info("设置AMS:" + setting);
            let item = {};
            item[SETTING_KEY] = setting;
            $tool.localStorage.set(item, function () {
                if ($tool.isFunction(cb)) {
                    cb()
                }
            })
        },
        generateDownUrl: function (site) {
            let siteUrl = site.siteUrl
            let index = siteUrl.indexOf('/campaigns')
            let url = siteUrl.slice(0, index) + '/api' + siteUrl.slice(index) + '&export=CSV'
            return url
        },
        down: function (date, site, setting, save) {
            let that = this

            let d = new Date(date)  // payload 方法里格式化时间时 ，会把date给修改掉，奇怪的js
            let payload = new Payload(d, d);
            let filename = `AMSCampaigns/${site.accountSite}/${date.format('yyyy-MM-dd')}.csv`;
            let url = that.generateDownUrl(site)
            $tool.log.info("success", "开始下载:" + filename);
            $tool.notify('下载AMS报表文件中:' + `${site.accountSite}/${date.format('yyyy-MM-dd')}.csv`, true)
            console.log(url, payload.body)
            $tool.download({
                url: url,
                method: "POST",
                conflictAction: "overwrite", //"uniquify", "overwrite", or "prompt"
                headers: [
                    {name: 'Content-Type', value: 'application/json'},
                ],
                filename: filename,
                body: JSON.stringify(payload.body)
            }, function (downloadId) {
                console.log(downloadId);
                if (!save) return
                let sites = setting.sites;
                let length = sites.length;
                for (let i = 0; i < length; i++) {
                    let s = sites[i];
                    if (s.siteUrl === site.siteUrl) {
                        setting.sites[i]["pre_down_time"] = new Date().format("yyyy-MM-dd hh:mm:ss");
                    }
                }
                that.saveSetting(JSON.stringify(setting))
            })

        },
        /**
         * 日期范围内，分别下载单天的报表
         * @param begin
         * @param end
         * @param site
         * @param setting
         * @param save 是否把下载时间写入站点设置中
         */
        rangeDayDown: function (begin, end, site, setting, save) {
            begin = new Date(begin);
            end = new Date(end);
            let that = this;

            while (begin <= end) {
                let b = new Date(begin)
                that.down(b, site, setting, save)
                $tool.sleep($tool.intervalBetweenDown)
                begin.addDay(1)
            }
        }
    };
    $tool.registerReport({ams: new AmsReport()})
})(adTool);
