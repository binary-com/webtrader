/**
 * Created by amin on 10/9/15.
 */

define(['jquery', 'windows/windows', 'websockets/binary_websockets','jquery-ui', 'datatables','jquery-growl'], function ($, windows, liveapi) {
    'use strict';

    var portfolioWin = null;
    var table = null;
    var balance_span = null;
    var currency = 'USD';
    var subscribed_contracts = [];

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
    liveapi.events.on('logout', function(){
        subscribed_before = false;
        subscribers = 0;
    });
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
            --subscribers;
            proposal_open_contract('subscribe'); /* subscribe again */
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

    var on_arrow_click = function(e){
      var target = e.target;
      var $target = $(target);
      if(target.tagName !== 'BUTTON' || $target.hasClass('button-disabled'))
        return;
      var tr = target.parentElement.parentElement;
      var transaction = table.api().row(tr).data();
      transaction = _.last(transaction);
      $target.addClass('button-disabled');
      require(['viewtransaction/viewTransaction'], function(viewTransaction){
        viewTransaction.init(transaction.contract_id, transaction.transaction_id)
                       .then(function(){ $target.removeClass('button-disabled'); });
      });
    }

    function initPortfolioWin() {
        require(['css!portfolio/portfolio.css']);
        liveapi.send({ balance: 1 })
            .then(function (data) {
                /* refresh blance on blance change */
                liveapi.events.on('balance',function(data){
                  if(data.balance !== undefined && data.balance.currency !== undefined) {
                    currency = data.balance.currency;
                    balance_span.update(data.balance.balance);
                  }
                });
                /* refresh portfolio when a new contract is added or closed */
                liveapi.events.on('transaction', function(data){
                    var transaction = data.transaction;

                    if(transaction.action === 'buy') {
                      var view_button = '<button>View</button>'.i18n();
                      var row = [
                          transaction.transaction_id,
                          transaction.longcode,
                          formatPrice(Math.abs(transaction.amount)),
                          '0.00',
                          view_button,
                          transaction.contract_id, /* for jq-datatables rowId */
                          transaction, /* data for view transaction dailog - when clicking on arrows */
                      ];
                      table.api().rows.add([row]);
                      table.api().draw();
                      subscribe_to_contracts([transaction]);
                    } else if (transaction.action === 'sell') {
                      var tr = table.find('#' + transaction.contract_id)[0];
                      table.api().row(tr).remove();
                      table.api().draw();
                      forget_the_contracts([transaction]);
                    }
                });

                portfolioWin = windows.createBlankWindow($('<div/>'), {
                    title: 'Portfolio'.i18n(),
                    width: 700 ,
                    height: 400,
                    'data-authorized': 'true',
                    close: function () {
                        forget_the_contracts(subscribed_contracts);
                        /* un-register proposal_open_contract handler */
                        liveapi.events.off('proposal_open_contract', update_indicative);
                    },
                    open: function () {
                        init_table();
                        /* register handler for proposal_open_contract */
                        liveapi.events.on('proposal_open_contract', update_indicative);
                    },
                    destroy: function() {
                      table && table.DataTable().destroy(true);
                      portfolioWin = null;
                    },
                    refresh: function() {
                      liveapi.send({ balance: 1 }).catch(function (err) { console.error(err); $.growl.error({ message: err.message }); });
                      forget_the_contracts(subscribed_contracts).then(init_table);
                    }
                });

                var header = portfolioWin.parent().find('.ui-dialog-title').addClass('with-content');
                balance_span = $('<span class="span-in-dialog-header" />')
                    .insertAfter(header);
                balance_span.update = function(balance) {
                    balance_span.html('Account balance: <strong>'.i18n() +  formatPrice(balance, currency) + '</strong>');
                };

                var currency = data.balance.currency;
                table = $("<table width='100%' class='portfolio-dialog hover'/>");
                table.appendTo(portfolioWin);
                table = table.dataTable({
                    data: [],
                    columns: [
                        { title: 'Ref.'.i18n() },
                        { title: 'Contract Details'.i18n() },
                        {
                          title: 'Purchase'.i18n(),
                          render: function(val) { return '<span class="bold">' + formatPrice(val,currency) + '</span>'; }
                        },
                        {
                          title: 'Indicative'.i18n(),
                          render: function(val) { return '<span class="bold">' + formatPrice(val,currency) + '</span>'; }
                        },
                        { title: '' }
                    ],
                    rowId : '5', /* jQ datatables support selecting rows based on rowId https://datatables.net/reference/type/row-selector
                                    we want not to query rows everytime we update the indicative column */
                    paging: false,
                    ordering: false,
                    processing: true
                });
                table.parent().addClass('hide-search-input');

                portfolioWin.on('click', on_arrow_click);
                portfolioWin.track({
                  module_id: 'portfolio',
                  is_unique: true,
                  data: null
                });
                portfolioWin.dialog('open');
            })
            .catch(function (err) {
                console.error(err);
            });

    }

    function subscribe_to_contracts(contracts) {
        contracts.forEach(function(contract){
          subscribed_contracts.push(contract);
          liveapi.proposal_open_contract
                 .subscribe(contract.contract_id)
                 .catch(function(err) {
                    $.growl.error({ message: err.message });
                 });
        });
    }

    function forget_the_contracts(contracts) {
        var promises = contracts.map(function(contract){
          return liveapi.proposal_open_contract
                 .forget(contract.contract_id)
                 .catch(function(err) {
                    $.growl.error({ message: err.message });
                 });
        });
        var ids = _.map(contracts, 'contract_id');
        subscribed_contracts = subscribed_contracts.filter(function(contract) {
          return _.includes(ids, contract.contract_id) === false;
        });
        return Promise.all(promises);
    }

    function init_table(){
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

                var view_button = '<button>View</button>'.i18n();
                var rows = contracts.map(function (contract) {
                    return [
                        contract.transaction_id,
                        contract.longcode,
                        formatPrice(contract.buy_price),
                        '0.00',
                        view_button,
                        contract.contract_id, /* for jq-datatables rowId */
                        contract, /* data for view transaction dailog - when clicking on arrows */
                    ];
                });
                /* register callback to sell contract on expiration */
                contracts.forEach(function(contract){
                  liveapi.sell_expired(contract.expiry_time);
                });
                subscribe_to_contracts(contracts);

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
