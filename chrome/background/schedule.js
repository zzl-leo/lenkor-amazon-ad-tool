(function ($tool) {
    let Schedule = function () {
        this.timeout = 30 * 1000; //定时检查是否需要下载报表
        this.interval = null;
    };

    /**
     * 检查是否有报表需要下载
     */
    Schedule.prototype.checkRun = function () {
        let that = this
        let reports = $tool.report
        // 遍历所有注册报表
        for (let reportType in reports) {
            let hasRun = false
            let report = reports[reportType];
            report.getSetting(function (s) {
                if (s) {
                    let reportSetting = JSON.parse(s);
                    let sites = reportSetting['sites'] || []
                    let length = sites.length;
                    for (let i = 0; i < length; i++) {
                        let time = sites[i]["time"] || report["defaultRunDownTime"] || $tool.defaultRunDownTime  // 如果没设置默认下载时间，那么晚上10点半后执行
                        if (that.shouldRun(sites[i]["pre_down_time"], time)) {
                            let site = sites[i];
                            let end = new Date().subDay(report["downDayAgo"] || $tool.downDayAgo); // 下载多少天前的数据
                            if (site["pre_down_time"]) {
                                // 上次下载的报表，应该也是下载规定天数前的报表
                                let begin = new Date(site["pre_down_time"]).subDay(report["downDayAgo"] || $tool.downDayAgo);
                                report.rangeDayDown(begin, end, site, reportSetting, true)
                            } else {
                                report.rangeDayDown(end, end, site, reportSetting, true)
                            }
                            hasRun = true
                            return // 一次下载一份报表，避免站点切换时出错
                        }
                    }
                }
            })
            if (hasRun) {
                return
            }
        }
    }
    Schedule.prototype.start = function () {
        let that = this
        this.interval = setInterval(function () {
            $tool.setting.get(function (setting) {
                setting = setting ? JSON.parse(setting) : {};
                if (setting.enableSchedule) {
                    that.checkRun()
                }
            })
        }, this.timeout)
        setTimeout(function () {
            $tool.emit("onScheduleStart")
        }, 1000)
    };
    Schedule.prototype.shouldRun = function (lastTime, timing) {
        if (!timing) { // 定时未设置
            return false
        }
        if (timing.localeCompare(new Date().format("hh:mm:ss")) < 0) { // 定时时间已过
            if (!!!lastTime) {  // 没有上次执行记录
                return true
            }
            if (new Date().format('yyyy/MM/dd') === new Date(lastTime).format('yyyy/MM/dd')) { // 同一天
                if (timing.localeCompare(new Date(lastTime).format("hh:mm:ss")) < 0) {  // 定时时间 比 上次执行时间小，说明已执行
                    return false
                }
            }
            return true // 定时时间已过，上次执行非当天 运行
        }
        return false
    };
    Schedule.prototype.stop = function () {
        if (this.interval) {
            clearInterval(this.interval)
            this.interval = null
        }
        setTimeout(function () {
            $tool.emit("onScheduleStop")
        }, 1000)
    };
    $tool.fn.newSchedule = function () {
        return new Schedule()
    };

    let s = new Schedule();
    $tool.addEventListener("onSetting", function (setting) {
        if (setting.enableSchedule) {
            s.stop()
            s.start()
        } else {
            s.stop()
        }
    });
    s.start()
    $tool.fn.schedule = s
})(adTool);
