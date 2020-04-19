chrome.browserAction.onClicked.addListener(activeTab => {
  const crmUrl = "https://kentico.crm4.dynamics.com/WebResources/ken_SimpleCRM/";
  chrome.tabs.create({ url: crmUrl });
});
