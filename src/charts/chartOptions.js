/**
 * Created by arnab on 2/16/15.
 */

define(['jquery', 'charts/chartingRequestMap',  "charts/chartWindow", "common/util"], function($, chartingRequestMap) {
    "use strict";
    var barsTable = chartingRequestMap.barsTable;

    function disableEnableOverlay(newTabId, chartType) {
      var overlay = $("#" + newTabId + "_header").find('li.overlay');
      if (isDataTypeClosePriceOnly(chartType)) {
        overlay.removeClass('ui-state-disabled');
      }
      else {
        overlay.addClass('ui-state-disabled');
      }
      overlay.closest("ul.ui-menu").menu("refresh");
    };

    return {

        init : function (newTabId, timePeriod, chartType, tableViewCb) {

            require(['text!charts/chartOptions.html','css!charts/chartOptions.css'], function($html) {
                //attach different button actions
                $html = $($html);

                $html.find('.chartMenuHamburgerMenu').hover(function() {
                    $(this).toggleClass('ui-state-hover').toggleClass('ui-state-active');
                }).click(function (e) {
                    $(this).toggleClass('active')
                           .next('ul:first').toggle();
                    return false;
                }).focusout(function() {
                  //We are hiding menu, so have to revert back the menus to normal state
                  $(this).removeClass("active").next('ul:first').menu().hide();
                });


                $html.find("ul:first").menu(); //convert these to JQuery UI menus

                //Disable candlestick and OHLC if it is a tick chart
                if (isTick(timePeriod)) {
                    $html.find(".candlestick, .ohlc").addClass('ui-state-disabled');
                }
                if(!tableViewCb) {
                  $html.find('.chartType li.table').hide();
                }

                // Add a tick mark to initial chart type
                $html.find('.chartType li.' + chartType).find('span:first').addClass('ui-icon ui-icon-check');

                $html.find('.chartType li').click(function () {

                        //If disabled, ignore this click
                        if ($(this).hasClass('ui-state-disabled')) {
                            return;
                        }

                        var type = $(this).attr("class").split(" ")[0].replace(".", "").trim();

                        if(type === 'table'){
                            tableViewCb();
                        }
                        else {
                          // Remove tick mark from other types and add it to this one.
                          $html.find('.chartType li span').removeClass('ui-icon ui-icon-check');
                          $(this).find('span:first').addClass('ui-icon ui-icon-check');

                          $("#" + newTabId + "_chart").data('type', type);
                          require(["charts/charts"], function( charts ) {
                              charts.refresh( '#' + newTabId + '_chart' );
                          });
                        }

                        //Toggle overlay menu
                        disableEnableOverlay(newTabId, type);
                        $(this).closest('.chartOptions').find('.chartMenuHamburgerMenu').click();
                    });

                $html.find('ul:first > li').each(function () {
                        $(this).click(function () {

                            //If disabled, ignore this click
                            if ($(this).hasClass('ui-state-disabled'))
                            {
                                return;
                            }

                            if ($(this).hasClass('logScaleLI')) {
                                var series = $("#" + newTabId + "_chart").highcharts().series[0];
                                var is_checked = $(this).find('span:first').hasClass('ui-icon-check');
                                //TODO review log scale - its not matching with Java charts
                                series.yAxis.update({
                                    type : is_checked ? 'linear' : 'logarithmic'
                                });
                                $(this).find('span:first').toggleClass('ui-icon ui-icon-check');
                                var hamburger_menu = $(this).closest('.chartOptions').find('.chartMenuHamburgerMenu');
                                if(hamburger_menu.hasClass('active')) {
                                  hamburger_menu.click();
                                }
                            }
                            else if ($(this).hasClass('crosshairLI')) {
                                //$(this).val(!$(this).is(":selected"));
                                require(["charts/crosshair"], function( crosshair ) {
                                    crosshair.toggleCrossHair('#' + newTabId + '_chart');
                                });
                                $(this).find('span:first').toggleClass('ui-icon ui-icon-check');
                                $(this).closest('.chartOptions').find('.chartMenuHamburgerMenu').click();
                            }
                            else if ($(this).hasClass('refresh')) {
                                require(["charts/charts"], function( charts ) {
                                    charts.refresh( '#' + newTabId + '_chart' );
                                });
                                $(this).closest('.chartOptions').find('.chartMenuHamburgerMenu').click();
                            }
                            else if ($(this).hasClass('currentPriceLI')) {
                                require(["currentPriceIndicator"], function(currentPriceIndicator) {
                                    var chartIDWithHash = '#' + newTabId + '_chart';
                                    var chart = $(chartIDWithHash).highcharts();
                                    //Find currentPriceOptions prop for each series on chart. This prop will contain list of unique IDs that
                                    //should be removed
                                    var removed = false;
                                    $.each(chart.series, function(index, series) {
                                        $.each(currentPriceIndicator.getCurrentPriceOptions(), function (key, value) {
                                            if (value && series.options && series.options.id && value.parentSeriesID == series.options.id) {
                                                series.removeCurrentPrice(key);
                                                removed = true;
                                            }
                                        });
                                    });
                                    if (!removed) {
                                        //Means this is not a remove case, we have to add the indicator
                                        chart.series.forEach(function(series){
                                            if (series.options.isInstrument) {
                                                series.addCurrentPrice();
                                            }
                                        })
                                    }
                                });
                                $(this).find('span:first').toggleClass('ui-icon ui-icon-check');
                                $(this).closest('.chartOptions').find('.chartMenuHamburgerMenu').click();
                            }

                        });
                    });

                $html
                    .find('.indicators li').click(function () {

                        //If disabled, ignore this click
                        if ($(this).hasClass('addInidicators'))
                        {
                            require(["charts/indicators/indicators_add"], function( indicators ) {
                                indicators.openDialog( '#' + newTabId + '_chart' );
                            });
                        }
                        else if ($(this).hasClass('removeIndicators'))
                        {
                            require(["charts/indicators/indicators_remove"], function( indicators ) {
                                indicators.openDialog( '#' + newTabId + '_chart' );
                            });
                        }
                    });

                $html.find(".overlay li").click(function () {
                  if ($(this).hasClass('addOverlay')) {
                      require(["overlay/overlay_add"], function( overlay ) {
                          overlay.openDialog( '#' + newTabId + '_chart' );
                      });
                  }
                  else if ($(this).hasClass('removeOverlay')) {
                      require(["overlay/overlay_remove"], function( overlay ) {
                          overlay.openDialog( '#' + newTabId + '_chart' );
                      });
                  }
                });

                $html.find(".drawLI li").click(function () {
                  if ($(this).hasClass('addChartObject')) {
                      require(["charts/draw/chartobject_add"], function( overlay ) {
                          overlay.openDialog( '#' + newTabId + '_chart' );
                      });
                  }
                  else if ($(this).hasClass('removeChartObject')) {
                      require(["charts/draw/chartobject_remove"], function( overlay ) {
                          overlay.openDialog( '#' + newTabId + '_chart' );
                      });
                  }
                });

                $("#" + newTabId + "_header").prepend($html);
                //Enable/disable overlay menu based on chart type
                disableEnableOverlay(newTabId, chartType);
            });

        },

        disableEnableLogMenu : function (newTabId, enable) {
            var logMenuObj = $("#" + newTabId + "_header").find('li.logScaleLI');
            if (enable) {
                logMenuObj.removeClass('ui-state-disabled');
            } else {
                logMenuObj.addClass('ui-state-disabled');
            }
        },

        triggerToggleLogScale : function (newTabId) {
            $("#" + newTabId + "_header").find('li.logScaleLI').click();
        },

        isCurrentViewInLogScale : function (newTabId) {
            var logScaleMenuObj = $("#" + newTabId + "_header").find('li.logScaleLI');
            return logScaleMenuObj.find('span:first').hasClass('ui-icon-check') && !logScaleMenuObj.hasClass('ui-state-disabled');
        },

        disableEnableCandlestick : function (newTabId, enable) {
            var logMenuObj = $("#" + newTabId + "_header").find('li.candlestick');
            if (enable) {
                logMenuObj.removeClass('ui-state-disabled');
            } else {
                logMenuObj.addClass('ui-state-disabled');
            }
        },

        disableEnableOHLC : function (newTabId, enable) {
            var logMenuObj = $("#" + newTabId + "_header").find('li.ohlc');
            if (enable) {
                logMenuObj.removeClass('ui-state-disabled');
            } else {
                logMenuObj.addClass('ui-state-disabled');
            }
        },

        disableEnableOverlay : function(newTabId, chartType) {
          disableEnableOverlay(newTabId, chartType);
        }

    };

});
