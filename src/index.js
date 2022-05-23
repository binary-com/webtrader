var contact_us_el = document.getElementById('contact-us');
var logo_el = document.getElementById('logo');
var footer_eu_el = document.getElementById('footer-eu');
var footer_non_eu_el = document.getElementById('footer-non-eu');

var href = window.location.href;
var default_app_id = 11;

// Remove the '#' check later once the backend changes are released TODO
var params_str = href.indexOf('#') != -1 ? href.split('#')[1] : href.split('?')[1];
var lang = (params_str && params_str.match(/lang=[a-zA-Z]+/g) || []).map(function (val) { return val.split('=')[1] })[0] ||
    (local_storage.get('i18n') && local_storage.get('i18n').value) || 'en';

contact_us_el.href = getBinaryUrl('contact.html');
logo_el.href = getBinaryUrl('home.html');

checkRedirectToken(params_str);

setLanguage(lang);
clearUrlQuerystring(href);

checkWindowSize();

processPageLanguage();

function loadAppId(callback) {
    $.getJSON(VERSION + 'oauth/app_id.json').then(function (app_id_json) {
        callback(false, app_id_json);
    }).catch(function (err) {
        callback(err);
    });
}

function getUrl() {
    var server_url = localStorage.getItem('config.server_url') || 'frontend.binaryws.com';
    return 'wss://' + server_url + '/websockets/v3';
}

function processRedirect(selected_language_name) {
    loadAppId(function(err, app_id_json) {
        var client_country;
        var account_list;
        var app_id = err ? default_app_id : getAppId(app_id_json);
        var api_url = getUrl() + '?l=' + selected_language_name + '&app_id=' + app_id;
        var ws = new WebSocket(api_url);
        ws.onopen = sendWebsiteStatus;
        ws.onmessage = processApiResponse;

        function getAppId(app_id_json) {
            var stored_app_id = '';

            for(var url in app_id_json) {
                if(href.lastIndexOf(url, 0) === 0) {
                    stored_app_id = app_id_json[url];
                }
            }

            return stored_app_id || default_app_id;
        }
        getUrl();

        function sendApiRequest(request) {
            ws.send(JSON.stringify(request));
        }

        function sendWebsiteStatus(evt) {
            sendApiRequest({ website_status: 1 });
        }

        function sendAuthorize(token) {
            sendApiRequest({ authorize: token });
        }
        
        function processApiResponse(response) {
            var data = JSON.parse(response.data);

            if(data.website_status){
                client_country = data.website_status.clients_country;
                if (local_storage.get('oauth')) {
                    var token = local_storage.get('oauth')[0].token;
                    sendAuthorize(token);
                } else {
                    if(isEuCountrySelected(client_country)) {
                        window.location.href = moveToDerivUrl();
                    } else {
                        document.getElementById('loading_container').style.display="none"
                        document.getElementById('main_container').style.display="block"
                        $(function () {
                            $('body').css('display', 'block');
                            setTime();
                            setInterval(setTime, 1000);
                    
                            var selected_language_name = (window.local_storage.get('i18n') || { value: 'en' }).value;
                            $.getJSON(VERSION + 'i18n/' + selected_language_name + '.json', function (data) {
                                setupi18nTranslation(data);
                                processFooter(selected_language_name);
                            });
                    
                            onChangeSelectLanguage(selected_language_name);
                        });
                    }
                }
            } else if (data.authorize){
                var residence_country = data.authorize.country;
                account_list = data.authorize.account_list;
                var has_mf_mx_mlt = false;
                for (var account in account_list){
                    if (account.landing_company_name === 'maltainvest' 
                        || account.landing_company_name === 'malta' 
                        || account.landing_company_name === 'iom')
                    {
                        has_mf_mx_mlt = true;
                        return;
                    }
                }
                if (has_mf_mx_mlt || ((isEuCountrySelected(client_country) || isEuCountrySelected(residence_country)) && account_list.length == 1)){
                    window.location.href = moveToDerivUrl();
                } else {
                    window.location.href = VERSION + 'main.html';                    
                }

            }
        }
    })
}
function processPageLanguage() {
    var selected_language_name = (window.local_storage.get('i18n') || { value: 'en' }).value;

    populateLanguageDropdown();
    processRedirect(selected_language_name);

    function populateLanguageDropdown() {
        var language_arr = getSupportedLanguages();
        var ul_el = document.getElementById('select_language');
    
        language_arr.map(function(language) {
            var li = document.createElement('li');
            li.className = language.value;
            if (li.value === 'en') li.className = 'invisible';
            li.innerHTML = '<a href="/" data-lang=' + language.value + '>' + language.name + '</a>';
            ul_el.appendChild(li);
        });
    }
}

function onChangeSelectLanguage(selected_language_name) {
    $('#select_language').find('.invisible').removeClass('invisible');
    var selected_lang = $('#select_language').find('.' + selected_language_name);
    var curr_ele = $('#select_language .current .language');
    var disp_lang = $("#display_language .language");
    disp_lang.text(selected_lang.text());
    curr_ele.text(selected_lang.text());
    selected_lang.addClass('invisible');

    $('.languages #select_language li').each(function (i, el) {
        $(el).click(function () {
            var lang = $(el).find('a').data('lang');
            if (lang) {
                local_storage.set('i18n', { value: lang });
                window.location.reload();
            }
            return false;
        });
    });
}

function checkRedirectToken(params_str) {
    if (/acct1=/.test(href) && /token1=/.test(href)) {
        var accts = matchRegex(/acct\d=[\w\d]+/g);
        var tokens = matchRegex(/token\d=[\w\d-]+/g);
        var currs = matchRegex(/cur\d=[\w\d]+/g);
        var oauth = [];

        for (var i = 0; i < accts.length; i++) {
            var id = accts[i];
            var token = tokens[i];
            var curr = currs[i];
            oauth.push({ id: id, token: token, currency: curr });
        }
        local_storage.set('oauth', oauth);
        local_storage.set('oauth-login', { value: true }); /* used to fire oauth-login event in binary_websockets.js */

        function matchRegex(regex) {
            return (params_str.match(regex) || []).map(function (val) { return val.split('=')[1] })
        }
    }
}

function checkWindowSize() {
    if (isSmallView()) {
        window.location.assign(VERSION + 'unsupported_browsers/unsupported_browsers.html');
        return;
    }
}

function setTime() {
    var time = moment.utc().format('YYYY-MM-DD HH:mm:ss') + ' GMT';
    $(".time").text(time);
}

function openTradingPage() {
    window.location.href = VERSION + 'main.html';
}

function processFooter(selected_language_name) {
    loadAppId(function(err, app_id_json) {
        var clients_country;
        var app_id = err ? default_app_id : getAppId(app_id_json);
        var api_url = getUrl() + '?l=' + selected_language_name + '&app_id=' + app_id;
        var ws = new WebSocket(api_url);
        ws.onopen = sendWebsiteStatus;
        ws.onmessage = processApiResponse;

        function getAppId(app_id_json) {
            var stored_app_id = '';

            for(var url in app_id_json) {
                if(href.lastIndexOf(url, 0) === 0) {
                    stored_app_id = app_id_json[url];
                }
            }

            return stored_app_id || default_app_id;
        }

        getUrl();

        function sendApiRequest(request) {
            ws.send(JSON.stringify(request));
        }

        function sendWebsiteStatus(evt) {
            sendApiRequest({ website_status: 1 });
        }

        function sendLandingCompany(clients_country) {
            sendApiRequest({ landing_company: clients_country });
        }

        function processApiResponse(response) {
            var data = JSON.parse(response.data);

            if (data.error) return;

            if (data.website_status) {
                clients_country = data.website_status.clients_country;
                sendLandingCompany(clients_country);
            } else if (data.landing_company) {
                populateFooter(data);
            }

            function populateFooter(data) {
                var binary_responsible_trading_url = getBinaryUrl('responsible-trading.html');
                var binary_regulation_url = getBinaryUrl('regulation.html');
    
                var FOOTER_TEXT_NON_EU = {
                    P1: {
                        TEXT: 'In the EU, financial products are offered by Binary Investments (Europe) Ltd., W Business Centre, Level 3, Triq Dun Karm, Birkirkara, BKR 9033, Malta, regulated as a Category 3 Investment Services provider by the Malta Financial Services Authority ([_1]licence no. IS/70156[_2]).'.i18n(),
                        TAGS: ['<a href="https://eu.deriv.com/regulatory/Deriv_Investments_(Europe)_Limited.pdf" target="_blank" rel="noopener noreferrer">', '</a>'],
                    },
                    P2: {
                        TEXT: 'Outside the EU, financial products are offered by Binary (SVG) Ltd, Hinds Building, Kingstown, St. Vincent and the Grenadines; Binary (V) Ltd, Govant Building, Port Vila, PO Box 1276, Vanuatu, regulated by the Vanuatu Financial Services Commission ([_1]view licence[_2]); Binary (BVI) Ltd, Kingston Chambers, P.O. Box 173, Road Town, Tortola, British Virgin Islands, regulated by the British Virgin Islands Financial Services Commission ([_3]licence no. SIBA/L/18/1114[_4]); and Binary (FX) Ltd., Lot No. F16, First Floor, Paragon Labuan, Jalan Tun Mustapha, 87000 Labuan, Malaysia, regulated by the Labuan Financial Services Authority to carry on a money-broking business ([_5]licence no. MB/18/0024[_6]).'.i18n(),
                        TAGS: ['<a href="https://www.binary.com/download/regulation/Vanuatu-license.pdf" target="_blank" rel="noopener noreferrer">', '</a>', '<a href="https://www.binary.com/download/regulation/BVI_license.pdf" target="_blank" rel="noopener noreferrer">', '</a>', '<a href="https://www.binary.com/download/regulation/Labuan-license.pdf" target="_blank">', '</a>'],
                    },
                    P3: {
                        TEXT: 'This website\'s services are not made available in certain countries such as the USA, Canada, Hong Kong, Japan, or to persons under age 18.'.i18n()
                    },
                    P4: {
                        TEXT: 'The products offered via this website include binary options, contracts for difference ("CFDs") and other complex derivatives. Trading binary options may not be suitable for everyone. Trading CFDs carries a high level of risk since leverage can work both to your advantage and disadvantage. As a result, the products offered on this website may not be suitable for all investors because of the risk of losing all of your invested capital. You should never invest money that you cannot afford to lose, and never trade with borrowed money. Before trading in the complex products offered, please be sure to understand the risks involved and learn about [_1]Responsible Trading[_2].'.i18n(),
                        TAGS: ['<a href=' + binary_responsible_trading_url + ' target="_blank">', '</a>'],
                    }
                };
                var FOOTER_TEXT_EU = {
                    P1: {
                        TEXT: 'In the EU, financial products are offered by Binary Investments (Europe) Ltd., W Business Centre, Level 3, Triq Dun Karm, Birkirkara, BKR 9033, Malta, licensed and regulated as a Category 3 Investment Services provider by the Malta Financial Services Authority ([_1]licence no. IS/70156[_2]).'.i18n(),
                        TAGS: ['<a href="https://eu.deriv.com/regulatory/Deriv_Investments_(Europe)_Limited.pdf" target="_blank" rel="noopener noreferrer">', '</a>'],
                    },
                    P2: {
                        TEXT: 'In the Isle of Man and the UK, Synthetic Indices are offered by Binary (IOM) Ltd., First Floor, Millennium House, Victoria Road, Douglas, IM2 4RW, Isle of Man, British Isles; licensed and regulated respectively by (1) the Gambling Supervision Commission in the Isle of Man (current licence issued on 31 August 2017) and by (2) the Gambling Commission in the UK (licence [_1]reference no: 39172[_2]).'.i18n(),
                        TAGS: ['<a href="https://secure.gamblingcommission.gov.uk/PublicRegister/Search/Detail/39172" target="_blank" rel="noopener noreferrer">', '</a>'],
                    },
                    P3: {
                        TEXT: 'In the rest of the EU, Synthetic Indices are offered by Binary (Europe) Ltd., W Business Centre, Level 3, Triq Dun Karm, Birkirkara, BKR 9033, Malta; licensed and regulated by (1) the Malta Gaming Authority in Malta (licence no. MGA/B2C/102/2000 issued on 01 August 2018), for UK clients by (2) the UK Gambling Commission (licence [_1]reference no: 39495[_2]), and for Irish clients by (3) the Revenue Commissioners in Ireland (Remote Bookmaker\'s Licence no. 1010285 issued on 1 July 2017). View complete [_3]Regulatory Information[_4].'.i18n(),
                        TAGS: ['<a href="https://secure.gamblingcommission.gov.uk/PublicRegister/Search/Detail/39495" target="_blank" rel="noopener noreferrer">', '</a>', '<a href=' + binary_regulation_url + ' target="_blank">', '</a>'],
                    },
                    P4: {
                        TEXT: 'Binary.com is an award-winning online trading provider that helps its clients to trade on financial markets through binary options and CFDs. Trading binary options and CFDs on Synthetic Indices is classified as a gambling activity. Remember that gambling can be addictive - please play responsibly. Learn more about [_1]Responsible Trading[_2]. Some products are not available in all countries. This website\'s services are not made available in certain countries such as the USA, Canada, Hong Kong, or to persons under age 18.'.i18n(),
                        TAGS: ['<a href=' + binary_responsible_trading_url + ' target="_blank">', '</a>'],
                    },
                    P5: {
                        TEXT: 'Trading binary options may not be suitable for everyone, so please ensure that you fully understand the risks involved. Your losses can exceed your initial deposit and you do not own or have any interest in the underlying asset.'.i18n(),
                    },
                    P6: {
                        TEXT: 'CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. Between 74-89% of retail investor accounts lose money when trading CFDs. You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money.'.i18n(),
                    }
                };
    
                var isEu = isEuCountry(data.landing_company);
                var FOOTER_TEXT = isEu ? FOOTER_TEXT_EU : FOOTER_TEXT_NON_EU;
    
                showBanner(isEu);
                isEu ? footer_eu_el.classList.add('data-show') : footer_non_eu_el.classList.add('data-show');
    
                for (var key in FOOTER_TEXT) {
                    var text = FOOTER_TEXT[key].TEXT;
                    var tags = FOOTER_TEXT[key].TAGS;
                    var p_content = addTags(text, tags);
                    $('.' + key.toLowerCase()).html(p_content);
                }
    
                ws.close();
    
                function addTags(text, tags) {
                    if (!Array.isArray(tags) || tags.length < 0) return text;
    
                    for (i = 0; i < tags.length; i++) {
                        text = text.replace('[_' + (i + 1) + ']', tags[i]);
                    }
    
                    return text;
                }
    
                function isEuCountry(landing_company) {
                    var eu_shortcode_regex = new RegExp('^(maltainvest|malta|iom)$');
                    var eu_excluded_regex = new RegExp('^mt$');
                    var financial_shortcode = landing_company.financial_company ? landing_company.financial_company.shortcode : false;
                    var gaming_shortcode = landing_company.gaming_company ? landing_company.gaming_company.shortcode : false;
    
                    return financial_shortcode || gaming_shortcode
                        ? eu_shortcode_regex.test(financial_shortcode) || eu_shortcode_regex.test(gaming_shortcode)
                        : eu_excluded_regex.test(clients_country);
                }
            }
        }
    })
}

function showBanner(isEu){
    var go_to_deriv_el = document.getElementById("close_banner_btn_iom");
    go_to_deriv_el.href = getDerivUrl("");
    if (isEu) {
        document.getElementById('close_banner_container').classList.remove('invisible')
    } else {
        document.getElementById('close_banner_container').classList.add('invisible')
    }
}
