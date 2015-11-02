/*
	Created by Armin on Oct 31, 2015 
*/
define(["jquery", "windows/windows", "websockets/binary_websockets", "datatables", "jquery-growl"], function ($, windows, liveapi) {
	'use strict';

	var statementWin = null;
	var table = null;

	function initStatementWin($html) {
		statementWin = windows.createBlankWindow($('<div/>'), { title: 'Statement', width: 900 });
		$.get("statement/statement.html", function ($html) {
			$html = $($html);
			$html.appendTo(statementWin);

			table = $html;
			table = table.dataTable({
				data: [],
				"columnDefs": [{
                    "targets": 4,
                    "createdCell": function (td, cellData) {
                        var css_class = (parseFloat(cellData) < 0) ? 'red' : (parseFloat(cellData) >= 0) ? 'green' : '';
                        if (css_class) {
                            $(td).addClass(css_class);
                        }
                    }
                }, {
                	"targets": 5,
                	"createdCell": function (td, cellData) {
                		$(td).css("font-weight", "bold");
                	}
                }],
				paging: false,
				ordering: false,
				searching: false,
				processing: true
			});

			var refreshTable = function (yyyy_mm_dd) {
				var processing_msg = $("#" + table.attr("id") + "_processing").show();

				var request = {
					"statement": 1,
					"description": 1
				};

				if(yyyy_mm_dd) {
					var d = new Date(yyyy_mm_dd);
					var epoch = d.getTime() / 1000.0;
					/* request.date_from = request.date_to = yyyy_mm_dd;
					   The API has to be updated to accept string values.
					   I've talked to Raunak about this, will come back to this.
					*/
					request.date_from = request.date_to = epoch;
				} else {
					request.limit = 10;
				}

				console.warn('request', request);

				var refresh = function (data) {
					console.warn('data', data);

					var transactions = (data.statement && data.statement.transactions) || [];
					var date_to_string = function (epoch) {
                        var d = new Date(epoch * 1000);
                        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' +
                        d.getUTCHours() + ":" + d.getUTCMinutes() + ":" + d.getUTCSeconds();
                    };

					var rows = transactions.map(function (trans) {
						return [
							date_to_string(trans.transaction_time),
							trans.transaction_id,
							trans.action_type,
							trans.longcode,
							parseFloat(trans.amount).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'),
							parseFloat(trans.balance_after).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
						];
					});

					table.api().rows().remove();
					table.api().rows.add(rows);
					table.api().draw();
					processing_msg.hide();
				}

				liveapi.send(request)
					.then(refresh)
					.catch(function (e) {
						refresh({});
						$.growl.error({ message: e.message });
						console.error(e);
					});
			}

			refreshTable();
			statementWin.addDateToHeader({
				title: "Jump to: ",
				date: null,
				changed: refreshTable
			});

			statementWin.dialog('open');
		});
	}

	return {
		init: function($menuLink) {
			loadCSS("statement/statement.css");
			$menuLink.click(function (e) {
				if(!statementWin) {
					liveapi.cached.authorize()
						.then(initStatementWin)
						.catch(function (e) {
							$.growl.error({ message: e.message });
							console.error(e);
						});
				} else {
					statementWin.dialog('open');
				}

				e.preventDefault();
			});
		}
	}
});