
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

    /*
        @param: options.date    javascript Date object representing initial time
        @param: options.title   the header title for spinners
        @param: options.changed  called when Date changes, callback argument is a string in yyyy_mm_dd format.
      useage: 
         var win = createBlankWindow(...);
         win.addDateToHeader({date:new Date(), title: 'sub header', changed: fn});
    */
    var styles_loaded = false;
    function addDateToHeader(options) {
        options = $.extend({
            title: 'title',
            date: new Date(),
            changed: function (yyyy_mm_dd) { console.log(yyyy_mm_dd + ' changed'); }
        },options);
        var header = this.parent().find('.ui-dialog-title').css('width', '25%');

        styles_loaded || loadCSS("windows/windows.css");
        styles_loaded = true;

        var addSpinner = function(opts) {
            var input = $('<input  class="spinner-in-dialog-header" type="text"></input>');
            input.val(opts.value + '');
            input.insertAfter(header);
            var last_val = opts.value + '';

            var spinner = input.spinner({
                max: opts.max,
                min: opts.min,
                spin: function (e, ui) {
                    last_val = ui.value;
                    spinner.trigger('changed',[ui.value]);
                }
            });
            // TODO: see if can be fixed in css without affecting other items
            spinner.parent().css('margin-left', '5px');
            spinner.parent().find('.ui-spinner-up').css('margin-top', 0);

            spinner.val = function () { return last_val + ''; };
            return spinner;
        }

        var dt = options.date;
        $('<span class="span-in-dialog-header">' + options.title + '</span>').insertAfter(header);
        var day = addSpinner({ value: dt.getDate(), min: 1, max: 31 });
        var month = addSpinner({ value: dt.getMonth()+1, min: 1, max: 12 });
        var year = addSpinner({ value: dt.getFullYear(), min: 2000, max: dt.getFullYear() });

        var changed = function () {
            var yyyy_mm_dd = year.val() + '-' + month.val() + '-' + day.val();
            options.changed(yyyy_mm_dd);
        }

        year.on('changed', changed);
        month.on('changed', changed);
        day.on('changed', changed);
    }

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
            blankWindow.addDateToHeader = addDateToHeader;

            return blankWindow;
        },


        /*
            Uses a jquery-ui spinner to display a list of strings.
                @param: options.index       initial value of the array to show.
                @param: options.list        array of string items to show
                @param: options.changed     callback thats i called when menu is changed.
            Note: you should add your input to dom before turning it a spinner.
    
            Note: you can call 'update_list(...)' on the returned spinner to update the list of items:
                var spinner = makeTextSpinner(input,{list:['a,'b','c'],inx:0});
                spinner.update_list(['a','d','e','f']);
    
            TODO: move this to a utility file
        */
        makeTextSpinner: function (input, options) {
            options = $.extend({
                list: ['empty'],
                inx: 0,
                changed: function () { }
            }, options);

            var inx = options.inx, list = options.list;
            input.val(list[inx]);
            var spinner = input.spinner({
                max: list.length - 1,
                min: 0,
                spin: function (e, ui) {
                    e.preventDefault();
                    var direction = (ui.value | 0) === 0 ? -1 : +1;
                    inx = inx + direction;
                    inx = Math.max(inx, 0);
                    inx = Math.min(inx, list.length - 1);
                    input.val(list[inx]);
                    options.changed && options.changed(list[inx]);
                    spinner.trigger('changed', [list[inx]]);
                }
            });

            spinner.parent().css('margin-left', '5px');
            spinner.parent().find('.ui-spinner-up').css('margin-top', 0);
            spinner.update_list = function (new_list) {
                list = new_list;
                inx = 0;
                input.val(list[inx]);
            }
            return spinner;
        }
    };

});
