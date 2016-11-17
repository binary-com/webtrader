/**
 * Created by amin on July 31, 2016.
 */
define(['jquery', 'charts/chartWindow', 'common/rivetsExtra'], function($, chartWindow, rv) {
  require(['text!charts/chartTemplateManager.html']);

  if(!local_storage.get('templates')) {
    local_storage.set('templates', []);
  }

  class ChartTemplateManager {
    constructor(root, dialog_id) {
      const state = this.init_state(root, dialog_id);
      require(['text!charts/chartTemplateManager.html'], html => {
        root.append(html.i18n());
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
          array: local_storage.get('templates'),
          save_as_value: '',
          rename_tmpl: null,
          rename_value: '',
          current: null,
        }
      };
      const {route, templates, menu} = state;

      /* persist applied templates between page reloads */
      const current_tmpl = chartWindow.get_chart_options(dialog_id);
      if(_.findIndex(templates.array, t => t.name === current_tmpl.name) !== -1) {
        templates.current = current_tmpl;
      }

      route.update = value => {
        route.value = value;
      };

      menu.save_as = () => {
        const options = chartWindow.get_chart_options(dialog_id) || {};
        options.name = [`${options.timePeriod} ${options.type}`]
                      .concat(options.indicators.map(ind => ind.name))
                      .concat(options.overlays.map(overlay => overlay.displaySymbol))
                      .join(' + ');
        templates.save_as_value = options.name.substring(0,20);
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
        $.growl.notice({message: $("<div/>").text('Template changes saved '.i18n() + '(' + current.name + ')').html()});
      }

      menu.open_file_selector = (event) => {
        $(root).find("input[type=file]").click();
      }

      menu.upload = (event) => {
        const file = event.target.files[0];
        if(!file)
          return;

        const reader = new FileReader();
        reader.onload = (e) => {
          const contents = e.target.result;
          let data = null;
          try{
           data = JSON.parse(contents);
           const hash = data.random;
           delete data.random;
           if(hash !== hashCode(JSON.stringify(data))){
            throw new UserException("InvalidHash");;
           }
           if(!data.indicators) {
             // We are not adding .template_type because we don't want to break
             // exising user templates for charts, so if it has .indicators property
             // then it's a chart template for sure.
             throw new UserException("Invalid template type.");
           }
          } catch(e){
            $.growl.error({message:"Invalid json file."});
            return;
          }
          console.log(templates.current);
          templates.apply(data);
          const array = local_storage.get('templates');;
          let unique = false,
              file = 1,
              name = data.name;
          while(!unique){
            if(array.map(t => t.name).includes(name)) {
              name = data.name + " (" + file + ")"
              file++;
              continue;
            }
            data.name = name;
            unique = true;
          }

          array.push(data);
          local_storage.set('templates', array);
          templates.array = array;
          $.growl.notice({message: "Successfully applied the template and saved it as ".i18n() + "<b>" + data.name + "</b>"});
        }

        reader.readAsText(file);
      }

      templates.save_as = (event) => {
        event.preventDefault();
        const name = templates.save_as_value.substring(0,20);
        const options = chartWindow.get_chart_options(dialog_id);
        if(options) {
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

      templates.download = (tmpl) => {
        $.growl.notice({message: "Downloading template as <b>".i18n() + tmpl.name + ".json</b>"});
      }

      templates.remove = (tmpl) => {
        let array = local_storage.get('templates');
        templates.array = array.filter(t => t.name !== tmpl.name);
        local_storage.set('templates', templates.array);
        if(templates.current && tmpl.name === templates.current.name) {
          templates.current = null;
        }
      }

      templates.rename = tmpl => {
        templates.rename_value = tmpl.name;
        templates.rename_tmpl = tmpl;
        route.update('rename');
      }

      templates.do_rename = (event) => {
        event.preventDefault();
        const name = templates.rename_tmpl.name;
        const new_name = templates.rename_value.substring(0,20);
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
            templates.current = current;
            current.name = new_name;
            chartWindow.set_chart_options(dialog_id, current);
          }
        }
      }

      templates.apply = tmpl => {
        chartWindow.apply_chart_options(dialog_id, tmpl);
        templates.current = tmpl;
      }

      templates.confirm = (tmpl, event) => {
        if(!templates.current)
          return;
        route.update("confirm");
        const action = event.currentTarget.text;
        templates.confirm_prevMenu = action === "Delete".i18n() ? "templates" : "menu";
        templates.confirm_text = action === "Delete" ? "Are you sure you want to delete template?".i18n() : "Are you sure you want to overwrite current template?".i18n();

        templates.confirm_yes = () => {
          action === "Delete".i18n()? templates.remove(tmpl) : menu.save_changes();
          templates.confirm_no();
        }

        templates.confirm_no = () => {
          route.update(templates.confirm_prevMenu);
        }
      }

      const hashCode = (s) => {
        return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
      }

      rv.binders.download = function(el, value) {
        value.random = hashCode(JSON.stringify(value));
        const href = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(value));

        $(el).attr("href", href);
        $(el).attr("download",value.name + ".json");
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
