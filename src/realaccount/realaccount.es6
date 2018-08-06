/*
 * Created by amin on June 14, 2016.
 */

import $ from 'jquery';
import liveapi from 'websockets/binary_websockets';
import windows from 'windows/windows';
import rv from 'common/rivetsExtra';
import _ from 'lodash';
import moment from 'moment';
import { getLandingCompany } from 'navigation/navigation';
import html from 'text!realaccount/realaccount.html';
import 'css!realaccount/realaccount.css';
import { financial_account_opening } from '../common/common';

let real_win = null;
let real_win_view = null; // rivets view
let real_win_li = null;

const error_handler = (err) => {
   console.error(err);
   $.growl.error({ message: err.message });
};

const object_has_empty_string_value = (obj) => {
      return Object.values(obj).some((value) => value === '');
};

export const init = (li) => {
   real_win_li = li;
   li.click(() => {
      if (!real_win) {
         getLandingCompany()
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
      'upgrade-mf': 'Financial Account Opening form'.i18n(),
      'new-account': 'New Account'.i18n(),
   }[what_todo];

   real_win = windows.createBlankWindow(root, {
      title: _title,
      resizable: false,
      collapsable: false,
      minimizable: true,
      maximizable: false,
      width: 380,
      height: 400,
      close: () => {
         real_win.dialog('destroy');
         real_win.trigger('dialogclose'); // TODO: figure out why event is not fired.
         real_win.remove();
         real_win = null;
      },
      open: () => { },
      destroy: () => {
         real_win_view && real_win_view.unbind();
         real_win_view = null;
      },
      'data-authorized' :'true'
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
         account_opening_reason_array: ['Speculative', 'Income Earning', 'Hedging'],
         account_opening_reason: '',
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
         place_of_birth: '',
         citizen: '',
         country_array: [{ text: '-', value: '-' }],
         tax_residence: '',
         tax_identification_number: '',
         available_currencies: []
      },
      financial: {
         accepted: false,
         disabled: false,
         professional_client: {
            chk_professional: false,
         },
         trading_experience: {
            forex_trading_experience: '',
            forex_trading_frequency: '',
            binary_options_trading_experience: '',
            binary_options_trading_frequency: '',
            cfd_trading_experience: '',
            cfd_trading_frequency: '',
            other_instruments_trading_experience: '',
            other_instruments_trading_frequency: '',
         },
         financial_information: {
            income_source: '',
            employment_status: '',
            employment_industry: '',
            occupation: '',
            source_of_wealth: '',
            education_level: '',
            net_income: '',
            estimated_worth: '',
            account_turnover: '',
         },
         trading_experience_select_data: {
            ...financial_account_opening.trading_experience_select_data
         },
         financial_information_select_data: {
            ...financial_account_opening.financial_information_select_data,
         },
      }
   };

   state.input_disabled = local_storage.get("oauth").reduce((a, b) => {
      return a || /MLT/.test(b.id)
   }, false) && what_todo === "upgrade-mf";

   state.user.is_valid = () => {
      const user = state.user;
      return state.user.account_opening_reason !== '' && user.first_name !== '' &&
         !/[~`!@#\$%\^\&\*\(\)\+=\{\}\[\]\\|:;\",<>?/\d]/.test(user.first_name) &&
         user.last_name !== '' &&
         !/[~`!@#\$%\^\&\*\(\)\+=\{\}\[\]\\|:;\",<>?/\d]/.test(user.last_name) &&
         moment(user.date_of_birth, 'YYYY-MM-DD', true).isValid() &&
         $.trim(state.user.place_of_birth) !== '' &&
         $.trim(state.user.citizen) !== '' &&
         user.residence !== '-' &&
         user.address_line_1 !== '' &&
         !/[~`!#\$%\^\&\*\(\)\+=\{\}\[\]\\|:;\"<>?]/.test(user.address_line_1) &&
         !/[~`!#\$%\^\&\*\(\)\+=\{\}\[\]\\|:;\"<>?]/.test(user.address_line_2) &&
         user.city_address !== '' &&
         !/[~`!@#\$%\^\&\*\(\)\+=\{\}\[\]\\|:;\",<>?/\d]/.test(user.city_address) &&
         /^[^+]{0,20}$/.test(user.address_postcode) &&
         user.phone !== '' && /^\+?[0-9\s]{6,35}$/.test(user.phone) &&
         (state.input_disabled || /.{4,8}$/.test(user.secret_answer)) && // Check secret answer if mlt account
         (state.what_todo != "upgrade-mf" || (
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
         account_opening_reason: user.account_opening_reason,
         date_of_birth: user.date_of_birth,
         place_of_birth: user.place_of_birth,
         citizen: user.citizen,
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

   state.user.pep_window = (e) => {
      e.preventDefault();
      const text = `A Politically Exposed Person (PEP) is an individual who is or has been entrusted with a prominent public function including his/her immediate family members or persons known to be close associates of such persons, but does not include middle ranking or more junior officials.<br><br>
         Such individuals include Heads of State, Ministers, Parliamentary Secretaries, Members of Parliament, Judges, Ambassadors, Senior Government Officials, High Ranking Officers in the Armed Forces, Audit Committees of the boards of central banks, and Directors of state-owned corporations.<br><br>
         The “immediate family members” of the above examples will also be considered as PEP, and these include their spouses/partners, parents, and children. Additionally, “persons known to be close associates” of PEPs include their business partners, will also be considered as such.<br><br>
         As a general rule, a person considered to be a PEP and who has ceased to be entrusted with a prominent public function for a period of at least twelve months no longer qualifies as a PEP.`;
      windows.createBlankWindow(`<div style="padding:15px;">${text}</div>`, {
         title: "PEP",
         modal: true,
         resizable: false,
         collapsable: false,
         minimizable: false,
         maximizable: false,
         closeOnEscape: true,
         width: 500,
         height: 'auto'
      }).dialog("open");
   }

   state.user.professional_window = (e) => {
      e.preventDefault();
      const first_paragraph = `Clients need to satisfy at least two of the following criteria in order to receive Professional Client status:`;
      const first_ul = [`You’ve carried out significant transactions on markets similar to the ones we offer, averaging 10 transactions per quarter for the previous four quarters`,
      `The size of your instrument portfolio exceeds EUR 500,000 or its equivalent`, `You’ve worked in the financial sector for at least one year in a role that requires knowledge of your intended transactions on our platform`];
      const second_paragraph = `If you choose to be treated as a Professional Client, we’ll regard you as having the required market knowledge and experience. As such, we’ll take steps to ensure that your request for Professional Client status meets the above criteria, including a request for the following:`;
      const second_ul = [`Statements that reflect your transactions from the previous four quarters`, `Proof of your portfolio held elsewhere`, `Proof of your employment`];
      windows.createBlankWindow(`<div style="padding:15px;">
      <div>${first_paragraph}</div>
      <ul class="checked">
            <li>${first_ul[0]}</li>
            <li>${first_ul[1]}</li>
            <li>${first_ul[2]}</li>
      </ul>
      <div>${second_paragraph}</div>
      <ul class="bullet">
            <li>${second_ul[0]}</li>
            <li>${second_ul[1]}</li>
            <li>${second_ul[2]}</li>
      </ul>
      </div>`, {
         title: "Professional Client",
         modal: true,
         resizable: false,
         collapsable: false,
         minimizable: false,
         maximizable: false,
         closeOnEscape: true,
         width: 600,
         height: 'auto'
      }).dialog("open");
   }

   state.financial.click = () => {
      if (object_has_empty_string_value(state.financial.trading_experience)) {
            state.empty_fields.show();
            $.growl.error({ message: 'Not all trading experiences are completed' });
            return;
      }

      if (object_has_empty_string_value(state.financial.financial_information)) {
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
      const request = {
         new_account_maltainvest: 1,
         salutation: user.salutation,
         first_name: user.first_name,
         account_opening_reason: user.account_opening_reason,
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
         citizen: state.user.citizen,
         tax_residence: state.user.tax_residence.join(","),
         tax_identification_number: state.user.tax_identification_number,

         affiliate_token: '',
         client_type: state.financial.professional_client.chk_professional ? 'professional' : 'retail',
         ...state.financial.financial_information,
         ...state.financial.trading_experience,
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
      if (!state.input_disabled) {
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
      // scroll to top for second page of form
      if (route === 'financial') { document.getElementById('financial_second_page').scrollIntoView() }
      real_win.dialog('widget').trigger('dialogresizestop');
   };

   state.set_account_opening_reason = () => {
      var req = { set_settings: 1 };
      req.account_opening_reason = state.user.account_opening_reason;
      state.user.disabled = true;
      liveapi.send(req).then((data) => {
         state.user.show_account_opening_reason = false;
      }).catch((err) => {
         error_handler(err);
         state.user.disabled = false;
      });
   };

   state.create_new_account = (curr) => {
      const req = {
         new_account_real: 1,
         salutation: state.user.salutation || '',
         first_name: state.user.first_name || '',
         last_name: state.user.last_name || '',
         date_of_birth: state.user.date_of_birth || '',
         address_line_1: state.user.address_line_1 || '',
         address_line_2: state.user.address_line_2 || '',
         address_city: state.user.city_address || '',
         address_state: state.user.state_address || '',
         address_postcode: state.user.address_postcode || '',
         phone: state.user.phone || '',
         account_opening_reason: state.user.account_opening_reason,
         residence: state.user.residence,
      };
      liveapi.send(req).then((data) => {
         const info = data.new_account_real;
         const oauth = local_storage.get('oauth');
         oauth.push({ id: info.client_id, token: info.oauth_token, currency: curr, is_virtual: 0 });
         local_storage.set('oauth', oauth);
         $.growl.notice({ message: 'Account successfully created' });
         $.growl.notice({ message: 'Switching to your new account ...' });
         /* login with the new account */
         return liveapi.switch_account(info.client_id)
            .then(() => {
               liveapi.send({set_account_currency: curr}).then(() => {
                  local_storage.set("currency", curr);
                  // To show create account button.
                  window.location.reload();
                  real_win && real_win.dialog('close');
                  real_win_li.hide();
               });
            });
      }).catch((err) => {
         error_handler(err);
         real_win && real_win.dialog('close');
         real_win_li.hide();
      })
   };

   real_win_view = rv.bind(root[0], state);

   /* get the residence field and its states */
   const residence_promise = liveapi.send({ get_settings: 1 })
      .then((data) => {
         data = data.get_settings;
         state.user.salutation = data.salutation || state.user.salutation;
         state.user.first_name = data.first_name || '';
         state.user.last_name = data.last_name || '';
         state.user.account_opening_reason = data.account_opening_reason || '';
         state.user.date_of_birth = data.date_of_birth ? moment.unix(data.date_of_birth).format("YYYY-MM-DD") : moment().subtract(18, "years").format("YYYY-MM-DD");
         state.user.address_line_1 = data.address_line_1 || '';
         state.user.address_line_2 = data.address_line_2 || '';
         state.user.city_address = data.address_city || '';
         state.user.state_address = data.address_state || '';
         state.user.address_postcode = data.address_postcode || '';
         state.user.phone = data.phone || '';
         state.user.residence = data.country_code || '';
         state.user.residence_name = data.country || '';
         state.user.show_account_opening_reason = state.user.account_opening_reason === '';
      })
      .catch(error_handler);

   residence_promise
      .then(
      () => liveapi.cached.send({ residence_list: 1 })
      )
      .then((data) => {
         const residence_country_idx = data.residence_list.findIndex((country) => country.text === state.user.residence_name);
         state.user.country_array = data.residence_list;
         state.user.place_of_birth = data.residence_list[residence_country_idx].value;
         state.user.citizen = data.residence_list[residence_country_idx].value;
         const residence = _.find(data.residence_list, { value: state.user.residence });
         state.user.phone = state.user.phone ? state.user.phone : residence.phone_idd ? '+' + residence.phone_idd : '';
      })
      .catch(error_handler);

   residence_promise
      .then(
      () => liveapi.cached.send({ states_list: state.user.residence })
      )
      .then((data) => {
         state.user.state_address_array = [{ text: 'Please select', value: '' }, ...data.states_list];
         state.user.state_address = state.user.state_address_array[0].value;
      })
      .catch(error_handler);

   // Gets available currency for the current user.
   const update_currencies = () => {
      const authorize = local_storage.get("authorize");
      liveapi.cached.send({ landing_company_details: authorize.landing_company_name })
         .then((data) => {
            if (!data.landing_company_details || !data.landing_company_details.legal_allowed_currencies)
               return;
            const currencies = data.landing_company_details.legal_allowed_currencies;
            const currencies_config = local_storage.get("currencies_config") || {};
            const cr_accts = _.filter(loginids(), { is_cr: true });
            const has_fiat = _.some(cr_accts, { type: 'fiat' });
            if (!has_fiat)
               state.user.available_currencies = currencies.filter((c) => {
                  return currencies_config[c] && currencies_config[c].type === 'fiat';
               });
               
            state.user.available_currencies =[ ...state.user.available_currencies, ..._.difference(
              currencies.filter((c) => {
                    return currencies_config[c] && currencies_config[c].type === 'crypto';
              }),
              _.filter(cr_accts, { type: 'crypto' }).map((acc) => acc.currency || '')
            )];
         });
   };
   what_todo === 'new-account' && update_currencies();
}

export default { init }
