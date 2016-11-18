/**
 * URL parameters
	 affiliates - true/false
	 instrument - e.g, frxUSDJPY
	 timePeriod - 1t, 1m, 2m, 3m, 5m, 10, 15m, 30m, 1h, 2h, 4h, 8h, 1d
	 lang - en, de, etc - Any supported lang code
	 hideOverlay - true/false
	 hideShare - true/false
	 hideFooter - true/false
	 timezone
 	 chartContainerID - chart container ID which will have chart header and highchart chart
 */
define(['jquery', "websockets/binary_websockets", 'navigation/menu', 'lodash', 'common/util'], function( $, liveapi, menu, _ ) {

	var init_chart_options = function (dialog, timePeriod, type, instrumentName, instrumentCode, hideShare, hideOverlay){
		var id = dialog.attr('id');
		/* initialize chartOptions & table-view once chart is rendered */
		require(["charts/chartOptions", "charts/tableView"], function (chartOptions, tableView) {
			var table_view = tableView.init(dialog,offset);
			chartOptions.init(id, timePeriod, type, table_view.show, instrumentName, instrumentCode, !hideShare, !hideOverlay);
		});
	};

	//Check for format of timezone eg: (GMT+5.30)
	var formatCheck = new RegExp(/^(GMT[\+|-])\d{1,2}(\.\d{1,2})*$/),
		offset = 0,
		tzString = getParameterByName("timezone").toUpperCase().replace(" ","+");//Browsers change '+' in url to " "

	if(formatCheck.test(tzString)){
		var tzValue = tzString.split("GMT")[1],
			hours = parseInt(tzValue.split(".")[0]),
			minutes = tzValue.split(".")[1] ? hours > 0 ? parseInt(tzValue.split(".")[1]) : parseInt(tzValue.split(".")[1]) *-1 : 0;
		offset = (-1) * (hours * 60 + minutes);
	}

	Highcharts.setOptions(
		{
			global: {
				timezoneOffset: offset // Changing time zone.
			},
			plotOptions: {
				candlestick: {
					lineColor: 'rgba(0,0,0,1)',
					color: 'rgba(215,24,24,1)',
					upColor: 'rgba(2,146,14,1)',
					upLineColor: 'rgba(0,0,0,1)'
				}
			}
		});

	return {
		init: function() {
			/* when we are on affiliates route we need to disable overflow-x */
			$('body').addClass('affiliates');

			// get chart window html.
			require(['text!charts/chartWindow.html'], function(html) {
				var newTabId = getParameterByName('chartContainerID') || "webtrader-dialog-1",
					timePeriod = getParameterByName('timePeriod') || '1d',
					type = timePeriod == '1t' ? 'line' : 'candlestick';

				//if chart was already initialized, then first destroy them
				require(["charts/charts"], function(charts) {
					var $html = $(html).i18n();
					$html.attr("id", newTabId)
						.find('div.chartSubContainerHeader').attr('id', newTabId + "_header").end()
						.find('div.chartSubContainer').attr('id', newTabId + "_chart").end();
						
					// load market information (instruments) from API.
					//Trigger async loading of instruments and trade menu and refresh
					require(["instruments/instruments", "jquery-growl"], function (instruments) {
						instruments
							.init()
							.then(function(_instrumentJSON) {
								if (!$.isEmptyObject(_instrumentJSON)) {
									var instrumentCode = getParameterByName('instrument');
									var instrumentObject = getObjects(_instrumentJSON, 'symbol', instrumentCode);
									if (instrumentObject && instrumentObject.length > 0 && instrumentObject[0].symbol && instrumentObject[0].display_name) {
										// validate the parameters here.
										if (validateParameters()) {
											var instrumentCode = instrumentObject[0].symbol;
											var instrumentName = instrumentObject[0].display_name;
											var delayAmount = instrumentObject[0].delay_amount || 0;
											/* @@url-param
											* hideOverlay(boolean) - used for hiding comparison in chart options
											* hideShare(boolean) - used for hidinig share in chart options.
											* hideFooter(boolean) - used for hiding link in the footer
											* timezone(GMT+5.30) - get timezone.
											*/
											var hideOverlay = isHideOverlay(),
												hideShare = isHideShare();
											//Render in normal way
											require(["charts/chartWindow"], function(chartWindow) {
												var options = {
													instrumentCode : instrumentCode,
													instrumentName : instrumentName,
													timePeriod : timePeriod,
													type : type,
													delayAmount : delayAmount,
													name: newTabId
												};
												chartWindow.add_chart_options(newTabId, options);
												charts.drawChart("#" + newTabId + "_chart", {
													instrumentCode : instrumentCode,
													instrumentName : instrumentName,
													timePeriod : timePeriod,
													type : type,
													delayAmount : delayAmount
												});
												init_chart_options($html, timePeriod, type, instrumentName, instrumentCode, hideShare, hideOverlay);
												_.defer(function() {
													charts.triggerReflow("#" + newTabId + "_chart");
													
													//This is used to notify any affiliate who might want to listen for timePeriod change 
													$('#' + newTabId).on('chart-time-period-changed', function(e, timePeriod) {
														window['timePeriodChangeListener'] && window['timePeriodChangeListener'](timePeriod);
													});
													
												});
											});

										} else {
											require(["jquery", "jquery-growl"], function($) {
												$.growl.error({
													message: "Invalid parameter(s)!".i18n()
												});
											});
											$html.find('div.chartSubContainerHeader').hide();
										}
									} else {
										require(["jquery", "jquery-growl"], function($) {
											$.growl.error({
												message: "Instrument Code Unknown/Unavailable!".i18n()
											});
										});
										$html.find('div.chartSubContainerHeader').hide();
									}
								}
							})
							.catch(function (e) {
								console.log(e);
								require(["jquery", "jquery-growl"], function($) {
									$.growl.error({
										message: "Error getting market information!".i18n()
									});
								});
								$html.find('div.chartSubContainerHeader').hide();
							});
					});

					$(".mainContainer").append($html);
					$('#' + newTabId + " .chartSubContainer").height($(window).height() - 50).width($(window).width());
					$('#' + newTabId + " .table-view").width($(window).width());
					$(window).resize(function() {
						$('#' + newTabId + " .chartSubContainer").height($(window).height() - 50).width($(window).width());
						$('#' + newTabId + " .table-view").width($(window).width());
					});

				});
			});
		}
	};
});
