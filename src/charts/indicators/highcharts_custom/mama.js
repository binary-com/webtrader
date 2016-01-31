/**
 * Created by Mahboob.M on 1/30/16.
 */

MAMA = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    this.smooth = [], this.detrender = [], this.period = [],
    this.I1 = [], this.Q1 = [], this.I2 = [], this.Q2 = [],
    this.Re = [], this.Im = [], this.smoothPeriod = [], this.phase = [];

    this.CalculateMAMAValue = function (data, index) {
        /* MAMA :
         /*FORMULA
         Inputs: Price((H+L)/2),   FastLimit(.5),   SlowLimit(.05);
         Vars: Smooth(0),   Detrender(0),   I1(0),   Q1(0),   jI(0),  jQ(0),  I2(0),  Q2(0),  Re(0),   Im(0),   Period(0),  SmoothPeriod(0),  Phase(0),  DeltaPhase(0),  alpha(0),  MAMA(0),       FAMA(0);
         If CurrentBar > 5 then begin
         Smooth = (4*Price + 3*Price[1] + 2*Price[2] + Price[3]) / 10;
         Detrender = (.0962*Smooth + .5769*Smooth[2] - .5769*Smooth[4] - .0962*Smooth[6])*(.075*Period[1] + .54);
         //Compute InPhase and Quadrature components
         Q1 = (.0962*Detrender + .5769*Detrender[2] - .5769*Detrender[4] - .0962*Detrender[6])*(.075*Period[1] + .54);
         I1 = Detrender[3];
         //{Advance the phase of I1 and Q1 by 90 degrees}
         jI = (.0962*I1 + .5769*I1[2] - .5769*I1[4] - .0962*I1[6])*(.075*Period[1] + .54);
         jQ = (.0962*Q1 + .5769*Q1[2] - .5769*Q1[4] - .0962*Q1[6])*(.075*Period[1] + .54);
         //{Phasor addition for 3 bar averaging)}
         I2 = I1 - jQ;
         Q2 = Q1 + jI;
         //{Smooth the I and Q components before applying the discriminator}
         I2 = .2*I2 + .8*I2[1];
         Q2 = .2*Q2 + .8*Q2[1];
         //{Homodyne Discriminator}
         Re = I2*I2[1] + Q2*Q2[1];
         Im = I2*Q2[1] - Q2*I2[1];
         Re = .2*Re + .8*Re[1];
         Im = .2*Im + .8*Im[1];
         If Im <> 0 and Re <> 0 then Period = 360/ArcTangent(Im/Re);
         If Period > 1.5*Period[1] then Period = 1.5*Period[1];
         If Period < .67*Period[1] then Period = .67*Period[1];
         If Period < 6 then Period = 6;
         If Period > 50 then Period = 50;
         Period = .2*Period + .8*Period[1];
         SmoothPeriod = .33*Period + .67*SmoothPeriod[1];
         If I1 <> 0 then Phase = (ArcTangent(Q1 / I1));
         DeltaPhase = Phase[1] - Phase;
         If DeltaPhase < 1 then DeltaPhase = 1;
         alpha = FastLimit / DeltaPhase;
         If alpha < SlowLimit then alpha = SlowLimit;
         MAMA = alpha*Price + (1 - alpha)*MAMA[1];
         FAMA = .5*alpha*MAMA + (1 - .5*alpha)*FAMA[1];
         End; */
        var mamaValue = this.indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo);
        if (index <= 10) {
            this.smooth.push(0);
            this.detrender.push(0);
            this.I1.push(0);
            this.Q1.push(0);
            this.I2.push(0);
            this.Q2.push(0);
            this.Re.push(0);
            this.Im.push(0);
            this.period.push(0);
            this.smoothPeriod.push(0);
            this.phase.push(0);
        }
        else if (index > 10) {
            this.smooth.push((4 * this.indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo)
                + 3 * this.indicators.getIndicatorOrPriceValue(data[index - 1], this.options.appliedTo)
                + 2 * this.indicators.getIndicatorOrPriceValue(data[index - 2], this.options.appliedTo)
                + 1 * this.indicators.getIndicatorOrPriceValue(data[index - 3], this.options.appliedTo)) / 10);

            this.detrender.push((0.0962 * this.smooth[index]
                + 0.5769 * this.smooth[index - 2]
                + 0.5769 * this.smooth[index - 4]
                + 0.0962 * this.smooth[index - 6]) * (0.075 * this.period[index - 1] + 0.054));

            //Compute InPhase and Quadrature components
            this.Q1.push((0.0962 * this.detrender[index]
                + 0.5769 * this.detrender[index - 2]
                + 0.5769 * this.detrender[index - 4]
                + 0.0962 * this.detrender[index - 6]) * (0.075 * this.period[index - 1] + 0.054));
            this.I1.push(this.detrender[index - 3]);

            //Advance the this.phase of this.I1 and this.Q1 by 90º
            var jI = (0.0962 * this.I1[index]
                + 0.5769 * this.I1[index - 2]
                + 0.5769 * this.I1[index - 4]
                + 0.0962 * this.I1[index - 6]) * (0.075 * this.period[index - 1] + 0.054);
            var jQ = (0.0962 * this.Q1[index]
                + 0.5769 * this.Q1[index - 2]
                + 0.5769 * this.Q1[index - 4]
                + 0.0962 * this.Q1[index - 6]) * (0.075 * this.period[index - 1] + 0.054);

            //Phasor addition for 3 bar averaging
            this.I2.push(this.I1[index] - jQ);
            this.Q2.push(this.Q1[index] + jI);

            //Smooth the I and Q components before applying the discriminator
            this.I2[index] = 0.2 * this.I2[index] + 0.8 * this.I2[index - 1];
            this.Q2[index] = 0.2 * this.Q2[index] + 0.8 * this.Q2[index - 1];

            //{Homodyne Discriminator}
            this.Re.push(this.I2[index] * this.I2[index - 1] + this.Q2[index] * this.Q2[index - 1]);
            this.Im.push(this.I2[index] * this.Q2[index - 1] - this.Q2[index] * this.I2[index - 1]);

            this.Re[index] = 0.2 * this.Re[index] + 0.8 * this.Re[index - 1];
            this.Im[index] = 0.2 * this.Im[index] + 0.8 * this.Im[index - 1];

            this.period.push(0);
            if (this.Im[index] !== 0.0 && this.Re[index] !== 0.0)
                this.period[index] = (360 / (Math.atan(this.Im[index] / this.Re[index]) * (180.0 / 3.14159265359)));
            if (this.period[index] > 1.5 * this.period[index - 1])
                this.period[index] = (1.5 * this.period[index - 1]);
            if (this.period[index] < 0.67 * this.period[index - 1])
                this.period[index] = (0.67 * this.period[index - 1]);
            if (this.period[index] < 6)
                this.period[index] = 6;
            if (this.period[index] > 50)
                this.period[index] = 50;
            this.period[index] = 0.2 * this.period[index] + 0.8 * this.period[index - 1];
            this.smoothPeriod.push(0.33 * this.period[index] + 0.67 * this.smoothPeriod[index - 1]);

            this.phase.push(0);
            if (this.I1[index] !== 0.0)
                this.phase[index] = Math.atan(this.Q1[index] / this.I1[index]) * (180.0 / 3.14159265359);
            var deltaPhase = this.phase[index - 1] - this.phase[index];
            if (deltaPhase < 1)
                deltaPhase = 1;
            var alpha = this.options.fastLimit / deltaPhase;
            if (alpha < this.options.slowLimit)
                alpha = this.options.slowLimit;
            if (alpha > this.options.fastLimit)
                alpha = this.options.fastLimit;
            mamaValue = alpha * this.indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo) + (1 - alpha) * this.indicatorData[index - 1].value;
        }
        return toFixed(mamaValue, 4);
    };

    for (var index = 0; index < data.length; index++) {
        var mama = this.CalculateMAMAValue(data, index);
        this.indicatorData.push({ time: data[index].time, value: mama });
        this.priceData.push(data[index]);
    }
};

MAMA.prototype = Object.create(IndicatorBase.prototype);
MAMA.prototype.constructor = MAMA;

MAMA.prototype.addPoint = function (data) {
    console.log('Adding MAMA data point : ', data);
    this.priceData.push(data);
    var mama = this.CalculateMAMAValue(this.priceData, this.priceData.length - 1);
    this.indicatorData.push({ time: data.time, value: mama });
    return [{
        id: this.uniqueID,
        value: mama
    }];
};

MAMA.prototype.update = function (data) {
    console.log('Updating MAMA data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var mama = this.CalculateMAMAValue(this.priceData, index);
    this.indicatorData[index].value = mama;
    return [{
        id: this.uniqueID,
        value: mama
    }];
};

MAMA.prototype.toString = function () {
    return 'MAMA (' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
