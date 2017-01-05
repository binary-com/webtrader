/**
 * Created by amin on July 31, 2016.
 */
define(['jquery', 'charts/chartWindow', 'common/rivetsExtra', 'lodash'], function($, chartWindow, rv, _) {
  require(['text!charts/chartTemplateManager.html']);

  if(!local_storage.get('templates')) {
    local_storage.set('templates', []);
  }

  class ChartTemplateManager {
    constructor(root, dialog_id) { 
      const _this = this;
      const templates = local_storage.get("templates");
      templates.forEach(function(tmpl){
        if(!tmpl.random){
          tmpl = _this.setRandom(tmpl);
        }
      });
      local_storage.set("templates",templates);

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
      const current_tmpl = this.setRandom(chartWindow.get_chart_options(dialog_id));
      templates.array = local_storage.get("templates");
      if(_.findIndex(templates.array, t => t.random === current_tmpl.random) !== -1) {
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
        templates.save_as_value = options.name;
        route.update('save-as');
      }

      menu.templates = () => {
        templates.array = local_storage.get('templates'); // it can be modified from other dialogs.
        route.update('templates');
      }

      menu.save_changes = () => {
        const current = this.setRandom(chartWindow.get_chart_options(dialog_id));
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
        $.growl.notice({message: 'Template changes saved '.i18n() + '(' + current.name + ')'});
      }

      menu.open_file_selector = (event) => {
        $(root).find("input[type=file]").click();
      }

      menu.upload = (event) => {
        const _this = this;
        const file = event.target.files[0];
        event.target.value = null;
        if(!file)
          return;

        const reader = new FileReader();
        reader.onload = (e) => {
          const contents = e.target.result;
          const array = local_storage.get("templates");
          let data = null;
          try{
            data = JSON.parse(contents);
            data.name = data.name.substring(0,20).replace(/[<>]/g,"-");
            const hash = data.random;
            data = _this.setRandom(data);
            if(hash !== data.random){
              throw "Invalid JSON file".i18n();
            }
             
            if(_this.isDuplicate(data, array)){
              return;
            }

            if(!data.indicators) {
              throw "Invalid template type".i18n();
            }
          } catch(e){
            $.growl.error({message:e});
            return;
          }
          
          // Rename duplicate template names.
          let file = 1,
              name = data.name;
          while(1){
            if(array.map(t => t.name).includes(name)) {
              name = data.name + " (" + file + ")"
              file++;
              continue;
            }
            data.name = name;
            break;
          }

          templates.apply(data);
          array.push(data);
          local_storage.set('templates', array);
          templates.array = array;
          $.growl.notice({message: "Successfully applied the template and saved it as ".i18n() + "<b>" + data.name + "</b>"});
        }

        reader.readAsText(file);
      }

      templates.save_as = (event) => {
        event.preventDefault();
        const name = templates.save_as_value.substring(0,20).replace(/[<>]/g,"-");
        const options = this.setRandom(chartWindow.get_chart_options(dialog_id));
        if(options) {
          options.name = name;
          const array = local_storage.get('templates');
          if(this.isDuplicate(options, array)){
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
        var json = JSON.stringify(tmpl);
        download_file_in_browser(tmpl.name + '.json', 'text/json;charset=utf-8;', json);
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
        const new_name = templates.rename_value.substring(0,20).replace(/[<>]/g,"-");
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
          const current = this.setRandom(chartWindow.get_chart_options(dialog_id));
          if(current.name == name) {
            current.name = new_name;
            chartWindow.set_chart_options(dialog_id, current);
            templates.current = current;
          }
        }
      }

      templates.apply = tmpl => {
        chartWindow.apply_chart_options(dialog_id, tmpl);
        templates.current = tmpl;
      }

      templates.confirm = (tmpl, event) => {
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

      return state;
    }

    // Create random independent of template name to find duplicates more accurately.
    setRandom(tmpl) {
      const name = tmpl.name;
      delete tmpl.name;
      delete tmpl.random;
      tmpl.random = this.hashCode(JSON.stringify(tmpl));
      tmpl.name = name;
      return tmpl;
    }

    hashCode(s) {
      return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
    }

    isDuplicate(tmpl, array){
      // get template with same values.
      const tmpl_copy = _.find(array, ['random', tmpl.random]);
      if(tmpl_copy){
        $.growl.error({message: 'Template already saved as '.i18n() +'<b>' + tmpl_copy.name + '</b>.'});
        return true;
      }
      return false;
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
