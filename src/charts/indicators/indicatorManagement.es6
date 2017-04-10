/* created by amin, on May 20, 2016 */
import liveapi from 'websockets/binary_websockets';
import rv from 'common/rivetsExtra';
import _ from 'lodash';
import 'css!charts/indicators/indicatorManagement.css';
import root from 'text!charts/indicators/indicatorManagement.html';
import indicators_json from 'text!charts/indicators/indicators.json';
import indicatorBuilder from "charts/indicators/indicatorBuilder";
import windows from 'windows/windows';

let ind_win = null, ind_win_view = null, state = {};

/* rviets formatter to filter indicators based on their category */
rv.formatters['indicators-filter'] = (array, cat, search) => {
  search = search && search.toLowerCase();
  return array && array.filter((ind) => {
    return ind.category.indexOf(cat) !== -1 &&
      (ind.long_display_name.toLowerCase().indexOf(search) !== -1 ||
        ind.id.toLowerCase().indexOf(search) !== -1);
  }).sort((a, b) => {
    if (a.long_display_name < b.long_display_name) return -1;
    if (a.long_display_name > b.long_display_name) return +1;
    return 0;
  });
};
rv.formatters['indicators-favorites-filter'] = (array, search) => {
  search = search && search.toLowerCase();
  return array && array.filter((ind) => {
    return (ind.long_display_name.toLowerCase().indexOf(search) !== -1 ||
      ind.id.toLowerCase().indexOf(search) !== -1)
  }).sort((a, b) => {
    if (a.long_display_name < b.long_display_name) return -1;
    if (a.long_display_name > b.long_display_name) return +1;
    return 0;
  });
};
/* rviets formatter to extract and filter categories */
rv.formatters['indicators-categories'] = (array, search) => {
  search = search && search.toLowerCase();
  const indicators = array && array.filter((ind) => {
    return (ind.long_display_name.toLowerCase().indexOf(search) !== -1 ||
      ind.id.toLowerCase().indexOf(search) !== -1)
  });
  return indicators && _(indicators).map('category').flatten().uniq().value();
};

const init = () => {
  if (!ind_win)
    return new Promise((resolve, reject) => {
      init_dialog_async(root).then(resolve);
    });
  return Promise.resolve();
}

const init_dialog_async = (root) => {
  return new Promise((resolve, reject) => {
    root = $(root).i18n();

    let option = {
      title: 'Add/remove indicators'.i18n(),
      modal: true,
      destroy: () => {
        ind_win_view && ind_win_view.unbind();
        ind_win_view = null;
        ind_win.dialog('destroy').remove();
        ind_win = null;
      },
      open: () => { },
    };

    /* affiliates route */
    if (isAffiliates()) {
      option = _.extend(option, {
        resizable: false,
        width: Math.min(480, $(window).width() - 10),
        height: 400,
        ignoreTileAction: true,
        maximizable: false,
        minimizable: false,
        collapsable: false,
      });
    }
    /* normal route */
    else {
      option = _.extend(option, {
        width: 700,
        // minHeight: 60,
      })
    }
    ind_win = windows.createBlankWindow(root, option);
    init_state(root);
    resolve();
  });
}

const init_state = (root) => {
  state = {
    dialog: {
      title: 'Add/remove indicators'.i18n(),
      container_id: '',
      is_tick_chart: false
    },
    indicators: {
      search: '',
      array: [],
      current: [],
      favorites: []
    },
  };

  state.indicators.clear_search = () => { state.indicators.search = ''; }

  state.indicators.add = (indicator) => {
    if (indicator.fields) { /* use indicatorBuilder.es6 */
      const copy = JSON.parse(JSON.stringify(indicator));
      indicatorBuilder.open(copy, state.dialog.container_id)
    }
    else {
      const indicator_id = indicator.id;
      require(["charts/indicators/" + indicator_id + "/" + indicator_id], (ind) => {
        ind.open(state.dialog.container_id);
      });
    }
    ind_win.dialog('close');
  }

  state.indicators.edit = (indicator) => {
    if (indicator.fields) { /* use indicatorBuilder.es6 */
      const copy = JSON.parse(JSON.stringify(indicator));
      indicatorBuilder.open(copy, state.dialog.container_id, () => {
        state.indicators.remove(indicator);
      })
    }
    else {
      const indicator_id = indicator.id;
      require(["charts/indicators/" + indicator_id + "/" + indicator_id], (ind) => {
        ind.open(state.dialog.container_id, () => {
          state.indicators.remove(indicator);
        });
      });
    }
    ind_win.dialog('close');
  }

  state.indicators.remove = (indicator) => {
    const inx = state.indicators.current.indexOf(indicator);
    inx !== -1 && state.indicators.current.splice(inx, 1);

    const chart = $(state.dialog.container_id).highcharts();
    chart.series.forEach((series) => {
      if (series.options.isInstrument) {
        series.removeIndicator(indicator.series_ids);
      }
    });
  }

  state.indicators.favorite = (indicator) => {
    if (indicator.is_favorite) {
      indicator.is_favorite = false;
      const inx = state.indicators.favorites.indexOf(indicator);
      state.indicators.favorites.splice(inx, 1);
    }
    else {
      indicator.is_favorite = true;
      state.indicators.favorites.push(indicator);
    }

    const favorite_ids = state.indicators.favorites.map((ind) => { return ind.id; });
    local_storage.set('indicator-management-favorite-ids', JSON.stringify(favorite_ids));
  }

  ind_win_view = rv.bind(root[0], state);
}

const update_indicators = (series) => {
  let indicators = JSON.parse(indicators_json);
  const favorite_ids = local_storage.get('indicator-management-favorite-ids') || [];
  indicators = _.filter(indicators, (ind) => {
    ind.is_favorite = favorite_ids.indexOf(ind.id) !== -1;
    return !(ind.isTickChartNotAllowed && state.dialog.is_tick_chart);
  });

  let current = [];
  indicators.forEach((ind) => {
    series.forEach((seri) => {
      seri[ind.id] && seri[ind.id].forEach((instance) => {
        const ind_clone = _.cloneDeep(ind);
        //Show suffix if it is different than the long_display_name
        const show = ind.long_display_name !== instance.toString();
        ind_clone.name = ind.long_display_name;
        ind_clone.shortName = (show ? instance.toString() : "");
        ind_clone.showEdit = ind.editable;
        ind_clone.series_ids = instance.getIDs()
        ind_clone.current_options = _.cloneDeep(instance.options); /* used in indicatorBuilder.es6 */
        current.push(ind_clone);
      });
    });
  });

  state.categories = _(indicators).map('category').flatten().uniq().value();
  state.indicators.favorites = _.filter(indicators, 'is_favorite');
  state.indicators.array = indicators;
  state.indicators.current = current;
}

let first_time = true;
export const openDialog = (containerIDWithHash, title) => {
  init().then(() => {
    state.dialog.title = 'Add/remove indicators'.i18n() + (title ? ' - ' + title : '');
    state.dialog.container_id = containerIDWithHash;
    state.indicators.current = $(containerIDWithHash).data('indicators-current') || [];
    const time_period = $(containerIDWithHash).data('timePeriod');
    state.dialog.is_tick_chart = isTick(time_period);

    let series = $(containerIDWithHash).highcharts().series;
    series = _.filter(series, 'options.isInstrument');
    update_indicators(series);
    const normal_open = first_time || isAffiliates();
    ind_win.dialog('open')
    first_time = false;
  }).catch(console.error.bind(console));
}

export default {
  openDialog
}
