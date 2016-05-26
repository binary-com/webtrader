/**
 * Created by arnab on 2/16/15.
 */

define(['jquery', "charts/chartWindow", "common/util"], function($) {

    return {

        init : function (newTabId, timePeriod, chartType, tableViewCb, instrumentName) {

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

                        $(this).closest('.chartOptions').find('.chartMenuHamburgerMenu').click();

                        /*
                            If there are more than one charts with same instrument and timePeriod, then all of them are going to be changed
                         */
                        var instrumentCode = $('#' + newTabId + '_chart').data("instrumentCode");
                        var windows_ls = local_storage.get('windows') || {};
                        (windows_ls.windows || []).forEach(function (ew) {
                            if (ew.isChart && ew.instrumentCode === instrumentCode && ew.timePeriod === timePeriod) {
                                ew.type = type;
                            }
                        });
                        local_storage.set('windows', windows_ls);

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
                                var clickedLI = $(this);
                                require(["currentPriceIndicator"], function() {
                                    var chartIDWithHash = '#' + newTabId + '_chart';
                                    var chart = $(chartIDWithHash).highcharts();
                                    var remove = !clickedLI.find('span:first').hasClass('ui-icon-check');
                                    if (remove) {
                                        console.log('Remove current line');
                                        $.each(chart.series, function (index, series) {
                                            if (series.options.isInstrument) {
                                                series.removeCurrentPrice();
                                            }
                                        });
                                    } else {
                                        //Means this is not a remove case, we have to add the indicator
                                        console.log('Add current line');
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

                $html.find("li.indicators-add-remove").click(function(){
                      require(["charts/indicatorManagement"], function( indicatorManagement ) {
                          var title = instrumentName + ' (' + timePeriod + ')';
                          indicatorManagement.openDialog( '#' + newTabId + '_chart', title);
                      });
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
                          overlay.showToast( '#' + newTabId + '_chart' );
                      });
                        $(this).find('span:first').toggleClass('ui-icon ui-icon-check');
                        $(this).closest('.chartOptions').find('.chartMenuHamburgerMenu').click();
                  }
                });

                $("#" + newTabId + "_header").prepend($html);
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

        /**
         * Supported chartTypes are - candlestick, dot, line, dotline, ohlc, spline, table
         * @param newTabId
         * @param chartType
         */
        selectChartType: function(newTabId, chartType, generateEvent) {
            if (generateEvent)  $("#" + newTabId + "_header").find('.chartType li.' + chartType).click();
            else {
                $("#" + newTabId + "_header").find('.chartType li span').removeClass('ui-icon ui-icon-check');
                $("#" + newTabId + "_header").find('.chartType li.' + chartType).find('span:first').addClass('ui-icon ui-icon-check');
            }
        }

    };

});
