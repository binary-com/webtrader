chrome.browserAction.onClicked.addListener(function(activeTab){
  var newURL = "https://webtrader.binary.com/";
  chrome.tabs.create({ url: newURL });
});