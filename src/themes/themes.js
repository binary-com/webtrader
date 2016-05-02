/**
 * Created by arnab on 4/24/16.
 */
define(['jquery', "charts/charts", 'highstock'], function($, charts) {

    $('a.theme_dark_blue, a.theme_dark_green, a.theme_dark_unica, a.theme_gray, a.theme_grid, a.theme_grid_light, a.theme_sand_signika, a.theme_skies')
        .off('click')
        .on('click', function () {
            var $ele = $(this);
            require(['text!themes/themes.html', "jquery-growl"], function($html) {
                $($html).dialog({
                        resizable: false,
                        height:160,
                        modal: true,
                        buttons: {
                            Apply: function() {
                                $.growl.notice({message: 'Loading ' + $ele.text()});
                                require(['lib/highstock/themes/' + $ele.attr('class').replace('theme_', '').replace('_', '-')], function() {
                                    $(".chartSubContainer").each(function() {
                                        charts.refresh( '#' + $(this).attr('id') );
                                    });
                                });
                                $( this ).dialog( "close" );
                            },
                            Cancel: function() {
                                $( this ).dialog( "close" );
                            }
                        }
                    });
            });
    });

    return {};

});
