
/**
 * Created by arnab on 2/18/15.
 */

define(['jquery','jquery.dialogextend', 'modernizr', 'common/util'], function ($) {

    var closeAllObject = null,
        instrumentArrayForInitialLoading = [ //Figure out if we can get this from market.json URL rather than hard coding TODO
            {
                symbol : 'R_25',
                name : 'Random 25 Index',
                timeperiod : '1d',
                chartType : 'candlestick'
            }, {
                symbol : 'R_50',
                name : 'Random 50 Index',
                timeperiod : '8h',
                chartType : 'line'
            }, {
                symbol : 'R_75',
                name : 'Random 75 Index',
                timeperiod : '4h',
                chartType : 'ohlc'
            }, {
                symbol : 'R_100',
                name : 'Random 100 Index',
                timeperiod : '2h',
                chartType : 'spline'
            }];

    //-----start----
    //For desktops and laptops or large size tablets
    //---------Calculation to find out how many windows to open based on user's window size
    var totalAvailableBrowserWindowWidth = $(window).width();
    var totalAvailableBrowserWindowHeight = $(window).height();
    var totalChartsPerRow = Math.floor(totalAvailableBrowserWindowWidth / (350 + 20));
    var totalRows = Math.floor(totalAvailableBrowserWindowHeight / (400 + 10));
    //For small size screens
    if (isSmallView() || totalRows <= 0 || totalChartsPerRow <= 0) {
      totalRows = 1;
      totalChartsPerRow = 1;
    }
    //---------End-----------------------------

    var dialogCounter = 0;
    var $menuUL = null;

    function tileAction() {
      require(["charts/chartWindow"], function (chartWindowObj) {
        var topMargin = 80;
        if (isSmallView()) topMargin = 100;

        var cellCount = 1, rowCount = 1, leftMargin = 20;
        var minWidth = $(".chart-dialog").dialog('option', 'minWidth');
        var minHeight = $(".chart-dialog").dialog('option', 'minHeight');

        if (isSmallView()) {
          minWidth = $(window).width() - leftMargin * 2;
          minHeight = $(window).height() - topMargin;
        }

        var totalOccupiedSpace = totalChartsPerRow * minWidth + (totalChartsPerRow - 1) * leftMargin;
        var remainingSpace = $(window).width() - totalOccupiedSpace;
        var startMargin = Math.round(remainingSpace / 2) - leftMargin;

        var referenceObjectForPositioning = window;

        $(".chart-dialog").each(function () {

          if (cellCount == 1) {
            var leftShift = startMargin;
          } else if (cellCount > 1) {
            var leftShift = startMargin + ((minWidth + leftMargin) * (cellCount - 1));
          }
          var topShift = -topMargin + 2;
          referenceObjectForPositioning = window;
          if (referenceObjectForPositioning == window) {
            topShift = ((rowCount - 1) * minHeight + rowCount * topMargin);
          }

          referenceObjectForPositioning = $(this).dialog('option', {
                position: {
                    my: "left+" + leftShift + " top" + (topShift < 0 ? "-" : "+") + topShift,
                    at: "left top",
                    of: referenceObjectForPositioning
                },
                width : minWidth,
                height : minHeight
            });
            chartWindowObj.triggerResizeEffects( $(this).dialog( "widget").find('.chart-dialog') );
            if (++cellCount > totalChartsPerRow)
            {
                cellCount = 1;
                ++rowCount;
                referenceObjectForPositioning = window;
            }
        });
      });
    };

    return {

        init: function( $parentObj ) {
            $menuUL = $parentObj.find('ul');

            tileObject = $('li.tile');

            closeAllObject = $('li.closeAll').click(function () {
                //console.log('Event for closing all chart windows!');
                /*
                  The close click is behaving weird.
                  Behavior - When there are charts opened, this event is able to close all charts and then
                            unable to hide the menu. When There are no charts, then it behaves normally
                */
                if ($('.chart-dialog').length > 0) {
                    $('.chart-dialog').dialog('close');
                }
            });

            require(["charts/chartWindow"], function (chartWindowObj) {


                //Attach click listener for tile menu
                tileObject.click(function () {
                    tileAction();
                });

                //Based on totalChartsPerRow and totalRows, open some charts
                var totalCharts_renderable = totalChartsPerRow * totalRows;
                $(instrumentArrayForInitialLoading).each(function (index, value) {
                    if (index < totalCharts_renderable) {
                        chartWindowObj.addNewWindow(value.symbol, value.name, value.timeperiod,
                            function () {
                                //Trigger tile action
                                tileAction();
                            }, value.chartType);
                    }
                });

            });

            return this;
        },

        tile: function() {
          tileAction();
        },

        closeAll: function() {
            //Trigger close even on all dialogs
            if (!closeAllObject)
            {
                closeAllObject.click();
            }
        },

        /* important options: { title:'',
                                resize:fn, // callabak for dialog resize event
                                close: fn, // callback for dialog close event
                                autoOpen: false,
                                resizeable:true,
                                collapsable:true,
                                minimizable: true,
                                maximizable: true,
                                closable:true
                              }
           notes:
                1- get generated dialog id via createBlankWindow(...).attr('id')
                2- if autoOpen == false  use createBalnkWindow(...).dialog('open') to open the dialog
                2- if minWidth and minHeight are not specified the options.width and options.height will be used for minimums.
          */
        createBlankWindow: function($html,options){
            $html = $($html);
            var id = "windows-dialog-" + ++dialogCounter;

            options = $.extend({
                autoOpen: false,
                resizable: true,
                width: 350,
                height: 400,
                my: 'center',
                at: 'center',
                of: window,
                title: 'blank window'
            }, options || {});
            options.minWidth = options.minWidth || options.width;
            options.minHeight = options.minHeight || options.height;
            
            if (options.resize)
                options.maximize = options.minimize  = options.restore = options.resize;

            var blankWindow = $html.attr("id", id)
                .dialog(options)
                .dialogExtend(options);

            // add an item to window menu
            var li = $('<li />').addClass(id + 'LI').text(options.title);
            $menuUL.append(li);
            // bring window to top on click
            li.on('click', function () {
                blankWindow.dialog('moveToTop')
                     .parent().effect("bounce", { times: 2, distance: 15 }, 450);
            });
            // remove item from window menu on close
            blankWindow.on('dialogclose', function () {
                li.remove();
                $('#menu').menu('refresh');
            });

            // refresh the main jquery ui menu
            $('#menu').menu('refresh');

            if (options.resize)
                options.resize.call($html[0]);

            return blankWindow;
        }
    };

});
