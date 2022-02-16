(function ($tool) {


    let Seller_Site_List = "seller_site_list";
    let SellerSite = function () {
        this.listener = null;
        this.currentSiteUrl = null;
        this.siteList = {}
        this.siteAttr = {
            'www.amazon.com': {siteCode: "US", enLang: 'en_US'},
            'www.amazon.ca': {siteCode: "CA", enLang: "en_CA"},
            'www.amazon.com.mx': {siteCode: "MX", enLang: 'en_MX'},
            'www.amazon.co.uk': {siteCode: "UK", enLang: 'en_GB'},
            'www.amazon.de': {siteCode: "DE", enLang: "en_DE"},
            'www.amazon.fr': {siteCode: "FR", enLang: 'en_FR'},
            'www.amazon.it': {siteCode: "IT", enLang: 'en_IT'},
            'www.amazon.es': {siteCode: "ES", enLang: "en_ES"},
            'www.amazon.nl': {siteCode: "NL", enLang: "en_GB"},
            'www.amazon.sg': {siteCode: "SG", enLang: "en_SG"},
            'www.amazon.com.br': {siteCode: "BR", enLang: "en_US"},
            'www.amazon.com.au': {siteCode: "AU", enLang: "en_AU"},
            'www.amazon.jp': {siteCode: "JP", enLang: "en_JP"},
        }
        //
    };
    /**
     * 保存切换站点URL时，添加语言后缀
     * @param list
     * @param cb
     */
    SellerSite.prototype.getEnLangCode = function (siteKey) {
        if (this.siteAttr[siteKey] && this.siteAttr[siteKey]["enLang"]) {
            return this.siteAttr[siteKey]["enLang"]
        }
    }

    SellerSite.prototype.save = function (list, cb) {
        let sites = JSON.parse(list)
        for (let sitesKey in sites) { // 添加语言切换后缀
            if (sites.hasOwnProperty(sitesKey) && this.getEnLangCode(sitesKey))
                sites[sitesKey] = sites[sitesKey] + `&ref_=xx_swlang_head_xx&mons_sel_locale=${this.siteAttr[sitesKey].enLang}&languageSwitched=1`
        }
        let item = {};
        item[Seller_Site_List] = JSON.stringify(sites);
        this.siteList = sites
        // this.siteChangeListener(sites);
        $tool.localStorage.set(item, function () {
            $tool.isFunction(cb) && cb()
        })
    };

    SellerSite.prototype.get = function (cb) {
        $tool.localStorage.get([Seller_Site_List], function (result) {
            cb(result[Seller_Site_List])
        })
    };
    /**
     * 通过站点获取站点简码  www.amazon.com -> US
     * @param site
     * @returns {string|*}
     */
    SellerSite.prototype.getSiteCode = function (site) {
        site = site.toLowerCase();
        if (this.siteAttr[site] && this.siteAttr[site]["siteCode"]) {
            return this.siteAttr[site]["siteCode"]
        }
        let index = site.lastIndexOf(".");
        let suffix = site.slice(index + 1)
        if (suffix === "com") {
            return "US"
        } else {
            return suffix.toUpperCase()
        }
    }
    SellerSite.prototype.updateFromWeb = function (cb) {
        let that = this;
        $tool.tabsQuery({active: true, currentWindow: true, status: "complete"}, function (tabs) {
            if (tabs.length === 0) {
                $tool.notify("站点列表获取失败，请先尝试切换站点或打开卖家首页")
            } else {
                let tab = tabs[0];
                $tool.sendTabMsg(tab.id, {cmd: 'siteList'}, function (resp) {
                    if (resp && resp.code === 0) {
                        $tool.notify("站点获取成功");
                        that.save(JSON.stringify(resp.data))
                        if ($tool.isFunction(cb)) {
                            cb(resp.data)
                        }
                    } else {
                        $tool.notify("获取站点错误")
                    }
                })
            }
        })
    };

    SellerSite.prototype.newListener = function () {
        let that = this;
        return function (details) {
            $tool.log.info("站点切换为：" + details.url);
            that.currentSiteUrl = details.url
        }
    };

    /**
     * 监听站点切换，通过监听站点切换下拉框站点对应的url
     * @param siteList
     */
    SellerSite.prototype.siteChangeListener = function (siteList) {

        if (siteList && Object.keys(siteList).length > 0) {
            $tool.log.success('开始监听：' + JSON.stringify(Object.keys(siteList)));
            let urls = Object.values(siteList);
            if (this.listener && chrome.webRequest.onBeforeRequest.hasListener(this.listener)) {
                chrome.webRequest.onBeforeRequest.removeListener(this.listener)

            }
            this.listener = this.newListener();
            chrome.webRequest.onBeforeRequest.addListener(this.listener, {urls: urls})
        } else {
            $tool.notify("站定列表为空,请先获取站点")
        }
    };

    SellerSite.prototype.getCurrentSiteUrl = function () {
        return this.currentSiteUrl;
    };
    SellerSite.prototype.init = function () {
        let that = this
        chrome.contextMenus.create({
            title: '获取亚马逊站点', // %s表示选中的文字
            onclick: function (params) {
                that.updateFromWeb()
            },
            documentUrlPatterns: $tool.config.matcheUrls
        });
        this.get(function (setting) {
            if (setting) {
                that.siteList = JSON.parse(setting)
                //  that.siteChangeListener(JSON.parse(setting))
            }
        })
    };
    let s = new SellerSite();
    s.init();
    $tool.fn.sellerSites = s
})(adTool);
