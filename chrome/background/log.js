(function ($tool) {
    const LOG_KEY = "log_key";
    const log_line = 20; // 记录日志条数
    let Log = function () {

    };
    Log.prototype.get = function (cb) {
        $tool.localStorage.get([LOG_KEY], function (result) {
            cb(result[LOG_KEY])
        })
    };

    Log.prototype.save = function (msg) {
        let item = {};
        item[LOG_KEY] = msg;
        $tool.localStorage.set(item);
    };

    Log.prototype.log = function (type, msg) {
        if (typeof msg !== "string") {
            msg = JSON.stringify(msg)
        }
        console.log(type, msg);
        let that = this;
        // todo 这个步骤应该写在 save 的逻辑里面，以后再改
        this.get(function (logs) {
            logs = logs || [];
            logs.splice(log_line, logs.length);
            logs.unshift({type: type, msg: msg, time: new Date().format("yyyy-MM-dd hh:mm")});
            that.save(logs)
        })
    };
    Log.prototype.success = function (msg) {
        this.log("success", msg)
    };
    Log.prototype.info = function (msg) {
        this.log("info", msg)
    };
    Log.prototype.warning = function (msg) {
        this.log("warning", msg)
    };
    Log.prototype.error = function (msg) {
        this.log("error", msg)
    };
    Log.prototype.del = function (index) {
        let that = this;
        this.get(function (logs) {
            logs = logs || [];
            logs.splice(index, 1);
            that.save(logs)
        })
    };
    $tool.fn.log = new Log()
})(adTool);
