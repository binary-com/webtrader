import $ from 'jquery';
import windows from 'windows/windows';
import rv from 'common/rivetsExtra';
import html from 'text!help/help.html';
import content from 'text!help/content.html'
import 'css!help/help.css';

"use strict";

let win = null, sublist_items = [];

const init = () => {
	const $html = $(html);
	const $content = $(content);
	//Modify links in content to open in new tab.
	$content.find("a").each((i, node)=>{
		$(node).attr('target','_blank');
	});
	win = windows.createBlankWindow($("<div class='help-dialog'/>"), {
		title: "Help",
        width: 850,
        height: 400,
        resizable: true,
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
					id: "about-us"
				},
				{
					text: "Group history",
					id: "group-history"
				}
			],
			getting_started: [
				{
					text: "Why choose Binary Trading",
					id: "why-binary"
				},
				{
					text: "Benefits of Binary Trading",
					id: "binary-benefits"
				},
				{
					text: "How to trade Binaries",
					id: "trade-binaries"
				}
			],
			trade_types: [
				{
					text: "Up/Down",
					id: "up-down"
				},
				{
					text: "Touch/No Touch",
					id: "touch-no-touch"
				},
				{
					text: "In/Out",
					id: "in-out"
				},
				{
					text: "Asians",
					id: "asians"
				},
				{
					text: "Digits",
					id: "digits"
				},
				{
					text: "Spreads",
					id: "spreads"
				}
			],
			indicators: [{
				"text": "Volatility Indicators",
				"id": "volatility-indicators"
			}, {
				"text": "Overlap Studies",
				"id": "overlap-studies"
			}, {
				"text": "Momentum Indicators",
				"id": "momentum-indicators"
			}, {
				"text": "Price Transformation",
				"id": "price-transformation"
			}, {
				"text": "Statistical Functions",
				"id": "statistical-functions"
			}, {
				"text": "Pattern Recognition",
				"id": "pattern-recognition"
			}, {
				"text": "Bill Williams",
				"id": "bill-williams"
			}],
			faq: [
				{
					text: "Opening an account",
					id: "opening-account"
				}, {
					text: "Financial Security",
					id: "financial-security"
				}, {
					text: "Depositing and withdrawing funds",
					id: "deposit-withdraw"
				}, {
					text: "Learning to trade",
					id: "learn-trade"
				}
			],
			glossary: [{
				"text": "Barrier(s)",
				"id": "barriers"
			}, {
				"text": "Binary option",
				"id": "binary-option"
			}, {
				"text": "Commodities",
				"id": "commodities"
			}, {
				"text": "Contract period",
				"id": "contract-period"
			}, {
				"text": "Derivative",
				"id": "derivative"
			}, {
				"text": "Duration",
				"id": "duration"
			}, {
				"text": "Ends Between/Ends Outside trades",
				"id": "ends-between"
			}, {
				"text": "Entry spot price",
				"id": "entry-spot"
			}, {
				"text": "Expiry price",
				"id": "expiry-price"
			}, {
				"text": "Forex",
				"id": "forex"
			}, {
				"text": "GMT",
				"id": "gmt"
			}, {
				"text": "Higher/Lower trades",
				"id": "h_l-trades"
			}, {
				"text": "Indices",
				"id": "indices"
			}, {
				"text": "In/Out trades",
				"id": "i_o-trades"
			}, {
				"text": "Market exit price",
				"id": "m_exit-price"
			}, {
				"text": "No Touch trades",
				"id": "no-touch-trades"
			}, {
				"text": "(One) Touch trades",
				"id": "touch-trades"
			}, {
				"text": "Payout",
				"id": "payout"
			}, {
				"text": "Pip",
				"id": "pip"
			}, {
				"text": "Profit",
				"id": "profit"
			}, {
				"text": "Volatility Indices",
				"id": "volatility-indices"
			}, {
				"text": "Resale price",
				"id": "resale-price"
			}, {
				"text": "Return",
				"id": "return"
			}, {
				"text": "Rise/Fall trades",
				"id": "r_f-trades"
			}, {
				"text": "Sell option",
				"id": "sell-option"
			}, {
				"text": "Spot price",
				"id": "spot-price"
			}, {
				"text": "Stake",
				"id": "stake"
			}, {
				"text": "Stays Between/Goes Outside trades",
				"id": "stays-between-goes-outside-trades"
			}, {
				"text": "Tick",
				"id": "tick"
			}, {
				"text": "Underlying",
				"id": "underlying"
			}]
		}
	};

	state.updateSublist = (list) => {
		state.current.list = list;
		state.current.sublist = state.sublist[list.sublist_id];
		state.getContent(state.current.sublist[0].id);
	};

	state.getContent = (id) => {
		state.current.content_page = id;
		state.current.content = $content.filter("#"+id)[0].innerHTML;
	};

	state.searchSublist = (e,scope) => {
		const query = $(e.target).val().toLowerCase();
		if(query.length > 0){
			state.current.list = null;
			state.current.sublist = sublist_items.filter((item) => {
				return item.text.toLowerCase().indexOf(query) != -1;
			});
			state.current.sublist && state.current.sublist.length && state.getContent(state.current.sublist[0].id);
		}
	}

	//Concat all the sublist items into one array so that we can later use it for searching.
	for (let key in state.sublist){
		sublist_items = sublist_items.concat(state.sublist[key]);
	}

	//Show the about us page initially
	state.current.list = state.list[0];
	state.updateSublist(state.current.list);
	state.current.content_page = state.sublist[state.current.list.sublist_id][0].id;
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