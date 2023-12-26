const isProduction = true;

const BASE_URL = isProduction ? 'https://getliner.com' : 'https://dev-stage.getliner.com';
const LKS_URL = isProduction ? 'https://lks.getliner.com' : 'https://dev.lks.getliner.com';
const LINERVA_URL = isProduction
  ? 'https://linerva.getliner.com'
  : 'https://dev.linerva.getliner.com';

const URI = {
  LINER: BASE_URL,
};

const SERVER = {
  API: BASE_URL,
  SHARE: 'https://share.getliner.com',
  LKS: LKS_URL,
  SLACK: 'https://slack.com',
  ADS: 'https://ads.getliner.com',
  IPIFY: 'https://api.ipify.org',
  GCP_CONFIG: 'https://static.getliner.com/liner-service-bucket/config/be',
  AUTO_COMPLETE_GOOGLE: 'https://suggestqueries.google.com/complete',
  LINERVA: LINERVA_URL,
};

let publicIP;
let pipCounter = 0;

async function setPublicIP() {
  const response = await fetch('https://api.ipify.org?format=json', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).catch();

  try {
    const { ip } = await response.json();
    publicIP = ip;
  } catch {}
}

function http(server, endpoint, proto, params, callback) {
  if (pipCounter % 15 == 0) {
    pipCounter = 1;
    setPublicIP();
  } else {
    pipCounter += 1;
  }

  fetch(`${server}${endpoint}`, {
    method: proto.toUpperCase(),
    body: proto.toUpperCase() !== 'GET' ? JSON.stringify(params) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        return res.json();
      }
      return res.text();
    })
    .then((json) => callback(json));
}

function httpWithStatus(server, endpoint, proto, params, callback) {
  fetch(`${server}${endpoint}`, {
    method: proto.toUpperCase(),
    body: proto.toUpperCase() !== 'GET' ? JSON.stringify(params) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((res) => callback(res.status));
}

function httpFormData(server, endpoint, proto, data, callback) {
  fetch(`${server}${endpoint}`, {
    method: proto.toUpperCase(),
    body: data,
    headers: {},
  })
    .then((res) => res.json())
    .then((json) => callback(json));
}

function httpLKSWithoutSidCookie(endpoint, proto, params, callback) {
  fetch(`${SERVER.LKS}${endpoint}`, {
    method: proto.toUpperCase(),
    body: proto.toUpperCase() == 'POST' ? JSON.stringify(params) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res.json())
    .then((json) => callback(json));
}

function httpLKS(endpoint, proto, params, callback) {
  if (sidCookie !== undefined || params.override_login === true) {
    fetch(`${SERVER.LKS}${endpoint}`, {
      method: proto.toUpperCase(),
      headers: {
        Authorization: `Bearer ${sidCookie ?? ''}`,
        'Content-Type': 'application/json',
      },
      body: proto.toUpperCase() == 'POST' ? JSON.stringify(params) : undefined,
    })
      .then((res) => res.json())
      .then((json) => callback(json));
    return;
  }
  callback({});
}

// liner knowledge system endpoints
async function lksGetDocuments(urls, filterOption, numOfPhrase, topK, userId) {
  const response = await fetch(`${SERVER.LKS}/documents?top_k=${topK ?? urls.length}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      urls,
      filter_option: filterOption,
      num_of_phrase: numOfPhrase,
      user_id: userId,
    }),
  });
  return await response.json();
}

function lksGetDocument(url, numOfPhrase, userId, callback) {
  const params = {
    url,
    num_of_phrase: numOfPhrase,
    user_id: userId,
  };

  httpLKSWithoutSidCookie(`/document`, 'POST', params, function (json) {
    callback(json);
  });
}

function lksGetVideos(urls, views, screen_type, numOfPhrase, topK, userId, callback) {
  const params = {
    urls,
    views,
    screen_type: screen_type,
    num_of_phrase: numOfPhrase,
    user_id: userId,
  };

  httpLKSWithoutSidCookie(`/videos?top_k=${topK ?? urls.length}`, 'POST', params, function (json) {
    callback(json);
  });
}

function lksDocClick(userId, clickType, document, accessType, accessMethod, referrer, callback) {
  const params = getLKSBaseParams();
  params.user_id = parseInt(userId);
  params.action_type = clickType;
  params.resource_type = 'document';
  params.detail_info = {
    document,
  };
  params.access_type = accessType;
  params.access_method = accessMethod;
  params.referrer = referrer;

  httpLKS('/log/user', 'POST', params, function (json) {
    callback(json);
  });
}

function lksVideoClick(userId, clickType, document, accessType, accessMethod, callback) {
  const params = getLKSBaseParams();
  params.user_id = parseInt(userId);
  params.action_type = clickType;
  params.resource_type = 'video';
  params.detail_info = {
    document,
  };
  params.access_type = accessType;
  params.access_method = accessMethod;

  httpLKS('/log/user', 'POST', params, function (json) {
    callback(json);
  });
}

function lksDocCreate(userId, document, accessType, accessMethod, callback) {
  const params = getLKSBaseParams();
  params.user_id = parseInt(userId);
  params.action_type = 'create';
  params.resource_type = 'document';
  params.detail_info = {
    document,
  };
  params.access_type = accessType;
  params.access_method = accessMethod;

  httpLKS('/log/user', 'POST', params, function (json) {
    callback(json);
  });
}

function lksVideoCreate(userId, resourceType, document, accessType, accessMethod, callback) {
  const params = getLKSBaseParams();
  params.user_id = parseInt(userId);
  params.action_type = 'create';
  params.resource_type = resourceType;
  params.detail_info = {
    document,
  };
  params.access_type = accessType;
  params.access_method = accessMethod;

  httpLKS('/log/user', 'POST', params, function (json) {
    callback(json);
  });
}

function lksMomentCreate(userId, document, moment, accessType, accessMethod, callback) {
  const params = getLKSBaseParams();
  params.user_id = parseInt(userId);
  params.action_type = 'create';
  params.resource_type = 'moment';
  params.detail_info = {
    document,
    moment,
  };
  params.access_type = accessType;
  params.access_method = accessMethod;

  httpLKS('/log/user', 'POST', params, function (json) {
    callback(json);
  });
}

function lksHighlightCreate(userId, document, phrase, accessType, accessMethod, callback) {
  const params = getLKSBaseParams();
  params.user_id = parseInt(userId);
  params.action_type = 'create';
  params.resource_type = 'phrase';
  params.detail_info = {
    document,
    phrase,
  };
  params.access_type = accessType;
  params.access_method = accessMethod;

  httpLKS('/log/user', 'POST', params, function (json) {
    callback(json);
  });
}

function lksSERP(userId, platform, query, pageNumber, section, documents, callback) {
  const params = getLKSBaseParams();
  params.user_id = parseInt(userId);
  params.action_type = 'search';
  params.resource_type = 'document';
  params.detail_info = {
    platform,
    query,
    page_num: pageNumber,
    section,
    documents,
  };

  httpLKS('/log/user', 'POST', params, function (json) {
    callback(json);
  });
}

function lksReaction(
  userId,
  actionType,
  resourceType,
  reactionType,
  document,
  accessType,
  accessMethod,
  callback,
) {
  const params = getLKSBaseParams();
  params.user_id = +userId;
  params.action_type = actionType;
  params.resource_type = resourceType;
  params.detail_info = {
    reaction_type: reactionType,
    document,
  };
  params.access_type = accessType;
  params.access_method = accessMethod;

  httpLKS('/log/user', 'POST', params, function (json) {
    callback(json);
  });
}

// cache share page on server
function getSharePage(shareId) {
  http(SERVER.SHARE, '/' + shareId, 'GET', {}, function (json) {});
}

// user endpoints
function getUsersMe(callback) {
  let getUsersMeCounter = 0;

  const tryGetUsersMe = () => {
    http(SERVER.API, '/users/me', 'GET', {}, function (json) {
      const { status, reason } = json;
      if (status === 'success') {
        callback(json);
      } else if (reason !== 'not_auth') {
        if (getUsersMeCounter < 3) {
          getUsersMeCounter += 1;
          setTimeout(() => {
            tryGetUsersMe();
          }, 500);
        } else {
          callback(json);
        }
      } else {
        callback(json);
      }
    });
  };

  tryGetUsersMe();
}

// auth endpoints
function postAuthCookie(callback) {
  http(SERVER.API, '/auth/cookie', 'GET', {}, function (json) {
    callback(json);
  });
}

function postAuthLocal(email, password, callback) {
  const params = {
    email: email,
    passwd: password,
  };

  http(SERVER.API, '/auth/local', 'POST', params, function (json) {
    callback(json);
  });
}

function getAuthFacebook(accessToken, callback) {
  const params = {
    access_token: accessToken,
  };

  http(SERVER.API, '/auth/facebook', 'GET', params, function (json) {
    callback(json);
  });
}

function getAuthTwitter(oauthToken, oauthTokenSecret, userID, callback) {
  const params = {
    oauth_token: oauthToken,
    oauth_token_secret: oauthTokenSecret,
    user_id: userID,
  };

  http(SERVER.API, '/auth/twitter', 'GET', params, function (json) {
    callback(json);
  });
}

function postAuthGoogle(code, callback) {
  const params = {
    code: code,
  };

  http(SERVER.API, '/auth/google', 'POST', params, function (json) {
    callback(json);
  });
}

function deleteAuth(callback) {
  http(SERVER.API, '/auth', 'DELETE', {}, function (json) {
    callback(json);
  });
}

// index endpoints
function getCheckServer(platform, info, appVersion, callback) {
  const params = {
    device: platform,
    info: info,
    app_version: appVersion,
  };

  http(SERVER.API, '/checkServer', 'GET', params, function (json) {
    callback(json);
  });
}

function postLinerVersion(platform, version, callback) {
  const params = {
    platform: platform,
    version: version,
  };

  http(SERVER.API, '/liner-version', 'POST', params, function (json) {
    callback(json);
  });
}

// page endpoints
function postPagesInfos(pageID, originalURL, status, callback) {
  let params = {};
  if (pageID != null) {
    params = {
      page_id: pageID,
    };
  } else {
    params = {
      original_url: originalURL.split('?openLinerExtension')[0].split('&openLinerExtension')[0],
      status: status,
    };
  }

  http(SERVER.API, '/pages/infos', 'POST', params, function (json) {
    callback(json);
  });
}

function postPagesSummary(originalURL, status, callback) {
  const params = {
    original_url: originalURL.split('?openLinerExtension')[0].split('&openLinerExtension')[0],
    status: status,
  };

  http(SERVER.API, '/pages/summary', 'POST', params, function (json) {
    callback(json);
  });
}

function postPagesAnnotations(originalURL, styleItemID, content, callback) {
  const params = {
    original_url: originalURL.split('?openLinerExtension')[0].split('&openLinerExtension')[0],
    style_item_id: styleItemID,
    content: content,
  };

  http(SERVER.API, '/pages/annotations', 'POST', params, function (json) {
    callback(json);
  });
}

// Luke - 페이지 최초 저장 할 때 부르는 함수
function postPages(title, url, imageURL, styleItems, lang, localDate, callback) {
  const params = {
    title,
    url,
    image: imageURL,
    engineVersion: '0.2.0',
    styleItems,
    lang,
    localDate,
  };

  http(SERVER.API, '/pages', 'POST', params, function (json) {
    callback(json);
  });
}

function postPagesPageID(pageID, styleItems, callback) {
  const params = {
    style_items: styleItems,
  };

  http(SERVER.API, '/pages/' + pageID, 'POST', params, function (json) {
    callback(json);
  });
}

function postPagesPageIDHighlightID(pageId, highlightId, slotId, callback) {
  const params = {
    slotId,
  };

  http(SERVER.API, '/pages/' + pageId + '/' + highlightId, 'POST', params, function (json) {
    callback(json);
  });
}

function putPage(pageIDs, originalStatus, newStatus, callback) {
  const params = {
    page_ids: pageIDs,
    original_status: originalStatus,
    new_status: newStatus,
  };

  http(SERVER.API, '/pages', 'PUT', params, function (json) {
    callback(json);
  });
}

// pdf endpoints
function postUserFilePdfWithUrl(fileUrl, callback) {
  const params = {
    fileUrl: fileUrl,
  };

  http(SERVER.API, '/user/file/pdf/withUrl', 'POST', params, function (json) {
    callback(json);
  });
}

async function postUserFilePdf(pdfInfo, callback) {
  const { pdfBlobUrl, fileName } = pdfInfo;
  let pdfBlob = await fetch(pdfBlobUrl).then((r) => r.blob());
  var formData = new FormData();
  formData.append('file', pdfBlob, fileName); // 파일 한 개만 허용

  fetch(`${SERVER.API}/user/file/pdf`, {
    method: 'POST',
    body: formData,
  })
    .then((res) => res.json())
    .then((json) => callback(json));
}

// tag endpoints
function getUserTag(callback) {
  http(SERVER.API, '/user/tag', 'GET', {}, function (json) {
    callback(json);
  });
}

function postPageSaveSaveIdTag(saveId, tagTitle, callback) {
  const params = {
    tagTitle,
  };
  http(SERVER.API, `/page/save/${saveId}/tag`, 'POST', params, function (json) {
    callback(json);
  });
}

// Community

function setAmplitudeUserId() {
  try {
    if (user.id !== undefined && user.id > 0) {
      amplitude.then((res) => res.getInstance().setUserId(user.id));
    }
  } catch (e) {}
}

function setAmplitudeUserDevice(installationToken) {
  try {
    setAmplitudeUserId();
    amplitude.then((res) => res.getInstance().setDeviceId(installationToken));
  } catch (e) {}
}

function setAmplitudeUserProperties(properties) {
  try {
    setAmplitudeUserId();
    amplitude.then((res) => res.getInstance().setUserProperties(properties));
  } catch (e) {}
}

function setAmplitudeUserProperty(property, value) {
  try {
    setAmplitudeUserId();
    amplitude.then((res) => res.getInstance().identify(new res.Identify().set(property, value)));
  } catch (e) {}
}

function incrementAmplitudeUserProperty(property, count) {
  try {
    setAmplitudeUserId();
    amplitude.then((res) => res.getInstance().identify(new res.Identify().add(property, count)));
  } catch (e) {}
}

function sendAmplitudeData(eventName, props = {}) {
  try {
    setAmplitudeUserId();
    const defaultProps = {
      browser: getBrowserName(),
      liner_service: 'be',
      liner_extension_version: linerExtensionVersion,
      os: getOS() === 'macos' ? 'mac' : getOS(),
      is_logged_in: isLoggedIn(),
      network_settings: (
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection
      )?.effectiveType,
    };

    const eventProperties = {
      ...defaultProps,
      ...props,
    };

    amplitude.then((res) => res.getInstance().logEvent(eventName, eventProperties));

    if (!isProduction) {
      chrome.tabs.query({}, function (tabs) {
        tabs.forEach((page) => {
          messageTo(page, 'AMPLITUDE_DEBUG', {
            id: uuidv4(),
            eventName,
            time: new Date().toLocaleString(),
            userId: user.id,
            properties: eventProperties,
          });
        });
      });
    }
  } catch (e) {
    console.error(e);
  }
}

function postAnnotation(highlightId, annotationInfo, callback) {
  fetch(`${SERVER.API}/v3/highlight/${highlightId}/annotation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(annotationInfo),
  })
    .then((response) => response.json())
    .then(callback);
}

function postAnnotationV3(highlightId, content) {
  return fetch(`${SERVER.API}/v3/highlight/${highlightId}/annotation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { content } }),
  }).then((response) => response.json());
}

function editAnnotation(highlightId, annotationId, annotationInfo) {
  return fetch(`${SERVER.API}/v3/highlight/${highlightId}/annotation/${annotationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(annotationInfo),
  });
}

function putAnnotationV3(highlightId, annotationId, content) {
  return fetch(`${SERVER.API}/v3/highlight/${highlightId}/annotation/${annotationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { content } }),
  });
}

async function getSavedPageCommunity(savedPageId) {
  const response = await fetch(`${SERVER.API}/saved-page/${savedPageId}/community`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return await response.json();
}

function getHighlightInfo(highlightId) {
  return fetch(`${SERVER.API}/highlight/${highlightId}/community`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json());
}

function deleteAnnotation(highlightId, annotationId) {
  return fetch(`${SERVER.API}/highlight/${highlightId}/annotation/${annotationId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function getExtensionConfigFromGCP(callback) {
  http(SERVER.GCP_CONFIG, '/config.json', 'GET', {}, (json) => {
    callback(json);
  });
}

async function postPblPagesHighlightUsers(pageUrls, size) {
  const response = await fetch(`${SERVER.API}/pbl/pages/highlight-users?size=${size}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pageUrls }),
  });
  return await response.json();
}

async function postUserPageSaved({ pageUrl, pageId }) {
  const response = await fetch(`${SERVER.API}/user/page/saved`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pageUrl, pageId }),
  });
  const savedPage = await response.json();
  return { savedPage, ok: response.ok };
}

async function postUserPagesSaved(pageUrls) {
  const response = await fetch(`${SERVER.API}/user/pages/saved`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pageUrls }),
  });
  return await response.json();
}

async function postRecommendationValidate(url, text) {
  const linerUUID = await getLinerUUIDStorage();
  const response = await fetch(`${SERVER.LKS}/recommendation/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, text, liner_uuid: linerUUID, device_type: 'be' }),
  });
  return await response.json();
}

async function getUserFolders() {
  const response = await fetch(`${SERVER.API}/user/me/folders?sort-by=used-time`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return await response.json();
}

async function postFolder(folderName, folderEmoji) {
  const response = await fetch(`${SERVER.API}/user/me/folder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: folderName, emoji: folderEmoji }),
  });
  return await response.json();
}

async function postCollection({ name, emoji, description, openState }) {
  const response = await fetch(`${SERVER.API}/user/me/folder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, emoji, description, openState }),
  });
  return await response.json();
}

function deleteUserSavedPage(savedPageId) {
  return fetch(`${SERVER.API}/user/me/saved-page/${savedPageId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

async function putSavedPageFolder(savedPageId, folderId) {
  const response = await fetch(`${SERVER.API}/user/me/saved-page/${savedPageId}/folder`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ folderId }),
  });
  return await response.json();
}

function getFavicon(domain, size) {
  return fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

async function savedPageHighlightSnapshot(savedPageId, styleId, snapshot) {
  return await fetch(`${SERVER.API}/page/save/${savedPageId}/highlights/${styleId}/snapshot`, {
    method: 'POST',
    headers: {},
    body: snapshot,
  });
}

async function postSyncFolder(savedPageId, collectionIds) {
  return fetch(`${SERVER.API}/saved-page/${savedPageId}/sync/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ folderIds: collectionIds }),
  });
}

async function getDocument(pageUrl) {
  const response = await fetch(pageUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return await response.text();
}

function getReadAmazonNotebook() {
  return fetch(`https://read.amazon.com/notebook`, { method: 'GET' });
}

function getAmazonDpBook(bookAsin, state) {
  return fetch(
    `https://read.amazon.com/notebook?asin=${bookAsin}&contentLimitState=${
      state?.contentLimitState ?? ''
    }&token=${state?.token ?? ''}`,
    { method: 'GET' },
  )
    .then((res) => res.text())
    .then((html) => html);
}

function getUserIntegrationKindleBooks() {
  return fetch(`${SERVER.API}/user/integration/kindle/books`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function postUserIntegrationKindleBookHighlights(book, highlights) {
  return fetch(`${SERVER.API}/user/integration/kindle/book/highlights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ book, highlights }),
  });
}

function getUserIntegrationSettingKindle() {
  return fetch(`${SERVER.API}/user/integration/setting/kindle`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function postUserIntegrationSettingKindle() {
  return fetch(`${SERVER.API}/user/integration/setting/kindle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

const fetchWithRetry = async (url, options, timeout = 5000) => {
  const res = await fetchWithTimeout(url, options, timeout);

  if (!res.ok) {
    return await fetchWithTimeout(url, options, timeout);
  }

  return res;
};

const fetchWithTimeout = (url, options, timeout = 5000) => {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    fetch(url, { ...options, signal: controller.signal })
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        resolve({ ok: false });
      });
  });
};

function handleClickVideoTimestamp(videoSeconds) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    tabs.forEach((page) => {
      messageTo(page, 'CLICK_VIDEO_TIMESTAMP', {
        videoSeconds,
      });
    });
  });
}

const APIS = {
  getV2UserTheme: async () => {
    const res = await fetch(`${SERVER.API}/v2/user/slots`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postV2PageInfo: async (pageUrl) => {
    const res = await fetch(`${SERVER.API}/v2/page/info`, {
      method: 'POST',
      body: JSON.stringify({ pageUrl }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch({ ok: false });

    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok, status: res.status };
  },
  postV2SavedPage: async ({ savedPageId, highlights }) => {
    const res = await fetch(`${SERVER.API}/v2/saved-page/${savedPageId}`, {
      method: 'POST',
      body: JSON.stringify({ highlights }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch({ ok: false });
    const json = await res.json();
    return {
      ok: res.ok,
      ...json,
    };
  },
  postV2Page: async (page) => {
    const res = await fetch(`${SERVER.API}/v2/page`, {
      method: 'POST',
      body: JSON.stringify(page),
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch({ ok: false });
    const json = await res.json();
    return {
      ok: res.ok,
      ...json,
    };
  },
  postSnippet: async ({ imageUrl, title, description, faviconUrl, localDate }) => {
    const res = await fetch(`${SERVER.API}/save/snippet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl, title, description, faviconUrl, localDate }),
    });
    return await res.json();
  },
  postSummarize: async ({ html, url }) => {
    const res = await fetch(`${SERVER.LINERVA}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html, url }),
    });
    return await res.json();
  },
  postSimplify: async ({ html, url }) => {
    const res = await fetch(`${SERVER.LINERVA}/simplify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html, url }),
    });
    return await res.json();
  },
  postExtensionChat: async ({ uniqueId, query, references, conversationId }) => {
    const res = await fetch(`${SERVER.LINERVA}/extension/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unique_id: uniqueId,
        query,
        references,
        conversation_id: conversationId,
      }),
    });
    return res.ok ? await res.json() : { ok: res.ok, status: res.status };
  },
  postExtensionRecommendationQuery: async ({ uniqueId, conversationId }) => {
    const res = await fetch(`${SERVER.LINERVA}/extension/recommendation/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unique_id: uniqueId,
        conversation_id: conversationId,
      }),
    });
    return res.ok ? await res.json() : { ok: res.ok, status: res.status };
  },
  postExtensionRelatedContent: async ({ conversationId, withSearch }) => {
    const res = await fetch(`${SERVER.LINERVA}/extension/recommendation/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId, with_search: withSearch }),
    });
    return res.ok ? await res.json() : { ok: res.ok, status: res.status };
  },
  getUsersMe: async () => {
    const res = await fetch(`${SERVER.API}/users/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  patchHighlightSlotId: async ({ savedPageId, highlightId, slotId }) => {
    const res = await fetch(`${SERVER.API}/page/save/${savedPageId}/highlights/${highlightId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId }),
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  deleteHighlight: async ({ highlightId }) => {
    const res = await fetch(`${SERVER.API}/highlight/${highlightId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }).catch({ ok: false });
    return { ok: res.ok };
  },
  postUserFilePdf: async ({ formData }) => {
    const res = await fetch(`${SERVER.API}/pdf/upload`, {
      method: 'POST',
      body: formData,
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  getPDFSourceByUrl: async ({ url }) => {
    const res = await fetch(`${SERVER.API}/v1/copilot/pdf/source/search-by-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl: url }),
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  getPDFUploadProgress: async ({ savedPageId }) => {
    const res = await fetch(`${SERVER.API}/pdf/${savedPageId}/upload/progress`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/pdf' },
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  getPDFChatLeftCount: async (timezoneOffset) => {
    const res = await fetch(
      `${SERVER.API}/chat/ai/pdf/left-count?timezoneOffset=${timezoneOffset}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    ).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postPDFChatNextQueries: async (savedPageId, query) => {
    const res = await fetch(`${SERVER.API}/chat/ai/pdf/${savedPageId}/next-queries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, numOfNextQueries: 3 }),
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postPDFSavedPageChatStream: async (
    page,
    { query, savedPageId, timezoneOffset, order, modelType = 'gpt-3.5' },
  ) => {
    const abortController = new AbortController();
    const regex = /{"answer":[\s\S]*?,"resetTimestamp":[\s\S]*?}/gm;
    const queryKeyObj = { query, savedPageId, order, requestModelType: modelType };

    const handleError = (statusCode = 500) => {
      messageTo(page, 'POST_PDF_SAVED_PAGE_CHAT_STREAM', {
        ...queryKeyObj,
        status_code: statusCode,
        done: true,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_PDF_SAVED_PAGE_CHAT_STREAM', {
        ...JSON.parse(result),
        ...queryKeyObj,
        done,
      });
    };
    const res = await fetchWithRetry(
      `${SERVER.API}/chat/ai/pdf/${savedPageId}/ask/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, timezoneOffset, model_type: modelType }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);
          if (found) {
            const lastResult = found[found.length - 1];
            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            handleError();
            return;
          }
        }
      }
    } else {
      handleError(res.status === 429 ? 429 : 500);
    }
  },
  postExtensionChatLimitRefill: async ({ uniqueId }) => {
    const res = await fetch(`${SERVER.LINERVA}/extension/chat/limit/refill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unique_id: uniqueId,
      }),
    });
    return res.ok ? await res.json() : { ok: res.ok, status: res.status };
  },
  postPDFSavedPageGreetingStream: async (page, { query, savedPageId }) => {
    const abortController = new AbortController();
    const regex = /{"answer":[\s\S]*?,"resetTimestamp":null}/gm;
    const queryKeyObj = { savedPageId };

    const handleError = (statusCode = 500) => {
      messageTo(page, 'POST_PDF_SAVED_PAGE_GREETING_STREAM', {
        ...queryKeyObj,
        status_code: statusCode,
        done: true,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_PDF_SAVED_PAGE_GREETING_STREAM', {
        ...JSON.parse(result),
        ...queryKeyObj,
        done,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.API}/chat/ai/pdf/${savedPageId}/greeting/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);
          if (found) {
            const lastResult = found[found.length - 1];
            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            handleError();
            return;
          }
        }
      }
    } else {
      handleError(res.status === 429 ? 429 : 500);
    }
  },
  postCopilotActivation: async ({ uniqueId, html, url }) => {
    const res = await fetch(`${SERVER.LINERVA}/extension/copilot/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ unique_id: `${uniqueId}`, html, url }),
    });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postYtbCopilotActivation: async ({ uniqueId, transcript, url }) => {
    const res = await fetch(`${SERVER.LINERVA}/extension/copilot/video/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ unique_id: `${uniqueId}`, transcript, url }),
    });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  getYtbCopilotLeftCount: async ({ uniqueId }) => {
    const res = await fetch(
      `${SERVER.LINERVA}/extension/copilot/video/left-count?unique_id=${uniqueId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postCopilotChat: async (
    page,
    { uniqueId, url, query, order, startByCopilot = false, modelType = 'gpt-3.5' },
  ) => {
    const abortController = new AbortController();
    const regex = /{"answer"[\s\S]*?"status_code":\d{3}}/gm;
    const queryKeyObj = { query, url, order, requestModelType: modelType };

    const handleError = () => {
      messageTo(page, 'POST_COPILOT_CHAT', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_COPILOT_CHAT', {
        ...JSON.parse(result),
        ...queryKeyObj,
        done,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/copilot/chat-stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unique_id: `${uniqueId}`,
          url,
          query,
          start_by_copilot: startByCopilot,
          model_type: modelType,
        }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);
          if (found) {
            const lastResult = found[found.length - 1];
            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postExplainGoogleSearchQuery: async (
    page,
    { uniqueId, url, query, order, lang, html, query: searchQuery },
  ) => {
    const abortController = new AbortController();
    const regex = /{"answer"[\s\S]*?"statusCode":\d{3}}/gm;
    const queryKeyObj = { url, order };

    const handleError = () => {
      messageTo(page, 'POST_COPILOT_GOOGLE_SEARCH_QUERY', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_COPILOT_GOOGLE_SEARCH_QUERY', {
        ...JSON.parse(result),
        ...queryKeyObj,
        done,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/copilot/v2/hook/answer-user-query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uniqueId: `${uniqueId}`,
          url,
          query,
          lang,
          html,
          query: searchQuery,
        }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);
          const found = data.match(regex);

          if (found) {
            const lastResult = found[found.length - 1];
            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postFindCoreSentence: async (page, { uniqueId, url, order, lang, html }) => {
    const abortController = new AbortController();
    const regex = /{"answer"[\s\S]*?"statusCode":\d{3}}/gm;
    const queryKeyObj = { url, order };

    const handleError = () => {
      messageTo(page, 'POST_COPILOT_CORE_SENTENCE', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      const parsedResult = JSON.parse(result);
      messageTo(page, 'POST_COPILOT_CORE_SENTENCE', {
        ...parsedResult,
        answer: parsedResult.paragraph
          ? `<quotation>${parsedResult.paragraph}</quotation>${parsedResult.answer}`
          : parsedResult.answer,
        ...queryKeyObj,
        done,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/copilot/v2/hook/extract-key-paragraph`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uniqueId: `${uniqueId}`,
          url,
          lang,
          html,
        }),
      },
      20000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);
          const found = data.match(regex);

          if (found) {
            const lastResult = found[found.length - 1];
            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },

  postCopilotYtbChat: async (page, { uniqueId, url, query, order, modelType = 'gpt-3.5' }) => {
    const abortController = new AbortController();
    const regex = /{"answer"[\s\S]*?"status_code":\d{3}}/gm;
    const queryKeyObj = { query, url, order, requestModelType: modelType };

    const handleError = () => {
      messageTo(page, 'POST_COPILOT_YTB_CHAT', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_COPILOT_YTB_CHAT', {
        ...JSON.parse(result),
        ...queryKeyObj,
        done,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/copilot/video/chat-stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unique_id: `${uniqueId}`, url, query, model_type: modelType }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);
          if (found) {
            const lastResult = found[found.length - 1];
            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postCopilotRecommendationQuery: async ({ uniqueId, url }) => {
    const res = await fetchWithTimeout(`${SERVER.LINERVA}/extension/copilot/recommendation/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ unique_id: `${uniqueId}`, url }),
    });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postYtbCopilotRecommendationQuery: async ({ uniqueId, url }) => {
    const res = await fetchWithTimeout(
      `${SERVER.LINERVA}/extension/copilot/video/recommendation/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unique_id: `${uniqueId}`, url }),
      },
    );
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postCopilotRecommendationContent: async ({ uniqueId, url, lang }) => {
    const res = await fetchWithTimeout(
      `${SERVER.LINERVA}/extension/copilot/v2/hook/recommend-contents`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uniqueId: `${uniqueId}`,
          url,
          lang,
        }),
      },
      10000,
    );
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postTooltipTranslate: async ({ uniqueId, text, targetLang, url }) => {
    const res = await fetch(`${SERVER.LINERVA}/extension/tooltip/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ unique_id: `${uniqueId}`, text, target_lang: targetLang, url }),
    });
    return res.ok ? { ok: res.ok, done: false, ...(await res.json()) } : { ok: res.ok };
  },
  postTooltipSimplify: async (page, { uniqueId, text, url, order, startByCopilot = false }) => {
    const abortController = new AbortController();
    const regex = /{"result"[\s\S]*?"status_code":\d{3}}/gm;
    const queryKeyObj = { text, url, order };

    const handleError = () => {
      messageTo(page, 'POST_TOOLTIP_SIMPLIFY', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_TOOLTIP_SIMPLIFY', {
        ...JSON.parse(result),
        ...queryKeyObj,
        done,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/tooltip/simplify-stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unique_id: `${uniqueId}`,
          text,
          url,
          start_by_copilot: startByCopilot,
        }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);
          if (found) {
            const lastResult = found[found.length - 1];
            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postTooltipExplain: async (page, { uniqueId, text, url, order }) => {
    const abortController = new AbortController();
    const regex = /{"result"[\s\S]*?"status_code":\d{3}}/gm;
    const queryKeyObj = { text, url, order };

    const handleError = () => {
      messageTo(page, 'POST_TOOLTIP_EXPLAIN', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_TOOLTIP_EXPLAIN', {
        ...JSON.parse(result),
        ...queryKeyObj,
        done,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/tooltip/explain-stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unique_id: `${uniqueId}`, text, url }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);
          if (found) {
            const lastResult = found[found.length - 1];
            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postTooltipParaphraseStream: async (page, { uniqueId, text, url, order }) => {
    const abortController = new AbortController();
    const regex = /{"result"[\s\S]*?"statusCode":\d{3}}/gm;
    const queryKeyObj = { text, url, order };

    const handleError = () => {
      messageTo(page, 'POST_TOOLTIP_PARAPHRASE_STREAM', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_TOOLTIP_PARAPHRASE_STREAM', {
        ...JSON.parse(result),
        ...queryKeyObj,
        done,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/tooltip/paraphrase-stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uniqueId: `${uniqueId}`, text, url }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);
          if (found) {
            const lastResult = found[found.length - 1];
            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postTooltipCommand: async (page, { uniqueId, text, command, url, order }) => {
    const abortController = new AbortController();
    const regex = /{"result"[\s\S]*?"statusCode":\d{3}}/gm;
    const queryKeyObj = { text, url, order };

    const handleError = () => {
      messageTo(page, 'POST_TOOLTIP_COMMAND', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_TOOLTIP_COMMAND', {
        ...JSON.parse(result),
        ...queryKeyObj,
        done,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/tooltip/command-stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uniqueId: `${uniqueId}`, text, url, command }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);
          if (found) {
            const lastResult = found[found.length - 1];
            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },

  getSERPChatLeftCount: async (uuid, userId) => {
    const res = await fetch(
      `${SERVER.LINERVA}/search/liner-ai/left-count?uuid=${uuid}&user_id=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    ).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postSERPChatRelatedQueries: async ({ query, answer }) => {
    const res = await fetch(`${SERVER.LINERVA}/search/follow-up-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, answer }),
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postSERPChatSearch: async (
    page,
    { query, uuid, userId, items, modelType = 'gpt-3.5' },
    signal,
  ) => {
    const abortController = new AbortController();
    let queryTemplate = '';
    let splitResult = [];
    let splitLast = '';
    const res = await fetch(
      `${SERVER.LINERVA}/search/liner-ai?uuid=${uuid}&user_id=${userId}&model_type=${modelType}`,
      {
        signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, items }),
      },
    ).catch((e) => {
      abortController.abort();
      messageTo(page, 'POST_SERP_CHAT_SEARCH', {
        requestModelType: modelType,
        rawQuery: query,
        status_code: 500,
        done: true,
      });
    });

    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      const res = new Response(value);

      if (done) {
        messageTo(page, 'POST_SERP_CHAT_SEARCH', {
          ...JSON.parse(`${queryTemplate}${splitLast}`),
          requestModelType: modelType,
          rawQuery: query,
          done,
        });
        return;
      }

      try {
        const data = await res.text();
        queryTemplate = `{"q":${JSON.stringify(query)}`;
        splitResult = data.split(queryTemplate);
        splitLast = splitResult[splitResult.length - 1];

        messageTo(page, 'POST_SERP_CHAT_SEARCH', {
          ...JSON.parse(`${queryTemplate}${splitLast}`),
          requestModelType: modelType,
          rawQuery: query,
          done,
        });
      } catch (e) {
        if (e?.name !== 'SyntaxError') {
          messageTo(page, 'POST_SERP_CHAT_SEARCH', {
            requestModelType: modelType,
            rawQuery: query,
            status_code: 500,
            done: true,
          });
          abortController.abort();
          return;
        }
      }
    }
  },
  getUserMeMembershipLimits: async () => {
    if (isLoggedIn()) {
      if (Object.keys(membershipLimits).length) {
        return { ok: true, ...membershipLimits };
      }

      const res = await fetch(`${SERVER.API}/user/me/membership/limits`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Liner-Requester': 'be',
        },
      }).catch({ ok: false });
      return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
    } else {
      membershipLimits = {};
      return { ok: false };
    }
  },
  getSearchExtractKeywords: async (query) => {
    const res = await fetch(`${SERVER.LINERVA}/search/extract-keywords?q=${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  getConfigJSON: async () => {
    const res = await fetch(`${SERVER.GCP_CONFIG}/config.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  deleteSavedPage: async (savedPageId) => {
    const res = await fetch(`${SERVER.API}/user/me/saved-page/${savedPageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch({ ok: false });
    return { ok: res.ok };
  },
  postExtractHighlight: async ({ uniqueId, html, url }) => {
    const res = await fetch(`${SERVER.LINERVA}/extension/copilot/v2/hook/extract-highlight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ unique_id: `${uniqueId}`, html, url }),
    });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postCopilotGmailDraftCompose: async (
    page,
    { uniqueId, conversationId, query, lang, order },
    signal,
  ) => {
    const abortController = new AbortController();
    let queryTemplate = '';
    let splitResult = [];
    let splitLast = '';
    const queryKeyObj = { query, order };

    const res = await fetch(`${SERVER.LINERVA}/extension/copilot/gmail/draft/compose`, {
      signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unique_id: `${uniqueId}`,
        conversation_id: conversationId,
        query,
        lang,
      }),
    }).catch((e) => {
      abortController.abort();
      messageTo(page, 'POST_COPILOT_GMAIL_DRAFT_COMPOSE', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
      });
    });

    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      const res = new Response(value);

      if (done) {
        messageTo(page, 'POST_COPILOT_GMAIL_DRAFT_COMPOSE', {
          ...queryKeyObj,
          ...JSON.parse(`${queryTemplate}${splitLast}`),
          rawQuery: query,
          done,
        });
        return;
      }

      try {
        const data = await res.text();
        queryTemplate = `{"conversation_id":${JSON.stringify(conversationId)}`;
        splitResult = data.split(queryTemplate);
        splitLast = splitResult[splitResult.length - 1];

        messageTo(page, 'POST_COPILOT_GMAIL_DRAFT_COMPOSE', {
          ...queryKeyObj,
          ...JSON.parse(`${queryTemplate}${splitLast}`),
          done,
        });
      } catch (e) {
        if (e?.name !== 'SyntaxError') {
          messageTo(page, 'POST_COPILOT_GMAIL_DRAFT_COMPOSE', {
            ...queryKeyObj,
            status_code: 500,
            done: true,
          });
          abortController.abort();
          return;
        }
      }
    }
  },
  postCopilotGmailDraftReply: async (
    page,
    { uniqueId, conversationId, query, emailThread, order },
    signal,
  ) => {
    const abortController = new AbortController();
    let queryTemplate = '';
    let splitResult = [];
    let splitLast = '';
    const queryKeyObj = { query, order };

    const res = await fetch(`${SERVER.LINERVA}/extension/copilot/gmail/draft/reply`, {
      signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unique_id: `${uniqueId}`,
        conversation_id: conversationId,
        query,
        email_thread: emailThread,
      }),
    }).catch((e) => {
      abortController.abort();
      messageTo(page, 'POST_COPILOT_GMAIL_DRAFT_REPLY', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
      });
    });

    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      const res = new Response(value);

      if (done) {
        messageTo(page, 'POST_COPILOT_GMAIL_DRAFT_REPLY', {
          ...queryKeyObj,
          ...JSON.parse(`${queryTemplate}${splitLast}`),
          done,
        });
        return;
      }

      try {
        const data = await res.text();
        queryTemplate = `{"conversation_id":${JSON.stringify(conversationId)}`;
        splitResult = data.split(queryTemplate);
        splitLast = splitResult[splitResult.length - 1];

        messageTo(page, 'POST_COPILOT_GMAIL_DRAFT_REPLY', {
          ...queryKeyObj,
          ...JSON.parse(`${queryTemplate}${splitLast}`),
          done,
        });
      } catch (e) {
        if (e?.name !== 'SyntaxError') {
          messageTo(page, 'POST_COPILOT_GMAIL_DRAFT_REPLY', {
            ...queryKeyObj,
            status_code: 500,
            done: true,
          });
          abortController.abort();
          return;
        }
      }
    }
  },
  postCopilotGmailDraftReplyOptions: async ({ uniqueId, emailThread, lang }) => {
    const res = await fetch(`${SERVER.LINERVA}/extension/copilot/gmail/draft/reply/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ unique_id: `${uniqueId}`, email_thread: emailThread, lang }),
    });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postTooltipParaphrase: async ({ uniqueId, conversationId, query, option, numOfResults }) => {
    const res = await fetch(`${SERVER.LINERVA}/extension/tooltip/paraphrase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unique_id: `${uniqueId}`,
        conversation_id: conversationId,
        query,
        option,
        num_of_result: numOfResults,
      }),
    });
    try {
      return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
    } catch {
      return { ok: false };
    }
  },
  postTooltipGrammar: async ({ uniqueId, text }) => {
    const res = await fetch(`${SERVER.LINERVA}/extension/tooltip/grammar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uniqueId: `${uniqueId}`,
        text,
      }),
    });
    try {
      return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
    } catch {
      return { ok: false };
    }
  },
  postTooltipCustom: async ({ uniqueId, text, command }) => {
    const res = await fetch(`${SERVER.LINERVA}/extension/tooltip/writing-command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uniqueId: `${uniqueId}`,
        text,
        command,
      }),
    });
    try {
      return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
    } catch {
      return { ok: false };
    }
  },
  getUserMeMembership: async () => {
    if (isLoggedIn()) {
      const res = await fetch(`${SERVER.API}/user/me/membership`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch({ ok: false });
      return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
    } else {
      return { ok: false };
    }
  },
  postCommonLogs: (cookie, props) => {
    fetch(`${SERVER.LKS}/common-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cookie}` },
      body: JSON.stringify(props),
    });
  },
  getAuthCookie: async () => {
    const res = await fetch(`${SERVER.API}/auth/cookie`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  getUserMeViralHostKey: async (viralType = 'viral') => {
    const res = await fetch(`${SERVER.API}/user/me/viral-host-key?type=${viralType}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postSearchFindEntities: async ({ answer }) => {
    const res = await fetch(`${SERVER.LINERVA}/search/find-entities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generated_answer: answer }),
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  getHasBeenActiveForNDays: async (uniqueId) => {
    const res = await fetch(`${SERVER.LINERVA}/user/is-active?uniqueId=${uniqueId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  getHTML: async (url) => {
    const res = await fetch(url);
    const html = await res.text();
    return {
      ok: res.ok,
      html: html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ''),
    };
  },
  postPdfBetterAnswer: async (
    page,
    {
      uniqueId,
      previousAnswer,
      resourceId,
      contentType,
      modelType,
      command,
      savedPageId,
      order,
      query,
    },
  ) => {
    const queryKeyObj = { savedPageId, order, query };

    const abortController = new AbortController();
    const regex = /{"answer"[\s\S]*?"statusCode":\d{3}}/gm;

    const handleError = () => {
      messageTo(page, 'POST_PDF_BETTER_ANSWER', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
        contentType,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_PDF_BETTER_ANSWER', {
        result: JSON.parse(result),
        ...queryKeyObj,
        done,
        contentType,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/copilot/better-answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uniqueId,
          previousAnswer,
          resourceId,
          contentType,
          modelType,
          command,
        }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);
          if (found) {
            const lastResult = found[found.length - 1];
            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            c;
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postWebTranslationBetterAnswer: async (
    page,
    { uniqueId, resourceId, contentType, modelType, command, url, order, text },
  ) => {
    const queryKeyObj = { url, order, text };

    const abortController = new AbortController();
    const regex = /{"answer"[\s\S]*?"statusCode":\d{3}}/gm;

    const handleError = () => {
      messageTo(page, 'POST_WEB_TRANSLATION_BETTER_ANSWER', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
        contentType,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_WEB_TRANSLATION_BETTER_ANSWER', {
        result: JSON.parse(result),
        ...queryKeyObj,
        done,
        contentType,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/copilot/better-answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uniqueId: String(uniqueId),
          resourceId,
          contentType,
          modelType,
          command,
        }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);

          if (found) {
            const lastResult = found[found.length - 1];

            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            c;
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postWebSimplificationBetterAnswer: async (
    page,
    { uniqueId, resourceId, contentType, modelType, command, url, order, text },
  ) => {
    const queryKeyObj = { url, order, text };

    const abortController = new AbortController();
    const regex = /{"answer"[\s\S]*?"statusCode":\d{3}}/gm;

    const handleError = () => {
      messageTo(page, 'POST_WEB_SIMPLIFICATION_BETTER_ANSWER', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
        contentType,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_WEB_SIMPLIFICATION_BETTER_ANSWER', {
        result: JSON.parse(result),
        ...queryKeyObj,
        done,
        contentType,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/copilot/better-answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uniqueId: String(uniqueId),
          resourceId,
          contentType,
          modelType,
          command,
        }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);

          if (found) {
            const lastResult = found[found.length - 1];

            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            c;
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postWebExplanationBetterAnswer: async (
    page,
    { uniqueId, resourceId, contentType, modelType, command, url, order, text },
  ) => {
    const queryKeyObj = { url, order, text };

    const abortController = new AbortController();
    const regex = /{"answer"[\s\S]*?"statusCode":\d{3}}/gm;

    const handleError = () => {
      messageTo(page, 'POST_WEB_EXPLANATION_BETTER_ANSWER', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
        contentType,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_WEB_EXPLANATION_BETTER_ANSWER', {
        result: JSON.parse(result),
        ...queryKeyObj,
        done,
        contentType,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/copilot/better-answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uniqueId: String(uniqueId),
          resourceId,
          contentType,
          modelType,
          command,
        }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);

          if (found) {
            const lastResult = found[found.length - 1];

            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            c;
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postWebChatBetterAnswer: async (
    page,
    { uniqueId, resourceId, contentType, modelType, command, url, order, text },
  ) => {
    const queryKeyObj = { url, order, text };
    const abortController = new AbortController();
    const regex = /{"answer"[\s\S]*?"statusCode":\d{3}}/gm;

    const handleError = () => {
      messageTo(page, 'POST_WEB_CHAT_BETTER_ANSWER', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
        contentType,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_WEB_CHAT_BETTER_ANSWER', {
        result: JSON.parse(result),
        ...queryKeyObj,
        done,
        contentType,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/copilot/better-answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uniqueId: String(uniqueId),
          resourceId,
          contentType,
          modelType,
          command,
        }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);

          if (found) {
            const lastResult = found[found.length - 1];

            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            c;
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postYoutubeChatBetterAnswer: async (
    page,
    { uniqueId, resourceId, contentType, modelType, command, url, order, query },
  ) => {
    const queryKeyObj = { url, order, query };
    const abortController = new AbortController();
    const regex = /{"answer"[\s\S]*?"statusCode":\d{3}}/gm;

    const handleError = () => {
      messageTo(page, 'POST_YOUTUBE_BETTER_ANSWER', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
        contentType,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_YOUTUBE_BETTER_ANSWER', {
        result: JSON.parse(result),
        ...queryKeyObj,
        done,
        contentType,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/copilot/better-answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uniqueId: String(uniqueId),
          resourceId,
          contentType,
          modelType,
          command,
        }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);

          if (found) {
            const lastResult = found[found.length - 1];

            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            c;
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postGmailComposeBetterAnswer: async (
    page,
    { uniqueId, resourceId, contentType, modelType, command, conversationId, order, query },
  ) => {
    const queryKeyObj = { conversationId, order, query };
    const abortController = new AbortController();
    const regex = /{"answer"[\s\S]*?"statusCode":\d{3}}/gm;

    const handleError = () => {
      messageTo(page, 'POST_GMAIL_COMPOSE_BETTER_ANSWER', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
        contentType,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_GMAIL_COMPOSE_BETTER_ANSWER', {
        result: JSON.parse(result),
        ...queryKeyObj,
        done,
        contentType,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/copilot/better-answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uniqueId: String(uniqueId),
          resourceId,
          contentType,
          modelType,
          command,
        }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);

          if (found) {
            const lastResult = found[found.length - 1];

            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            c;
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postGmailDraftBetterAnswer: async (
    page,
    { uniqueId, resourceId, contentType, modelType, command, conversationId, order, query },
  ) => {
    const queryKeyObj = { conversationId, order, query };
    const abortController = new AbortController();
    const regex = /{"answer"[\s\S]*?"statusCode":\d{3}}/gm;

    const handleError = () => {
      messageTo(page, 'POST_GMAIL_DRAFT_BETTER_ANSWER', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
        contentType,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_GMAIL_DRAFT_BETTER_ANSWER', {
        result: JSON.parse(result),
        ...queryKeyObj,
        done,
        contentType,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/copilot/better-answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uniqueId: String(uniqueId),
          resourceId,
          contentType,
          modelType,
          command,
        }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);

          if (found) {
            const lastResult = found[found.length - 1];

            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            c;
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postSERPBetterAnswer: async (
    page,
    { uniqueId, contentType, modelType, command, query, previousAnswer },
  ) => {
    const queryKeyObj = { modelType, query };
    const abortController = new AbortController();
    const regex = /{"answer"[\s\S]*?"statusCode":\d{3}}/gm;

    const handleError = () => {
      messageTo(page, 'POST_SERP_BETTER_ANSWER', {
        ...queryKeyObj,
        status_code: 500,
        done: true,
        contentType,
      });
      abortController.abort();
    };

    const sendResponse = (result, done) => {
      messageTo(page, 'POST_SERP_BETTER_ANSWER', {
        result: JSON.parse(result),
        ...queryKeyObj,
        done,
        contentType,
      });
    };

    const res = await fetchWithRetry(
      `${SERVER.LINERVA}/extension/copilot/better-answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uniqueId: String(uniqueId),
          previousAnswer,
          contentType,
          modelType,
          command,
        }),
      },
      5000,
    );

    if (res.ok) {
      const reader = res.body.getReader();
      let body = '';

      while (true) {
        const { done, value } = await reader.read();

        try {
          if (done) {
            const found = body.match(regex);
            if (found) {
              const lastResult = found[found.length - 1];
              sendResponse(lastResult, done);
            }
            return;
          }

          const data = new TextDecoder().decode(value);

          const found = data.match(regex);

          if (found) {
            const lastResult = found[found.length - 1];

            sendResponse(lastResult, done);
            body = data;
          } else {
            body += data;
          }
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            c;
            handleError();
            return;
          }
        }
      }
    } else {
      handleError();
    }
  },
  postUserMeSafariExtensionAppAccountToken: async (appAccountToken) => {
    await fetch(`${SERVER.API}/user/me/safari-extension/app-account-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appAccountToken }),
    }).catch({ ok: false });
  },
  getProducts: async () => {
    if (products.length) {
      return { ok: true, products };
    }

    const res = await fetch(`${SERVER.API}/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch({ ok: false });

    const productsResponse = await res.json();
    products = productsResponse;

    return res.ok ? { ok: res.ok, products: productsResponse } : { ok: res.ok };
  },
  postSharedYoutubeSummaryPage: async (video) => {
    const res = await fetch(`${SERVER.API}/shared-youtube-summary-page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video }),
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postSharedYoutubeSummaryPageTranscripts: async (data) => {
    const { uniqueKey, content, language } = data;
    const res = await fetch(`${SERVER.API}/shared-youtube-summary-page/${uniqueKey}/transcripts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, language }),
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postSharedYoutubeSummaryPageActivate: async (data) => {
    const res = await fetch(
      `${SERVER.API}/shared-youtube-summary-page/${data.uniqueKey}/activate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    ).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },

  postCopilotThread: async (data) => {
    const res = await fetch(`${SERVER.API}/v1/copilot/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postCopilotBotMessage: async (data) => {
    const res = await fetch(`${SERVER.API}/v1/copilot/threads/${data.threadId}/bot/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  postCopilotUserMessage: async (data) => {
    const res = await fetch(`${SERVER.API}/v1/copilot/threads/${data.threadId}/user/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  getEventIsTarget: async (eventCode) => {
    if (isLoggedIn()) {
      if (eventTarget[eventCode]) {
        return { ok: true, isTarget: eventTarget[eventCode] };
      }

      const res = await fetch(`${SERVER.API}/event/${eventCode}/is-event-target`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }).catch({ ok: false });

      const json = await res.json();
      eventTarget[eventCode] = json.isTarget;

      return res.ok ? { ok: res.ok, isTarget: json.isTarget } : { ok: res.ok };
    } else {
      delete eventTarget[eventCode];
      return { ok: false };
    }
  },
  getGeo: async () => {
    const res = await fetch(`${SERVER.API}/geo`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok, countryCode: null };
  },
  getMakeChatTimestamp: async (uniqueId, signUpDate) => {
    const res = await fetch(
      `${SERVER.LINERVA}/user/make-chat-timestamps?uniqueId=${uniqueId}&signUpDate=${signUpDate}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    ).catch({ ok: false });
    return { ok: res.ok, ...(await res.json()) };
  },
  postDraftAssistant: async (
    page,
    { uniqueId, purpose, keyPoints, lang, tone, context, modelType = 'gpt-3.5' },
  ) => {
    const abortController = new AbortController();
    let queryTemplate = '';
    let splitResult = [];
    let splitLast = '';
    const res = await fetchWithRetry(`${SERVER.LINERVA}/extension/copilot/draft-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uniqueId, purpose, keyPoints, lang, tone, context, modelType }),
    }).catch((e) => {
      abortController.abort();
      messageTo(page, 'POST_DRAFT_ASSISTANT', {
        requestModelType: modelType,
        status_code: 500,
        done: true,
        purpose,
        keyPoints,
      });
    });

    if (res.ok) {
      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        const res = new Response(value);

        if (done) {
          messageTo(page, 'POST_DRAFT_ASSISTANT', {
            ...JSON.parse(`${queryTemplate}${splitLast}`),
            requestModelType: modelType,
            done,
            purpose,
            keyPoints,
          });
          return;
        }

        try {
          const data = await res.text();
          queryTemplate = `{"draft":`;
          splitResult = data.split(queryTemplate);
          splitLast = splitResult[splitResult.length - 1];

          messageTo(page, 'POST_DRAFT_ASSISTANT', {
            ...JSON.parse(`${queryTemplate}${splitLast}`),
            requestModelType: modelType,
            done,
            purpose,
            keyPoints,
          });
        } catch (e) {
          if (e?.name !== 'SyntaxError') {
            messageTo(page, 'POST_DRAFT_ASSISTANT', {
              requestModelType: modelType,
              status_code: 500,
              done: true,
              purpose,
              keyPoints,
            });
            abortController.abort();
            return;
          }
        }
      }
    } else {
      if (res.status === 429) {
        messageTo(page, 'POST_DRAFT_ASSISTANT', {
          requestModelType: modelType,
          statusCode: 429,
          done: true,
          purpose,
          keyPoints,
        });
      }
    }
  },
  postWritingCopilotLeftCount: async ({ uniqueId }) => {
    const res = await fetch(`${SERVER.LINERVA}/extension/writing/left-count?uniqueId=${uniqueId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    try {
      return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
    } catch {
      return { ok: false };
    }
  },
  getZendeskArticles: async () => {
    const res = await fetch(`${SERVER.API}/zendesk/articles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    try {
      return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
    } catch {
      return { ok: false };
    }
  },
  getSpaces: async () => {
    const res = await fetch(`${SERVER.API}/v1/spaces`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  moveThread: async ({ spaceId, threadId, targetSpaceId }) => {
    const res = await fetch(`${SERVER.API}/v1/space/${spaceId}/thread/${threadId}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetSpaceId }),
    }).catch({ ok: false });
    return { ok: res.ok };
  },
  getProductCandidates: async () => {
    const res = await fetch(`${SERVER.API}/product-candidates`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
  getV1SpaceProductCandidates: async () => {
    const res = await fetch(`${SERVER.API}/v1/space/product-candidates`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).catch({ ok: false });
    return res.ok ? { ok: res.ok, ...(await res.json()) } : { ok: res.ok };
  },
};
