import { start, close as stop } from './server';
import extend from 'lodash/extend';
import resourceTestGroup from './resources';
import extraTestGroup from './extra';
import chartTestGroup from './chart';

const _newConf = extend({}, {

      before: (browser) => {
        start();
      },

      after: (browser) => {
        stop();
        browser.end();
      },

    },

    extraTestGroup,
    resourceTestGroup,
    chartTestGroup

);

export default _newConf;
