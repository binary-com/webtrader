/**
 * Created by arnab on 5/2/16.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets"], function($, windows, liveapi) {

    var win = null;
    
    liveapi.events.on("login", function(data) {

        Promise
            .all([
                liveapi.cached.send({landing_company_details : data.authorize.landing_company_name}),
                liveapi.cached.send({ "website_status": 1 }),
                liveapi.send({ "get_settings": 1 })
            ])
            .then(function(data) {
                var landing_company_details = data[0];
                var website_status = data[1];
                var get_settings = data[2];
                if (landing_company_details.landing_company_details && landing_company_details.landing_company_details.name
                        && website_status.website_status && get_settings.get_settings
                        && website_status.website_status.terms_conditions_version === get_settings.get_settings.client_tnc_status) {
                    if (win) win.dialog('destroy');
                    require(['text!tc/tc.html', 'css!tc/tc.css'], function(html) {
                        var div = $(html);
                        div.find('.tc_landing_comp_name').html(landing_company_details.landing_company_details.name);
                        div.find('.button').click(function () {
                            liveapi.send({ "tnc_approval": 1 });
                            win.dialog('destroy');
                        });
                        win = windows.createBlankWindow($('<div/>'), {
                            title: 'Terms & Conditions',
                            width: 580,
                            minHeight:90,
                            height: 220,
                            resizable: false,
                            collapsable: false,
                            minimizable: false,
                            maximizable: false,
                            closable: false,
                            modal: true,
                            closeOnEscape: false,
                            ignoreTileAction:true,
                            'data-authorized': 'true',
                            destroy: function() {
                                win = null;
                            }
                        });
                        div.appendTo(win);
                        win.dialog('open');
                    });
                }
            });

    });

    return {};
    
});
