/**
 * Created by Mahboob.M on 2/3/16.
 */

AROONOSC = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];

    this.CalculateAROONOSCValue = function (data, index) {
        /* AROONOSC :
        Aroon Up = 100 x (25 - Days Since 25-day High)/25
        Aroon Down = 100 x (25 - Days Since 25-day Low)/25
        Aroon Oscillator = Aroon-Up  -  Aroon-Down*/
        var max = data[index].high;
        var min = data[index].low;
        var HH = 0, LL = 0;
        for (var i = 0; i < this.options.period; i++) {
            if (data[index - i].high > max) {
                max = data[index - i].high;
                HH = i;
            }
            if (data[index - i].low < min) {
                min = data[index - i].low;
                LL = i;
            }
        };
        var aroonUp = ((this.options.period - HH) / this.options.period) * 100;
        var aroonDown = ((this.options.period - LL) / this.options.period) * 100;
        return (aroonUp - aroonDown);
    };

    for (var index = 0; index < data.length; index++) {
        if (index >= (this.options.period - 1)) {
            var aroonosc = this.CalculateAROONOSCValue(data, index);
            this.indicatorData.push({ time: data[index].time, value: aroonosc });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

AROONOSC.prototype = Object.create(IndicatorBase.prototype);
AROONOSC.prototype.constructor = AROONOSC;

AROONOSC.prototype.addPoint = function (data) {
    console.log('Adding AROONOSC data point : ', data);
    this.priceData.push(data);
    var aroonosc = this.CalculateAROONOSCValue(this.priceData, this.priceData.length - 1);
    this.indicatorData.push({ time: data.time, value: aroonosc });
    return [{
        id: this.uniqueID,
        value: aroonosc
    }];
};

AROONOSC.prototype.update = function (data) {
    console.log('Updating AROONOSC data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var aroonosc = this.CalculateAROONOSCValue(this.priceData, index);
    this.indicatorData[index].value = aroonosc;
    return [{
        id: this.uniqueID,
        value: aroonosc
    }];
};

AROONOSC.prototype.toString = function () {
    return 'AROONOSC (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
