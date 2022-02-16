(function ($tool) {
    let Payment = function () {
        this.reportType = 'payment'
    }
    let url = "/payments/reports/custom/submit/generateReports"


    Payment.prototype = $tool.newAjaxReport()


    Payment.prototype.dateFormat = function (date) {
        date = new Date(date);
        let dateObj = {};
        dateObj['month'] = date.getMonth() + 1;
        dateObj['date'] = date.getDate();
        dateObj['year'] = date.getFullYear();
        return dateObj
    }

    Payment.prototype.Payload = function (start, end) {
        return {
            "reportType": "Transaction",
            "timeRangeType": "Custom",
            "startDate": this.dateFormat(start),
            "endDate": this.dateFormat(end),
        }
    }

    Payment.prototype.down = function (date, site, setting, save) {
        let that = this
        let requestObj = this.Payload(date, date)

        let ajaxOption = {
            url: url,
            data: JSON.stringify(requestObj),
            type: "POST",
            dataType: "json",
            contentType: 'application/json',
        }
        let lk_ajax_options = "payment_obj" + date.format('yyyyMMdd')
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
    }

    $tool.registerReport({payment: new Payment()})
})(adTool)