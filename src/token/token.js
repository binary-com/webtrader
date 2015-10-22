/**
 * Created by amin on October 22, 2015.
 */
define(["jquery", "windows/windows","jquery-growl"], function ($, windows) {
    var $html = $('<div />');
    var promise = null;
    var tokenWin = null;
    loadCSS('token/token.css');
    function show() {
        if (tokenWin == null) { /* TODO: try to laod html files with requriejs instead */
            $.get('token/token.html', function ($html) {
                $html = $($html);
                tokenWin = windows.createBlankWindow($html, {
                    title: 'Authentication Token',
                    resizeable: false,
                    collapsable: false,
                    minimizable: false,
                    maximizable: false,
                    close: function () {
                        promise && promise.reject({ message: "user didn't provide a token" });
                    },
                    modal: true
                });

                var input = $html.find('input');
                
                $html.find(".token-dialog-apply")
                    .button({ icons: { primary: "ui-icon-check" } })
                    .click(function () {
                        var val = input.val();
                        if (val) promise.resolve(val);
                        else promise.reject({ message: 'invalid token value' });

                        promise = null;
                        tokenWin.dialog('close');
                    });

                $html.find(".token-dialog-cancel")
                    .button({ icons: { primary: "ui-icon-cancel" } })
                    .click(function () {
                        promise && promise.reject({ message: "user didn't provide a token" });

                        promise = null;
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
            return new Promise(function (resolve, reject) {
                promise = { resolve: resolve, reject: reject };
                show();
            });
        }
    }
});
