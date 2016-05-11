/**
 * Created by arnab on 4/24/16.
 */
define(['jquery', 'windows/windows', 'highstock', "jquery-growl"], function($, windows) {

    var win = null;

    /*Set theme from local storage*/
    var themeName = localStorage.getItem("webtrader_theme");
    if (themeName) {
        require(['lib/highstock/themes/' + themeName]);
    }

    $('a.theme_dark_blue, a.theme_dark_green, a.theme_dark_unica, a.theme_gray, a.theme_grid, ' + 
            'a.theme_grid_light, a.theme_sand_signika, a.theme_skies, a.theme_default')
        .off('click')
        .on('click', function () {
            var $ele = $(this);
            if (!win) {
                win = windows.createBlankWindow($('<div class="dialog-confirm-new-theme"/>'),
                    {
                        title: 'Apply new theme?',
                        width: 360,
                        height: 170,
                        resizable: false,
                        collapsable: false,
                        minimizable: false,
                        maximizable: false,
                        closable: false,
                        closeOnEscape: false,
                        modal: true,
                        ignoreTileAction:true,
                        'data-authorized': 'true',
                        destroy: function() {
                            win = null;
                        },
                        buttons: {
                            Apply: function() {
                                $.growl.notice({message: 'Loading ' + $ele.text()});
                                var themeName_file = $ele.attr('class').replace('theme_', '').replace('_', '-');
                                (themeName_file === 'default') ?
                                    localStorage.removeItem("webtrader_theme") : localStorage.setItem("webtrader_theme", themeName_file);
                                location.reload();
                            },
                            Cancel: function() {
                                $( this ).dialog( "destroy" );
                            }
                        }
                    });
                var p = $('<p>In order to properly apply theme, a full refresh of page is required. Are you sure you want to proceed?</p>');
                p.appendTo(win);
                win.dialog('open');
            } else {
                win.moveToTop();
            }
    });

    return {};

});
