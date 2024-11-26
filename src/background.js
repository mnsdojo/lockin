const list = ["lockedUrl", "startTime", "duration"];

function startLock(lockData) {
  const { lockedUrl, startTime, duration } = lockData;
  const lockEndTime = startTime + duration * 60 * 1000;

  const remainingTime = lockEndTime - Date.now();

  if (remainingTime > 0) {
    // Remove the lock from storage once the lock expires
    setTimeout(() => {
      chrome.storage.local.remove(list);
    }, remainingTime);
  }

  const redirectListener = (tabId, changeInfo) => {
    if (changeInfo.url && changeInfo.url !== lockedUrl) {
      // Redirect the tab back to the locked URL if the user tries to leave it
      chrome.tabs.update(tabId, { url: lockedUrl });
    }
  };

  // Add the redirection listener
  chrome.tabs.onUpdated.addListener(redirectListener);

  // Clean up the listener when the lock expires
  setTimeout(() => {
    chrome.tabs.onUpdated.removeListener(redirectListener);
  }, remainingTime);
}

// Check for the current lock status from storage
chrome.storage.local.get(list, (data) => {
  if (data.lockedUrl && data.startTime && data.duration) {
    startLock(data);
  }
});
