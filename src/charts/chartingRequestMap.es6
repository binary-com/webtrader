/**
 * Created by amin on October 15,2015.
 */

/**
    Key is instrumentCode+timePeriod(in seconds), Value is
        {
            timerHandler : ,
            chartIDs : [
                {
                    containerIDWithHash : containerIDWithHash,
                    series_compare : series_compare,
                    instrumentCode : instrumentCode,
                    instrumentName : instrumentName
                }
            ]
        }
**/
import _ from 'lodash';
import $ from 'jquery';
import liveapi from 'websockets/binary_websockets';
import 'jquery-growl';
import 'common/util';

export const keyFor = (symbol, granularity_or_timeperiod) => {
    let granularity = granularity_or_timeperiod || 0;
    if (typeof granularity === 'string') {
        granularity = convertToTimeperiodObject(granularity).timeInSeconds();
    }
    return (symbol + granularity).toUpperCase();
};

/*  options: {
      symbol,
      granularity: // could be a number or a string in 1t, 2m, 3h, 4d format.
                   // if a string is present it will be converted to seconds
      subscribe: // default = 1,
      style: // default = 'ticks',
      count: // default = 1,
      adjust_start_time?: // only will be added to the request if present
    }
    will return a promise
*/
export const register = function(options) {
    const map = this;
    const key = map.keyFor(options.symbol, options.granularity);

    let granularity = options.granularity || 0;
    //If granularity = 0, then style should be ticks
    const style = (granularity == 0 || !options.style) ? 'ticks' : options.style;

    let is_tick = true;
    if (typeof granularity === 'string') {
        if ($.trim(granularity) === '0') {
           ;// do nothing
        } else if ($.trim(granularity).toLowerCase() === '1t') {
            granularity = convertToTimeperiodObject(granularity).timeInSeconds();
        } else {
            is_tick = false;
            granularity = convertToTimeperiodObject(granularity).timeInSeconds();
        }
    }

    const req = {
        "ticks_history": options.symbol,
        "count": options.count || 1,
        "end": 'latest',
        "style": style
    };

    if (granularity) {
        req.granularity = granularity;
    }

    if (options.subscribe === 1) {
        req.subscribe = 1;
    }

    if (!is_tick) {
        const count = options.count || 1;
        let start = (new Date().getTime() / 1000 - count * granularity) | 0;

        //If the start time is less than 3 years, adjust the start time
        const _3YearsBack = new Date();
        _3YearsBack.setUTCFullYear(_3YearsBack.getUTCFullYear() - 3);
        //Going back exactly 3 years fails. I am adding 1 day
        _3YearsBack.setDate(_3YearsBack.getDate() + 1);

        if ((start * 1000) < _3YearsBack.getTime()) { start = (_3YearsBack.getTime() / 1000) | 0; }

        req.style = 'candles';
        req.start = start;
        req.adjust_start_time = options.adjust_start_time || 1;
    }

    map[key] = { symbol: options.symbol, granularity: granularity, subscribers: 0, chartIDs: [] };
    if (req.subscribe) map[key].subscribers = 1; // how many charts have subscribed for a stream
    return liveapi.send(req, /*timeout:*/ 30 * 1000) // 30 second timeout
        .catch((up) => {
            /* if the market is closed try the same request without subscribing */
            if (req.subscribe && up.code === 'MarketIsClosed') {
                $.growl.notice({ message: options.symbol + ' market is presently closed.'.i18n() });
                delete req.subscribe;
                map[key].subscribers -= 1;
                return liveapi.send(req, 30 * 1000);
            }
            delete map[key];
            throw up;
        });
}

/* use this method if there is already a stream with this key registered,
  if you are counting on a registered stream and don't call this method that stream might be removed,
  when all dependent modules call unregister function.
  you should also make sure to call unregister when you no longer need the stream to avoid "stream leack!" */
export const subscribe = function(key, chartID) {
    const map = this;
    if (!map[key]) {
        return;
    }
    map[key].subscribers += 1;
    if (chartID) {
        map[key].chartIDs.push(chartID);
    }
}

export const unregister = function(key, containerIDWithHash) {
    const map = this;
    if (!map[key]) {
        return;
    }
    if (containerIDWithHash) {
        _.remove(map[key].chartIDs, { containerIDWithHash: containerIDWithHash });
    }
    map[key].subscribers -= 1;
    if (map[key].chartIDs.length === 0 && map[key].timerHandler) {
        clearInterval(map[key].timerHandler);
        map[key].timerHandler = null;
    }
    /* Remove the following code if backend fixes this issue: 
     * https://trello.com/c/1IZRihrH/4662-1-forget-call-for-one-stream-id-affects-all-other-streams-with-the-same-symbol
     * Also remove instrument from function argument list.
     */
    //-----Start-----//
    const instrument = map[key].symbol;
    const tickSubscribers = map[map.keyFor(instrument, 0)] && map[map.keyFor(instrument, 0)].subscribers;
    //-----End-----//
    if (map[key].subscribers === 0 && map[key].id) { /* id is set in stream_handler.js */
        liveapi.send({ forget: map[key].id })
            // Remove this part as well.
            .then(()=>{
                // Resubscribe to tick stream if there are any tickSubscribers.
                if (tickSubscribers)
                    map.register({
                        symbol: instrument,
                        subscribe: 1,
                        count: 50 // To avoid missing any ticks.
                    });
            })
            .catch((err) => { console.error(err); });
    }
    if (map[key].subscribers === 0) {
        delete map[key];
    }
};

export const digits_after_decimal = function(pip, symbol) {
    pip = pip && pip + '';
    return pip.substring(pip.indexOf(".") + 1).length;
};

export default {
    keyFor,
    register,
    subscribe,
    unregister,
    digits_after_decimal
};
