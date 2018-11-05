/**
 * Created by arnab on 5/2/16.
 */
import $ from "jquery";
import windows from "../windows/windows";
import liveapi from "../websockets/binary_websockets";
import html from 'text!./tc.html';
import 'css!./tc.css';

let win = null,
    landing_company_name = '';

liveapi.events.on("login", async (data) => {
    if (win) {
        win.dialog('destroy');
        win = null;
    }
    if (data.authorize.is_virtual) {
        return;
    }
    const landing_company_details = await liveapi.cached.send({ landing_company_details: data.authorize.landing_company_name });
    landing_company_name = landing_company_details.landing_company_details && landing_company_details.landing_company_details.name;
});

export const init = () => {
    if (landing_company_name) {
        const div = $(html).i18n();
        div.find('.tc_landing_comp_name').html(landing_company_name);
        div.find('.button').click(() => {
            liveapi.send({ "tnc_approval": 1 }).then(_ => window.location.reload()); // Reload page to remove previous notification message
            win.dialog('destroy');
        });
        win = windows.createBlankWindow($('<div/>'), {
            title: 'Terms and Conditions'.i18n(),
            width: 580,
            minHeight: 90,
            height: 220,
            resizable: false,
            collapsable: false,
            minimizable: false,
            maximizable: false,
            closable: true,
            modal: true,
            closeOnEscape: false,
            ignoreTileAction: true,
            'data-authorized': 'true',
            destroy: () => {
                win = null;
            }
        });
        div.appendTo(win);
        //This helps in showing multiple dialog windows in modal form
        $('body').append(win.dialog('widget'));
        win.dialog('open');
        const binary_url_tc = getBinaryUrl('terms-and-conditions.html');
        Array.from(document.getElementsByClassName('tc-link')).forEach((a_el) => a_el.href = binary_url_tc);
    }
}

export default {
    init
};

