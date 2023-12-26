function getBrowser() {
  if (globalThis.safari && !globalThis.safari.id) {
    return globalThis.safari;
  }

  if (globalThis.whale) {
    return globalThis.whale;
  }

  return chrome;
}

var browser = getBrowser();

// Storage Definition

const CStorage = {
  getItem: (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] || null); // fallback value O
      });
    });
  },
  getItemV2: (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key]); // fallback value X
      });
    });
  },
  setItem: (key, value) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  },
  setItemV2: (key, value) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve(value);
      });
    });
  },
  removeItem: (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, () => {
        resolve();
      });
    });
  },
};

const getManifestVersion = () => {
  const manifestVersion = chrome.runtime.getManifest().manifest_version;
  return manifestVersion;
};

const storage = CStorage;

// Storage Functions

const printAllChromeStorageItems = () => {
  chrome.storage.local.get(null, (item) => {
    console.dir(item);
  });
};

const DEFAULT_LINER_SHORTCUT = [
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

const getLINERShortcutStorage = async () => {
  const LINERShortcut = await storage.getItem('linerShortcut');
  return JSON.parse(LINERShortcut) || DEFAULT_LINER_SHORTCUT;
};

const setLINERShortcutStorage = async (linerShortcut) => {
  await storage.setItem('linerShortcut', linerShortcut);
};

const getModalHandlerStorage = async () => {
  const modalHandler = await storage.getItem('modal_handler');
  return JSON.parse(modalHandler) || {};
};

const setModalHandlerStorage = async (modalHandler) => {
  await storage.setItem('modal_handler', modalHandler);
};

const getConversionHandlerStorage = async () => {
  const modalHandler = await storage.getItem('conversion_handler');
  return JSON.parse(modalHandler) || {};
};

const setConversionHandlerStorage = async (conversionHandler) => {
  await storage.setItem('conversion_handler', conversionHandler);
};

const checkIsNewTabOnStorage = async () => {
  const isNewTabOn = await storage.getItem('is_new_tab_on');
  return JSON.parse(isNewTabOn) || false;
};

const setIsNewTabOnStorage = async (isNewTabOn) => {
  await storage.setItem('is_new_tab_on', isNewTabOn);
};

const getLatestTimeMarkFor24HoursStorage = async () => {
  const latestMarkedTime = (await storage.getItem(`latest_time_mark_for_24_hours`)) || -1;
  return latestMarkedTime;
};

const setLatestTimeMarkFor24HoursStorage = async () => {
  await storage.setItem(`latest_time_mark_for_24_hours`, getKoreaNowDateString());
};

const getSidCookieStorage = async () => {
  return await storage.getItem('sidCookie');
};

const setSidCookieStorage = async (sidCookie) => {
  await storage.setItem('sidCookie', sidCookie);
};

const removeSidCookieStorage = async () => {
  await storage.removeItem('sidCookie');
};

const getUserIdStorage = async () => {
  return await storage.getItem('userId');
};

const setUserIdStorage = async (userId) => {
  await storage.setItem('userId', userId);
};

const removeUserIdStorage = async () => {
  await storage.removeItem('userId');
};

const getLINERVersionStorage = async () => {
  return (await storage.getItem('liner_version')) || '';
};

const setLINERVersionStorage = async (value) => {
  await storage.setItem('liner_version', value);
};

const getLinerUUIDStorage = async () => {
  const linerUUID = await storage.getItem('linerUUID');
  if (linerUUID) {
    return linerUUID;
  } else {
    const newLinerUUID = uuidv4();
    await storage.setItem('linerUUID', newLinerUUID);
    return newLinerUUID;
  }
};

const getNewTabColorTheme = async () => {
  return await storage.getItem('liner-color-theme');
};

const setNewTabColorTheme = async (theme) => {
  await storage.setItem('liner-color-theme', theme);
};

const checkIsNewTabGuideShownStorage = async () => {
  return await storage.getItem('isNewTabGuideShown');
};

const setIsNewTabGuideShownStorage = async (isNewTabGuideShown) => {
  await storage.setItem('isNewTabGuideShown', isNewTabGuideShown);
};

const setCollectionTooltipClickedDate = async (date) => {
  await storage.setItem('collectionTooltipClickedDate', date);
};

const getCollectionTooltipClickedDate = async () => {
  return await storage.getItem('collectionTooltipClickedDate');
};

const getIsPBLSwitchOn = async () => {
  const PBLSwitchStatus = await storage.getItem('PBLSwitchStatus');
  return PBLSwitchStatus?.isOn ?? true;
};

const setIsPBLSwitchOn = async (isOn) => {
  await storage.setItem('PBLSwitchStatus', { isOn });
};

const setIsExtensionPinRenderable = async (isRenderable) => {
  await storage.setItem('ExtensionPin', { isRenderable });
};

const getIsExtensionPinRenderable = async () => {
  const extensionPin = await storage.getItem('ExtensionPin');
  return extensionPin?.isRenderable ?? false;
};

const setExtensionSettings = async (key, isOn) => {
  const extensionSettings = await storage.getItem('ExtensionSettings');
  await storage.setItem('ExtensionSettings', {
    ...extensionSettings,
    [key]: isOn,
  });
};

const getExtensionSettings = async (key) => {
  const extensionSettings = await storage.getItem('ExtensionSettings');
  if (extensionSettings) {
    return extensionSettings[key] ?? true;
  }

  return true;
};

const getTranslatorLanguages = async () => {
  const langs = await storage.getItem('translatorLanguages');
  return langs ? langs : await storage.setItemV2('translatorLanguages', TRANSLATE_LANGUAGES);
};

const setDefaultTranslatorLanguage = async (targetLang) => {
  const prevLangs = await getTranslatorLanguages();
  return storage.setItemV2(
    'translatorLanguages',
    prevLangs.map((l) => ({ ...l, isDefault: l.targetLang === targetLang })),
  );
};

const setPrevPageURL = async (url) => {
  await storage.setItem('PrevPageURL', url);
};

const getPrevPageURL = async () => {
  return await storage.getItem('PrevPageURL');
};

// Lock

let isBEInstalledEventLocked = false;

// L10N

const serviceWorkerLocalization = {
  LINER: {
    en: 'LINER',
    ko: 'LINER',
    ja: 'LINER',
    zh: 'LINER',
  },
  'LINER is blocked on this website': {
    en: 'LINER is blocked on this website',
    ko: '라이너가 이 웹사이트에서 차단되었습니다',
    ja: 'LINERがこのウェブサイトでブロックされて',
    zh: 'LINER在本网站被封锁',
  },
  "Can't open LINER pop-up on the PDF file.": {
    en: "Can't open LINER pop-up on the PDF file.",
    ko: 'PDF 파일에서는 라이너 팝업을 열 수 없습니다.',
    ja: 'PDFファイルでは、ライナーのポップアップが開きません。',
    zh: '无法打开PDF文件上的LINER弹出窗口。',
  },
  'No network connection. Changes were not saved.': {
    en: 'No network connection. Changes were not saved.',
    ko: '네트워크에 연결되어있지 않아 변경사항이 저장되지 않았습니다.',
    ja: 'ネットワークに接続していないため、変更は保存されませんでした。',
    zh: '由于您未连接到网络，因此未保存更改。',
  },
  'Save to LINER': {
    en: 'Save to LINER',
    ko: '라이너에 저장',
    zh: '储存到LINER',
    ja: 'ライナーに保存',
  },
  'Go to My Highlights': {
    en: 'Go to My Highlights',
    ko: '내 하이라이트로 이동',
    zh: '移到我的Highlight',
    ja: '私のハイライトで移動',
  },
  'Save image to LINER': {
    en: 'Save image to LINER',
    ko: '라이너에 이미지 저장',
    zh: '将图像保存到LINER',
    ja: 'LINERにイメージ保存',
  },
  'Remove website banner ads': {
    en: 'Remove website banner ads',
    ko: '웹 사이트 배너 광고 제거',
    zh: '删除网站横幅广告',
    ja: 'ウェブサイトバナー広告削除',
  },
  locale: {
    en: 'en',
    ko: 'ko',
    zh: 'zh',
    ja: 'ja',
  },
  'Summarize this page': {
    en: 'Summarize this page',
    ko: '본문 요약하기',
    zh: '总结这个页面',
    ja: 'このページをまとめる',
  },
};

const getServiceWorkerLanguage = () => {
  let language = 'en';
  try {
    language = navigator.language.split('-')[0].toLowerCase().trim();
    if (language.indexOf('zh') !== -1) {
      // Luke - 중국어
      language = 'zh';
    }

    if (!language) {
      language = 'en';
    }
  } finally {
    return language;
  }
};

const localizeInServiceWorker = (content) => {
  const language = getServiceWorkerLanguage();
  return (
    serviceWorkerLocalization[content]?.[language] ||
    serviceWorkerLocalization[content]?.['en'] ||
    content
  ).trim();
};

const setLoginPopupSavedPage = async (createData) => {
  await storage.setItem('loginPopupCreateData', createData);
};

const getLoginPopupSavedPage = async () => {
  return await storage.getItem('loginPopupCreateData');
};

const initDailyAutoAIUsage = async () => {
  const data = {
    date: new Date().toLocaleDateString(),
    types: {
      serpAutoAI: 0,
    },
  };
  await storage.setItem('dailyAutoAIUsage', data);
  return data;
};

const updateDailyAutoAIUsage = async (type) => {
  let prev = await storage.getItem('dailyAutoAIUsage');
  if (!prev || prev.date !== new Date().toLocaleDateString()) {
    prev = await initDailyAutoAIUsage();
  }

  await storage.setItem('dailyAutoAIUsage', {
    ...prev,
    types: {
      ...prev.types,
      [type]: prev.types[type] + 1,
    },
  });
};

const getDailyAutoAIUsage = async () => {
  const usage = (await storage.getItem('dailyAutoAIUsage')) ?? (await initDailyAutoAIUsage());
  if (usage.date !== new Date().toLocaleDateString()) {
    return await initDailyAutoAIUsage();
  }
  return usage;
};

const initDailyBannerUsage = async () => {
  const data = {
    date: new Date().toLocaleDateString(),
    lastBannerShownTime: null,
    types: {
      copilotBannerCoreSentence: 0,
      copilotBannerRelevant: 0,
      copilotBannerSummary: 0,
      copilotBannerGoogleSERPQuery: 0,
      copilotBannerHighlightCoreSentence: 0,
    },
  };
  await storage.setItem('dailyBannerUsage', data);
  return data;
};

const updateDailyBannerUsage = async (type) => {
  let prev = await storage.getItem('dailyBannerUsage');

  if (!prev || prev.date !== new Date().toLocaleDateString()) {
    prev = await initDailyBannerUsage();
  }

  await storage.setItem('dailyBannerUsage', {
    ...prev,
    lastBannerShownTime: Date.now(),
    types: {
      ...prev.types,
      [type]: prev.types[type] + 1,
    },
  });
};

const getDailyBannerUsage = async () => {
  const usage = (await storage.getItem('dailyBannerUsage')) ?? (await initDailyBannerUsage());

  if (usage.date !== new Date().toLocaleDateString()) {
    return await initDailyBannerUsage();
  }
  return usage;
};

const initAnonymousUserSelectionTooltipUsage = async () => {
  await storage.setItem('anonymousUserSelectionTooltipUsage', {
    isAlreadyShown: false,
  });
  return { isAlreadyShown: false };
};

const getAnonymousUserSelectionTooltipUsage = async () => {
  const usage =
    (await storage.getItem('anonymousUserSelectionTooltipUsage')) ??
    (await initAnonymousUserSelectionTooltipUsage());
  return usage;
};

const updateAnonymousUserSelectionTooltipUsage = async (isAlreadyShown) => {
  const prev = await storage.getItem('anonymousUserSelectionTooltipUsage');
  if (!prev) {
    await initAnonymousUserSelectionTooltipUsage();
  }

  await storage.setItem('anonymousUserSelectionTooltipUsage', {
    isAlreadyShown,
  });
};

const sendNativeMessage = (messageName, properties = {}) => {
  if (chrome.runtime.sendNativeMessage) {
    chrome.runtime.sendNativeMessage('com.getliner.liner-for-mac.liner-web-extension', {
      messageName,
      properties,
    });
  }
};

const getPrevGoogleSearchQuery = async () => {
  return await storage.getItem('prevGoogleSearchQuery');
};

const updatePrevGoogleSearchQuery = async ({ query }) => {
  await storage.setItem('prevGoogleSearchQuery', query);
};

const getUserLocationOnFirstLoginFromStorage = async () => {
  return await storage.getItem('userLocationOnFirstLogin');
};
const updateUserLocationOnFirstLoginFromStorage = async (countryCode) => {
  await storage.setItem('userLocationOnFirstLogin', countryCode);
};

const getLastBannerShownTimestamp = async () => {
  return await storage.getItem('dailyBannerShownTimestamp');
};

const updateLastBannerShownTimestamp = async (timestamp) => {
  await storage.setItem('dailyBannerShownTimestamp', timestamp);
};

const getIsCommandBannerShown = async () => {
  return (await storage.getItem('isCommandBannerShown')) ?? false;
};

const closeCommandBanner = async () => {
  await storage.setItem('isCommandBannerShown', true);
};
