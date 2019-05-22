import $ from 'jquery';
import liveapi from '../websockets/binary_websockets';
import accountstatus from '../accountstatus/accountstatus';

const reposition_dialogs = (min) => {
    $('.webtrader-dialog').parent().each(function () {
        const top = $(this).css('top').replace('px', '') * 1;
        if (top <= min) {
            $(this).animate({ top: min }, 300);
        }
    });
}
const website_status = (data) => {
    if (!data.website_status) { return; }
    if (data.website_status.site_status.toLowerCase() === "up") {
        const $ele = $("#msg-notification");
        $ele.is(":visible") && !accountstatus.is_shown() && $ele.slideUp(500) && reposition_dialogs(110);
    }
    else {
        const $ele = $("#msg-notification");
        const message = $('<div class="error-msg"/>').append(data.website_status.message || 'Seems like our servers are down, we are working on fixing it.'.i18n());
        $ele.html(message) && $ele.slideDown(500) && reposition_dialogs(140);
    }
    set_currency_config(data.website_status);
};

const set_currency_config = (website_status) => {
    if (website_status.currencies_config) {
        // This is used in common/util.js to determine the fractional_digits. Also, used for categorising the currencies inn currency selection dropdown.
        local_storage.set("currencies_config", website_status.currencies_config);
    }
};

liveapi.events.on('website_status', website_status);
liveapi.cached.send({ website_status: 1 }).then(website_status);
