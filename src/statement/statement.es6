/**
 * Created by amin on November 9, 2015.
 */
import $ from "jquery";
import windows from "../windows/windows";
import liveapi from "../websockets/binary_websockets";
import _ from "lodash";
import "datatables";
import "jquery-growl";
import 'css!./statement.css';
import html from 'text!./statement.html';
import viewTransaction from '../viewtransaction/viewTransaction';

let statement = null,
   table = null,
   datepicker = null;

export const init = ($menuLink) => {
   $menuLink.click(() => {
      if (!statement)
         liveapi.cached.authorize()
            .then(initStatement)
            .catch(
               (err) => console.error(err)
            );
      else
         statement.moveToTop();
   });
};

let loading = false;
let is_specific_date_shown = false; /* is data for a specific date is shown */

const refreshTable  = (yyy_mm_dd) => {
   const processing_msg = $('#' + table.attr('id') + '_processing').css('top','200px').show();

   const request = {
      statement: 1,
      description: 1
   };

   /* if a date is specified get the transactions for that date */
   if (typeof yyy_mm_dd === 'string') {
      request.date_from = yyyy_mm_dd_to_epoch(yyy_mm_dd, { utc: true });
      const one_day_utc = Date.UTC(1970, 0, 1, 23, 59, 59) / 1000;
      request.date_to = request.date_from + one_day_utc;
      table.api().rows().remove();
      is_specific_date_shown = true;
   }
   else  { /* request the next 50 items for live scroll */
      request.limit = 250;
      if (is_specific_date_shown || (yyy_mm_dd && yyy_mm_dd.clear)) {
         table.api().rows().remove();
         is_specific_date_shown = false;
      }
      request.offset = table.api().column(0).data().length;
   }
   
   /* refresh the table with result of { profit_table:1 } from WS */
   const refresh = (data) => {
      const transactions = (data.statement && data.statement.transactions) || [];
      const view_button_text = 'View'.i18n();
      const rows = transactions.map((trans) => {
         const view_button_class = _(['buy', 'sell']).includes(trans.action_type) ? '' : 'class="button-disabled"';
         const view_button = '<button '+view_button_class+'>' + view_button_text + '</button>';
         const amount = trans.amount * 1;
         return [
            epoch_to_string(trans.transaction_time, { utc: true }),
            trans.transaction_id,
            _.capitalize(trans.action_type),
            trans.longcode,
            trans.amount * 1,
            '<b>' + formatPrice(trans.balance_after,local_storage.get("currency")) + '</b>',
            view_button,
            trans, /* data for view transaction dailog - when clicking on arrows */
         ];
      });
      table.api().rows.add(rows);
      table.api().draw();
      loading = false;
      processing_msg.hide();
   };

   if(!loading) {
         loading = true;
         liveapi.send(request)
            .then(refresh)
            .catch((err) => {
                  refresh({});
                  $.growl.error({ message: err.message });
                  console.error(err);
                  loading = false;
            });
   }
}

const initStatement = () => {
   statement = windows.createBlankWindow($('<div/>'), {
      title: 'Statement'.i18n(),
      dialogClass: 'statement',
      width: 800 ,
      height: 400,
      close: () => {
         table && table.DataTable().destroy(true);
         statement && statement.remove();
         statement = null;
      },
      refresh: () => {
         datepicker.clear();
         refreshTable({clear:true});
      },
      'data-authorized' :'true'
   });
   statement.track({
      module_id: 'statement',
      is_unique: true,
      data: null,
   });

   table = $(html).i18n();
   table.appendTo(statement);

   table = table.dataTable({
      data: [],
      autoWidth: false,
      "columnDefs": [ {
         "targets": 3,
         "width": "35%"
      }, {
         "targets": 4,
         "createdCell": (td, cellData) => {
            const css_class = (cellData < 0) ? 'red' : (cellData > 0) ? 'green' : 'bold';
            if (css_class)
               $(td).addClass(css_class);
            td.innerHTML = formatPrice(cellData, local_storage.get("currency"));
         }
      }],
      paging: false,
      ordering: false,
      searching: true,
      processing: true,
   });

   table.closest('.ui-dialog-content').addClass('hide-search-input').addClass('statement-dialog-content');

   // Apply the a search on each column input change
   table.api().columns().every(function () {
      const column = this;
      $('input', this.header()).on('keyup change', function () {
         if (column.search() !== this.value)
            column.search(this.value) .draw();
      });
   });


   datepicker = statement.addDateToHeader({
      title: 'Jump to: ',
      date: null, /* set date to null */
      changed: refreshTable,
      cleared: refreshTable
   });

   statement.on('click', on_arrow_click);
   statement.dialog('open');


   /**************** infinite scroll implementation *******************/
   refreshTable({clear:true});
   statement.scroll(() => {
      const scrollTop = statement.scrollTop(),
         innerHeight = statement.innerHeight(),
         scrollHeight = statement[0].scrollHeight,
         postion = (scrollTop + innerHeight) / scrollHeight;
      if(postion > 0.75 && !loading && !is_specific_date_shown){
         refreshTable({clear:false});
      }
   });

};

const on_arrow_click = (e) =>{
   const target = e.target;
   const $target = $(target);
   if(target.tagName !== 'BUTTON' || $target.hasClass('button-disabled'))
      return;
   const tr = target.parentElement.parentElement;
   let transaction = table.api().row(tr).data();
   transaction = _.last(transaction);
   $target.addClass('button-disabled');
   viewTransaction.init(transaction.contract_id, transaction.transaction_id)
      .then(() => $target.removeClass('button-disabled')).catch((err)=>{});
}

export default  { init }
