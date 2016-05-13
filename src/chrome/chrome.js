/**
 * Created by arnab on 5/6/16.
 */
define(['jquery', 'windows/windows'], function($, windows) {
    var win = null;
    //Trigger after 1 second
    setTimeout(function() {
        if (chrome && chrome.webstore && $('#webtrader-extension-is-installed').length <= 0) {
            if (!win) {
                win = windows.createBlankWindow($('<div class="chrome_extension"/>'),
                    {
                        title: 'Chrome Extension',
                        width: 340,
                        height: 150,
                        resizable: false,
                        collapsable: false,
                        minimizable: false,
                        maximizable: false,
                        modal: true,
                        ignoreTileAction:true,
                        'data-authorized': 'true',
                        destroy: function() {
                            win = null;
                        },
                        buttons: {
                            Apply: function() {
                                $( this ).dialog( 'close' );
                                $( this ).dialog( "destroy" );
                                try {
                                    chrome.webstore.install();
                                    console.log('Chrome Install called!');
                                } catch (e) {
                                    console.log(e);
                                }
                            },
                            Cancel: function() {
                                $( this ).dialog( 'close' );
                                $( this ).dialog( "destroy" );
                            }
                        }
                    });
                var p = $('<p>Do you want to install Webtrader chrome extension?</p>');
                p.appendTo(win);
                win.dialog('open');
            } else {
                win.moveToTop();
            }
        }
    }, 1000);
    return {}
});
