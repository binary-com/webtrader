/**
 * Created by arnab on 5/12/16.
 */
define(['jquery', 'windows/windows', 'lodash', 'common/util'], function($, windows, _) {
    var win = null, confirm = null;
    return {
        init: function ($menuLink) {
            $menuLink.click(function() {
                if (!win) {
                    win = windows.createBlankWindow($('<div style="padding: 10px;" class="wschange"><div>Web Socket URL</div><input></div>'), {
                        title: 'Change Backend Server',
                        width: 300,
                        height:160,
                        resizable: false,
                        collapsable: false,
                        minimizable: false,
                        maximizable: false,
                        modal: true,
                        ignoreTileAction:true,
                        'data-authorized': 'true',
                        open: function () {
                            var storedWsURL = local_storage.get('websocket_url');
                            var api_url = (storedWsURL && storedWsURL.url)  || 'wss://ws.binaryws.com/websockets/v3?l=EN';
                            $('.wschange input').val(api_url);
                        },
                        destroy: function() {
                            win = null;
                        },
                        buttons: {
                            Apply: function() {

                                //Do validation here TODO
                                var newWSURL = _.trim($('.wschange input').val());
                                if (newWSURL.length <= 0 || newWSURL.indexOf("wss://") !== 0) {
                                    $.growl.error({ message : 'Incorrect Web socket URL'});
                                    return;
                                }

                                $( this ).dialog( 'close' );
                                $( this ).dialog( "destroy" );

                                if (!confirm) {
                                    confirm = windows.createBlankWindow($('<p>In order to properly apply this change, a full refresh of page is required. Are you sure you want to proceed?</p>'), {
                                        title: 'Confirm',
                                        width: 350,
                                        height: 160,
                                        resizable: false,
                                        collapsable: false,
                                        minimizable: false,
                                        maximizable: false,
                                        modal: true,
                                        ignoreTileAction: true,
                                        'data-authorized': 'true',
                                        destroy: function () {
                                            confirm = null;
                                        },
                                        buttons: {
                                            Ok: function () {
                                                $( this ).dialog( 'close' );
                                                $(this).dialog("destroy");
                                                local_storage.set('websocket_url', { url : newWSURL });
                                                location.reload();
                                            },
                                            Cancel: function () {
                                                $( this ).dialog( 'close' );
                                                $(this).dialog("destroy");
                                            }
                                        }
                                    });
                                    confirm.dialog( 'open' );
                                } else {
                                    confirm.moveToTop();
                                }
                            },
                            Cancel: function() {
                                $( this ).dialog( 'close' );
                                $( this ).dialog( "destroy" );
                            }
                        }
                    });
                    win.dialog( 'open' );
                }
                else {
                    win.moveToTop();
                }
            });
        }
    };
});
