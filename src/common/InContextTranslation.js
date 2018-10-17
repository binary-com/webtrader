var _jipt = [];
if ((local_storage.get("i18n") || {}).value === 'ach') {
    localStorage.setItem('jipt_language_code_webtrader', 'en');
    _jipt.push(['project', 'webtrader']);
    var crowdin = document.createElement("script");
    crowdin.setAttribute('src', '//cdn.crowdin.com/jipt/jipt.js');
    document.head.appendChild(crowdin);
} 