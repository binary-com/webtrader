var SUPPORTED_LANGUAGES = [
    { value: 'en', name: 'English'},
    { value: 'de', name: 'Deutsch'},
    { value: 'es', name: 'Español'},
    { value: 'fr', name: 'Français'},
    { value: 'id', name: 'Indonesia'},
    { value: 'it', name: 'Italiano'},
    { value: 'pl', name: 'Polish'},
    { value: 'pt', name: 'Português'},
    { value: 'ru', name: 'Русский'},
    { value: 'th', name: 'Thai'},
    { value: 'vi', name: 'Tiếng Việt'},
    { value: 'zh_cn', name: '简体中文'},
    { value: 'zh_tw', name: '繁體中文'}
];
/* oauth login ? */
var href = window.location.href;
//Remove the '#' check later once the backend changes are released TODO
var params_str = href.indexOf('#') != -1 ? href.split('#')[1] : href.split('?')[1];
if (/acct1=/.test(href) && /token1=/.test(href)) {
    var accts = (params_str.match(/acct\d=[\w\d]+/g) || []).map(function (val) { return val.split('=')[1] });
    var tokens = (params_str.match(/token\d=[\w\d-]+/g) || []).map(function (val) { return val.split('=')[1] });
    var currs = (params_str.match(/cur\d=[\w\d]+/g) || []).map(function (val) { return val.split('=')[1] });
    var oauth = [];
    for (var i = 0; i < accts.length; i++) {
        var id = accts[i];
        var token = tokens[i];
        var curr = currs[i];
        oauth.push({ id: id, token: token, currency: curr });
    }
    local_storage.set('oauth', oauth);
    local_storage.set('oauth-login', { value: true }); /* used to fire oauth-login event in binary_websockets.js */
}

var window_url = new URL(window.location.href);
window_url.search = '';
window.history.pushState({ path: window_url.href }, '', window_url.href);

var lang = (params_str && params_str.match(/lang=[a-zA-Z]+/g) || []).map(function (val) { return val.split('=')[1] })[0] ||
    (local_storage.get('i18n') && local_storage.get('i18n').value) || 'en';
if (isLangSupported(lang)) {
    local_storage.set('i18n', { value: lang });
    if (lang === 'id') {
        $('#footer').hide();
    }
} else { // In case of invalid language fallback to EN
    local_storage.set('i18n', { value: 'en' });
}

populate_language_dropdown(SUPPORTED_LANGUAGES);

var contact_us_el = document.getElementById('contact-us');
contact_us_el.href = 'https://www.binary.com/' + lang + '/contact.html';

if (local_storage.get("oauth") !== null) {
    window.location.href = VERSION + '/main.html';
} else {
    $(function () {
        $('body').css('display', 'block');
        setTime();
        setInterval(setTime, 1000);

        if (isLangSupported(lang)) {
            $.getJSON(VERSION + 'i18n/' + lang + '.json', function (data) {
                setup_i18n_translation(data);
                populate_footer();
            });
            console.log(lang);
            // Show hidden languages
            $('#select_language').find('.invisible').removeClass('invisible');
            var selected_lang = $('#select_language').find('.' + lang);
            var curr_ele = $('#select_language .current .language');
            var disp_lang = $("#display_language .language");
            disp_lang.text(selected_lang.text());
            curr_ele.text(selected_lang.text());
            selected_lang.addClass('invisible');
        }

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

    });
}

function setTime() {
    var time = moment.utc().format('YYYY-MM-DD HH:mm:ss') + ' GMT'
    $(".time").text(time);
}

function openTradingPage() {
    window.location.href = VERSION + 'main.html';
}

function populate_language_dropdown(language_arr) {
    var ul_el = document.getElementById('select_language');
    language_arr.map(function(language) {
        var li = document.createElement('li');
        li.className = language.value;
        if (li.value === 'en') li.className = 'invisible';
        li.innerHTML = '<a href="/" data-lang=' + language.value + '>' + language.name + '</a>';
        ul_el.appendChild(li);
    });
}

function populate_footer() {
    var FOOTER_TEXT = {
        P1: {
            TEXT: 'In the EU, financial products are offered by Binary Investments (Europe) Ltd., Mompalao Building, Suite 2, Tower Road, Msida MSD1825, Malta, licensed and regulated as a Category 3 Investment Services provider by the Malta Financial Services Authority (licence no. IS/70156).'.i18n(),
            get_html: function() {
                return FOOTER_TEXT.P1.TEXT;
            },
        },
        P2: {
            TEXT: 'In the Isle of Man and the UK, Volatility Indices are offered by Binary (IOM) Ltd., First Floor, Millennium House, Victoria Road, Douglas, IM2 4RW, Isle of Man, British Isles; licensed and regulated respectively by (1) the Gambling Supervision Commission in the Isle of Man (current licence issued on 31 August 2017) and by (2) the Gambling Commission in the UK (licence [_1]reference no: 39172[_2]).'.i18n(),
            TAGS: ['<a href="https://secure.gamblingcommission.gov.uk/PublicRegister/Search/Detail/39172" target="_blank" rel="noopener noreferrer">', '</a>'],
            get_html: function() {
                return add_tags(FOOTER_TEXT.P2.TEXT, FOOTER_TEXT.P2.TAGS);
            },
        },
        P3: {
            TEXT: 'In the rest of the EU, Volatility Indices are offered by Binary (Europe) Ltd., Mompalao Building, Suite 2, Tower Road, Msida MSD1825, Malta; licensed and regulated by (1) the Malta Gaming Authority in Malta (licence no. MGA/B2C/102/2000 issued on 26 May 2015), for UK clients by (2) the UK Gambling Commission (licence [_1]reference no: 39495[_2]), and for Irish clients by (3) the Revenue Commissioners in Ireland (Remote Bookmaker\'s Licence no. 1010285 issued on 1 July 2017). View complete [_3]Regulatory Information[_4].)'.i18n(),
            TAGS: ['<a href="https://secure.gamblingcommission.gov.uk/PublicRegister/Search/Detail/39495" target="_blank" rel="noopener noreferrer">', '</a>', '<a href="https://www.binary.com/en/regulation.html">', '</a>'],
            get_html: function() {
                return add_tags(FOOTER_TEXT.P3.TEXT, FOOTER_TEXT.P3.TAGS);
            }
        },
        P4: {
            TEXT: 'Binary.com is an award-winning online trading provider that helps its clients to trade on financial markets through binary options and CFDs. Trading binary options and CFDs on Volatility Indices is classified as a gambling activity. Remember that gambling can be addictive - please play responsibly. Learn more about [_1]Responsible Trading[_2]. Some products are not available in all countries. This website\'s services are not made available in certain countries such as the USA, Canada, Costa Rica, Hong Kong, or to persons under age 18.'.i18n(),
            TAGS: ['<a href="https://www.binary.com/en/responsible-trading.html" target="_blank">', '</a>'],
            get_html: function() {
                return add_tags(FOOTER_TEXT.P4.TEXT, FOOTER_TEXT.P4.TAGS);
            }
        },
        P5: {
            TEXT: 'Trading binary options may not be suitable for everyone, so please ensure that you fully understand the risks involved. Your losses can exceed your initial deposit and you do not own or have any interest in the underlying asset.'.i18n(),
            get_html: function() {
                return FOOTER_TEXT.P5.TEXT;
            },
        },
    };

    for (var key in FOOTER_TEXT) {
        var p_content = FOOTER_TEXT[key].get_html();
        $('#' + key.toLowerCase()).html(p_content);
    }

    function add_tags(text, args) {
        if (!text || !Array.isArray(args) || args.length < 0) return;

        for (i = 0; i < args.length; i++) {
            text = text.replace('[_' + (i + 1) +']', args[i]);
        }
        return text;
    }
}

//For crowdin in-context translation.
if ((local_storage.get("i18n") || {}).value === 'ach') {
    var _jipt = [];
    _jipt.push(['project', 'webtrader']);
    var crowdin = document.createElement("script");
    crowdin.setAttribute('src', '//cdn.crowdin.com/jipt/jipt.js');
    document.head.appendChild(crowdin);
}