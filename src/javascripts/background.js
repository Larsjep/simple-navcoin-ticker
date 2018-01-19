(function() {
    /**
     * Extension Config && Default Values
     * @type {Object}
     */
    var defaultVals = {
        'refresh_time': 15000,
        'default_market': 'coinmarketcap',
        'display_currency': 'usd'
    };

    var markets = {
        'coinmarketcap': {
            url: 'https://api.coinmarketcap.com/v1/ticker/nav-coin/',
            key: 'price_usd'
        }
    };

    var curreny_symbols = {
        BRL: ' R$',
        DKK: ' kr',
        USD: '$',
        EUR: '€',
        JPY: '¥',
        GBP: '£'
    }

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
                url = markets[config.default_market].url + '?convert=' + config.display_currency;
            req.open("GET", url, true);
            req.onreadystatechange = this.ReadyStateChange(req, this, 'handleSingleRequestResult');
            req.send(null);
        },

        getPrice: function (res) {
            var price = res[0]["price_" + config.display_currency.toLowerCase()];
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
            var floor_price = Math.floor(price);
            // Get the number of digits the price has
            var numDigits = Math.floor(Math.log(floor_price) * Math.LOG10E + 1);
            var badgeText = "";
            if (numDigits < 4)
            {
                badgeText = price.toLocaleString(undefined, {minimumFractionDigits: 4}).substring(0,6)
            }
            else if (numDigits == 4)
            {
                badgeText = price.toFixed(3).substring(0,6);
            }
            else
            {
                badgeText = price.toFixed(0).substring(0,3) + '+'
            }
            chrome.browserAction.setBadgeText({text: badgeText});

        },

        getDescendantProp: function (res, desc) {
            var arr = desc.split(".");
            while(arr.length && (res = res[arr.shift()]));
            return res;
        },

        updateTooltip: function (price, res) {
            var title = 'NAVCoin'
            var currency = config.display_currency.toLowerCase();
            var currency_sym = curreny_symbols[config.display_currency] || ' ' + config.display_currency;
            title += "\nPrice:\t\t" + price.toLocaleString() + currency_sym
            title += "\nPrice BTC:\t\t" + (parseFloat(res[0]["price_btc"])*100000000).toFixed(0) + ' satoshi' 
            title += "\nMarket cap:\t" + parseFloat(res[0]["market_cap_" + currency]).toLocaleString(undefined, {maximumFractionDigits: 0}) + currency_sym
            title += "\n24h Volume:\t" + parseFloat(res[0]["24h_volume_" + currency]).toLocaleString(undefined, {maximumFractionDigits: 0}) + currency_sym
            title += "\nChange 1 hour:\t" + parseFloat(res[0]["percent_change_1h"]).toFixed(1) + '%'
            title += "\nChange 24 hours:\t" + parseFloat(res[0]["percent_change_24h"]).toFixed(1) + '%'
            title += "\nChange 7 days:\t" + parseFloat(res[0]["percent_change_7d"]).toFixed(1) + '%'
            title += "\nRank\t\t" + res[0]["rank"]
            chrome.browserAction.setTitle({ title: title });
        }
    };

    return SBT;

})().init();
