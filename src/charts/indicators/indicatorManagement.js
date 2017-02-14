/* created by amin, on May 20, 2016 */
define(['websockets/binary_websockets', 'common/rivetsExtra' , 'lodash'], function(liveapi, rv, _) {
    require(['text!charts/indicators/indicatorManagement.html', 'css!charts/indicators/indicatorManagement.css', 'text!charts/indicators/indicators.json']);
    var ind_win = null;
    var ind_win_view = null;
    var state = {};

    /* rviets formatter to filter indicators based on their category */
    rv.formatters['indicators-filter'] = function(array, cat, search) {
      search = search && search.toLowerCase();
      return array && array.filter(function(ind){
        return ind.category.indexOf(cat) !== -1 && 
            (ind.long_display_name.toLowerCase().indexOf(search) !== -1 ||
              ind.id.toLowerCase().indexOf(search) !== -1);
      }).sort(function(a,b){
        if(a.long_display_name < b.long_display_name) return -1;
        if(a.long_display_name > b.long_display_name) return +1;
        return 0;
      });
    };
    rv.formatters['indicators-favorites-filter'] = function(array, search) {
      search = search && search.toLowerCase();
      return array && array.filter(function(ind){
        return (ind.long_display_name.toLowerCase().indexOf(search) !== -1 ||
                 ind.id.toLowerCase().indexOf(search) !== -1)
      }).sort(function(a,b){
        if(a.long_display_name < b.long_display_name) return -1;
        if(a.long_display_name > b.long_display_name) return +1;
        return 0;
      });
    };
    /* rviets formatter to extract and filter categories */
    rv.formatters['indicators-categories'] = function(array, search) {
      search = search && search.toLowerCase();
      var indicators = array && array.filter(function(ind){
        return (ind.long_display_name.toLowerCase().indexOf(search) !== -1 ||
                 ind.id.toLowerCase().indexOf(search) !== -1)
      });
      return indicators && _(indicators).map('category').flatten().uniq().value();
    };

    function init() {
      if(!ind_win)
        return new Promise(function(resolve, reject){
          require(['text!charts/indicators/indicatorManagement.html'], function(root){
            init_dialog_async(root).then(resolve);
          });
        });
      return Promise.resolve();
    }

    function init_dialog_async(root) {
        return new Promise(function(resolve, reject){
          root = $(root).i18n();

          var option = {
            title: 'Add/remove indicators'.i18n(),
            modal: true,
            destroy: function () {
              ind_win_view && ind_win_view.unbind();
              ind_win_view = null;
              ind_win.dialog('destroy').remove();
              ind_win = null;
            },
            open: function () { },
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

          require(['windows/windows'], function(windows){
            ind_win = windows.createBlankWindow(root, option);
            init_state(root);
            resolve();
          });

        });
    }

    function init_state(root){
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

      state.indicators.clear_search = function() { state.indicators.search = ''; }

      state.indicators.add = function(indicator){
        if(indicator.fields) { /* use indicatorBuilder.es6 */
          require(["charts/indicators/indicatorBuilder"], function(indicatorBuilder) {
            const copy = JSON.parse(JSON.stringify(indicator));
            indicatorBuilder.open(copy, state.dialog.container_id)
          });
        }
        else {
          var indicator_id = indicator.id;
          require(["charts/indicators/" + indicator_id + "/" + indicator_id], function (ind) {
              ind.open(state.dialog.container_id);
          });
        }
        ind_win.dialog('close');
      }

      state.indicators.edit = function(indicator){
        if(indicator.fields) { /* use indicatorBuilder.es6 */
          require(["charts/indicators/indicatorBuilder"], function(indicatorBuilder) {
            const copy = JSON.parse(JSON.stringify(indicator));
            indicatorBuilder.open(copy, state.dialog.container_id, function() {
                state.indicators.remove(indicator);
            })
          })
        }
        else {
          var indicator_id = indicator.id;
          require(["charts/indicators/" + indicator_id + "/" + indicator_id], function (ind) {
              ind.open(state.dialog.container_id, function() {
                state.indicators.remove(indicator);
              });
          });
        }
        ind_win.dialog('close');
      }

      state.indicators.remove = function(indicator){
        var inx = state.indicators.current.indexOf(indicator);
        inx !== -1 && state.indicators.current.splice(inx, 1);

        var chart = $(state.dialog.container_id).highcharts();
        chart.series.forEach(function(series) {
            if (series.options.isInstrument) {
                series.removeIndicator(indicator.series_ids);
            }
        });
      }

      state.indicators.favorite = function(indicator) {
        if(indicator.is_favorite) {
          indicator.is_favorite = false;
          var inx = state.indicators.favorites.indexOf(indicator);
          state.indicators.favorites.splice(inx,1);
        }
        else {
          indicator.is_favorite = true;
          state.indicators.favorites.push(indicator);
        }

        var favorite_ids = state.indicators.favorites.map(function(ind) { return ind.id; });
        local_storage.set('indicator-management-favorite-ids', JSON.stringify(favorite_ids));
      }

      ind_win_view = rv.bind(root[0], state);
    }

    function update_indicators(series) {
      require(['text!charts/indicators/indicators.json'], function(indicators_json){
        var indicators = JSON.parse(indicators_json);
        var favorite_ids = local_storage.get('indicator-management-favorite-ids') || [];
        indicators = _.filter(indicators, function(ind) {
          ind.is_favorite = favorite_ids.indexOf(ind.id) !== -1;
          return !(ind.isTickChartNotAllowed && state.dialog.is_tick_chart);
        });

        var current = [];
        indicators.forEach(function(ind){
          series.forEach(function(seri){
            seri[ind.id] && seri[ind.id].forEach(function(instance){
                var ind_clone = _.cloneDeep(ind);
                //Show suffix if it is different than the long_display_name
                var show = ind.long_display_name !== instance.toString();
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
      });
    }

    var first_time = true;
    return {
      openDialog : function( containerIDWithHash, title ) {
        init().then(function(){
            state.dialog.title = 'Add/remove indicators'.i18n() + (title ? ' - ' + title : '');
            state.dialog.container_id = containerIDWithHash;
            state.indicators.current = $(containerIDWithHash).data('indicators-current') || [];
            var time_period = $(containerIDWithHash).data('timePeriod');
            state.dialog.is_tick_chart = isTick(time_period);

            var series = $(containerIDWithHash).highcharts().series;
            series = _.filter(series, 'options.isInstrument');
            update_indicators(series);
            var normal_open = first_time || isAffiliates();
            ind_win.dialog('open')
            first_time = false;
        }).catch(console.error.bind(console));
      }
    }

});
