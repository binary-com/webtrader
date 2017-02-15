import $ from 'jquery';
import windows from 'windows/windows';
import rv from 'common/rivetsExtra';
import html from 'text!help/help.html';
import content from 'text!help/content.html'
import 'css!help/help.css';

"use strict";

let win = null,
    sublist_items = [];

const init = () => {
    const $html = $(html);
    const $content = $(content);
    //Modify links in content to open in new tab.
    $content.find("a").each((i, node) => {
        if ($(node).attr("href").indexOf("contract-period") != -1)
            return;
        $(node).attr('target', '_blank');
    });
    win = windows.createBlankWindow($("<div class='help-dialog'/>"), {
        title: "Help",
        width: 850,
        height: 400,
        resizable: true,
        minimizable: true,
        maximizable: true,
        modal: false,
        ignoreTileAction: true,
        close: () => {
            win.dialog('destroy');
            win.remove();
            win = null;
            sublist_items = [];
        },
        destroy: () => {
            win_view && win_view.unbind();
            sublist_items = [];
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
        list: [{
            text: "About Binary.com".i18n(),
            sublist_id: "about_us"
        }, {
            text: "Getting started".i18n(),
            sublist_id: "getting_started"
        }, {
            text: " Types of trades".i18n(),
            sublist_id: "trade_types"
        }, {
            text: "Indicators".i18n(),
            sublist_id: "indicators"
        }, {
            text: "FAQ".i18n(),
            sublist_id: "faq"
        }, {
            text: "Glossary".i18n(),
            sublist_id: "glossary"
        }],
        sublist: {
            about_us: [{
                text: "About us".i18n(),
                id: "about-us"
            }, {
                text: "Group history".i18n(),
                id: "group-history"
            }],
            getting_started: [{
                text: "Why choose Binary Trading".i18n(),
                id: "why-binary"
            }, {
                text: "Benefits of Binary Trading".i18n(),
                id: "binary-benefits"
            }, {
                text: "How to trade Binaries".i18n(),
                id: "trade-binaries"
            }],
            trade_types: [{
                text: "Up/Down".i18n(),
                id: "up-down"
            }, {
                text: "Touch/No Touch".i18n(),
                id: "touch-no-touch"
            }, {
                text: "In/Out".i18n(),
                id: "in-out"
            }, {
                text: "Asians".i18n(),
                id: "asians"
            }, {
                text: "Digits".i18n(),
                id: "digits"
            }, {
                text: "Spreads".i18n(),
                id: "spreads"
            }],
            indicators: [{
                "text": "Volatility Indicators".i18n(),
                "id": "volatility-indicators"
            }, {
                "text": "Overlap Studies".i18n(),
                "id": "overlap-studies"
            }, {
                "text": "Momentum Indicators".i18n(),
                "id": "momentum-indicators"
            }, {
                "text": "Price Transformation".i18n(),
                "id": "price-transformation"
            }, {
                "text": "Statistical Functions".i18n(),
                "id": "statistical-functions"
            }, {
                "text": "Pattern Recognition".i18n(),
                "id": "pattern-recognition"
            }, {
                "text": "Bill Williams".i18n(),
                "id": "bill-williams"
            }],
            faq: [{
                text: "Opening an account".i18n(),
                id: "opening-account"
            }, {
                text: "Financial Security".i18n(),
                id: "financial-security"
            }, {
                text: "Depositing and withdrawing funds".i18n(),
                id: "deposit-withdraw"
            }, {
                text: "Learning to trade".i18n(),
                id: "learn-trade"
            }],
            glossary: [{
                "text": "Barrier(s)".i18n(),
                "id": "barriers"
            }, {
                "text": "Binary option".i18n(),
                "id": "binary-option"
            }, {
                "text": "Commodities".i18n(),
                "id": "commodities"
            }, {
                "text": "Contract period".i18n(),
                "id": "contract-period"
            }, {
                "text": "Derivative".i18n(),
                "id": "derivative"
            }, {
                "text": "Duration".i18n(),
                "id": "duration"
            }, {
                "text": "Ends Between/Ends Outside trades".i18n(),
                "id": "ends-between"
            }, {
                "text": "Entry spot price".i18n(),
                "id": "entry-spot"
            }, {
                "text": "Expiry price".i18n(),
                "id": "expiry-price"
            }, {
                "text": "Forex".i18n(),
                "id": "forex"
            }, {
                "text": "GMT".i18n(),
                "id": "gmt"
            }, {
                "text": "Higher/Lower trades".i18n(),
                "id": "h_l-trades"
            }, {
                "text": "Indices".i18n(),
                "id": "indices"
            }, {
                "text": "In/Out trades".i18n(),
                "id": "i_o-trades"
            }, {
                "text": "Market exit price".i18n(),
                "id": "m_exit-price"
            }, {
                "text": "No Touch trades".i18n(),
                "id": "no-touch-trades"
            }, {
                "text": "(One) Touch trades".i18n(),
                "id": "touch-trades"
            }, {
                "text": "Payout".i18n(),
                "id": "payout"
            }, {
                "text": "Pip".i18n(),
                "id": "pip"
            }, {
                "text": "Profit".i18n(),
                "id": "profit"
            }, {
                "text": "Volatility Indices".i18n(),
                "id": "volatility-indices"
            }, {
                "text": "Resale price".i18n(),
                "id": "resale-price"
            }, {
                "text": "Return".i18n(),
                "id": "return"
            }, {
                "text": "Rise/Fall trades".i18n(),
                "id": "r_f-trades"
            }, {
                "text": "Sell option".i18n(),
                "id": "sell-option"
            }, {
                "text": "Spot price".i18n(),
                "id": "spot-price"
            }, {
                "text": "Stake".i18n(),
                "id": "stake"
            }, {
                "text": "Stays Between/Goes Outside trades".i18n(),
                "id": "stays-between-goes-outside-trades"
            }, {
                "text": "Tick".i18n(),
                "id": "tick"
            }, {
                "text": "Underlying".i18n(),
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
        state.current.content = $("<div/>").append($content.filter("#" + id))[0].innerHTML;
        $(".content").animate({ scrollTop: 0 }, 500);
        $(document).find("a[href$='#contract-period']").click(() => {
            state.openSublist("contract period");
            return false;
        })
    };

    state.search = (e) => {
        const query = $(e.target).val().toLowerCase();
        if (query.length > 0) {
            state.current.list = null;
            state.current.content_page = null;
            state.current.sublist = sublist_items.filter((item) => {
                return item.text.toLowerCase().indexOf(query) != -1;
            });
            const getContent = _.flow(searchSubsection, searchDescription);
            state.current.content = getContent(query);
            /*
            state.current.content = */
            if (state.current.content)
                $(".help-dialog .content .items").find("a").each(function(i, link) {
                    link.onclick = (e) => {
                        state.openSublist($(e.target).text());
                    };
                });
        }
    }

    state.openSublist = (sublist_name) => {
        state.current.list = null;
        state.current.sublist = sublist_items.filter((item) => {
            return item.text.toLowerCase().indexOf(sublist_name.toLowerCase()) != -1;
        });
        console.log(sublist_name, state.current.sublist);
        state.current.sublist && state.current.sublist.length && state.getContent(state.current.sublist[0].id);
    }

    //Concat all the sublist items into one array so that we can later use it for searching.
    for (let key in state.sublist) {
        sublist_items = sublist_items.concat(state.sublist[key]);
    }

    // Create an array of all the text section wise, to be used later for searching.
    var content_array = [];

    var section = document.createTreeWalker($("<div/>").append($content)[0], NodeFilter.SHOW_ELEMENT, (node) => {
        if (node.tagName == "DIV")
            return NodeFilter.FILTER_ACCEPT;
        else
            return NodeFilter.FILTER_SKIP;
    }, false);
    while (section.nextNode()) {
        var obj = {};
        obj.section = sublist_items.filter(function(item) {
            return item.id == $(section.currentNode).attr("id")
        })[0];
        const childNodes = $(section.currentNode).children();
        obj.subSection = childNodes.map(function(i, ele) {
            if (ele.nodeName === "H3" && childNodes[i + 1].nodeName === "P" && childNodes[i + 1].innerText)
                return { title: ele.innerText, description: childNodes[i + 1].innerText }
            else
                return null;
        }).get();
        obj.text = $(section.currentNode)[0].innerText;
        content_array.push(obj);

    }

    const searchSubsection = (query) => {
        // Create copy for modifying the array and passing it to the next function.
        const temp_content_array = JSON.parse(JSON.stringify(content_array));
        const content = temp_content_array.reduce(function(content, elem) {
            const subContent = elem.subSection.reduce(function(text, ele) {
                if (ele.title && ele.title.toLowerCase().indexOf(query) != -1 && ele.description.replaceAll("\n", "")) {
                    elem.text = elem.text.replace(ele.title, "").replace(ele.description, "");
                    return text + "<strong>" + ele.title + "</strong>" + "<p>" + ele.description + "</p>"
                }
                return text;
            }, '');
            if (subContent) {
                const html = "<a href='#'><h3>" + elem.section.text + "</h3></a>" + subContent;
                content = content ? content + "<hr>" + html : html;
            }
            return content;
        }, '');
        return { query: query, content: content ? content : '', array: temp_content_array};
    }

    const searchDescription = (some) => {
        const content = some.array.reduce(function(content, ele) {
            const index = ele.text.toLowerCase().indexOf(some.query);
            if (index != -1) {
                const subtext = ele.text.substr(index, 100).replaceAll("\n", "<br>");
                const html = "<a href='#'><h3>" + ele.section.text + "</h3></a>" +
                    "<p>..." + subtext + "...</p>"
                content = content ? content + "<hr>" + html : html;
            }
            return content;
        }, '');
        console.log(content);
        return '<div class="search-text">' + (some.content && content ? some.content + "<hr>" : some.content) + content +
            "</div>";
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
    elem.click(() => {
        if (!win)
            init();
        else
            win.moveToTop();
    });
};

export const showSpecificContent = (search_text) => {
    if (!win)
        init();
    else
        win.moveToTop();

    $(".help-search").val(search_text).trigger("input");
}

export default {
    init_help,
    showSpecificContent
}
