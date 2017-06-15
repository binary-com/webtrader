/*
 * Created by amin on June 14, 2016.
 */

import $ from 'jquery';
import liveapi from 'websockets/binary_websockets';
import windows from 'windows/windows';
import rv from 'common/rivetsExtra';
import _ from 'lodash';
import moment from 'moment';
import navigation from 'navigation/navigation';
import html from 'text!realaccount/realaccount.html';
import 'css!realaccount/realaccount.css';

let real_win = null;
let real_win_view = null; // rivets view
let real_win_li = null;

const error_handler = (err) => {
   console.error(err);
   $.growl.error({ message: err.message });
};

export const init = (li) => {
   real_win_li = li;
   li.click(() => {
      if (!real_win) {
         navigation.getLandingCompany()
            .then(
               (what_todo) => init_real_win(html, what_todo)
            )
            .catch(error_handler);
      } else {
         real_win.moveToTop();
      }
   });
}

const init_real_win = (root, what_todo) => {
   root = $(root).i18n();
   const _title = {
      'upgrade-mlt': 'Real Money Account Opening'.i18n(),
      'upgrade-mf': 'Financial Account Opening form'.i18n()
   }[what_todo];

   real_win = windows.createBlankWindow(root, {
      title: _title,
      resizable: false,
      collapsable: false,
      minimizable: true,
      maximizable: false,
      width: 360,
      height: 'auto',
      'data-authorized': true,
      close: () => {
         real_win.dialog('destroy');
         real_win.trigger('dialogclose'); // TODO: figure out why event is not fired.
         real_win.remove();
         real_win = null;
      },
      open: () => {},
      destroy: () => {
         real_win_view && real_win_view.unbind();
         real_win_view = null;
      }
   });

   init_state(root, what_todo);
   real_win.dialog('open');

   /* update dialog position, this way when dialog is resized it will not move*/
   const offset = real_win.dialog('widget').offset();
   offset.top = 110;
   real_win.dialog("option", "position", { my: offset.left, at: offset.top });
   real_win.dialog('widget').css({
      left: offset.left + 'px',
      top: offset.top + 'px'
   });
}

const init_state = (root, what_todo) => {
   const app_id = liveapi.app_id;
   const state = {
      route: { value: 'user' }, // routes: ['user', 'financial']
      empty_fields: {
         validate: false,
         clear: _.debounce(() => {
            state.empty_fields.validate = false;
         }, 4000),
         show: () => {
            state.empty_fields.validate = true;
            state.empty_fields.clear();
         }
      },
      what_todo: what_todo,
      input_disabled: false,
      risk: {
         visible: false,
      },
      user: {
         disabled: false,
         accepted: what_todo === 'upgrade-mf',
         pep: false,
         salutation: 'Mr',
         salutation_array: ['Mr', 'Mrs', 'Ms', 'Miss'],
         first_name: '',
         last_name: '',
         date_of_birth: '',
         yearRange: "-100:+0",
         showButtonPanel: false, // for jquery ui datepicker
         residence: '-',
         residence_name: '-',
         address_line_1: '',
         address_line_2: '',
         city_address: '',
         state_address: '-',
         state_address_array: [{ text: '-', value: '-' }],
         address_postcode: '',
         phone: '',
         secret_question_inx: 5,
         secret_question_array: [
            'Mother\'s maiden name', 'Name of your pet', 'Name of first love',
            'Memorable town/city', 'Memorable date', 'Favourite dish',
            'Brand of first car', 'Favourite artist'
         ],
         secret_answer: '',
         place_of_birth: '-',
         country_array: [{ text: '-', value: '-' }],
         tax_residence: '',
         tax_identification_number: ''

      },
      financial: {
         experience_array: ['0-1 year', '1-2 years', 'Over 3 years'],
         frequency_array: ['0-5 transactions in the past 12 months', '6-10 transactions in the past 12 months', '40 transactions or more in the past 12 months'],
         account_opening_reason_array: ['Speculative', 'Income Earning', 'Assets Saving', 'Hedging'],

         account_opening_reason: '',
         forex_trading_experience: '',
         forex_trading_frequency: '',
         indices_trading_experience: '',
         indices_trading_frequency: '',
         commodities_trading_experience: '',
         commodities_trading_frequency: '',
         stocks_trading_experience: '',
         stocks_trading_frequency: '',
         other_derivatives_trading_experience: '',
         other_derivatives_trading_frequency: '',
         other_instruments_trading_experience: '',
         other_instruments_trading_frequency: '',

         employment_industry_array: ['Construction', 'Education', 'Finance', 'Health', 'Tourism', 'Other'],
         employment_industry: '',
         education_level_array: ['Primary', 'Secondary', 'Tertiary'],
         education_level: '',

         income_source_array: ['Salaried Employee', 'Self-Employed', 'Investments & Dividends', 'Pension', 'Other'],
         income_source: '',

         net_income_array: ['Less than $25,000', '$25,000 - $50,000', '$50,001 - $100,000', '$100,001 - $500,000', 'Over $500,000'],
         net_income: '',

         estimated_worth_array: ['Less than $100,000', '$100,000 - $250,000', '$250,001 - $500,000', '$500,001 - $1,000,000', 'Over $1,000,000'],
         estimated_worth: '',

         account_turnover_array: ['Less than $25,000', '$25,000 - $50,000', '$50,001 - $100,000', '$100,001 - $500,000', 'Over $500,000'],
         account_turnover: '',

         occupation_array: ["Chief Executives, Senior Officials and Legislators", "Managers", "Professionals", "Clerks",
            "Personal Care, Sales and Service Workers", "Agricultural, Forestry and Fishery Workers",
            "Craft, Metal, Electrical and Electronics Workers", "Plant and Machine Operators and Assemblers",
            "Mining, Construction, Manufacturing and Transport Workers", "Armed Forces", "Government Officers",
            "Others"
         ],
         occupation: '',

         accepted: false,
         disabled: false
      }
   };

   state.input_disabled = local_storage.get("oauth").reduce((a,b)=>{
         return a || /MLT/.test(b.id)
      },false) && what_todo === "upgrade-mf";

   state.user.is_valid = () => {
      const user = state.user;
      return user.first_name !== '' &&
         !/[~`!@#\$%\^\&\*\(\)\+=\{\}\[\]\\|:;\",<>?/\d]/.test(user.first_name) &&
         user.last_name !== '' &&
         !/[~`!@#\$%\^\&\*\(\)\+=\{\}\[\]\\|:;\",<>?/\d]/.test(user.last_name) &&
         moment(user.date_of_birth, 'YYYY-MM-DD', true).isValid() &&
         user.residence !== '-' &&
         user.address_line_1 !== '' &&
         !/[~`!#\$%\^\&\*\(\)\+=\{\}\[\]\\|:;\"<>?]/.test(user.address_line_1) &&
         !/[~`!#\$%\^\&\*\(\)\+=\{\}\[\]\\|:;\"<>?]/.test(user.address_line_2) &&
         user.city_address !== '' &&
         !/[~`!@#\$%\^\&\*\(\)\+=\{\}\[\]\\|:;\",<>?/\d]/.test(user.city_address) &&
         /^[^+]{0,20}$/.test(user.address_postcode) &&
         user.phone !== '' && /^\+?[0-9\s]{6,35}$/.test(user.phone) &&
         (state.input_disabled || /.{4,8}$/.test(user.secret_answer)) && // Check secret answer if mlt account
         (state.what_todo != "upgrade-mf" || (state.user.place_of_birth &&
            state.user.tax_residence && state.user.tax_identification_number && /^[\w-]{0,20}$/.test(state.user.tax_identification_number)));
   };

   state.user.click = () => {
      if (!state.user.is_valid()) {
         state.empty_fields.show();
         return;
      }

      if (state.what_todo === 'upgrade-mlt') {
         state.user.new_account_real();
         return;
      }

      state.route.update('financial');
   }
   state.user.new_account_real = () => {

      const user = state.user;
      const request = {
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

      state.user.disabled = true;
      liveapi.send(request)
         .then((data) => {
            state.user.disabled = false;
            const info = data.new_account_real;
            const oauth = local_storage.get('oauth');
            oauth.push({ id: info.client_id, token: info.oauth_token, is_virtual: 0 });
            local_storage.set('oauth', oauth);
            $.growl.notice({ message: 'Account successfully created' });
            $.growl.notice({ message: 'Switching to your new account ...' });
            /* login with the new account */
            return liveapi.switch_account(info.client_id)
               .then(() => {
                  real_win && real_win.dialog('close');
                  real_win_li.hide();
               });
         })
         .catch((err) => {
            state.user.disabled = false;
            error_handler(err);
         });
   };

   state.financial.empty_fields = () => {
      return state.financial.account_opening_reason === '' || state.financial.forex_trading_experience === '' ||
          state.financial.forex_trading_frequency === '' || state.financial.indices_trading_experience === '' ||
          state.financial.indices_trading_frequency === '' || state.financial.commodities_trading_experience === '' ||
          state.financial.commodities_trading_frequency === '' || state.financial.stocks_trading_experience === '' ||
          state.financial.stocks_trading_frequency === '' || state.financial.other_derivatives_trading_experience === '' ||
          state.financial.other_derivatives_trading_frequency === '' || state.financial.other_instruments_trading_experience === '' ||
          state.financial.other_instruments_trading_frequency === '' || state.financial.employment_industry === '' ||
          state.financial.occupation === '' || state.financial.education_level === '' ||
          state.financial.income_source === '' || state.financial.net_income === '' ||
          state.financial.account_turnover === '' || state.financial.estimated_worth === '';
   };

   state.financial.click = () => {
      if (state.financial.empty_fields()) {
         state.empty_fields.show();
         $.growl.error({ message: 'Not all financial information are completed' });
         return;
      }
      if (!state.financial.accepted) {
         $.growl.error({ message: 'Binary.com terms and conditions unchecked.' });
         return;
      }

      state.risk.visible = true;
   };
   state.financial.create_request = () => {
      const user = state.user;
      const financial = state.financial;
      const request = {
         new_account_maltainvest: 1,
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
         place_of_birth: state.user.place_of_birth,
         tax_residence: state.user.tax_residence.join(","),
         tax_identification_number: state.user.tax_identification_number,

         affiliate_token: '',
         forex_trading_experience: financial.forex_trading_experience,
         forex_trading_frequency: financial.forex_trading_frequency,
         indices_trading_experience: financial.indices_trading_experience,
         indices_trading_frequency: financial.indices_trading_frequency,
         commodities_trading_experience: financial.commodities_trading_experience,
         commodities_trading_frequency: financial.commodities_trading_frequency,
         stocks_trading_experience: financial.stocks_trading_experience,
         stocks_trading_frequency: financial.stocks_trading_frequency,
         other_derivatives_trading_experience: financial.other_derivatives_trading_experience,
         other_derivatives_trading_frequency: financial.other_derivatives_trading_frequency,
         other_instruments_trading_experience: financial.other_instruments_trading_experience,
         other_instruments_trading_frequency: financial.other_instruments_trading_frequency,
         employment_industry: financial.employment_industry,
         occupation: financial.occupation,
         education_level: financial.education_level,
         income_source: financial.income_source,
         net_income: financial.net_income,
         estimated_worth: financial.estimated_worth,
         accept_risk: 1,
      };
      return request;
   };

   state.financial.new_account_maltainvest = () => {
      const request = state.financial.create_request();
      console.warn(request);
   }

   state.risk.accept = () => {
      const request = state.financial.create_request();
      if(!state.input_disabled) {
         request.secret_question = state.user.secret_question_array[state.user.secret_question_inx];
         request.secret_answer = state.user.secret_answer;
      }
      state.risk.visible = false;
      state.financial.disabled = true;
      liveapi.send(request)
         .then((data) => {
            const info = data.new_account_maltainvest;
            const oauth = local_storage.get('oauth');
            oauth.push({ id: info.client_id, token: info.oauth_token, is_virtual: 0 });
            local_storage.set('oauth', oauth);
            $.growl.notice({ message: 'Account successfully created' });
            $.growl.notice({ message: 'Switching to your new account ...' });
            /* login with the new account */
            return liveapi.switch_account(info.client_id)
               .then(() => {
                  real_win && real_win.dialog('close');
                  real_win_li.hide();
               });
         })
         .catch((err) => {
            state.financial.disabled = false;
            error_handler(err);
         });
   }
   state.risk.decline = () => {
      state.risk.visible = false;
   }

   state.route.update = (route) => {
      state.route.value = route;
      //real_win.dialog('option', 'height', routes[route]);
      real_win.dialog('widget').trigger('dialogresizestop');
   };

   real_win_view = rv.bind(root[0], state);

   /* get the residence field and its states */
   const residence_promise = liveapi.send({ get_settings: 1 })
      .then((data) => {
         data = data.get_settings;
         state.user.salutation = data.salutation || state.user.salutation;
         state.user.first_name = data.first_name || '';
         state.user.last_name = data.last_name || '';
         state.user.date_of_birth = data.date_of_birth ? moment.unix(data.date_of_birth).format("YYYY-MM-DD") : moment().subtract(18, "years").format("YYYY-MM-DD");
         state.user.address_line_1 = data.address_line_1 || '';
         state.user.address_line_2 = data.address_line_2 || '';
         state.user.city_address = data.address_city || '';
         state.user.state_address = data.address_state || '';
         state.user.address_postcode = data.address_postcode || '';
         state.user.phone = data.phone || '';
         state.user.residence = data.country_code || '';
         state.user.residence_name = data.country || '';
      })
      .catch(error_handler);

   residence_promise
      .then(
         () => liveapi.cached.send({ residence_list: 1 })
      )
      .then((data) => {
         state.user.country_array = data.residence_list;
         state.user.place_of_birth = data.residence_list[0].value;
         const residence = _.find(data.residence_list, { value: state.user.residence });
         state.user.phone = state.user.phone ? state.user.phone : '+' + residence.phone_idd;
      })
      .catch(error_handler);

   residence_promise
      .then(
         () => liveapi.cached.send({ states_list: state.user.residence })
      )
      .then((data) => {
         console.log(data.states_list);
         state.user.state_address_array = [{text:'Please select', value:''}, ...data.states_list];
         state.user.state_address = state.user.state_address_array[0].value;
      })
      .catch(error_handler);
}

export default { init }
