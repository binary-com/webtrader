import $ from 'jquery';
import liveapi from '../websockets/binary_websockets';

const website_status = (data) => {
    if (data.website_status.site_status.toLowerCase() === "up") {
        const $ele = $("#msg-notification");
        $ele.is(":visible") && $ele.slideUp(500) && $('.webtrader-dialog').parent().animate({ top: '110px' });
    }
    else {
        const $ele = $("#msg-notification");
        const message = $('<div class="error-msg"/>').append(data.website_status.message || 'Seems like our servers are down, we are working on fixing it.'.i18n());
        $ele.is(':hidden') && $ele.html(message) && $ele.slideDown(500) && $('.webtrader-dialog').parent().animate({ top: '140px' });
    }
};

liveapi.events.on('website_status', website_status);
liveapi.send({ website_status: 1, subscribe: 1 });
