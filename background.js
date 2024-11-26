let lockActive = false; // Flag to track if the lock is active
let lockedUrl = ""; // The URL that is locked
let lockEndTime = 0; // The time when the lock will expire

function isLockActive() {
  return lockActive && Date.now() < lockEndTime;
}

function blockWebRequests(details) {
  if (!isLockActive()) {
    return { cancel: false };
  }

  if (details.url.startsWith(lockedUrl)) {
    return { cancel: false };
  }

  // Block any other URL requests
  return { cancel: true };
}

function startLock(lockData) {
  const { lockedUrl: url, startTime, duration } = lockData;

  lockActive = true;
  lockedUrl = url;
  lockEndTime = startTime + duration * 60 * 1000;

  // Remove  existing listeners to avoid duplicates
  chrome.webRequest.onBeforeRequest.removeListener(blockWebRequests);

  // Add a new listener to block any request except those for the locked URL
  chrome.webRequest.onBeforeRequest.addListener(
    blockWebRequests,
    { urls: ["<all_urls>"] },
    ["blocking"]
  );

  // add a timer to remove the lock after the duration has passed
  setTimeout(() => {
    lockActive = false;
    lockedUrl = "";
    chrome.webRequest.onBeforeRequest.removeListener(blockWebRequests); // Remove the blocking listener
  }, lockEndTime - Date.now());

  // Close all existing tabs that don't match the locked URL
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (!tab.url.startsWith(lockedUrl)) {
        chrome.tabs.remove(tab.id); // Close tabs that are not the locked URL
      }
    });
  });

  // Prevent the user from opening new tabs or windows that aren't the locked URL
  chrome.tabs.onCreated.addListener(function blockNewTabs(tab) {
    if (isLockActive() && !tab.url.startsWith(lockedUrl)) {
      chrome.tabs.update(tab.id, { url: lockedUrl }); // Redirect new tabs to the locked URL
    }
  });
}

// Listen for messages from the popup to start the lock
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_LOCK") {
    startLock(message.lockData); // Start the lock with the data sent from the popup
  }
});

// Check if there's already a lock in place when the extension starts
chrome.storage.local.get(["lockedUrl", "startTime", "duration"], (data) => {
  if (data.lockedUrl && data.startTime && data.duration) {
    startLock({
      lockedUrl: data.lockedUrl,
      startTime: data.startTime,
      duration: data.duration,
    }); // Start the lock with saved data if it exists
  }
});
