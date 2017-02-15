import liveapi from './binary_websockets';
import chartingRequestMap from '../charts/chartingRequestMap';
import $ from 'jquery';
import 'jquery-growl';
import 'common/util';

const barsTable = chartingRequestMap.barsTable;

const processCandles = (key, time, open, high, low, close) => {
   let bar = barsTable.chain()
      .find({time : time})
      .find({instrumentCdAndTp : key})
      .limit(1)
      .data();
   if (bar && bar.length > 0) {
      bar = bar[0];
      bar.open = open;
      bar.high = high;
      bar.low = low;
      bar.close = close;
      barsTable.update(bar);
   } else {
      barsTable.insert({
         instrumentCdAndTp : key,
         time: time,
         open: open,
         high: high,
         low: low,
         close: close
      });
   }
};

liveapi.events.on('candles', (data) => {
   const key = (data.echo_req.ticks_history + data.echo_req.granularity).toUpperCase();
   data.candles.forEach((eachData) => {
      const open  = parseFloat(eachData.open),
         high  = parseFloat(eachData.high),
         low   = parseFloat(eachData.low),
         close = parseFloat(eachData.close),
         time  = parseInt(eachData.epoch) * 1000;
      processCandles(key, time, open, high, low, close);
   });
   chartingRequestMap.barsLoaded(key);
});

liveapi.events.on('history', (data) => {
   //For tick history handling
   const key = (data.echo_req.ticks_history + '0').toUpperCase();
   data.history.times.forEach((eachData,index) => {
      const time = parseInt(eachData) * 1000,
         price = parseFloat(data.history.prices[index]);
      processCandles(key, time, price, price, price, price);    
   });
   chartingRequestMap.barsLoaded(key);
});

/**
 * @param timePeriod
 * @param instrumentCode
 * @param containerIDWithHash
 * @param instrumentName
 * @param series_compare
 */
export const retrieveChartDataAndRender = (options) => {
   const timePeriod = options.timePeriod,
      instrumentCode = options.instrumentCode,
      containerIDWithHash = options.containerIDWithHash,
      instrumentName = options.instrumentName,
      series_compare = options.series_compare;

   const key = chartingRequestMap.keyFor(instrumentCode, timePeriod);
   if (chartingRequestMap[key]) {
      /* Since streaming for this instrument+timePeriod has already been requested,
                   we just take note of containerIDWithHash so that once the data is received, we will just
                   call refresh for all registered charts */
      chartingRequestMap.subscribe(key, {
         containerIDWithHash : containerIDWithHash,
         series_compare : series_compare,
         instrumentCode : instrumentCode,
         instrumentName : instrumentName
      });
      /* We still need to call refresh the chart with data we already received
                   Use local caching to retrieve that data.*/
      chartingRequestMap.barsLoaded(key);
      return Promise.resolve();
   }

   const done_promise = chartingRequestMap.register({
      symbol: instrumentCode,
      granularity: timePeriod,
      subscribe: options.delayAmount === 0 ? 1 : 0,
      style: !isTick(timePeriod) ? 'candles' : 'ticks',
      count: 1000,          //We are only going to request 1000 bars if possible
      adjust_start_time: 1
   })
      .catch((err) => {
         const msg = 'Error getting data for %1'.i18n().replace('%1', instrumentName);
         require(["jquery", "jquery-growl"], ($) => $.growl.error({ message: msg }) );
         const chart = $(containerIDWithHash).highcharts();
         chart && chart.showLoading(msg);
         console.error(err);
      })
      .then((data) => {
         if (data && !data.error && options.delayAmount > 0) {
            //start the timer
            require(["jquery-growl"], () => $.growl.warning({
               message: instrumentName + ' feed is delayed by '.i18n() +
               options.delayAmount + ' minutes'.i18n()
            })
            );
            chartingRequestMap[key].timerHandler = setInterval(() => {
               let lastBar = barsTable.chain()
                  .find({instrumentCdAndTp : key})
                  .simplesort('time', true)
                  .limit(1)
                  .data();
               if (lastBar && lastBar.length > 0) {
                  lastBar = lastBar[0];
                  //requests new bars
                  //Send the WS request
                  const requestObject = {
                     "ticks_history": instrumentCode,
                     "end": 'latest',
                     //"count": count,
                     "start": (lastBar.time/1000) | 0,
                     "granularity":  convertToTimeperiodObject(timePeriod).timeInSeconds()
                  };
                  liveapi.send(requestObject);
               }
            }, 60*1000);
         }
      });

   chartingRequestMap[key].chartIDs.push({
      containerIDWithHash : containerIDWithHash,
      series_compare : series_compare,
      instrumentCode : instrumentCode,
      instrumentName : instrumentName
   });
   return done_promise;
}

export default {
   retrieveChartDataAndRender,
};
