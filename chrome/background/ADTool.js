(function (w) {
    let ADTool = function () {
        this.events = {};
        this.waitForSwitchSite = 10000  // 等待站点切换生效
        this.intervalBetweenDown = 5000  // 相同类型报表两次下载之间的时间间隔
        this.downDayAgo = 4;  // 默认下载 4 天前的报表
        this.defaultRunDownTime = "13:00:00";  // 默认中午开始下载
        this.notifyId = null
        this.reportEmail = "webaccount@lenkor.cn"  // 邮件通知邮箱
        this.version = "v1.0.1"
    }

    /**
     * 注册报表下载插件逻辑
     * 报表插件逻辑参考exampleReport.js
     * 定时调用 schedule.js
     * @param report
     */
    ADTool.prototype.registerReport = function (report) {
        ADTool.prototype.report = ADTool.prototype.report || {};
        ADTool.prototype.report = Object.assign(ADTool.prototype.report, report)
    };
    ADTool.prototype.localStorage = chrome.storage.local;
    ADTool.prototype.download = chrome.downloads.download;
    ADTool.prototype.tabsQuery = chrome.tabs.query;


    /**
     *
     * @param title
     * @param msg
     * @param cb 如果传入回调，执行回调，否则 5S后消失
     * @param reuse 如果传入回调，执行回调，否则 5S后消失
     */
    ADTool.prototype.notify = function (title, msg, reuse) {
            let that = this
            if (arguments.length < 3) {
                if (this.isFunction(msg)) {
                    reuse = msg;
                    msg = title;
                } else {
                    msg = title
                }
                title = "Lenkor报表下载";
            }
            let options = {
                type: 'basic',
                iconUrl: '../images/favicon.ico',
                title: title,
                message: msg
            }
            let notifyCb = function (notificationId) {
                if (reuse) {
                    that.notifyId = notificationId
                }
                setTimeout(function () {
                    chrome.notifications.clear(notificationId)
                    if (that.notifyId === notificationId) {
                        that.notifyId = null
                    }
                }, 30 * 10000)

            }
            if (reuse && this.notifyId !== null) {
                chrome.notifications.update(this.notifyId, options, notifyCb())
            } else {
                chrome.notifications.create(null, options, notifyCb)
            }
    };

    ADTool.prototype.executeScript = function (tabId, option, cb) {
        let that = this
        if (navigator.userAgent.indexOf("Chrome") > -1) {
            chrome.tabs.executeScript(tabId, option, function (resp) {
                that.isFunction(cb) && cb(resp)
            })
        } else if (navigator.userAgent.indexOf("Firefox") > -1) {
            browser.tabs.executeScript(tabId, option, function (resp) {
                that.isFunction(cb) && cb(resp)
            })
        }
    };

    ADTool.prototype.sendTabMsg = function (tabId, msg, cb) {
        let that = this
        if (navigator.userAgent.indexOf("Chrome") > -1) {
            chrome.tabs.sendMessage(tabId, msg, function (resp) {
                that.isFunction(cb) && cb(resp)
            })
        } else if (navigator.userAgent.indexOf("Firefox") > -1) {
            browser.tabs.sendMessage(tabId, msg).then(resp => {
                that.isFunction(cb) && cb(resp)
            })
        }
    };


    ADTool.prototype.isFunction = function (obj) {
        return typeof obj === "function"
    };

    /**
     * 添加事件监听
     * @param event
     * @param cb
     */
    ADTool.prototype.addEventListener = function (event, cb) {
        this.events[event] = this.events[event] || [];
        this.events[event].push(cb)
    };

    /**
     * 移除事件监听
     * @param event
     * @param cb
     */
    ADTool.prototype.removeEventListener = function (event, cb) {
        let listeners = this.events[event];
        if (listeners && listeners.length > 0) {
            let number = listeners.indexOf(cb);
            listeners.splice(number, 1)
        }
    };

    /**
     * 触发事件分发，传入可变长度参数，默认取参数第一位作为事件名，剩余参数传递给监听者
     */
    ADTool.prototype.emit = function () {
        let args = [].slice.call(arguments);
        let length = args.length;
        if (length === 0) return;
        let eventName = args[0];
        args.splice(0, 1);
        let listeners = this.events[eventName];
        if (listeners && listeners.length > 0) {
            for (let i = 0; i < listeners.length; i++) {
                listeners[i].apply(null, args)
            }
        }
    };


    /**
     * 打开新tab页，最迟5分钟后自动关闭
     * 因为有的报表是需要插入代码到网页中运行的，所以不能直接关闭，调用方应在 回调函数中关闭 tab
     * 否则为了避免太多tab打开导致电脑卡死，最迟5分钟后也会关闭该tab页
     * @param url
     * @param autoClose true 5秒后自动关闭
     * @param cb 回调
     */
    ADTool.prototype.creatTab = function (url, autoClose, cb) {
            let that = this
            chrome.tabs.create({url: url}, function (tab) {
                if (autoClose) {
                    setTimeout(function (tab) {
                        chrome.tabs.remove([tab.id], function () {
                        })
                    }, 5000, tab)
                }
                // 避免出现 tab 页打开太多未关闭的情况，最迟5分钟就关闭
                setTimeout(function (tab) {
                    chrome.tabs.remove([tab.id], function () {
                    })
                }, 1000 * 60 * 5, tab)
                that.isFunction(cb) && cb(tab)
            });
    };

    /**
     * 假休眠，等待网页资源加载
     * @param delay
     */
    ADTool.prototype.sleep = function (delay) {
        let start = (new Date()).getTime();
        while ((new Date()).getTime() - start < delay) {
            continue;
        }
    }

    /**
     *
     * @param obj
     * @param key
     * @param seq
     */
    ADTool.prototype.getDeepValue = function (obj, key, seq) {
        seq = seq || "."
        let keys = key.split(seq)
        let o = JSON.parse(JSON.stringify(obj))
        while (keys.length > 0) {
            if (o[keys[0]]) {
                o = o[keys[0]]
                keys.splice(0, 1)
            } else {
                return null
            }
        }
        return o
    }

    let adTool = new ADTool();
    adTool.fn = ADTool.prototype;
    w.$tool = w.adTool = adTool;
}
)(window);
