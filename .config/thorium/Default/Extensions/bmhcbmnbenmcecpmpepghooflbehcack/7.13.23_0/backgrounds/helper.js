var isProductionMode = true; // todo: production에 올릴 때는 true로 바꾸기
var browser = getBrowser();
var contentScriptArray = ['/liner-core.be.js'];

chrome.runtime.onInstalled.addListener(async function (details) {
  if (details.reason == 'install') {
    await setIsExtensionPinRenderable(true);

    await setLINERVersionStorage(chrome.runtime.getManifest().version);

    openTab(
      `${BASE_URL}/home?showBEGuide=true&isBEInstalledLanding=true&BEVersion=${
        chrome.runtime.getManifest().version
      }`,
      function () {},
    );

    sendNativeMessage(NATIVE_MESSAGE_NAME.OPT_IN_SAFARI_EXTENSION);

    createShortcutToStorage();
    await storage.setItem('installedAt', Date.now());
  } else if (details.reason == 'update') {
    await setBasicUserOnboardingToShown();
    await setUserProfileModalToShown();

    const LINERVersionFromStorage = await getLINERVersionStorage();
    if (LINERVersionFromStorage !== chrome.runtime.getManifest().version) {
      sendAmplitudeData('update_extension_version', {
        old_liner_extension_version: LINERVersionFromStorage,
      });
      await setLINERVersionStorage(chrome.runtime.getManifest().version);
    }
  }

  checkIsProductionModeAndInjectJavascript();
});

const createShortcutToStorage = () => {
  const shortcutOriginal = [
    {
      name: 'Google',
      url: 'https://www.google.com',
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com',
    },
    {
      name: 'Medium',
      url: 'https://medium.com',
    },
    {
      name: '',
      url: '',
    },
    {
      name: '',
      url: '',
    },
  ];
  setLINERShortcutStorage(JSON.stringify(shortcutOriginal));
};

const checkIsNewTabPage = (url, pendingUrl) => {
  const isChromeNewTabPage = url === 'chrome://newtab/' || url === 'chrome://new-tab-page/';
  const isEdgeNewTabPage = url === 'edge://newtab/';

  const isLoadingChromeNewTabPage = pendingUrl && pendingUrl === 'chrome://newtab/';
  const isLoadingEdgeNewTabPage = pendingUrl && pendingUrl === 'edge://newtab/';

  return (
    isChromeNewTabPage || isEdgeNewTabPage || isLoadingChromeNewTabPage || isLoadingEdgeNewTabPage
  );
};

const getIsLinerChatNewTabCohort = () => {
  if (!user?.id) return false;
  const lastNumberOfUserId = GCSConfig?.project_x47?.open_conditions?.lastNumberOfUserId || [];
  const NEW_USER_REG_TIME = '2023-05-06';

  const isLinerChatNewTabCohort =
    lastNumberOfUserId.includes(+user.id[user.id.length - 1]) &&
    new Date(user.regTime).getTime() > new Date(NEW_USER_REG_TIME).getTime();

  return isLinerChatNewTabCohort;
};

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, async (tab) => {
    const { id, url, pendingUrl } = tab;
    if (checkIsNewTabPage(url, pendingUrl)) {
      if (!isLoggedIn()) return;

      const isNewTabOn = await checkIsNewTabOnStorage();

      if (isNewTabOn) {
        const newTabUrl = await getNewTabUrl();
        chrome.tabs.update(id, { url: newTabUrl }, (newTab) => {
          setTimeout(async () => {
            if (newTab.title === '') {
              chrome.tabs.update(id, { url: newTabUrl });
            }
          }, 0);
        });
      }
    }
  });
});

function checkIsDevMode() {
  return !('update_url' in chrome.runtime.getManifest());
}

function getBrowserName() {
  // Luke - Safari: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15
  // Luke - Chrome: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36
  // Luke - Firefox: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:67.0) Gecko/20100101 Firefox/67.0
  // Luke - Whale: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Whale/1.5.72.6 Safari/537.36
  // Luke - Opera: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.168 Safari/537.36 OPR/51.0.2830.40
  // Luke - Edge: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14931
  // Luke - Edge 2: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.74 Safari/537.36 Edg/79.0.309.43
  // Mark - Samsung: Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G981N/KSU1EUH1) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/15.0 Chrome/90.0.4430.210 Mobile Safari/537.36

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
}

function checkIsProductionModeAndInjectJavascript() {
  if (checkIsDevMode()) return;
  injectContentScripts();
}

function injectContentScripts() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      const isLinerPage = tab.url.includes('getliner.com');
      if (isLinerPage) return;

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: contentScriptArray,
      });
    });
  });
}

function executeJSFile(page, file, callback) {
  chrome.tabs.executeScript(page.id, {
    file: file,
  });
}

chrome.runtime.setUninstallURL(`${BASE_URL}/uninstall/browser-extension`);

function setUninstallUrl(lastHost) {
  chrome.runtime.setUninstallURL(`${BASE_URL}/uninstall/browser-extension?domain=${lastHost}`);
}

function executeScript(page, script, callback) {
  chrome.tabs.executeScript(
    page.id,
    {
      code: script,
    },
    function (result) {
      callback(result);
    },
  );
}

function executeCSSFile(page, file, callback) {
  chrome.tabs.insertCSS(
    page.id,
    {
      file: file,
    },
    function (result) {
      callback(result);
    },
  );
}

function logger(content) {}

async function getUid() {
  var uid = (await storage.getItem('uid')) || createDeviceID();
  await storage.setItem('uid', uid);
  return uid;
}

function createDeviceID() {
  var d = new Date().getTime();
  var uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uid;
}

function openTab(url, callback) {
  chrome.tabs.create({ url }, function (tab) {
    callback();
  });
}

function openTabWhileInCurrentTab(url, callback) {
  chrome.tabs.create({ url, active: false }, function (tab) {
    callback();
  });
}

function getURLWithoutHash(url) {
  return url.split('#')[0];
}

function getBrowser() {
  if (globalThis.safari && !globalThis.safari.id) {
    logger('initialize as safari extension');
    return globalThis.safari;
  }

  if (globalThis.whale) {
    logger('intialize as whale extension');
    return globalThis.whale;
  }

  logger('initialize as chrome/firefox/opera/edge extension');
  return chrome;
}

function setToolbarItem(page, title, iconType) {
  chrome.action.setTitle({
    tabId: page.id,
    title: title,
  });

  chrome.action.setIcon({
    tabId: page.id,
    path: {
      16: '/images/icon/icon-' + iconType + '-16.png',
      32: '/images/icon/icon-' + iconType + '-32.png',
      48: '/images/icon/icon-' + iconType + '-48.png',
      128: '/images/icon/icon-' + iconType + '-128.png',
    },
  });
}

function getFileSize(url, callback) {
  var fileSize = 0;
  var http = new XMLHttpRequest();
  http.open('HEAD', url, false); // false = Synchronous
  http.send(null); // it will stop here until this http request is complete
  if (http.status === 200) {
    fileSize = http.getResponseHeader('content-length');
  }
  callback(parseInt(fileSize));
}

function getOS() {
  var userAgent = globalThis.navigator.userAgent,
    platform = globalThis.navigator.platform,
    macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
    windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
    iosPlatforms = ['iPhone', 'iPad', 'iPod'],
    os;

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = 'macos';
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = 'ios';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = 'windows';
  } else if (/Android/.test(userAgent)) {
    os = 'aos';
  } else if (!os && /Linux/.test(platform)) {
    os = 'linux';
  }
  return os;
}

function getLKSBaseParams() {
  let device_type = 'pc';
  const device_os = getOS();
  if (device_os === 'ios' || device_os === 'android') {
    device_type = 'mobile';
  }

  return {
    device_type,
    device_os,
    user_agent: getBrowserName() === 'others' ? undefined : getBrowserName(),
    occurred_at: parseInt(new Date().getTime() / 1000),
    ip: publicIP,
  };
}

const sortByChar = (tags) => {
  const sortedTags = tags
    .slice()
    .sort((a, b) => (a.title > b.title ? 1 : b.title > a.title ? -1 : 0));
  return sortedTags;
};

const removeDuplicatedTags = (tags) => {
  let tagTitles = [];
  let duplicateRemovedTags = [];
  tags.forEach((tag) => {
    if (tagTitles.indexOf(tag.title) == -1) {
      tagTitles.push(tag.title);
      duplicateRemovedTags.push(tag);
    }
  });
  return duplicateRemovedTags;
};

function deserialize(src) {
  switch (src.cls) {
    case 'FormData': {
      const fd = new FormData();
      for (const [key, items] of src.value) {
        for (const item of items) {
          fd.append(key, deserialize(item));
        }
      }
      return fd;
    }
    case 'Blob':
    case 'File': {
      const { type, name, lastModified } = src;
      const binStr = atob(src.value);
      const arr = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) arr[i] = binStr.charCodeAt(i);
      const data = [arr.buffer];
      return src.cls === 'File'
        ? new File(data, name, { type, lastModified })
        : new Blob(data, { type });
    }
    case 'json':
      return JSON.parse(src.value);
  }
}

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
  );
}

async function getLastNumberOfLinerUUID() {
  const linerUUID = await getLinerUUIDStorage();
  const lastCharactersOfLinerUUID = linerUUID.slice(-5);
  const lastNumberOfLinerUUID = parseInt(lastCharactersOfLinerUUID, 16) % 10;

  return lastNumberOfLinerUUID;
}

function handleSaveWebPageEvent(ok, status, reason, eventProperties = {}) {
  if (ok || status === 'success' || status === 'normal') {
    sendAmplitudeData('save_web_page', eventProperties);
    return;
  }

  if (status === 'error' && reason === 'not_auth') {
    sendAmplitudeData('save_web_page', eventProperties);
  }
}

async function getNewTabUrl() {
  return '../newTab/newTabWorkspaceRedirect.html';
}

function getDateString(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
}

const setBasicUserOnboardingToShown = async () => {
  const modalHandler = await getModalHandlerStorage();
  const isModalShown = modalHandler.basicUserOnboarding?.isModalShown;
  if (!isModalShown) {
    await setModalHandlerStorage(
      JSON.stringify({ ...modalHandler, basicUserOnboarding: { isModalShown: true } }),
    );
  }
};

const setUserProfileModalToShown = async () => {
  const modalHandler = await getModalHandlerStorage();
  const isProfileSetOrDismissed = modalHandler.userProfile?.isProfileSetOrDismissed;
  if (!isProfileSetOrDismissed) {
    await setModalHandlerStorage(
      JSON.stringify({ ...modalHandler, userProfile: { isProfileSetOrDismissed: true } }),
    );
  }
};

const getLINERInstalledAt = async () => {
  const installedAt = await storage.getItem('installedAt');
  return installedAt;
};

class Base64Converter {
  static convertUtf8toBase64(str) {
    return globalThis.btoa(unescape(encodeURIComponent(str)));
  }

  static convertBase64toUtf8(str) {
    if (str === undefined) return;
    return decodeURIComponent(escape(globalThis.atob(str)));
  }
}

class Adapter {
  static styleItemsToHighlights(styleItems) {
    const styleItemsInUTF8 = JSON.parse(Base64Converter.convertBase64toUtf8(styleItems));
    return styleItemsInUTF8.map((styleItemInUTF8) => {
      return {
        ...styleItemInUTF8,
        styleId: styleItemInUTF8.id,
        status:
          styleItemInUTF8.status[styleItemInUTF8.status.length - 1].code === 0
            ? 'normal'
            : 'deleted',
      };
    });
  }

  static highlightsToStyleItems(highlights) {
    const styleItemsInUTF8 = highlights.map((highlight) => ({
      ...highlight,
      id: highlight.styleId,
      status: [{ code: highlight.status === 'normal' ? 0 : 2, regTime: new Date() }],
      styleOptions: {
        backgroundColor: '#d9c3ff', // 현재 사용되지 않으나 Lighter.js에서 검사하는 부분이 있어 생성
      },
    }));
    return Base64Converter.convertUtf8toBase64(JSON.stringify(styleItemsInUTF8));
  }

  static v2SavedPageHighlightsToPageHighlights(v2SavedPageHighlights, openState) {
    return v2SavedPageHighlights.map((v2SavedPageHighlight) => {
      return {
        ...v2SavedPageHighlight,
        annotationId: v2SavedPageHighlight.annotation?.id,
        owner: {
          id: +user.id,
          name: user.name,
          username: user.username,
          profilePhotoUrl: user.image,
          status: 'normal',
          bio: '',
        },
        openState,
      };
    });
  }

  static v2SavedPageResponseToSavedPageCommunityResponse(v2SavedPageResponse) {
    const { savedPage, page } = v2SavedPageResponse;
    return {
      id: savedPage.id,
      owner: {
        id: +user.id,
        name: user.name,
        username: user.username,
        profilePhotoUrl: user.image,
        status: 'normal',
        bio: '',
      },
      openState: savedPage.openState,
      page,
      title: savedPage.title,
      url: page.url,
      lastUpdatedAt: savedPage.lastUpdatedAt,
      createdAt: savedPage.createdAt,
      highlights: savedPage.highlights,
      commentCount: 0,
      status: savedPage.status,
      tags: savedPage.tags,
      folders: savedPage.folders,
    };
  }

  static v2SavedPageResponseToPagesInfosResponse(v2SavedPageResponse) {
    const { savedPage, page } = v2SavedPageResponse;
    return {
      item: {
        pageId: savedPage.id,
        shareId: savedPage.shareId,
        styleItems: this.highlightsToStyleItems(savedPage.highlights),
        lastUpdateTime: savedPage.lastUpdatedAt,
        tags: savedPage.tags,
        title: savedPage.title,
        url: page.url,
      },
    };
  }

  static v2PageResponseToPagesSavedPage(v2PageResponse) {
    return {
      activeDayCount: v2PageResponse.activeDayCount,
      lastUpdateTime: v2PageResponse.savedPage.lastUpdatedAt,
      newPageId: v2PageResponse.page.id,
      pageId: v2PageResponse.savedPage.id,
      savedPageId: v2PageResponse.savedPage.id,
      shareId: v2PageResponse.savedPage.shareId,
      status: 'success',
    };
  }
}
