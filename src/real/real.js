/*
 * Created by amin on May June 14, 2016.
 */

define(['jquery', 'websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'lodash', 'moment'], function($, liveapi, windows, rv, _, moment) {
    require(['text!real/real.html']);
    require(['css!real/real.css']);
    var real_win = null;
    var real_win_view = null; // rivets view

    function init(li) {
      li.click(function () {
          if(!real_win)
            require(['text!real/real.html'], init_real_win);
          else
            real_win.moveToTop();
      });
    }

    function init_real_win(root) {
      root = $(root);
      real_win = windows.createBlankWindow(root, {
          title: 'Real account opening',
          resizable:false,
          collapsable:false,
          minimizable: true,
          maximizable: false,
          width: 350,
          height: 920,
          close: function () {
            real_win.dialog('destroy');
            real_win.remove();
            real_win = null;
          },
          open: function () { },
          destroy: function() {
            real_win_view && real_win_view.unbind();
            real_win_view = null;
          }
      });

      init_state(root);
      real_win.dialog('open');

      /* update dialog position, this way when dialog is resized it will not move*/
      var offset = real_win.dialog('widget').offset();
      offset.top = 110;
      real_win.dialog("option", "position", { my: offset.left, at: offset.top });
      real_win.dialog('widget').css({
          left: offset.left + 'px',
          top: offset.top + 'px'
      });
      real_win.fixFooterPosition();
    }

    function init_state(root) {
      var app_id = liveapi.app_id;
      var state = {
        route: { value: 'user' }, // routes: ['user', 'financial', 'done']
        empty_fields: {
          validate: false,
          clear: _.debounce(function() {
            state.empty_fields.validate = false;
          }, 3000),
          show: function() {
            state.empty_fields.validate = true;
            state.empty_fields.clear();
          }
        },
        user: {
          disabled: false,
          salutation: 'Mr',
          salutation_array: ['Mr', 'Mrs', 'Ms', 'Miss'],
          first_name: '',
          last_name: '',
          date_of_birth: moment().format('YYYY-MM-DD'),
          residence: '-',
          residence_name: '-',
          address_line_1: '',
          address_line_2: '',
          city_address: '',
          state_address: '-',
          state_address_array: [{text: '-', value: '-'}],
          address_postcode: '',
          phone: '',
          secret_question_inx: 5,
          secret_question_array: [
            'Mother\'s maiden name', 'Name of your pet', 'Name of first love',
            'Memorable town/city', 'Memorable date', 'Favourite dish',
            'Brand of first car', 'Favourite artist'
          ],
          secret_answer: '',
        },
      };

      state.user.is_valid = function() {
        var user = state.user;
        return user.first_name !== '' && user.last_name !== '' &&
          moment(user.date_of_birth, 'YYYY-MM-DD', true).isValid() &&
          user.residence !== '-' && user.address_line_1 !== '' &&
          user.city_address !== '' && /^[^+]{0,20}$/.test(user.address_postcode) &&
          user.phone !== '' && /^\+?[0-9\s]{6,35}$/.test(user.phone) &&
          /.{4,8}$/.test(user.secret_answer);
      };

      state.user.new_account_real = function() {
        if(!state.user.is_valid()) {
          state.empty_fields.show();
          return;
        }

        var user = state.user;
        var request = {
          new_account_real: 1,
          salutation: user.salutation,
          first_name: user.first_name,
          last_name: user.last_name,
          date_of_birth: user.date_of_birth,
          residence: user.residence,
          address_line_1: user.address_line_1,
          address_line_2: user.address_line_2 || undefined, // optional field
          address_city: user.city_address,
          address_state: user.state_address || undefined,
          address_postcode: user.address_postcode || undefined,
          phone: user.phone,
          secret_question: user.secret_question_array[user.secret_question_inx],
          secret_answer: user.secret_answer.replace('""', "'")
        };

        liveapi.send(request)
               .then(function(data){
                 var info = data.new_account_real;
                 oauth = local_storage.get('oauth');
                 oauth.push({id: info.client_id, token: info.oauth_token});
                 local_storage.set('oauth', oauth);
                 /* login with the new account */
                 return liveapi.switch_account(info.client_id)
                               .then(state.route.update.bind('financial'));
               })
               .catch(function(err){
                 console.error(err);
                 $.growl.error({ message: err.message });
               });
      };

      state.route.update = function(route){
        var routes = {
          'user' : 920,
          'financial': 700
        };
        state.route.value = route;
        real_win.dialog('option', 'height', routes[route]);
      };

      real_win_view = rv.bind(root[0], state);

      liveapi.send({get_settings: 1})
             .then(function(data){
               state.user.residence = data.get_settings.country_code;
               state.user.residence_name = data.get_settings.country;
               return liveapi.cached.send({states_list: state.user.residence })
                             .then(function(data){
                               state.user.state_address_array = data.states_list;
                               state.user.state_address = data.states_list[0].value;
                             });
             })
             .catch(function(err){
               console.error(err);
               $.growl.error({ message: err.message });
             });
    }

    return {
      init: init
    }
});
