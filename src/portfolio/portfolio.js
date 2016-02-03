/**
 * Created by amin on 10/9/15.
 */

define(['jquery', 'windows/windows', 'websockets/binary_websockets','jquery-ui', 'datatables','jquery-growl'], function ($, windows, liveapi) {
    'use strict';

    var portfolioWin = null;
    var table = null;
    var balance_span = null;
    var currency = 'USD';

    function init(li) {
        li.click(function () {
            if(!portfolioWin)
                initPortfolioWin();
            else
                portfolioWin.moveToTop();
        });
    }

    function update_indicative(data) {
        var contract = data.proposal_open_contract;
        var id = contract.contract_id,
            bid_price = contract.bid_price;

        if (table) {
            var row = table.api().row('#' + id);
            var cols = row.data();
            if(!cols)
              return; /* table might be empty */
            var perv_indicative = cols[3];
            cols[3] = bid_price; /* update the indicative column */
            row.data(cols);

            /* colorize indicative column on change */
            var tr = table.find('#' + id);
            if(!contract.is_valid_to_sell) {
              tr.removeClass('indicative-red indicative-green').addClass('resale-not-offered');
            } else {
              tr.removeClass('resale-not-offered');
              if(perv_indicative !== bid_price) {
                tr.removeClass('indicative-red indicative-green')
                  .addClass((perv_indicative*1 < bid_price*1) ? 'indicative-green' : 'indicative-red');
              }
            }
        }
    }

    var subscribed_before = false;
    var subscribers = 0;
    /* command could be 'subscribe','forget' and 'resubscribe'. */
    function proposal_open_contract(command) {
      if(command === 'subscribe') {
        ++subscribers;
        if(!subscribed_before && subscribers > 0) {
          liveapi.send({ proposal_open_contract: 1,subscribe: 1 })
              .then(function(data){ subscribed_before = true; })
              .catch(function (err) {
                console.error(err);
                $.growl.error({ message: err.message });
              });
        }
      }
      else if(command === 'forget') {
        --subscribers;
        if(subscribed_before && subscribers === 0) {
          liveapi.send({ forget_all: 'proposal_open_contract' })
              .then(function(data){
                subscribed_before = false;
              })
              .catch(function (err) {
                subscribed_before = false;
                console.error(err.message);
              });
        }
      }
      else if( command === 'resubscribe' ) {
        liveapi.send({ forget_all: 'proposal_open_contract' })
          .then(function(data) {
            subscribed_before = false;
            return liveapi.send({ proposal_open_contract: 1,subscribe: 1 }); /* subscribe again */
          })
          .catch(function (err) {
            subscribed_before = false;
            console.error(err.message);
          });
      }
      else {
        console.error('wrong command!');
        return;
      }
    }

    function on_arrow_click(e) {
      if(e.target.tagName !== 'IMG')
        return;
      var tr = e.target.parentElement.parentElement;
      var data = table.api().row(tr).data();
      var contract = _.last(data);
      require(['viewtransaction/viewTransaction'], function(viewTransaction){
          viewTransaction.init(contract.contract_id, contract.transaction_id);
      });
    }

    function initPortfolioWin() {
        require(['css!portfolio/portfolio.css']);
        liveapi.send({ balance: 1 })
            .then(function (data) {
                var refresh = function(subscribe) {
                  if(portfolioWin.dialogExtend('state') === 'minimized') {
                      portfolioWin.dialogExtend('restore');
                  }
                  liveapi.send({ balance: 1 }).catch(function (err) { console.error(err); $.growl.error({ message: err.message }); });
                  update_table();
                  proposal_open_contract( subscribe === true? 'subscribe' : 'resubscribe');
                };

                /* refresh blance on blance change */
                liveapi.events.on('balance',function(data){
                    currency = data.balance.currency;
                    balance_span.update(data.balance.balance);
                });
                /* refresh portfolio when a new contract is added or closed */
                liveapi.events.on('transaction', function(data){
                    var transaction = data.transaction;
                    /* TODO: once the api provoided "longcode" use it to update
                      the table and do not issue another {portfolio:1} call */
                    update_table();
                    proposal_open_contract('resubscribe');
                });

                portfolioWin = windows.createBlankWindow($('<div/>'), {
                    title: 'Portfolio',
                    width: 700,
                    minHeight: 60,
                    'data-authorized': 'true',
                    close: function () {
                        proposal_open_contract('forget');
                        /* un-register proposal_open_contract handler */
                        liveapi.events.off('proposal_open_contract', update_indicative);
                    },
                    open: function () {
                        refresh(true /* subscribe to proposal_open_contract */);
                        /* register handler for proposal_open_contract */
                        liveapi.events.on('proposal_open_contract', update_indicative);
                    },
                    destroy: function() {
                      table && table.DataTable().destroy(true);
                      portfolioWin = null;
                    },
                    refresh: refresh
                });

                var header = portfolioWin.parent().find('.ui-dialog-title').addClass('with-content');
                balance_span = $('<span class="span-in-dialog-header" />')
                    .insertAfter(header);
                balance_span.update = function(balance) {
                    balance_span.html('Account balance: <strong>' + currency + ' ' + formatPrice(balance) + '</strong>');
                };

                var currency = data.balance.currency;
                table = $("<table width='100%' class='portfolio-dialog display compact'/>");
                table.appendTo(portfolioWin);
                table = table.dataTable({
                    data: [],
                    columns: [
                        { title: 'Ref.' },
                        { title: 'Contract Details' },
                        {
                          title: 'Purchase',
                          render: function(val) { return currency + ' ' + '<span class="bold">' + val + '</span>'; }
                        },
                        {
                          title: 'Indicative',
                          render: function(val) { return currency + ' ' + '<span class="bold">' + val + '</span>'; }
                        }
                    ],
                    rowId : '4', /* jQ datatables support selecting rows based on rowId https://datatables.net/reference/type/row-selector
                                    we want not to query rows everytime we update the indicative column */
                    paging: false,
                    ordering: false,
                    processing: true
                });
                table.parent().addClass('hide-search-input');

                portfolioWin.on('click', on_arrow_click);
                portfolioWin.dialog('open');
            })
            .catch(function (err) {
                console.error(err);
            });

    }

    function update_table(){
        var processing_msg = $('#' + table.attr('id') + '_processing').show();
        liveapi.send({ portfolio: 1 })
            .then(function (data) {
                var contracts = (data.portfolio && data.portfolio.contracts);
                    //|| [
                    //    {
                    //        symbol: '', shortcode: '', contract_id: '', longcode: '', expiry_time: 0, currency: '',
                    //        date_start: 0, purchase_time: 0, buy_price: '', contract_type: '', payout: ''
                    //    }
                    //];


                var rows = contracts.map(function (contract) {
                    var svg = 'up'; // TODO: when to show 'up','down' or 'equal'?
                    var img = '<img class="arrow" src="images/' + svg + '-arrow.svg"/>';
                    return [
                        contract.transaction_id,
                        img + contract.longcode,
                        formatPrice(contract.buy_price),
                        '0.00',
                        contract.contract_id, /* for jq-datatables rowId */
                        contract, /* data for view transaction dailog - when clicking on arrows */
                    ];
                });

                /* update the table */
                table.api().rows().remove();
                table.api().rows.add(rows);
                table.api().draw();
                processing_msg.hide();
            })
            .catch(function (err) {
                console.error(err);
                table.api().rows().remove();
                table.api().draw();
                processing_msg.hide();
                $.growl.error({ message: err.message });
            });
    }

    return {
        proposal_open_contract: {
          subscribe: function(){ proposal_open_contract('subscribe'); },
          forget: function() { proposal_open_contract('forget'); },
          resubscribe: function() { proposal_open_contract('resubscribe'); }
        },
        init: init
    }
});
