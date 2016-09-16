/*
 * Created by amin on June 26, 2016.
 */

define(['jquery', 'websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'lodash', 'moment'], function($, liveapi, windows, rv, _, moment) {
    require(['text!cashier/deposit.html']);
    require(['css!cashier/deposit.css']);
    var deposit_win = null;
    var deposit_win_view = null; // rivets view

    var error_handler = function(err) {
      console.error(err);
      $.growl.error({ message: err.message });
    };

    function init(li) {
      li.click(() => {
          if(!deposit_win)
            require(['text!cashier/deposit.html'], init_deposit_win);
          else
            deposit_win.moveToTop();
      });
    }

    function init_deposit_win(root) {
      root = $(root).i18n();
      deposit_win = windows.createBlankWindow(root, {
          title: 'Deposit funds',
          resizable: true,
          collapsable: false,
          minimizable: true,
          maximizable: true,
          width: 700,
          height: 600,
          'data-authorized': true,
          close: function () {
            deposit_win.dialog('destroy');
            deposit_win.trigger('dialogclose'); // TODO: figure out why event is not fired.
            deposit_win.remove();
            deposit_win = null;
          },
          open: function () { },
          destroy: function() {
            deposit_win_view && deposit_win_view.unbind();
            deposit_win_view = null;
          }
      });

      init_state(root);
      deposit_win.dialog('open');

      /* update dialog position, this way when dialog is resized it will not move*/
      var offset = deposit_win.dialog('widget').offset();
      offset.top = 110;
      deposit_win.dialog("option", "position", { my: offset.left, at: offset.top });
      deposit_win.dialog('widget').css({
          left: offset.left + 'px',
          top: offset.top + 'px'
      });
      deposit_win.fixFooterPosition();
      deposit_win.track({
        module_id: 'deposit',
        is_unique: true
      });
    }

    function init_state(root) {
      var app_id = liveapi.app_id;
      var state = {
        route: { value: 'standard-methods'},
        empty_fields: {
          validate: false,
          clear: _.debounce(function() {
            state.empty_fields.validate = false;
          }, 4000),
          show: function() {
            state.empty_fields.validate = true;
            state.empty_fields.clear();
          }
        },
        user: {
          email: local_storage.get('authorize').email,
          cashier_url:'',
          residence: '',
          residence_name: ''
        },
        standard_methods: {
          iframe_visible: false,
        },
        payment_agents: {
          list: [],
          current: {}
        }
      };

      state.route.update = route => { state.route.value = route; };

      state.standard_methods.iframe_loaded = function() {
        if(state.user.cashier_url)
          state.standard_methods.iframe_visible = true;
      }

      state.payment_agents.get_commission_text = function(agent) {
        if(agent.deposit_commission === agent.withdrawal_commission) {
            return agent.deposit_commission + '% ' + 'commission'.i18n();
        }
        return agent.deposit_commission + '% ' + 'deposits'.i18n() + ' / ' +
               agent.withdrawal_commission + '% ' + 'withdrawals'.i18n();
      }
      state.payment_agents.onclick = function(agent, e){
        var elem = $(e.target).next();
        var cur_elem = state.payment_agents.elem;
        cur_elem && cur_elem.css('max-height', '0');
        state.payment_agents.current.is_active = false;
        if(state.payment_agents.current === agent) {
          state.payment_agents.current = {};
        }
        else {
          state.payment_agents.current = agent;
          state.payment_agents.elem = elem;
          elem.css('max-height', elem[0].scrollHeight + 'px');
          agent.is_active = true;
        }
      }

      deposit_win_view = rv.bind(root[0], state);

      /* get the cashier_url */
      liveapi.send({
        cashier: 'deposit'
      }).then(function(data) {
          state.user.cashier_url = data.cashier;
      }).catch(error_handler);

      /* get the residence field and its states */
      var residence_promise = liveapi.send({get_settings: 1})
             .then(function(data){
               state.user.residence = data.get_settings.country_code;
               state.user.residence_name = data.get_settings.country;
             })
             .catch(error_handler);

      /* get payment agents list */
      residence_promise.then(function() {
        if(!state.user.residence)
          return { paymentagent_list: { list: [] } };
        return liveapi.send({paymentagent_list: state.user.residence });
      }).then(function(data){
        var list = data.paymentagent_list.list.map(function(agent){
          agent.commission_text = state.payment_agents.get_commission_text(agent);
          agent.supported_banks = agent.supported_banks.toLowerCase().split(',');
          return agent;
        })
        state.payment_agents.list = list;
      }).catch(error_handler);
    }

    return {
      init: init
    }
});
