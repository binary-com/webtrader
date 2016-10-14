/**
 * Created by arnab on 4/24/16.
 */
define(['jquery', 'windows/windows', 'common/util', 'highstock', "jquery-growl"], function($, windows) {

    var win = null;

    /*Set theme from local storage*/
    var themeName = local_storage.get("theme"),
        custom_theme = local_storage.get("custom_theme");
    themeName = themeName && themeName.name;
    if (themeName) {
        require(['lib/highstock/themes/' + themeName]);
    } else if(custom_theme){
        Highcharts.setOptions(custom_theme);
    } else{
        // Setting candle-stick color incase there's no theme set.
        Highcharts.setOptions(
            {
                plotOptions: {
                    candlestick: {
                        lineColor: 'rgba(0,0,0,1)',
                        color: 'rgba(215,24,24,1)',
                        upColor: 'rgba(2,146,14,1)',
                        upLineColor: 'rgba(0,0,0,1)'
                    }
                }
            });
    }

    // Localizing Highcharts.
    var lang = Highcharts.getOptions().lang;
    Object.keys(lang).map(
        function(key){
            if(typeof lang[key] === 'object'){
                lang[key].forEach(function(value, index){
                    lang[key][index] = value.i18n();
                });
                return;
            }
            lang[key] = lang[key].i18n();
    });

    $('a.theme_dark_blue, a.theme_dark_green, a.theme_dark_unica, a.theme_gray, a.theme_grid, ' +
            'a.theme_grid_light, a.theme_sand_signika, a.theme_skies, a.theme_default')
        .off('click')
        .on('click', function () {
            var $ele = $(this);
            var elementText = $ele.text();
            var elementClass = $ele.attr('class');
            confirmationDialog(null, elementClass, elementText);
    });

    function confirmationDialog(themeObj, elementClass, elementText) {
            if (!win) {
                require(['text!themes/themes.html'], function($html){
                    $html = $($html).i18n();

                    win = windows.createBlankWindow($html,
                    {
                        dialogClass: 'dialog-confirm',
                        width: 360,
                        height: 175,
                        resizable: false,
                        collapsable: false,
                        minimizable: false,
                        maximizable: false,
                        closable: false,
                        closeOnEscape: false,
                        modal: true,
                        ignoreTileAction:true,
                        destroy: function() {
                            win = null;
                        },
                    });
                    $html.find("#apply").on("click", function(){
                        $.growl.notice({message: 'Loading ' + elementText});
                        var themeName_file = elementClass.replace('theme_', '').replace('_', '-');
                        if(themeObj){
                            local_storage.remove("theme");
                            local_storage.set("custom_theme", themeObj);
                        }
                        else if(themeName_file === 'default') {
                            local_storage.remove("theme");
                            local_storage.remove("custom_theme");
                        } else{
                            local_storage.set("theme", {name: themeName_file}); 
                        }
                        location.reload();
                    });
                    $html.find("#cancel").on("click", function(){
                        win.dialog( 'close' );
                        win.dialog( "destroy" );
                    });
                    win.dialog('open');
                });
            } else {
                win.moveToTop();
            }
        }

    return {
        confirmationDialog : confirmationDialog
    };

});
