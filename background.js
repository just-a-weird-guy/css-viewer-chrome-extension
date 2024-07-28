/* global chrome */
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, {"action": "toggleCssViewer"}, function(response) {
        if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
            if (chrome.runtime.lastError.message === "Could not establish connection. Receiving end does not exist.") {
                console.log("Content script may not be injected. Attempting to inject now.");
                chrome.scripting.executeScript({
                    target: {tabId: tab.id},
                    files: ['content_script.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Failed to inject content script:", chrome.runtime.lastError.message);
                    } else {
                        console.log("Content script injected successfully. Retrying message send.");
                        chrome.tabs.sendMessage(tab.id, {"action": "toggleCssViewer"});
                    }
                });
            }
        } else {
            console.log("Message sent successfully");
        }
    });
});

chrome.runtime.onInstalled.addListener(() => {
    console.log('CSS Viewer Extension installed');
});