
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
    function addDateToHeader(options) {
        options = $.extend({
            title: 'title',
            date: new Date(),
            changed: function (yyyy_mm_dd) { console.log(yyyy_mm_dd + ' changed'); }
        },options);

        var titlebar = this.parent().find('.ui-dialog-titlebar').addClass('with-dates');
        var header = this.parent().find('.ui-dialog-title');

        
        /* options: {date: date, onchange: fn } */
        var addDateDropDowns = function (opts) {
            // note that month is 0-based, like in the Date object. Adjust if necessary.
            function numberOfDays(year, month) {
                var isLeap = ((year % 4) == 0 && ((year % 100) != 0 || (year % 400) == 0));
                return [31, (isLeap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
            }

            function update(select, options) {
                var render = options.render || function (v) { return v + ''; };
                select.children().remove();
                for (var i = options.min; i <= options.max; ++i)
                    $('<option/>').val(i).text(render(i)).appendTo(select);
                select.val(options.initial || options.min);
                select.selectmenu('refresh');
                return select;
            }

            var dt = opts.date || new Date();
            var year = $('<select />').insertAfter(header).selectmenu({ width: '70px' });
            var month = $('<select />').insertAfter(header).selectmenu({ width: '65px' });
            var day = $('<select />').insertAfter(header).selectmenu({ width: '60px'});
            year = update(year, { min: 2010, max: dt.getFullYear(), initial: dt.getFullYear()});
            month = update(month, {
                min: 0, max: 11, initial: dt.getMonth(),
                render: function (inx) { return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'][inx]; }
            });
            day = update(day, { min: 1, max: numberOfDays(dt.getFullYear(),dt.getMonth()), initial: dt.getDate()});
            
            var trigger_change = function () {
                var yyyy_mm_dd = new Date(year.val(), month.val(), day.val()).toISOString().slice(0, 10);
                opts.onchange(yyyy_mm_dd);
            }
            day.on('selectmenuchange', trigger_change);

            var update_day = function () {
                var options = { min: 1, max: numberOfDays(year.val(), month.val()), initial: day.val() };
                if (options.initial > options.max)
                    options.initial = options.min;
                update(day, options);
            };

            [year, month].forEach(function (select) {
                select.on('selectmenuchange', function () {
                    update_day();
                    trigger_change();
                });
            })
            return {
                update: function (yyyy_mm_dd) {
                    var args = yyyy_mm_dd.split('-');
                    year.val(args[0] | 0); year.selectmenu('refresh');
                    month.val(args[1] | 0); month.selectmenu('refresh');
                    day.val(args[2] | 0); update_day();
                }
            }
        }

        /* options: {date: date, onchange: fn} , events => element.on('change',...) */
        var addDatePicker = function (opts) {
            var dpicker_input = $("<input type='hidden' />")
                .insertAfter(header);
            var dpicker = dpicker_input.datepicker({
                showOn: 'both',
                numberOfMonths: 2,
                maxDate: 0,
                minDate: new Date(2010,0,1),
                dateFormat: 'yy-mm-dd',
                showAnim: 'drop',
                showButtonPanel: true,
                changeMonth: true,
                changeYear: true,
                beforeShow: function (input, inst) { inst.dpDiv.css({ marginTop: '10px', marginLeft: '-220px' }); },
                onSelect: function () { $(this).change(); }
            }).datepicker("setDate", opts.date.toISOString().slice(0, 10));

            /* use JQ-UI icon for datepicker */
            dpicker .next('button') .text('')
                .button({ icons: { primary: 'ui-icon-calendar' } });

            dpicker_input.on('change', function () {
                var yyyy_mm_dd = $(this).val();
                opts.onchange && opts.onchange(yyyy_mm_dd);
            });
            return dpicker_input;
        }


        var dt = options.date;
        var dpicker = addDatePicker({
            date: dt,onchange: function (yyyy_mm_dd) {
                dropdonws.update(yyyy_mm_dd);
                options.changed(yyyy_mm_dd);
            }
        });
        var dropdonws = addDateDropDowns({
            date: dt, onchange: function (yyyy_mm_dd) {
                dpicker.datepicker("setDate", yyyy_mm_dd);
                options.changed(yyyy_mm_dd);
            }
        });

        $('<span class="span-in-dialog-header">' + options.title + '</span>').insertAfter(header);
    }

    return {

        init: function( $parentObj ) {
            loadCSS("windows/windows.css");
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
        makeSelectmenu: function (select, options) {
            
            options = $.extend({
                list: ['empty'],
                inx: 0,
                changed: function () { }
            }, options);

            var inx = options.inx, list = options.list;
            var update_select = function(list) {
                select.children().remove();
                for(var i = 0; i < list.length; ++i)
                    $('<option/>').val(list[i]).text(list[i]).appendTo(select);
            }
            update_select(list);
            select.val(list[inx]);

            select = select.selectmenu();
            select.on('selectmenuchange', function () {
                var val = $(this).val();
                options.changed(val);
            })

            select.update_list = function (new_list) {
                update_select(new_list);
                select.val(new_list[0]);
                select.selectmenu('refresh');
            }
            return select;
        }
    };

});
