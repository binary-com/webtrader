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
                                var themeName_file = $ele.attr('class').replace('theme_', '').replace('_', '-');
                                require(['lib/highstock/themes/' + themeName_file], function() {
                                    if (themeName_file !== 'skies') { 
                                        //Only slies theme has the background image
                                        //https://github.com/highcharts/highcharts/issues/5272 
                                        Highcharts.theme.chart.plotBackgroundImage = null;
                                        Highcharts.setOptions(Highcharts.theme);
                                    }
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
