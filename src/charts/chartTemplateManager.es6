/**
 * Created by amin on July 31, 2016.
 */
define(['jquery', 'common/rivetsExtra'], function($, rv) {

  class ChartTemplateManager {
    constructor(root) {
      this.root = root;
      this.init_state();
    }

    init_state() {
      var root = this.root;
      var state = {

      };
    }
  }

  return {
    init: root => new ChartTemplateManager(root)
  }
});
