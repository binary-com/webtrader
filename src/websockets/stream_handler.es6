import $ from 'jquery';
import liveapi from './binary_websockets';
import chartingRequestMap from '../charts/chartingRequestMap';
import 'common/util';


const barsTable = chartingRequestMap.barsTable;

const setExtremePointsForXAxis = (chart, startTime, endTime) => {
   chart.xAxis.forEach((xAxis) => {
      if (!startTime) startTime = xAxis.getExtremes().min;
      if (!endTime) endTime = xAxis.getExtremes().max;
      xAxis.setExtremes(startTime, endTime);
   });
}

liveapi.events.on('tick', (data) => {
   let key = data.echo_req.ticks_history + data.echo_req.granularity;
   if (key && chartingRequestMap[key.toUpperCase()]) {
      key = key.toUpperCase();

      const price = parseFloat(data.tick.quote);
      const time = parseInt(data.tick.epoch) * 1000;

      const chartingRequest = chartingRequestMap[key];
      const granularity = data.echo_req.granularity || 0;
      chartingRequest.id = chartingRequest.id || data.tick.id;

      if(granularity === 0) {
         const tick = {
            instrumentCdAndTp: key,
            time: time,
            open: price,
            high: price,
            low: price,
            close: price,
            /* this will be used from trade confirmation dialog */
            price: data.tick.quote, /* we need the original value for tick trades */
         }
         barsTable.insert(tick);
         /* notify subscribers */
         let preTick = tick;
         const bars = barsTable.chain()
            .find({ instrumentCdAndTp: key })
            .simplesort('time', true)
            .limit(2).data();
         if (bars.length > 1)
            preTick = bars[1];
         fire_event('tick', { tick: tick, key: key, preTick: preTick });

         if (!(chartingRequest.chartIDs && chartingRequest.chartIDs.length > 0)) {
            return;
         }
         //notify all registered charts
         for(let i = 0; i < chartingRequest.chartIDs.length; i++) {
            const chartID = chartingRequest.chartIDs[i];
            const chart = $(chartID.containerIDWithHash).highcharts();
            if (!chart) return;

            const series = chart.get(key);
            if (!series) return;

            series.addPoint([time, price]);
            //setExtremePointsForXAxis(chart, time);

         };

      }

   }
});

liveapi.events.on('ohlc', (data) => {
   let key = data.ohlc.symbol + data.ohlc.granularity;
   if (key && chartingRequestMap[key.toUpperCase()]) {
      key = key.toUpperCase();
      // TODO: 1-consume this notification 2-do not use global notifications, use a better approach.
      $(document).trigger("feedTypeNotification", [key, "realtime-feed"]);

      const open = parseFloat(data.ohlc.open);
      const high = parseFloat(data.ohlc.high);
      const low = parseFloat(data.ohlc.low);
      const close = parseFloat(data.ohlc.close);
      const time = parseInt(data.ohlc.open_time) * 1000;

      const chartingRequest = chartingRequestMap[key];
      chartingRequest.id = chartingRequest.id || data.ohlc.id;
      if (!(chartingRequest.chartIDs && chartingRequest.chartIDs.length > 0)) {
         return;
      }
      const timePeriod = $(chartingRequest.chartIDs[0].containerIDWithHash).data('timePeriod');
      if (!timePeriod) {
         return;
      }

      let bar = barsTable.chain()
         .find({ '$and': [{instrumentCdAndTp: key}, {time : time}] })
         .simplesort("time", true)
         .limit(1)
         .data();
      let isNew = false;
      if (!bar || bar.length <= 0) {
         bar = {
            instrumentCdAndTp: key,
            time: time,
            open: open,
            high: high,
            low: low,
            close: close
         };
         barsTable.insert(bar);
         isNew = true;
      } else {
         bar = bar[0];
         bar.open = open;
         bar.high = high;
         bar.low = low;
         bar.close = close;
         barsTable.update(bar);
      }

      let preOhlc = bar;
      const bars = barsTable.chain()
         .find({ instrumentCdAndTp: key })
         .simplesort('time', true)
         .limit(2).data();
      if (bars.length > 1) {
         preOhlc = bars[1];
      }
      /* notify subscribers */
      fire_event('ohlc', { ohlc: bar, is_new: isNew, key: key, preOhlc: preOhlc });

      //notify all registered charts
      for(let i = 0;i < chartingRequest.chartIDs.length; i++){
         const chartID = chartingRequest.chartIDs[i];
         const chart = $(chartID.containerIDWithHash).highcharts();
         if (!chart) return;

         const series = chart.get(key);
         if (!series) return;

         const type = $(chartID.containerIDWithHash).data('type');

         const last = series.data[series.data.length - 1];
         if (series.options.data.length != series.data.length) {
            //TODO - This is an error situation
            setExtremePointsForXAxis(chart, null, bar.time);
            return;
         }

         if (type && isDataTypeClosePriceOnly(type)) {//Only update when its not in loading mode
            if (isNew) {
               series.addPoint([time, close], true, true, false);
            } else {
               last.update({
                  y : close
               });
            }
         } else {
            if (isNew) {
               series.addPoint([time, open, high, low, close], true, true, false);
            } else {
               last.update({
                  open : open,
                  high : high,
                  low : low,
                  close : close
               });
            }
         }
      };
   }
});

const callbacks = { };
/* fire a custom event and call registered callbacks(api.events.on(name)) */
const fire_event = (name , ...args) => {
   const fns = callbacks[name] || [];
   fns.forEach(
      (cb) => setTimeout( () => cb.apply(undefined, args), 0)
   );
};

export const events = {
   on: (name, cb) => {
      (callbacks[name] = callbacks[name] || []).push(cb);
      return cb;
   },
   off: (name, cb) => {
      if(callbacks[name]) {
         const index = callbacks[name].indexOf(cb);
         index !== -1 && callbacks[name].splice(index, 1);
      }
   }
};
export default {
   events
};
