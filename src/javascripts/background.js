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
                this.updateLatestInfo(this.getPriceInfo(res));   
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

        getPriceInfo: function (res) {
            var oldprice = localStorage.price;

            var color = "";
            var price = res[0][markets[config.default_market].key];
            price = (!price || isNaN(price)) ?
                0 : parseFloat(price);
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
            return price;
        },

        getDescendantProp: function (res, desc) {
            var arr = desc.split(".");
            while(arr.length && (res = res[arr.shift()]));
            return res;
        },

        updateLatestInfo: function (price) {
            this.updateBadge(price);
        },

        updateBadge: function (price) {
            chrome.browserAction.setBadgeText({
                text: ('' + price).substring(0,6)                
            });
        }
    };

    return SBT;

})().init();
