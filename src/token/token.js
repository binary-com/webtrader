/**
 * Created by amin on October 22, 2015.
 */
define(["jquery", "windows/windows","jquery-growl"], function ($, windows) {
    var $html = $('<div />');
    var callbacks = null;
    var promise = null;
    var tokenWin = null;
    loadCSS('token/token.css');

    function show() {
        if (tokenWin == null) { /* TODO: try to laod html files with requriejs instead */
            $.get('token/token.html', function ($html) {
                $html = $($html);
                tokenWin = windows.createBlankWindow($html, {
                    width: 800,
                    height: 400,
                    title: 'Authentication Token',
                    resizeable: false,
                    collapsable: false,
                    minimizable: false,
                    maximizable: false,
                    close: function () {
                        callbacks && callbacks.reject({ message: "User didn't provide a token" });
                        callbacks = promise = null;
                    },
                    modal: true
                });

                var input = $html.find('input');
                
                $html.find(".token-dialog-apply")
                    .button({ icons: { primary: "ui-icon-check" } })
                    .click(function () {
                        var val = input.val();
                        if (val) callbacks.resolve(val);
                        else callbacks.reject({ message: 'invalid token value' });

                        callbacks = promise = null;
                        tokenWin.dialog('close');
                    });

                $html.find(".token-dialog-cancel")
                    .button({ icons: { primary: "ui-icon-cancel" } })
                    .click(function () {
                        callbacks && callbacks.reject({ message: "User didn't provide a token" });

                        callbacks = promise = null;
                        tokenWin.dialog('close');
                    });

                tokenWin.dialog('open');
            });
        }
        else
            tokenWin.dialog('open');
    }
    return {
        /* returns a promise which is resolved when the user enters the token */
        getTokenAsync: function () {
            /* in case of multiple token requests return the pending promise,
             * Note: promise is in pending state, we will set it to null once it is fulfilled/rejected. */
            if (promise)
                return promise;

            promise = new Promise(function (resolve, reject) {
                callbacks = { resolve: resolve, reject: reject };
                show();
            });
            return promise;
        }
    }
});
