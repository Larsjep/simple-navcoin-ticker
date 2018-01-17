(function() {
    /**
     * Extension Config && Default Values
     * @type {Object}
     */
    var defaultVals = {
        'refresh_time': 15000,
        'default_market': 'coinmarketcap'
    };

    var markets = {
        'coinmarketcap': {
            url: 'https://api.coinmarketcap.com/v1/ticker/nav-coin/',
            key: 'price_usd'
        }
    };

    var config = {};

    var SBT = {

        init: function () {
            this.resetCurrentVals();
            this.startRequesting();
            this.bindEvents();
        },

        resetCurrentVals: function () {
            for (var key in defaultVals) {
                config[key] = localStorage[key] || defaultVals[key];
            }
        },

        bindEvents: function() {
            var self = this;
            chrome.browserAction.onClicked.addListener(function() {
                self.restartRequesting();
            });
        },

        handleSingleRequestResult: function (raw) {
            try {
                var res = JSON.parse(raw);
                var price = this.getPrice(res);
                this.updateBadge(price);
                this.updateTooltip(price, res);
            } catch (e) {
                // exception
            }
        },

        restartRequesting: function () {
            var self = this;
            window.clearInterval(self.globalIntervalId);
            this.startRequesting();
        },

        ReadyStateChange: function (obj, funcScope, funcName) { 
            return function () { 
                if (obj.readyState == 4 && obj.status == 200) { 
                    funcScope[funcName](obj.responseText); 
                }
            };
        },

        startRequesting: function () {
            var self = this;
            this.handleSingleRequest();
            this.globalIntervalId = window.setInterval(function () {
                self.handleSingleRequest();
                self.resetCurrentVals();
            }, config.refresh_time);
        },

        handleSingleRequest: function () {
            var req = new XMLHttpRequest(),
                url = markets[config.default_market].url;
            req.open("GET", url, true);
            req.onreadystatechange = this.ReadyStateChange(req, this, 'handleSingleRequestResult');
            req.send(null);
        },

        getPrice: function (res) {
            var price = res[0][markets[config.default_market].key];
            price = (!price || isNaN(price)) ? 0 : parseFloat(price);
            return price;
        },

        updateBadge: function (price) {
            var oldprice = localStorage.price;

            var color = "";
            localStorage.price=price;

            if(oldprice > price) {
                color = {color:[255,0,0,255]};
            }
            else if(oldprice < price) {
                color = {color:[0,186,0,255]};
            }
            else{
                color = {color:[75,75,75,255]};
            }
            chrome.browserAction.setBadgeBackgroundColor(color);
            chrome.browserAction.setBadgeText({
                text: ('' + price).substring(0,6)                
            });
        },

        getDescendantProp: function (res, desc) {
            var arr = desc.split(".");
            while(arr.length && (res = res[arr.shift()]));
            return res;
        },

        updateBadge: function (price) {
            chrome.browserAction.setBadgeText({
                text: ('' + price).substring(0,6)                
            });
        },
        updateTooltip: function (price, res) {
            var title = 'NAVCoin'
            title += "\nPrice:\t\t" + price.toFixed(3) + '$'
            title += "\nPrice satoshi:\t" + (parseFloat(res[0]["price_btc"])*100000000).toFixed(0) 
            title += "\nMarket cap:\t" + parseFloat(res[0]["market_cap_usd"]).toFixed(0) + '$'            
            title += "\n24h Volume:\t" + parseFloat(res[0]["24h_volume_usd"]).toFixed(0) + '$'
            title += "\nChange 1 hour:\t" + parseFloat(res[0]["percent_change_1h"]).toFixed(1) + '%'
            title += "\nChange 24 hours:\t" + parseFloat(res[0]["percent_change_24h"]).toFixed(1) + '%'
            title += "\nChange 7 days:\t" + parseFloat(res[0]["percent_change_7d"]).toFixed(1) + '%'
            title += "\nRank\t\t" + res[0]["rank"]
            chrome.browserAction.setTitle({ title: title });
        }
    };

    return SBT;

})().init();
