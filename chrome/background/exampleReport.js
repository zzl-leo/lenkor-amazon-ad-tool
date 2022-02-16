(function ($tool) {
    let Report = function () {

    }

    Report.prototype = {
        // 获取报表的设置
        getSetting: function (cb) {

        },

        // 设置报表设置
        setSetting: function (setting, cb) {

        },
        /**
         *
         * @param data 指定下载的报表日期
         * @param site 单个报表站点设置
         * @param setting 报表设置
         */
        down(data, site, setting) {
        },
        /**
         * 范围时间内的单日报表下载
         * @param begin
         * @param end
         * @param site
         * @param setting
         */
        rangeDayDown(begin, end, site, setting) {
        }

    }

    // $tool.registerReport({"example":new Report()})
})(adTool)
