(function ($tool) {

    let Utils = function () {

    }
    /**
     *  从RUL中获取参数
     * @param url
     * @returns {{}}
     */
    Utils.prototype.getParamsFromUrl = function (url) {
        let params = {};
        let urls = url.split("?");
        let arr = urls[1].split("&");
        for (let i = 0, l = arr.length; i < l; i++) {
            let a = arr[i].split("=");
            params[a[0]] = a[1];
        }
        return params;
    };

    $tool.fn.utils = new Utils()
})(adTool)