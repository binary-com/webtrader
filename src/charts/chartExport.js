/**
 * Created by amin january 20, 2016.
 */
define(["css!charts/chartExport.css", "common/util"], function() {

  function init(dialogid){
    var btn = $('<img />')
    .attr('src', 'images/download.svg')
    .addClass('export-btn');

    var header = $("#" + dialogid + "_header");
    header.prepend(btn);
  }

  return { init: init };
});
