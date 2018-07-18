import $ from 'jquery';
import windows from '../windows/windows';
import rv from '../common/rivetsExtra';
import _ from 'lodash';
import html from 'text!./index.html';
import 'css!./index.css';
import { trade_types } from '../common/common';
import '../common/util';
import liveapi from 'websockets/binary_websockets';
import validateToken from 'websockets/validateToken';
import { init as instrumentPromise } from '../instruments/instruments';

// While using copy trader, this cannot be NULL
const getLoggedInUserId = () => local_storage.get("oauth")[0].id;

const TRADE_TYPES = trade_types;

const form_error_messages = {
    invalid_stake_limit: 'Min trade stake should be lower than max trade stake.',
    token_already_added: 'Token already added',
    enter_valid_token: 'Enter a valid trader token',
    refresh_failed: 'Refresh failed',
};

const getStorageName = () => `copyTrade_${getLoggedInUserId()}`;

const DEFAULT_TRADE_TYPES = TRADE_TYPES.slice(0, 2).map(m => m.code);

const defaultCopySettings = (traderApiToken) => ({
  copy_start: traderApiToken,
  min_trade_stake: 10,
  max_trade_stake: 100,
  assets: _.cloneDeep(DEFAULT_ASSETS),
  trade_types: _.cloneDeep(DEFAULT_TRADE_TYPES),
});

const defaultTraderDetails = (traderApiToken, loginid) => ({
  open: false,
  started: false,
  disableStart: false,
  loginid,
  yourCopySettings: defaultCopySettings(traderApiToken),
});

const validate_min_max_stake = (yourCopySettingsData) => {
  const { min_trade_stake, max_trade_stake } = yourCopySettingsData;
  if (min_trade_stake > max_trade_stake) {
    return false;
  }
  return true;
};

const updateLocalStorage = _.debounce(scope => {
  const clonedScope = _.cloneDeep(scope);
  delete clonedScope.searchToken.disable;
  local_storage.set(getStorageName(), clonedScope);
}, 50);

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
  DEFAULT_ASSETS = assets.filter(f => f.code === 'R_10').map(m => m.code);
});

const refreshTraderStats = (loginid, token, scope) => liveapi
  .send({
    copytrading_statistics: 1,
    trader_id: loginid,
  })
  .then(copyStatData => {
    if (copyStatData.copytrading_statistics) {
      const traderTokenDetails = _.find(scope.traderTokens, f =>
        f.yourCopySettings && f.yourCopySettings.copy_start === token);
      //Check if we already added this trader. If yes, then merge the changes
      if (traderTokenDetails) {
        _.merge(traderTokenDetails.traderStatistics, copyStatData.copytrading_statistics);
      }
      //If not added, then add this along with default yourCopySettings object
      else {
        scope.traderTokens.push(_.merge({
          traderStatistics: copyStatData.copytrading_statistics,
        }, defaultTraderDetails(token, loginid)));
      }
    }
    updateLocalStorage(scope);
  });

let win = null, win_view = null;

const state = {
  masterAssetList: [],
  masterTradeTypeList: _.cloneDeep(TRADE_TYPES),
  groupedAssets: [],
  is_loading: true,
  is_virtual: false,
  allowCopy: {
    allow_copiers: 0,
    onAllowCopyChangeCopierCellClick: () => state.onChangeCopytradeSettings(0),
    onAllowCopyChangeTraderCellClick: () => state.onChangeCopytradeSettings(1),
  },
  onChangeCopytradeSettings: _.debounce((allow_copiers) => {
    state.is_loading = true;
    liveapi
      .send({
        set_settings: 1,
        allow_copiers,
      })
      .then((settings) => {
        state.is_loading = false;
        // settings req does not return updated settings
        state.allowCopy.allow_copiers = allow_copiers;
      })
      .catch(e => {
        state.is_loading = false;
        $.growl.error({ message: e.message });
      });
  }, 250),
  onOpenChange: (index) => {
    state.traderTokens[index].open = !state.traderTokens[index].open;
  },
  onStartedChange: (index) => {
    state.traderTokens[index].disableStart = true;
    const newStarted = !state.traderTokens[index].started;
    if (newStarted) {
      //Start copying
      //if started, revert back to last saved changes(in case user changed anything)
      const fromLocalStorage = local_storage.get(getStorageName());
      if (fromLocalStorage) {
        const currentTraderTokenDetails_localSto = fromLocalStorage.traderTokens[index];
        if (currentTraderTokenDetails_localSto) {
          const newObj = {};
          _.merge(newObj, state.traderTokens[index], currentTraderTokenDetails_localSto);
          state.traderTokens.splice(index, 1);
          //Have to apply this trick in order to trigger update of UI using rivetsjs.
          _.defer(() => {
            state.traderTokens.splice(index, 0, newObj);
            const settingsToSend = _.cloneDeep(newObj.yourCopySettings);
            if (!settingsToSend.min_trade_stake) delete settingsToSend.min_trade_stake;
            if (!settingsToSend.max_trade_stake) delete settingsToSend.max_trade_stake;
            if (!settingsToSend.assets || settingsToSend.assets.length <= 0) delete settingsToSend.assets;
            if (!settingsToSend.trade_types || settingsToSend.trade_types.length <= 0) delete settingsToSend.trade_types;
            liveapi
              .send(settingsToSend)
              .then(() => {
                newObj.disableStart = false;
                newObj.started = true;
                disableKeypressChars('#max_trade_stake', '#min_trade_stake');
                updateLocalStorage(state);
              })
              .catch(e => {
                $.growl.error({ message: e.message });
                newObj.disableStart = false;
                disableKeypressChars('#max_trade_stake', '#min_trade_stake');
                updateLocalStorage(state);
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
          updateLocalStorage(state);
        })
        .catch(e => {
          $.growl.error({ message: e.message });
          state.traderTokens[index].disableStart = false;
          updateLocalStorage(state);
        });
    }
  },
  onRemove: (index) => {
    const toBeRemovedItem = state.traderTokens[index];
    state.traderTokens.splice(index, 1);
    updateLocalStorage(state);
    liveapi.send({
      copy_stop: toBeRemovedItem.yourCopySettings.copy_start
    })
    .catch(e => {});
  },
  onRefresh: (index) => {
    const trader = state.traderTokens[index];
    const loginid = trader.loginid;
    const token = trader.yourCopySettings.copy_start;
    if (loginid && token) {
      trader.disableRefresh = true;
      refreshTraderStats(loginid, token, state)
        .then(() => {
          trader.disableRefresh = false;
          updateLocalStorage(state);
        })
        .catch((e) => {
          $.growl.error({ message: form_error_messages.refresh_failed });
          trader.disableRefresh = false;
          updateLocalStorage(scope);
        });
    }
  },
  onMinTradeChange: (event, scope) => {
    state.formatAndSetTradeStake(event, scope, 'min_trade_stake')
  },
  onMaxTradeChange: (event, scope) => {
    state.formatAndSetTradeStake(event, scope, 'max_trade_stake')
  },
  formatAndSetTradeStake: (event, scope, type_trade_stake) => {
    const index = $(event.target).data('index');
    const value = event.target.value;
    const format_amount = _.isNil(value) ? false : value.match(/0*(\d+\.?\d{0,2})/);
    if (format_amount) {
      scope.traderTokens[index].yourCopySettings[type_trade_stake] = format_amount[1];
    } else {
      scope.traderTokens[index].yourCopySettings[type_trade_stake] = '';
    }
  },
  onUpdateYourSettings: (index) => {
    if (validate_min_max_stake(state.traderTokens[index].yourCopySettings)) {
      updateLocalStorage(state);
      $.growl.notice({ message: 'Updated successfully' });
    } else {
      $.growl.error({ message: form_error_messages.invalid_stake_limit });
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
      if (!scope.searchToken.token) {
        $.growl.error({ message: form_error_messages.enter_valid_token });
        return;
      }

      //If already added, throw error
      if (_.some(state.traderTokens, f => f.yourCopySettings.copy_start === scope.searchToken.token)) {
        $.growl.error({ message: form_error_messages.token_already_added });
        return;
      }

      scope.searchToken.disable = true;

      validateToken(scope.searchToken.token)
        .then(tokenUserData => {
          if (!tokenUserData) throw new Error('Invalid token');
          refreshTraderStats(tokenUserData.loginid, scope.searchToken.token, scope)
            .then(() => {
              scope.searchToken.token = '';
              scope.searchToken.disable = false;
              updateLocalStorage(scope);
            })
            .catch(e => {
              $.growl.error({ message: e.message });
              scope.searchToken.disable = false;
              updateLocalStorage(scope);
              _.defer(() => $(event.target).focus());
            });
        })
        .catch(error => {
          $.growl.error({ message: error.message });
          scope.searchToken.disable = false;
          updateLocalStorage(scope);
        });
    },
  },
  traderTokens: [],
  openTokenMgmt: () => $('li.account ul a.token-management').click(),
};

const initConfigWindow = () => {
  const root = $(html).i18n();
  win_view = rv.bind(root[0], state);
  win = windows.createBlankWindow(root, {
    title: 'Copy Trading'.i18n(),
    resizable: false,
    collapsable: true,
    minimizable: true,
    maximizable: false,
    modal: false,
    width: 600,
    open: () => {
      state.is_virtual = isVirtual();
      if (!state.is_virtual) {
        //Refresh all token details
        const copyTrade = local_storage.get(getStorageName());
        if (copyTrade) {
          _.merge(state, copyTrade);
          state.traderTokens = _.cloneDeep(state.traderTokens); // This is needed to trigger rivetsjs render
        }
        state.is_loading = true;
        //Get the copy settings
        liveapi
          .send({ get_settings: 1 })
          .then((settings) => {
            state.is_loading = false;
            state.allowCopy.allow_copiers = settings.get_settings.allow_copiers
          })
          .catch((e) => {
            state.is_loading = false;
            $.growl.error({ message: e.message });
          });

        //Refresh locally stored trader statistics
        if (copyTrade) {
          (async function () {
            for (let traderToken of copyTrade.traderTokens) {
              try {
                const loginid = traderToken.loginid;
                const token = traderToken.yourCopySettings.copy_start;
                await refreshTraderStats(loginid, token, state);
              } catch (e) {
                console.error(e);
              }
            }
          })();
        }
      }
    },
    close: () => {
      win_view && win_view.unbind();
      win && win.dialog('destroy').remove();
      win_view = win = null;
      // Clear tokens
      state.traderTokens = [];
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

const disableKeypressChars = (...input_el_ids) => {
  if (input_el_ids.length > 0) {
    const comma_separated_ids = input_el_ids.join(', ');
    $(comma_separated_ids).keypress((evt) => {
      if ((evt.which < 48 || evt.which > 57) && evt.which !== 8 && evt.which !== 46) {
        evt.preventDefault();
      }
    });
  }
};

export const init = ($menuLink) => {
  $menuLink.click(() => {
    if (!win) {
      initConfigWindow();
      disableKeypressChars('#max_trade_stake', '#min_trade_stake');
    }
    else { win.moveToTop(); }
  });
};

export default { init }

