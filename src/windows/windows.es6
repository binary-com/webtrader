
/**
 * Created by arnab on 2/18/15.
 */

import $ from 'jquery';
import _ from 'lodash';
import navigation from 'navigation/navigation';
import tracker from 'windows/tracker';
import 'jquery.dialogextend';
import 'modernizr';
import 'common/util';
import 'css!windows/windows.css';

let closeAllObject = null, dialogCounter = 0, $menuUL = null, last_dialog = null;

/* options: { width: 350, height: 400 } */
const calculateChartCount = (options) => {
   options = $.extend({ width: 350, height: 400 }, options);
   let rows = Math.floor($(window).height() / options.height) || 1,
      cols = Math.floor($(window).width() / options.width) || 1;

   if (isSmallView()) //For small size screens
      rows = cols = 1;
   /**** limi the number of charts to 4 ****/
   if(rows * cols > 4) {
      rows = 1;
      cols = 4;
   };
   return {
      rows: rows,
      cols: cols,
      total: rows * cols
   };
}

/* shuffle the given array */
const shuffle = (array) => {
   let temp, rand_inx;

   for (let inx = array.length; inx > 0;) {
      rand_inx = Math.floor(Math.random() * inx);
      --inx;
      temp = array[inx];
      array[inx] = array[rand_inx];
      array[rand_inx] = temp;
   }

   return array;
}

let callbacks = {};
/* fire a custom event and call registered callbacks(api.events.on(name)) */
const fire_event = (name , ...args) => {
   const fns = callbacks[name] || [];
   fns.forEach(function (cb) {
      setTimeout(function(){
         cb.apply(undefined, args);
      },0);
   });
}

const tileDialogs = () => {
   // get array of dialogs
   var dialogs = $('.webtrader-dialog').filter((inx, d) => {
      /* check to see if initialized and is visible */
      const $d = $(d);
      return $d.hasClass("ui-dialog-content") && $d.dialog("isOpen") &&
            !$d.hasClass('ui-dialog-minimized') && ($(window).width() >= $d.dialog('option', 'width'));
   });


   const arrange = (dialogs, perform) => {
      let total_free_space = 0;

      const max_x = $(window).width();
      let y = 110; // position of the next window from top

      for (var inx = 0; inx < dialogs.length;) {
         var inx_start = inx;
         var row_height = 0; // height of the current row of dialogs
         var x = 0; // positon of the next window from left

         for (;/* see which which dialogs fit into current row */;) {
            if (inx == dialogs.length)
               break;
            const d = $(dialogs[inx]);
            const w = d.dialog('option', 'width'),
               h = d.dialog('option', 'height');
            row_height = Math.max(row_height, h);
            if (x + w <= max_x) {
               x += w;
               ++inx;
            }
            else
               break;
         }

         /* divide the vertical space equally between dialogs. */
         const free_space = x < max_x ? (max_x - x) : 0;
         let margin_left = x < max_x ? (max_x - x) / (inx - inx_start + 1) : 0; /* the current window might be wider than screen width */
         if(inx != dialogs.length) { /* we don't care about extra space at last row */
            total_free_space += free_space;
         }
         if (x === 0 && $(dialogs[inx]).dialog('option', 'width') > max_x) {
            ++inx;
            margin_left = 0;
         };
         x = 0;
         for (var j = inx_start; j < inx; ++j) {
            x += margin_left;
            const d = $(dialogs[j]);
            const w = d.dialog('option', 'width'),
               h = d.dialog('option', 'height');

            if(perform) /* are we testing or do we want to arrange elements */
               d.dialog('widget').animate({
                  left: x + 'px',
                  top: y + 'px'
               }, 1500, d.trigger.bind(d, 'animated'));
            /* update dialog option.position */
            d.dialog("option", "position", { my: x, at: y });
            x += w;
         };
         y += row_height + 20;
      }
      if(perform) { // fix footer postion on tile action
         setTimeout(fixFooterPosition, 1500 + 100);
      }
      return total_free_space;
   }

   /* we will try 100 different arrangements and pick the best one */
   let best = null,
      best_free_space = 1000*1000;
   for (var i = 0; i < 100; ++i) {
      shuffle(dialogs); // shuffle dialogs
      var total_free_space = arrange(dialogs, false);
      if (total_free_space < best_free_space) {
         best = dialogs.slice(); // clone the array
         best_free_space = total_free_space;
      }
   }
   // get array of large dialogs (larger than window size)
   const largeDialogs = $('.webtrader-dialog').filter(function (inx, d) {
      /* check to see if initialized and is visible */
      const $d = $(d);
      return $d.hasClass("ui-dialog-content") && $d.dialog("isOpen") && !$d.hasClass('ui-dialog-minimized') && ($(window).width() < $d.dialog('option', 'width'));
   });
   _(largeDialogs).forEach(function (d) {
      best.push(d);
   });
   arrange(best, true);
   //Do not track last dialog after re-arranging dialogs
   last_dialog = null;
   //Trigger tile when the animation is done
   setTimeout(() => fire_event("tile"), 1500 + 100);
}

/*
     @param: options.date    javascript Date object representing initial time
     @param: options.title   the header title for spinners
     @param: options.changed  called when Date changes, callback argument is a string in yyyy_mm_dd format.
   useage:
      var win = createBlankWindow(...);
      win.addDateToHeader({date:new Date(), title: 'sub header', changed: fn});
      */
const addDateToHeader = function(options) {
   options = $.extend({
      title: 'title',
      date: null,
      changed: () => { },
      cleared: () => { }
   },options);

   const header = this.parent().find('.ui-dialog-title').addClass('with-content');


   /* options: {date: date, onchange: fn } */
   const addDateDropDowns = (opts) => {
      // note that month is 0-based, like in the Date object. Adjust if necessary.
      const numberOfDays = (year, month) => {
         var isLeap = ((year % 4) == 0 && ((year % 100) != 0 || (year % 400) == 0));
         return [31, (isLeap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
      }

      const update = function(select, options) {
         var render = options.render || (v => v + '');
         select.children().remove();
         /* add the title */
         for (let i = options.min; i <= options.max; ++i)
            $('<option/>').val(i).text(render(i)).appendTo(select);
         select.val(options.initial || options.min);
         select.selectmenu('refresh');

         select.title = select.title || (function(text) {
            if (text) {
               select._title = select._title || $('<option/>').val(-1).prependTo(select);
               select._title.text(text);
               select.updating = true;
               select.val(-1).selectmenu('refresh');
               select.updating = false;
            }
            else {
               if (select._title) {
                  const value = select.val() === -1 ? options.initial : select.val();
                  select._title.remove();
                  select.updating = true;
                  select.val(value).selectmenu('refresh');
                  select.updating = false;
                  this._title = null;
               }
            }
         });

         return select;
      }

      const dt = opts.date || new Date();
      let year = $('<select />').insertAfter(header).selectmenu({ width: 'auto' });
      let month = $('<select />').insertAfter(header).selectmenu({ width: 'auto' });
      let day = $('<select />').insertAfter(header).selectmenu({ width: 'auto'});
      day.selectmenu( "menuWidget" ).addClass('date-day');
      year = update(year, { min: 2010, max: dt.getFullYear(), initial: dt.getFullYear()});
      month = update(month, {
         min: 0, max: 11, initial: dt.getMonth(),
         render: (inx) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'][inx]
      });
      day = update(day, { min: 1, max: numberOfDays(dt.getFullYear(),dt.getMonth()), initial: dt.getDate()});

      /* add title elements if no date is specified */
      if (!opts.date) {
         year.title('Year');
         month.title('Month');
         day.title('Day');
      }

      const trigger_change = () => {
         /* TODO: search other files and make sure to use a UTC date */
         const yyyy_mm_dd = new Date(Date.UTC(year.val(), month.val(), day.val())).toISOString().slice(0, 10);
         opts.onchange(yyyy_mm_dd);
      }
      day.on('selectmenuchange', () => {
         if (day.updating) {
            return;
         }
         day.title(null);
         month.title(null);
         year.title(null);

         trigger_change();
      });

      const update_day = () => {
         const options = { min: 1, max: numberOfDays(year.val(), month.val()), initial: day.val() };
         if (options.initial > options.max)
            options.initial = options.min;
         update(day, options);
      };

      [year, month].forEach(function (select) {
         select.on('selectmenuchange', function () {
            if (month.updating || year.updating) return;
            day.title(null);
            month.title(null);
            year.title(null);
            update_day();
            trigger_change();
         });
      })
      return {
         update: (yyyy_mm_dd) => {
            day.title(null);
            month.title(null);
            year.title(null);
            var args = yyyy_mm_dd.split('-');
            year.val(args[0] | 0); year.selectmenu('refresh');
            month.val((args[1] | 0)-1); month.selectmenu('refresh');
            day.val(args[2] | 0); update_day();
         },
         clear: () => {
            year.title('Year');
            month.title('Month');
            day.title('Day');
         }
      };
   }

   /* options: {date: date, onchange: fn} , events => element.on('change',...) */
   const addDatePicker = (opts) => {
      const dpicker_input = $("<input type='hidden' />")
         .insertAfter(header);
      const add_clear_button = (input) => {
         /* Run this after date-picker is constructed
                Source: stackoverflow.com/questions/4598850 */
         setTimeout(() => {
            const button_pane = $(input)
               .datepicker('widget')
               .find('.ui-datepicker-buttonpane');

            $('<button/>', {
               text: 'Clear'.i18n(),
               click: function () {
                  opts.onclear && opts.onclear();
                  $(input).datepicker('hide');
               }
            })
               .addClass('ui-datepicker-clear ui-state-default ui-priority-primary ui-corner-all')
               .appendTo(button_pane);
         }, 0);
      };

      var options = {
         showOn: 'both',
         numberOfMonths: 1,
         maxDate: 0,
         minDate: new Date(2010, 0, 1),
         dateFormat: 'yy-mm-dd',
         showAnim: 'drop',
         showButtonPanel: true,
         changeMonth: true,
         changeYear: true,
         onSelect: function () { $(this).change(); },
         beforeShow: (input, inst) => {
            add_clear_button(input);
            inst.dpDiv.css({ marginTop: '10px', marginLeft: '-220px' });
         },
         onChangeMonthYear:add_clear_button,
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
      dpicker .next('button') .text('')
         .button({ icons: { primary: 'ui-icon-calendar' } });

      dpicker_input.on('change', function () {
         const yyyy_mm_dd = $(this).val();
         opts.onchange && opts.onchange(yyyy_mm_dd);
      });
      return dpicker_input;
   }


   const dpicker = addDatePicker({
      date: options.date || new Date(),
      onchange: (yyyy_mm_dd) => {
         dropdonws.update(yyyy_mm_dd);
         options.changed(yyyy_mm_dd);
      },
      onclear: () => {
         dropdonws.clear();
         options.cleared();
      }
   });
   const dropdonws = addDateDropDowns({
      date: options.date, onchange: (yyyy_mm_dd) => {
         dpicker.datepicker("setDate", yyyy_mm_dd);
         options.changed(yyyy_mm_dd);
      }
   });

   $('<span class="span-in-dialog-header">' + options.title + '</span>').insertAfter(header);

   return {
      clear:() => dropdonws.clear()
   };
}

const getScrollHeight = (without_body) => {
   var bottoms = $('.ui-dialog').map((inx, d) => {
      const $d = $(d);
      const $w = $d.find('.webtrader-dialog');
      if($w && $w.hasClass("ui-dialog-content") && !$w.hasClass('ui-dialog-minimized')) {
         const offset = $d.offset();
         return (offset && (offset.top + $d.height())) || 0;
      }
      return 0;
   });
   if(!without_body) {
      bottoms.push($('body').height());
   }
   return  Math.max.apply(null, bottoms);
}

const fixMinimizedDialogsPosition = () => {
   var footer_height = $('.addiction-warning').height();
   var scroll_bottom = $(document).height() - $(window).height() - $(window).scrollTop();
   $("#dialog-extend-fixed-container").css("bottom", Math.max(0, footer_height - scroll_bottom));
}


export const init = function($parentObj) {
   /* wrap jquery ui dialog('destory') to fire an event */
   var original = $.fn.dialog;
   $.fn.dialog = function(cmd) {
      if(cmd === 'destroy') {
         this.trigger('dialogdestroy');
         return original.call(this, 'destroy'); // destroy and remove from dom
      }
      return original.apply(this, arguments);
   }

   $menuUL = $parentObj.find("ul");

   const tileObject = $menuUL.find(".tile");

   closeAllObject = $menuUL.find(".closeAll");
   closeAllObject.click(() => {
      /* The close click is behaving weird.
         Behavior - When there are charts opened, this event is able to close all charts and then
         unable to hide the menu. When There are no charts, then it behaves normally */
      if ($('.webtrader-dialog').length > 0) {
         $('.webtrader-dialog').dialog('close');
      }
   });

   //Attach click listener for tile menu
   tileObject.click(tileDialogs);

   require(["charts/chartWindow","websockets/binary_websockets", "navigation/menu"], (chartWindowObj,liveapi, menu) => {
      if(!tracker.is_empty()) {
         tracker.reopen();
         setTimeout(fixFooterPosition, 200);
         return;
      }
      const counts = calculateChartCount();
      liveapi
         .cached.send({trading_times: new Date().toISOString().slice(0, 10)})
         .then((markets) => {
            markets = menu.extractChartableMarkets(markets);
            /* return a random element of an array */
            const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
            const timePeriods = ['2h', '4h', '8h', '1d'];
            const chartTypes = ['candlestick', 'line', 'ohlc', 'spline']; //This is not the complete chart type list, however its good enough to randomly select one from this subset
            for (let inx = 0; inx < counts.total; ++inx) {
               const submarkets = rand(markets).submarkets;
               const symbols = rand(submarkets).instruments;
               const sym = rand(symbols);
               const timePeriod = rand(timePeriods);
               const chart_type = rand(chartTypes);

               chartWindowObj.addNewWindow({
                  instrumentCode: sym.symbol,
                  instrumentName: sym.display_name,
                  timePeriod: timePeriod,
                  type: chart_type,
                  delayAmount: sym.delay_amount
               });
            }
            tileDialogs(); // Trigger tile action
         });
   });

   /* automatically log the user in if we have oauth_token in local_storage */
   require(['websockets/binary_websockets' ], (liveapi) => {
      if(!local_storage.get('oauth')) {
         return;
      }
      /* query string parameters can tempered.
             make sure to get loginid from webapi instead */
      var oauth = local_storage.get('oauth');
      Promise.all(
         oauth.slice(1)
            .map(acc => ({ authorize: acc.token}))
            .map(req => liveapi.send(req))
      )
         .then((results) =>
            liveapi.cached.authorize()
               .then((data) => {
                  results.unshift(data);
                  let is_jpy_account = false;
                  for(let i = 0; i < results.length; ++i) {
                     oauth[i].id = results[i].authorize.loginid;
                     oauth[i].is_virtual = results[i].authorize.is_virtual;
                     if (results[i].authorize.landing_company_name.indexOf('japan') !== -1) {
                        is_jpy_account = true;
                     }
                  }
                  local_storage.set('oauth', oauth);
                  return is_jpy_account;
               })
         )
         .then((is_jpy_account) => {
            /* Japan accounts should not be allowed to login to webtrader */
            if(is_jpy_account && is_jpy_account === true) {
               liveapi.invalidate();
               $.growl.error({message: 'Japan accounts are not supported.'.i18n(), duration: 6000 });
               local_storage.remove('oauth');
               local_storage.remove('oauth-login');
            }
         })
         .catch((err) => {
            //Switch to virtual account on selfexclusion error.
            if(err.code==="SelfExclusion"){
               //Login to virtual account instead.
               oauth.forEach((ele, i) => {
                  if(ele.id.match(/^VRTC|VRCH/)){
                     liveapi.switch_account(ele.id);
                     return;
                  }
               });
               return;
            }
            console.error(err.message);
            $.growl.error({message: err.message});
            //Remove token and trigger login-error event.
            local_storage.remove('oauth');
            $(".login").trigger("login-error");
         });
   });
   $(window).resize(fixFooterPosition);
   $(window).scroll(fixMinimizedDialogsPosition);
   return this;
}

export const fixFooterPosition = (only_on_expand) => {
   $('body > .footer').width($('body').width());
   const scroll_height = getScrollHeight(true);
   const body_height = $('body').height();
   const footer_height = $('.addiction-warning').height();
   const current_height = $('body > .footer').height();
   const new_height = Math.max(scroll_height + footer_height + 15, body_height);
   if(current_height > new_height && only_on_expand === true) {
      return;
   }
   $('body > .footer').css("margin-top", new_height - 100);
}


//Trigger close even on all dialogs
export const closeAll = () => closeAllObject && closeAllObject.click();


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
export const createBlankWindow = function($html,options) {
   $html = $($html);
   const id = "windows-dialog-" + ++dialogCounter;
   options = $.extend({
      autoOpen: false,
      resizable: true,
      collapsable: false,
      width: 350,
      height: 400,
      my: 'center',
      at: 'center',
      of: window,
      title: 'Blank window'.i18n(),
      hide: 'fade',
      icons: {
         close: 'custom-icon-close',
         minimize: 'custom-icon-minimize',
         maximize: 'custom-icon-maximize'
      },
      open: function() {
         $(this).promise().done(function () {
            const changePos = $(this).dialog("option","isTrackerInitiated");
            const pos = $(this).dialog("option","relativePosition");
            // Open chart at a relative position if it is a chart or trade type
            if(!changePos && pos){
               if(!$(last_dialog).parent().length){
                  last_dialog = $(this);
                  return;
               }
               const top = parseInt($(last_dialog).parent().css("top"));
               const left = parseInt($(last_dialog).parent().css("left"));
               $($(this).parent()).css("top",top+5+"px");
               $($(this).parent()).css("left",left+5+"px");
               last_dialog = $(this);
            }
         });
      }
   }, options || {});
   options.minWidth = options.minWidth || options.width;
   options.minHeight = options.minHeight || options.height;

   if (options.resize)
      options.maximize = options.minimize  = options.restore = options.resize;

   const blankWindow = $html.attr("id", id);
   if (!options.ignoreTileAction) blankWindow.addClass('webtrader-dialog')
   blankWindow.dialog(options).dialogExtend(options);


   const dialog = blankWindow.dialog('widget');
   /* allow dialogs to be moved though the bottom of the page */
   dialog.draggable( "option", "containment", false );
   dialog.draggable( "option", "scroll", true );
   dialog.on('dragstop', () => {
      const top = dialog.offset().top;
      if(top < 0) {
         dialog.animate({ top: '0px' }, 300, dialog.trigger.bind(dialog, 'animated'));
      }
   });

   dialog.on('dragstop', fixFooterPosition);
   dialog.on('drag',() => fixFooterPosition(true));
   blankWindow.on('dialogextendminimize', fixFooterPosition);
   dialog.on('dialogresizestop', fixFooterPosition);

   if(options.destroy) { /* register for destroy event which have been patched */
      blankWindow.on('dialogdestroy', options.destroy);
   }

   blankWindow.moveToTop = () => {
      blankWindow.dialog('open');
      blankWindow.dialogExtend('restore');
      blankWindow.dialog('widget').effect("bounce", { times: 2, distance: 15 }, 450);
   };

   // add an item to window menu
   let li = null;
   const add_to_windows_menu = () => {
      const link = $("<a href='#'>" + options.title + "</a>");
      // bring window to top on click
      link.click(blankWindow.moveToTop);
      li = $('<li />').addClass(id + 'LI').html(link);
      $menuUL.append(li);
   };
   if(!options.ignoreTileAction) {
      add_to_windows_menu();
   }

   // remove item from window menu on close
   blankWindow.on('dialogclose', () => {
      li && li.remove();
      li = null;
      fixFooterPosition();
   });
   blankWindow.on('dialogopen',
      () => !li && !options.ignoreTileAction && add_to_windows_menu()
   );
   blankWindow.on('dialogextendrestore', fixFooterPosition);

   if (options.resize) {
      options.resize.call($html[0]);
   }
   blankWindow.addDateToHeader = addDateToHeader;

   /* set data-* attributes on created dialog */
   const attributes = Object.keys(options).filter((key) =>  _.startsWith(key, 'data-') );
   attributes.forEach((key) => blankWindow.attr(key, options[key]) );

   /* check and add the refresh button if needed */
   if(options.refresh){
      const header = blankWindow.parent().find('.ui-dialog-title');
      const refresh = header.append("<img class='reload' src='images/refresh.svg' title='reload'/>").find(".reload");
      refresh.on('click',options.refresh);
   }

   /* options: {
    *    module_id: 'statement/statement'  // require js module id
    *    is_unique: true/false // is this dialog instance unique or not,
    *    data: { } // arbitary data object for this dialog
    * } */
   blankWindow.track = (options) => tracker.track(options, blankWindow);
   blankWindow.fixFooterPosition = fixFooterPosition;
   blankWindow.destroy = () => blankWindow.dialog('destroy').remove();
   return blankWindow;
}

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
      changed:  () => { }
   }, options);

   var inx = options.inx, list = options.list;
   var update_select = (list) => {
      select.children().remove();
      for(let i = 0; i < list.length; ++i)
         $('<option/>').val(list[i]).text(list[i]).appendTo(select);
   }
   update_select(list);
   select.val(list[inx]);

   select = select.selectmenu({ width: options.width });
   select.on('selectmenuchange', function () {
      var val = $(this).val();
      options.changed(val);
   })

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
   if(callbacks[name]) {
      var index = callbacks[name].indexOf(cb);
      index !== -1 && callbacks[name].splice(index, 1);
   }
}

export const tile = tileDialogs;
export default {
   init,
   tile,
   closeAll,
   fixFooterPosition,
   createBlankWindow,
   makeSelectmenu,
   event_on, event_off
};
