/**
 * Created by arnab on 3/1/15.
 */

import $ from "jquery";
import _ from "lodash";
import rv from '../../../common/rivetsExtra';
import 'jquery-ui';
import 'color-picker';
import 'ddslick';
import 'colorpicker';

let before_add_callback = null;

function closeDialog(dialog) {
    dialog.dialog("close");
    dialog.find("*").removeClass('ui-state-error');
}

async function init( containerIDWithHash, callback ) {

    require(['css!charts/indicators/atr/atr.css']);

    let [$html, data] = await require(['text!charts/indicators/atr/atr.html', 'text!charts/indicators/indicators.json']);

    var defaultStrokeColor = '#cd0a0a';

    data = JSON.parse(data).atr;

    const state = {
      fields: data.fields,
      levels: data.levels, /* optional */
      description: data.description,
      dash_styles: [
        "Solid", "ShortDash", "ShortDot", "ShortDashDot", "ShortDashDotDot",
        "Dot", "Dash", "LongDash", "DashDot", "LongDashDot", "LongDashDotDot"
      ].map(dash => ({ name: dash, url: `url('images/dashstyle/${dash}.svg')`})),
      update_dash(dash, field) {
        field.value = dash.name;
      },
      update_appliedto(row, value) {
        row.value = value*1;
      },
      level: {
        dialog: {
          bottom: '0px',
          visible: false,
          add: () => {
            const fields = state.levels.fields;
            var level = { };
            fields.forEach(field => level[field.key] = field.value);
            level.label = { text: level.value };
            state.levels.values.push(level);
            state.level.dialog.visible = false;
          },
          cancel: () => { state.level.dialog.visible = false; }
       },
        remove: row => {
          const values = state.levels.values;
          const inx = values.indexOf(row);
          inx !== -1 && values.splice(inx, 1);
        },
        add: (e) => {
          const btn = $(e.target);
          const bottom = btn.position().top + btn.closest('table').parent().scrollTop() + 45;
          state.level.dialog.bottom = bottom*-1 + 'px';
          state.level.dialog.visible = !state.level.dialog.visible;
        }
      }
    }

    $html = $($html);
    const view = rv.bind($html[0], state);

    var options = {
        autoOpen: false,
        resizable: false,
        width: 350,
        height:400,
        modal: true,
        my: 'center',
        at: 'center',
        of: window,
        dialogClass:'atr-ui-dialog',
        buttons: [
            {
                text: "OK",
                click: function() {
                    var options = { };
                    if(state.levels) {
                      options.values = JSON.parse(JSON.stringify(state.levels.values));
                    }
                    state.fields.forEach(field => options[field.key] = field.value);

                    before_add_callback && before_add_callback();
                    //Add ATR for the main series
                    $($(".atr").data('refererChartID')).highcharts().series[0].addIndicator('atr', options);

                    closeDialog($html);
                }
            },
            {
                text: "Cancel",
                click: function() { closeDialog(this); }
            }
        ],
        icons: {
            close: 'custom-icon-close',
            minimize: 'custom-icon-minimize',
            maximize: 'custom-icon-maximize'
        }
    };
    $html.dialog(options)
      .dialogExtend(_.extend(options, {maximizable:false, minimizable:false, collapsable:false}));

    /*
    $html.find('select').each(function(index, value){
        $(value).selectmenu({
            width : 150
        }).selectmenu("menuWidget").css("max-height","85px");
    });
    */

    callback && callback();
}

/**
 * @param containerIDWithHash - containerId where indicator needs to be added
 * @param before_add_cb - callback that will be called just before adding the indicator
 */
export const open = function (containerIDWithHash, before_add_cb) {
    before_add_callback = before_add_cb || before_add_callback;
    var open = function() {
      $(".atr").data('refererChartID', containerIDWithHash).dialog( "open" );
    };

    if ($(".atr").length == 0)
      init(containerIDWithHash, open);
    else
      open();
}
export default { open, };
