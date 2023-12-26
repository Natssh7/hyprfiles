function initAmplitude() {
  try {
    const PROD = 'ac91207b66aa64e62645c137841d7062';
    const TEST = '5f4b790d5adfccc2cc21048da620a586';
    const amplitudeKey = isProduction ? PROD : TEST;
    amplitude.then((res) =>
      res.getInstance().init(amplitudeKey, { includeReferrer: true, includeUtm: true }),
    );
  } catch (e) {
    console.error(e);
  }
}

function addNetworkListenerAndLogin() {
  try {
    const isOnline = navigator.onLine;

    // 온라인이거나 지원하지 않는 브라우저
    if (isOnline || isOnline === undefined) {
      resetVariables();
    }

    globalThis.addEventListener('online', () => {
      resetVariables();
    });
  } catch (e) {
    console.error(e);
  }
}

initAmplitude();
addNetworkListenerAndLogin();

class LINER_KINDLE_SYNC_MANAGER {
  constructor() {
    this.syncStatus = {
      ready: 'ready',
      inSync: 'inSync',
      finish: 'finish',
      inSilentSync: 'inSilentSync',
      value: 'ready',
    };
    this.inSyncBooksData = [];
    this.syncStartPage = null;
    this.syncStartTime = null;
    this.lastSyncTime = null;
    this.synchronizedBooksData = [];
    this.amazonLoggedInChecker = null;
    this.userIntegrationKindleBooksData = null;
    this.retryCount = 0;
    this.retryMaxCount = 60;
    this.retryTerm = 1000;
    this.isOptimizationSync = false;
  }

  checkIsSyncStatus(checkStatus) {
    return this.syncStatus.value === checkStatus;
  }

  retryCountUp() {
    this.retryCount = this.retryCount + 1;
  }

  retryCall(callback) {
    if (this.retryCount < this.retryMaxCount) {
      setTimeout(() => {
        this.retryCountUp();
        callback();
      }, this.retryTerm);
    }
  }

  resetRetryCount() {
    this.retryCount = 0;
  }

  resetSyncManager() {
    this.resetRetryCount();
    this.syncStatus.value = this.syncStatus.ready;
    this.synchronizedBooksData = [];
    this.inSyncBooksData = [];
    this.isOptimizationSync = false;
    if (this.syncStartPage) {
      messageTo(this.syncStartPage, 'RESET_KINDLE_SYNC_START_PAGE', {});
    }
  }

  clearAmazonLoggedInChecker() {
    clearInterval(this.amazonLoggedInChecker);
  }

  setKindleBooksData(userInfo) {
    const { kindleBooksData } = userInfo;
    this.inSyncBooksData = kindleBooksData;
    this.synchronizedBooksData = [];
    this.syncStartTime = Date.now();
  }

  replaceAmazonSigninPage(page, signinUrl) {
    if (page && this.checkIsSyncStatus(this.syncStatus.inSync)) {
      messageTo(this.syncStartPage, 'RESET_KINDLE_SYNC_START_PAGE', {});
      this.syncStartPage = page;
      messageTo(page, 'REPLACE_TO_AMAZON_SIGNIN', { signinUrl });

      this.amazonLoggedInChecker = setInterval(() => {
        messageTo(page, 'CHECK_LOGGED_IN_AMAZON', { syncStartPageUrl: this.syncStartPage?.url });
      }, 1000);
    } else {
      this.resetSyncManager();
    }
  }

  runScrapKindleBooksData(page) {
    if (page) {
      messageTo(page, 'RENDER_KINDLE_SYNC_TOAST', { syncStatus: this.syncStatus.inSync });
    }

    getReadAmazonNotebook()
      .then((res) => {
        if (res.redirected) {
          LINERKindleSyncManager.replaceAmazonSigninPage(page, res.url);
        }
        return res.text();
      })
      .then((readAmazonNotebookHTML) => {
        postUserIntegrationSettingKindle();
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (res) => {
          const targetPage = res.find((tab) => tab?.url?.startsWith('http'));
          if (targetPage) {
            messageTo(targetPage, 'GET_KINDLE_BOOKS', { readAmazonNotebookHTML });
            this.resetRetryCount();
          } else {
            this.retryCall(() => this.runScrapKindleBooksData(page));
          }
        });
      });
  }

  runScrapKindleBookHighlightData(userInfo) {
    const { bookData, kindleBookHighlights } = userInfo;
    getAmazonDpBook(bookData.asin, kindleBookHighlights?.nextPageState).then(
      (bookHighlightsHTML) => {
        const prevHighlights = kindleBookHighlights?.highlights || [];

        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (res) => {
          const targetPage = res.find((tab) => tab?.url?.startsWith('http'));
          if (targetPage) {
            messageTo(targetPage, 'GET_KINDLE_BOOK_HIGHLIGHTS', {
              bookHighlightsHTML,
              bookData,
              prevHighlights,
            });
            this.resetRetryCount();
          } else {
            this.retryCall(() => this.runScrapKindleBookHighlightData(userInfo));
          }
        });
      },
    );
  }

  postKindleHighlightsToLINER(userInfo) {
    const { bookData, kindleBookHighlights } = userInfo;

    if (this.isOptimizationSync && this.checkIsSyncStatus(this.syncStatus.inSilentSync)) {
      const synchronizedBookData = this.userIntegrationKindleBooksData?.find(
        (synchronizedBook) => bookData.asin === synchronizedBook.asin,
      );
      const isSameHighlightsLength =
        synchronizedBookData.numOfHighlights === kindleBookHighlights.highlights.length;
      const isSameUpdateTime =
        `${synchronizedBookData.lastUpdatedAt}:00.000Z` === bookData.lastUpdatedAt;

      if (isSameUpdateTime && isSameHighlightsLength) {
        this.synchronizedBooksData.push(bookData);
        return;
      }
    }

    postUserIntegrationKindleBookHighlights(bookData, kindleBookHighlights.highlights)
      .then((res) => {
        if (res.status === 200) {
          this.synchronizedBooksData.push(bookData);
          this.checkIsSyncFinish();
          this.resetRetryCount();
        } else if (res.status === 500) {
          this.retryCall(() => this.postKindleHighlightsToLINER(userInfo));
        }
      })
      .catch(() => {
        this.retryCall(() => this.postKindleHighlightsToLINER(userInfo));
      });
  }

  setInSyncStatus(page) {
    this.syncStartPage = page;
    this.syncStatus.value = this.syncStatus.inSync;
  }

  setInSilentSyncStatus(isOptimizationSync = false) {
    this.syncStatus.value = this.syncStatus.inSilentSync;
    this.isOptimizationSync = isOptimizationSync;
  }

  syncStart(page) {
    try {
      if (
        this.checkIsSyncStatus(this.syncStatus.ready) ||
        this.checkIsSyncStatus(this.syncStatus.inSilentSync)
      ) {
        this.setInSyncStatus(page);
        this.runScrapKindleBooksData(page);
      } else if (
        this.checkIsSyncStatus(this.syncStatus.inSync) &&
        Date.now() - this.syncStartTime < 1000 * 60 * 3 &&
        (!this.lastSyncTime || this.lastSyncTime < this.syncStartTime)
      ) {
        this.runScrapKindleBooksData(page);
      }
    } catch (err) {
      this.resetSyncManager();
      console.error(err);
    }
  }

  syncFinish() {
    this.lastSyncTime = Date.now();
    this.setUserIntegrationKindleBooksData();

    if (this.checkIsSyncStatus(this.syncStatus.inSync)) {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (res) => {
        const [page] = res;
        messageTo(page, 'RENDER_KINDLE_SYNC_TOAST', { syncStatus: this.syncStatus.finish });
      });
    }

    this.resetSyncManager();
  }

  checkIsSyncFinish() {
    if (this.inSyncBooksData.length === this.synchronizedBooksData.length) {
      this.syncFinish();
    }
  }

  async setUserIntegrationKindleBooksData() {
    this.userIntegrationKindleBooksData = await getUserIntegrationKindleBooks().then((res) =>
      res.json(),
    );
  }

  silentAutoSync(page) {
    const isGetlinerMyHighlights = page?.url.includes('getliner.com/my-highlights');

    try {
      if (
        this.checkIsSyncStatus(this.syncStatus.ready) &&
        this.lastSyncTime &&
        (isGetlinerMyHighlights || Date.now() - this.lastSyncTime > 1000 * 60 * 60 * 24)
      ) {
        this.setInSilentSyncStatus(isGetlinerMyHighlights);
        this.setUserIntegrationKindleBooksData();
        this.runScrapKindleBooksData();
      }
    } catch {
      this.resetSyncManager();
    }
  }
}

class GoogleSearchCounter {
  _tabId;
  _url;
  _cnt;

  constructor() {
    this._tabId = -1;
    this._url = '';
    this._cnt = 0;
  }

  init({ tabId, url }) {
    this._tabId = tabId;
    this._url = url;
    this._cnt = 0;
  }

  update({ tabId, url }) {
    if (tabId < 0 || !url) {
      return;
    }

    if (this._tabId !== tabId || this._url !== url) {
      this.init({ tabId, url });
    }

    this._cnt = this._cnt + 1;
  }

  getCnt({ tabId, url }) {
    if (tabId < 0 || !url) {
      return 0;
    }

    if (this._tabId !== tabId || this._url !== url) {
      this.init({ tabId, url });
    }

    return this._cnt;
  }
}
const googleSearchCounter = new GoogleSearchCounter();

var LINERKindleSyncManager = new LINER_KINDLE_SYNC_MANAGER();

var user = {};
var highlightedPages = {}; // Luke - URL - Dictionary
var sharingContent = '';
var tags = null;
var recommendedByLiner = {};
var membershipLimits = {};
var products = [];
var eventTarget = {};

const lksClickedPages = {};

var loginViewType = ''; // Luke - highlight, comment, save

// Luke - 아래 변수는 Safari Extension에는 없음
var disabledTabIDs = {}; // Luke - tabID - Boolean

// Luke - for lks
var sidCookie;
var prevPage = null;

var manifestData = chrome.runtime.getManifest();
var linerExtensionVersion = manifestData.version;

let searchKeyword = '';
let videoId = '';

let searchQuery = '';

let userOpenState = 'public';
let GCSConfig;

let geoRes;

function resetVariables(callback) {
  getUser(async function (result) {
    if (result) {
      const [isNewTabOn, uuid, cohortNumber, installedAt] = await Promise.allSettled([
        checkIsNewTabOnStorage(),
        getLinerUUIDStorage(),
        getLastNumberOfLinerUUID(),
        getLINERInstalledAt(),
      ]);

      chrome.tabs.query({}, function (tabs) {
        tabs.forEach(async (page) => {
          const url = page.url;

          messageTo(page, 'GET_INFO', {
            user,
            GCSConfig,
            isNewTabOn: isNewTabOn.value,
            cohortNumber: cohortNumber.value,
            installedAt: installedAt.value,
            uuid: uuid.value,
          });
        });
      });

      if (callback) callback();
    } else {
      removeSidCookieStorage();
      removeUserIdStorage();

      const [isNewTabOn, uuid, cohortNumber, installedAt] = await Promise.allSettled([
        checkIsNewTabOnStorage(),
        getLinerUUIDStorage(),
        getLastNumberOfLinerUUID(),
        getLINERInstalledAt(),
      ]);

      chrome.tabs.query({}, function (tabs) {
        tabs.forEach((page) => {
          messageTo(page, 'GET_INFO', {
            GCSConfig,
            isNewTabOn: isNewTabOn.value,
            cohortNumber: cohortNumber.value,
            installedAt: installedAt.value,
            uuid: uuid.value,
          });
        });
      });
    }
  });
}

// Luke - content -> background로 메세지가 옴
// Luke - 아래 함수의 형태는 Safari Extension과 최대한 유사한 구조로 구현함(Safari로부터의 Porting을 쉽게 하기 위함)
async function messageReceived(messageName, page, userInfo, port) {
  logger('message received - handler');
  logger(messageName);

  if (messageName === 'AMPLITUDE_USER_PROPERTY') {
    const { type, property, value } = userInfo;

    if (type === 'add') {
      incrementAmplitudeUserProperty(property, value);
    } else if (type === 'set') {
      setAmplitudeUserProperty(property, value);
    }

    return;
  } else if (messageName === 'AMPLITUDE_EVENT') {
    const { event_name: eventName, properties } = userInfo;
    sendAmplitudeData(eventName, properties);
  }

  const pageUrl = page?.url !== undefined ? page.url.split('&t=')[0] : '';

  if (messageName === 'LKS_EVENT') {
    const eventType = userInfo['type'];
    if (eventType === 'moment_create') {
      const document = userInfo['document'] ?? {};
      const moment = userInfo['moment'] ?? {};
      lksMomentCreate(
        user.id,
        document,
        moment,
        userInfo.access_type,
        userInfo.access_method,
        function (json) {},
      );
    } else if (eventType === 'highlight_create') {
      const document = userInfo['document'] ?? {};
      const phrase = userInfo['phrase'] ?? {};
      lksHighlightCreate(
        user.id,
        document,
        phrase,
        userInfo.access_type,
        userInfo.access_method,
        function (json) {},
      );
    } else if (eventType === 'doc_click') {
      const {
        document,
        click_type: clickType,
        access_type: accessType,
        access_method: accessMethod,
        referrer,
      } = userInfo;
      lksDocClick(user.id, clickType, document, accessType, accessMethod, referrer, () => {});
    } else if (eventType === 'video_click') {
      const {
        document,
        click_type: clickType,
        access_type: accessType,
        access_method: accessMethod,
      } = userInfo;
      lksVideoClick(user.id, clickType, document, accessType, accessMethod, () => {});
    } else if (eventType === 'search_engine_result_page') {
      lksSERP(
        user.id,
        userInfo['platform'],
        userInfo['query'],
        userInfo['page_number'],
        userInfo['section'],
        userInfo['documents'],
        function (json) {},
      );
    } else if (eventType === 'reaction' || eventType === 'cancel_reaction') {
      const { resourceType, reactionType, document, accessType, accessMethod } = userInfo;
      lksReaction(
        user.id,
        eventType,
        resourceType,
        reactionType,
        document,
        accessType,
        accessMethod,
        () => {},
      );
    }
    return;
  } else if (messageName === 'GET_DOCUMENTS') {
    const { type: getDocumentsType = 'google_pbl' } = userInfo;

    const GOOGLE_PBL = 'google_pbl';
    const YOUTUBE_PBL = 'youtube_pbl';

    switch (getDocumentsType) {
      case GOOGLE_PBL: {
        const { urls = [], scrap_cnt = 3, reaction_type } = userInfo;
        const NUM_OF_PHRASE = 7;
        const TOP_K = 3;

        Promise.all([
          lksGetDocuments(urls, { scrap_cnt }, NUM_OF_PHRASE, TOP_K, user?.id),
          postPblPagesHighlightUsers(urls, 10),
          getIsPBLSwitchOn(),
        ]).then(([documents, pblHighlightUsers, isPBLSwitchOn]) => {
          messageTo(page, 'GET_DOCUMENTS', {
            type: GOOGLE_PBL,
            urls,
            documents,
            pblHighlightUsers,
            isPBLSwitchOn,
          });

          documents.forEach((document) => {
            if (document.req_url !== undefined) {
              recommendedByLiner[document.req_url] = {
                source_type: 'picked_by_liner',
                phrases: document.phrases,
                is_from_serp: true,
              };
            }
          });
        });
        break;
      }
      case YOUTUBE_PBL: {
        const { urls = [], views, screen_type: screenType = 0 } = userInfo;
        const NUM_OF_PHRASE = 0;
        const TOP_K = Math.min(Math.floor(urls.length / 2), 20);

        lksGetVideos(urls, views, screenType, NUM_OF_PHRASE, TOP_K, user?.id, (json) => {
          let documents = json;

          messageTo(page, 'GET_DOCUMENTS', {
            type: YOUTUBE_PBL,
            documents,
          });
        });
        break;
      }
    }
  } else if (messageName === 'DELETE_ALL_HIGHLIGHTS') {
    messageTo(page, 'DELETE_ALL_HIGHLIGHTS', {});
    delete highlightedPages[getURLWithoutHash(pageUrl)];
    putPage([userInfo['page_id']], 0, 2, function (json) {});
    return;
  } else if (messageName === 'INITIAL_PAGE_HIGHLIGHT') {
    const {
      pageId,
      url,
      imageUrl,
      imageId,
      imageHighlight,
      v2Page,
      savedPage,
      eventCoordinate,
      thread,
    } = userInfo;
    messageTo(page, 'PAGE_HIGHLIGHT', {
      url,
      pageId,
      highlights: Adapter.v2SavedPageHighlightsToPageHighlights(
        savedPage?.highlights ?? [],
        savedPage?.openState,
      ),
      imageUrl,
      imageId,
      imageHighlight,
      context: 'SAVE_HIGHLIGHT',
      v2Page,
      savedPage,
      thread,
      eventCoordinate,
    });
  } else if (messageName === 'GET_SEARCH_QUERY') {
    searchQuery = userInfo.googleSearchQuery;
  } else if (messageName === 'GET_INFO') {
    const [isNewTabOn, uuid, cohortNumber, installedAt] = await Promise.allSettled([
      checkIsNewTabOnStorage(),
      getLinerUUIDStorage(),
      getLastNumberOfLinerUUID(),
      getLINERInstalledAt(),
    ]);
    messageTo(page, 'GET_INFO', {
      searchQuery,
      user,
      GCSConfig,
      isNewTabOn: isNewTabOn.value,
      cohortNumber: cohortNumber.value,
      installedAt: installedAt.value,
      uuid: uuid.value,
    });
    searchQuery = '';
  } else if (messageName === 'GET_INFO_AFTER_LOAD') {
    const uuid = await getLinerUUIDStorage();
    const cohortNumber = await getLastNumberOfLinerUUID();
    const isPBLSwitchOn = await getIsPBLSwitchOn();
    const installedAt = await getLINERInstalledAt();

    messageTo(page, 'GET_INFO_AFTER_LOAD', {
      user,
      GCSConfig,
      uuid,
      cohortNumber,
      isPBLSwitchOn,
      installedAt,
    });
  } else if (messageName === 'TOGGLE_NEW_TAB') {
    const { isTurningNewTabOn } = userInfo;
    if (isTurningNewTabOn) {
      setIsNewTabOnStorage('true');
    } else {
      setIsNewTabOnStorage('false');
    }
  } else if (messageName === 'INIT_GCS_CONFIG') {
    messageTo(page, 'INIT_GCS_CONFIG', GCSConfig);
    getExtensionConfigFromGCP((config) => {
      GCSConfig = config;
      messageTo(page, 'INIT_GCS_CONFIG', config);
    });
  } else if (messageName === 'EMBEDDED_YOUTUBE_AUTH') {
    messageTo(page, 'EMBEDDED_YOUTUBE_AUTH', {});
  } else if (messageName === 'POST_USER_PAGE_SAVED') {
    const { pageUrl, area } = userInfo;
    Promise.all([postUserPageSaved({ pageUrl }), getExtensionSettings('youtubeBookmark')]).then(
      ([response, isOnYoutubeBookmark]) => {
        messageTo(page, 'POST_USER_PAGE_SAVED', {
          area,
          response,
          isOnYoutubeBookmark,
        });
      },
    );
  } else if (messageName === 'POST_USER_PAGES_SAVED') {
    const { pageUrls, datasets, area } = userInfo;
    Promise.all([
      postUserPagesSaved(pageUrls),
      getExtensionSettings('googleBookmark'),
      getExtensionSettings('youtubeBookmark'),
    ]).then(([savedPages, isOnGoogleBookmark, isOnYoutubeBookmark]) => {
      messageTo(page, 'POST_USER_PAGES_SAVED', {
        savedPages,
        datasets,
        area,
        isOnGoogleBookmark,
        isOnYoutubeBookmark,
      });
    });
  } else if (messageName === 'GET_USER_FOLDERS') {
    const { area, context, datasetObj } = userInfo;
    Promise.all([getUserFolders(), APIS.getSpaces()]).then(([folders, { spaces }]) => {
      messageTo(page, 'GET_USER_FOLDERS', {
        area,
        context,
        folders,
        datasetObj,
        spaces,
      });
    });
  } else if (messageName === 'POST_FOLDER') {
    const { folderName, folderEmoji, dataset } = userInfo;
    postFolder(folderName, folderEmoji).then((folder) => {
      messageTo(page, 'POST_FOLDER', {
        folder,
        dataset,
      });

      if (folder.name) {
        putSavedPageFolder(dataset.savedPageId, folder.id);
      }
    });
  } else if (messageName === 'POST_COLLECTION') {
    const { name, emoji, description, openState } = userInfo;
    const response = await postCollection({ name, emoji, description, openState });
    messageTo(page, 'POST_COLLECTION', { response });
  } else if (messageName === 'DELETE_USER_SAVED_PAGE') {
    const { savedPageId, highlightUrl, dataset, relatedTarget } = userInfo;
    delete highlightedPages[getURLWithoutHash(highlightUrl)];
    deleteUserSavedPage(savedPageId).then(() => {
      messageTo(page, 'DELETE_USER_SAVED_PAGE', { dataset, relatedTarget, highlightUrl });
    });
  } else if (messageName === 'GOOGLE_DELETE_USER_SAVED_PAGE') {
    const { savedPageId, dataset } = userInfo;
    deleteUserSavedPage(savedPageId).then(() => {
      messageTo(page, 'GOOGLE_DELETE_USER_SAVED_PAGE', { dataset });
    });
  } else if (messageName === 'POST_PAGES') {
    let {
      url: bookmarkUrl,
      title,
      image,
      doc,
      favicon,
      area,
      index,
      relatedTarget,
      amplitude_properties,
      accessType,
      accessMethod,
    } = userInfo;
    const res = await APIS.postV2Page({
      title,
      url: bookmarkUrl,
      imageUrl: image,
      faviconUrl: favicon,
      highlights: [],
    });

    if (res.ok) {
      highlightedPages[getURLWithoutHash(bookmarkUrl)] = {
        page_id: res.savedPage.id,
        tags: [],
        style_items: 'W10=',
        share_id: res.savedPage.shareId,
        comments: [],
        new_highlights: [],
      };

      messageTo(page, 'GET_SHARE_ID', {
        shareId: res.savedPage.shareId,
      });
    }

    const { status, reason, scrapCount, activeDayCount, isDayFirst } = res.savedPage;
    handleSaveWebPageEvent(res.ok, status, reason, {
      ...amplitude_properties,
      active_page_count: scrapCount,
      active_day_count: activeDayCount,
      is_day_first: isDayFirst,
    });

    try {
      switch (area) {
        case 'youtube_main':
        case 'youtube_watch':
        case 'youtube_reco': {
          lksVideoCreate(user.id, 'video', doc, accessType, accessMethod, () => {});
          break;
        }
        case 'youtube_shorts': {
          lksVideoCreate(user.id, 'shorts', doc, accessType, accessMethod, () => {});
          break;
        }
      }
    } catch {}

    if ((area === 'youtube_watch' || area === 'right_click_option') && res.ok) {
      const savedPageCommunityResponse =
        Adapter.v2SavedPageResponseToSavedPageCommunityResponse(res);
      messageTo(page, 'FETCH_HIGHLIGHT_BE_BOX', {
        ...savedPageCommunityResponse,
        url: bookmarkUrl,
      });
      messageTo(page, 'OPEN_BE_BOX_WHEN_UPDATE_STYLE', {});
    }

    if ((area === 'youtube_watch' || area === 'right_click_option') && res.ok) {
      getSavedPageCommunity(res.savedPage.savedPageId).then((res) => {
        messageTo(page, 'FETCH_HIGHLIGHT_BE_BOX', { ...res, url: bookmarkUrl });
        messageTo(page, 'OPEN_BE_BOX_WHEN_UPDATE_STYLE', {});
      });
    }

    const pagesSavedPage = Adapter.v2PageResponseToPagesSavedPage(res);
    messageTo(page, 'POST_PAGES', {
      savedPage: pagesSavedPage,
      area,
      index,
      url: bookmarkUrl,
      relatedTarget,
      v2Res: res,
      thread: res.thread,
    });

    incrementAmplitudeUserProperty('scrap_count', 1);
  } else if (messageName === 'GET_FAVICONS') {
    const { domains, datasets } = userInfo;

    const getFaviconPromises = (domains) =>
      domains.map((domain) => {
        try {
          return getFavicon(domain, 256);
        } catch {
          return Promise.resolve();
        }
      });

    const faviconPromises = getFaviconPromises(domains);
    Promise.allSettled(faviconPromises).then((results) => {
      const faviconURLs = results.map((result) => {
        if (result.status === 'fulfilled') return result.value.url;

        return null;
      });

      messageTo(page, 'GET_FAVICONS', { faviconURLs, datasets });
    });
  } else if (messageName === 'GET_WEB_MESSAGE') {
    const isNewTabOn = await checkIsNewTabOnStorage();
    messageTo(page, 'GET_WEB_MESSAGE', {
      isNewTabOn,
      LINERVersion: linerExtensionVersion,
    });
  } else if (messageName === 'POST_WEB_MESSAGE') {
    const { isSwitchOn } = userInfo;
    if (isSwitchOn) {
      setIsNewTabOnStorage('true');
    } else {
      setIsNewTabOnStorage('false');
    }
  } else if (messageName === 'SET_IS_PBL_SWITCH_ON') {
    const { isOn } = userInfo;
    setIsPBLSwitchOn(isOn);
  } else if (messageName === 'OPEN_SIGNUP_POPUP') {
    const { createData, savedPage } = userInfo;
    setLoginPopupSavedPage({ ...savedPage, tab: page.id }).then(() => {
      chrome.windows.create(createData);
    });
  } else if (messageName === 'OPEN_CENTER_POPUP') {
    const { createData, areaType } = userInfo;
    chrome.windows.create({
      ...createData,
      url: `${createData.url}?tab=${page.id}&area-type=${areaType}`,
    });
  } else if (messageName === 'OPEN_POP_UP') {
    const { createData } = userInfo;
    chrome.windows.create(createData);
  } else if (messageName === 'NEW_TAB') {
    const { isOpenLinerNewTab = false, url = '' } = userInfo;
    if (isOpenLinerNewTab) {
      getNewTabUrl().then((url) => openTab(url, () => {}));
    } else {
      openTab(url, () => {});
    }
    return;
  } else if (messageName === 'NEW_TAB_WHILE_IN_CURRENT_TAB') {
    const { isOpenLinerNewTab = false, url = '' } = userInfo;
    if (isOpenLinerNewTab) {
      getNewTabUrl().then((url) => openTabWhileInCurrentTab(url, () => {}));
    } else {
      openTabWhileInCurrentTab(url, () => {});
    }
    return;
  } else if (messageName === 'LOGIN') {
    const cookie = userInfo['cookie'];
    if (cookie !== undefined) {
      // Luke - Chrome, Firefox, Whale은 자동으로 로그인되므로 loginWithSIDCookie는 하지 않아도 됨.
      // Luke - 하지만 user object가 세팅되어야 하기 때문에 getUser를 포함한 resetVariables는 해주어야 함
      resetVariables();
    } else {
      loginViewType = userInfo['type'];
    }
    return;
  } else if (messageName === 'CHANGE_TOOLBAR_ITEM') {
    const type = userInfo['type'] ?? 'enabled';
    if (type === 'enabled') {
      delete disabledTabIDs[page.id];
      setToolbarItem(page, localizeInServiceWorker('LINER'), 'saved');
    } else {
      disabledTabIDs[page.id] = true;
      setToolbarItem(
        page,
        userInfo['is_web_pdf']
          ? localizeInServiceWorker("Can't open LINER pop-up on the PDF file.")
          : localizeInServiceWorker('LINER is blocked on this website'),
        'blocked',
      );
    }
    return;
  } else if (messageName === 'ALERT') {
    alert(userInfo['alert_message']);
  } else if (messageName === 'CLOSE_TAB') {
    chrome.tabs.remove(page.id);
  } else if (messageName == 'SAVE_SHARING_CONTENT') {
    sharingContent = userInfo['content'] || '';
    return;
  } else if (messageName == 'GET_SHARING_CONTENT') {
    messageTo(page, 'GET_SHARING_CONTENT', {
      content: sharingContent,
    });
    return;
  } else if (messageName == 'CACHE_SHARE_PAGE') {
    getSharePage(userInfo['share_id']);
    return;
  } else if (messageName === 'SET_COLLECTION_TOOLTIP_CLICKED_DATE') {
    const { clickedDate } = userInfo;
    setCollectionTooltipClickedDate(clickedDate);
  } else if (messageName === 'SYNC_FOLDERS') {
    const { savedPageId, collectionIds } = userInfo;
    const res = await postSyncFolder(savedPageId, collectionIds);
    messageTo(page, 'SYNC_FOLDERS', { isSuccess: res.ok, collectionIds });
  } else if (messageName === 'OPEN_OPTIONS_PAGE') {
    chrome.runtime.openOptionsPage();
  } else if (messageName === 'CHECK_AND_REMOVE_DYNAMIC_HIGHLIGHTER') {
    const isOnYoutubeProgressHighlight = await getExtensionSettings('youtubeProgressHighlight');
    messageTo(page, 'CHECK_AND_REMOVE_DYNAMIC_HIGHLIGHTER', { isOnYoutubeProgressHighlight });
  } else if (messageName === 'GET_KINDLE_BOOKS') {
    LINERKindleSyncManager.syncStart(page);
  } else if (messageName === 'GET_KINDLE_BOOK_HIGHLIGHTS') {
    LINERKindleSyncManager.runScrapKindleBookHighlightData(userInfo);
  } else if (messageName === 'POST_KINDLE_HIGHLIGHTS_TO_LINER') {
    LINERKindleSyncManager.postKindleHighlightsToLINER(userInfo);
  } else if (messageName === 'SET_KINDLE_BOOKS_DATA') {
    LINERKindleSyncManager.setKindleBooksData(userInfo);
  } else if (messageName === 'CLEAR_AMAZON_LOGGED_IN_CHECKER') {
    LINERKindleSyncManager.clearAmazonLoggedInChecker();
  } else if (messageName === 'TRY_KINDLE_SILENT_AUTO_SYNC') {
    LINERKindleSyncManager.silentAutoSync(page);
  } else if (messageName === 'GET_LINER_VERSION') {
    messageTo(page, 'GET_LINER_VERSION', { linerExtensionVersion });
  } else if (messageName === 'SNIPPET_SAVED') {
    const { id, tab, saveId } = userInfo;
    messageTo({ id: tab }, 'SNIPPET_SAVED', { id, saveId });
  } else if (messageName === 'OPEN_SIDE_PANEL') {
    const {
      tabUrl,
      tabHtml,
      tabImageUrl,
      tabTitle,
      transcript,
      sourceType,
      pdfSavedPageId,
      pdfGroundSourceUrl,
      pdfGroundSourceId,
      openType,
    } = userInfo;

    sidePanelStore.update(page.id, {
      windowId: page.windowId,
      url: decodeURIComponent(getURLWithoutHash(tabUrl) ?? ''),
      html: tabHtml,
      imageUrl: tabImageUrl,
      title: tabTitle,
      sourceType,
      transcript,
      pdfSavedPageId,
      pdfGroundSourceUrl,
      pdfGroundSourceId,
      openType,
      tabId: page.id,
    });
    console.log('OPEN_SIDE_PANEL: ', page);
    openSidePanel({ tabId: page.id });
  } else if (messageName === 'ADD_QUERY') {
    const { query, openType } = userInfo;
    sidePanelStore.update(page.id, { query, openType });
    console.log(
      'ADD_QUERY panel and port: ',
      sidePanelStore.getSidePanel(page.id),
      sidePanelStore.getPort(page.id),
    );

    try {
      sidePanelStore
        .getPort(page.id)
        ?.postMessage({ name: 'ADD_QUERY', data: { query, openType } });
    } catch (err) {
      console.error(err);
    }
  }
  chrome.tabs.get(page.id, async function (pageWithProperties) {
    // Luke - 이렇게 page를 업데이트해주지 않으면 이유는 모르겠으나 page.title이 page.url로 뽑혀서 나옴. browser 객체의 버그인듯
    page = pageWithProperties;
    let title = page.title ?? 'No Title';
    let url = page.url;

    if (url !== undefined) {
      url = url.split('&t=')[0];
      if (url.includes('www.youtube.com')) {
        if (title.indexOf('(') === 0) {
          title = title.substring(title.indexOf(')') + 1, title.length).trim();
        }
      }

      const pageInfo = highlightedPages[getURLWithoutHash(url)];
      let pageID;
      if (pageInfo) {
        pageID = pageInfo['page_id'];
      }
      logger('pageID - ' + pageID);

      if (messageName == 'UPDATE_STYLE') {
        const {
          style_items: styleItems = 'W10=',
          highlight_url: highlightUrl = getUrlForHighlightInfo(url),
          is_creating_highlight: isCreatingHighlight,
          is_image_highlight: isImageHighlight,
          amplitude_properties: amplitudeProperties,
          snapshot,
          styleId,
          isFromIFrame,
          eventCoordinate,
        } = userInfo;

        const pageInfo = highlightedPages[getURLWithoutHash(highlightUrl)];
        const pageId = pageInfo?.page_id;

        if (pageId) {
          const highlights = Adapter.styleItemsToHighlights(styleItems);
          const res = await APIS.postV2SavedPage({ savedPageId: pageId, highlights });

          if (isImageHighlight) {
            messageTo(page, 'UPDATE_STYLE_IMAGE_HIGHLIGHT', {
              status: res.status,
              reason: res.reason,
              imageUrl: userInfo.image_highlight_url,
              imageId: userInfo.image_id,
              imageHighlight: userInfo.image_highlight,
              isCreatingHighlight,
            });
          }

          if (res.ok) {
            highlightedPages[getURLWithoutHash(highlightUrl)]['style_items'] = styleItems;
            updatePageHighlightsV2(getURLWithoutHash(highlightUrl), page, isCreatingHighlight, {
              pageId: res.page.id,
              highlights: Adapter.v2SavedPageHighlightsToPageHighlights(
                res.savedPage.highlights,
                res.savedPage.openState,
              ),
              highlightVar: highlightedPages[getURLWithoutHash(highlightUrl)],
              imageUrl: userInfo.image_highlight_url,
              imageId: userInfo.image_id,
              imageHighlight: userInfo.image_highlight,
              context: isCreatingHighlight ? 'SAVE_HIGHLIGHT' : 'REMOVE_HIGHLIGHT',
              eventCoordinate,
            });

            if (!isFromIFrame) {
              const savedPageCommunityResponse =
                Adapter.v2SavedPageResponseToSavedPageCommunityResponse(res);

              messageTo(page, 'FETCH_HIGHLIGHT_BE_BOX', {
                ...savedPageCommunityResponse,
                url: highlightUrl,
              });
              if (isCreatingHighlight) {
                messageTo(page, 'OPEN_BE_BOX_WHEN_UPDATE_STYLE', {});
              }
            }

            if (snapshot) {
              const snapshotDecoded = deserialize(snapshot);
              savedPageHighlightSnapshot(pageId, styleId, snapshotDecoded);
            }
          }
        } else {
          // Luke - 저장이 안된 페이지이므로 저장하기
          const imageURL = userInfo.image_url ?? '';
          const todayDateTime = getDateString(new Date());
          const res = await APIS.postV2Page({
            title,
            url: getURLWithoutHash(highlightUrl),
            imageUrl: imageURL,
            highlights: Adapter.styleItemsToHighlights(styleItems),
            localDate: todayDateTime,
          });

          const {
            ok,
            status,
            reason,
            scrapCount,
            activeDayCount,
            isDayFirst,
            page: v2Page,
            savedPage,
            thread,
          } = res;

          if (isImageHighlight) {
            messageTo(page, 'UPDATE_STYLE_IMAGE_HIGHLIGHT', {
              status,
              reason,
              imageUrl: userInfo.image_highlight_url,
              imageId: userInfo.image_id,
              imageHighlight: userInfo.image_highlight,
              isCreatingHighlight,
            });
          }

          handleSaveWebPageEvent(ok, status, reason, {
            active_page_count: scrapCount,
            active_day_count: activeDayCount,
            is_day_first: isDayFirst,
            ...amplitudeProperties,
          });

          if (res.ok) {
            highlightedPages[getURLWithoutHash(highlightUrl)] = {
              page_id: res.savedPage.id,
              new_page_id: res.page.id,
              tags: [],
              style_items: styleItems,
              share_id: res.savedPage.shareId,
              comments: [],
              new_highlights: [],
              highlight_url: getURLWithoutHash(highlightUrl),
            };

            messageTo(page, 'PAGE_INFO_WITHOUT_HIGHLIGHT_IMPORT', {
              ...highlightedPages[getURLWithoutHash(highlightUrl)],
              imageUrl: userInfo.image_highlight_url,
              imageId: userInfo.image_id,
              imageHighlight: userInfo.image_highlight,
              v2Page,
              savedPage,
              thread,
              eventCoordinate,
            });

            incrementAmplitudeUserProperty('scrap_count', 1);

            messageTo(page, 'GET_SHARE_ID', {
              shareId: res.savedPage.shareId,
            });

            messageTo(page, 'UPDATE_YTB_SAVED_BTN', {
              savedPage: { ...res.savedPage, savedPageId: res.savedPage.id },
            });

            if (!isFromIFrame) {
              const savedPageCommunityResponse =
                Adapter.v2SavedPageResponseToSavedPageCommunityResponse(res);

              messageTo(page, 'FETCH_HIGHLIGHT_BE_BOX', {
                ...savedPageCommunityResponse,
                url: highlightUrl,
              });

              if (isCreatingHighlight) {
                messageTo(page, 'OPEN_BE_BOX_WHEN_UPDATE_STYLE', {});
              }
            }

            if (snapshot) {
              const snapshotDecoded = deserialize(snapshot);
              savedPageHighlightSnapshot(res.savedPage.id, styleId, snapshotDecoded);
            }

            const { document, access_type: accessType, access_method: accessMethod } = userInfo;
            lksDocCreate(user.id, document, accessType, accessMethod, () => {});
          }
        }
      } else if (messageName == 'UPDATE_HIGHLIGHT') {
        const {
          highlight_id: highlightId,
          slot_id: slotId,
          highlight_url: highlightUrl = getUrlForHighlightInfo(url),
        } = userInfo;

        const pageInfo = highlightedPages[getURLWithoutHash(highlightUrl)];
        const pageId = pageInfo?.page_id;
        if (!pageId || !highlightId) return;

        postPagesPageIDHighlightID(pageId, highlightId, slotId, () => {});
      } else if (messageName === 'DOCUMENT_READY') {
        const collectionTooltipClickedDate = await getCollectionTooltipClickedDate();
        const originalUrl = url;
        const lastHost = new URL(originalUrl).hostname;
        setUninstallUrl(lastHost);

        const logTimeProperties = {
          url: originalUrl,
          url_domain: lastHost,
        };

        await logTimeMarkAndGetUserInfo(logTimeProperties);

        const { highlight_url: highlightUrl = getUrlForHighlightInfo(url) } = userInfo;

        if (isLoggedIn()) {
          const res = await APIS.postV2PageInfo(highlightUrl);
          logoutByResponse(res);

          if (res.ok && res.savedPage) {
            const pagesInfosResponse = Adapter.v2SavedPageResponseToPagesInfosResponse(res);

            const { item = {} } = pagesInfosResponse;
            const { pageId, tags, styleItems, shareId, lastUpdateTime } = item;

            highlightedPages[getURLWithoutHash(highlightUrl)] = {
              page_id: pageId,
              tags,
              style_items: styleItems,
              share_id: shareId,
              last_update_time: lastUpdateTime,
              comments: [],
              new_highlights: [],
            };

            const savedPageCommunityResponse =
              Adapter.v2SavedPageResponseToSavedPageCommunityResponse(res);
            messageTo(page, 'FETCH_HIGHLIGHT_BE_BOX', {
              ...savedPageCommunityResponse,
              url: highlightUrl,
            });

            const highlightVar = highlightedPages[getURLWithoutHash(item['url'])];
            messageTo(page, 'PAGE_INFO', {
              highlightVar,
              highlightUrl,
            });

            messageTo(page, 'GET_SHARE_ID', {
              shareId,
            });

            messageTo(page, 'DOCUMENT_READY', {
              clicked_page: lksClickedPages[removeTrailingSlash(highlightUrl)],
              collectionTooltipClickedDate,
            });

            updatePageHighlightsV2(getURLWithoutHash(highlightUrl), page, undefined, {
              highlights: Adapter.v2SavedPageHighlightsToPageHighlights(
                res.savedPage.highlights,
                res.savedPage.openState,
              ),
              highlightVar,
              context: 'DOCUMENT_READY',
            });
          } else {
            delete highlightedPages[getURLWithoutHash(highlightUrl)];

            updatePageHighlightsV2(getURLWithoutHash(highlightUrl), page, undefined, {
              highlights: [],
              context: 'DOCUMENT_READY',
            });

            messageTo(page, 'PAGE_INFO', {
              highlightUrl,
            });

            messageTo(page, 'DOCUMENT_READY', {
              clicked_page: lksClickedPages[removeTrailingSlash(highlightUrl)],
              collectionTooltipClickedDate,
            });

            messageTo(page, 'FETCH_HIGHLIGHT_BE_BOX', {});
          }

          delete lksClickedPages[removeTrailingSlash(highlightUrl)];
        }
      } else if (messageName === 'HANDLE_SAVE_WEB_PAGE_EVENT') {
        // 새 탭을 위한 이벤트 핸들러
        const { ok, status, reason, amplitudeProperties } = userInfo;
        handleSaveWebPageEvent(ok, status, reason, amplitudeProperties);
      } else if (messageName === 'SAVE_LKS_DOC_INFO_FOR_GOOGLE_DOC_CLICK') {
        const { lksDocument, url, clickType, accessType, accessMethod } = userInfo;
        lksClickedPages[url] = lksDocument;
        lksClickedPages[url].click_type = clickType;
        lksClickedPages[url].access_type = accessType;
        lksClickedPages[url].access_method = accessMethod;
      } else if (
        messageName === 'CREATE_HIGHLIGHT_BE_BOX' ||
        messageName === 'REMOVE_HIGHLIGHT_BE_BOX'
      ) {
        const { styleId, styleItems, url, snapshot, amplitudeProperties } = userInfo;
        const pageInfo = highlightedPages[getURLWithoutHash(url)];
        const savedPageId = pageInfo?.page_id;

        if (savedPageId) {
          const highlights = Adapter.styleItemsToHighlights(styleItems);
          const res = await APIS.postV2SavedPage({ savedPageId, highlights });

          if (res.ok) {
            highlightedPages[getURLWithoutHash(url)]['style_items'] = styleItems;

            if (messageName === 'REMOVE_HIGHLIGHT_BE_BOX') return;

            const savedPageCommunityResponse =
              Adapter.v2SavedPageResponseToSavedPageCommunityResponse(res);

            if (!snapshot) {
              messageTo(page, 'FETCH_HIGHLIGHT_BE_BOX', { ...savedPageCommunityResponse, url });
              return;
            }

            const snapshotDecoded = deserialize(snapshot);
            savedPageHighlightSnapshot(savedPageId, styleId, snapshotDecoded).then(() => {
              messageTo(page, 'FETCH_HIGHLIGHT_BE_BOX', { ...savedPageCommunityResponse, url });
            });
          }
        } else {
          const { image_url: imageUrl } = userInfo;
          const todayDateTime = getDateString(new Date());
          const res = await APIS.postV2Page({
            title,
            url: getURLWithoutHash(url),
            imageUrl,
            highlights: Adapter.styleItemsToHighlights(styleItems),
            localDate: todayDateTime,
          });

          const { ok, status, reason, scrapCount, activeDayCount, isDayFirst } = res;

          handleSaveWebPageEvent(ok, status, reason, {
            active_page_count: scrapCount,
            active_day_count: activeDayCount,
            is_day_first: isDayFirst,
            ...amplitudeProperties,
          });

          if (res.ok) {
            highlightedPages[getURLWithoutHash(url)] = {
              page_id: res.savedPage.id,
              new_page_id: res.page.id,
              tags: [],
              style_items: styleItems,
              share_id: res.savedPage.shareId,
              comments: [],
              new_highlights: [],
              highlight_url: getURLWithoutHash(url),
            };
            messageTo(page, 'UPDATE_PAGE_INFO_BE_BOX', { ...res });

            incrementAmplitudeUserProperty('scrap_count', 1);

            if (messageName === 'REMOVE_HIGHLIGHT_BE_BOX') return;

            const savedPageCommunityResponse =
              Adapter.v2SavedPageResponseToSavedPageCommunityResponse(res);

            if (!snapshot) {
              messageTo(page, 'FETCH_HIGHLIGHT_BE_BOX', {
                ...savedPageCommunityResponse,
                url,
              });
              return;
            }

            const snapshotDecoded = deserialize(snapshot);
            savedPageHighlightSnapshot(res.savedPage.id, styleId, snapshotDecoded).then(() => {
              messageTo(page, 'FETCH_HIGHLIGHT_BE_BOX', {
                ...savedPageCommunityResponse,
                url,
              });
            });

            const { document, access_type: accessType, access_method: accessMethod } = userInfo;
            if (accessType === 'recommended_by_youtube') {
              lksVideoCreate(user.id, 'video', document, accessType, accessMethod, () => {});
            } else {
              lksDocCreate(user.id, document, accessType, accessMethod, () => {});
            }
          }
        }
      } else if (messageName === 'CHANGE_HIGHLIGHT_COLOR_BE_BOX') {
        const { styleId, slotId, url } = userInfo;
        const pageInfo = highlightedPages[getURLWithoutHash(url)];
        const pageId = pageInfo?.page_id;

        postPagesPageIDHighlightID(pageId, styleId, slotId, () => {});
      } else if (messageName === 'CREATE_ANNOTATION_BE_BOX') {
        const { highlightId, annotationInfo, url } = userInfo;
        postAnnotation(highlightId, annotationInfo, async () => {
          const res = await APIS.postV2PageInfo(getURLWithoutHash(url));
          const savedPageCommunityResponse =
            Adapter.v2SavedPageResponseToSavedPageCommunityResponse(res);
          messageTo(page, 'FETCH_HIGHLIGHT_BE_BOX', { ...savedPageCommunityResponse, url });
        });
      } else if (messageName === 'CHANGE_ANNOTATION_BE_BOX') {
        const { highlightId, annotationId, annotationInfo } = userInfo;
        editAnnotation(highlightId, annotationId, annotationInfo);
      } else if (messageName === 'UPLOAD_MISSING_SNAPSHOT_BE_BOX') {
        const { savedPageId, styleId, snapshot } = userInfo;
        const snapshotDecoded = deserialize(snapshot);
        savedPageHighlightSnapshot(savedPageId, styleId, snapshotDecoded);
      } else if (messageName === 'INIT_AMPLITUDE') {
        amplitude = makeAmplitude();
        initAmplitude();
      } else if (messageName === 'SET_LINER_VERSION') {
        setLINERVersionStorage(chrome.runtime.getManifest().version);
      } else if (messageName === 'SET_EXTENSION_PIN') {
        const { isRenderable } = userInfo;
        await setIsExtensionPinRenderable(isRenderable);
      } else if (messageName === 'GET_READABILITY_DOCUMENT') {
        const { pageUrl } = userInfo;
        const document = await getDocument(pageUrl);
        messageTo(page, 'GET_READABILITY_DOCUMENT', { document, pageUrl });
      } else if (messageName === 'CLOSE_CURRENT_TAB') {
        chrome.tabs.remove(page.id);
      } else if (messageName === 'SELECT_COLLECTION') {
        const { tabId, savedPageId } = userInfo;
        chrome.tabs.query({}, function (tabs) {
          tabs.some((tab) => {
            if (tab.id === tabId) {
              getSavedPageCommunity(savedPageId).then((res) => {
                messageTo(tab, 'FETCH_HIGHLIGHT_BE_BOX', {
                  ...res,
                  url: tab.url,
                  isAfterCollectionWindow: true,
                });
              });
              return true;
            }
          });
        });
      } else if (messageName === 'POST_SERP_CHAT_SEARCH') {
        const { query, uuid, userId, items, modelType } = userInfo;
        APIS.postSERPChatSearch(page, { query, uuid, userId, items, modelType });
      } else if (messageName === 'POST_COPILOT_CHAT') {
        const { uniqueId, url, query, order, startByCopilot, modelType } = userInfo;
        APIS.postCopilotChat(page, { uniqueId, url, query, order, startByCopilot, modelType });
      } else if (messageName === 'POST_COPILOT_EXPLAIN_GOOGLE_SEARCH_QUERY') {
        const { uniqueId, url, order, lang, html, query } = userInfo;
        APIS.postExplainGoogleSearchQuery(page, {
          uniqueId,
          url,
          order,
          lang,
          html,
          query,
        });
      } else if (messageName === 'POST_COPILOT_FIND_CORE_SENTENCE') {
        const { uniqueId, url, order, lang, html } = userInfo;
        APIS.postFindCoreSentence(page, {
          uniqueId,
          url,
          order,
          lang,
          html,
        });
      } else if (messageName === 'POST_TOOLTIP_SIMPLIFY') {
        const { uniqueId, text, url, order, startByCopilot } = userInfo;
        APIS.postTooltipSimplify(page, { uniqueId, text, url, order, startByCopilot });
      } else if (messageName === 'POST_TOOLTIP_EXPLAIN') {
        const { uniqueId, text, url, order } = userInfo;
        APIS.postTooltipExplain(page, { uniqueId, text, url, order });
      } else if (messageName === 'POST_TOOLTIP_PARAPHRASE_STREAM') {
        const { uniqueId, text, url, order } = userInfo;
        APIS.postTooltipParaphraseStream(page, { uniqueId, text, url, order });
      } else if (messageName === 'POST_TOOLTIP_COMMAND') {
        const { uniqueId, text, url, order, command } = userInfo;
        APIS.postTooltipCommand(page, { uniqueId, text, url, order, command });
      } else if (messageName === 'POST_PDF_SAVED_PAGE_CHAT_STREAM') {
        const { query, savedPageId, timezoneOffset, order, modelType } = userInfo;
        APIS.postPDFSavedPageChatStream(page, {
          query,
          savedPageId,
          timezoneOffset,
          order,
          modelType,
        });
      } else if (messageName === 'POST_PDF_SAVED_PAGE_GREETING_STREAM') {
        const { query, savedPageId } = userInfo;
        APIS.postPDFSavedPageGreetingStream(page, { query, savedPageId });
      } else if (messageName === 'POST_COPILOT_YTB_CHAT') {
        const { uniqueId, url, query, order, modelType } = userInfo;
        APIS.postCopilotYtbChat(page, { uniqueId, url, query, order, modelType });
      } else if (messageName === 'POST_COMMON_LOGS') {
        const { cookie, props } = userInfo;
        APIS.postCommonLogs(cookie, props);
      } else if (messageName === 'POST_COPILOT_GMAIL_DRAFT_COMPOSE') {
        const { uniqueId, conversationId, query, lang, order, userName, userEmail } = userInfo;
        APIS.postCopilotGmailDraftCompose(page, {
          uniqueId,
          conversationId,
          query,
          lang,
          order,
          userName,
          userEmail,
        });
      } else if (messageName === 'POST_COPILOT_GMAIL_DRAFT_REPLY') {
        const { uniqueId, conversationId, query, emailThread, order, userName, userEmail } =
          userInfo;
        APIS.postCopilotGmailDraftReply(page, {
          uniqueId,
          conversationId,
          query,
          emailThread,
          order,
          userName,
          userEmail,
        });
      } else if (messageName === 'SYNC_MEMBERSHIP_AND_LIMITS') {
        membershipLimits = {};
        Promise.all([APIS.getUserMeMembership(), APIS.getUserMeMembershipLimits()]).then(
          ([membership, limits]) => {
            membershipLimits = { ...limits };
            chrome.tabs.query({}, function (tabs) {
              tabs.forEach((page) => {
                messageTo(page, 'UPDATE_MEMBERSHIP', membership);
                messageTo(page, 'UPDATE_MEMBERSHIP_LIMITS', limits);
                messageTo(page, 'REMOVE_LEGACY_UPGRADE_NUDGE', {});
              });
            });
            updateMembershipSidePanels({
              membership,
            });
          },
        );
      } else if (messageName === 'POST_PDF_BETTER_ANSWER') {
        APIS.postPdfBetterAnswer(page, userInfo);
      } else if (messageName === 'POST_WEB_TRANSLATION_BETTER_ANSWER') {
        APIS.postWebTranslationBetterAnswer(page, userInfo);
      } else if (messageName === 'POST_WEB_SIMPLIFICATION_BETTER_ANSWER') {
        APIS.postWebSimplificationBetterAnswer(page, userInfo);
      } else if (messageName === 'POST_WEB_EXPLANATION_BETTER_ANSWER') {
        APIS.postWebExplanationBetterAnswer(page, userInfo);
      } else if (messageName === 'POST_WEB_CHAT_BETTER_ANSWER') {
        APIS.postWebChatBetterAnswer(page, userInfo);
      } else if (messageName === 'POST_YOUTUBE_BETTER_ANSWER') {
        APIS.postYoutubeChatBetterAnswer(page, userInfo);
      } else if (messageName === 'POST_GMAIL_COMPOSE_BETTER_ANSWER') {
        APIS.postGmailComposeBetterAnswer(page, userInfo);
      } else if (messageName === 'POST_GMAIL_DRAFT_BETTER_ANSWER') {
        APIS.postGmailDraftBetterAnswer(page, userInfo);
      } else if (messageName === 'POST_SERP_BETTER_ANSWER') {
        APIS.postSERPBetterAnswer(page, userInfo);
      } else if (messageName === 'REQUEST_IAP') {
        sendNativeMessage(NATIVE_MESSAGE_NAME.REQUEST_IAP);
      } else if (messageName === 'POST_DRAFT_ASSISTANT') {
        APIS.postDraftAssistant(page, {
          ...userInfo,
        });
      } else if (messageName === 'LINER_WINDOW_CLOSE') {
        chrome.tabs.query({ windowId: page.windowId }, function (tabs) {
          if (
            tabs.length === 1 &&
            (page.url.includes('getliner.com') || page.url.includes('localhost:3001'))
          ) {
            chrome.windows.remove(page.windowId);
          }
        });
      } else if (messageName === 'LOG_OUT') {
        logout();
        logoutToSidePanels();
      }
    }
  });
}

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === 'sidePanel') {
    handleConnectSidePanel(port);
    return;
  }

  port.onMessage.addListener(function (message) {
    messageReceived(message.name, port.sender.tab, message.message, port);
  });

  port.onDisconnect.addListener(deletePortTimer);
  port._timer = setTimeout(forceReconnect, 1000 * 60, port);
});

const messageHandler = (message, sender, sendResponse) => {
  const { name: messageName, data } = message;

  if (messageName === 'POST_ANNOTATION_V3') {
    const { highlightId, content } = data;
    (async () => {
      const res = await postAnnotationV3(highlightId, content);
      sendResponse(res);
    })();
  } else if (messageName === 'PUT_ANNOTATION_V3') {
    const { highlightId, annotationId, content } = data;
    (async () => {
      const res = await putAnnotationV3(highlightId, annotationId, content);
      sendResponse(res);
    })();
  } else if (messageName === 'DELETE_ANNOTATION_V3') {
    const { highlightId, annotationId } = data;
    (async () => {
      const res = await deleteAnnotation(highlightId, annotationId);
      sendResponse(res);
    })();
  } else if (messageName === 'NEW_GET_HIGHLIGHT_INFO') {
    const { highlightId } = data;
    (async () => {
      const res = await getHighlightInfo(highlightId);
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.V2_POST_PAGE_INFO) {
    const { pageUrl } = data;
    (async () => {
      const res = await APIS.postV2PageInfo(pageUrl);
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.V2_POST_SAVED_PAGE) {
    const { savedPageId, highlights } = data;
    (async () => {
      const res = await APIS.postV2SavedPage({
        savedPageId,
        highlights,
      });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.V2_POST_PAGE) {
    const { page, amplitudeProperties } = data;
    (async () => {
      const res = await APIS.postV2Page(page);
      sendAmplitudeData('save_web_page', {
        active_day_count: res?.activeDayCount,
        is_day_first: res?.isDayFirst,
        ...amplitudeProperties,
      });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.V2_GET_USER_THEME) {
    (async () => {
      const res = await APIS.getV2UserTheme();
      sendResponse(res);
    })();
  } else if (messageName === 'POST_SNIPPET') {
    const { imageUrl, title, description, faviconUrl, amplitudeProperties } = data;
    const localDate = getDateString(new Date());
    (async () => {
      const res = await APIS.postSnippet({ imageUrl, title, description, faviconUrl, localDate });
      const { ok, status, reason, activeDayCount, isDayFirst } = res;

      handleSaveWebPageEvent(ok, status, reason, {
        active_day_count: activeDayCount,
        is_day_first: isDayFirst,
        ...amplitudeProperties,
      });

      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_RECOMMENDATION_VALIDATE) {
    const { url, html } = data;
    (async () => {
      const res = await postRecommendationValidate(url, html);
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_SUMMARIZE) {
    const { url, html } = data;
    (async () => {
      const res = await APIS.postSummarize({ url, html });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_SIMPLIFY) {
    const { url, html } = data;
    (async () => {
      const res = await APIS.postSimplify({ url, html });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_EXTENSION_CHAT) {
    const { query, references, conversationId } = data;
    (async () => {
      const res = await APIS.postExtensionChat({
        query,
        references,
        conversationId,
        uniqueId: user.id || (await getLinerUUIDStorage()),
      });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_EXTENSION_RECOMMENDATION_CONTENT) {
    const { conversationId, withSearch } = data;
    (async () => {
      const res = await APIS.postExtensionRelatedContent({
        conversationId,
        withSearch,
      });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_EXTENSION_RECOMMENDATION_QUERY) {
    const { conversationId } = data;
    (async () => {
      const res = await APIS.postExtensionRecommendationQuery({
        conversationId,
      });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_USERS_ME) {
    (async () => {
      if (isLoggedIn()) {
        sendResponse({
          ok: true,
          ...user,
        });
      } else {
        getUser((result) => {
          if (result) {
            sendResponse({ ok: true, ...user });
          } else {
            sendResponse({ ok: false });
          }
        });
      }
    })();
  } else if (messageName === MESSAGE_NAME.PATCH_HIGHLIGHT_SLOT_ID) {
    const { savedPageId, highlightId, slotId } = data;
    (async () => {
      const res = await APIS.patchHighlightSlotId({ savedPageId, highlightId, slotId });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.DELETE_HIGHLIGHT) {
    const { highlightId } = data;
    (async () => {
      const res = await APIS.deleteHighlight({ highlightId });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.V2_UPLOAD_PDF) {
    const { fileInfo } = data;
    (async () => {
      const pdfBlob = await fetch(fileInfo.fileURL).then((r) => r.blob());
      const formData = new FormData();
      formData.append('file', pdfBlob, fileInfo.fileName);
      const res = await APIS.postUserFilePdf({ formData });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_PDF_SOURCE_BY_URL) {
    const { url } = data;
    (async () => {
      const res = await APIS.getPDFSourceByUrl({ url });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_PDF_UPLOAD_PROGRESS) {
    const { savedPageId } = data;
    (async () => {
      const res = await APIS.getPDFUploadProgress({ savedPageId });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_PDF_CONTROLLER_NUDGE) {
    (async () => {
      const res = await storage.getItemV2(STORAGE_KEY.PDF_CONTROLLER_NUDGE);
      sendResponse({ ok: true, hasPDFControllerNudge: res ?? true });
    })();
  } else if (messageName === MESSAGE_NAME.SET_PDF_CONTROLLER_NUDGE) {
    const { hasPDFControllerNudge } = data;
    (async () => {
      await storage.setItem(STORAGE_KEY.PDF_CONTROLLER_NUDGE, hasPDFControllerNudge);
      sendResponse({ ok: true, hasPDFControllerNudge });
    })();
  } else if (messageName === MESSAGE_NAME.GET_PDF_CHAT_LEFT_COUNT) {
    (async () => {
      const { timezoneOffset } = data;
      const res = await APIS.getPDFChatLeftCount(timezoneOffset);
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_PDF_CHAT_NEXT_QUERIES) {
    (async () => {
      const { savedPageId, query } = data;
      const res = await APIS.postPDFChatNextQueries(savedPageId, query);
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_IS_LINER_CHAT_NEW_TAB_COHORT) {
    (() => {
      const res = getIsLinerChatNewTabCohort();
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_TRANSLATOR_LANGUAGES) {
    (async () => {
      const res = await getTranslatorLanguages();
      sendResponse({ ok: true, langs: res });
    })();
  } else if (messageName === MESSAGE_NAME.SET_DEFAULT_TRANSLATOR_LANGUAGES) {
    (async () => {
      const { targetLang } = data;
      const res = await setDefaultTranslatorLanguage(targetLang);
      sendResponse({ ok: true, langs: res });
    })();
  } else if (messageName === MESSAGE_NAME.POST_COPILOT_ACTIVATION) {
    (async () => {
      const { uniqueId, html, url } = data;
      const res = await APIS.postCopilotActivation({ uniqueId, html, url });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_COPILOT_YTB_LEFT_COUNT) {
    (async () => {
      const { uniqueId } = data;
      const res = await APIS.getYtbCopilotLeftCount({ uniqueId });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_COPILOT_YTB_ACTIVATION) {
    (async () => {
      const { uniqueId, transcript, url } = data;
      const res = await APIS.postYtbCopilotActivation({ uniqueId, transcript, url });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_COPILOT_RECOMMENDATION_QUERY) {
    (async () => {
      const { uniqueId, url } = data;
      const res = await APIS.postCopilotRecommendationQuery({ uniqueId, url });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_COPILOT_YTB_RECOMMENDATION_QUERY) {
    (async () => {
      const { uniqueId, url } = data;
      const res = await APIS.postYtbCopilotRecommendationQuery({ uniqueId, url });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_COPILOT_RECOMMENDATION_CONTENT) {
    (async () => {
      const { uniqueId, url, lang } = data;
      const res = await APIS.postCopilotRecommendationContent({ uniqueId, url, lang });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_TOOLTIP_TRANSLATE) {
    (async () => {
      const { uniqueId, text, targetLang, url } = data;
      const res = await APIS.postTooltipTranslate({ uniqueId, text, targetLang, url });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_SERP_CHAT_LEFT_COUNT) {
    (async () => {
      const { uuid, userId } = data;
      const res = await APIS.getSERPChatLeftCount(uuid, userId);
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_UUID) {
    (async () => {
      const uuid = await getLinerUUIDStorage();
      sendResponse({ ok: true, uuid });
    })();
  } else if (messageName === MESSAGE_NAME.POST_SERP_CHAT_RELATED_QUERIES) {
    (async () => {
      const { query, answer } = data;
      const res = await APIS.postSERPChatRelatedQueries({ query, answer });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_USER_ME_MEMBERSHIP_LIMITS) {
    (async () => {
      if (!isLoggedIn()) {
        membershipLimits = {};
        sendResponse({ ok: false });
      } else if (Object.keys(membershipLimits).length > 0) {
        sendResponse({ ok: true, ...membershipLimits });
      } else {
        const res = await APIS.getUserMeMembershipLimits();
        membershipLimits = { ...res };
        sendResponse(res);
      }
    })();
  } else if (messageName === MESSAGE_NAME.GET_SEARCH_EXTRACT_KEYWORDS) {
    const { query } = data;
    (async () => {
      const res = await APIS.getSearchExtractKeywords(query);
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_CONFIG_JSON) {
    (async () => {
      const res = await APIS.getConfigJSON();
      if (res && res.ok && res.side_panel?.isOn === false && isSidePanelAvailable) {
        closePanel();
      }
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_EXTENSION_SETTINGS_YTB_BOOKMARK) {
    (async () => {
      const res = await getExtensionSettings('youtubeBookmark');
      sendResponse({ ok: true, isOnYoutubeBookmark: res });
    })();
  } else if (messageName === MESSAGE_NAME.DELETE_SAVED_PAGE) {
    (async () => {
      const { savedPageId } = data;
      const res = await APIS.deleteSavedPage(savedPageId);
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_DEVICE_ID) {
    (async () => {
      const res = await amplitude;
      const { deviceId } = res.getInstance().options;
      sendResponse({
        ok: true,
        deviceId,
      });
    })();
  } else if (messageName === MESSAGE_NAME.GET_GOOGLE_SERP) {
    (async () => {
      const { keyword } = data;
      try {
        const res = await fetch(`https://www.google.com/search?q=${keyword}&num=100`).then((res) =>
          res.text(),
        );
        sendResponse({
          ok: true,
          html: res,
        });
      } catch (e) {
        sendResponse({
          ok: false,
          error: e,
        });
      }
    })();
  } else if (messageName === MESSAGE_NAME.SET_POPUP) {
    (async () => {
      const { isEnabled } = data;
      chrome.action.setPopup({
        popup: isEnabled ? '../popup/popup.html' : '',
      });
      sendResponse({
        ok: true,
      });
    })();
  } else if (messageName === MESSAGE_NAME.GET_GOOGLE_SEARCH_COUNT) {
    (async () => {
      const { tab, url } = sender;
      const cnt = googleSearchCounter.getCnt({ tabId: tab.id, url });
      sendResponse({ ok: true, cnt });
    })();
  } else if (messageName === MESSAGE_NAME.UPDATE_GOOGLE_SEARCH_COUNT) {
    (async () => {
      const { tab, url } = sender;
      googleSearchCounter.update({ tabId: tab.id, url });
      sendResponse({ ok: true });
    })();
  } else if (messageName === MESSAGE_NAME.POST_EXTRACT_HIGHLIGHT) {
    (async () => {
      const { uniqueId, url, html } = data;
      const res = await APIS.postExtractHighlight({ uniqueId, url, html });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_DAILY_BANNER_USAGE) {
    (async () => {
      const res = await getDailyBannerUsage();
      sendResponse({ ok: true, ...res });
    })();
  } else if (messageName === MESSAGE_NAME.UPDATE_DAILY_BANNER_USAGE) {
    (async () => {
      const { type } = data;
      await updateDailyBannerUsage(type);
      sendResponse({ ok: true });
    })();
  } else if (messageName === MESSAGE_NAME.GET_DAILY_AUTO_AI_USAGE) {
    (async () => {
      const res = await getDailyAutoAIUsage();
      sendResponse({ ok: true, ...res });
    })();
  } else if (messageName === MESSAGE_NAME.UPDATE_DAILY_AUTO_AI_USAGE) {
    (async () => {
      const { type } = data;
      await updateDailyAutoAIUsage(type);
      sendResponse({ ok: true });
    })();
  } else if (messageName === MESSAGE_NAME.POST_COPILOT_GMAIL_DRAFT_REPLY_OPTIONS) {
    (async () => {
      const { uniqueId, emailThread, lang } = data;
      const res = await APIS.postCopilotGmailDraftReplyOptions({
        uniqueId,
        emailThread,
        lang,
      });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_ANONYMOUS_USER_SELECTION_TOOLTIP_USAGE) {
    (async () => {
      const res = await getAnonymousUserSelectionTooltipUsage();
      sendResponse({ ok: true, ...res });
    })();
  } else if (messageName === MESSAGE_NAME.UPDATE_ANONYMOUS_USER_SELECTION_TOOLTIP_USAGE) {
    (async () => {
      const { isAlreadyShown } = data;
      await updateAnonymousUserSelectionTooltipUsage(isAlreadyShown);
      sendResponse({ ok: true });
    })();
  } else if (messageName === MESSAGE_NAME.POST_TOOLTIP_PARAPHRASE) {
    (async () => {
      const { uniqueId, conversationId, query, option, numOfResults } = data;

      const res = await APIS.postTooltipParaphrase({
        uniqueId,
        conversationId,
        query,
        option,
        numOfResults,
      });
      sendResponse({
        ok: true,
        ...res,
      });
    })();
  } else if (messageName === MESSAGE_NAME.POST_TOOLTIP_GRAMMAR) {
    (async () => {
      const { uniqueId, text } = data;
      const res = await APIS.postTooltipGrammar({
        uniqueId,
        text,
      });

      sendResponse({
        ok: true,
        ...res,
      });
    })();
  } else if (messageName === MESSAGE_NAME.POST_TOOLTIP_CUSTOM) {
    (async () => {
      const { uniqueId, text, command } = data;
      const res = await APIS.postTooltipCustom({
        uniqueId,
        text,
        command,
      });
      sendResponse({
        ok: true,
        ...res,
      });
    })();
  } else if (messageName === MESSAGE_NAME.GET_AUTH_COOKIE) {
    (async () => {
      const res = await APIS.getAuthCookie();
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_USER_ME_MEMBERSHIP) {
    (async () => {
      if (isLoggedIn()) {
        const res = await APIS.getUserMeMembership();
        sendResponse(res);
      } else {
        sendResponse({ ok: false });
      }
    })();
  } else if (messageName === MESSAGE_NAME.GET_USER_ME_VIRAL_HOST_KEY) {
    (async () => {
      const res = await APIS.getUserMeViralHostKey();
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_USER_ME_VIRAL_HOST_KEY_FOR_PROJECT) {
    (async () => {
      const res = await APIS.getUserMeViralHostKey(data?.projectName);
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_SEARCH_FIND_ENTITIES) {
    (async () => {
      const { answer } = data;
      const res = await APIS.postSearchFindEntities({ answer });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_COPILOT_CHAT_FREE_TRIAL_NUDGE_DATE) {
    (async () => {
      const res = await storage.getItemV2(STORAGE_KEY.COPILOT_CHAT_FREE_TRIAL_NUDGE_DATE);
      sendResponse({ ok: true, date: res });
    })();
  } else if (messageName === MESSAGE_NAME.POST_COPILOT_CHAT_FREE_TRIAL_NUDGE_DATE) {
    (async () => {
      const { date } = data;
      const res = await storage.setItemV2(STORAGE_KEY.COPILOT_CHAT_FREE_TRIAL_NUDGE_DATE, date);
      sendResponse({ ok: true, date: res });
    })();
  } else if (messageName === MESSAGE_NAME.GET_PDF_CHAT_FREE_TRIAL_NUDGE_DATE) {
    (async () => {
      const res = await storage.getItemV2(STORAGE_KEY.PDF_CHAT_FREE_TRIAL_NUDGE_DATE);
      sendResponse({ ok: true, date: res });
    })();
  } else if (messageName === MESSAGE_NAME.POST_PDF_CHAT_FREE_TRIAL_NUDGE_DATE) {
    (async () => {
      const { date } = data;
      const res = await storage.setItemV2(STORAGE_KEY.PDF_CHAT_FREE_TRIAL_NUDGE_DATE, date);
      sendResponse({ ok: true, date: res });
    })();
  } else if (messageName === MESSAGE_NAME.GET_IS_COPILOT_FREE_TRIAL_CLOSE_SIDEBAR_MODAL_SHOWN) {
    (async () => {
      const res = await storage.getItemV2(
        STORAGE_KEY.IS_COPILOT_FREE_TRIAL_CLOSE_SIDEBAR_MODAL_SHOWN,
      );
      sendResponse({ ok: true, isShown: res });
    })();
  } else if (messageName === MESSAGE_NAME.POST_IS_COPILOT_FREE_TRIAL_CLOSE_SIDEBAR_MODAL_SHOWN) {
    (async () => {
      const { isShown } = data;
      const res = await storage.setItemV2(
        STORAGE_KEY.IS_COPILOT_FREE_TRIAL_CLOSE_SIDEBAR_MODAL_SHOWN,
        isShown,
      );
      sendResponse({ ok: true, isShown: res });
    })();
  } else if (messageName === MESSAGE_NAME.GET_IS_PDF_FREE_TRIAL_CLOSE_SIDEBAR_MODAL_SHOWN) {
    (async () => {
      const res = await storage.getItemV2(STORAGE_KEY.IS_PDF_FREE_TRIAL_CLOSE_SIDEBAR_MODAL_SHOWN);
      sendResponse({ ok: true, isShown: res });
    })();
  } else if (messageName === MESSAGE_NAME.POST_IS_PDF_FREE_TRIAL_CLOSE_SIDEBAR_MODAL_SHOWN) {
    (async () => {
      const { isShown } = data;
      const res = await storage.setItemV2(
        STORAGE_KEY.IS_PDF_FREE_TRIAL_CLOSE_SIDEBAR_MODAL_SHOWN,
        isShown,
      );
      sendResponse({ ok: true, isShown: res });
    })();
  } else if (messageName === MESSAGE_NAME.GET_OPT_IN) {
    (async () => {
      const res = (await storage.getItemV2(STORAGE_KEY.OPT_IN)) || {};
      sendResponse({ ok: true, optIn: res });
    })();
  } else if (messageName === MESSAGE_NAME.GET_OPT_IN_FAMILY) {
    (async () => {
      const { type, domain } = data;
      const optIn = (await storage.getItemV2(STORAGE_KEY.OPT_IN)) || {};
      const isAllOptIn = optIn?.all?.[type] === undefined ? true : optIn?.all?.[type];
      const isDomainOptIn = optIn?.[domain]?.[type] === undefined ? true : optIn?.[domain]?.[type];
      sendResponse({ ok: true, isOptIn: isAllOptIn && isDomainOptIn });
    })();
  } else if (messageName === MESSAGE_NAME.POST_OPT_IN_FAMILY) {
    (async () => {
      const { type, domain, newValue } = data;
      const optIn = (await storage.getItemV2(STORAGE_KEY.OPT_IN)) || {};
      await storage.setItemV2(STORAGE_KEY.OPT_IN, {
        ...optIn,
        [domain]: {
          ...optIn?.[domain],
          [type]: newValue,
        },
      });
      sendResponse({ ok: true });
    })();
  } else if (messageName === MESSAGE_NAME.GET_HTML) {
    (async () => {
      const { url } = data;
      const res = await APIS.getHTML(url);
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_PRODUCTS) {
    (async () => {
      const res = await APIS.getProducts();
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_SHARED_YOUTUBE_SUMMARY_PAGE) {
    (async () => {
      const res = await APIS.postSharedYoutubeSummaryPage(data);
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_SHARED_YOUTUBE_SUMMARY_PAGE_TRANSCRIPTS) {
    (async () => {
      const res = await APIS.postSharedYoutubeSummaryPageTranscripts(data);
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_SHARED_YOUTUBE_SUMMARY_PAGE_ACTIVATE) {
    (async () => {
      const res = await APIS.postSharedYoutubeSummaryPageActivate(data);
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_PREV_GOOGLE_SEARCH_QUERY) {
    (async () => {
      const res = await getPrevGoogleSearchQuery();

      sendResponse({ ok: true, query: res });
    })();
  } else if (messageName === MESSAGE_NAME.POST_PREV_GOOGLE_SEARCH_QUERY) {
    (async () => {
      const res = await updatePrevGoogleSearchQuery(data);
      sendResponse({ ok: true, ...res });
    })();
  } else if (messageName === MESSAGE_NAME.GET_HAS_BEEN_COPILOT_ACTIVE_FOR_N_DAYS) {
    (async () => {
      const { uniqueId } = data;
      const res = await APIS.getHasBeenActiveForNDays(uniqueId);
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.POST_COPILOT_THREAD) {
    (async () => {
      const res = await APIS.postCopilotThread(data);
      sendResponse({ ok: true, ...res });
    })();
  } else if (messageName === MESSAGE_NAME.POST_COPILOT_USER_MESSAGE) {
    (async () => {
      const res = await APIS.postCopilotUserMessage(data);
      sendResponse({ ok: true, ...res });
    })();
  } else if (messageName === MESSAGE_NAME.POST_COPILOT_BOT_MESSAGE) {
    (async () => {
      const res = await APIS.postCopilotBotMessage(data);
      sendResponse({ ok: true, ...res });
    })();
  } else if (messageName === MESSAGE_NAME.GET_EVENT_IS_TARGET) {
    const { eventCode } = data;
    (async () => {
      const res = await APIS.getEventIsTarget(eventCode);
      sendResponse({ ok: true, ...res });
    })();
  } else if (messageName === MESSAGE_NAME.GET_GEO) {
    (async () => {
      const res = await APIS.getGeo();
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_USER_LOCATION_ON_FIRST_LOGIN) {
    (async () => {
      const res = await getUserLocationOnFirstLoginFromStorage();
      sendResponse({ ok: res ? true : false, countryCode: res });
    })();
  } else if (messageName === MESSAGE_NAME.UPDATE_USER_LOCATION_ON_FIRST_LOGIN) {
    (async () => {
      const res = await updateUserLocationOnFirstLoginFromStorage(data.countryCode);
      sendResponse({ ok: true, res });
    })();
  } else if (messageName === MESSAGE_NAME.GET_MAKE_CHAT_TIMESTAMP) {
    (async () => {
      const res = await APIS.getMakeChatTimestamp(data.uniqueId, data.signUpDate);
      sendResponse({ ok: true, ...res });
    })();
  } else if (messageName === MESSAGE_NAME.GET_LAST_BANNER_SHOWN_TIMESTAMP) {
    (async () => {
      const res = await getLastBannerShownTimestamp();
      sendResponse({ ok: true, timestamp: res });
    })();
  } else if (messageName === MESSAGE_NAME.UPDATE_LAST_BANNER_SHOWN_TIMESTAMP) {
    (async () => {
      const res = await updateLastBannerShownTimestamp(data.timestamp);
      sendResponse({ ok: true, ...res });
    })();
  } else if (messageName === MESSAGE_NAME.GET_CURRENT_CONTEXT) {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      sendResponse({ ok: true, ...sidePanelStore.getSidePanel(tab.id) });
    })();
  } else if (messageName === MESSAGE_NAME.IS_SIDE_PANEL_VERSION_AVAILABLE) {
    (async () => {
      sendResponse({ ok: true, isAvailable: isSidePanelAvailable });
    })();
  } else if (messageName === MESSAGE_NAME.POST_WRITING_COPILOT_LEFT_COUNT) {
    (async () => {
      const { uniqueId } = data;
      const res = await APIS.postWritingCopilotLeftCount({
        uniqueId,
      });
      sendResponse({
        ok: true,
        ...res,
      });
    })();
  } else if (messageName === MESSAGE_NAME.GET_IS_COMMAND_BANNER_SHOWN) {
    (async () => {
      const isShown = await getIsCommandBannerShown();
      sendResponse({ ok: true, isShown });
    })();
  } else if (messageName === MESSAGE_NAME.CLOSE_COMMAND_BANNER) {
    (async () => {
      await closeCommandBanner();
      sendResponse({ ok: true });
    })();
  } else if (messageName === MESSAGE_NAME.GET_ALL_COMMANDS) {
    (async () => {
      const commands = await chrome.commands.getAll();
      sendResponse({ ok: true, commands });
    })();
  } else if (messageName === MESSAGE_NAME.GET_ZENDESK_ARTICLES) {
    (async () => {
      const zendeskArticles = await APIS.getZendeskArticles();
      sendResponse({ ok: true, ...zendeskArticles });
    })();
  } else if (messageName === MESSAGE_NAME.GET_IS_RENDER_EXTENSION_PIN) {
    (async () => {
      const isRenderable = await getIsExtensionPinRenderable();
      sendResponse({ ok: true, isRenderable });
    })();
  } else if (messageName === MESSAGE_NAME.MOVE_THREAD) {
    (async () => {
      const { spaceId, threadId, targetSpaceId } = data;
      const res = await APIS.moveThread({ spaceId, threadId, targetSpaceId });
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_GEO_CACHE) {
    (async () => {
      if (geoRes) {
        sendResponse(geoRes);
      } else {
        const res = await APIS.getGeo();
        if (res.ok) {
          geoRes = res;
        }
        sendResponse(res);
      }
    })();
  } else if (messageName === MESSAGE_NAME.GET_PRODUCT_CANDIDATES) {
    (async () => {
      const res = await APIS.getProductCandidates();
      sendResponse(res);
    })();
  } else if (messageName === MESSAGE_NAME.GET_V1_SPACE_PRODUCT_CANDIDATES) {
    (async () => {
      const res = await APIS.getV1SpaceProductCandidates();
      sendResponse(res);
    })();
  }

  return true;
};

chrome.runtime.onMessage.addListener(messageHandler);

function messageTo(page, name, json) {
  chrome.tabs.sendMessage(page.id, {
    name: name,
    message: json,
  });
}

function forceReconnect(port) {
  deletePortTimer(port);
  port.disconnect();
}

function deletePortTimer(port) {
  if (port._timer) {
    clearTimeout(port._timer);
    delete port._timer;
  }
}

function getKoreaNow() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const koreaNow = new Date(utc + 60 * 60 * 1000 * 9);
  return koreaNow;
}

function getKoreaNowDateString() {
  const koreaNow = getKoreaNow();
  return koreaNow.toDateString();
}

async function checkIsEligibleFor24HoursMarkLog() {
  return (await getLatestTimeMarkFor24HoursStorage()) !== getKoreaNowDateString();
}

async function logTimeMarkAndGetUserInfo(properties) {
  if (isBEInstalledEventLocked) return;
  isBEInstalledEventLocked = true;

  const isEligibleFor24HoursMarkLog = await checkIsEligibleFor24HoursMarkLog();
  if (!isEligibleFor24HoursMarkLog) return;

  await setLatestTimeMarkFor24HoursStorage();

  const [
    isOnPBL,
    isOnYoutubeProgressHighlight,
    isOnGoogleBookmark,
    isOnYoutubeBookmark,
    isOnNewTab,
  ] = await Promise.all([
    getIsPBLSwitchOn(),
    getExtensionSettings('youtubeProgressHighlight'),
    getExtensionSettings('googleBookmark'),
    getExtensionSettings('youtubeBookmark'),
    checkIsNewTabOnStorage(),
  ]);

  const featureTurnedOff = [
    !isOnPBL && 'google_picked_by_liner',
    !isOnYoutubeProgressHighlight && 'youtube_progress_highlight',
    !isOnGoogleBookmark && 'google_serp_bookmark',
    !isOnYoutubeBookmark && 'youtube_bookmark',
    !isOnNewTab && 'new_tab',
  ].filter((f) => !!f);

  sendAmplitudeData('is_be_installed_24hr_mark', {
    ...properties,
    features_turned_off: featureTurnedOff,
  });

  initAmplitude();

  getUser(() => {});
  isBEInstalledEventLocked = false;
}

function initCopyUrlChecker() {
  globalThis.addEventListener('copy', (e) => {
    console.log(e);
  });
}

// Luke - Safari Extension의 validateToolbarItem 함수에서 실행시키는 것들을 windows.onFocusChanged와 tabs.onActivated와 tabs.onUpdated 세 곳에서 실행해줘야 한다.
function validateToolbarItem(inPage) {
  messageTo(inPage, 'CHECK_DISABLED', {});
  if (tags == null) {
    fetchTagsFromServer(function () {});
  }

  if (prevPage && prevPage.url != inPage.url) {
    // Luke - page changed
    messageTo(inPage, 'LKS_UPDATE_DURATION', {});
  }
  prevPage = inPage;

  try {
    if (inPage.url.includes('https://getliner.com') === true) {
      // loginToLiner();
    }
  } catch (e) {}
}

function handleSavePrevPageURL(url) {
  if (!url || url.endsWith('/options/options.html')) return;

  setPrevPageURL(url);
}

// Luke - onFocusChanged 이벤트는 새 윈도우가 생성되거나(자동으로 Focus되기 때문에 이렇게 만든듯) 다른 윈도우로 Focus가 옮겨갔을 때 실행된다.
// Luke - 아예 다른 앱으로 이동(크롬을 사용하다가 Atom으로 옮겨가는 등)할 때는 windowID가 -1인 상태로 이벤트가 실행된다.
chrome.windows.onFocusChanged.addListener(function (windowID) {
  if (windowID != -1) {
    getActivePage(function (activePage) {
      if (activePage) {
        validateToolbarItem(activePage);
        handleSavePrevPageURL(activePage.url);
      }
    });
  }
});

// Luke - onActivated 이벤트는 ctrl-tab이나 새 탭을 클릭하거나 새 탭을 만드는 등의 활동을 통해 실행된다.
// Luke - Window가 활성화되는 것으로는 실행되지 않는다.(이에 따라 두 개의 다른 윈도우를 왔다갔다 하는 것으로는 실행되지 않음)
chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    handleSavePrevPageURL(tab.url);
    validateToolbarItem(tab);
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    handleSavePrevPageURL(tab.url);
    validateToolbarItem(tab);
  }
});

// Luke - toolbar item이 클릭되었을 때 저장해주는 부분
chrome.action.onClicked.addListener(function (tab) {
  const protocol = tab.url.split(':')[0];
  if (protocol.indexOf('http') !== -1 && disabledTabIDs[tab.id] != true) {
    messageTo(tab, 'CLICK_BE_ICON', {});
  }
});

function isLoggedIn() {
  if ((user.id === 0 || user.id === undefined) && GCSConfig) {
    // 비로그인 상태로 인식
    getLinerUUIDStorage()
      .then((linerUUID) => {
        const lastCharactersOfLinerUUID = linerUUID.slice(-5);
        const lastNumberOfLinerUUID = parseInt(lastCharactersOfLinerUUID, 16) % 10;
        if (
          GCSConfig.project_login_issue?.enabled &&
          GCSConfig.project_login_issue?.open_conditions?.lastNumberOfUUID?.includes(
            lastNumberOfLinerUUID,
          ) &&
          Math.floor(Math.random() * 10000) + 1 <= (GCSConfig.project_login_issue?.probability ?? 0)
        ) {
          APIS.getUsersMe()
            .then((res) => {
              if (res.ok) {
                sendAmplitudeData('login_recognition_error', {
                  uuid: linerUUID,
                });
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }

  return user.id !== 0 && user.id !== undefined;
}

function logout() {
  user = {};
  highlightedPages = {};

  chrome.tabs.query({}, function (tabs) {
    tabs.forEach((page) => {
      messageTo(page, 'LOG_OUT', {});
    });
  });

  removeSidCookieStorage();
  removeUserIdStorage();
}

function logoutByResponse(res) {
  if (res.status === 400 && res.reason === 'not_auth') {
    logout();
  }
}

function loginToLiner(type) {
  logger('log in to liner');
  getActivePage(function (page) {
    if (!page) {
      logger('page is undefined');
      return;
    }

    messageTo(page, 'LOGIN', {
      type: type || '',
    });
  });
}

var isFetchingTags = false;
function fetchTagsFromServer(callback) {
  if (isFetchingTags) {
    return;
  }
  isFetchingTags = true;
  setTimeout(function () {
    isFetchingTags = false;
  }, 6 * 1000);

  getUserTag(function (json) {
    isFetchingTags = false;
    tags = [];

    try {
      const { tags: resTags } = json.data;
      tags = removeDuplicatedTags(sortByChar(resTags));
    } catch (e) {}

    callback();
  });
}

// Luke - 이름이 Page가 아니라 Tab이어야 하지만 Safari Extension에 맞춤. Porting 할 때 헷갈리지 않게 하기 위함
function getActivePage(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length === 0) {
      getActivePage(callback);
      return;
    }
    callback(tabs[0]);
  });
}

// Luke - 아래 함수들은 이 파일에 있는 것이 적절하지만 Safari Extension에서는 SafariExtensionViewController.swift 파일에 들어있음
async function getUser(callback) {
  getUsersMe(async function (json) {
    try {
      if (user.id !== json['id']) {
        // Luke - 사용자가 바뀐 경우 highlightedPages를 새로 바꾸어줌
        highlightedPages = {};
      }
    } catch (e) {}

    const prevUserID = user.id;
    user = {};

    if (json['status'] == 'success') {
      user = {
        id: json['id'] || 0,
        email: json['email'] || '',
        name: json['name'] || '',
        username: json['username'] || '',
        premium: json['premium'] || 0,
        image: json['profilePhotoUrl'],
        color_limit: json['color_limit'],
        highlight_limit: json['highlight_limit'],
        youtube_highlight_limit: json['youtube_highlight_limit'],
        amplitude_user_property: json['userProperties'],
        regTime: json['regTime'],
        isPaidInflow: json['isPaidInflow'],
        experimentId: json['experimentId'],
      };

      // Luke - 첫 세팅이거나, 계정이 변경된 경우
      if (user.id !== 0 && (sidCookie === undefined || prevUserID !== user.id)) {
        postAuthCookie(async function (json) {
          try {
            sidCookie = json.cookie;
            await setSidCookieStorage(sidCookie);
            await setUserIdStorage(user.id);
          } catch (e) {}
        });
      }
      setAmplitudeUserProperties(user.amplitude_user_property);
      callback(true);
    } else {
      callback(false);
    }
  });
}

function getHourDiff(timestamp) {
  if (isNaN(timestamp) === true) {
    return -1;
  }

  const now = new Date();
  const hour = 60 * 60 * 1000;

  return (now.getTime() - timestamp) / hour;
}

function getPDFDocumentTitle(page) {
  if (!page) return '';

  const { url: PDFUrl, title: PDFTitle } = page;

  const titleFromPathName = getTitleFromPathName(PDFUrl);
  if (!!titleFromPathName) {
    return titleFromPathName;
  }

  if (!!PDFTitle) {
    return PDFTitle;
  }

  return 'PDF';
}

function getTitleFromPathName(PDFUrl = '') {
  try {
    const PDFPathName = decodeURIComponent(new URL(PDFUrl).pathname);

    if (checkPathNameIsEndWithPDF(PDFPathName)) {
      return getFileName(PDFPathName);
    }
  } catch {}

  return null;
}

function checkPathNameIsEndWithPDF(PDFPathName = '') {
  const regExp = /.pdf$/;

  return regExp.test(PDFPathName);
}

function getFileName(PDFPathName = '') {
  const lastPathName = PDFPathName.split('/').reverse()[0];
  const fileName = lastPathName.substring(0, lastPathName.lastIndexOf('.pdf'));

  return fileName;
}

function updatePageHighlightsV2(
  url,
  page,
  isCreatingHighlight,
  {
    pageId,
    highlights,
    highlightVar,
    imageId,
    imageUrl,
    imageHighlight,
    context,
    slotId,
    eventCoordinate,
  },
) {
  if (isLoggedIn()) {
    messageTo(page, 'PAGE_HIGHLIGHT', {
      url,
      pageId,
      highlights,
      isCreatingHighlight,
      context,
      highlightVar,
      imageId,
      imageUrl,
      imageHighlight,
      slotId,
      isLoggedIn: true,
      eventCoordinate,
    });
  } else {
    messageTo(page, 'PAGE_HIGHLIGHT', {});
  }
}

const getUrlForHighlightInfo = (url) => {
  try {
    const highlightUrl = new URL(url);

    const isLinerReaderModePage = highlightUrl.pathname.includes('/reader-mode');
    if (isLinerReaderModePage) {
      return encodeURI(decodeURIComponent(new URLSearchParams(highlightUrl.search).get('url')));
    }

    const isYoutubeEmbedVideo =
      highlightUrl.hostname.includes('youtube.com') && highlightUrl.pathname.includes('embed');
    const isYoutubeNoCookieEmbedVideo =
      highlightUrl.hostname.includes('youtube-nocookie.com') &&
      highlightUrl.pathname.includes('/embed');

    const isYoutubeMobile = highlightUrl.hostname.includes('m.youtube.com');
    const isYoutubeDesktopWatchPage =
      highlightUrl.hostname.includes('www.youtube.com') && highlightUrl.pathname.includes('/watch');

    if (isYoutubeEmbedVideo || isYoutubeNoCookieEmbedVideo) {
      const videoId = highlightUrl.pathname.split('/embed/')[1].split('/')[0];
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    if (isYoutubeMobile || isYoutubeDesktopWatchPage) {
      const urlParams = new URLSearchParams(highlightUrl.search);
      const videoId = urlParams.get('v');
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    return url;
  } catch {
    return url;
  }
};

function removeTrailingSlash(site) {
  if (site === undefined) {
    return;
  }

  return site.replace(/\/$/, '');
}

// ContextMenus Events
const CONTEXT_MENUS_ITEM_ID = {
  pageBookmark: 'pageBookmark',
  myHighlights: 'myHighlights',
  imageHighlight: 'imageHighlight',
  summary: 'summary',
};

function contextMenusEvent(e, page) {
  const { menuItemId, pageUrl, srcUrl } = e;

  switch (menuItemId) {
    case CONTEXT_MENUS_ITEM_ID.pageBookmark:
      if (pageUrl?.includes('getliner.com')) return;
      messageTo(page, 'RUN_CONTEXT_MENU_BOOKMARK', { page });
      break;
    case CONTEXT_MENUS_ITEM_ID.myHighlights:
      messageTo(page, 'RUN_CONTEXT_MENU_MY_HIGHLIGHTS');
      break;
    case CONTEXT_MENUS_ITEM_ID.imageHighlight:
      messageTo(page, 'RUN_CONTEXT_MENU_IMAGE_HIGHLIGHT', { srcUrl });
      break;
    default:
      return undefined;
  }
}

function createContextMenu(isSummaryEnabled) {
  chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: isSummaryEnabled ? CONTEXT_MENUS_ITEM_ID.summary : CONTEXT_MENUS_ITEM_ID.pageBookmark,
    title: localizeInServiceWorker(isSummaryEnabled ? 'Summarize this page' : 'Save to LINER'),
    contexts: ['page'],
  });

  chrome.contextMenus.create({
    id: CONTEXT_MENUS_ITEM_ID.myHighlights,
    title: localizeInServiceWorker('Go to My Highlights'),
    contexts: ['action'],
  });

  chrome.contextMenus.create({
    id: CONTEXT_MENUS_ITEM_ID.imageHighlight,
    title: localizeInServiceWorker('Save image to LINER'),
    contexts: ['image'],
  });

  chrome.contextMenus.onClicked.addListener(contextMenusEvent);
}

function connectNativePort() {
  if (browser.runtime.connectNative) {
    const port = browser.runtime.connectNative('com.getliner.liner-for-mac.liner-web-extension');

    port.onMessage.addListener(function (message) {
      switch (message.name) {
        case 'PURCHASING_IAP': {
          const { appAccountToken } = message.userInfo;
          APIS.postUserMeSafariExtensionAppAccountToken(appAccountToken);
          break;
        }
        default: {
          console.log(message);
          break;
        }
      }
    });
  }
}

connectNativePort();

const addCommand = async () => {
  let config;
  try {
    config = await APIS.getConfigJSON();
    chrome.commands.onCommand.addListener((command, tab) => {
      if (command === 'toggle-side-panel') {
        handleToggleSidePanel(tab, config);
      }
    });
  } catch {
    chrome.commands.onCommand.addListener((command, tab) => {
      if (command === 'toggle-side-panel') {
        handleToggleSidePanel(tab, config);
      }
    });
  }
};

addCommand();
