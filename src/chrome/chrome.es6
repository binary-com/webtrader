/**
 * Created by arnab on 5/6/16.
 */
import $ from 'jquery';
import windows from '../windows/windows';
import moment from 'moment';
import '../common/util';
import html from 'text!./chrome.html';

let win = null;
//Trigger after 1 second - Give the injector some time to inject the DOM element
setTimeout(() => {
   //Display it with diminishing frequency. E.g. in a day after first cancel, in a week after second, then once a month.
   const check = () => {
      const chrome_ls = local_storage.get("chrome");
      let  show = !chrome_ls;

      if(!show) {
         const accepted_or_cancel_time = chrome_ls.accepted_or_cancel_time;
         show = !accepted_or_cancel_time;
         if (!show) {
            const diff = (moment.utc().valueOf() - accepted_or_cancel_time);
            show = (diff >= (7 * 24 * 60 * 60 * 1000));//if one week elapsed
         }
      }
      return show;
   };

   const show = check();
   if (show && window.chrome && chrome.webstore && $('#webtrader-extension-is-installed').length <= 0) {
      if (win) {
         win.moveToTop();
         return;
      }
      const $html = $(html).i18n();
      win = windows.createBlankWindow($html,
         {
            dialogClass: "dialog-confirm",
            width: 350,
            height: 150,
            resizable: false,
            collapsable: false,
            minimizable: false,
            maximizable: false,
            modal: true,
            ignoreTileAction:true
         });

      $html.find("#apply").on("click", () => {
         win.dialog( 'close' );
         chrome.webstore.install();
         local_storage.set("chrome", { accepted_or_cancel_time : moment.utc().valueOf() });
      });
      $html.find("#cancel").on("click", () => {
         win.dialog( 'close' );
         local_storage.set("chrome", { accepted_or_cancel_time : moment.utc().valueOf() });
      });

      //This helps in showing multiple dialog windows in modal form
      $('body').append(win.dialog('widget'));
      win.dialog('open');

   }
}, 5000);

/*
This is needed in order to bring back the modality of the dialog when the page is loaded first time. Since this dialog might be loaded way before
chart dialogs are loaded, what have been found that, when charts are loaded later(after this is shown), the modality of this dialog is lost. However,
if we close and reopen this dialog after tile is called, the modality is restored. In an ideal scenario, users won't be able to do anything when this
dialog is shown because this is a blocking dialog.
*/
windows.event_on("tile", () => {
   if (win && win.dialog('isOpen')) {
      win.dialog('close');
      win.moveToTop();
   }
});

export default {}
