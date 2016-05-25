/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", 'lodash', "datatables"], function ($, _) {

  var table = undefined;

    function init( containerIDWithHash, _callback ) {

      require(['text!overlay/overlay_remove.html', 'css!overlay/overlay_remove.css'], function($html) {
          $html = $($html);
          $html.hide();
          $html.appendTo("body");

          //Init the scrollable and searchable table
          table = $html.find('table').DataTable({
              paging: false,
              scrollY: 200,
              info: false
          });

          $(".overlay_dialog_remove").dialog({
              autoOpen: false,
              resizable: false,
              width: 330,
              modal: true,
              my: 'center',
              at: 'center',
              of: window,
              buttons: [{
                  text: "Remove Selected",
                  click: function() {
                      var rowCount = table.rows('.selected').data().length;
                      if (rowCount > 0) {

                              var containerIDWithHash = $(".overlay_dialog_remove").data('refererChartID');
                              table
                                  .rows('.selected')
                                  .nodes()
                                  .to$().each(function () {
                                  var seriesID = $(this).data('id');
                                  var chart = $(containerIDWithHash).highcharts();
                                  if (chart && seriesID) {
                                      var series = chart.get(seriesID);
                                      if (series) {
                                          //Remove current price line first
                                          series.removeCurrentPrice();
                                          //Then remove the series
                                          series.remove();
                                          //Re-validate chart
                                          _.defer(function () {
                                              var countInstrumentSeries = 0;
                                              chart.series.forEach(function (s) {
                                                  if ((s.options.isInstrument || s.options.onChartIndicator) && s.options.id.indexOf('navigator') == -1) {
                                                      ++countInstrumentSeries;
                                                  }
                                              });
                                              if (countInstrumentSeries == 1) {
                                                  chart.series.forEach(function (s) {
                                                      if ((s.options.isInstrument || s.options.onChartIndicator) && s.options.id.indexOf('navigator') == -1) {
                                                          s.update({
                                                              compare: undefined
                                                          });
                                                          $(containerIDWithHash).data('overlayIndicator', null);
                                                          require(['charts/chartOptions'], function (chartOptions) {
                                                              var newTabId = containerIDWithHash.replace("#", "").replace("_chart", "");
                                                              chartOptions.disableEnableCandlestick(newTabId, true);
                                                              chartOptions.disableEnableOHLC(newTabId, true);
                                                          });
                                                          _.defer(function () {
                                                              chart.redraw();
                                                          })
                                                          return false;
                                                      }
                                                  });
                                              }
                                          });
                                      }
                                  }
                                  table.row($(this)).remove().draw();
                              });

                              //Feature request https://trello.com/c/ZxZzlKfe/198-test-overlaying-tick-charts
                              //$( ".overlay_dialog_remove" ).dialog('close');

                      } else {
                          $.growl.error({ message: "Please select instruments to remove" });
                      }
                  }
              },{
                  text: "Cancel",
                  click: function() {
                      $( ".overlay_dialog_remove" ).dialog('close');
                  }
              }]
          });

          if (typeof _callback == "function") {
              _callback(containerIDWithHash);
          }

      });

    }

    return {

        openDialog : function( containerIDWithHash ) {

            //If it has not been initiated, then init it first
            if ($(".overlay_dialog_remove").length == 0)
            {
                init( containerIDWithHash, this.openDialog);
                return;
            }

            //Clear previous entries and add list of series that are added for the referring chart
            table.clear().draw();
            var chart = $(containerIDWithHash).highcharts();
            if (!chart) return;

            $.each(chart.series, function (index, series) {
                //We cannot remove the main series
                if (series.options.isInstrument && index > 0 && series.options.id !== 'navigator') {
                  $(table.row.add([series.options.name]).draw().node())
                      .click(function () {
                          $(this).toggleClass('selected');
                      }).data({
                          'id': series.options.id
                      });
                }
            });

            $(".overlay_dialog_remove").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
