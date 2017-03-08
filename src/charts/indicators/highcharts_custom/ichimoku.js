/*
 * Created by Apoorv Joshi on 28/02/2017
 */
ICHIMOKU = function(data, options, indicators) {
    this.tenkan_sen = [];
    this.kijun_sen = [];
    this.chikou_span = [];
    this.senkou_span_a = [];
    this.senkou_span_b = [];
    this.priceData = [];
    var time_period = data[1].time * 1 - data[0].time * 1;

    IndicatorBase.call(this, data, options, indicators);

    this.options = options;
    this.uniqueID = [uuid(), uuid(), uuid(), uuid(), uuid(), uuid()];
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
        if (i > options.chikouSpanPeriod) {
            var curr_close = indicators.getIndicatorOrPriceValue(arr[i], 3);
            var time = arr[i].time - this.options.chikouSpanPeriod * time_period;
            return [time, curr_close];
        } else {
            return [arr[i].time, null];
        }

    }

    //Senkou span a is (tenkan_sen+kijun_sen)/2 plotted senkouSpanAPeriods ahead.
    this.calculateSenkouSpanA = function(arr, i) {
        var time = arr[i].time * 1 + (this.options.senkouSpanAPeriod * 1) * time_period;
        if (i < this.options.senkouSpanAPeriod || !this.tenkan_sen[i][1] || !this.kijun_sen[i][1])
            return [time, null];
        return [time, toFixed((this.tenkan_sen[i][1] + this.kijun_sen[i][1]) / 2, 4)];
    }

    //Senkou span b is (max+min)/2 over senkouSpanBPeriods.
    this.calculateSenkouSpanB = function(arr, i) {
        var time = arr[i].time * 1 + 22 * time_period;
        if (i < options.senkouSpanBPeriod)
            return [time, null];
        var curr_price = indicators.getIndicatorOrPriceValue(arr[i], options.appliedTo);
        var max_ele = curr_price,
            min_ele = curr_price;
        for (var k = i - options.senkouSpanBPeriod + 1; k <= i; k++) {
            var price = indicators.getIndicatorOrPriceValue(arr[k], options.appliedTo);
            max_ele = max_ele < price ? price : max_ele;
            min_ele = min_ele > price ? price : min_ele;
        }
        return [time, toFixed((max_ele + min_ele) / 2, 4)];
    }

    for (var i = 0; i < data.length; i++) {
        this.tenkan_sen.push([data[i].time, this.calculateTenkanSen(data, i)]);
        this.kijun_sen.push([data[i].time, this.calculateKijunSen(data, i)]);
        this.chikou_span.push(this.calculateChikouSpan(data, i));
        var senkou_span_a = this.calculateSenkouSpanA(data, i);
        this.senkou_span_a.push(senkou_span_a);
        var senkou_span_b = this.calculateSenkouSpanB(data, i);
        this.senkou_span_b.push(senkou_span_b);
        this.priceData.push(data[i]);
    }
    
}

ICHIMOKU.prototype = Object.create(IndicatorBase.prototype);
ICHIMOKU.prototype.constructor = ICHIMOKU;

ICHIMOKU.prototype.addPoint = function(data) {
    this.priceData.push(data);
    var index = this.priceData.length - 1
    var tenkan_sen = this.calculateTenkanSen(this.priceData, index);
    //this.tenkan_sen.push([data.time, tenkan_sen]);
    var kijun_sen = this.calculateKijunSen(this.priceData, index);
    //this.kijun_sen.push([data.time, kijun_sen]);
    var chikou_span = this.calculateChikouSpan(this.priceData, index);
    //this.chikou_span.push(chikou_span);
    var senkou_span_a = this.calculateSenkouSpanA(this.priceData, index - 1);
    //this.senkou_span_a.push(senkou_span_a);
    var senkou_span_b = this.calculateSenkouSpanB(this.priceData, this.priceData.length - 1);
    //this.senkou_span_b.push(senkou_span_b);
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
    }, {
        id: this.uniqueID[3],
        value: senkou_span_a[1],
        time: senkou_span_a[0]
    }, {
        id: this.uniqueID[4],
        value: senkou_span_b[1],
        time: senkou_span_b[0]
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
    var chikou_span = this.calculateChikouSpan(this.priceData, index);
    this.chikou_span[index] = chikou_span;
    var senkou_span_a = this.calculateSenkouSpanA(this.priceData, index);
    this.senkou_span_a[index] = senkou_span_a;
    var senkou_span_b = this.calculateSenkouSpanB(this.priceData, index);
    this.senkou_span_b[index] = senkou_span_b;
    return [{
        id: this.uniqueID[0],
        value: tenkan_sen
    }, {
        id: this.uniqueID[1],
        value: kijun_sen
    }, {
        id: this.uniqueID[2],
        value: chikou_span[1]
    }, {
        id: this.uniqueID[3],
        value: senkou_span_a[1]
    }, {
        id: this.uniqueID[4],
        value: senkou_span_b[1]
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
    }, {
        seriesConf: {
            id: this.uniqueID[3],
            name: 'Senkou Span A - ' + this.toString(),
            data: this.senkou_span_a,
            type: 'line',
            color: this.options.senkouSpanAStroke,
            lineWidth: this.options.width,
            dashStyle: this.options.dashStyle,
            onChartIndicator: true
        }
    }, {
        seriesConf: {
            id: this.uniqueID[4],
            name: 'Senkou Span B - ' + this.toString(),
            data: this.senkou_span_b,
            type: 'line',
            color: this.options.senkouSpanBStroke,
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
    return 'Ichimoku (' + this.options.tenkanSenPeriod + ', ' + this.options.kijunSenPeriod + ', ' +
        this.options.chikouSpanPeriod + ', ' + this.options.senkouSpanAPeriod + ')';
};
