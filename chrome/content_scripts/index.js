(function (w) {
    let ContentJS = function () {

    }
    ContentJS.prototype.init = function () {
        console.log("content_scripts 启动")
        let that = this
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            switch (request.cmd) {
                case "siteList":
                    sendResponse(that.getSiteList())
                    break
                case "paymentDownload":
                    // lk_generateReports(request.data.start, request.data.end)
                    break
                case "injectjs":
                    that.injectjs(request.data)
                    sendResponse({code: 0})
                    break
                default:
                    sendResponse({code: -1, msg: "无法匹配命令", data: request})
            }
        });
    }

    /**
     *  利用content js ，通过script 标签插入JS代码在网页的JS环境中运行
     * @param data
     */
    ContentJS.prototype.injectjs = function (data) {
        let temp = document.createElement('script');
        temp.setAttribute('type', 'text/javascript');
        if (data.code) {  // 如果后端返回的是代码，直接插入代码
            temp.innerText = data.code
        } else if (data.file) {  // 如果后端返回的是JS文件链接，加载JS文件
            temp.src = chrome.extension.getURL(data.file);
        }
        document.head.appendChild(temp);  // 插入到DOM中 浏览器加载 该 script 标签
    }


    ContentJS.prototype.getSiteList = function () {
        try {
            let sites = {}
            let selects = document.getElementById("sc-mkt-picker-switcher-select")
            if (selects != null) {   // 多站点的情况下，应该是有多选下拉框的
                let mkts = selects.getElementsByTagName("option");
                for (let mkt of mkts) {
                    sites[mkt.text.trim()] = mkt.value.trim()
                }
            } else {  // 单站点的情况处理
                let site = document.getElementById("sc-mkt-switcher-form").getElementsByTagName("span")[0].innerText.trim();
                let siteUrl = document.getElementById("sc-logo-top").getElementsByTagName("a")[0].href
                if (siteUrl.indexOf("?") === -1) {
                    siteUrl = siteUrl + "?"
                }

                sites[site] = siteUrl
            }
            return {code: 0, data: sites}
        } catch (e) {
            return {code: -1, msg: "无法获取站点列表，请按步骤操作"}
        }
    }
    let contentJS = new ContentJS();
    contentJS.init()
})(window)
