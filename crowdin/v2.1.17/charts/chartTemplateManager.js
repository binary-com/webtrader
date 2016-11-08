'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by amin on July 31, 2016.
 */
define(['jquery', 'charts/chartWindow', 'common/rivetsExtra'], function ($, chartWindow, rv) {
  require(['text!charts/chartTemplateManager.html']);

  if (!local_storage.get('templates')) {
    local_storage.set('templates', []);
  }

  var ChartTemplateManager = function () {
    function ChartTemplateManager(root, dialog_id) {
      var _this = this;

      _classCallCheck(this, ChartTemplateManager);

      var state = this.init_state(root, dialog_id);
      require(['text!charts/chartTemplateManager.html'], function (html) {
        root.append(html.i18n());
        _this.view = rv.bind(root[0], state);
      });
    }

    _createClass(ChartTemplateManager, [{
      key: 'init_state',
      value: function init_state(root, dialog_id) {
        var chart = $('#' + dialog_id + '_chart').highcharts();
        var state = {
          route: { value: 'menu' },
          menu: {
            save_changes_disabled: true
          },
          templates: {
            array: local_storage.get('templates'),
            save_as_value: '',
            rename_tmpl: null,
            rename_value: '',
            current: null
          }
        };
        var route = state.route;
        var templates = state.templates;
        var menu = state.menu;

        /* persist applied templates between page reloads */

        var current_tmpl = chartWindow.get_chart_options(dialog_id);
        if (_.findIndex(templates.array, function (t) {
          return t.name === current_tmpl.name;
        }) !== -1) {
          templates.current = current_tmpl;
        }

        route.update = function (value) {
          route.value = value;
        };

        menu.save_as = function () {
          var options = chartWindow.get_chart_options(dialog_id) || {};
          options.name = [options.timePeriod + ' ' + options.type].concat(options.indicators.map(function (ind) {
            return ind.name;
          })).concat(options.overlays.map(function (overlay) {
            return overlay.displaySymbol;
          })).join(' + ');
          templates.save_as_value = options.name.substring(0, 20);
          route.update('save-as');
        };

        menu.templates = function () {
          templates.array = local_storage.get('templates'); // it can be modified from other dialogs.
          route.update('templates');
        };

        menu.save_changes = function () {
          var current = chartWindow.get_chart_options(dialog_id);

          var name = current.name;
          var array = local_storage.get('templates');
          var inx = _.findIndex(array, function (t) {
            return t.name === name;
          });
          if (inx !== -1) {
            array[inx] = current;
          } else {
            array.push(current);
          }
          local_storage.set('templates', array);
          templates.array = array;
          templates.current = current;
          $.growl.notice({ message: $("<div/>").text('Template changes saved '.i18n() + '(' + current.name + ')').html() });
        };

        menu.open_file_selector = function (event) {
          $(event.target).next().click();
        };

        menu.upload = function (event) {
          var file = event.target.files[0];
          if (!file) return;

          var reader = new FileReader();
          reader.onload = function (e) {
            var contents = e.target.result;
            var data = null;
            try {
              data = JSON.parse(contents);
              var hash = data.random;
              delete data.random;
              if (hash !== hashCode(JSON.stringify(data))) {
                throw new UserException("InvalidHash");;
              }
            } catch (e) {
              $.growl.error({ message: "Invalid json file." });
              return;
            }
            console.log(templates.current);
            templates.apply(data);
            var array = local_storage.get('templates');;
            var unique = false,
                file = 1,
                name = data.name;
            while (!unique) {
              if (array.map(function (t) {
                return t.name;
              }).includes(name)) {
                name = data.name + " (" + file + ")";
                file++;
                continue;
              }
              data.name = name;
              unique = true;
            }

            array.push(data);
            local_storage.set('templates', array);
            templates.array = array;
            $.growl.notice({ message: "Successfully applied the template and saved it as ".i18n() + "<b>" + data.name + "</b>" });
          };

          reader.readAsText(file);
        };

        templates.save_as = function (event) {
          event.preventDefault();
          var name = templates.save_as_value.substring(0, 20);
          var options = chartWindow.get_chart_options(dialog_id);
          if (options) {
            options.name = name;
            var array = local_storage.get('templates');
            if (array.map(function (t) {
              return t.name;
            }).includes(name)) {
              $.growl.error({ message: 'Template name already exists'.i18n() });
              return;
            }
            array.push(options);
            templates.current = options;
            local_storage.set('templates', array);
            templates.array = array;
            route.update('menu');
            chartWindow.set_chart_options(dialog_id, options); /* update the name */
          }
        };

        templates.download = function (tmpl) {
          $.growl.notice({ message: "Downloading template as <b>".i18n() + tmpl.name + ".json</b>" });
        };

        templates.remove = function (tmpl) {
          var array = local_storage.get('templates');
          templates.array = array.filter(function (t) {
            return t.name !== tmpl.name;
          });
          local_storage.set('templates', templates.array);
          if (templates.current && tmpl.name === templates.current.name) {
            templates.current = null;
          }
        };

        templates.rename = function (tmpl) {
          templates.rename_value = tmpl.name;
          templates.rename_tmpl = tmpl;
          route.update('rename');
        };

        templates.do_rename = function (event) {
          event.preventDefault();
          var name = templates.rename_tmpl.name;
          var new_name = templates.rename_value.substring(0, 20);
          var array = local_storage.get('templates');
          if (array.map(function (t) {
            return t.name;
          }).includes(new_name)) {
            $.growl.error({ message: 'Template name already exists'.i18n() });
            return;
          };
          var tmpl = array.find(function (t) {
            return t.name === name;
          });
          if (tmpl) {
            tmpl.name = new_name;
            local_storage.set('templates', array);
            templates.array = array;
            route.update('templates');

            /* update template name in chartWindow options */
            var current = chartWindow.get_chart_options(dialog_id);
            if (current.name == name) {
              templates.current = current;
              current.name = new_name;
              chartWindow.set_chart_options(dialog_id, current);
            }
          }
        };

        templates.apply = function (tmpl) {
          chartWindow.apply_chart_options(dialog_id, tmpl);
          templates.current = tmpl;
        };

        templates.confirm = function (tmpl, event) {
          route.update("confirm");
          var action = event.currentTarget.text;
          templates.confirm_prevMenu = action === "Delete".i18n() ? "templates" : "menu";
          templates.confirm_text = action === "Delete" ? "Are you sure you want to delete template?".i18n() : "Are you sure you want to overwrite current template?".i18n();

          templates.confirm_yes = function () {
            action === "Delete".i18n() ? templates.remove(tmpl) : menu.save_changes();
            templates.confirm_no();
          };

          templates.confirm_no = function () {
            route.update(templates.confirm_prevMenu);
          };
        };

        var hashCode = function hashCode(s) {
          return s.split("").reduce(function (a, b) {
            a = (a << 5) - a + b.charCodeAt(0);return a & a;
          }, 0);
        };

        rv.binders.download = function (el, value) {
          value.random = hashCode(JSON.stringify(value));
          var href = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(value));

          $(el).attr("href", href);
          $(el).attr("download", value.name + ".json");
        };

        return state;
      }
    }, {
      key: 'unbind',
      value: function unbind() {
        this.view && this.view.unbind();
        this.view = null;
      }
    }]);

    return ChartTemplateManager;
  }();

  return {
    init: function init(root, dialog_id) {
      return new ChartTemplateManager(root, dialog_id);
    }
  };
});
//# sourceMappingURL=chartTemplateManager.js.map
