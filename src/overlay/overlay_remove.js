/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "datatables"], function ($) {

  var table = undefined;

    function init( containerIDWithHash, _callback ) {

      require(['text!overlay/overlay_remove.html'], function($html) {
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
                          require(["currentPriceIndicator"], function (currentPriceIndicator) {

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
                                          //Remove the current price indicator first
                                          $.each(currentPriceIndicator.getCurrentPriceOptions(), function (key, value) {
                                              if (value && series.options && series.options.id && value.parentSeriesID == series.options.id) {
                                                  series.removeCurrentPrice(key);
                                                  return false;
                                              }
                                          });

                                          //Then remove the series
                                          series.remove();
                                      }
                                  }
                                  table.row($(this)).remove().draw();
                              });

                              //Feature request https://trello.com/c/ZxZzlKfe/198-test-overlaying-tick-charts
                              //$( ".overlay_dialog_remove" ).dialog('close');

                          });
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
