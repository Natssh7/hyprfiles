class SidePanelStore {
  constructor() {
    this._sidePanels = new Map();
    this._unconnectedTabIdQueue = [];
  }

  init() {
    return {
      windowId: -1,
      tabId: -1,
      url: '',
      html: '',
      title: '',
      transcript: [],
      imageUrl: '',
      query: null,
      sourceType: 'web',
      isConnected: false,
      pdfSavedPageId: -1,
      pdfGroundSourceUrl: '',
      pdfGroundSourceId: -1,
      openType: '',
      port: null,
    };
  }

  createSidePanel(tabId, data) {
    if (tabId === undefined || tabId < 0) {
      return null;
    }

    this._unconnectedTabIdQueue.push(tabId);
    return {
      ...this.init(),
      ...data,
    };
  }

  update(tabId, data) {
    if (tabId === undefined || tabId < 0) {
      return;
    }

    if (this._sidePanels.has(tabId)) {
      const sidePanel = this._sidePanels.get(tabId);
      this._sidePanels.set(tabId, { ...sidePanel, ...data });
    } else {
      this._sidePanels.set(tabId, this.createSidePanel(tabId, data));
    }
  }

  connect(tabId, port) {
    this._unconnectedTabIdQueue = this._unconnectedTabIdQueue.filter((id) => id !== tabId);
    this.update(tabId, { isConnected: true, port });
  }

  disconnect(tabId) {
    this._sidePanels.delete(tabId);
  }

  checkIsOpened(tabId) {
    return this._sidePanels.get(tabId)?.isConnected ?? false;
  }

  getPort(tabId) {
    return this._sidePanels.get(tabId)?.port;
  }

  getSidePanel(tabId) {
    if (tabId < 0 || tabId === undefined) {
      return null;
    }
    return this._sidePanels.get(tabId);
  }

  getAllSidePanels() {
    return this._sidePanels;
  }

  getUnconnectedTabId() {
    return this._unconnectedTabIdQueue[0];
  }
}

const sidePanelStore = new SidePanelStore();

const handleMessageSidePanel = (message, port) => {
  const { name, data } = message;
  if (name === 'AMPLITUDE_EVENT') {
    const { event_name: eventName, properties } = data;
    sendAmplitudeData(eventName, properties);
  } else if (name === 'CLICK_VIDEO_TIMESTAMP') {
    const { videoSeconds } = data;
    handleClickVideoTimestamp(videoSeconds);
  }
};

const handleDisconnectSidePanel = async (port) => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab) {
    try {
      const sidePanel = sidePanelStore.getSidePanel(tab.id);
      sendAmplitudeData('close_liner_ai_co_pilot', {
        content_type: sidePanel.sourceType,
        url: sidePanel.url,
        url_domain: new URL(sidePanel.url).hostname,
      });
    } catch {}
    sidePanelStore.disconnect(tab.id);
    const tabs = await chrome.tabs.query({ windowId: tab.windowId });
    [...tabs].forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, {
        name: 'UPDATE_IS_SIDE_PANEL_FORM_AVAILABLE',
        message: { isFormAvailable: true },
      });
      chrome.tabs.sendMessage(tab.id, {
        name: 'POST_DISCONNECT_SIDE_PANEL',
        message: {},
      });
    });
  }
};

const updateInitialPDFContext = async (windowId, tabId) => {
  const res = await chrome.tabs.sendMessage(tabId, {
    name: 'GET_CURRENT_TAB_CONTEXT',
  });
  sidePanelStore.update(tabId, {
    windowId,
    url: decodeURIComponent(getURLWithoutHash(res.tabUrl) ?? ''),
    html: null,
    imageUrl: res.tabImageUrl,
    title: res.tabTitle,
    pdfSavedPageId: res.saveId,
    pdfGroundSourceUrl: res.pdfGroundSourceUrl,
    pdfGroundSourceId: res.pdfGroundSourceId,
  });
};

const handleCommandContext = async (windowId, tabId) => {
  const res = await chrome.tabs.sendMessage(tabId, {
    name: 'GET_CURRENT_TAB_CONTEXT',
  });
  const {
    tabUrl,
    tabHtml,
    tabImageUrl,
    transcript,
    tabTitle,
    sourceType,
    pdfSavedPageId,
    pdfGroundSourceUrl,
    pdfGroundSourceId,
  } = res;
  sidePanelStore.update(tabId, {
    tabId,
    windowId,
    url: decodeURIComponent(getURLWithoutHash(tabUrl) ?? ''),
    html: tabHtml,
    imageUrl: tabImageUrl,
    title: tabTitle,
    sourceType,
    transcript,
    pdfSavedPageId,
    pdfGroundSourceUrl,
    pdfGroundSourceId,
  });
};

const handleConnectSidePanel = async (port) => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  console.log('when connected: ', tab);
  let sidePanel = tab ? sidePanelStore.getSidePanel(tab.id) : null;
  if (sidePanel && !sidePanel.isConnected) {
    sidePanelStore.connect(tab.id, port);
    sidePanel = sidePanelStore.getSidePanel(tab.id);

    try {
      if (!sidePanel.url) {
        // 커맨드로 사이드 패널을 연 경우
        console.log('windowId: ', tab.windowId, 'sidePanel: ', sidePanel);
        await handleCommandContext(tab.windowId, tab.id);
        sidePanel = sidePanelStore.getSidePanel(tab.id);
      }

      if (sidePanel.sourceType === 'pdf' && !sidePanel.pdfGroundSourceUrl) {
        await updateInitialPDFContext(tab.windowId, tab.id);
        sidePanel = sidePanelStore.getSidePanel(tab.id);
      }

      port.postMessage({
        name: 'UPDATE_CURRENT_CONTEXT',
        data: sidePanel,
      });
    } catch (err) {
      if (err.message === 'Could not establish connection. Receiving end does not exist.') {
        port.postMessage({ name: 'CONNECTION_ERROR' });
      } else {
        console.error(err);
        port.postMessage({ name: 'CONTEXT_ERROR' });
      }
    }
  } else {
    // 사이드 패널을 열고 connect 되기 전에 윈도우를 이동한 경우
    const tabId = sidePanelStore.getUnconnectedTabId();
    sidePanelStore.connect(tabId, port);
    let sidePanel = sidePanelStore.getSidePanel(tabId);
    console.log('tabId: ', tabId, 'sidePanel: ', sidePanel);

    try {
      if (!sidePanel.url) {
        // 커맨드로 사이드 패널을 연 경우
        // windowId가 필요한 경우 수정 필요
        await handleCommandContext(tab?.windowId || -1, sidePanel.tabId);
        sidePanel = sidePanelStore.getSidePanel(tabId);
      }

      if (sidePanel.sourceType === 'pdf' && !sidePanel.pdfGroundSourceUrl) {
        // windowId가 필요한 경우 수정 필요
        await updateInitialPDFContext(tab?.windowId || -1, sidePanel.tabId);
        sidePanel = sidePanelStore.getSidePanel(tabId);
      }

      port.postMessage({
        name: 'UPDATE_CURRENT_CONTEXT',
        data: sidePanel,
      });
    } catch (err) {
      console.error(err);
      if (err.message === 'Could not establish connection. Receiving end does not exist.') {
        port.postMessage({ name: 'CONNECTION_ERROR' });
      } else {
        port.postMessage({ name: 'CONTEXT_ERROR' });
      }
    }
  }

  port.onMessage.addListener(handleMessageSidePanel);
  port.onDisconnect.addListener(handleDisconnectSidePanel);
};

const openSidePanel = async ({ tabId }) => {
  chrome.sidePanel.setOptions({
    tabId,
    path: 'side-panel/index.html',
    enabled: true,
  });
  await chrome.sidePanel.open({ tabId });
};

const closePanel = async ({ tabId }) => {
  chrome.sidePanel.setOptions({
    tabId,
    enabled: false,
  });
};

const getBrowserNameSidePanel = () => {
  try {
    if (navigator.userAgent.indexOf('SamsungBrowser') != -1) {
      // Mark - this is samsung browser
      return 'samsung';
    } else if (navigator.userAgent.indexOf('Firefox') != -1) {
      // Luke - this is firfox browser
      return 'firefox';
    } else if (navigator.userAgent.indexOf('Chrome') != -1) {
      if (navigator.userAgent.indexOf('Whale') != -1) {
        // Luke - this is whale browser
        return 'whale';
      } else if (navigator.userAgent.indexOf('OPR') != -1) {
        // Luke - this is opera browser
        return 'opera';
      } else if (
        navigator.userAgent.indexOf('Edge') != -1 ||
        navigator.userAgent.indexOf('Edg') != -1
      ) {
        // Luke - this is edge browser
        return 'edge';
      } else {
        // Luke - this is chrome browser
        return 'chrome';
      }
    } else if (navigator.userAgent.indexOf('Safari') != -1) {
      // Luke - this is safari browser
      return 'safari';
    }
  } catch (e) {
    logger(e);
  }
  return 'others';
};

const isSidePanelAvailable =
  !!chrome.sidePanel && !!chrome.sidePanel.open && getBrowserNameSidePanel() !== 'edge';

const gmailDomains = [
  'mail.google.com',
  'mail.google.com.br',
  'mail.google.co.uk',
  'mail.google.fr',
  'mail.google.es',
  'mail.google.de',
  'mail.google.it',
  'mail.google.nl',
  'mail.google.com.au',
  'mail.google.ca',
  'mail.google.co.in',
  'mail.google.com.mx',
  'mail.google.ru',
  'mail.google.jp',
  'mail.google.co.kr',
  'mail.google.cn',
  'mail.google.com.hk',
  'mail.google.com.sg',
  'mail.google.com.tr',
  'mail.google.com.vn',
];

const checkIsGmailSite = (url) => {
  try {
    return gmailDomains.includes(new URL(url).hostname);
  } catch {
    return false;
  }
};

const handleToggleSidePanel = (tab, config) => {
  if (isSidePanelAvailable && (config?.side_panel?.isOn ?? true)) {
    if (tab && tab.windowId >= 0) {
      if (checkIsGmailSite(tab.url)) {
        return;
      }

      console.log('handleToggleSidePanel - side panel info: ', sidePanelStore.getSidePanel(tab.id));
      if (sidePanelStore.checkIsOpened(tab.id)) {
        console.log('handleToggleSidePanel - close side panel');
        closePanel({ tabId: tab.id });
      } else {
        console.log('handleToggleSidePanel - open side panel');
        sidePanelStore.update(tab.id, {
          windowId: tab.windowId,
          tabId: tab.id,
          openType: 'command',
        });
        openSidePanel({ tabId: tab.id });
      }
    }
  } else {
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { name: 'TOGGLE_SIDE_PANEL' });
    }
  }
};

const logoutToSidePanels = () => {
  const sidePanels = [...sidePanelStore.getAllSidePanels().values()].filter(
    (sidePanel) => sidePanel.isConnected,
  );
  sidePanels.forEach((sidePanel) => {
    sidePanel.port?.postMessage({ name: 'LOG_OUT' });
  });
};

const updateMembershipSidePanels = ({ membership }) => {
  const sidePanels = [...sidePanelStore.getAllSidePanels().values()].filter(
    (sidePanel) => sidePanel.isConnected,
  );
  sidePanels.forEach((sidePanel) => {
    sidePanel.port?.postMessage({ name: 'UPDATE_MEMBERSHIP', data: membership });
  });
};
