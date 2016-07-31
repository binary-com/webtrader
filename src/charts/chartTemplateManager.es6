/**
 * Created by amin on July 31, 2016.
 */
define(['jquery', 'common/rivetsExtra'], function($, rv) {
  require(['text!charts/ChartTemplateManager.html']);

  class ChartTemplateManager {
    constructor(root) {
      const state = this.init_state(root);
      require(['text!charts/ChartTemplateManager.html'], html => {
        root.append(html);
        this.view = rv.bind(root[0], state);
      });
    }

    init_state(root) {
      var state = {
        route: { value: 'menu' },
        templates: {

        },
        menu: {

        }
      };
      const {route, templates, menu } = state;

      route.update = value => {
        route.value = value;
      };

      return state;
    }

    unbind() {
      this.view && this.view.unbind();
      this.view = null;
    }
  }

  return {
    init: root => new ChartTemplateManager(root)
  }
});
