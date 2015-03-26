/**
 * Created by arnab on 2/18/15.
 */

define(['jquery'], function ($) {

    var closeAllObject = null, tileObject = null,
        //We cannot open more than 6 charts in modern browsers - Restriction of 6 connections
        instrumentArrayForInitialLoading = [ //Figure out if we can get this from market.json URL rather than hard coding TODO
            {
                symbol : 'R_25',
                name : 'Random 25 Index',
                timeperiod : '1d',
                chartType : 'line'
            }, {
                symbol : 'R_50',
                name : 'Random 50 Index',
                timeperiod : '8h',
                chartType : 'candlestick'
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
            }, {
                symbol : 'RDBEAR',
                name : 'Random Bear',
                timeperiod : '1h',
                chartType : 'area'
            }, {
                symbol : 'RDBULL',
                name : 'Random Bull',
                timeperiod : '30m',
                chartType : 'column'
            }, {
                symbol : 'RDMOON',
                name : 'Random Moon',
                timeperiod : '15m',
                chartType : 'ohlc'
            }, {
                symbol : 'RDSUN',
                name : 'Random Sun',
                timeperiod : '10m',
                chartType : 'candlestick'
            }, {
                symbol : 'RDMARS',
                name : 'Random Mars',
                timeperiod : '2d',
                chartType : 'spline'
            }, {
                symbol : 'RDVENUS',
                name : 'Random Venus',
                timeperiod : '3d',
                chartType : 'line'
            }];

    //---------Calculation to find out how many windows to open based on user's window size-----start----
    var totalAvailableBrowserWindowWidth = $(window).width() - $('.topContainer').width();
    var totalAvailableBrowserWindowHeight = $(window).height();
    var totalChartsPerRow = Math.floor(totalAvailableBrowserWindowWidth / (350 + 20));
    var totalRows = Math.floor(totalAvailableBrowserWindowHeight / (400 + 10));
    //---------End-----------------------------

    return {

        init: function( $parentObj ) {

            $.get('windows/windows.html', function ( $html ) {
                $html = $($html);
                tileObject = $html.find('li.tile');

                closeAllObject = $html.find('li.closeAll').click(function () {
                    console.log('Event for closing all chart windows!');
                    $('.chart-dialog').dialog( 'close' );
                });
                $parentObj.append($html).closest('ul').menu('refresh');

                require(["charts/chartWindow"], function (chartWindowObj) {

                    //Attach click listener for tile menu
                    tileObject.click(function () {
                        var cellCount = 1, rowCount = 1;
                        $(".chart-dialog").each(function () {
                            var minWidth = $(this).dialog('option', 'minWidth');
                            var minHeight = $(this).dialog('option', 'minHeight');
                            $(this).dialog('option', {
                                position: {
                                    my: "left+" + ((cellCount - 1) * 350 + $('.topContainer').width() + cellCount * 20)
                                    + " top+" + ((rowCount - 1) * 400 + rowCount * 10),
                                    at: "left top",
                                    of: window
                                },
                                width : minWidth,
                                height : minHeight
                            });
                            chartWindowObj.triggerResizeEffects( $(this).dialog( "widget").find('.chart-dialog') );
                            if (++cellCount > totalChartsPerRow)
                            {
                                cellCount = 1;
                                ++rowCount;
                            }
                        });
                    });

                    //Based on totalChartsPerRow and totalRows, open some charts
                    var count = 1, cellCount = 1, rowCount = 1;
                    function openChart() {
                        chartWindowObj.addNewWindow(instrumentArrayForInitialLoading[count - 1].symbol,
                            instrumentArrayForInitialLoading[count - 1].name,
                            instrumentArrayForInitialLoading[count - 1].timeperiod, function (chartWindowJqueryObj) {
                                chartWindowJqueryObj.dialog('option', {
                                    position: {
                                        my: "left+" + ((cellCount - 1) * 350 + $('.topContainer').width() + cellCount * 20)
                                                    + " top+" + ((rowCount - 1) * 400 + rowCount * 10),
                                        at: "left top",
                                        of: window
                                    }
                                });
                                if (++count <= instrumentArrayForInitialLoading.length)
                                {
                                    if (++cellCount > totalChartsPerRow)
                                    {
                                        cellCount = 1;
                                        rowCount++;
                                    }
                                    if (rowCount <= totalRows)
                                    {
                                        openChart();
                                    }
                                }
                            }, instrumentArrayForInitialLoading[count - 1].chartType);
                    }

                    openChart();
                });

            });
            return this;
        },

        tile: function() {
            if (!tileObject)
            {
                tileObject.click();
            }
        },

        closeAll: function() {
            //Trigger close even on all dialogs
            if (!closeAllObject)
            {
                closeAllObject.click();
            }
        }

    };

});
