/**
 * Created by arnab on 5/2/16.
 */
import $ from "jquery";
import windows from "../windows/windows";
import liveapi from "../websockets/binary_websockets";

import html from 'text!./tc.html';
import 'css!./tc.css';

let win = null;

liveapi.events.on("login", async (data) => {
   if (win) {
      win.dialog('destroy');
      win = null;
   }
   if (data.authorize.is_virtual) {
      return;
   }

   const [landing_company_details, website_status, get_settings  ] = await Promise.all([
         liveapi.cached.send({landing_company_details: data.authorize.landing_company_name}),
         liveapi.cached.send({"website_status": 1}),
         liveapi.send({"get_settings": 1})
      ]);
   if (landing_company_details.landing_company_details && landing_company_details.landing_company_details.name
      && website_status.website_status && get_settings.get_settings
      && website_status.website_status.terms_conditions_version !== get_settings.get_settings.client_tnc_status) {
      const div = $(html).i18n();
      div.find('.tc_landing_comp_name').html(landing_company_details.landing_company_details.name);
      div.find('.button').click(() => {
         liveapi.send({"tnc_approval": 1});
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
         closable: false,
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
   }
});

export default {};

