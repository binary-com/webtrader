import $ from 'jquery';
import windows from 'windows/windows';
import rv from 'common/rivetsExtra';
import html from 'text!help/help.html';
import 'css!help/help.css';

"use strict";

let win = null, sublist_items = [];

const init = () => {
	const $html = $(html);
	win = windows.createBlankWindow($("<div class='help-dialog'/>"), {
		title: "Help",
        width: 850,
        height: 400,
        resizable: false,
        minimizable: true,
        maximizable: true,
        modal: false,
        ignoreTileAction:true,
        close: () => {
          win.dialog('destroy');
          win.remove();
          win = null;
        },
        destroy: () => {
          win_view && win_view.unbind();
          win_view = null;
        }
	});

	const state = {
		current: {
			list: null,
			loading: false,
			sublist: null,
			content_page: null,
			content: null
		},
		list:[
			{
				text: "About Binary.com",
				sublist_id: "about_us"
			},
			{
				text: "Getting started",
				sublist_id: "getting_started"
			},
			{
				text: " Types of trades",
				sublist_id:"trade_types"
			},
			{
				text: "Indicators",
				sublist_id: "indicators"
			},
			{
				text: "FAQ",
				sublist_id: "faq"
			},
			{
				text: "Glossary",
				sublist_id: "glossary"
			}
		],
		sublist: {
			about_us: [
				{
					text: "About us",
					url: "about-us.html"
				},
				{
					text: "Group history",
					url: "group-history.html"
				}
			],
			getting_started: [
				{
					text: "Why choose Binary Trading",
					url: "why-binary.html"
				},
				{
					text: "Benefits of Binary Trading",
					url: "binary-benefits.html"
				},
				{
					text: "How to trade Binaries",
					url: "trade-binaries.html"
				}
			],
			trade_types: [
				{
					text: "Up/Down",
					url: "up-down.html"
				},
				{
					text: "Touch/No Touch",
					url: "touch-no-touch.html"
				},
				{
					text: "In/Out",
					url: "in-out.html"
				},
				{
					text: "Asians",
					url: "asians.html"
				},
				{
					text: "Digits",
					url: "digits.html"
				},
				{
					text: "Spreads",
					url: "spreads.html"
				}
			],
			indicators: [{
				"text": "Volatility Indicators",
				"url": "volatility-indicators.html"
			}, {
				"text": "Overlap Studies",
				"url": "overlap-studies.html"
			}, {
				"text": "Momentum Indicators",
				"url": "momentum-indicators.html"
			}, {
				"text": "Price Transformation",
				"url": "price-transformation.html"
			}, {
				"text": "Statistical Functions",
				"url": "statistical-functions.html"
			}, {
				"text": "Pattern Recognition",
				"url": "pattern-recognition.html"
			}, {
				"text": "Bill Williams",
				"url": "bill-williams.html"
			}],
			faq: [
				{
					text: "Opening an account",
					url: "opening-account.html"
				}, {
					text: "Financial Security",
					url: "financial-security.html"
				}, {
					text: "Depositing and withdrawing funds",
					url: "deposit-withdraw.html"
				}, {
					text: "Learning to trade",
					url: "learn-trade.html"
				}
			],
			glossary: [{
				"text": "Barrier(s)",
				"url": "barriers.html"
			}, {
				"text": "Binary option",
				"url": "binary-option.html"
			}, {
				"text": "Commodities",
				"url": "commodities.html"
			}, {
				"text": "Contract period",
				"url": "contract-period.html"
			}, {
				"text": "Derivative",
				"url": "derivative.html"
			}, {
				"text": "Duration",
				"url": "duration.html"
			}, {
				"text": "Ends Between/Ends Outside trades",
				"url": "ends-between.html"
			}, {
				"text": "Entry spot price",
				"url": "entry-spot.html"
			}, {
				"text": "Expiry price",
				"url": "expiry-price.html"
			}, {
				"text": "Forex",
				"url": "forex.html"
			}, {
				"text": "GMT",
				"url": "gmt.html"
			}, {
				"text": "Higher/Lower trades",
				"url": "h_l-trades.html"
			}, {
				"text": "Indices",
				"url": "indices.html"
			}, {
				"text": "In/Out trades",
				"url": "i_o-trades.html"
			}, {
				"text": "Market exit price",
				"url": "m_exit-price.html"
			}, {
				"text": "No Touch trades",
				"url": "no-touch-trades.html"
			}, {
				"text": "(One) Touch trades",
				"url": "touch-trades.html"
			}, {
				"text": "Payout",
				"url": "payout.html"
			}, {
				"text": "Pip",
				"url": "pip.html"
			}, {
				"text": "Profit",
				"url": "profit.html"
			}, {
				"text": "Volatility Indices",
				"url": "volatility-indices.html"
			}, {
				"text": "Resale price",
				"url": "resale-price.html"
			}, {
				"text": "Return",
				"url": "return.html"
			}, {
				"text": "Rise/Fall trades",
				"url": "r_f-trades.html"
			}, {
				"text": "Sell option",
				"url": "sell-option.html"
			}, {
				"text": "Spot price",
				"url": "spot-price.html"
			}, {
				"text": "Stake",
				"url": "stake.html"
			}, {
				"text": "Stays Between/Goes Outside trades",
				"url": "stays-between-goes-outside-trades.html"
			}, {
				"text": "Tick",
				"url": "tick.html"
			}, {
				"text": "Underlying",
				"url": "underlying.html"
			}]
		}
	};

	state.updateSublist = (list) => {
		state.current.list = list;
		state.current.sublist = state.sublist[list.sublist_id];
		state.getContent(state.current.sublist[0].url);
	};

	state.getContent = (url) => {
		state.current.loading = true;
		state.current.content_page = url;
		require(['text!help/'+url],(content) => {
			state.current.loading = false;
			state.current.content = content;
			//Modify links in content to open in new tab.
			$(".help-dialog .content").find("a").each((i, node)=>{
				$(node).attr('target','_blank');
			});
		});
	};

	state.searchSublist = (e,scope) => {
		const query = $(e.target).val().toLowerCase();
		if(query.length > 0){
			state.current.sublist = sublist_items.filter((item) => {
				return item.text.toLowerCase().indexOf(query) != -1;
			});
			state.current.sublist && state.current.sublist.length && state.getContent(state.current.sublist[0].url);
		}
	}

	//Concat all the sublist items into one array so that we can later use it for searching.
	for (let key in state.sublist){
		sublist_items = sublist_items.concat(state.sublist[key]);
	}

	//Show the about us page initially
	state.current.list = state.list[0];
	state.updateSublist(state.current.list);
	state.current.content_page = state.sublist[state.current.list.sublist_id][0].url;
	state.getContent(state.current.content_page);

	$html.appendTo(win);
	let win_view = rv.bind(win[0], state);
    win.dialog('open');
};

export const init_help = (elem) => {
	elem.click(()=>{
		if(!win)
			init();
		else 
			win.moveToTop();
	});
};

export default {
	init_help
}