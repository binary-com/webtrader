import $ from "jquery";
import liveapi from "../websockets/binary_websockets";
import _ from "lodash";
import notice from "shownotice/shownotice";
import tc from "../tc/tc";
import financialassessment from "../financialassessment/financialassessment";
import taxInformation from "../taxInformation/taxInformation";
import "../common/util";

class AccountStatus {

  constructor() {
    const _this = this,
      $ele = $("#msg-notification");
    // Initiating account check on login.
    liveapi.events.on("login", async (response) => {
      if (+response.authorize.is_virtual === 1) {
        $ele.is(":visible") && $ele.slideUp(500);
        return;
      }

      const [account_status, website_status, get_settings,
        financial_assessment, mt5_account] = await _this.getStatus(response.authorize);
      _this.tc_accepted = false;
      _this.financial_assessment_submitted = true;
      _this.is_mlt = /^malta$/gi.test(response.authorize.landing_company_name);
      _this.is_mf = /^maltainvest$/gi.test(response.authorize.landing_company_name);
      _this.is_cr = /^costarica$/gi.test(response.authorize.landing_company_name);
      _this.has_mt5_account = mt5_account.mt5_login_list.length > 0;

      // Check whether the user has accepted the T&C.
      if (website_status && website_status.website_status && get_settings && get_settings.get_settings) {
        _this.tc_accepted = website_status.website_status.terms_conditions_version === get_settings.get_settings.client_tnc_status;
      }

      // Check whether the high risk clients have submitted the financial_assessment form.
      if (account_status.get_account_status.risk_classification === "high" && financial_assessment) {
        _this.financial_assessment_submitted = Object.keys(financial_assessment.get_financial_assessment).length !== 0;
      }

      _this.checkStatus(response.authorize, account_status.get_account_status.status);
    });

    // Hide msg bar on logout.
    liveapi.events.on('logout', _ => $ele.is(":visible") && $ele.slideUp(500));
  }

  getStatus() {
    // Getting account status, website status, account settings and financial assessment.
    return Promise.all([
      liveapi.send({ get_account_status: 1 }),
      liveapi.send({ "website_status": 1 }),
      liveapi.send({ "get_settings": 1 }),
      liveapi.send({ get_financial_assessment: 1 }),
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
      tc: {
        message: "Please [_1]accept the updated Terms and Conditions[_2] to lift your withdrawal and trading limits."
          .i18n().replace("[_1]", "<a href='#'>").replace("[_2]", "</a>"),
        is_valid: _ => _this.tc_accepted,
        callback: tc.init
      },
      tax: {
        message: "Please [_1]complete your account profile[_2] to lift your withdrawal and trading limits."
          .i18n().replace("[_1]", "<a href='#'>").replace("[_2]", "</a>"),
        is_valid: _ => !_this.is_mf || /crs_tin_information/.test(status),
        callback: taxInformation.init
      },
      risk: {
        message: "Please complete the [_1]financial assessment form[_2] to lift your withdrawal and trading limits."
          .i18n().replace("[_1]", "<a href='#'>").replace("[_2]", "</a>"),
        is_valid: _ => _this.financial_assessment_submitted,
        callback: financialassessment.init
      },
      authenticate: {
        message: "[_1]Authenticate your account[_2] now to take full advantage of all withdrawal options available.".i18n()
          .replace("[_1]", "<a href='#'>").replace("[_2]", "</a>"),
        is_valid: _ => (/authenticated/.test(status) && (/age_verification/.test(status) || _this.is_cr))
          //For cr accounts show authentication msg if the user balance is more than 200 or has mt5 account
          || (!/authenticated/.test(status) && _this.is_cr && (+authorize.balance < 200 || !_this.has_mt5_account)),
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
    const invalid_obj = _.find(model, obj => !obj.is_valid())
    if (invalid_obj) {
      // Show message
      $ele.html(invalid_obj.message);
      // bind click event to open specific dialogs with instructions.
      $ele.find("a").on("click", invalid_obj.callback);

      if ($ele.is(":hidden")) {
        $ele.slideDown(500);
      }
    } else
      $ele.is(":visible") && $ele.slideUp(500);

  }
}

export const init = new AccountStatus();

export default {
  init
}
