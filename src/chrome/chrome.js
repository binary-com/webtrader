/**
 * Created by arnab on 5/6/16.
 */
define(['jquery', 'windows/windows', 'moment', 'common/util'], function($, windows, moment) {
    var win = null;

    //Trigger after 1 second - Give the injector some time to inject the DOM element
    setTimeout(function() {
        //Display it with diminishing frequency. E.g. in a day after first cancel, in a week after second, then once a month.
        var check = function() {
            var chrome_ls = local_storage.get("chrome");
            var show = !chrome_ls;
            if(!show) {
                var accepted_or_cancel_time = chrome_ls.accepted_or_cancel_time;
                show = !accepted_or_cancel_time;
                if (!show) {
                    var diff = (moment.utc().valueOf() - accepted_or_cancel_time);
                    show = (diff >= (7 * 24 * 60 * 60 * 1000));//if one week elapsed
                }
            }
            return show;
        };

        var show = check();
        if (show && window.chrome && chrome.webstore && $('#webtrader-extension-is-installed').length <= 0) {
            if (!win) {
                require(['text!chrome/chrome.html'], function($html){
                    $html = $($html).i18n();
                    win = windows.createBlankWindow($html,
                    {
                        dialogClass: "dialog-confirm",
                        width: 350,
                        height: 150,
                        resizable: false,
                        collapsable: false,
                        minimizable: false,
                        maximizable: false,
                        modal: true,
                        ignoreTileAction:true
                    });

                    $html.find("#apply").on("click", function(){
                        win.dialog( 'close' );
                        chrome.webstore.install();
                        local_storage.set("chrome", { accepted_or_cancel_time : moment.utc().valueOf() });
                    });
                    $html.find("#cancel").on("click", function(){
                        win.dialog( 'close' );
                        local_storage.set("chrome", { accepted_or_cancel_time : moment.utc().valueOf() });
                    });

                    //This helps in showing multiple dialog windows in modal form
                    $('body').append(win.dialog('widget'));
                    win.dialog('open');
                });
                
            } else {
                win.moveToTop();
            }
        }
    }, 1000);

    /*
        This is needed in order to bring back the modality of the dialog when the page is loaded first time. Since this dialog might be loaded way before
        chart dialogs are loaded, what have been found that, when charts are loaded later(after this is shown), the modality of this dialog is lost. However,
        if we close and reopen this dialog after tile is called, the modality is restored. In an ideal scenario, users won't be able to do anything when this
        dialog is shown because this is a blocking dialog.
     */
    windows.event_on("tile", function () {
        if (win && win.dialog('isOpen')) {
            win.dialog('close');
            win.moveToTop();
        }
    });

    return {}
});
