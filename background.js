const MENU_ID = 'linguaswitch-translate';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'LinguaSwitch: Translate "%s"',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  // Popup reads and clears this on open, then auto-translates.
  await chrome.storage.session.set({ pendingSelection: info.selectionText });

  try {
    await chrome.action.openPopup(tab ? { windowId: tab.windowId } : {});
  } catch (error) {
    // openPopup unavailable (Chrome < 127) or refused: prompt user to click the icon.
    console.warn('openPopup failed, falling back to badge:', error);
    chrome.action.setBadgeText({ text: '1' });
  }
});
