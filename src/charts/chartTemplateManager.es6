/**
 * Created by amin on July 31, 2016.
 */
define(['jquery', 'charts/chartWindow', 'common/rivetsExtra'], function($, chartWindow, rv) {
  require(['text!charts/ChartTemplateManager.html']);

  if(!local_storage.get('templates')) {
    local_storage.set('templates', []);
  }

  class ChartTemplateManager {
    constructor(root, dialog_id) {
      const state = this.init_state(root, dialog_id);
      require(['text!charts/ChartTemplateManager.html'], html => {
        root.append(html);
        this.view = rv.bind(root[0], state);
      });
    }

    init_state(root, dialog_id) {
      const chart = $('#' + dialog_id + '_chart').highcharts();
      const state = {
        route: { value: 'menu' },
        menu: {
          save_changes_disabled: true
        },
        templates: {
          array: [],
          save_as_value: '',
          rename_tmpl: null,
          rename_value: '',
          current: null,
        }
      };
      const {route, templates, menu} = state;

      route.update = value => {
        route.value = value;
      };

      menu.save_as = () => {
        const options = chartWindow.get_chart_options(dialog_id) || {};
        templates.save_as_value = options.name;
        route.update('save-as');
      }

      menu.templates = () => {
        templates.array = local_storage.get('templates'); // it can be modified from other dialogs.
        route.update('templates');
      }

      menu.save_changes = () => {
        const current = chartWindow.get_chart_options(dialog_id);

        const name = current.name;
        const array = local_storage.get('templates');
        const inx = _.findIndex(array, t => t.name === name);
        if(inx !== -1) {
          array[inx] = current;
        } else {
          array.push(current);
        }
        local_storage.set('templates', array);
        templates.array = array;
        templates.current = current;
      }

      templates.save_as = () => {
        const name = templates.save_as_value;
        const options = chartWindow.get_chart_options(dialog_id);
        if(options) {
          options.instrumentCode = '';
          options.instrumentName = '';
          options.name = name;
          const array = local_storage.get('templates');
          if(array.map(t => t.name).includes(name)) {
            $.growl.error({message: 'Template name already exists'.i18n() });
            return;
          }
          array.push(options);
          templates.current = options;
          local_storage.set('templates', array);
          templates.array = array;
          route.update('menu');
          chartWindow.set_chart_options(dialog_id, options); /* update the name */
        }
      }

      templates.remove = (tmpl) => {
        let array = local_storage.get('templates');
        templates.array = array.filter(t => t.name !== tmpl.name);
        local_storage.set('templates', templates.array);
      }

      templates.rename = tmpl => {
        templates.rename_value = tmpl.name;
        templates.rename_tmpl = tmpl;
        route.update('rename');
      }

      templates.do_rename = () => {
        const name = templates.rename_tmpl.name;
        const new_name = templates.rename_value;
        const array = local_storage.get('templates');
        if(array.map(t => t.name).includes(new_name)) {
            $.growl.error({message: 'Template name already exists'.i18n() });
            return;
        };
        const tmpl = array.find(t => t.name === name);
        if(tmpl) {
          tmpl.name = new_name;
          local_storage.set('templates', array);
          templates.array = array;
          route.update('templates');

          /* update template name in chartWindow options */
          const current = chartWindow.get_chart_options(dialog_id);
          if(current.name == name) {
            current.name = new_name;
            chartWindow.set_chart_options(dialog_id, current);
          }
        }
      }

      templates.apply = tmpl => {
        console.warn('apply', tmpl);
      }

      return state;
    }

    unbind() {
      this.view && this.view.unbind();
      this.view = null;
    }
  }

  return {
    init: (root, dialog_id) => new ChartTemplateManager(root, dialog_id)
  }
});
