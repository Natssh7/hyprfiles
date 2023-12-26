/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./libs/extension-messaging/dist/constants.js":
/*!****************************************************!*\
  !*** ./libs/extension-messaging/dist/constants.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
// An identifier that tells us which version of the messaging service we're using,
// to ensure we don't try to process a message not intended for us.
const version = 2.5;



/***/ }),

/***/ "./libs/extension-messaging/dist/index.js":
/*!************************************************!*\
  !*** ./libs/extension-messaging/dist/index.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "addListener": () => (/* binding */ addListener),
/* harmony export */   "sendMessage": () => (/* binding */ sendMessage)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-utils */ "./libs/extension-utils/dist/index.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./constants */ "./libs/extension-messaging/dist/constants.js");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;


// All the listeners, set in the background page.
const listeners = {};
// Keep track of all the listeners that accept external calls.
const externalListeners = {};
const externalResponseHandlers = {};
// Send a message to a destination, and get back the result.
const sendMessage = (destination, message, external) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const serializedMessage = JSON.stringify(message);
        if (_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_0__.isServiceWorker) {
            // Message is from the background page, to the background page.
            try {
                if (listeners[destination]) {
                    const message = JSON.parse(serializedMessage);
                    const result = yield listeners[destination](message);
                    console.debug(`Local listener response for '${destination}':`, result, message);
                    const data = result.data === undefined ? undefined : JSON.parse(result.data);
                    if (result.success) {
                        resolve(data);
                    }
                    else {
                        reject(data);
                    }
                }
                else {
                    reject(`No message listener: ${destination}`);
                }
            }
            catch (e) {
                reject(e);
            }
        }
        else if (chrome === null || chrome === void 0 ? void 0 : chrome.runtime) {
            // Message is being sent from the content script
            const outboundMessage = JSON.stringify({
                version: _constants__WEBPACK_IMPORTED_MODULE_1__.version,
                destination,
                external,
                message: serializedMessage,
            });
            console.debug(`Sending message to '${destination}'`, serializedMessage);
            chrome.runtime.sendMessage(outboundMessage, (result) => {
                if (result === undefined) {
                    reject(`Unexpected message result (undefined), suggests no listener in background page.\n\tDestination: ${destination}`);
                    return;
                }
                const data = result.data === undefined ? undefined : JSON.parse(result.data);
                if (result.success) {
                    resolve(data);
                }
                else {
                    reject(data);
                }
            });
        }
        else if ((_b = document.body) === null || _b === void 0 ? void 0 : _b.dataset.extensionId) {
            // Message is being sent by the native browser tab.
            const messageId = crypto.randomUUID();
            const timeout = setTimeout(() => {
                if (externalResponseHandlers[messageId]) {
                    delete externalResponseHandlers[messageId];
                    reject(`Message timed out trying to contact extension`);
                }
            }, 15 * 1000);
            externalResponseHandlers[messageId] = {
                resolve: (result) => {
                    clearTimeout(timeout);
                    delete externalResponseHandlers[messageId];
                    resolve(result);
                },
                reject: (error) => {
                    clearTimeout(timeout);
                    delete externalResponseHandlers[messageId];
                    reject(error);
                },
            };
            globalThis.postMessage({
                version: _constants__WEBPACK_IMPORTED_MODULE_1__.version,
                extensionId: document.body.dataset.extensionId,
                destination,
                message,
                messageId,
            });
        }
        else {
            reject(`Could not find a way to transport the message to the extension.`);
        }
    }));
});
// Listen for messages at a specific destination.
const addListener = (destination, listener, options = {
    levelOfParallelism: -1,
}) => {
    if (listeners[destination]) {
        throw new Error(`${destination} already has message listener attached`);
    }
    const processMessage = (message) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.debug(`Processing message for '${destination}'`, message);
            const result = yield listener(message);
            const response = {
                success: true,
                data: JSON.stringify(result),
            };
            console.debug(`Successful message result from '${destination}':`, response, message);
            return response;
        }
        catch (err) {
            const response = {
                success: false,
                data: JSON.stringify(err),
            };
            console.debug(`Failed message result from '${destination}':`, response, message, err);
            return response;
        }
    });
    listeners[destination] = (message) => {
        if (options.levelOfParallelism !== 1) {
            return processMessage(message);
        }
        return new Promise((resolve, reject) => {
            // https://stackoverflow.com/a/73482349/1663648
            navigator.locks
                .request(`messageService:${destination}`, () => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const result = yield processMessage(message);
                    resolve(result);
                }
                catch (e) {
                    reject(e);
                }
            }))
                .catch(reject);
        });
    };
    if (options.allowExternalConnections) {
        externalListeners[destination] = true;
    }
};
// If we're currently in the background page, listen for messages.
if (_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_0__.isServiceWorker) {
    chrome.runtime.onMessage.addListener((rawMessage, sender, sendResponse) => {
        if (typeof rawMessage !== 'string') {
            // Not for us.
            return;
        }
        const fullMessage = JSON.parse(rawMessage);
        if (fullMessage.version !== _constants__WEBPACK_IMPORTED_MODULE_1__.version ||
            !fullMessage.destination ||
            !fullMessage.message) {
            // Not for us.
            return;
        }
        if (fullMessage.external && !externalListeners[fullMessage.destination]) {
            sendResponse({
                success: false,
                data: JSON.stringify('Listener does not accept external callers.'),
            });
            return;
        }
        const listener = listeners[fullMessage.destination];
        if (!listener) {
            sendResponse({
                success: false,
                data: JSON.stringify(`Could not route message to destination: ${fullMessage.destination}`),
            });
            return;
        }
        const message = JSON.parse(fullMessage.message);
        listener(message)
            .then(sendResponse)
            .catch((err) => {
            console.error('Listener is never expected to throw.', err, rawMessage, fullMessage);
            sendResponse({
                success: false,
                data: JSON.stringify('Listener threw unhandled exception (see background page for error).'),
            });
        });
        // Required for asynchronous callbacks
        // https://stackoverflow.com/a/20077854/1663648
        return true;
    });
}
else if ((_a = globalThis.chrome) === null || _a === void 0 ? void 0 : _a.runtime) {
    console.debug(`Not attaching listener for messages, because we're not in the background.`);
    if (!globalThis.messageServiceConnection) {
        const port = (globalThis.messageServiceConnection = chrome.runtime.connect(chrome.runtime.id, {
            name: 'messageService',
        }));
        port.onMessage.addListener((rawMessage) => {
            if (typeof rawMessage !== 'string') {
                // Not for us.
                return;
            }
            const fullMessage = JSON.parse(rawMessage);
            if (fullMessage.version !== _constants__WEBPACK_IMPORTED_MODULE_1__.version ||
                !fullMessage.destination ||
                !fullMessage.message) {
                // Not for us.
                return;
            }
            const listener = listeners[fullMessage.destination];
            if (!listener) {
                // No listener in this tab for this message.
                return;
            }
            // We don't really have a way to communicate the response back to the service worker.
            // So we just... do nothing with it.
            const message = JSON.parse(fullMessage.message);
            listener(message).catch((err) => {
                console.error('Unhandled error processing message in tab', fullMessage, err);
            });
        });
    }
    // chrome.runtime is available, and we got a message from the window
    // this could be a tab trying to get information from the extension
    globalThis.addEventListener('message', (messageEvent) => __awaiter(void 0, void 0, void 0, function* () {
        const { extensionId, messageId, destination, message } = messageEvent.data;
        if (extensionId !== chrome.runtime.id ||
            !messageId ||
            !destination ||
            !message) {
            // They didn't want to contact us.
            // Or if they did, they didn't have the required fields.
            return;
        }
        if (messageEvent.data.version !== _constants__WEBPACK_IMPORTED_MODULE_1__.version) {
            // They did want to contact us, but there was a version mismatch.
            // We can't handle this message.
            globalThis.postMessage({
                extensionId,
                messageId,
                success: false,
                data: `Extension message receiver is incompatible with message sender`,
            });
            return;
        }
        console.debug('Received message for', destination, message);
        try {
            const response = yield sendMessage(destination, message, true);
            // Success! Now go tell the client they got everything they wanted.
            globalThis.postMessage({
                extensionId,
                messageId,
                success: true,
                data: response,
            });
        }
        catch (e) {
            console.debug('Failed to send message to', destination, e);
            // :coffin:
            globalThis.postMessage({
                extensionId,
                messageId,
                success: false,
                data: e,
            });
        }
    }));
}
else {
    // Not a background page, and not a content script.
    // This could be a page where we want to listen for calls from the tab.
    globalThis.addEventListener('message', (messageEvent) => {
        const { extensionId, messageId, success, data } = messageEvent.data;
        if (extensionId !== document.body.dataset.extensionId ||
            !messageId ||
            typeof success !== 'boolean') {
            // Not for us.
            return;
        }
        // Check to see if we have a handler waiting for this message response...
        const responseHandler = externalResponseHandlers[messageId];
        if (!responseHandler) {
            console.warn('We got a response back for a message we no longer have a handler for.', extensionId, messageId, success, data);
            return;
        }
        // Yay! Tell the krustomer we have their data, from the extension.
        console.debug('We received a response for', messageId, success, data);
        if (success) {
            responseHandler.resolve(data);
        }
        else {
            responseHandler.reject(data);
        }
    });
}



/***/ }),

/***/ "./libs/extension-utils/dist/constants/index.js":
/*!******************************************************!*\
  !*** ./libs/extension-utils/dist/constants/index.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isServiceWorker": () => (/* binding */ isServiceWorker),
/* harmony export */   "manifest": () => (/* binding */ manifest)
/* harmony export */ });
var _a, _b;
const manifest = (_b = (_a = globalThis.chrome) === null || _a === void 0 ? void 0 : _a.runtime) === null || _b === void 0 ? void 0 : _b.getManifest();
const isServiceWorker = !globalThis.window;



/***/ }),

/***/ "./libs/extension-utils/dist/enums/loading-state.js":
/*!**********************************************************!*\
  !*** ./libs/extension-utils/dist/enums/loading-state.js ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// A generic loading state enum.
var LoadingState;
(function (LoadingState) {
    LoadingState["Loading"] = "Loading";
    LoadingState["Success"] = "Success";
    LoadingState["Error"] = "Error";
})(LoadingState || (LoadingState = {}));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (LoadingState);


/***/ }),

/***/ "./libs/extension-utils/dist/index.js":
/*!********************************************!*\
  !*** ./libs/extension-utils/dist/index.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "LoadingState": () => (/* reexport safe */ _enums_loading_state__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   "isServiceWorker": () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_0__.isServiceWorker),
/* harmony export */   "manifest": () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_0__.manifest),
/* harmony export */   "wait": () => (/* reexport safe */ _utils_wait__WEBPACK_IMPORTED_MODULE_2__["default"])
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "./libs/extension-utils/dist/constants/index.js");
/* harmony import */ var _enums_loading_state__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./enums/loading-state */ "./libs/extension-utils/dist/enums/loading-state.js");
/* harmony import */ var _utils_wait__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils/wait */ "./libs/extension-utils/dist/utils/wait.js");
// Export constants

// Export enums

// Export utils



/***/ }),

/***/ "./libs/extension-utils/dist/utils/wait.js":
/*!*************************************************!*\
  !*** ./libs/extension-utils/dist/utils/wait.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const wait = (time) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time);
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (wait);


/***/ }),

/***/ "./src/css/pages/game-details.scss":
/*!*****************************************!*\
  !*** ./src/css/pages/game-details.scss ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./src/js/pages/game-details/badgeAwardDates.ts":
/*!******************************************************!*\
  !*** ./src/js/pages/game-details/badgeAwardDates.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "addBadgeAwardedDates": () => (/* binding */ addBadgeAwardedDates)
/* harmony export */ });
/* harmony import */ var _services_badges__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../services/badges */ "./src/js/services/badges/index.ts");
/* harmony import */ var _services_settings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../services/settings */ "./src/js/services/settings/index.ts");
/* harmony import */ var _utils_authenticatedUser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/authenticatedUser */ "./src/js/utils/authenticatedUser.ts");



const addBadgeAwardedDates = async () => {
    if (!_utils_authenticatedUser__WEBPACK_IMPORTED_MODULE_2__["default"]) {
        return;
    }
    const enabled = await (0,_services_settings__WEBPACK_IMPORTED_MODULE_1__.getToggleSettingValue)('badgeAchievementDatesEnabled');
    if (!enabled) {
        return;
    }
    const awardedAttribute = 'rplus-awarded-date';
    document
        .querySelectorAll(`thumbnail-2d>span[thumbnail-type='BadgeIcon']:not([${awardedAttribute}])`)
        .forEach((badgeIcon) => {
        if (!_utils_authenticatedUser__WEBPACK_IMPORTED_MODULE_2__["default"]) {
            return;
        }
        badgeIcon.setAttribute(awardedAttribute, '0');
        const badgeId = Number(badgeIcon.getAttribute('thumbnail-target-id'));
        if (isNaN(badgeId)) {
            return;
        }
        (0,_services_badges__WEBPACK_IMPORTED_MODULE_0__.getBadgeAwardDate)(_utils_authenticatedUser__WEBPACK_IMPORTED_MODULE_2__["default"].id, badgeId)
            .then((awardedDate) => {
            if (!awardedDate) {
                return;
            }
            badgeIcon.setAttribute(awardedAttribute, awardedDate.getTime().toString());
            const awardedDateLabel = document.createElement('span');
            awardedDateLabel.classList.add('rplus-awarded-date');
            awardedDateLabel.setAttribute('title', `Awarded on ${awardedDate.toLocaleString()}`);
            awardedDateLabel.innerText = awardedDate.toLocaleDateString();
            badgeIcon.appendChild(awardedDateLabel);
        })
            .catch((err) => {
            console.error('Failed to check badge awarded date', badgeId, err);
        });
    });
};



/***/ }),

/***/ "./src/js/pages/game-details/details.ts":
/*!**********************************************!*\
  !*** ./src/js/pages/game-details/details.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "placeId": () => (/* binding */ placeId)
/* harmony export */ });
const container = document.getElementById('game-detail-page');
const placeId = Number(container?.dataset.placeId);



/***/ }),

/***/ "./src/js/pages/game-details/premium-notice.ts":
/*!*****************************************************!*\
  !*** ./src/js/pages/game-details/premium-notice.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _details__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./details */ "./src/js/pages/game-details/details.ts");

if (_details__WEBPACK_IMPORTED_MODULE_0__.placeId === 258257446) {
    const privateServerBanner = document.querySelector('.create-server-banner-text');
    if (privateServerBanner instanceof HTMLElement) {
        privateServerBanner.innerText =
            'Purchasing a private server for this place will unlock additional features for this extension. Support not guaranteed, just enjoy the features while they work.';
    }
}


/***/ }),

/***/ "./src/js/pages/game-details/vote-percentage.ts":
/*!******************************************************!*\
  !*** ./src/js/pages/game-details/vote-percentage.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const updateVoteTitle = (upvoteSpan, downvoteSpan) => {
    if (document.querySelector('.rplus-vote-percentage-label')) {
        // Label already exists, do nothing.
        return;
    }
    const upvoteCount = Number(upvoteSpan?.getAttribute('title'));
    const downvoteCount = Number(downvoteSpan?.getAttribute('title'));
    if (isNaN(upvoteCount) ||
        isNaN(downvoteCount) ||
        upvoteCount + downvoteCount < 1) {
        return;
    }
    upvoteSpan?.setAttribute('title', upvoteCount.toLocaleString());
    downvoteSpan?.setAttribute('title', downvoteCount.toLocaleString());
    const percentage = downvoteCount < 1
        ? 100
        : (100 / (upvoteCount + downvoteCount)) * upvoteCount;
    if (upvoteSpan?.parentElement?.parentElement) {
        const percentageSpan = document.createElement('span');
        percentageSpan.classList.add('count-middle');
        percentageSpan.classList.add('rplus-vote-percentage-label');
        percentageSpan.setAttribute('title', `${percentage === 100 ? 100 : percentage.toFixed(3)}% of players recommend this game`);
        percentageSpan.innerText = `${Math.floor(percentage)}%`;
        upvoteSpan.closest('.vote-summary')?.prepend(percentageSpan);
    }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (updateVoteTitle);


/***/ }),

/***/ "./src/js/services/badges/batchProcessor.ts":
/*!**************************************************!*\
  !*** ./src/js/services/badges/batchProcessor.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_batch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/batch */ "./node_modules/@tix-factory/batch/dist/index.js");

class BadgeAwardBatchProcessor extends _tix_factory_batch__WEBPACK_IMPORTED_MODULE_0__.Batch {
    constructor() {
        super({
            levelOfParallelism: 1,
            maxSize: 100,
            minimumDelay: 1 * 1000,
            enqueueDeferDelay: 10,
        });
    }
    async process(items) {
        const response = await fetch(`https://badges.roblox.com/v1/users/${items[0].value.userId}/badges/awarded-dates?badgeIds=${items
            .map((i) => i.value.badgeId)
            .join(',')}`);
        if (!response.ok) {
            throw new Error('Failed to load badge award statuses');
        }
        const result = await response.json();
        items.forEach((item) => {
            const badgeAward = result.data.find((b) => b.badgeId === item.value.badgeId);
            if (badgeAward?.awardedDate) {
                item.resolve(new Date(badgeAward.awardedDate));
            }
            else {
                item.resolve(undefined);
            }
        });
    }
    getBatch() {
        const now = performance.now();
        const batch = [];
        for (let i = 0; i < this.queueArray.length; i++) {
            const batchItem = this.queueArray[i];
            if (batchItem.retryAfter > now) {
                // retryAfter is set at Infinity while the item is being processed
                // so we should always check it, even if we're not retrying items
                continue;
            }
            if (batch.length < 1 ||
                batch[0].value.userId === batchItem.value.userId) {
                // We group all the requests for badge award dates together by user ID.
                batch.push(batchItem);
            }
            if (batch.length >= this.config.maxSize) {
                // We have all the items we need, break.
                break;
            }
        }
        return batch;
    }
    getKey(item) {
        return `${item.userId}:${item.badgeId}`;
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (BadgeAwardBatchProcessor);


/***/ }),

/***/ "./src/js/services/badges/index.ts":
/*!*****************************************!*\
  !*** ./src/js/services/badges/index.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getBadgeAwardDate": () => (/* binding */ getBadgeAwardDate)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");
/* harmony import */ var _batchProcessor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./batchProcessor */ "./src/js/services/badges/batchProcessor.ts");



const messageDestination = 'badgesService.getBadgeAwardDate';
const badgeAwardProcessor = new _batchProcessor__WEBPACK_IMPORTED_MODULE_2__["default"]();
const badgeAwardCache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__["default"]('badgesService', 60 * 1000);
// Fetches the date when a badge was awarded to the specified user.
const getBadgeAwardDate = async (userId, badgeId) => {
    const date = await (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {
        userId,
        badgeId,
    });
    return date ? new Date(date) : undefined;
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return badgeAwardCache.getOrAdd(badgeAwardProcessor.getKey(message), async () => {
        // Queue up the fetch request, when not in the cache
        const date = await badgeAwardProcessor.enqueue(message);
        return date?.getTime();
    });
});
globalThis.badgesService = { getBadgeAwardDate };



/***/ }),

/***/ "./src/js/services/settings/index.ts":
/*!*******************************************!*\
  !*** ./src/js/services/settings/index.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getSettingValue": () => (/* binding */ getSettingValue),
/* harmony export */   "getToggleSettingValue": () => (/* binding */ getToggleSettingValue),
/* harmony export */   "setSettingValue": () => (/* binding */ setSettingValue)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");

// Destination to be used with messaging.
const messageDestinationPrefix = 'settingsService';
// Fetches a locally stored setting value by its key.
const getSettingValue = (key) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(`${messageDestinationPrefix}.getSettingValue`, {
        key,
    });
};
// Gets a boolean setting value, toggled to false by default.
const getToggleSettingValue = async (key) => {
    const value = await getSettingValue(key);
    return !!value;
};
// Locally stores a setting value.
const setSettingValue = (key, value) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(`${messageDestinationPrefix}.setSettingValue`, {
        key,
        value,
    });
};
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(`${messageDestinationPrefix}.getSettingValue`, async ({ key }) => {
    const values = await chrome.storage.local.get(key);
    return values[key];
}, {
    levelOfParallelism: -1,
    allowExternalConnections: true,
});
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(`${messageDestinationPrefix}.setSettingValue`, async ({ key, value }) => {
    if (value) {
        await chrome.storage.local.set({
            [key]: value,
        });
    }
    else {
        await chrome.storage.local.remove(key);
    }
}, {
    levelOfParallelism: -1,
    allowExternalConnections: true,
});
globalThis.settingsService = { getSettingValue, getToggleSettingValue, setSettingValue };



/***/ }),

/***/ "./src/js/utils/authenticatedUser.ts":
/*!*******************************************!*\
  !*** ./src/js/utils/authenticatedUser.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "parseAuthenticatedUser": () => (/* binding */ parseAuthenticatedUser)
/* harmony export */ });
// Fetches the user who is currently authenticated on the loaded web page.
const parseAuthenticatedUser = () => {
    const userData = globalThis.document && document.querySelector(`meta[name='user-data']`);
    // The user who is currently authenticated on the loaded web page.
    return userData
        ? {
            id: Number(userData.getAttribute('data-userid')),
            name: userData.getAttribute('data-name') || '',
            displayName: userData.getAttribute('data-displayname') || '',
        }
        : null;
};
const authenticatedUser = parseAuthenticatedUser();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (authenticatedUser);
// TODO: Deprecate after manifest V3 conversion.



/***/ }),

/***/ "./src/js/utils/expireableDictionary.ts":
/*!**********************************************!*\
  !*** ./src/js/utils/expireableDictionary.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// This class can be used to concurrently cache items, or fetch their values.
class ExpirableDictionary {
    lockKey;
    expirationInMilliseconds;
    // The items that are in the dictionary.
    items = {};
    constructor(
    // A name for the dictionary, used for locking.
    name, 
    // How long the item will remain in the dictionary, in milliseconds.
    expirationInMilliseconds) {
        this.lockKey = `ExpirableDictionary:${name}`;
        this.expirationInMilliseconds = expirationInMilliseconds;
    }
    // Tries to fetch an item by its key from the dictionary, or it will call the value factory to add it in.
    getOrAdd(key, valueFactory) {
        const item = this.items[key];
        if (item !== undefined) {
            return Promise.resolve(item);
        }
        return new Promise((resolve, reject) => {
            navigator.locks
                .request(`${this.lockKey}:${key}`, async () => {
                // It's possible the item was added since we requested the lock, check again.
                const item = this.items[key];
                if (item !== undefined) {
                    resolve(item);
                    return;
                }
                try {
                    const value = (this.items[key] = await valueFactory());
                    setTimeout(() => this.evict(key), this.expirationInMilliseconds);
                    resolve(value);
                }
                catch (e) {
                    reject(e);
                }
            })
                .catch(reject);
        });
    }
    evict(key) {
        delete this.items[key];
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ExpirableDictionary);


/***/ }),

/***/ "./node_modules/@tix-factory/batch/dist/batch/index.js":
/*!*************************************************************!*\
  !*** ./node_modules/@tix-factory/batch/dist/batch/index.js ***!
  \*************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _promise_queue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../promise-queue */ "./node_modules/@tix-factory/batch/dist/promise-queue/index.js");
/* harmony import */ var _events_errorEvent__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../events/errorEvent */ "./node_modules/@tix-factory/batch/dist/events/errorEvent.js");
/* harmony import */ var _events_itemErrorEvent__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../events/itemErrorEvent */ "./node_modules/@tix-factory/batch/dist/events/itemErrorEvent.js");



// A class for batching and processing multiple single items into a single call.
class Batch extends EventTarget {
    queueMap = {};
    promiseMap = {};
    limiter;
    concurrencyHandler;
    // All the batch items waiting to be processed.
    queueArray = [];
    // The configuration for this batch processor.
    config;
    constructor(configuration) {
        super();
        this.config = configuration;
        this.limiter = new _promise_queue__WEBPACK_IMPORTED_MODULE_0__["default"]({
            levelOfParallelism: 1,
            delayInMilliseconds: configuration.minimumDelay || 0,
        });
        this.concurrencyHandler = new _promise_queue__WEBPACK_IMPORTED_MODULE_0__["default"]({
            levelOfParallelism: configuration.levelOfParallelism || Infinity,
        });
    }
    // Enqueues an item into a batch, to be processed.
    enqueue(item) {
        return new Promise((resolve, reject) => {
            const key = this.getKey(item);
            const promiseMap = this.promiseMap;
            const queueArray = this.queueArray;
            const queueMap = this.queueMap;
            const retryCount = this.config.retryCount || 0;
            const getRetryDelay = this.getRetryDelay.bind(this);
            const dispatchEvent = this.dispatchEvent.bind(this);
            const check = this.check.bind(this);
            // Step 1: Ensure we have a way to resolve/reject the promise for this item.
            const mergedPromise = promiseMap[key] || [];
            if (mergedPromise.length < 0) {
                this.promiseMap[key] = mergedPromise;
            }
            mergedPromise.push({ resolve, reject });
            // Step 2: Check if we have the batched item created.
            if (!queueMap[key]) {
                const remove = (item) => {
                    // Mark the item as completed, so we know we either resolved or rejected it.
                    item.completed = true;
                    for (let i = 0; i < queueArray.length; i++) {
                        if (queueArray[i].key === key) {
                            queueArray.splice(i, 1);
                            break;
                        }
                    }
                    delete promiseMap[key];
                    delete queueMap[key];
                };
                const batchItem = {
                    key,
                    value: item,
                    attempt: 0,
                    retryAfter: 0,
                    completed: false,
                    resolve(result) {
                        // We're not accepting any new items for this resolution.
                        remove(this);
                        // Defer the resolution until after the thread resolves.
                        setTimeout(() => {
                            // Process anyone who applied.
                            while (mergedPromise.length > 0) {
                                const promise = mergedPromise.shift();
                                promise?.resolve(result);
                            }
                        }, 0);
                    },
                    reject(error) {
                        // Defer the resolution until after the thread resolves.
                        const retryDelay = this.attempt <= retryCount ? getRetryDelay(this) : undefined;
                        const retryAfter = retryDelay !== undefined
                            ? performance.now() + retryDelay
                            : undefined;
                        // Emit an event to notify that the item failed to process.
                        dispatchEvent(new _events_itemErrorEvent__WEBPACK_IMPORTED_MODULE_2__["default"](error, this, retryAfter));
                        if (retryAfter !== undefined) {
                            // The item can be retried, we haven't hit the maximum number of attempts yet.
                            this.retryAfter = retryAfter;
                            // Ensure the check runs after the retry delay.
                            setTimeout(check, retryDelay);
                        }
                        else {
                            // Remove the item, and reject anyone waiting on it.
                            remove(this);
                            // Defer the resolution until after the thread resolves.
                            setTimeout(() => {
                                // Process anyone who applied.
                                while (mergedPromise.length > 0) {
                                    const promise = mergedPromise.shift();
                                    promise?.reject(error);
                                }
                            }, 0);
                        }
                    },
                };
                queueMap[key] = batchItem;
                queueArray.push(batchItem);
            }
            // Attempt to process the queue on the next event loop.
            setTimeout(check, this.config.enqueueDeferDelay);
        });
    }
    // Batches together queued items, calls the process method.
    // Will do nothing if the config requirements aren't met.
    check() {
        if (this.limiter.size > 0) {
            // Already being checked.
            return;
        }
        // We're using p-limit to ensure that multiple process calls can't be called at once.
        this.limiter.enqueue(this._check.bind(this)).catch((err) => {
            // This should be "impossible".. right?
            this.dispatchEvent(new _events_errorEvent__WEBPACK_IMPORTED_MODULE_1__["default"](err));
        });
    }
    // The actual implementation of the check method.
    _check() {
        const retry = this.check.bind(this);
        // Get a batch of items to process.
        const batch = this.getBatch();
        // Nothing in the queue ready to be processed.
        if (batch.length < 1) {
            return Promise.resolve();
        }
        // Update the items that we're about to process, so they don't get double processed.
        batch.forEach((item) => {
            item.attempt += 1;
            item.retryAfter = Infinity;
        });
        setTimeout(async () => {
            try {
                await this.concurrencyHandler.enqueue(this.process.bind(this, batch));
            }
            catch (err) {
                this.dispatchEvent(new _events_errorEvent__WEBPACK_IMPORTED_MODULE_1__["default"](err));
            }
            finally {
                batch.forEach((item) => {
                    if (item.completed) {
                        // Item completed its processing, nothing more to do.
                        return;
                    }
                    else if (item.retryAfter > 0 && item.retryAfter !== Infinity) {
                        // The item failed to process, but it is going to be retried.
                        return;
                    }
                    else {
                        // Item neither rejected, or completed its processing status.
                        // This is a requirement, so we reject the item.
                        item.reject(new Error('Item was not marked as resolved or rejected after batch processing completed.'));
                    }
                });
                // Now that we've finished processing the batch, run the process again, just in case there's anything left.
                setTimeout(retry, 0);
            }
        }, 0);
        if (batch.length >= this.config.maxSize) {
            // We have the maximum number of items in the batch, let's make sure we kick off the process call again.
            setTimeout(retry, this.config.minimumDelay);
        }
        return Promise.resolve();
    }
    getBatch() {
        const now = performance.now();
        const batch = [];
        for (let i = 0; i < this.queueArray.length; i++) {
            const batchItem = this.queueArray[i];
            if (batchItem.retryAfter > now) {
                // Item is not ready to be retried, or it is currently being processed.
                continue;
            }
            batch.push(batchItem);
            if (batch.length >= this.config.maxSize) {
                break;
            }
        }
        return batch;
    }
    // Obtains a unique key to identify the item.
    // This is used to deduplicate the batched items.
    getKey(item) {
        return item === undefined ? 'undefined' : JSON.stringify(item);
    }
    // Returns how long to wait before retrying the item.
    getRetryDelay(item) {
        return 0;
    }
    // Called when it is time to process a batch of items.
    process(items) {
        return Promise.reject(new Error('Inherit this class, and implement the processBatch method.'));
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Batch);


/***/ }),

/***/ "./node_modules/@tix-factory/batch/dist/events/errorEvent.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@tix-factory/batch/dist/events/errorEvent.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// An event class which can be used to emit an error.
class ErrorEvent extends Event {
    // The error associated with the event.
    error;
    // Constructs the event from the error.
    constructor(error) {
        super('error');
        this.error = error;
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ErrorEvent);


/***/ }),

/***/ "./node_modules/@tix-factory/batch/dist/events/itemErrorEvent.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@tix-factory/batch/dist/events/itemErrorEvent.js ***!
  \***********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _errorEvent__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./errorEvent */ "./node_modules/@tix-factory/batch/dist/events/errorEvent.js");

// An event class which can be used to emit an error event for an item that failed to process.
class ItemErrorEvent extends _errorEvent__WEBPACK_IMPORTED_MODULE_0__["default"] {
    // The item that failed to process.
    batchItem;
    // The amount of time when the item will be retried.
    retryAfter;
    // Constructs the event from the error.
    constructor(error, batchItem, retryAfter) {
        super(error);
        this.batchItem = batchItem;
        this.retryAfter = retryAfter;
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ItemErrorEvent);


/***/ }),

/***/ "./node_modules/@tix-factory/batch/dist/index.js":
/*!*******************************************************!*\
  !*** ./node_modules/@tix-factory/batch/dist/index.js ***!
  \*******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Batch": () => (/* reexport safe */ _batch__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "ErrorEvent": () => (/* reexport safe */ _events_errorEvent__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   "ItemErrorEvent": () => (/* reexport safe */ _events_itemErrorEvent__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   "PromiseQueue": () => (/* reexport safe */ _promise_queue__WEBPACK_IMPORTED_MODULE_3__["default"])
/* harmony export */ });
/* harmony import */ var _batch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./batch */ "./node_modules/@tix-factory/batch/dist/batch/index.js");
/* harmony import */ var _events_errorEvent__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./events/errorEvent */ "./node_modules/@tix-factory/batch/dist/events/errorEvent.js");
/* harmony import */ var _events_itemErrorEvent__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./events/itemErrorEvent */ "./node_modules/@tix-factory/batch/dist/events/itemErrorEvent.js");
/* harmony import */ var _promise_queue__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./promise-queue */ "./node_modules/@tix-factory/batch/dist/promise-queue/index.js");
// Export all the things from this module.






/***/ }),

/***/ "./node_modules/@tix-factory/batch/dist/promise-queue/index.js":
/*!*********************************************************************!*\
  !*** ./node_modules/@tix-factory/batch/dist/promise-queue/index.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// A limiter for running promises in parallel.
// Queue ensures order is maintained.
class PromiseQueue {
    // All the promises that have been enqueued, and are waiting to be processed.
    queue = [];
    // The PromiseQueue configuration.
    config;
    // How many promises are actively being processed.
    activeCount = 0;
    // The next time a promise can be processed.
    nextProcessTime = 0;
    // Constructs a promise queue, defining the number of promises that may run in parallel.
    constructor(config) {
        this.config = config;
    }
    // The number of promises waiting to be processed.
    get size() {
        return this.queue.length;
    }
    // Puts a function that will create the promise to run on the queue, and returns a promise
    // that will return the result of the enqueued promise.
    enqueue(createPromise) {
        return new Promise(async (resolve, reject) => {
            this.queue.push({
                deferredPromise: { resolve, reject },
                createPromise,
            });
            await this.process();
        });
    }
    async process() {
        if (this.activeCount >= this.config.levelOfParallelism) {
            // Already running max number of promises in parallel.
            return;
        }
        const reprocess = this.process.bind(this);
        const delayInMilliseconds = this.config.delayInMilliseconds;
        if (delayInMilliseconds !== undefined && delayInMilliseconds > 0) {
            const now = performance.now();
            const remainingTime = this.nextProcessTime - now;
            if (remainingTime > 0) {
                // We're not allowed to process the next promise yet.
                setTimeout(reprocess, remainingTime);
                return;
            }
            this.nextProcessTime = now + delayInMilliseconds;
        }
        const promise = this.queue.shift();
        if (!promise) {
            // No promise to process.
            return;
        }
        this.activeCount++;
        try {
            const result = await promise.createPromise();
            promise.deferredPromise.resolve(result);
        }
        catch (err) {
            promise.deferredPromise.reject(err);
        }
        finally {
            // Ensure we subtract from how many promises are active
            this.activeCount--;
            // And then run the process function again, in case there are any promises left to run.
            setTimeout(reprocess, 0);
        }
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PromiseQueue);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!********************************************!*\
  !*** ./src/js/pages/game-details/index.ts ***!
  \********************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _badgeAwardDates__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./badgeAwardDates */ "./src/js/pages/game-details/badgeAwardDates.ts");
/* harmony import */ var _vote_percentage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./vote-percentage */ "./src/js/pages/game-details/vote-percentage.ts");
/* harmony import */ var _premium_notice__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./premium-notice */ "./src/js/pages/game-details/premium-notice.ts");
/* harmony import */ var _css_pages_game_details_scss__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../css/pages/game-details.scss */ "./src/css/pages/game-details.scss");




setInterval(async () => {
    try {
        (0,_vote_percentage__WEBPACK_IMPORTED_MODULE_1__["default"])(document.querySelector('#vote-up-text'), document.querySelector('#vote-down-text'));
    }
    catch (e) {
        console.error(e);
    }
    try {
        await (0,_badgeAwardDates__WEBPACK_IMPORTED_MODULE_0__.addBadgeAwardedDates)();
    }
    catch (e) {
        console.error(e);
    }
}, 500);

})();

/******/ })()
;
//# sourceMappingURL=game-details.js.map