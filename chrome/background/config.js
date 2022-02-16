(function ($tool) {
    let Config = function () {
        this.matcheUrls = [
            "*://sellercentral.amazon.co.uk/*",
            "*://sellercentral.amazon.de/*",
            "*://sellercentral.amazon.fr/*",
            "*://sellercentral.amazon.it/*",
            "*://sellercentral.amazon.es/*",
            "*://sellercentral.amazon.nl/*",
            "*://sellercentral.amazon.ca/*",
            "*://sellercentral.amazon.com/*",
            "*://sellercentral.amazon.com.br/*",
            "*://sellercentral.amazon.com.mx/*",
            "*://sellercentral.amazon.com.au/*",
            "*://sellercentral.amazon.sg/*",
            "*://sellercentral-japan.amazon.com/*"
        ]
    }
    $tool.fn.config = new Config()
})(adTool)