/**
 * Created by arnab on 4/24/16.
 */
import $ from 'jquery';
import windows from '../windows/windows';
import '../common/util';
import 'highstock-release/highstock';
import 'jquery-growl';

let win = null;

/*Set theme from local storage*/
let themeName = local_storage.get("theme");
const custom_theme = local_storage.get("custom_theme");
themeName = themeName && themeName.name;
if (themeName) {
   require(['lib/highstock-release/themes/' + themeName]);
}
else if(custom_theme) {
   Highcharts.setOptions(custom_theme);
}
else { // Setting candle-stick color incase there's no theme set.
   Highcharts.setOptions({
      plotOptions: {
         candlestick: {
            lineColor: 'rgba(0,0,0,1)',
            color: 'rgba(215,24,24,1)',
            upColor: 'rgba(2,146,14,1)',
            upLineColor: 'rgba(0,0,0,1)'
         }
      }
   });
}

$('a.theme_dark_blue, a.theme_dark_green, a.theme_dark_unica, a.theme_gray, a.theme_grid, ' +
   'a.theme_grid_light, a.theme_sand_signika, a.theme_skies, a.theme_default')
   .off('click')
   .on('click', function () {
      const $ele = $(this);
      const elementText = $ele.text();
      const themeName = $ele.attr('theme-name');
      confirmationDialog(null, themeName, elementText);
   });

export const confirmationDialog = (themeObj, themeName, elementText) => {
   if(win) {
      win.moveToTop();
      return;
   }
   require(['text!themes/themes.html'], ($html) => {
      $html = $($html).i18n();

      win = windows.createBlankWindow($html, {
         dialogClass: 'dialog-confirm',
         width: 360,
         height: 175,
         resizable: false,
         collapsable: false,
         minimizable: false,
         maximizable: false,
         closable: false,
         closeOnEscape: false,
         modal: true,
         ignoreTileAction:true,
         destroy: () => {
            win = null;
         },
      });
      $html.find("#apply").on("click", () => {
         $.growl.notice({message: 'Loading ' + elementText});
         if(themeObj){
            local_storage.remove("theme");
            local_storage.set("custom_theme", themeObj);
         }
         else if(themeName === 'default') {
            local_storage.remove("theme");
            local_storage.remove("custom_theme");
         } else{
            local_storage.set("theme", {name: themeName}); 
         }
         location.reload();
      });
      $html.find("#cancel").on("click", () => {
         win.dialog( 'close' );
         win.dialog( "destroy" );
      });
      win.dialog('open');
   });
}

export default  { confirmationDialog };

