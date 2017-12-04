/**
 * Created by Arnab Karmakar on 10/1/17.
 */
import $ from 'jquery';
import windows from '../windows/windows';
import rv from '../common/rivetsExtra';
import _ from 'lodash';
import html from 'text!./index.html';
import 'css!./index.css';
import '../common/util';
import liveapi from 'websockets/binary_websockets';
import { init as instrumentPromise } from '../instruments/instruments';

const TRADE_TYPES = [{
    code: 'CALL',
    name: 'Rise/Higher',
  },
  {
    code: 'PUT',
    name: 'Fall/Lower',
  },
  {
    code: 'ONETOUCH',
    name: 'Touch',
  },
  {
    code: 'NOTOUCH',
    name: 'NoTouch',
  },
  {
    code: 'EXPIRYMISS',
    name: 'Ends Out',
  },
  {
    code: 'EXPIRYRANGE',
    name: 'Ends In',
  },
  {
    code: 'DIGITDIFF',
    name: 'Digits Differ',
  },
  {
    code: 'DIGITMATCH',
    name: 'Digits Match',
  },
  {
    code: 'DIGITOVER',
    name: 'Digits Over',
  },
  {
    code: 'DIGITUNDER',
    name: 'Digits Under',
  },
  {
    code: 'DIGITODD',
    name: 'Digits Odd',
  },
  {
    code: 'DIGITEVEN',
    name: 'Digits Even',
  },
  {
    code: 'ASIANU',
    name: 'Asians Up',
  },
  {
    code: 'ASIAND',
    name: 'Asians Down',
}];
const COPY_TRADE_LOCAL_STORE_NAME = "copyTrade";
const DEFAULT_TRADE_TYPES = TRADE_TYPES.slice(0, 2).map(m => m.code);
const defaultCopySettings = traderApiToken => ({
  copy_start: traderApiToken,
  min_trade_stake: 10,
  max_trade_stake: 100,
  assets: _.cloneDeep(DEFAULT_ASSETS),
  trade_types: _.cloneDeep(DEFAULT_TRADE_TYPES),
});
const defaultTraderDetails = traderApiToken => ({
  open: false,
  started: false,
  disableRemove: false,
  disableStart: false,
  yourCopySettings: defaultCopySettings(traderApiToken),
});
const validateYourCopySettingsData = yourCopySettingsData => {
  let valid = false;
  let errorMessage = '';
  if (yourCopySettingsData) {
    if (yourCopySettingsData.assets && yourCopySettingsData.assets.length > 0) {
      if (yourCopySettingsData.trade_types && yourCopySettingsData.trade_types.length > 0) {
        if (yourCopySettingsData.min_trade_stake >= 1 && yourCopySettingsData.min_trade_stake <= 50000) {
          if (yourCopySettingsData.max_trade_stake >= 1 && yourCopySettingsData.max_trade_stake <= 50000) {
            if (yourCopySettingsData.min_trade_stake < yourCopySettingsData.max_trade_stake) {
              valid = true;
            } else {
              errorMessage = 'Min Trade Stake cannot be more than or equal to Max Trader stake';
            }
          } else {
            errorMessage = 'Max Trade Stake should between 1 and 50000';
          }
        } else {
          errorMessage = 'Min Trade Stake should between 1 and 50000';
        }
      } else {
        errorMessage = 'Trade types required';
      }
    } else {
      errorMessage = 'Assets required';
    }
  } else {
    errorMessage = 'Enter valid values for copy settings';
  }
  if (errorMessage) {
    $.growl.error({ message: errorMessage });
  }
  return valid;
};
const updateLocalStorage = scope => {
  const clonedScope = _.cloneDeep(scope);
  delete clonedScope.searchToken.disable;
  clonedScope.traderTokens.forEach(f => {
    delete f.open;
    delete f.started; //TODO - if server continues to copy trade when Webtrader is closed, we might not have to delete this
    delete f.disableRemove;
    delete f.disableStart;
  });
  local_storage.set(COPY_TRADE_LOCAL_STORE_NAME, clonedScope);
};

let GROUPED_INTRUMENTS = null; // For nice display purpose only
let DEFAULT_ASSETS = null;
//Get instrument list
instrumentPromise().then(instruments => {
  GROUPED_INTRUMENTS = _.flatten(instruments.map(m => {
    const displayName = m.display_name;
    return m.submarkets.map(mm => ({
      displayName: `${displayName} - ${mm.display_name}`,
      instruments: mm.instruments,
    }));
  }));
  let assets = [];
  instruments.forEach(eGrp => {
    eGrp.submarkets.forEach(eSubGrp => {
      eSubGrp.instruments.forEach(({ symbol, display_name }) => {
        assets.push({
          code: symbol,
          name: display_name,
        });
      });
    });
  });
  state.masterAssetList = assets;
  state.groupedAssets = GROUPED_INTRUMENTS;
  // Randomly add top 2 assets in default list
  DEFAULT_ASSETS = assets.slice(0, 2).map(m => m.code);
});

let win = null, win_view = null;

const state = {
  //[{ code: , name: }]
  masterAssetList: [],
  //[{ code: , name: }]
  masterTradeTypeList: _.cloneDeep(TRADE_TYPES),
  groupedAssets: [],
  allowCopy: {
    allow_copiers: false,
    onAllowCopyChange: _.debounce((event, scope) => {
      liveapi
        .send({
          set_settings: 1,
          allow_copiers: +scope.allowCopy.allow_copiers,
        })
        .catch(e => {
          $.growl.error({ message: e.message });
          //revert
          scope.allowCopy.allow_copiers = !scope.allowCopy.allow_copiers;
        });
    }, 250),
  },
  onOpenChange: (index) => {
    state.traderTokens[index].open = !state.traderTokens[index].open;
  },
  onStartedChange: (index) => {
    state.traderTokens[index].disableStart = true;
    const newStarted = !state.traderTokens[index].started;
    if (newStarted) {
      //Start copying
      //if started, revert back to last saved changes(in case user changed anything)
      const fromLocalStorage = local_storage.get(COPY_TRADE_LOCAL_STORE_NAME);
      if (fromLocalStorage) {
        const currentTraderTokenDetails_localSto = fromLocalStorage.traderTokens[index];
        if (currentTraderTokenDetails_localSto) {
          const newObj = {};
          _.merge(newObj, state.traderTokens[index], currentTraderTokenDetails_localSto);
          state.traderTokens.splice(index, 1);
          //Have to apply this trick in order to trigger update of UI using rivetsjs.
          _.defer(() => {
            state.traderTokens.splice(index, 0, newObj);
            liveapi
              .send(newObj.yourCopySettings)
              .then(() => {
                newObj.disableStart = false;
                newObj.started = true;
              })
              .catch(e => {
                $.growl.error({ message: e.message });
                newObj.disableStart = false;
              });
          });
        }
      }
    } else {
      //Stop copying
      liveapi.send({
          copy_stop: state.traderTokens[index].yourCopySettings.copy_start
        })
        .then(() => {
          state.traderTokens[index].disableStart = false;
          state.traderTokens[index].started = false;
        })
        .catch(e => {
          $.growl.error({ message: e.message });
          state.traderTokens[index].disableStart = false;
        });
    }
  },
  onRemove: (index) => {
    const toBeRemovedItem = state.traderTokens[index];
    toBeRemovedItem.disableRemove = true;
    liveapi.send({
      copy_stop: toBeRemovedItem.yourCopySettings.copy_start
    })
    .then(() => {
      state.traderTokens.splice(index, 1);
      updateLocalStorage(state);
    })
    .catch(e => {
      $.growl.error({ message: e.message });
      toBeRemovedItem.disableRemove = false;
    });
  },
  onMinTradeChange: (event, scope) => {
    const index = $(event.target).data('index');
    const value = event.target.value;
    scope.traderTokens[index].yourCopySettings.min_trade_stake = value;
  },
  onMaxTradeChange: (event, scope) => {
    const index = $(event.target).data('index');
    const value = event.target.value;
    scope.traderTokens[index].yourCopySettings.max_trade_stake = value;
  },
  onUpdateYourSettings: (index) => {
    if (validateYourCopySettingsData(state.traderTokens[index].yourCopySettings)) {
      updateLocalStorage(state);
      $.growl.notice({
        message: 'Updated successfully',
      });
    }
  },
  searchToken: {
    token: '',
    onTokenChange: (event, scope) => scope.searchToken.token = event.target.value,
    disable: false,
    onKeyDown: (event, scope) => {
      if (event.keyCode === 13) {
        scope.searchToken.addToken(event, scope);
      }
    },
    addToken: (event, scope) => {
      //If searchToken.token is empty, do nothing
      if (!scope.searchToken.token.match(/^[A-Za-z]+\d+$/)) {
        //TODO
        //$.growl.error({
        //  message: 'Enter a valid trader token',
        //});
        //return;
      }

      scope.searchToken.disable = true;

      liveapi
        .send({
          copytrading_statistics: 1,
          trader_id: scope.searchToken.token,
        })
        .then(copyStatData => {
          if (copyStatData.copytrading_statistics) {
            const traderTokenDetails = _.find(scope.traderTokens, f => f.yourCopySettings && f.yourCopySettings.copy_start === scope.searchToken.token);
            //Check if we already added this trader. If yes, then merge the changes
            if (traderTokenDetails) {
              _.merge(traderTokenDetails.traderStatistics, copyStatData.copytrading_statistics);
            }
            //If not added, then add this along with default yourCopySettings object
            else {
              scope.traderTokens.push(_.merge({
                traderStatistics: copyStatData.copytrading_statistics,
              }, defaultTraderDetails(scope.searchToken.token)));
            }
          }
          scope.searchToken.token = '';
          scope.searchToken.disable = false;
          updateLocalStorage(scope);
          _.defer(() => $(event.target).focus());
        })
        .catch(e => {
          $.growl.error({ message: e.message });
          scope.searchToken.disable = false;
        });
    },
  },
  /*
   {
     //We get this object from server - that's why the variables are named as per what server sends
     traderStatistics: {
       active_since:,
       monthly_profitable_trades:,
       yearly_profitable_trades:,
       last_12months_profitable_trades:,
       total_trades:,
       trades_profitable:,
       avg_duration:,
       avg_profit:,
       avg_loss:,
       trades_breakdown:,
       performance_probability:,
       copiers:,
     },
     yourCopySettings: {
       copy_start: <trader's API token>,
       min_trade_stake:,
       max_trade_stake:,
       assets: [], // <- This should be list of instrument code(s) e.g, frxEURUSD, R_100, etc
       trade_types: [],
     },
     open: false, // if this section is open
     started: false, // If this is currently being used for copying
     disableRemove: false,
   }
   */
  traderTokens: [],
};

const initConfigWindow = () => {
  const root = $(html).i18n();
  win_view = rv.bind(root[0], state);

  win = windows.createBlankWindow(root, {
    title: 'Copy Trade'.i18n(),
    resizable: true,
    collapsable: true,
    minimizable: true,
    maximizable: true,
    modal: false,
    width: 600,
    open: () => {
      //Refresh all token details
      const copyTrade = local_storage.get(COPY_TRADE_LOCAL_STORE_NAME);
      if (copyTrade) {
        _.merge(state, copyTrade);
        state.traderTokens = _.cloneDeep(state.traderTokens); // This is needed to trigger rivetsjs render
      }
      //Get the copy settings
      liveapi.send({ get_settings: 1 }).then(({get_settings = {}}) =>
        state.allowCopy.allow_copiers = get_settings.allow_copiers === 1);
      //Refresh locally stored trader statistics
      const _refreshTraderStat = async function () {
        for (let traderToken of copyTrade.traderTokens) {
          try {
            const copyStatData = await liveapi.send({
              copytrading_statistics: 1,
              trader_id: traderToken,
            });
            if (copyStatData.copytrading_statistics) {
              const traderTokenDetails = _.find(state.traderTokens, f => f.yourCopySettings && f.yourCopySettings.copy_start === traderToken);
              //Check if we already added this trader. If yes, then merge the changes
              if (traderTokenDetails) {
                _.merge(traderTokenDetails.traderStatistics, copyStatData.copytrading_statistics);
              }
            }
          } catch (e) {
          }
        }
      }
      if (copyTrade) {
        _refreshTraderStat();
      }
    },
    close: () => {
      win_view && win_view.unbind();
      win && win.dialog('destroy').remove();
      win_view = win = null;
    },
    'data-authorized' :'true',
  });
  win.track({
    module_id: 'copyTrade',
    is_unique: true,
    data: null,
  });

  win.dialog( 'open' );
};

export const init = ($menuLink) => {
  $menuLink.click(() => {
    if (!win) initConfigWindow();
    else win.moveToTop();
  });
};

export default { init }