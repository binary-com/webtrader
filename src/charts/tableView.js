/**
 * Created by amin january 21, 2016.
 */

define([ ], function() {

  var show_table_view = function(dialog){
    var table = dialog.find('.table-view');
    var chart = dialog.find('.chart-view');
    table.animate({left: '0'}, 250);
    chart.animate({left: '-100%'}, 250);
  }
  var hide_table_view = function(dialog){
    var table = dialog.find('.table-view');
    var chart = dialog.find('.chart-view');
    table.animate({left: '100%'}, 250);
    chart.animate({left: '0'}, 250);
  }

  function init(dialog){
    var table = dialog.find('.table-view');
    var close = table.find('span.close');
    close.on('click', hide_table_view.bind(null, dialog)); /* hide the dialog on close icon click */
  }

  return {
    init: init,
    show: show_table_view,
    hide: hide_table_view
  }
});
