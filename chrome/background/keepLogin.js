(function ($tool) {

    let KeepLogin = function () {
        this.timeout = 30 * 60 * 1000;  // 30分钟刷新一下页面，保证登录状态
        this.interval = null
    }

    KeepLogin.prototype.reloadAmazonPage = function () {
        let currentSiteUrl = $tool.sellerSites.getCurrentSiteUrl();
        if (currentSiteUrl && currentSiteUrl.length !== 0) {
            $tool.creatTab(currentSiteUrl, true)
        } else {
            let siteList = $tool.sellerSites.siteList;
            for (let key in siteList) {
                $tool.creatTab(siteList[key], true)
            }
        }
    }
    KeepLogin.prototype.init = function () {
        let that = this
        $tool.addEventListener("onScheduleStart", function () {
            this.interval = setInterval(function () {
                that.reloadAmazonPage()
            }, that.timeout)
        })
        $tool.addEventListener("onScheduleStop", function () {
            if (this.interval !== null) {
                clearInterval(this.interval)
            }
        })
    }

    new KeepLogin().init()

})(adTool)
