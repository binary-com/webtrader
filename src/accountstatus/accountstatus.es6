import $ from "jquery";
import liveapi from "../websockets/binary_websockets";
import _ from "lodash";
import "../common/util";

class AccountStatus {
    constructor() {
        const _this = this;
        // Initiating account check on login.
        liveapi.events.on("login", (response) => {
            _this.getAccountStatus().then((data) => {
                _this.checkStatus(response.authorize, data.get_account_status);
            }).catch(console.error);
        });
    }

    getAccountStatus() {
        // Getting account status.
        return liveapi.send({ get_account_status: 1 });
    }

    checkStatus(authorize, status) {
        const is_real = +authorize.is_virtual === 0;
        // No checks for virtual accounts
        if(!is_real)
            return;
        
        // Message container
        const $ele = $("#msg-notification");

        // Contains validations, messages, onclick callbacks.
        // Maintaining the order of priority.
        const model = {
            authenticate: {
                message: "Please [_1]authenticate your account[_2] to lift your withdrawal and trading limits".i18n()
                .replace("[_1]","<a href='#'>").replace("[_2]","</a>"),
                is_valid: () => {return (!/authenticated/.test(status) || !/age_verification/.test(status))},
            }
        }

        // Getting the invalid account status.
        const invalid_obj = _.find(model, obj => obj.is_valid())

        if($ele.is(":hidden")){
            console.log(invalid_obj);
            // Show message
            $ele.html(invalid_obj.message);
            $ele.slideDown(500);
        }
    }
}

export const init = new AccountStatus();

export default {
    init
}