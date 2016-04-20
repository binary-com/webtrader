## General TODO
    * QUnit for unit testing
    * News, message or server alert panel poping out from right
    * Add readme for each folder with detailed documentation
    * Add documentation for JS class and HTML pages
    * User should be able to change main candle color by double clicking on it
    * In general, users should be able to do following
        * Change main series candle color
        * Change overlay series color
        * Change indicator parameters including color settings
        * Change chart objects
        * Delete overlay
        * Delete indicators
        * Delete objects from chart
    * Use JSHint
    * Video detailing each and every features of the new charting software
    * Use Sass instead of CSS
    * Do some memory and frame profiling -> Note any performance degrading points
    * Over the course of time, the navigator curve becomes flat although charts are fine
    * Grunt HTMLHint
    * https://www.npmjs.com/package/grunt-code-quality-report

## Charts TODO
    * Logarithmic scale (review it again. Not matching with java charts)
    * A button to control whether to shift the chart with new data point or not
    * Review scatter plot again. It is throwing error for tooltip
    * Show indicators text on main chart left corner if the indicator is being show is on the main chart
    * The charts suddenly stops moving when you keep it running for more than 24 hours. There is no set time when it will stop.
        However, it looks like it completely stops working and there is no activity in console. There is no disconnection too. It has
        not be frozen too. It might be something to do with server EventSource connection which is held by server, but it is not sending
        any data. A proper way of capturing needs to be done in order to point out who the real culprit is in this issue (whether server
        or client side code)
    * Push the y axis labels inside the indicator area. Right now one indicator label is overlapping with others(continued)
    * Try to figure out if we can do anything in order allow usage of all indicators on charts other than OHLC or candlestick.
        If we can, then we should remove the usage of isOHLCOnly indicator from indicators.json file and also replace all its usage
        in other places.
    * Do not show gaps for weekends
