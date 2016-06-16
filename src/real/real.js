/*
 * Created by amin on May June 14, 2016.
 */

define(['websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'lodash', 'moment'], function(liveapi, windows, rv, _, moment) {
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
          height: 900,
          'data-authorized': true,
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
            state.account.empty_fields.validate = false;
          }, 2000),
          show: function() {
            state.account.empty_fields.validate = true;
            state.account.empty_fields.clear();
          }
        },
        user: {
          disabled: false,
          salutation: 'Mr',
          salutation_array: ['Mr', 'Mrs', 'Ms', 'Miss'],
          first_name: '',
          last_name: '',
          date_of_birth: moment().format('YYYY-MM-DD'),
          residence: '',
          residence_name: 'Indonesia',
          address_line_1: '',
          address_line_2: '',
          city_address: '',
          state_address: '-',
          state_address_array: ['-'],
          address_postcode: '',
          phone: '',
          secret_question: 'Favourite dish',
          secret_question_array: [
            "Mother's maiden name", "Name of your pet", "Name of first love",
            "Memorable town/city", "Memorable date", "Favourite dish",
            "Brand of first car", "Favourite artist"
          ],
          secret_answer: '',
        },
      };


      real_win_view = rv.bind(root[0], state);
      // liveapi.cached.send({residence_list: 1})
      //        .then(function(data) {
      //          state.account.residence_list = data.residence_list;
      //          state.account.residence = data.residence_list[0].value;
      //          liveapi.cached.send({website_status: 1})
      //               .then(function(data){
      //                   var residence = data.website_status && data.website_status.clients_country;
      //                   state.account.residence = residence || 'id';
      //               })
      //               .catch(function(err){
      //                 console.error(err);
      //                 state.account.residence = 'id'; // make indonesia default
      //               })
      //        })
      //        .catch(function(err){
      //           console.error(err);
      //           $.growl.error({ message: err.message });
      //        });
    }

    return {
      init: init
    }
});
