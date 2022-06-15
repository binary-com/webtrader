import $ from 'jquery';
import _ from 'lodash';
import navigation from 'navigation/navigation';
import tracker from 'windows/tracker';
import 'jquery.dialogextend';
import 'modernizr';
import 'common/util';
import 'css!windows/windows.css';
import moment from 'moment';
import workspace from '../workspace/workspace.js';

let dialogCounter = 0;

let callbacks = {};
/* fire a custom event and call registered callbacks(api.events.on(name)) */
const fire_event = (name, ...args) => {
   const fns = callbacks[name] || [];
   fns.forEach(function (cb) {
      setTimeout(function () {
         cb.apply(undefined, args);
      }, 0);
   });
}


/*
     @param: options.date    javascript Date object representing initial time
     @param: options.title   the header title for spinners
     @param: options.changed  called when Date changes, callback argument is a string in yyyy_mm_dd format.
     @param: options.maxDate (optional) max selectable date
   useage:
      var win = createBlankWindow(...);
      win.addDateToHeader({date:new Date(), title: 'sub header', changed: fn});
      */
const addDateToHeader = function (mainOptions) {
   mainOptions = $.extend({
      title: 'title',
      date: null,
      changed: () => { },
      cleared: () => { },
      addDateDropDowns: true,
   }, mainOptions);

   const header = this.parent().find('.ui-dialog-title').addClass('with-content');


   /* options: {date: date, onchange: fn} , events => element.on('change',...) */
   const addDatePicker = (opts) => {
      const dpicker_input = $("<input type='hidden' />").insertAfter(header);

      var options = {
         showOn: 'both',
         numberOfMonths: 1,
         maxDate: mainOptions.maxDate ? mainOptions.maxDate : 0,
         minDate: new Date(2010, 0, 1),
         dateFormat: 'yy-mm-dd',
         showAnim: 'drop',
         showButtonPanel: true,
         changeMonth: true,
         changeYear: true,
         onSelect: function () { $(this).change(); },
         beforeShow: (input, inst) => {
            inst.dpDiv.css({ marginTop: '10px', marginLeft: '-220px' });
         },
         closeText: 'Done'.i18n(),
         currentText: 'Today'.i18n()
      };

      const dpicker = dpicker_input
         .datepicker(options)
         .datepicker("setDate", opts.date.toISOString().slice(0, 10));

      $.datepicker._gotoToday = (id) => {
         $(id).datepicker('setDate', new Date()).change().datepicker('hide');
      };

      /* use JQ-UI icon for datepicker */
      dpicker.next('button').text('')
         .button({ icons: { primary: 'ui-icon-calendar' } });

      dpicker_input.on('change', function () {
         const yyyy_mm_dd = $(this).val();
         opts.onchange && opts.onchange(yyyy_mm_dd);
      });
      return dpicker_input;
   }


   let dropdonws = null;
   const date_string = $('<span style="line-height: 24px; position: relative; left: 10px"></span>');
   const dpicker = addDatePicker({
      date: mainOptions.date || new Date(),
      onchange: (yyyy_mm_dd) => {
         date_string.text(yyyy_mm_dd);
         dropdonws && dropdonws.update(yyyy_mm_dd);
         mainOptions.changed(yyyy_mm_dd);
      },
      onclear: () => {
         dropdonws && dropdonws.clear();
         mainOptions.cleared();
      }
   });

   /*
    options: {date: date, onchange: fn }
    There were lot of complexity introduced because of drop down.
    For example, there were scenarios, where it is not allowed to select dates in future
    There were scenarios, where it is not allowed to select date in future
    Drop down was allowing certain dates to be selected whereas date picker was not.
    Such complexity is needed when I compared it with binary.com implementation.
   */
   const addDateDropDowns = (dt) => {
      let inputElementForDate = $('<input placeholder="Select date" readonly class="windows-dateInput" />').insertAfter(header);
      inputElementForDate.on('click', () => dpicker.datepicker('show'));
      if (dt) {
         inputElementForDate.val(moment(dt).format('DD MMM, YYYY'));
      }
      return {
         update: yyyy_mm_dd => inputElementForDate.val(moment.utc(yyyy_mm_dd, 'YYYY-MM-DD').format('DD MMM, YYYY')),
         clear: () => inputElementForDate.val(''),
      };
   }

   if (mainOptions.addDateDropDowns) {
      dropdonws = addDateDropDowns(mainOptions.date);
   }
   else {
      date_string.insertAfter(header);
      date_string.text(mainOptions.date.toISOString().slice(0, 10));
   }

   $('<span class="span-in-dialog-header">' + mainOptions.title + '</span>').insertAfter(header);

   return {
      clear: () => dropdonws && dropdonws.clear()
   };
}

const getScrollHeight = (without_body) => {
   var bottoms = $('.ui-dialog').map((inx, d) => {
      const $d = $(d);
      const $w = $d.find('.webtrader-dialog');
      if ($w && $w.hasClass("ui-dialog-content") && !$w.hasClass('ui-dialog-minimized')) {
         const offset = $d.offset();
         return (offset && (offset.top + $d.height())) || 0;
      }
      return 0;
   });
   if (!without_body) {
      bottoms.push($('body').height());
   }
   return Math.max.apply(null, bottoms);
}

const fixMinimizedDialogsPosition = () => {
   var footer_height = $('.addiction-warning').height();
   var scroll_bottom = $(document).height() - $(window).height() - $(window).scrollTop();
   $("#dialog-extend-fixed-container").css("bottom", Math.max(0, footer_height - scroll_bottom));
}


export const init = function ($parentObj) {
   /* wrap jquery ui dialog('destory') to fire an event */
   var original = $.fn.dialog;
   $.fn.dialog = function (cmd) {
      try {
         if (cmd === 'destroy') {
            this.trigger('dialogdestroy');
            return original.call(this, 'destroy'); // destroy and remove from dom
         }
         return original.apply(this, arguments);
      } catch (err) {
         $.growl.error({ message: err.message });
      }
   }

   require(["charts/chartWindow", "websockets/binary_websockets", "navigation/menu", "trade/tradeDialog"], (chartWindowObj, liveapi, menu, tradeDialog) => {
      if (!tracker.is_empty()) {
         tracker.reopen();
         return;
      }
      liveapi
         .cached.send({ trading_times: new Date().toISOString().slice(0, 10) })
         .then((markets) => {
            markets = menu.extractChartableMarkets(markets);
            const sym = markets[0].submarkets[0].instruments[0];
            const timePeriod = '1t';
            const type = 'line';
            const pip = '0.001';

            liveapi
               .send({ contracts_for: sym.symbol })
               .then((res) => {
                  // open chart window and tradeDialog
                  chartWindowObj.addNewWindow({ instrumentCode: sym.symbol, instrumentName: sym.display_name, timePeriod, type, delayAmount: sym.delay_amount });
                  tradeDialog.init({ symbol: sym.symbol, display_name: sym.display_name, pip }, res.contracts_for);
                  workspace.tileDialogs();
               })
               .catch((err) => console.error(err));
         });
   });

   /* automatically log the user in if we have oauth_token in local_storage */
   require(['websockets/binary_websockets'], (liveapi) => {
      if (!local_storage.get('oauth')) {
         return;
      }
      /* query string parameters can tempered.
             make sure to get loginid from webapi instead */
      var oauth = local_storage.get('oauth');
      Promise.all(
         oauth.slice(1)
            .map(acc => ({ authorize: acc.token }))
            .map(req => liveapi.send(req))
      )
         .then((results) =>
            liveapi.cached.authorize()
               .then((data) => {
                  const oauth = local_storage.get("oauth");
                  // Set currency for each account.
                  results.forEach((auth) => {
                     if (auth.authorize) {
                        const _curr = oauth.find((e) => e.id == auth.authorize.loginid);
                        _curr.currency = auth.authorize.currency;
                     }
                  });
                  local_storage.set("oauth", oauth);
                  results.unshift(data);
                  let is_jpy_account = false;
                  for (let i = 0; i < results.length; ++i) {
                     oauth[i].id = results[i].authorize.loginid;
                     oauth[i].is_virtual = results[i].authorize.is_virtual;
                     if (results[i].authorize.landing_company_name.indexOf('japan') !== -1) {
                        is_jpy_account = true;
                     }
                  }
                  local_storage.set('oauth', oauth);
                  return is_jpy_account;
               })
               .catch((err) => {
                  $.growl.error({ message: err.message });
               })
         )
         .then((is_jpy_account) => {
            /* Japan accounts should not be allowed to login to webtrader */
            if (is_jpy_account && is_jpy_account === true) {
               liveapi.invalidate();
               $.growl.error({ message: 'Japan accounts are not supported.'.i18n(), duration: 6000 });
               local_storage.remove('oauth');
               local_storage.remove('oauth-login');
            }
         })
         .catch((err) => {
            //Switch to virtual account on selfexclusion error.
            if (err.code === "SelfExclusion") {
               //Login to virtual account instead.
               oauth.forEach((ele, i) => {
                  if (ele.id.match(/^VRTC/)) {
                     liveapi.switch_account(ele.id);
                     return;
                  }
               });
               return;
            }
            console.error(err.message);
            $.growl.error({ message: err.message });
            //Remove token and trigger login-error event.
            local_storage.remove('oauth');
            $(".login").trigger("login-error");
         });
   });
   $(window).scroll(fixMinimizedDialogsPosition);
   return this;
}

/* important options: {
   title:'',
   resize:fn, // callabak for dialog resize event
   close: fn, // callback for dialog close event
   open: fn,  // callback for dialog open event
   destroy: fn, // callback for dialog destroy event
   refresh: fn, // callback for refresh button click
   autoOpen: false,
   resizable:true,
   collapsable:false,
   minimizable: true,
   maximizable: true,
   closable:true,
   modal:true, // Whether to block base page and show it as blocking modal dialog
   closeOnEscape:true, // Respond to ESC key event
   ignoreTileAction:false, // Is this dialog going to take part in tile action
   data-*: 'value' // add arbitary data-* attributes to the dialog.('data-authorized' for exmaple)
}
notes:
    1- get generated dialog id via createBlankWindow(...).attr('id')
    2- if autoOpen == false  use createBalnkWindow(...).dialog('open') to open the dialog
    2- if minWidth and minHeight are not specified the options.width and options.height will be used for minimums.
 */
export const createBlankWindow = function ($html, options) {
   $html = $($html);
   const id = "windows-dialog-" + ++dialogCounter;
   options = $.extend({
      autoOpen: false,
      resizable: true,
      collapsable: false,
      draggable: true,
      width: 350,
      height: 400,
      my: 'center',
      at: 'center',
      of: window,
      title: 'Blank window'.i18n(),
      id: dialogCounter,
      icons: {
         close: 'custom-icon-close',
         minimize: 'custom-icon-minimize',
         maximize: 'custom-icon-maximize',
         restore: 'custom-icon-restore'
      },
   }, options || {});
   options.minWidth = options.minWidth || options.width;
   options.minHeight = options.minHeight || options.height;

   if (options.resize)
      options.maximize = options.minimize = options.restore = options.resize;

   const blankWindow = $html.attr("id", id);
   if (!options.ignoreTileAction) blankWindow.addClass('webtrader-dialog')
   blankWindow.dialog(options).dialogExtend(options);


   const dialog = blankWindow.dialog('widget');
   dialog.addClass('webtrader-dialog-widget');
   /* allow dialogs to be moved though the bottom of the page */
   if (options.draggable !== false) {
      dialog.draggable("option", "containment", false);
      dialog.draggable("option", "scroll", true);
   }
   dialog.on('dragstop', () => {
      const top = dialog.offset().top;
      const left = dialog.offset().left;
      const dialogWidth = blankWindow.dialog("option", "width");
      const windowWidth = $(window).width();
      const navHeight = $('#nav-menu .container').height();

      if (top < navHeight + 36) {
         dialog.animate({ top: `${navHeight + 36}px` }, 300, dialog.trigger.bind(dialog, 'animated'));
      }
      if (left < 0) {
         dialog.animate({ left: '0px' }, 300, dialog.trigger.bind(dialog, 'animated'));
      }
      if (left + dialogWidth > windowWidth) {
         dialog.animate({ left: `${windowWidth - dialogWidth - 10}px` }, 300, dialog.trigger.bind(dialog, 'animated'));
      }
   });

   if (options.destroy) { /* register for destroy event which have been patched */
      blankWindow.on('dialogdestroy', options.destroy);
   }

   blankWindow.on('dialogopen', function () {
      _.defer(() => {
         const top = ['#msg-notification', '#topbar', '#nav-menu'].map(selector => $(selector).outerHeight()).reduce((a, b) => a + b, 0);
         const parent = $(this).parent();
         if (parent.css('top') && parent.css('top').replace('px', '') * 1 <= top) {
            parent.animate({
               top: top + (Math.random() * 15 | 0),
               left: `+=${(Math.random() * 10 | 0) - 20}px`,
            }, 300, dialog.trigger.bind(dialog, 'animated'));
         }
      });
      if (options.title !== 'Manage') {
         workspace.addDialog(options.title, options.id, blankWindow.moveToTop, () => blankWindow.dialog('close'));
      }

   });
   blankWindow.moveToTop = () => {
      blankWindow.dialog('open');
      blankWindow.dialogExtend('restore');
      blankWindow.dialog('widget').effect("bounce", { times: 2, distance: 15 }, 450);
   };

   // add an item to window menu
   const add_to_windows_menu = () => {
      const cleaner = () => {
         blankWindow.dialogExtend('restore');
         workspace.removeDialog(options.id);
      }
      blankWindow.on('dialogclose', cleaner);
   };
   
   if (!options.ignoreTileAction) {
      add_to_windows_menu();
   }

   if (options.resize) {
      options.resize.call($html[0]);
   }
   blankWindow.addDateToHeader = addDateToHeader;

   /* set data-* attributes on created dialog */
   const attributes = Object.keys(options).filter((key) => _.startsWith(key, 'data-'));
   attributes.forEach((key) => blankWindow.attr(key, options[key]));

   /* check and add the refresh button if needed */
   if (options.refresh) {
      const header = blankWindow.parent().find('.ui-dialog-title');
      const refresh = header.append("<img class='reload' src='images/refresh.svg' title='reload'/>").find(".reload");
      refresh.on('click', options.refresh);
   }

   /* options: {
    *    module_id: 'statement/statement'  // require js module id
    *    is_unique: true/false // is this dialog instance unique or not,
    *    data: { } // arbitary data object for this dialog
    * } */
   blankWindow.track = (options) => tracker.track(options, blankWindow);

   blankWindow.destroy = () => {
      if (blankWindow.data('ui-dialog')) {
         blankWindow.dialog('destroy');
      }
      blankWindow.remove();
   };
   return blankWindow;
};

/*
   Uses a jquery-ui spinner to display a list of strings.
       @param: options.index       initial value of the array to show.
       @param: options.list        array of string items to show
       @param: options.changed     callback thats i called when menu is changed.
       @param: options.width       can specify the with of selectmenu.
   Note: you should add your input to dom before turning it a spinner.

   Note: you can call 'update_list(...)' on the returned spinner to update the list of items:
       var spinner = makeTextSpinner(input,{list:['a,'b','c'],inx:0});
       spinner.update_list(['a','d','e','f']);

   TODO: move this to a utility file
*/
export const makeSelectmenu = function (select, options) {
   options = $.extend({
      list: ['empty'],
      inx: 0,
      changed: () => { }
   }, options);
   options.changed = options.changed ? options.changed : () => { };

   var inx = options.inx, list = options.list;
   var update_select = (list) => {
      select.children().remove();
      for (let i = 0; i < list.length; ++i)
         $('<option/>').val(list[i]).text(list[i]).appendTo(select);
   }
   update_select(list);
   select.val(list[inx]);

   select = select.selectmenu({
      classes: {
         "ui-selectmenu-button": "ui-selectmenu-button ui-state-default"
      },
      width: options.width
   });
   select.on('selectmenuchange', function () {
      var val = $(this).val();
      options.changed(val);
   });

   select.update_list = (new_list) => {
      update_select(new_list);
      select.val(new_list[0]);
      select.selectmenu('refresh');
   }
   return select;
};

export const event_on = (name, cb) => {
   (callbacks[name] = callbacks[name] || []).push(cb);
   return cb;
}

export const event_off = (name, cb) => {
   if (callbacks[name]) {
      var index = callbacks[name].indexOf(cb);
      index !== -1 && callbacks[name].splice(index, 1);
   }
}

export default {
   init,
   createBlankWindow,
   makeSelectmenu
};
