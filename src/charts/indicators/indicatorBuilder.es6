/**
 * Created by arnab on 3/1/15.
 */

import $ from "jquery";
import _ from "lodash";
import rv from '../../common/rivetsExtra';
import 'jquery-ui';
import 'color-picker';
import 'ddslick';

let before_add_callback = null;

const closeDialog = (dialog) => {
    dialog.dialog("destroy").remove();
}

const init = async (chart, indicator) => {

    require(['css!charts/indicators/indicatorBuilder.css']);

    let [$html] = await require(['text!charts/indicators/indicatorBuilder.html']);

    const state = {
      id: indicator.id,
      fields: indicator.fields.map(f => ({...f, is_valid: true})),
      levels: indicator.levels, /* optional */
      formula: indicator.formula, /* optional */
      description: indicator.description,
      cdl_indicator: indicator.cdl_indicator, /* optional (cdl indicators only) */
      dash_styles: [
        "Solid", "ShortDash", "ShortDot", "ShortDashDot", "ShortDashDotDot",
        "Dot", "Dash", "LongDash", "DashDot", "LongDashDot", "LongDashDotDot"
      ].map(dash => ({ name: dash, url: `images/dashstyle/${dash}.svg`})),
      update_value(row, value) {
        row.value = value;
      },
      level: {
        dialog: {
          marginTop: '0px',
          visible: false,
          add: () => {
            const fields = state.levels.fields;
            const level = { };
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
          const marginTop =  $html.find('.levels-tr').next().height() - 3;
          state.level.dialog.marginTop = marginTop*-1 + 'px';
          state.level.dialog.visible = !state.level.dialog.visible;
          if(state.level.dialog.visible) {
            const content = $('.indicator-builder');
            content.animate({ scrollTop: content.prop('scrollHeight')}, 700);
          }
        }
      }
    }

    if(indicator.editable && indicator.current_options) {
      _.forEach(indicator.current_options, (opt_val, opt_key) => {
        const field = _.find(state.fields, {key: opt_key})
        field && (field.value = opt_val);
      });

      if(indicator.current_options.levels) {
        state.levels.values = _.cloneDeep(indicator.current_options.levels);
      }
    }


    $html = $($html);
    const view = rv.bind($html[0], state);

    const options = {
        title: indicator.long_display_name,
        autoOpen: false,
        resizable: false,
        width: 350,
        height: 400,
        modal: true,
        my: 'center',
        at: 'center',
        of: window,
        dialogClass:'indicator-builder-ui-dialog',
        buttons: [
            {
                text: "OK",
                click: () => {
                    const options = { };
                    let fields_are_valid = true;
                    if(!indicator.cdl_indicator) { /* normal indicator */
                      if(state.levels) {
                        options.levels = JSON.parse(JSON.stringify(state.levels.values));
                      }
                      state.fields.forEach(field => {
                         fields_are_valid = field.is_valid && fields_are_valid;
                         if(field.type !== 'plotcolor') {
                            options[field.key] = field.value
                            return;
                         }
                         options[field.key] = [];
                         if(options.levels && options.levels.length > 0) {
                            options[field.key].push({
                               color: field.value,
                               from: _.minBy(options.levels, 'value').value,
                               to: _.maxBy(options.levels, 'value').value
                            });
                         }
                      });
                    }
                    else { /* cdl indicator */
                       options.cdlIndicatorCode = state.id;
                       options.onSeriesID = chart.series[0].options.id
                    }

                   if(state.id === 'fractal') { /* special case */
                       options.onSeriesID = chart.series[0].options.id
                   }

                   if(!fields_are_valid) {
                      $.growl.error({ message: "Invalid parameter(s)!".i18n() });
                      return;
                   }

                    before_add_callback && before_add_callback();

                    //Add indicator for the main series
                    chart.series[0].addIndicator(state.id, options);

                    closeDialog($html);
                }
            },
            {
                text: "Cancel",
                click: () => closeDialog($html)
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
    return $html;
}

/**
 * @param indicator - indicator options from indicators.json
 * @param containerIDWithHash - containerId where indicator needs to be added
 * @param before_add_cb - callback that will be called just before adding the indicator
 */
export const open = async (indicator, containerIDWithHash, before_add_cb) => {
    before_add_callback = before_add_cb || before_add_callback;

    const chart = $(containerIDWithHash).highcharts();
    await init(chart, indicator);

    $(".indicator-builder").dialog('open');
    $(".indicator-builder").animate({ scrollTop: 0 }, 800);
}
export default { open, };
