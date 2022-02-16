let dateMils = 86400000


/**
 *
 * @param d
 * @returns {Date}
 */
Date.prototype.addDay = function (d) {
    if (typeof d === "number") {
        this.setTime(this.getTime() + d * dateMils)
        return this
    }
    return this
}

Date.prototype.subDay = function (d) {
    return this.addDay(0 - d)
}

Date.prototype.format = function (format) {
    if (typeof (format) === 'undefined') {
        format = 'MM/dd/yyyy'
    }
    let o = {
        'M+': this.getMonth() + 1, // month
        'd+': this.getDate(), // day
        'h+': this.getHours(), // hour
        'm+': this.getMinutes(), // minute
        's+': this.getSeconds(), // second
        'q+': Math.floor((this.getMonth() + 3) / 3), // quarter
        'S': this.getMilliseconds() // millisecond
    };
    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1,
            (this.getFullYear() + '').substr(4 - RegExp.$1.length))
    }
    for (let k in o) {
        if (new RegExp('(' + k + ')').test(format)) {
            format = format.replace(RegExp.$1,
                RegExp.$1.length === 1 ? o[k]
                    : ('00' + o[k]).substr(('' + o[k]).length))
        }
    }
    return format
};

/**
 * 两个时间相隔天数 ,目标天数和本身相差天数
 * @param end
 * @returns {number}
 */
Date.prototype.diffDay = function (end) {
    let startDate = Date.parse(this);
    let endDate = Date.parse(new Date(end));
    let day = (startDate - endDate) / (1 * 24 * 60 * 60 * 1000);
    return parseInt(day)
};
