## General TODO
    * In general, users should be able to do following
        * Change overlay series color
        * Change chart objects
        * Delete objects from chart
    * Use JSHint
    * Video detailing each and every features of the new charting software
    * Do some memory and frame profiling -> Note any performance degrading points
    * Over the course of time, the navigator curve becomes flat although charts are fine
    * Grunt HTMLHint
    * https://www.npmjs.com/package/grunt-code-quality-report

## Charts TODO
    * A button to control whether to shift the chart with new data point or not
    * The charts suddenly stops moving when you keep it running for more than 24 hours. There is no set time when it will stop.
        However, it looks like it completely stops working and there is no activity in console. There is no disconnection too. It has
        not be frozen too. It might be something to do with server EventSource connection which is held by server, but it is not sending
        any data. A proper way of capturing needs to be done in order to point out who the real culprit is in this issue (whether server
        or client side code)
