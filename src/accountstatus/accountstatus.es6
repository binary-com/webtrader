import $ from "jquery";
import liveapi from "../websockets/binary_websockets";
import _ from "lodash";
import notice from "shownotice/shownotice";
import tc from "../tc/tc";
import financialassessment from "../financialassessment/financialassessment";
import taxInformation from "../taxInformation/taxInformation";
import currency from "../cashier/currency";
import "../common/util";

const reposition_dialogs = (min) => {
  $('.webtrader-dialog').parent().each(function () {
    const top = $(this).css('top').replace('px', '') * 1;
    if (top <= min) {
      $(this).animate({ top: `${min}px` }, 300);
    }
  });
};
let is_shown = false;

class AccountStatus {

  constructor(addEventListeners) {
    // Initiating account check on login.
        liveapi.events.on("login", this.onLogin.bind(this));
        // liveapi.events.on("switch_account", onLogin);

        // Hide msg bar on logout.
         liveapi.events.on('reset_accountstatus', _ => {
             const $ele = $("#msg-notification");
             $ele.is(":visible") && $ele.slideUp(500);
             is_shown = false;
         });
  }
  async onLogin (response) {
    const $ele = $("#msg-notification");
    if (+response.authorize.is_virtual === 1) {
      $ele.is(":visible") && $ele.slideUp(500);
      is_shown = false;
      reposition_dialogs(115);
      return;
    }

    const [account_status, website_status, get_settings,
      financial_assessment, mt5_account] = await this.getStatus(response.authorize);
    this.tc_accepted = false;
    this.financial_assessment_submitted = true;
    this.is_mlt = /^malta$/gi.test(response.authorize.landing_company_name);
    this.is_mf = /^maltainvest$/gi.test(response.authorize.landing_company_name);
    this.is_cr = /^costarica$/gi.test(response.authorize.landing_company_name);
    this.has_mt5_account = mt5_account.mt5_login_list.length > 0;
    this.is_authenticated = !account_status.get_account_status.prompt_client_to_authenticate;
    // Check whether the user has accepted the T&C.
    if (website_status && website_status.website_status && get_settings && get_settings.get_settings) {
      this.tc_accepted = website_status.website_status.terms_conditions_version === get_settings.get_settings.client_tnc_status;
    }

    // Check whether the high risk clients have submitted the financial_assessment form.
    if (account_status.get_account_status.risk_classification === "high" || this.is_mf) {
      this.financial_assessment_submitted = account_status.get_account_status.status.indexOf("financial_assessment_not_complete") == -1;
    }

    this.checkStatus(response.authorize, account_status.get_account_status.status);
  }

  getStatus() {
    // Getting account status, website status, account settings and financial assessment.
    return Promise.all([
      liveapi.send({ get_account_status: 1 }),
      liveapi.send({ "website_status": 1 }),
      liveapi.send({ "get_settings": 1 }),
      liveapi.cached.send({ get_financial_assessment: 1 }),
      liveapi.send({ mt5_login_list: 1 })
    ]);
  }

  checkStatus(authorize, status) {
    // Message container
    const $ele = $("#msg-notification"),
      _this = this;
    // Contains validations, messages, onclick callbacks.
    // Maintaining the order of priority.
    const model = {
      excluded_until: {
        message: "Your account is restricted. Kindly [_1]contact customer support[_2] for assistance."
        .i18n().replace("[_1]", "<a href='#'>").replace("[_2]", "</a>"),
        is_valid: _ => local_storage.get("excluded") == false,
        callback: () => {
          const lang = local_storage.get("i18n").value ? local_storage.get("i18n").value : "en";
          const win = window.open("http://www.binary.com/" + lang + "/contact.html");
          win.focus();
        }
      },
      tc: {
        message: "Please [_1]accept the updated Terms and Conditions[_2] to lift your withdrawal and trading limits."
          .i18n().replace("[_1]", "<a href='#'>").replace("[_2]", "</a>"),
        is_valid: _ => _this.tc_accepted,
        callback: tc.init
      },
      risk: {
        message: "Please complete the [_1]financial assessment form[_2] to lift your withdrawal and trading limits."
          .i18n().replace("[_1]", "<a href='#'>").replace("[_2]", "</a>"),
        is_valid: _ => _this.financial_assessment_submitted,
        callback: financialassessment.init
      },
      tax: {
        message: "Please [_1]complete your account profile[_2] to lift your withdrawal and trading limits."
          .i18n().replace("[_1]", "<a href='#'>").replace("[_2]", "</a>"),
        is_valid: _ => !_this.is_mf || /crs_tin_information/.test(status),
        callback: taxInformation.init
      },
      currency: {
        message: "Please set the [_1]currency[_2] of your account"
          .i18n().replace("[_1]", "<a href='#'>").replace("[_2]", "</a>"),
        is_valid: _ => local_storage.get("currency"),
        callback: currency.check_currency
      },
      authenticate: {
        message: "[_1]Authenticate your account[_2] now to take full advantage of all withdrawal options available.".i18n()
          .replace("[_1]", "<a href='#'>").replace("[_2]", "</a>"),
        is_valid: _ => _this.is_authenticated,
        callback: notice.init
      },
      unwelcome: {
        message: "Your account is restricted. Kindly [_1]contact customer support[_2] for assistance."
          .i18n().replace("[_1]", "<a href='#'>").replace("[_2]", "</a>"),
        is_valid: _ => !/(unwelcome|(cashier|withdrawal)_locked)/.test(status),
        callback: () => {
          const lang = local_storage.get("i18n").value ? local_storage.get("i18n").value : "en";
          const win = window.open("http://www.binary.com/" + lang + "/contact.html");
          win.focus();
        }
      }
    }
    // Getting the invalid account status.
    const invalid_obj = _.find(model, obj => !obj.is_valid());
    if (invalid_obj) {
      // Show message
      $ele.html(invalid_obj.message);
      // bind click event to open specific dialogs with instructions.
      $ele.find("a").on("click", invalid_obj.callback);
      $ele.slideDown(500);
      reposition_dialogs(140);
      is_shown = true;
    } else {
      $ele.is(":visible") && $ele.slideUp(500);
      reposition_dialogs(115);
      is_shown = false;
    }
  }
}

export const init = new AccountStatus();

export default {
  init,
  recheckStatus: (auth) => init.onLogin({authorize: auth}),
  is_shown: () => is_shown
}
