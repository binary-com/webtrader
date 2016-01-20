/**
 * Created by amin january 20, 2016.
 */
define(['charts/chartingRequestMap', 'moment', "css!charts/chartExport.css", "common/util"], function(chartingRequestMap, moment) {
  var barsTable = chartingRequestMap.barsTable;

  function init(dialogid){
    var btn = $('<img />')
    .attr('src', 'images/download.svg')
    .addClass('export-btn');

    var header = $("#" + dialogid + "_header");
    header.prepend(btn);

    var data = $('#' + dialogid + '_chart').data();
    btn.on('click', generate_csv.bind(null,data));
  }

  function generate_csv(data){
    var key = chartingRequestMap.keyFor(data.instrumentCode, data.timePeriod);
    var filename = data.instrumentName + ' (' +  data.timePeriod + ')' + '.csv';
    var bars = barsTable
                    .chain()
                    .find({instrumentCdAndTp: key})
                    .simplesort('time', false)
                    .data();
    var lines = bars.map(function(bar){
        return '"' + moment.utc(bar.time).format('YYYY-MM-DD HH:mm') + '"' + ',' +/* Date */
               bar.open + ',' + bar.high + ',' + bar.low + ',' + bar.close;
    });
    var csv = 'Date,Open,High,Low,Close\n' + lines.join('\n');


    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, filename);
    }
    else {
      var link = document.createElement("a");
      if (link.download !== undefined) {  /* Evergreen Browsers :) */
        var url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }

  return { init: init };
});
