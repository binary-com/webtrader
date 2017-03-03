ICHIMOKU = function(data, options, indicators) {
    this.tenkan_sen = [];
    this.kijun_sen = [];
    this.chikou_span = [];
    this.priceData = [];

    IndicatorBase.call(this, data, options, indicators);

    this.options = options;
    this.uniqueID = [uuid(), uuid(), uuid()];
    /* Tenkan sen is the average of highest and lowest over tenkanSenPeriod */
    this.calculateTenkanSen = function(arr, i) {
        if (i < options.tenkanSenPeriod) {
            return null;
        }
        var curr_price = indicators.getIndicatorOrPriceValue(arr[i], options.appliedTo);
        var max_ele = curr_price,
            min_ele = curr_price;
        for (var k = i - options.tenkanSenPeriod + 1; k <= i; k++) {
            var price = indicators.getIndicatorOrPriceValue(arr[k], options.appliedTo);
            max_ele = max_ele < price ? price : max_ele;
            min_ele = min_ele > price ? price : min_ele;
        }

        return toFixed((max_ele + min_ele) / 2, 4);
    }


    /* Kijun sen is the average of highest and lowest over kijunSenPeriod */
    this.calculateKijunSen = function(arr, i) {
        if (i < options.kijunSenPeriod) {
            return null;
        }
        var curr_price = indicators.getIndicatorOrPriceValue(arr[i], options.appliedTo);
        var max_ele = curr_price,
            min_ele = curr_price;
        for (var k = i - options.kijunSenPeriod + 1; k <= i; k++) {
            var price = indicators.getIndicatorOrPriceValue(arr[k], options.appliedTo);
            max_ele = max_ele < price ? price : max_ele;
            min_ele = min_ele > price ? price : min_ele;
        }

        return toFixed((max_ele + min_ele) / 2, 4);
    }

    //Chikou span is current closing price plotted chikouSpanPeriods behind the current time.
    this.calculateChikouSpan = function(arr, i) {
        if (i < arr.length - options.chikouSpanPeriod) {
            var curr_close = indicators.getIndicatorOrPriceValue(arr[i + options.chikouSpanPeriod], 3);
            return [arr[i].time, curr_close];
        }

    }

    for (var i = 0; i < data.length; i++) {
        this.tenkan_sen.push([data[i].time, this.calculateTenkanSen(data, i)]);
        this.kijun_sen.push([data[i].time, this.calculateKijunSen(data, i)]);
        this.chikou_span.push(this.calculateChikouSpan(data, i));
        this.priceData.push(data[i]);
    }
}

ICHIMOKU.prototype = Object.create(IndicatorBase.prototype);
ICHIMOKU.prototype.constructor = ICHIMOKU;

ICHIMOKU.prototype.addPoint = function(data) {
    this.priceData.push(data);
    var tenkan_sen = this.calculateTenkanSen(this.priceData, this.priceData.length - 1);
    this.tenkan_sen.push([data.time, tenkan_sen]);
    var kijun_sen = this.calculateKijunSen(this.priceData, this.priceData.length - 1);
    this.kijun_sen.push([data.time, kijun_sen]);
    var chikou_span = this.calculateChikouSpan(this.priceData, this.priceData.length - 1 - this.options.chikouSpanPeriod);
    this.chikou_span.push(chikou_span);
    return [{
        value: tenkan_sen,
        id: this.uniqueID[0]
    }, {
        value: kijun_sen,
        id: this.uniqueID[1]
    }, {
        id: this.uniqueID[2],
        value: chikou_span[1],
        time: chikou_span[0]
    }]
}

ICHIMOKU.prototype.update = function(data) {
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var tenkan_sen = this.calculateTenkanSen(this.priceData, index);
    this.tenkan_sen[index][1] = tenkan_sen;
    var kijun_sen = this.calculateKijunSen(this.priceData, index);
    this.kijun_sen[index][1] = kijun_sen;
    var chikou_span = this.calculateChikouSpan(this.priceData, index - this.options.chikouSpanPeriod);
    this.chikou_span.push(chikou_span);
    return [{
        id: this.uniqueID[0],
        value: tenkan_sen
    }, {
        id: this.uniqueID[1],
        value: kijun_sen
    }, {
        id: this.uniqueID[2],
        value: chikou_span[1]
    }]
}

ICHIMOKU.prototype.buildSeriesAndAxisConfFromData = function(indicatorMetadata) {
    return [{
        seriesConf: {
            id: this.uniqueID[0],
            name: 'Tenkan Sen - ' + this.toString(),
            data: this.tenkan_sen,
            type: 'line',
            color: this.options.tenkanSenStroke,
            lineWidth: this.options.width,
            dashStyle: this.options.dashStyle,
            onChartIndicator: true
        }
    }, {
        seriesConf: {
            id: this.uniqueID[1],
            name: 'Kijun Sen - ' + this.toString(),
            data: this.kijun_sen,
            type: 'line',
            color: this.options.kijunSenStroke,
            lineWidth: this.options.width,
            dashStyle: this.options.dashStyle,
            onChartIndicator: true
        }
    }, {
        seriesConf: {
            id: this.uniqueID[2],
            name: 'Chikou Span - ' + this.toString(),
            data: this.chikou_span,
            type: 'line',
            color: this.options.chikouSpanStroke,
            lineWidth: this.options.width,
            dashStyle: this.options.dashStyle,
            onChartIndicator: true
        }
    }];
}

ICHIMOKU.prototype.getIDs = function() {
    return this.uniqueID;
};

ICHIMOKU.prototype.isSameInstance = function(uniqueIDArr) {
    return _.isEqual(uniqueIDArr.sort(), this.uniqueID);
};

ICHIMOKU.prototype.toString = function() {
    return 'Ichimoku (' + this.options.tenkanSenPeriod + ', ' + this.options.kijunSenPeriod + ')';
};
