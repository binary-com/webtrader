chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tab.url.indexOf('webtrader.binary.com') != -1 && changeInfo.status === 'complete') {
        chrome.tabs.executeScript({
            //Inject DOM node to indicate if the extension is installed
            code : "var isInstalledNode = document.createElement('div');isInstalledNode.id = 'webtrader-extension-is-installed';document.body.appendChild(isInstalledNode);"
        });
    }
});

//This is for the extension. It will open a new tab with our webtrader URL
chrome.browserAction.onClicked.addListener(function(activeTab){
  var newURL = "https://webtrader.binary.com/";
  chrome.tabs.create({ url: newURL });
});
