import $ from 'jquery';
import windows from 'windows/windows';
import rv from 'common/rivetsExtra';
import html from 'text!help/help.html';
import content from 'text!help/content.html'
import 'css!help/help.css';

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
            sublist: null,
            content_page: null,
            content: null,
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
            }, {
                text: "Patents".i18n(),
                id: "patents"
            }],
            getting_started: [{
                text: "Why choose Binary Trading?".i18n(),
                id: "why-binary"
            }, {
                text: "Binary options basics".i18n(),
                id: "binary-options-basics"
            }, {
                text: "Why trade with Binary.com".i18n(),
                id: "why-trade-binary"
            }, {
                text: "How to trade binary options?".i18n(),
                id: "trade-binaries"
            }, {
                text: "How to trade the Volatility Indices markets?".i18n(),
                id: "how-trade-vol"
            }, {
                text: "Smart Indices".i18n(),
                id: "smart-indices"
            }, {
                text: "OTC indices and stocks".i18n(),
                id: "otc-stocks-indices"
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
                text: "Lookbacks".i18n(),
                id: "lookback"
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
                text: "Client funds".i18n(),
                id: "client-funds"
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
        $(".content").animate({ scrollTop: 0 }, 0);
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
            /*Extract search text from content*/
            const content = getContent(query);

            // Formatting content to show in a particular format;
            state.current.content = '<div class="search-text">' + content.reduce(function(prev, curr) {
                let formatted = "<a href=\"#" + curr.title_s + "\"><h3>" + curr.title + "</h3></a>" +
                    "<strong>" + (curr.title_s_copy ? curr.title_s_copy : '') + "</strong>" +
                    "<br/><br/>" + curr.description;
                prev = prev ? prev + "<hr>" + formatted : formatted;
                return prev
            }, '') + '</div>';

            if (state.current.content)
                $(".help-dialog .content .items").find("a").each(function(i, link) {
                    link.onclick = (e) => {
                        state.openSublist($(e.target).text(), $(e.target).parent().attr("href"));
                        return false;
                    };
                });
        } else {
            $('.highlight').removeClass('highlight');
        }
    }

    state.openSublist = (sublist_name, subsection) => {
        state.current.list = null;
        state.current.sublist = sublist_items.filter((item) => {
            return item.text.toLowerCase().indexOf(sublist_name.toLowerCase()) != -1;
        });
        if (sublist_name.toLowerCase().indexOf("The premier platform".toLowerCase()) != -1) {
            state.current.sublist = [sublist_items[0]]; //About us page
        }
        state.current.sublist && state.current.sublist.length && state.getContent(state.current.sublist[0].id);
        if (subsection && subsection.length > 1) {
            subsection = subsection.toLowerCase().replace(/[\s\(\)\.]/g, "");
            const offset = $(".content " + subsection).offset().top - 50;
            $(".content").animate({ scrollTop: offset }, 500);
        }
    }

    //Concat all the sublist items into one array so that we can later use it for searching.
    for (let key in state.sublist) {
        sublist_items = sublist_items.concat(state.sublist[key]);
    }

    const getContent = (q) => {
        const walker = document.createTreeWalker($("<div/>").append($content)[0], NodeFilter.SHOW_ELEMENT);
        let subSectionArray = [];
        let descriptionArray = [];
        let title = '',
            title_s = '',
            prev_text = '';
        while (1) {
            let description = '';
            if (walker.currentNode.nodeName == "DIV" && walker.currentNode.id) {
                title = "";
                title_s = "";
                description = "";
            } else if (walker.currentNode.nodeName == "H2") {
                title = walker.currentNode.innerText;
                title_s = "";
            } else if (walker.currentNode.nodeName == "H3") {
                title_s = walker.currentNode.innerText;
                if (title_s.toLowerCase().indexOf(q) !== -1) {
                    const matchingText = title_s.substr(title_s.toLowerCase().indexOf(q), q.length);
                    const title_s_copy = title_s.replace(matchingText, "<span class='highlight'>" + matchingText + "</span>");
                    while (walker.nextNode()) {
                        if (walker.currentNode.nodeName == "DIV" || walker.currentNode.nodeName == "H3")
                            break;
                        if (walker.currentNode.nodeName === "UL") {
                            description = description + "<ul>" + walker.currentNode.innerHTML + "</ul>";
                            continue;
                        }
                        if (walker.currentNode.nodeName === "LI" || walker.currentNode.nodeName === "STRONG")
                            continue;
                        description = description + walker.currentNode.innerHTML;
                    }

                    subSectionArray.push({
                        title: title,
                        title_s: title_s,
                        title_s_copy: title_s_copy,
                        description: description
                    });
                    continue;
                }
            } else if (walker.currentNode.nodeName !== "DIV" && walker.currentNode.nodeName !== "H2" &&
                walker.currentNode.nodeName !== "H3" && walker.currentNode.innerText.toLowerCase().indexOf(q) !== -1 &&
                walker.currentNode.nodeName !== "LI" && walker.currentNode.nodeName !== "STRONG" &&
                walker.currentNode.nodeName !== "H4") {
                let index = walker.currentNode.innerText.toLowerCase().indexOf(q);

                if (walker.currentNode.nodeName === "UL" && index !== -1) {
                    index = walker.currentNode.innerHTML.toLowerCase().indexOf(q);
                    const matchingText = walker.currentNode.innerHTML.substr(index, q.length);
                    description = "<ul>" + walker.currentNode.innerHTML.replace(matchingText, "<span class='highlight'>" + matchingText + "</span>") + "</ul>";
                } else {
                    const matchingText = walker.currentNode.innerText.substr(index, q.length);
                    description = walker.currentNode.innerText.replace(matchingText, "<span class='highlight'>" + matchingText + "</span>");
                }

                descriptionArray.push({
                    title: title,
                    title_s: title_s,
                    title_s_copy: title_s,
                    description: description
                });
            } else {
                prev_text = walker.currentNode.innerText;
            }

            if (!walker.nextNode())
                break;
        }
        return subSectionArray.concat(descriptionArray);
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
    $($(".sublist .items").children()[0]).click();
}

export default {
    init_help,
    showSpecificContent
}
