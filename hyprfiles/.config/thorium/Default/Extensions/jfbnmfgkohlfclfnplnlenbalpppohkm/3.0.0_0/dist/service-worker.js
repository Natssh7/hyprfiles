/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./libs/extension-messaging/dist/constants.js":
/*!****************************************************!*\
  !*** ./libs/extension-messaging/dist/constants.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
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

"use strict";
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

"use strict";
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

"use strict";
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

"use strict";
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

"use strict";
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

/***/ "./libs/roblox/dist/enums/asset-type.js":
/*!**********************************************!*\
  !*** ./libs/roblox/dist/enums/asset-type.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
var AssetType;
(function (AssetType) {
    AssetType[AssetType["Image"] = 1] = "Image";
    AssetType[AssetType["TShirt"] = 2] = "TShirt";
    AssetType[AssetType["Audio"] = 3] = "Audio";
    AssetType[AssetType["Mesh"] = 4] = "Mesh";
    AssetType[AssetType["Lua"] = 5] = "Lua";
    AssetType[AssetType["Html"] = 6] = "Html";
    AssetType[AssetType["Text"] = 7] = "Text";
    AssetType[AssetType["Hat"] = 8] = "Hat";
    AssetType[AssetType["Place"] = 9] = "Place";
    AssetType[AssetType["Model"] = 10] = "Model";
    AssetType[AssetType["Shirt"] = 11] = "Shirt";
    AssetType[AssetType["Pants"] = 12] = "Pants";
    AssetType[AssetType["Decal"] = 13] = "Decal";
    AssetType[AssetType["Avatar"] = 16] = "Avatar";
    AssetType[AssetType["Head"] = 17] = "Head";
    AssetType[AssetType["Face"] = 18] = "Face";
    AssetType[AssetType["Gear"] = 19] = "Gear";
    AssetType[AssetType["Badge"] = 21] = "Badge";
    AssetType[AssetType["GroupEmblem"] = 22] = "GroupEmblem";
    AssetType[AssetType["Animation"] = 24] = "Animation";
    AssetType[AssetType["Arms"] = 25] = "Arms";
    AssetType[AssetType["Legs"] = 26] = "Legs";
    AssetType[AssetType["Torso"] = 27] = "Torso";
    AssetType[AssetType["RightArm"] = 28] = "RightArm";
    AssetType[AssetType["LeftArm"] = 29] = "LeftArm";
    AssetType[AssetType["LeftLeg"] = 30] = "LeftLeg";
    AssetType[AssetType["RightLeg"] = 31] = "RightLeg";
    AssetType[AssetType["Package"] = 32] = "Package";
    AssetType[AssetType["YouTubeVideo"] = 33] = "YouTubeVideo";
    AssetType[AssetType["GamePass"] = 34] = "GamePass";
    AssetType[AssetType["App"] = 35] = "App";
    AssetType[AssetType["Code"] = 37] = "Code";
    AssetType[AssetType["Plugin"] = 38] = "Plugin";
    AssetType[AssetType["SolidModel"] = 39] = "SolidModel";
    AssetType[AssetType["MeshPart"] = 40] = "MeshPart";
    AssetType[AssetType["HairAccessory"] = 41] = "HairAccessory";
    AssetType[AssetType["FaceAccessory"] = 42] = "FaceAccessory";
    AssetType[AssetType["NeckAccessory"] = 43] = "NeckAccessory";
    AssetType[AssetType["ShoulderAccessory"] = 44] = "ShoulderAccessory";
    AssetType[AssetType["FrontAccessory"] = 45] = "FrontAccessory";
    AssetType[AssetType["BackAccessory"] = 46] = "BackAccessory";
    AssetType[AssetType["WaistAccessory"] = 47] = "WaistAccessory";
    AssetType[AssetType["ClimbAnimation"] = 48] = "ClimbAnimation";
    AssetType[AssetType["DeathAnimation"] = 49] = "DeathAnimation";
    AssetType[AssetType["FallAnimation"] = 50] = "FallAnimation";
    AssetType[AssetType["IdleAnimation"] = 51] = "IdleAnimation";
    AssetType[AssetType["JumpAnimation"] = 52] = "JumpAnimation";
    AssetType[AssetType["RunAnimation"] = 53] = "RunAnimation";
    AssetType[AssetType["SwimAnimation"] = 54] = "SwimAnimation";
    AssetType[AssetType["WalkAnimation"] = 55] = "WalkAnimation";
    AssetType[AssetType["PoseAnimation"] = 56] = "PoseAnimation";
    AssetType[AssetType["EarAccessory"] = 57] = "EarAccessory";
    AssetType[AssetType["EyeAccessory"] = 58] = "EyeAccessory";
    AssetType[AssetType["LocalizationTableManifest"] = 59] = "LocalizationTableManifest";
    AssetType[AssetType["LocalizationTableTranslation"] = 60] = "LocalizationTableTranslation";
    AssetType[AssetType["Emote"] = 61] = "Emote";
    AssetType[AssetType["Video"] = 62] = "Video";
    AssetType[AssetType["TexturePack"] = 63] = "TexturePack";
    AssetType[AssetType["TShirtAccessory"] = 64] = "TShirtAccessory";
    AssetType[AssetType["ShirtAccessory"] = 65] = "ShirtAccessory";
    AssetType[AssetType["PantsAccessory"] = 66] = "PantsAccessory";
    AssetType[AssetType["JacketAccessory"] = 67] = "JacketAccessory";
    AssetType[AssetType["SweaterAccessory"] = 68] = "SweaterAccessory";
    AssetType[AssetType["ShortsAccessory"] = 69] = "ShortsAccessory";
    AssetType[AssetType["LeftShoeAccessory"] = 70] = "LeftShoeAccessory";
    AssetType[AssetType["RightShoeAccessory"] = 71] = "RightShoeAccessory";
    AssetType[AssetType["DressSkirtAccessory"] = 72] = "DressSkirtAccessory";
    AssetType[AssetType["FontFamily"] = 73] = "FontFamily";
    AssetType[AssetType["FontFace"] = 74] = "FontFace";
    AssetType[AssetType["MeshHiddenSurfaceRemoval"] = 75] = "MeshHiddenSurfaceRemoval";
    AssetType[AssetType["EyebrowAccessory"] = 76] = "EyebrowAccessory";
    AssetType[AssetType["EyelashAccessory"] = 77] = "EyelashAccessory";
    AssetType[AssetType["MoodAnimation"] = 78] = "MoodAnimation";
    AssetType[AssetType["DynamicHead"] = 79] = "DynamicHead";
})(AssetType || (AssetType = {}));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (AssetType);


/***/ }),

/***/ "./libs/roblox/dist/enums/presence-type.js":
/*!*************************************************!*\
  !*** ./libs/roblox/dist/enums/presence-type.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// The types of user presence.
var PresenceType;
(function (PresenceType) {
    // The user is offline.
    PresenceType["Offline"] = "Offline";
    // The user is online.
    PresenceType["Online"] = "Online";
    // The user is currently in an experience.
    PresenceType["Experience"] = "Experience";
    // The user is currently in Roblox Studio.
    PresenceType["Studio"] = "Studio";
})(PresenceType || (PresenceType = {}));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PresenceType);


/***/ }),

/***/ "./libs/roblox/dist/enums/thumbnail-state.js":
/*!***************************************************!*\
  !*** ./libs/roblox/dist/enums/thumbnail-state.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// Possible states for a thumbnail to be in.
var ThumbnailState;
(function (ThumbnailState) {
    // The thumbnail had an unexpected error trying to load.
    ThumbnailState["Error"] = "Error";
    // The thumbnailed loaded successfully.
    ThumbnailState["Completed"] = "Completed";
    // The thumbnail is currently in review.
    ThumbnailState["InReview"] = "InReview";
    // The thumbnail is pending, and should be retried.
    ThumbnailState["Pending"] = "Pending";
    // The thumbnail is blocked.
    ThumbnailState["Blocked"] = "Blocked";
    // The thumbnail is temporarily unavailable.
    ThumbnailState["TemporarilyUnavailable"] = "TemporarilyUnavailable";
})(ThumbnailState || (ThumbnailState = {}));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ThumbnailState);


/***/ }),

/***/ "./libs/roblox/dist/enums/thumbnail-type.js":
/*!**************************************************!*\
  !*** ./libs/roblox/dist/enums/thumbnail-type.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// The types of thumbnails that can be requested.
var ThumbnailType;
(function (ThumbnailType) {
    // An avatar head shot thumbnail.
    ThumbnailType["AvatarHeadShot"] = "AvatarHeadShot";
    // The thumbnail for an asset.
    ThumbnailType["Asset"] = "Asset";
    // The icon for a group.
    ThumbnailType["GroupIcon"] = "GroupIcon";
    // The icon for a game pass.
    ThumbnailType["GamePass"] = "GamePass";
    // The icon for a developer product.
    ThumbnailType["DeveloperProduct"] = "DeveloperProduct";
    // The icon for a game.
    ThumbnailType["GameIcon"] = "GameIcon";
})(ThumbnailType || (ThumbnailType = {}));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ThumbnailType);


/***/ }),

/***/ "./libs/roblox/dist/enums/trade-status-type.js":
/*!*****************************************************!*\
  !*** ./libs/roblox/dist/enums/trade-status-type.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
var TradeStatusType;
(function (TradeStatusType) {
    TradeStatusType["Inbound"] = "Inbound";
    TradeStatusType["Outbound"] = "Outbound";
    TradeStatusType["Completed"] = "Completed";
    TradeStatusType["Inactive"] = "Inactive";
})(TradeStatusType || (TradeStatusType = {}));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (TradeStatusType);


/***/ }),

/***/ "./libs/roblox/dist/index.js":
/*!***********************************!*\
  !*** ./libs/roblox/dist/index.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AssetType": () => (/* reexport safe */ _enums_asset_type__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "PresenceType": () => (/* reexport safe */ _enums_presence_type__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   "ThumbnailState": () => (/* reexport safe */ _enums_thumbnail_state__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   "ThumbnailType": () => (/* reexport safe */ _enums_thumbnail_type__WEBPACK_IMPORTED_MODULE_3__["default"]),
/* harmony export */   "TradeStatusType": () => (/* reexport safe */ _enums_trade_status_type__WEBPACK_IMPORTED_MODULE_4__["default"]),
/* harmony export */   "getCatalogLink": () => (/* reexport safe */ _utils_linkify__WEBPACK_IMPORTED_MODULE_5__.getCatalogLink),
/* harmony export */   "getGamePassLink": () => (/* reexport safe */ _utils_linkify__WEBPACK_IMPORTED_MODULE_5__.getGamePassLink),
/* harmony export */   "getGroupLink": () => (/* reexport safe */ _utils_linkify__WEBPACK_IMPORTED_MODULE_5__.getGroupLink),
/* harmony export */   "getIdFromUrl": () => (/* reexport safe */ _utils_linkify__WEBPACK_IMPORTED_MODULE_5__.getIdFromUrl),
/* harmony export */   "getLibraryLink": () => (/* reexport safe */ _utils_linkify__WEBPACK_IMPORTED_MODULE_5__.getLibraryLink),
/* harmony export */   "getPlaceLink": () => (/* reexport safe */ _utils_linkify__WEBPACK_IMPORTED_MODULE_5__.getPlaceLink),
/* harmony export */   "getUserProfileLink": () => (/* reexport safe */ _utils_linkify__WEBPACK_IMPORTED_MODULE_5__.getUserProfileLink)
/* harmony export */ });
/* harmony import */ var _enums_asset_type__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./enums/asset-type */ "./libs/roblox/dist/enums/asset-type.js");
/* harmony import */ var _enums_presence_type__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./enums/presence-type */ "./libs/roblox/dist/enums/presence-type.js");
/* harmony import */ var _enums_thumbnail_state__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./enums/thumbnail-state */ "./libs/roblox/dist/enums/thumbnail-state.js");
/* harmony import */ var _enums_thumbnail_type__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./enums/thumbnail-type */ "./libs/roblox/dist/enums/thumbnail-type.js");
/* harmony import */ var _enums_trade_status_type__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./enums/trade-status-type */ "./libs/roblox/dist/enums/trade-status-type.js");
/* harmony import */ var _utils_linkify__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils/linkify */ "./libs/roblox/dist/utils/linkify.js");
// Export enums





// Export utils



/***/ }),

/***/ "./libs/roblox/dist/utils/linkify.js":
/*!*******************************************!*\
  !*** ./libs/roblox/dist/utils/linkify.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getCatalogLink": () => (/* binding */ getCatalogLink),
/* harmony export */   "getGamePassLink": () => (/* binding */ getGamePassLink),
/* harmony export */   "getGroupLink": () => (/* binding */ getGroupLink),
/* harmony export */   "getIdFromUrl": () => (/* binding */ getIdFromUrl),
/* harmony export */   "getLibraryLink": () => (/* binding */ getLibraryLink),
/* harmony export */   "getPlaceLink": () => (/* binding */ getPlaceLink),
/* harmony export */   "getUserProfileLink": () => (/* binding */ getUserProfileLink)
/* harmony export */ });
const getSEOLink = (id, name, path) => {
    if (!name) {
        name = 'redirect';
    }
    else {
        name =
            name
                .replace(/'/g, '')
                .replace(/\W+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '') || 'redirect';
    }
    return new URL(`https://www.roblox.com/${path}/${id}/${name}`);
};
const getGroupLink = (groupId, groupName) => {
    return getSEOLink(groupId, groupName, 'groups');
};
const getGamePassLink = (gamePassId, gamePassName) => {
    return getSEOLink(gamePassId, gamePassName, 'game-pass');
};
const getCatalogLink = (assetId, assetName) => {
    return getSEOLink(assetId, assetName, 'catalog');
};
const getLibraryLink = (assetId, assetName) => {
    return getSEOLink(assetId, assetName, 'library');
};
const getPlaceLink = (placeId, placeName) => {
    return getSEOLink(placeId, placeName, 'games');
};
const getUserProfileLink = (userId) => {
    return getSEOLink(userId, 'profile', 'users');
};
const getIdFromUrl = (url) => {
    const match = url.pathname.match(/^\/(badges|games|game-pass|groups|catalog|library|users)\/(\d+)\/?/i) || [];
    // Returns NaN if the URL doesn't match.
    return Number(match[2]);
};



/***/ }),

/***/ "./node_modules/db.js/dist/db.min.js":
/*!*******************************************!*\
  !*** ./node_modules/db.js/dist/db.min.js ***!
  \*******************************************/
/***/ ((module) => {

!function(a){if(true)module.exports=a();else { var b; }}(function(){var a;return function b(a,c,d){function e(g,h){if(!c[g]){if(!a[g]){var i=undefined;if(!h&&i)return require(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};a[g][0].call(k.exports,function(b){var c=a[g][1][b];return e(c?c:b)},k,k.exports,b,a,c,d)}return c[g].exports}for(var f=undefined,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(b,c,d){"use strict";function e(a){if(Array.isArray(a)){for(var b=0,c=Array(a.length);b<a.length;b++)c[b]=a[b];return c}return Array.from(a)}var f=function(){function a(a,b){var c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done)&&(c.push(g.value),!b||c.length!==b);d=!0);}catch(i){e=!0,f=i}finally{try{!d&&h["return"]&&h["return"]()}finally{if(e)throw f}}return c}return function(b,c){if(Array.isArray(b))return b;if(Symbol.iterator in Object(b))return a(b,c);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),g="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(a){return typeof a}:function(a){return a&&"function"==typeof Symbol&&a.constructor===Symbol?"symbol":typeof a};!function(b){function d(a){return a&&"object"===("undefined"==typeof a?"undefined":g(a))}function h(a){var b=Object.keys(a).sort();if(1===b.length){var c=b[0],d=a[c],e=void 0,f=void 0;switch(c){case"eq":e="only";break;case"gt":e="lowerBound",f=!0;break;case"lt":e="upperBound",f=!0;break;case"gte":e="lowerBound";break;case"lte":e="upperBound";break;default:throw new TypeError("`"+c+"` is not a valid key")}return[e,[d,f]]}var g=a[b[0]],h=a[b[1]],i=b.join("-");switch(i){case"gt-lt":case"gt-lte":case"gte-lt":case"gte-lte":return["bound",[g,h,"gt"===b[0],"lt"===b[1]]];default:throw new TypeError("`"+i+"` are conflicted keys")}}function i(a){if(a&&"object"===("undefined"==typeof a?"undefined":g(a))&&!(a instanceof j)){var b=h(a),c=f(b,2),d=c[0],i=c[1];return j[d].apply(j,e(i))}return a}var j=b.IDBKeyRange||b.webkitIDBKeyRange,k={readonly:"readonly",readwrite:"readwrite"},l=Object.prototype.hasOwnProperty,m=function(a){return a},n=b.indexedDB||b.webkitIndexedDB||b.mozIndexedDB||b.oIndexedDB||b.msIndexedDB||b.shimIndexedDB||function(){throw new Error("IndexedDB required")}(),o={},p=["abort","error","versionchange"],q=function(a,b,c,d){var f=this,i=null,l=function(d,f,h,l,m,n,o){return new Promise(function(p,q){var r=void 0;try{r=d?j[d].apply(j,e(f)):null}catch(s){return void q(s)}n=n||[],m=m||null;var t=[],u=0,v=[r],w=b.transaction(a,i?k.readwrite:k.readonly);w.onerror=function(a){return q(a)},w.onabort=function(a){return q(a)},w.oncomplete=function(){return p(t)};var x=w.objectStore(a),y="string"==typeof c?x.index(c):x;"count"!==h&&v.push(l||"next");var z=i?Object.keys(i):[],A=function(a){return z.forEach(function(b){var c=i[b];"function"==typeof c&&(c=c(a)),a[b]=c}),a};y[h].apply(y,v).onsuccess=function(a){var b=a.target.result;if("number"==typeof b)t=b;else if(b)if(null!==m&&m[0]>u)u=m[0],b.advance(m[0]);else if(null!==m&&u>=m[0]+m[1]);else{var c=function(){var a=!0,c="value"in b?b.value:b.key;try{n.forEach(function(b){a="function"==typeof b[0]?a&&b[0](c):a&&c[b[0]]===b[1]})}catch(d){return q(d),{v:void 0}}if(a){if(u++,i)try{c=A(c),b.update(c)}catch(d){return q(d),{v:void 0}}try{t.push(o(c))}catch(d){return q(d),{v:void 0}}}b["continue"]()}();if("object"===("undefined"==typeof c?"undefined":g(c)))return c.v}}})},n=function(a,b,c){var e=[],f="next",h="openCursor",j=null,k=m,n=!1,o=d||c,p=function(){return o?Promise.reject(o):l(a,b,h,n?f+"unique":f,j,e,k)},q=function(){return f=null,h="count",{execute:p}},r=function(){return h="openKeyCursor",{desc:u,distinct:v,execute:p,filter:t,limit:s,map:x}},s=function(a,b){return j=b?[a,b]:[0,a],o=j.some(function(a){return"number"!=typeof a})?new Error("limit() arguments must be numeric"):o,{desc:u,distinct:v,filter:t,keys:r,execute:p,map:x,modify:w}},t=function y(a,b){return e.push([a,b]),{desc:u,distinct:v,execute:p,filter:y,keys:r,limit:s,map:x,modify:w}},u=function(){return f="prev",{distinct:v,execute:p,filter:t,keys:r,limit:s,map:x,modify:w}},v=function(){return n=!0,{count:q,desc:u,execute:p,filter:t,keys:r,limit:s,map:x,modify:w}},w=function(a){return i=a&&"object"===("undefined"==typeof a?"undefined":g(a))?a:null,{execute:p}},x=function(a){return k=a,{count:q,desc:u,distinct:v,execute:p,filter:t,keys:r,limit:s,modify:w}};return{count:q,desc:u,distinct:v,execute:p,filter:t,keys:r,limit:s,map:x,modify:w}};["only","bound","upperBound","lowerBound"].forEach(function(a){f[a]=function(){return n(a,arguments)}}),this.range=function(a){var b=void 0,c=[null,null];try{c=h(a)}catch(d){b=d}return n.apply(void 0,e(c).concat([b]))},this.filter=function(){var a=n(null,null);return a.filter.apply(a,arguments)},this.all=function(){return this.filter()}},r=function(a,b,c,e){var f=this,g=!1;if(this.getIndexedDB=function(){return a},this.isClosed=function(){return g},this.query=function(b,c){var d=g?new Error("Database has been closed"):null;return new q(b,a,c,d)},this.add=function(b){for(var c=arguments.length,e=Array(c>1?c-1:0),f=1;c>f;f++)e[f-1]=arguments[f];return new Promise(function(c,f){if(g)return void f(new Error("Database has been closed"));var h=e.reduce(function(a,b){return a.concat(b)},[]),j=a.transaction(b,k.readwrite);j.onerror=function(a){a.preventDefault(),f(a)},j.onabort=function(a){return f(a)},j.oncomplete=function(){return c(h)};var m=j.objectStore(b);h.some(function(a){var b=void 0,c=void 0;if(d(a)&&l.call(a,"item")&&(c=a.key,a=a.item,null!=c))try{c=i(c)}catch(e){return f(e),!0}try{b=null!=c?m.add(a,c):m.add(a)}catch(e){return f(e),!0}b.onsuccess=function(b){if(d(a)){var c=b.target,e=c.source.keyPath;null===e&&(e="__id__"),l.call(a,e)||Object.defineProperty(a,e,{value:c.result,enumerable:!0})}}})})},this.update=function(b){for(var c=arguments.length,e=Array(c>1?c-1:0),f=1;c>f;f++)e[f-1]=arguments[f];return new Promise(function(c,f){if(g)return void f(new Error("Database has been closed"));var h=e.reduce(function(a,b){return a.concat(b)},[]),j=a.transaction(b,k.readwrite);j.onerror=function(a){a.preventDefault(),f(a)},j.onabort=function(a){return f(a)},j.oncomplete=function(){return c(h)};var m=j.objectStore(b);h.some(function(a){var b=void 0,c=void 0;if(d(a)&&l.call(a,"item")&&(c=a.key,a=a.item,null!=c))try{c=i(c)}catch(e){return f(e),!0}try{b=null!=c?m.put(a,c):m.put(a)}catch(g){return f(g),!0}b.onsuccess=function(b){if(d(a)){var c=b.target,e=c.source.keyPath;null===e&&(e="__id__"),l.call(a,e)||Object.defineProperty(a,e,{value:c.result,enumerable:!0})}}})})},this.put=function(){return this.update.apply(this,arguments)},this.remove=function(b,c){return new Promise(function(d,e){if(g)return void e(new Error("Database has been closed"));try{c=i(c)}catch(f){return void e(f)}var h=a.transaction(b,k.readwrite);h.onerror=function(a){a.preventDefault(),e(a)},h.onabort=function(a){return e(a)},h.oncomplete=function(){return d(c)};var j=h.objectStore(b);try{j["delete"](c)}catch(l){e(l)}})},this["delete"]=function(){return this.remove.apply(this,arguments)},this.clear=function(b){return new Promise(function(c,d){if(g)return void d(new Error("Database has been closed"));var e=a.transaction(b,k.readwrite);e.onerror=function(a){return d(a)},e.onabort=function(a){return d(a)},e.oncomplete=function(){return c()};var f=e.objectStore(b);f.clear()})},this.close=function(){return new Promise(function(d,e){return g?void e(new Error("Database has been closed")):(a.close(),g=!0,delete o[b][c],void d())})},this.get=function(b,c){return new Promise(function(d,e){if(g)return void e(new Error("Database has been closed"));try{c=i(c)}catch(f){return void e(f)}var h=a.transaction(b);h.onerror=function(a){a.preventDefault(),e(a)},h.onabort=function(a){return e(a)};var j=h.objectStore(b),k=void 0;try{k=j.get(c)}catch(l){e(l)}k.onsuccess=function(a){return d(a.target.result)}})},this.count=function(b,c){return new Promise(function(d,e){if(g)return void e(new Error("Database has been closed"));try{c=i(c)}catch(f){return void e(f)}var h=a.transaction(b);h.onerror=function(a){a.preventDefault(),e(a)},h.onabort=function(a){return e(a)};var j=h.objectStore(b),k=void 0;try{k=null==c?j.count():j.count(c)}catch(l){e(l)}k.onsuccess=function(a){return d(a.target.result)}})},this.addEventListener=function(b,c){if(!p.includes(b))throw new Error("Unrecognized event type "+b);return"error"===b?void a.addEventListener(b,function(a){a.preventDefault(),c(a)}):void a.addEventListener(b,c)},this.removeEventListener=function(b,c){if(!p.includes(b))throw new Error("Unrecognized event type "+b);a.removeEventListener(b,c)},p.forEach(function(a){this[a]=function(b){return this.addEventListener(a,b),this}},this),!e){var h=void 0;return[].some.call(a.objectStoreNames,function(a){if(f[a])return h=new Error('The store name, "'+a+'", which you have attempted to load, conflicts with db.js method names."'),f.close(),!0;f[a]={};var b=Object.keys(f);b.filter(function(a){return![].concat(p,["close","addEventListener","removeEventListener"]).includes(a)}).map(function(b){return f[a][b]=function(){for(var c=arguments.length,d=Array(c),e=0;c>e;e++)d[e]=arguments[e];return f[b].apply(f,[a].concat(d))}})}),h}},s=function(a,b,c,d,e,f){if(c&&0!==c.length){for(var h=0;h<d.objectStoreNames.length;h++){var i=d.objectStoreNames[h];l.call(c,i)||d.deleteObjectStore(i)}var j=void 0;return Object.keys(c).some(function(a){var e=c[a],f=void 0;if(d.objectStoreNames.contains(a))f=b.transaction.objectStore(a);else try{f=d.createObjectStore(a,e.key)}catch(h){return j=h,!0}Object.keys(e.indexes||{}).some(function(a){try{f.index(a)}catch(b){var c=e.indexes[a];c=c&&"object"===("undefined"==typeof c?"undefined":g(c))?c:{};try{f.createIndex(a,c.keyPath||c.key||a,c)}catch(d){return j=d,!0}}})}),j}},t=function(a,b,c,d){var e=a.target.result;o[b][c]=e;var f=new r(e,b,c,d);return f instanceof Error?Promise.reject(f):Promise.resolve(f)},u={version:"0.15.0",open:function(a){var b=a.server,c=a.version||1,d=a.schema,e=a.noServerMethods;return o[b]||(o[b]={}),new Promise(function(a,f){if(o[b][c])t({target:{result:o[b][c]}},b,c,e).then(a,f);else{var h=function(){if("function"==typeof d)try{d=d()}catch(g){return f(g),{v:void 0}}var h=n.open(b,c);h.onsuccess=function(d){return t(d,b,c,e).then(a,f)},h.onerror=function(a){a.preventDefault(),f(a)},h.onupgradeneeded=function(a){var e=s(a,h,d,a.target.result,b,c);e&&f(e)},h.onblocked=function(a){var d=new Promise(function(a,d){h.onsuccess=function(f){t(f,b,c,e).then(a,d)},h.onerror=function(a){return d(a)}});a.resume=d,f(a)}}();if("object"===("undefined"==typeof h?"undefined":g(h)))return h.v}})},"delete":function(a){return new Promise(function(b,c){var d=n.deleteDatabase(a);d.onsuccess=function(a){return b(a)},d.onerror=function(a){return c(a)},d.onblocked=function(a){a=null===a.newVersion||"undefined"==typeof Proxy?a:new Proxy(a,{get:function(a,b){return"newVersion"===b?null:a[b]}});var b=new Promise(function(b,c){d.onsuccess=function(c){"newVersion"in c||(c.newVersion=a.newVersion),"oldVersion"in c||(c.oldVersion=a.oldVersion),b(c)},d.onerror=function(a){return c(a)}});a.resume=b,c(a)}})},cmp:function(a,b){return new Promise(function(c,d){try{c(n.cmp(a,b))}catch(e){d(e)}})}};"undefined"!=typeof c&&"undefined"!=typeof c.exports?c.exports=u:"function"==typeof a&&a.amd?a(function(){return u}):b.db=u}(self)},{}]},{},[1])(1)});
//# sourceMappingURL=db.min.js.map

/***/ }),

/***/ "./src/js/service-worker/notifiers/catalog/index.ts":
/*!**********************************************************!*\
  !*** ./src/js/service-worker/notifiers/catalog/index.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _services_followings__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../services/followings */ "./src/js/services/followings/index.ts");
/* harmony import */ var _services_settings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../services/settings */ "./src/js/services/settings/index.ts");
/* harmony import */ var _services_users__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../services/users */ "./src/js/services/users/index.ts");
/* harmony import */ var _utils_fetchDataUri__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../utils/fetchDataUri */ "./src/js/utils/fetchDataUri.ts");




const tokenRefreshInterval = 30 * 60 * 1000;
const notificationIdPrefix = 'catalog_notifier:';
const isEnabled = () => {
    return (0,_services_settings__WEBPACK_IMPORTED_MODULE_1__.getToggleSettingValue)('itemNotifier');
};
const updateToken = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const enabled = await isEnabled();
            if (!enabled) {
                // Do nothing if the notifier is not enabled.
                resolve();
                return;
            }
            const authenticatedUser = await (0,_services_users__WEBPACK_IMPORTED_MODULE_2__.getAuthenticatedUser)();
            // @ts-ignore:next-line: https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/65809
            chrome.instanceID.getToken({ authorizedEntity: '303497097698', scope: 'FCM' }, (token) => {
                fetch('https://api.roblox.plus/v2/itemnotifier/registertoken', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `robloxUserId=${authenticatedUser?.id}&token=${encodeURIComponent(token)}`,
                })
                    .then((response) => {
                    if (response.ok) {
                        resolve();
                    }
                    else {
                        reject();
                    }
                })
                    .catch(reject);
            });
        }
        catch (err) {
            reject(err);
        }
    });
};
const shouldShowNotification = async (creatorName) => {
    // This logic is no longer valid, but still in use. It doesn't support group creators, it assumes all creators are users that can be followed.
    // As a result: No notifications for group-created items will be shown.
    if (!creatorName) {
        // If there's no creator on the notification, it is assumed to be created by the Roblox account.
        // And of course everyone wants these notifications.. right?
        return true;
    }
    const authenticatedUser = await (0,_services_users__WEBPACK_IMPORTED_MODULE_2__.getAuthenticatedUser)();
    if (!authenticatedUser) {
        // Not logged in, no notification.
        return false;
    }
    if (authenticatedUser.name === creatorName) {
        // Of course you always want to see your own notifications.
        return true;
    }
    const creator = await (0,_services_users__WEBPACK_IMPORTED_MODULE_2__.getUserByName)(creatorName);
    if (!creator) {
        // Couldn't determine who the user is, so no notification will be visible. Cool.
        return false;
    }
    // And the final kicker... you can only see notifications if you follow the creator.
    const isFollowing = await (0,_services_followings__WEBPACK_IMPORTED_MODULE_0__.isAuthenticatedUserFollowing)(creator.id);
    return isFollowing;
};
const processNotification = async (notification) => {
    const showNotification = await shouldShowNotification(notification.items?.Creator);
    if (!showNotification) {
        console.log('Skipping notification, likely because the authenticated user does not follow the creator', notification);
        return;
    }
    const requireProperties = ['icon', 'url', 'title', 'message'];
    for (let i = 0; i < requireProperties.length; i++) {
        if (!notification[requireProperties[i]]) {
            console.warn(`Skipping notification because there is no ${requireProperties[i]}`, notification);
            return;
        }
    }
    //console.log('Building notification', notification);
    const iconUrl = await (0,_utils_fetchDataUri__WEBPACK_IMPORTED_MODULE_3__["default"])(new URL(notification.icon));
    const notificationOptions = {
        type: 'basic',
        iconUrl,
        title: notification.title,
        message: notification.message,
    };
    if (notification.items && Object.keys(notification.items).length > 0) {
        notificationOptions.type = 'list';
        notificationOptions.items = [];
        notificationOptions.contextMessage = notification.message;
        for (let title in notification.items) {
            notificationOptions.items.push({
                title,
                message: notification.items[title],
            });
        }
    }
    console.log('Displaying notification', notificationOptions, notification);
    chrome.notifications.create(`${notificationIdPrefix}${notification.url}`, notificationOptions, () => { });
};
const processMessage = async (message) => {
    try {
        const enabled = await isEnabled();
        if (!enabled) {
            return;
        }
        console.log('Processing gcm message', message);
        switch (message.from) {
            case '/topics/catalog-notifier':
            case '/topics/catalog-notifier-premium':
                if (!message.data?.notification) {
                    console.warn('Failed to parse gcm message notification', message);
                    return;
                }
                await processNotification(JSON.parse(message.data.notification));
                return;
            default:
                console.warn('Unknown gcm message sender', message);
                return;
        }
    }
    catch (err) {
        console.error('Failed to process gcm message', err, message);
    }
};
// @ts-ignore:next-line: https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/65809
chrome.instanceID.onTokenRefresh.addListener(updateToken);
chrome.gcm.onMessage.addListener(processMessage);
chrome.notifications.onClicked.addListener((notificationId) => {
    if (!notificationId.startsWith(notificationIdPrefix)) {
        return;
    }
    const url = notificationId.substring(notificationIdPrefix.length);
    if (!url.startsWith('https://www.roblox.com/')) {
        console.warn('Skipped opening URL for notification because it was not for roblox.com', notificationId);
        return;
    }
    chrome.tabs.create({
        url,
        active: true,
    });
});
/*
// Exists for debugging
declare global {
  var processMessage: any;
}

globalThis.processMessage = processMessage;
//*/
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (async (nextTokenUpdate) => {
    const enabled = await isEnabled();
    if (!enabled) {
        return 0;
    }
    // Check to see if it's time to refresh the token
    const now = +new Date();
    if (nextTokenUpdate && nextTokenUpdate > now) {
        return nextTokenUpdate;
    }
    // Send the token to the server
    await updateToken();
    // Update the token again later
    return now + tokenRefreshInterval;
});


/***/ }),

/***/ "./src/js/service-worker/notifiers/friend-presence/index.ts":
/*!******************************************************************!*\
  !*** ./src/js/service-worker/notifiers/friend-presence/index.ts ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var roblox__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! roblox */ "./libs/roblox/dist/index.js");
/* harmony import */ var _services_followings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../services/followings */ "./src/js/services/followings/index.ts");
/* harmony import */ var _services_friends__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../services/friends */ "./src/js/services/friends/index.ts");
/* harmony import */ var _services_game_launch__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../services/game-launch */ "./src/js/services/game-launch/index.ts");
/* harmony import */ var _services_localization__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../services/localization */ "./src/js/services/localization/index.ts");
/* harmony import */ var _services_presence__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../services/presence */ "./src/js/services/presence/index.ts");
/* harmony import */ var _services_settings__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../../services/settings */ "./src/js/services/settings/index.ts");
/* harmony import */ var _services_thumbnails__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../../services/thumbnails */ "./src/js/services/thumbnails/index.ts");
/* harmony import */ var _services_users__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../../services/users */ "./src/js/services/users/index.ts");
/* harmony import */ var _utils_fetchDataUri__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../../utils/fetchDataUri */ "./src/js/utils/fetchDataUri.ts");










// The prefix for the ID of the notification to display.
const notificationIdPrefix = 'friend-notifier-';
// A method to check if two presences match.
const presenceMatches = (a, b) => {
    if (a.type !== b.type) {
        // Not the same presence type, definitely not a match.
        return false;
    }
    if (a.location?.universeId !== b.location?.universeId) {
        // Not the same experience, definitely not a match.
        return false;
    }
    // The type, and location are the same. Must be the same presence.
    return true;
};
const isEnabled = async () => {
    const setting = await (0,_services_settings__WEBPACK_IMPORTED_MODULE_6__.getSettingValue)('friendNotifier');
    return setting?.on === true;
};
const isPresenceTypeEnabled = async (presenceType) => {
    const setting = await (0,_services_settings__WEBPACK_IMPORTED_MODULE_6__.getSettingValue)('friendNotifier');
    switch (presenceType) {
        case roblox__WEBPACK_IMPORTED_MODULE_0__.PresenceType.Online:
            return setting?.online || false;
        case roblox__WEBPACK_IMPORTED_MODULE_0__.PresenceType.Offline:
            return setting?.offline || false;
        case roblox__WEBPACK_IMPORTED_MODULE_0__.PresenceType.Experience:
            // If the setting is somehow null, assume we want to know about this one by default.
            if (setting?.game === false) {
                return false;
            }
            return true;
        case roblox__WEBPACK_IMPORTED_MODULE_0__.PresenceType.Studio:
        default:
            // We don't care about these presence types.
            return false;
    }
};
// Gets the icon URL to display on the notification.
const getNotificationIconUrl = async (userId) => {
    const thumbnail = await (0,_services_thumbnails__WEBPACK_IMPORTED_MODULE_7__.getAvatarHeadshotThumbnail)(userId);
    if (!thumbnail.imageUrl) {
        return '';
    }
    try {
        return await (0,_utils_fetchDataUri__WEBPACK_IMPORTED_MODULE_9__["default"])(new URL(thumbnail.imageUrl));
    }
    catch (err) {
        console.error('Failed to fetch icon URL from thumbnail', userId, thumbnail, err);
        return '';
    }
};
// Fetches the title for the notification to display to the user, based on current and previous known presence.
const getNotificationTitle = (user, presence, previousState) => {
    switch (presence.type) {
        case roblox__WEBPACK_IMPORTED_MODULE_0__.PresenceType.Offline:
            return `${user.displayName} went offline`;
        case roblox__WEBPACK_IMPORTED_MODULE_0__.PresenceType.Online:
            if (previousState.type !== roblox__WEBPACK_IMPORTED_MODULE_0__.PresenceType.Offline) {
                // If they were already online, don't notify them of this again.
                return '';
            }
            return `${user.displayName} is now online`;
        case roblox__WEBPACK_IMPORTED_MODULE_0__.PresenceType.Experience:
            if (!presence.location?.name) {
                // They joined an experience, but we don't know what they're playing.
                // Don't tell the human what we don't know.
                return '';
            }
            return `${user.displayName} is now playing`;
        case roblox__WEBPACK_IMPORTED_MODULE_0__.PresenceType.Studio:
            if (!presence.location?.name) {
                // They launched Roblox studio, but we don't know what they're creating.
                // Don't tell the human what we don't know.
                return '';
            }
            if (previousState.type !== roblox__WEBPACK_IMPORTED_MODULE_0__.PresenceType.Online) {
                // If they went from in-experience -> in-studio, it's possible they just had Roblox studio open
                // while playing a game, and then closed it.
                // Occassionally I have also observed offline <-> Studio swapping back and forth..
                // This creates noise, and we don't like noise.
                return '';
            }
            return `${user.displayName} is now creating`;
    }
};
// Gets the buttons that should be displayed on a notification, based on the presence.
const getNotificationButtons = async (presence) => {
    if (presence.type === roblox__WEBPACK_IMPORTED_MODULE_0__.PresenceType.Experience && presence.location?.placeId) {
        const joinText = await (0,_services_localization__WEBPACK_IMPORTED_MODULE_4__.getTranslationResource)('Feature.PeopleList', 'Action.Join');
        return [
            {
                title: joinText,
            },
        ];
    }
    return [];
};
// Handle what happens when a notification is clicked.
chrome.notifications.onClicked.addListener((notificationId) => {
    if (!notificationId.startsWith(notificationIdPrefix)) {
        return;
    }
    chrome.tabs.create({
        url: (0,roblox__WEBPACK_IMPORTED_MODULE_0__.getUserProfileLink)(Number(notificationId.substring(notificationIdPrefix.length))).href,
        active: true,
    });
});
chrome.notifications.onButtonClicked.addListener(async (notificationId) => {
    if (!notificationId.startsWith(notificationIdPrefix)) {
        return;
    }
    const userId = Number(notificationId.substring(notificationIdPrefix.length));
    try {
        await (0,_services_game_launch__WEBPACK_IMPORTED_MODULE_3__.followUser)(userId);
    }
    catch (err) {
        console.error('Failed to launch the experience', err);
    }
});
// Processes the presences, and send the notifications, when appropriate.
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (async (previousStates) => {
    // Check if the notifier is enabled.
    const enabled = await isEnabled();
    if (!enabled) {
        // The feature is not enabled, clear the state, and do nothing.
        return null;
    }
    // Check who is logged in right now.
    const authenticatedUser = await (0,_services_users__WEBPACK_IMPORTED_MODULE_8__.getAuthenticatedUser)();
    if (!authenticatedUser) {
        // User is not logged in, no state to return.
        return null;
    }
    // Fetch the friends
    const friends = await (0,_services_friends__WEBPACK_IMPORTED_MODULE_2__.getUserFriends)(authenticatedUser.id);
    // Check the presence for each of the friends
    const currentState = {};
    await Promise.all(friends.map(async (friend) => {
        const presence = (currentState[friend.id] = await (0,_services_presence__WEBPACK_IMPORTED_MODULE_5__.getUserPresence)(friend.id));
        const previousState = previousStates && previousStates[friend.id];
        if (previousState && !presenceMatches(previousState, presence)) {
            // The presence for this friend changed, do something!
            const notificationId = notificationIdPrefix + friend.id;
            const buttons = await getNotificationButtons(presence);
            const title = getNotificationTitle(friend, presence, previousState);
            if (!title) {
                // We don't have a title for the notification, so don't show one.
                chrome.notifications.clear(notificationId);
                return;
            }
            const isEnabled = await isPresenceTypeEnabled(presence.type);
            if (!isEnabled) {
                // The authenticated user does not want to know about these types of presence changes.
                chrome.notifications.clear(notificationId);
                return;
            }
            const isFollowing = await (0,_services_followings__WEBPACK_IMPORTED_MODULE_1__.isAuthenticatedUserFollowing)(friend.id);
            if (!isFollowing) {
                // We're not following this friend, don't show notifications about them.
                chrome.notifications.clear(notificationId);
                return;
            }
            const iconUrl = await getNotificationIconUrl(friend.id);
            if (!iconUrl) {
                // We don't have an icon we can use, so we can't display a notification.
                chrome.notifications.clear(notificationId);
                return;
            }
            chrome.notifications.create(notificationId, {
                type: 'basic',
                iconUrl,
                title,
                message: presence.location?.name ?? '',
                contextMessage: 'Roblox+ Friend Notifier',
                isClickable: true,
                buttons,
            });
        }
    }));
    return currentState;
});


/***/ }),

/***/ "./src/js/service-worker/notifiers/group-shout/index.ts":
/*!**************************************************************!*\
  !*** ./src/js/service-worker/notifiers/group-shout/index.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var roblox__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! roblox */ "./libs/roblox/dist/index.js");
/* harmony import */ var _services_groups__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../services/groups */ "./src/js/services/groups/index.ts");
/* harmony import */ var _services_settings__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../services/settings */ "./src/js/services/settings/index.ts");
/* harmony import */ var _services_thumbnails__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../services/thumbnails */ "./src/js/services/thumbnails/index.ts");
/* harmony import */ var _services_users__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../services/users */ "./src/js/services/users/index.ts");
/* harmony import */ var _utils_fetchDataUri__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../utils/fetchDataUri */ "./src/js/utils/fetchDataUri.ts");






// The prefix for the ID of the notification to display.
const notificationIdPrefix = 'group-shout-notifier-';
// Returns all the groups that we want to load the group shouts for.
const getGroups = async () => {
    const groupMap = [];
    const enabled = await (0,_services_settings__WEBPACK_IMPORTED_MODULE_2__.getToggleSettingValue)('groupShoutNotifier');
    if (!enabled) {
        // Not enabled, skip.
        return groupMap;
    }
    const authenticatedUser = await (0,_services_users__WEBPACK_IMPORTED_MODULE_4__.getAuthenticatedUser)();
    if (!authenticatedUser) {
        // Not logged in, no notifier.
        return groupMap;
    }
    const mode = await (0,_services_settings__WEBPACK_IMPORTED_MODULE_2__.getSettingValue)('groupShoutNotifier_mode');
    if (mode === 'whitelist') {
        // Only specific groups should be notified on.
        const list = await (0,_services_settings__WEBPACK_IMPORTED_MODULE_2__.getSettingValue)('groupShoutNotifierList');
        if (typeof list !== 'object') {
            return groupMap;
        }
        for (let rawId in list) {
            const id = Number(rawId);
            if (id && typeof list[rawId] === 'string') {
                groupMap.push({
                    id,
                    name: list[rawId],
                });
            }
        }
    }
    else {
        // All groups the user is in should be notified on.
        const groups = await (0,_services_groups__WEBPACK_IMPORTED_MODULE_1__.getUserGroups)(authenticatedUser.id);
        groups.forEach((group) => {
            groupMap.push({
                id: group.id,
                name: group.name,
            });
        });
    }
    return groupMap;
};
chrome.notifications.onClicked.addListener((notificationId) => {
    if (!notificationId.startsWith(notificationIdPrefix)) {
        return;
    }
    chrome.tabs.create({
        url: (0,roblox__WEBPACK_IMPORTED_MODULE_0__.getGroupLink)(Number(notificationId.substring(notificationIdPrefix.length)), 'redirect').href,
        active: true,
    });
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (async (previousState) => {
    const newState = {};
    const groups = await getGroups();
    const promises = groups.map(async (group) => {
        try {
            const groupShout = await (0,_services_groups__WEBPACK_IMPORTED_MODULE_1__.getGroupShout)(group.id);
            newState[group.id] = groupShout;
            if (previousState &&
                previousState.hasOwnProperty(group.id) &&
                previousState[group.id] !== groupShout &&
                groupShout) {
                // Send notification, the shout has changed.
                const groupIcon = await (0,_services_thumbnails__WEBPACK_IMPORTED_MODULE_3__.getGroupIcon)(group.id);
                if (groupIcon.state !== roblox__WEBPACK_IMPORTED_MODULE_0__.ThumbnailState.Completed) {
                    return;
                }
                const notificationIcon = await (0,_utils_fetchDataUri__WEBPACK_IMPORTED_MODULE_5__["default"])(new URL(groupIcon.imageUrl));
                chrome.notifications.create(`${notificationIdPrefix}${group.id}`, {
                    type: 'basic',
                    title: group.name,
                    message: groupShout,
                    contextMessage: 'Roblox+ Group Shout Notifier',
                    iconUrl: notificationIcon,
                });
            }
        }
        catch (err) {
            console.error('Failed to check group for group shout notifier', err, group);
            if (previousState && previousState.hasOwnProperty(group.id)) {
                newState[group.id] = previousState[group.id];
            }
        }
    });
    await Promise.all(promises);
    return newState;
});


/***/ }),

/***/ "./src/js/service-worker/notifiers/index.ts":
/*!**************************************************!*\
  !*** ./src/js/service-worker/notifiers/index.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "executeNotifier": () => (/* binding */ executeNotifier)
/* harmony export */ });
/* harmony import */ var _catalog__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./catalog */ "./src/js/service-worker/notifiers/catalog/index.ts");
/* harmony import */ var _friend_presence__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./friend-presence */ "./src/js/service-worker/notifiers/friend-presence/index.ts");
/* harmony import */ var _group_shout__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./group-shout */ "./src/js/service-worker/notifiers/group-shout/index.ts");
/* harmony import */ var _startup__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./startup */ "./src/js/service-worker/notifiers/startup/index.ts");
/* harmony import */ var _trades__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./trades */ "./src/js/service-worker/notifiers/trades/index.ts");





// Registry of all the notifiers
const notifiers = {};
notifiers['notifiers/catalog'] = _catalog__WEBPACK_IMPORTED_MODULE_0__["default"];
notifiers['notifiers/group-shouts'] = _group_shout__WEBPACK_IMPORTED_MODULE_2__["default"];
notifiers['notifiers/friend-presence'] = _friend_presence__WEBPACK_IMPORTED_MODULE_1__["default"];
notifiers['notifiers/trade'] = _trades__WEBPACK_IMPORTED_MODULE_4__["default"];
// Execute a notifier by name.
const executeNotifier = async (name) => {
    const notifier = notifiers[name];
    if (!notifier) {
        return;
    }
    try {
        // Fetch the state from the last time the notifier ran.
        const state = await chrome.storage.session.get(name);
        // Run the notifier.
        const newState = await notifier(state[name] || null);
        // Save the state for the next time the notifier runs.
        if (newState) {
            await chrome.storage.session.set({
                [name]: newState,
            });
        }
        else {
            chrome.storage.session.remove(name);
        }
    }
    catch (err) {
        console.error(name, 'failed to run', err);
    }
};
// Listener for the chrome.alarms API, to process the notification checks
chrome.alarms.onAlarm.addListener(async ({ name }) => {
    await executeNotifier(name);
});
for (let name in notifiers) {
    chrome.alarms.create(name, {
        periodInMinutes: 1,
    });
}
globalThis.notifiers = notifiers;
globalThis.executeNotifier = executeNotifier;

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (notifiers);


/***/ }),

/***/ "./src/js/service-worker/notifiers/startup/index.ts":
/*!**********************************************************!*\
  !*** ./src/js/service-worker/notifiers/startup/index.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-utils */ "./libs/extension-utils/dist/index.js");
/* harmony import */ var _services_settings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../services/settings */ "./src/js/services/settings/index.ts");
/* harmony import */ var _services_users__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../services/users */ "./src/js/services/users/index.ts");



const notificationId = 'startup-notification';
const displayStartupNotification = async () => {
    if (!_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_0__.manifest.icons) {
        console.warn('Missing manifest icons');
        return;
    }
    const done = await chrome.storage.session.get(_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_0__.manifest.version);
    if (done[_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_0__.manifest.version]) {
        // Already showed this notification...
        return;
    }
    await chrome.storage.session.set({
        [_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_0__.manifest.version]: +new Date(),
    });
    const authenticatedUser = await (0,_services_users__WEBPACK_IMPORTED_MODULE_2__.getAuthenticatedUser)();
    chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL(_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_0__.manifest.icons[128]),
        title: 'Roblox+ Started',
        message: authenticatedUser
            ? `Hello, ${authenticatedUser.displayName}`
            : 'You are currently signed out',
        contextMessage: `${_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_0__.manifest.name} ${_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_0__.manifest.version}, by WebGL3D`,
    });
};
(0,_services_settings__WEBPACK_IMPORTED_MODULE_1__.getSettingValue)('startupNotification')
    .then(async (setting) => {
    if (typeof setting !== 'object') {
        setting = {
            on: !chrome.extension.inIncognitoContext,
            visit: false,
        };
    }
    if (!setting.on) {
        return;
    }
    if (setting.visit) {
        // Only show the startup notification after Roblox has been visited.
        const updatedListener = (_tabId, _changes, tab) => {
            return takeAction(tab);
        };
        const takeAction = async (tab) => {
            if (!tab.url) {
                return;
            }
            try {
                const tabURL = new URL(tab.url);
                if (!tabURL.hostname.endsWith('.roblox.com')) {
                    return;
                }
                chrome.tabs.onCreated.removeListener(takeAction);
                chrome.tabs.onUpdated.removeListener(updatedListener);
                await displayStartupNotification();
            }
            catch {
                // don't care for now
            }
        };
        chrome.tabs.onUpdated.addListener(updatedListener);
        chrome.tabs.onCreated.addListener(takeAction);
    }
    else {
        await displayStartupNotification();
    }
})
    .catch((err) => {
    console.warn('Failed to render startup notification', err);
});
chrome.notifications.onClicked.addListener((id) => {
    if (id !== notificationId) {
        return;
    }
    chrome.tabs.create({
        url: `https://roblox.plus/about/changes?version=${_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_0__.manifest.version}`,
        active: true,
    });
});


/***/ }),

/***/ "./src/js/service-worker/notifiers/trades/index.ts":
/*!*********************************************************!*\
  !*** ./src/js/service-worker/notifiers/trades/index.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var roblox__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! roblox */ "./libs/roblox/dist/index.js");
/* harmony import */ var _services_settings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../services/settings */ "./src/js/services/settings/index.ts");
/* harmony import */ var _services_thumbnails__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../services/thumbnails */ "./src/js/services/thumbnails/index.ts");
/* harmony import */ var _utils_fetchDataUri__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../utils/fetchDataUri */ "./src/js/utils/fetchDataUri.ts");




// The prefix for the ID of the notification to display.
const notificationIdPrefix = 'trade-notifier-';
// Gets the trade status types that should be notified on.
const getEnabledTradeStatusTypes = async () => {
    const enabled = await (0,_services_settings__WEBPACK_IMPORTED_MODULE_1__.getToggleSettingValue)('tradeNotifier');
    if (enabled) {
        return [
            roblox__WEBPACK_IMPORTED_MODULE_0__.TradeStatusType.Inbound,
            roblox__WEBPACK_IMPORTED_MODULE_0__.TradeStatusType.Outbound,
            roblox__WEBPACK_IMPORTED_MODULE_0__.TradeStatusType.Completed,
            roblox__WEBPACK_IMPORTED_MODULE_0__.TradeStatusType.Inactive,
        ];
    }
    return [];
    /*
    const values = await getSettingValue('notifiers/trade/status-types');
    if (!Array.isArray(values)) {
      return [];
    }
  
    return values.filter((v) => Object.keys(v).includes(v));
    */
};
// Load the trade IDs for a status type.
const getTrades = async (tradeStatusType) => {
    const response = await fetch(`https://trades.roblox.com/v1/trades/${tradeStatusType}?limit=10&sortOrder=Desc`);
    const result = await response.json();
    return result.data.map((t) => t.id);
};
// Gets an individual trade by its ID.
const getTrade = async (id, tradeStatusType) => {
    const response = await fetch(`https://trades.roblox.com/v1/trades/${id}`);
    const result = await response.json();
    const tradePartner = result.user;
    const tradePartnerOffer = result.offers.find((o) => o.user.id === tradePartner.id);
    const authenticatedUserOffer = result.offers.find((o) => o.user.id !== tradePartner.id);
    return {
        id,
        tradePartner,
        authenticatedUserOffer: {
            robux: authenticatedUserOffer.robux,
            assets: authenticatedUserOffer.userAssets.map((a) => {
                return {
                    id: a.assetId,
                    userAssetId: a.id,
                    name: a.name,
                    recentAveragePrice: a.recentAveragePrice,
                };
            }),
        },
        partnerOffer: {
            robux: tradePartnerOffer.robux,
            assets: tradePartnerOffer.userAssets.map((a) => {
                return {
                    id: a.assetId,
                    userAssetId: a.id,
                    name: a.name,
                    recentAveragePrice: a.recentAveragePrice,
                };
            }),
        },
        status: result.status,
        type: tradeStatusType,
    };
};
// Gets the icon URL to display on the notification.
const getNotificationIconUrl = async (trade) => {
    const thumbnail = await (0,_services_thumbnails__WEBPACK_IMPORTED_MODULE_2__.getAvatarHeadshotThumbnail)(trade.tradePartner.id);
    if (!thumbnail.imageUrl) {
        return '';
    }
    try {
        return await (0,_utils_fetchDataUri__WEBPACK_IMPORTED_MODULE_3__["default"])(new URL(thumbnail.imageUrl));
    }
    catch (err) {
        console.error('Failed to fetch icon URL from thumbnail', trade, thumbnail, err);
        return '';
    }
};
// Fetches the title for the notification to display to the user, based on current and previous known presence.
const getNotificationTitle = (trade) => {
    switch (trade.type) {
        case roblox__WEBPACK_IMPORTED_MODULE_0__.TradeStatusType.Inbound:
            return 'Trade inbound';
        case roblox__WEBPACK_IMPORTED_MODULE_0__.TradeStatusType.Outbound:
            return 'Trade sent';
        case roblox__WEBPACK_IMPORTED_MODULE_0__.TradeStatusType.Completed:
            return 'Trade completed';
        default:
            return 'Trade ' + trade.status.toLowerCase();
    }
};
const getOfferValue = (tradeOffer) => {
    let value = 0;
    tradeOffer.assets.forEach((asset) => {
        value += asset.recentAveragePrice;
    });
    return (`${value.toLocaleString()}` +
        (tradeOffer.robux > 0 ? ` + R\$${tradeOffer.robux.toLocaleString()}` : ''));
};
// Handle what happens when a notification is clicked.
chrome.notifications.onClicked.addListener((notificationId) => {
    if (!notificationId.startsWith(notificationIdPrefix)) {
        return;
    }
    // If only we could link to specific trades..
    const tradeId = Number(notificationId.substring(notificationIdPrefix.length));
    chrome.tabs.create({
        url: 'https://www.roblox.com/trades',
        active: true,
    });
});
// Processes the presences, and send the notifications, when appropriate.
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (async (previousState) => {
    const previousEnabledStatusTypes = previousState?.enabledStatusTypes || [];
    const previousTradeStatusTypes = previousState?.tradeStatusMap || {};
    const newState = {
        // Preserve the trade statuses for the future
        // This is definitely how memory leaks come to be, but... how many trades could someone possibly be going through.
        tradeStatusMap: Object.assign({}, previousTradeStatusTypes),
        enabledStatusTypes: await getEnabledTradeStatusTypes(),
    };
    await Promise.all(newState.enabledStatusTypes.map(async (tradeStatusType) => {
        try {
            const trades = await getTrades(tradeStatusType);
            const tradePromises = [];
            // No matter what: Keep track of this trade we have seen, for future reference.
            trades.forEach((tradeId) => {
                newState.tradeStatusMap[tradeId] = tradeStatusType;
            });
            // now check each of them, to see if we want to send a notification.
            for (let i = 0; i < trades.length; i++) {
                const tradeId = trades[i];
                // Previously, the notifier type wasn't enabled.
                // Do nothing with the information we now know.
                if (!previousEnabledStatusTypes.includes(tradeStatusType)) {
                    continue;
                }
                // We have seen this trade before, in this same status type
                // Because the trades are ordered in descending order, we know there are
                // no other changes further down in this list. We can break.
                if (previousTradeStatusTypes[tradeId] === tradeStatusType) {
                    // And in fact, we have to break.
                    // Because if we don't, "new" trades could come in at the bottom of the list.
                    break;
                }
                // In all cases, we clear the current notification, to make room for a potential new one.
                const notificationId = notificationIdPrefix + tradeId;
                chrome.notifications.clear(notificationId);
                tradePromises.push(getTrade(tradeId, tradeStatusType)
                    .then(async (trade) => {
                    try {
                        const iconUrl = await getNotificationIconUrl(trade);
                        if (!iconUrl) {
                            // No icon.. no new notification.
                            return;
                        }
                        const title = getNotificationTitle(trade);
                        chrome.notifications.create(notificationId, {
                            type: 'list',
                            iconUrl,
                            title,
                            message: '@' + trade.tradePartner.name,
                            items: [
                                {
                                    title: 'Partner',
                                    message: trade.tradePartner.displayName,
                                },
                                {
                                    title: 'Your Value',
                                    message: getOfferValue(trade.authenticatedUserOffer),
                                },
                                {
                                    title: 'Partner Value',
                                    message: getOfferValue(trade.partnerOffer),
                                },
                            ],
                            contextMessage: 'Roblox+ Trade Notifier',
                            isClickable: true,
                        });
                    }
                    catch (e) {
                        console.error('Failed to send notification about trade', trade);
                    }
                })
                    .catch((err) => {
                    console.error('Failed to load trade information', tradeId, tradeStatusType, err);
                }));
            }
            await Promise.all(tradePromises);
        }
        catch (e) {
            console.error(`Failed to check ${tradeStatusType} trade notifier`, e);
        }
    }));
    return newState;
});


/***/ }),

/***/ "./src/js/services/assets/get-asset-contents-url.ts":
/*!**********************************************************!*\
  !*** ./src/js/services/assets/get-asset-contents-url.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_batch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/batch */ "./node_modules/@tix-factory/batch/dist/index.js");
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @tix-factory/extension-utils */ "./libs/extension-utils/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");
/* harmony import */ var _utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../utils/xsrfFetch */ "./src/js/utils/xsrfFetch.ts");





const messageDestination = 'assetsService.getAssetContentsUrl';
class AssetContentsBatchProcessor extends _tix_factory_batch__WEBPACK_IMPORTED_MODULE_0__.Batch {
    constructor() {
        super({
            levelOfParallelism: 1,
            maxSize: 100,
            minimumDelay: 1000,
            enqueueDeferDelay: 10,
        });
    }
    async process(items) {
        const requestHeaders = new Headers();
        requestHeaders.append('Roblox-Place-Id', '258257446');
        requestHeaders.append('Roblox-Browser-Asset-Request', _tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_2__.manifest.name);
        const response = await (0,_utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_4__["default"])(new URL(`https://assetdelivery.roblox.com/v2/assets/batch`), {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(items.map((batchItem) => {
                return {
                    assetId: batchItem.value,
                    requestId: batchItem.key,
                };
            })),
        });
        if (!response.ok) {
            throw new Error('Failed to load asset contents URL');
        }
        const result = await response.json();
        items.forEach((item) => {
            const asset = result.find((a) => a.requestId === item.key);
            const location = asset?.locations[0];
            if (location?.location) {
                item.resolve(location.location);
            }
            else {
                item.resolve('');
            }
        });
    }
    getKey(item) {
        return item.toString();
    }
}
const assetContentsProcessor = new AssetContentsBatchProcessor();
const assetContentsCache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_3__["default"](messageDestination, 10 * 60 * 1000);
// Fetches the date when a badge was awarded to the specified user.
const getAssetContentsUrl = async (assetId) => {
    const url = await (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_1__.sendMessage)(messageDestination, {
        assetId,
    });
    return url ? new URL(url) : undefined;
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_1__.addListener)(messageDestination, (message) => {
    // Check the cache
    return assetContentsCache.getOrAdd(assetContentsProcessor.getKey(message.assetId), () => {
        // Queue up the fetch request, when not in the cache
        return assetContentsProcessor.enqueue(message.assetId);
    });
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getAssetContentsUrl);


/***/ }),

/***/ "./src/js/services/assets/get-asset-dependencies.ts":
/*!**********************************************************!*\
  !*** ./src/js/services/assets/get-asset-dependencies.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");
/* harmony import */ var _get_asset_contents_url__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./get-asset-contents-url */ "./src/js/services/assets/get-asset-contents-url.ts");



const messageDestination = 'assetsService.getAssetDependencies';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__["default"](messageDestination, 30 * 1000);
const contentRegexes = [
    /"TextureI?d?".*=\s*(\d+)/gi,
    /"TextureI?d?".*rbxassetid:\/\/(\d+)/gi,
    /"MeshId".*=\s*(\d+)/gi,
    /MeshId.*rbxassetid:\/\/(\d+)/gi,
    /asset\/?\?\s*id\s*=\s*(\d+)/gi,
    /rbxassetid:\/\/(\d+)/gi,
    /:LoadAsset\((\d+)\)/gi,
    /require\((\d+)\)/gi,
];
const getAssetDependencies = async (assetId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, { assetId });
};
const loadAssetDependencies = async (assetId) => {
    const assetIds = [];
    const assetContentsUrl = await (0,_get_asset_contents_url__WEBPACK_IMPORTED_MODULE_2__["default"])(assetId);
    if (!assetContentsUrl) {
        return [];
    }
    const assetContentsResponse = await fetch(assetContentsUrl);
    const assetContents = await assetContentsResponse.text();
    contentRegexes.forEach((regex) => {
        let match = assetContents.match(regex) || [];
        match.forEach((m) => {
            let id = Number((m.match(/(\d+)/) || [])[1]);
            if (id && !isNaN(id) && !assetIds.includes(id)) {
                assetIds.push(id);
            }
        });
    });
    return assetIds;
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.assetId}`, () => 
    // Queue up the fetch request, when not in the cache
    loadAssetDependencies(message.assetId));
}, {
    levelOfParallelism: 1,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getAssetDependencies);


/***/ }),

/***/ "./src/js/services/assets/get-asset-details.ts":
/*!*****************************************************!*\
  !*** ./src/js/services/assets/get-asset-details.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");


const messageDestination = 'assetsService.getAssetDetails';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__["default"](messageDestination, 5 * 60 * 1000);
const getAssetDetails = async (assetId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, { assetId });
};
const loadAssetDetails = async (assetId) => {
    const response = await fetch(`https://economy.roblox.com/v2/assets/${assetId}/details`);
    if (!response.ok) {
        throw new Error('Failed to load asset product info');
    }
    const result = await response.json();
    return {
        id: assetId,
        name: result.Name,
        type: result.AssetTypeId,
        sales: result.Sales,
    };
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.assetId}`, () => 
    // Queue up the fetch request, when not in the cache
    loadAssetDetails(message.assetId));
}, {
    levelOfParallelism: 1,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getAssetDetails);


/***/ }),

/***/ "./src/js/services/assets/get-asset-sales-count.ts":
/*!*********************************************************!*\
  !*** ./src/js/services/assets/get-asset-sales-count.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");


const messageDestination = 'assetsService.getAssetSalesCount';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__["default"](messageDestination, 30 * 1000);
const getAssetSalesCount = async (assetId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, { assetId });
};
const loadAssetSalesCount = async (assetId) => {
    const response = await fetch(`https://economy.roblox.com/v2/assets/${assetId}/details`);
    if (!response.ok) {
        throw new Error('Failed to load asset product info');
    }
    const result = await response.json();
    return result.Sales || NaN;
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.assetId}`, () => 
    // Queue up the fetch request, when not in the cache
    loadAssetSalesCount(message.assetId));
}, {
    levelOfParallelism: 1,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getAssetSalesCount);


/***/ }),

/***/ "./src/js/services/assets/index.ts":
/*!*****************************************!*\
  !*** ./src/js/services/assets/index.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getAssetContentsUrl": () => (/* reexport safe */ _get_asset_contents_url__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "getAssetDependencies": () => (/* reexport safe */ _get_asset_dependencies__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   "getAssetDetails": () => (/* reexport safe */ _get_asset_details__WEBPACK_IMPORTED_MODULE_3__["default"]),
/* harmony export */   "getAssetSalesCount": () => (/* reexport safe */ _get_asset_sales_count__WEBPACK_IMPORTED_MODULE_1__["default"])
/* harmony export */ });
/* harmony import */ var _get_asset_contents_url__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./get-asset-contents-url */ "./src/js/services/assets/get-asset-contents-url.ts");
/* harmony import */ var _get_asset_sales_count__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./get-asset-sales-count */ "./src/js/services/assets/get-asset-sales-count.ts");
/* harmony import */ var _get_asset_dependencies__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./get-asset-dependencies */ "./src/js/services/assets/get-asset-dependencies.ts");
/* harmony import */ var _get_asset_details__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./get-asset-details */ "./src/js/services/assets/get-asset-details.ts");




globalThis.assetsService = {
    getAssetContentsUrl: _get_asset_contents_url__WEBPACK_IMPORTED_MODULE_0__["default"],
    getAssetSalesCount: _get_asset_sales_count__WEBPACK_IMPORTED_MODULE_1__["default"],
    getAssetDependencies: _get_asset_dependencies__WEBPACK_IMPORTED_MODULE_2__["default"],
    getAssetDetails: _get_asset_details__WEBPACK_IMPORTED_MODULE_3__["default"],
};



/***/ }),

/***/ "./src/js/services/avatar/get-avatar-asset-rules.ts":
/*!**********************************************************!*\
  !*** ./src/js/services/avatar/get-avatar-asset-rules.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");

const messageDestination = 'avatarService.getAvatarRules';
let avatarAssetRules = [];
const getAvatarAssetRules = async () => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {});
};
const loadAvatarAssetRules = async () => {
    const response = await fetch(`https://avatar.roblox.com/v1/avatar-rules`);
    if (!response.ok) {
        throw new Error(`Failed to load avatar rules (${response.status})`);
    }
    const result = await response.json();
    return result.wearableAssetTypes.map((rule) => {
        return {
            maxNumber: rule.maxNumber,
            assetType: rule.id,
        };
    });
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, async () => {
    if (avatarAssetRules.length > 0) {
        return avatarAssetRules;
    }
    avatarAssetRules = await loadAvatarAssetRules();
    return avatarAssetRules;
}, {
    levelOfParallelism: 1,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getAvatarAssetRules);


/***/ }),

/***/ "./src/js/services/avatar/index.ts":
/*!*****************************************!*\
  !*** ./src/js/services/avatar/index.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getAvatarAssetRules": () => (/* reexport safe */ _get_avatar_asset_rules__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   "getAvatarAssets": () => (/* binding */ getAvatarAssets),
/* harmony export */   "removeItem": () => (/* binding */ removeItem),
/* harmony export */   "wearItem": () => (/* binding */ wearItem)
/* harmony export */ });
/* harmony import */ var roblox__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! roblox */ "./libs/roblox/dist/index.js");
/* harmony import */ var _utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/xsrfFetch */ "./src/js/utils/xsrfFetch.ts");
/* harmony import */ var _get_avatar_asset_rules__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./get-avatar-asset-rules */ "./src/js/services/avatar/get-avatar-asset-rules.ts");



const getAvatarAssets = async (userId) => {
    const response = await fetch(`https://avatar.roblox.com/v1/users/${userId}/avatar`);
    if (!response.ok) {
        throw new Error(`Failed to load avatar (${response.status})`);
    }
    const result = await response.json();
    const assets = result.assets.map((asset) => {
        return {
            id: asset.id,
            name: asset.name,
            assetType: asset.assetType.id,
        };
    });
    result.emotes.forEach((emote) => {
        assets.push({
            id: emote.assetId,
            name: emote.assetName,
            assetType: roblox__WEBPACK_IMPORTED_MODULE_0__.AssetType.Emote,
        });
    });
    return assets;
};
const wearItem = async (assetId, authenticatedUserId) => {
    // Use set-wearing-assets instead of wear because it will allow more than the limit
    const currentAssets = await getAvatarAssets(authenticatedUserId);
    const response = await (0,_utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_1__["default"])(new URL(`https://avatar.roblox.com/v1/avatar/set-wearing-assets`), {
        method: 'POST',
        body: JSON.stringify({
            assetIds: [assetId].concat(currentAssets
                .filter((a) => a.assetType !== roblox__WEBPACK_IMPORTED_MODULE_0__.AssetType.Emote)
                .map((a) => a.id)),
        }),
    });
    if (!response.ok) {
        throw new Error(`Failed to wear asset (${assetId})`);
    }
    const result = await response.json();
    if (result.invalidAssetIds.length > 0) {
        throw new Error(`Failed to wear assets (${result.invalidAssetIds.join(', ')})`);
    }
};
const removeItem = async (assetId) => {
    const response = await (0,_utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_1__["default"])(new URL(`https://avatar.roblox.com/v1/avatar/assets/${assetId}/remove`), {
        method: 'POST',
    });
    if (!response.ok) {
        throw new Error(`Failed to remove asset (${assetId})`);
    }
};
globalThis.avatarService = { getAvatarAssetRules: _get_avatar_asset_rules__WEBPACK_IMPORTED_MODULE_2__["default"], getAvatarAssets, wearItem, removeItem };



/***/ }),

/***/ "./src/js/services/badges/batchProcessor.ts":
/*!**************************************************!*\
  !*** ./src/js/services/badges/batchProcessor.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
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

"use strict";
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

/***/ "./src/js/services/currency/getRobuxBalance.ts":
/*!*****************************************************!*\
  !*** ./src/js/services/currency/getRobuxBalance.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tix-factory/extension-utils */ "./libs/extension-utils/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");
/* harmony import */ var _history__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./history */ "./src/js/services/currency/history.ts");




const messageDestination = 'currencyService.getRobuxBalance';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__["default"](messageDestination, 30 * 1000);
const failureDelay = 5 * 1000;
// Fetches the Robux balance of the currently authenticated user.
const getRobuxBalance = (userId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, { userId });
};
// Loads the Robux balance of the currently authenticated user.
const loadRobuxBalance = async (userId) => {
    const response = await fetch(`https://economy.roblox.com/v1/users/${userId}/currency`);
    // If we fail to send the request, delay the response to ensure we don't spam the API.
    if (response.status === 401) {
        await (0,_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__.wait)(failureDelay);
        throw 'User is unauthenticated';
    }
    else if (!response.ok) {
        await (0,_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__.wait)(failureDelay);
        throw 'Failed to load Robux balance';
    }
    const result = await response.json();
    try {
        await (0,_history__WEBPACK_IMPORTED_MODULE_3__.recordUserRobux)(userId, result.robux);
    }
    catch (err) {
        console.warn('Failed to record Robux history');
    }
    return result.robux;
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.userId}`, () => 
    // Queue up the fetch request, when not in the cache
    loadRobuxBalance(message.userId));
}, {
    levelOfParallelism: 1,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getRobuxBalance);


/***/ }),

/***/ "./src/js/services/currency/history.ts":
/*!*********************************************!*\
  !*** ./src/js/services/currency/history.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getUserRobuxHistory": () => (/* binding */ getUserRobuxHistory),
/* harmony export */   "recordUserRobux": () => (/* binding */ recordUserRobux)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tix-factory/extension-utils */ "./libs/extension-utils/dist/index.js");
/* harmony import */ var db_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! db.js */ "./node_modules/db.js/dist/db.min.js");
/* harmony import */ var db_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(db_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../settings */ "./src/js/services/settings/index.ts");




const messageDestination = 'currencyService.history.';
if (_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__.isServiceWorker) {
    (0,db_js__WEBPACK_IMPORTED_MODULE_2__.open)({
        server: 'currencyBalances',
        version: 1,
        schema: {
            robuxHistory: {
                key: {
                    keyPath: ['currencyHolderType', 'currencyHolderId', 'robuxDate'],
                },
                indexes: {
                    currencyHolderType: {},
                    currencyHolderId: {},
                    robuxDate: {},
                },
            },
        },
    })
        .then((database) => {
        console.log('Database connection (for robuxHistory) opened.');
        globalThis.robuxHistoryDatabase = database;
        // Ensure the amount of stored data doesn't get too out of hand.
        // Only store one year of data.
        setInterval(async () => {
            try {
                const now = +new Date();
                const purgeDate = new Date(now - 32 * 12 * 24 * 60 * 60 * 1000);
                const robuxHistory = await database.robuxHistory
                    .query('robuxDate')
                    .range({ lte: purgeDate.getTime() })
                    .execute();
                if (robuxHistory.length <= 0) {
                    return;
                }
                await Promise.all(robuxHistory.map((robuxHistoryRecord) => {
                    return database.robuxHistory.remove({
                        eq: [
                            robuxHistoryRecord.currencyHolderType,
                            robuxHistoryRecord.currencyHolderId,
                            robuxHistoryRecord.robuxDate,
                        ],
                    });
                }));
            }
            catch (e) {
                console.warn('Failed to purge Robux history database', e);
            }
        }, 60 * 60 * 1000);
    })
        .catch((err) => {
        console.error('Failed to connect to robuxHistory database.', err);
    });
}
const recordUserRobux = async (userId, robux) => {
    const enabled = await (0,_settings__WEBPACK_IMPORTED_MODULE_3__.getToggleSettingValue)('robuxHistoryEnabled');
    if (!enabled) {
        return;
    }
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination + 'recordUserRobux', {
        userId,
        robux,
    });
};
const getUserRobuxHistory = async (userId, startDateTime, endDateTime) => {
    const robuxHistory = await (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination + 'getUserRobuxHistory', {
        userId,
        startDateTime: startDateTime.getTime(),
        endDateTime: endDateTime.getTime(),
    });
    return robuxHistory.map((h) => {
        return {
            value: h.robux,
            date: new Date(h.robuxDate),
        };
    });
};
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination + 'recordUserRobux', async (message) => {
    const now = +new Date();
    const robuxDateTime = new Date(now - (now % 60000));
    await robuxHistoryDatabase.robuxHistory.update({
        currencyHolderType: 'User',
        currencyHolderId: message.userId,
        robux: message.robux,
        robuxDate: robuxDateTime.getTime(),
    });
}, {
    levelOfParallelism: 1,
});
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination + 'getUserRobuxHistory', async (message) => {
    const history = await robuxHistoryDatabase.robuxHistory
        .query('robuxDate')
        .range({
        gte: message.startDateTime,
        lte: message.endDateTime,
    })
        .filter((row) => row.currencyHolderType === 'User' &&
        row.currencyHolderId === message.userId)
        .execute();
    return history;
}, {
    levelOfParallelism: 1,
});



/***/ }),

/***/ "./src/js/services/currency/index.ts":
/*!*******************************************!*\
  !*** ./src/js/services/currency/index.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getRobuxBalance": () => (/* reexport safe */ _getRobuxBalance__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "getUserRobuxHistory": () => (/* reexport safe */ _history__WEBPACK_IMPORTED_MODULE_1__.getUserRobuxHistory)
/* harmony export */ });
/* harmony import */ var _getRobuxBalance__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./getRobuxBalance */ "./src/js/services/currency/getRobuxBalance.ts");
/* harmony import */ var _history__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./history */ "./src/js/services/currency/history.ts");


globalThis.currencyService = { getRobuxBalance: _getRobuxBalance__WEBPACK_IMPORTED_MODULE_0__["default"], getUserRobuxHistory: _history__WEBPACK_IMPORTED_MODULE_1__.getUserRobuxHistory };



/***/ }),

/***/ "./src/js/services/followings/authenticatedUserFollowingProcessor.ts":
/*!***************************************************************************!*\
  !*** ./src/js/services/followings/authenticatedUserFollowingProcessor.ts ***!
  \***************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_batch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/batch */ "./node_modules/@tix-factory/batch/dist/index.js");
/* harmony import */ var _utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/xsrfFetch */ "./src/js/utils/xsrfFetch.ts");


class AuthenticatedUserFollowingProcessor extends _tix_factory_batch__WEBPACK_IMPORTED_MODULE_0__.Batch {
    constructor() {
        super({
            levelOfParallelism: 1,
            maxSize: 100,
            minimumDelay: 1 * 1000,
            enqueueDeferDelay: 10,
        });
    }
    async process(items) {
        const response = await (0,_utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_1__["default"])(new URL('https://friends.roblox.com/v1/user/following-exists'), {
            method: 'POST',
            body: JSON.stringify({
                targetUserIds: items.map((i) => i.value),
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to load authenticated user following statuses');
        }
        const result = await response.json();
        items.forEach((item) => {
            const following = result.followings.find((f) => f.userId === item.value);
            item.resolve(following?.isFollowing === true);
        });
    }
    getKey(userId) {
        return `${userId}`;
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (AuthenticatedUserFollowingProcessor);


/***/ }),

/***/ "./src/js/services/followings/index.ts":
/*!*********************************************!*\
  !*** ./src/js/services/followings/index.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isAuthenticatedUserFollowing": () => (/* reexport safe */ _isAuthenticatedUserFollowing__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _isAuthenticatedUserFollowing__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./isAuthenticatedUserFollowing */ "./src/js/services/followings/isAuthenticatedUserFollowing.ts");

globalThis.followingsService = { isAuthenticatedUserFollowing: _isAuthenticatedUserFollowing__WEBPACK_IMPORTED_MODULE_0__["default"] };



/***/ }),

/***/ "./src/js/services/followings/isAuthenticatedUserFollowing.ts":
/*!********************************************************************!*\
  !*** ./src/js/services/followings/isAuthenticatedUserFollowing.ts ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");
/* harmony import */ var _authenticatedUserFollowingProcessor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./authenticatedUserFollowingProcessor */ "./src/js/services/followings/authenticatedUserFollowingProcessor.ts");



const messageDestination = 'followingsService.isAuthenticatedUserFollowing';
const batchProcessor = new _authenticatedUserFollowingProcessor__WEBPACK_IMPORTED_MODULE_2__["default"]();
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__["default"](messageDestination, 60 * 1000);
// Checks if the authenticated user is following another user.
const isAuthenticatedUserFollowing = (userId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {
        userId,
    });
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.userId}`, () => 
    // Queue up the fetch request, when not in the cache
    batchProcessor.enqueue(message.userId));
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (isAuthenticatedUserFollowing);


/***/ }),

/***/ "./src/js/services/friends/getFriendRequestCount.ts":
/*!**********************************************************!*\
  !*** ./src/js/services/friends/getFriendRequestCount.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tix-factory/extension-utils */ "./libs/extension-utils/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");



const messageDestination = 'friendsService.getFriendRequestCount';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__["default"](messageDestination, 30 * 1000);
const failureDelay = 5 * 1000;
// Fetches the inbound friend request count for the currently authenticated user.
const getFriendRequestCount = (userId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, { userId });
};
// Loads the inbound friend request count for the currently authenticated user.
const loadFriendRequestCount = async (userId) => {
    // User ID is used as a cache buster.
    const response = await fetch(`https://friends.roblox.com/v1/user/friend-requests/count`);
    // If we fail to send the request, delay the response to ensure we don't spam the API.
    if (response.status === 401) {
        await (0,_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__.wait)(failureDelay);
        throw 'User is unauthenticated';
    }
    else if (!response.ok) {
        await (0,_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__.wait)(failureDelay);
        throw 'Failed to load friend request count';
    }
    const result = await response.json();
    return result.count;
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.userId}`, () => 
    // Queue up the fetch request, when not in the cache
    loadFriendRequestCount(message.userId));
}, {
    levelOfParallelism: 1,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getFriendRequestCount);


/***/ }),

/***/ "./src/js/services/friends/getUserFriends.ts":
/*!***************************************************!*\
  !*** ./src/js/services/friends/getUserFriends.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");


const messageDestination = 'friendsService.getUserFriends';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__["default"](messageDestination, 60 * 1000);
// Fetches the list of friends for the user.
const getUserFriends = (userId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {
        userId,
    });
};
// Loads the actual friend list for the user.
const loadUserFriends = async (userId) => {
    const response = await fetch(`https://friends.roblox.com/v1/users/${userId}/friends`);
    if (!response.ok) {
        throw new Error(`Failed to load friends for user (${userId})`);
    }
    const result = await response.json();
    return result.data.map((r) => {
        return {
            id: r.id,
            name: r.name,
            displayName: r.displayName,
        };
    });
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.userId}`, () => 
    // Queue up the fetch request, when not in the cache
    loadUserFriends(message.userId));
}, {
    levelOfParallelism: 1,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getUserFriends);


/***/ }),

/***/ "./src/js/services/friends/index.ts":
/*!******************************************!*\
  !*** ./src/js/services/friends/index.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getFriendRequestCount": () => (/* reexport safe */ _getFriendRequestCount__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   "getUserFriends": () => (/* reexport safe */ _getUserFriends__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _getUserFriends__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./getUserFriends */ "./src/js/services/friends/getUserFriends.ts");
/* harmony import */ var _getFriendRequestCount__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./getFriendRequestCount */ "./src/js/services/friends/getFriendRequestCount.ts");


globalThis.friendsService = { getUserFriends: _getUserFriends__WEBPACK_IMPORTED_MODULE_0__["default"], getFriendRequestCount: _getFriendRequestCount__WEBPACK_IMPORTED_MODULE_1__["default"] };



/***/ }),

/***/ "./src/js/services/game-launch/index.ts":
/*!**********************************************!*\
  !*** ./src/js/services/game-launch/index.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "followUser": () => (/* binding */ followUser)
/* harmony export */ });
/* harmony import */ var _utils_launchProtocolUrl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/launchProtocolUrl */ "./src/js/utils/launchProtocolUrl.ts");

// Launches into the experience that the specified user is playing.
const followUser = async (userId) => {
    await (0,_utils_launchProtocolUrl__WEBPACK_IMPORTED_MODULE_0__["default"])(`roblox://userId=${userId}`);
};
globalThis.gameLaunchService = { followUser };



/***/ }),

/***/ "./src/js/services/game-passes/get-game-pass-sale-count.ts":
/*!*****************************************************************!*\
  !*** ./src/js/services/game-passes/get-game-pass-sale-count.ts ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");


const messageDestination = 'gamePassesService.getGamePassSaleCount';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__["default"](messageDestination, 30 * 1000);
const getGamePassSaleCount = async (gamePassId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, { gamePassId });
};
const loadGamePassSales = async (gamePassId) => {
    const response = await fetch(`https://economy.roblox.com/v1/game-pass/${gamePassId}/game-pass-product-info`);
    if (!response.ok) {
        throw new Error('Failed to load game pass product info');
    }
    const result = await response.json();
    return result.Sales || NaN;
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.gamePassId}`, () => 
    // Queue up the fetch request, when not in the cache
    loadGamePassSales(message.gamePassId));
}, {
    levelOfParallelism: 1,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getGamePassSaleCount);


/***/ }),

/***/ "./src/js/services/game-passes/index.ts":
/*!**********************************************!*\
  !*** ./src/js/services/game-passes/index.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getGamePassSaleCount": () => (/* reexport safe */ _get_game_pass_sale_count__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _get_game_pass_sale_count__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./get-game-pass-sale-count */ "./src/js/services/game-passes/get-game-pass-sale-count.ts");

globalThis.gamePassesService = { getGamePassSaleCount: _get_game_pass_sale_count__WEBPACK_IMPORTED_MODULE_0__["default"] };



/***/ }),

/***/ "./src/js/services/groups/get-creator-groups.ts":
/*!******************************************************!*\
  !*** ./src/js/services/groups/get-creator-groups.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");


const messageDestination = 'groupsService.getCreatorGroups';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__["default"](messageDestination, 30 * 1000);
// Fetches the groups the user has access privileged roles in.
const getCreatorGroups = (userId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, { userId });
};
// Loads the groups the user has access privileged roles in.
const loadAuthenticatedUserCreatorGroups = async () => {
    const response = await fetch(`https://develop.roblox.com/v1/user/groups/canmanage`);
    if (response.status === 401) {
        throw 'User is unauthenticated';
    }
    else if (!response.ok) {
        throw 'Failed to load creation groups for the authenticated user';
    }
    const result = await response.json();
    return result.data.map((g) => {
        return {
            id: g.id,
            name: g.name,
        };
    });
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.userId}`, () => 
    // Queue up the fetch request, when not in the cache
    loadAuthenticatedUserCreatorGroups());
}, {
    levelOfParallelism: 1,
    allowExternalConnections: true,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getCreatorGroups);


/***/ }),

/***/ "./src/js/services/groups/get-group-shout.ts":
/*!***************************************************!*\
  !*** ./src/js/services/groups/get-group-shout.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");


const messageDestination = 'groupsService.getGroupShout';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__["default"](messageDestination, 90 * 1000);
// Fetches the group shout.
const getGroupShout = (groupId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, { groupId });
};
// Loads the groups the user is a member of.
const loadGroupShout = async (groupId) => {
    const response = await fetch(`https://groups.roblox.com/v1/groups/${groupId}`);
    if (!response.ok) {
        throw `Failed to load group shout for group ${groupId}`;
    }
    const result = await response.json();
    return result.shout?.body || '';
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.groupId}`, () => 
    // Queue up the fetch request, when not in the cache
    loadGroupShout(message.groupId));
}, {
    levelOfParallelism: 1,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getGroupShout);


/***/ }),

/***/ "./src/js/services/groups/get-user-groups.ts":
/*!***************************************************!*\
  !*** ./src/js/services/groups/get-user-groups.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");


const messageDestination = 'groupsService.getUserGroups';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__["default"](messageDestination, 30 * 1000);
// Fetches the groups the user is a member of.
const getUserGroups = (userId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, { userId });
};
// Loads the groups the user is a member of.
const loadUserGroups = async (userId) => {
    const response = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
    if (!response.ok) {
        throw 'Failed to load groups the user is a member of';
    }
    const result = await response.json();
    return result.data.map((g) => {
        return {
            id: g.group.id,
            name: g.group.name,
        };
    });
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.userId}`, () => 
    // Queue up the fetch request, when not in the cache
    loadUserGroups(message.userId));
}, {
    levelOfParallelism: 1,
    allowExternalConnections: true,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getUserGroups);


/***/ }),

/***/ "./src/js/services/groups/get-user-primary-group.ts":
/*!**********************************************************!*\
  !*** ./src/js/services/groups/get-user-primary-group.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");


const messageDestination = 'groupsService.getUserPrimaryGroup';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__["default"](messageDestination, 30 * 1000);
// Fetches the groups the user is a member of.
const getUserPrimaryGroup = (userId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, { userId });
};
// Loads the groups the user is a member of.
const loadUserPrimaryGroup = async (userId) => {
    const response = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/primary/role`);
    if (!response.ok) {
        throw 'Failed to load primary group for the user';
    }
    const result = await response.json();
    if (!result || !result.group) {
        return null;
    }
    return {
        id: result.group.id,
        name: result.group.name,
    };
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.userId}`, () => 
    // Queue up the fetch request, when not in the cache
    loadUserPrimaryGroup(message.userId));
}, {
    levelOfParallelism: 1,
    allowExternalConnections: true,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getUserPrimaryGroup);


/***/ }),

/***/ "./src/js/services/groups/index.ts":
/*!*****************************************!*\
  !*** ./src/js/services/groups/index.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getCreatorGroups": () => (/* reexport safe */ _get_creator_groups__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "getGroupShout": () => (/* reexport safe */ _get_group_shout__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   "getUserGroups": () => (/* reexport safe */ _get_user_groups__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   "getUserPrimaryGroup": () => (/* reexport safe */ _get_user_primary_group__WEBPACK_IMPORTED_MODULE_3__["default"])
/* harmony export */ });
/* harmony import */ var _get_creator_groups__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./get-creator-groups */ "./src/js/services/groups/get-creator-groups.ts");
/* harmony import */ var _get_group_shout__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./get-group-shout */ "./src/js/services/groups/get-group-shout.ts");
/* harmony import */ var _get_user_groups__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./get-user-groups */ "./src/js/services/groups/get-user-groups.ts");
/* harmony import */ var _get_user_primary_group__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./get-user-primary-group */ "./src/js/services/groups/get-user-primary-group.ts");




globalThis.groupsService = { getCreatorGroups: _get_creator_groups__WEBPACK_IMPORTED_MODULE_0__["default"], getGroupShout: _get_group_shout__WEBPACK_IMPORTED_MODULE_1__["default"], getUserGroups: _get_user_groups__WEBPACK_IMPORTED_MODULE_2__["default"], getUserPrimaryGroup: _get_user_primary_group__WEBPACK_IMPORTED_MODULE_3__["default"] };



/***/ }),

/***/ "./src/js/services/inventory/get-asset-owners.ts":
/*!*******************************************************!*\
  !*** ./src/js/services/inventory/get-asset-owners.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _users__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../users */ "./src/js/services/users/index.ts");

const getAssetOwners = async (assetId, cursor, isAscending) => {
    const response = await fetch(`https://inventory.roblox.com/v2/assets/${assetId}/owners?limit=100&cursor=${cursor}&sortOrder=${isAscending ? 'Asc' : 'Desc'}`, {
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error(`Failed to load ownership records (${assetId}, ${cursor}, ${isAscending})`);
    }
    const result = await response.json();
    const ownershipRecords = [];
    await Promise.all(result.data.map(async (i) => {
        const record = {
            id: i.id,
            user: null,
            serialNumber: i.serialNumber || NaN,
            created: new Date(i.created),
            updated: new Date(i.updated),
        };
        ownershipRecords.push(record);
        if (i.owner) {
            record.user = await (0,_users__WEBPACK_IMPORTED_MODULE_0__.getUserById)(i.owner.id);
        }
    }));
    return {
        nextPageCursor: result.nextPageCursor || '',
        data: ownershipRecords,
    };
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getAssetOwners);


/***/ }),

/***/ "./src/js/services/inventory/index.ts":
/*!********************************************!*\
  !*** ./src/js/services/inventory/index.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "deleteAsset": () => (/* binding */ deleteAsset),
/* harmony export */   "getAssetOwners": () => (/* reexport safe */ _get_asset_owners__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   "getLimitedInventory": () => (/* reexport safe */ _limitedInventory__WEBPACK_IMPORTED_MODULE_1__["default"])
/* harmony export */ });
/* harmony import */ var _utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/xsrfFetch */ "./src/js/utils/xsrfFetch.ts");
/* harmony import */ var _limitedInventory__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./limitedInventory */ "./src/js/services/inventory/limitedInventory.ts");
/* harmony import */ var _get_asset_owners__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./get-asset-owners */ "./src/js/services/inventory/get-asset-owners.ts");



// Removes an asset from the authenticated user's inventory.
const deleteAsset = async (assetId) => {
    const response = await (0,_utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_0__["default"])(new URL(`https://assetgame.roblox.com/asset/delete-from-inventory`), {
        method: 'POST',
        body: JSON.stringify({
            assetId: assetId,
        }),
    });
    if (!response.ok) {
        throw new Error(`Failed to remove asset (${assetId})`);
    }
};
globalThis.inventoryService = { deleteAsset, getLimitedInventory: _limitedInventory__WEBPACK_IMPORTED_MODULE_1__["default"], getAssetOwners: _get_asset_owners__WEBPACK_IMPORTED_MODULE_2__["default"] };



/***/ }),

/***/ "./src/js/services/inventory/limitedInventory.ts":
/*!*******************************************************!*\
  !*** ./src/js/services/inventory/limitedInventory.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tix-factory/extension-utils */ "./libs/extension-utils/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");



const messageDestination = 'inventoryService.getLimitedInventory';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__["default"](messageDestination, 5 * 60 * 1000);
// Fetches the limited inventory for the specified user.
const getLimitedInventory = (userId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {
        userId,
    });
};
// Actually loads the inventory.
const loadLimitedInventory = async (userId) => {
    const foundUserAssetIds = new Set();
    const limitedAssets = [];
    let nextPageCursor = '';
    do {
        const response = await fetch(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=100&cursor=${nextPageCursor}`);
        if (response.status === 429) {
            // Throttled. Wait a few seconds, and try again.
            await (0,_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__.wait)(5000);
            continue;
        }
        else if (response.status === 403) {
            throw new Error('Inventory hidden');
        }
        else if (!response.ok) {
            throw new Error('Inventory failed to load');
        }
        const result = await response.json();
        nextPageCursor = result.nextPageCursor;
        result.data.forEach((item) => {
            const userAssetId = Number(item.userAssetId);
            if (foundUserAssetIds.has(userAssetId)) {
                return;
            }
            foundUserAssetIds.add(userAssetId);
            limitedAssets.push({
                userAssetId,
                id: item.assetId,
                name: item.name,
                recentAveragePrice: item.recentAveragePrice
                    ? Number(item.recentAveragePrice)
                    : NaN,
                serialNumber: item.serialNumber ? Number(item.serialNumber) : NaN,
                stock: item.assetStock === 0 ? 0 : item.assetStock || undefined,
            });
        });
    } while (nextPageCursor);
    return limitedAssets;
};
// Listen for background messages
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.userId}`, () => 
    // Queue up the fetch request, when not in the cache
    loadLimitedInventory(message.userId));
}, {
    levelOfParallelism: 1,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getLimitedInventory);


/***/ }),

/***/ "./src/js/services/localization/index.ts":
/*!***********************************************!*\
  !*** ./src/js/services/localization/index.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getTranslationResource": () => (/* binding */ getTranslationResource),
/* harmony export */   "getTranslationResourceWithFallback": () => (/* binding */ getTranslationResourceWithFallback)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");

const englishLocale = 'en_us';
const messageDestination = 'localizationService.getTranslationResources';
let translationResourceCache = [];
let localeCache = '';
// Gets the locale for the authenticated user.
const getAuthenticatedUserLocale = async () => {
    if (localeCache) {
        return localeCache;
    }
    try {
        const response = await fetch(`https://locale.roblox.com/v1/locales/user-locale`);
        if (!response.ok) {
            console.warn('Failed to fetch user locale - defaulting to English.', response.status);
            return (localeCache = englishLocale);
        }
        const result = await response.json();
        return (localeCache = result.supportedLocale.locale);
    }
    catch (e) {
        console.warn('Unhandled error loading user locale - defaulting to English.', e);
        return (localeCache = englishLocale);
    }
};
// Fetches all the translation resources for the authenticated user.
const getTranslationResources = async () => {
    if (translationResourceCache.length > 0) {
        return translationResourceCache;
    }
    return (translationResourceCache = await (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {}));
};
// Fetches an individual translation resource.
const getTranslationResource = async (namespace, key) => {
    const translationResources = await getTranslationResources();
    const resource = translationResources.find((r) => r.namespace === namespace && r.key === key);
    if (!resource) {
        console.warn(`No translation resource available.\n\tNamespace: ${namespace}\n\tKey: ${key}`);
    }
    return resource?.value || '';
};
const getTranslationResourceWithFallback = async (namespace, key, defaultValue) => {
    try {
        const value = await getTranslationResource(namespace, key);
        if (!value) {
            return defaultValue;
        }
        return value;
    }
    catch (e) {
        console.warn('Failed to load translation resource', namespace, key, e);
        return defaultValue;
    }
};
// Listener to ensure these always happen in the background, for strongest caching potential.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, async () => {
    if (translationResourceCache.length > 0) {
        return translationResourceCache;
    }
    const locale = await getAuthenticatedUserLocale();
    const response = await fetch(`https://translations.roblox.com/v1/translations?consumerType=Web`);
    if (!response.ok) {
        throw new Error(`Failed to load translation resources (${response.status})`);
    }
    const result = await response.json();
    const resourcesUrl = result.data.find((r) => r.locale === locale) ||
        result.data.find((r) => r.locale === englishLocale);
    if (!resourcesUrl) {
        throw new Error(`Failed to find translation resources for locale (${locale})`);
    }
    const resources = await fetch(resourcesUrl.url);
    const resourcesJson = await resources.json();
    return (translationResourceCache = resourcesJson.contents.map((r) => {
        return {
            namespace: r.namespace,
            key: r.key,
            value: r.translation || r.english,
        };
    }));
}, {
    // Ensure that multiple requests for this information can't be processed at once.
    levelOfParallelism: 1,
});
globalThis.localizationService = { getTranslationResource, getTranslationResourceWithFallback };



/***/ }),

/***/ "./src/js/services/premium-payouts/getPremiumPayoutsSummary.ts":
/*!*********************************************************************!*\
  !*** ./src/js/services/premium-payouts/getPremiumPayoutsSummary.ts ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");


const messageDestination = 'premiumPayoutsService.getPremiumPayoutsSummary';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__["default"](messageDestination, 60 * 1000);
const serializeDate = (date) => {
    return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
};
// Fetches the Robux balance of the currently authenticated user.
const getPremiumPayoutsSummary = (universeId, startDate, endDate) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {
        universeId,
        startDate: serializeDate(startDate),
        endDate: serializeDate(endDate),
    });
};
// Loads the Robux balance of the currently authenticated user.
const loadPremiumPayoutsSummary = async (universeId, startDate, endDate) => {
    const response = await fetch(`https://engagementpayouts.roblox.com/v1/universe-payout-history?universeId=${universeId}&startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) {
        throw 'Failed to load premium payouts';
    }
    const result = await response.json();
    const payouts = [];
    for (let date in result) {
        const payout = result[date];
        if (payout.eligibilityType !== 'Eligible') {
            continue;
        }
        payouts.push({
            date,
            engagementScore: payout.engagementScore,
            payoutInRobux: payout.payoutInRobux,
            payoutType: payout.payoutType,
        });
    }
    return payouts;
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.universeId}_${message.startDate}_${message.endDate}`, () => 
    // Queue up the fetch request, when not in the cache
    loadPremiumPayoutsSummary(message.universeId, message.startDate, message.endDate));
}, {
    levelOfParallelism: 1,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getPremiumPayoutsSummary);


/***/ }),

/***/ "./src/js/services/premium-payouts/index.ts":
/*!**************************************************!*\
  !*** ./src/js/services/premium-payouts/index.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getPremiumPayoutsSummary": () => (/* reexport safe */ _getPremiumPayoutsSummary__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _getPremiumPayoutsSummary__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./getPremiumPayoutsSummary */ "./src/js/services/premium-payouts/getPremiumPayoutsSummary.ts");

globalThis.premiumPayoutsService = { getPremiumPayoutsSummary: _getPremiumPayoutsSummary__WEBPACK_IMPORTED_MODULE_0__["default"] };



/***/ }),

/***/ "./src/js/services/premium/getPremiumExpirationDate.ts":
/*!*************************************************************!*\
  !*** ./src/js/services/premium/getPremiumExpirationDate.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");


const messageDestination = 'premiumService.getPremiumExpirationDate';
const definitelyPremium = {};
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__["default"](messageDestination, 60 * 1000);
// Check whether or not a user has a Roblox+ Premium subscription.
const getPremiumExpirationDate = async (userId) => {
    const expiration = await (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {
        userId,
    });
    if (!expiration) {
        return expiration;
    }
    return new Date(expiration);
};
const getPrivateServerExpiration = async (id) => {
    const response = await fetch(`https://games.roblox.com/v1/vip-servers/${id}`);
    if (!response.ok) {
        console.warn('Failed to load private server details', id, response);
        return null;
    }
    const result = await response.json();
    if (result.subscription?.expired === false) {
        // If it's not expired, return the expiration date.
        return result.subscription.expirationDate;
    }
    return null;
};
// Check if the user has a private server with the Roblox+ hub.
const checkPrivateServerExpirations = async (userId) => {
    try {
        const response = await fetch(`https://games.roblox.com/v1/games/258257446/private-servers`);
        if (!response.ok) {
            console.warn('Failed to load private servers', userId, response);
            return null;
        }
        const result = await response.json();
        for (let i = 0; i < result.data.length; i++) {
            const privateServer = result.data[i];
            if (privateServer.owner?.id !== userId) {
                continue;
            }
            try {
                const expirationDate = await getPrivateServerExpiration(privateServer.vipServerId);
                if (expirationDate) {
                    // We found a private server we paid for, we're done!
                    return expirationDate;
                }
            }
            catch (err) {
                console.warn('Failed to check if private server was active', privateServer, err);
            }
        }
        return null;
    }
    catch (err) {
        console.warn('Failed to check private servers', userId, err);
        return null;
    }
};
// Fetch whether or not a user has a Roblox+ Premium subscription.
const loadPremiumMembership = async (userId) => {
    if (definitelyPremium[userId]) {
        return definitelyPremium[userId];
    }
    const expirationDate = await checkPrivateServerExpirations(userId);
    if (expirationDate) {
        return (definitelyPremium[userId] = expirationDate);
    }
    const response = await fetch(`https://api.roblox.plus/v1/rpluspremium/${userId}`);
    if (!response.ok) {
        throw new Error(`Failed to check premium membership for user (${userId})`);
    }
    const result = await response.json();
    if (result.data) {
        return (definitelyPremium[userId] = result.data.expiration);
    }
    return '';
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.userId}`, () => 
    // Queue up the fetch request, when not in the cache
    loadPremiumMembership(message.userId));
}, {
    levelOfParallelism: 1,
    allowExternalConnections: true,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getPremiumExpirationDate);


/***/ }),

/***/ "./src/js/services/premium/index.ts":
/*!******************************************!*\
  !*** ./src/js/services/premium/index.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getPremiumExpirationDate": () => (/* reexport safe */ _getPremiumExpirationDate__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "isPremiumUser": () => (/* binding */ isPremiumUser)
/* harmony export */ });
/* harmony import */ var _getPremiumExpirationDate__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./getPremiumExpirationDate */ "./src/js/services/premium/getPremiumExpirationDate.ts");

const isPremiumUser = async (userId) => {
    const expiration = await (0,_getPremiumExpirationDate__WEBPACK_IMPORTED_MODULE_0__["default"])(userId);
    if (expiration || expiration === null) {
        // We have an expiration date, or it's a lifetime subscription.
        // They are definitely premium.
        return true;
    }
    // No expiration date, no premium.
    return false;
};
globalThis.premiumService = { isPremiumUser, getPremiumExpirationDate: _getPremiumExpirationDate__WEBPACK_IMPORTED_MODULE_0__["default"] };



/***/ }),

/***/ "./src/js/services/presence/batchProcessor.ts":
/*!****************************************************!*\
  !*** ./src/js/services/presence/batchProcessor.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_batch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/batch */ "./node_modules/@tix-factory/batch/dist/index.js");
/* harmony import */ var roblox__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! roblox */ "./libs/roblox/dist/index.js");


const getPresenceType = (presenceType) => {
    switch (presenceType) {
        case 1:
            return roblox__WEBPACK_IMPORTED_MODULE_1__.PresenceType.Online;
        case 2:
            return roblox__WEBPACK_IMPORTED_MODULE_1__.PresenceType.Experience;
        case 3:
            return roblox__WEBPACK_IMPORTED_MODULE_1__.PresenceType.Studio;
        default:
            return roblox__WEBPACK_IMPORTED_MODULE_1__.PresenceType.Offline;
    }
};
const getLocationName = (presenceType, name) => {
    if (!name) {
        return '';
    }
    if (presenceType === roblox__WEBPACK_IMPORTED_MODULE_1__.PresenceType.Studio) {
        return name.replace(/^Studio\s+-\s*/, '');
    }
    return name;
};
class PresenceBatchProcessor extends _tix_factory_batch__WEBPACK_IMPORTED_MODULE_0__.Batch {
    constructor() {
        super({
            levelOfParallelism: 1,
            maxSize: 100,
            minimumDelay: 3 * 1000,
            enqueueDeferDelay: 10,
        });
    }
    async process(items) {
        const response = await fetch('https://presence.roblox.com/v1/presence/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userIds: items.map((i) => i.value),
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to load user presence');
        }
        const result = await response.json();
        items.forEach((item) => {
            const presence = result.userPresences.find((p) => p.userId === item.value);
            if (presence) {
                const presenceType = getPresenceType(presence.userPresenceType);
                if (presence.placeId &&
                    (presenceType === roblox__WEBPACK_IMPORTED_MODULE_1__.PresenceType.Experience ||
                        presenceType === roblox__WEBPACK_IMPORTED_MODULE_1__.PresenceType.Studio)) {
                    item.resolve({
                        type: presenceType,
                        location: {
                            placeId: presence.placeId || undefined,
                            universeId: presence.universeId || undefined,
                            name: getLocationName(presenceType, presence.lastLocation),
                            serverId: presence.gameId,
                        },
                    });
                }
                else {
                    item.resolve({
                        type: presenceType,
                    });
                }
            }
            else {
                item.resolve({
                    type: roblox__WEBPACK_IMPORTED_MODULE_1__.PresenceType.Offline,
                });
            }
        });
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PresenceBatchProcessor);


/***/ }),

/***/ "./src/js/services/presence/index.ts":
/*!*******************************************!*\
  !*** ./src/js/services/presence/index.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getUserPresence": () => (/* binding */ getUserPresence)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");
/* harmony import */ var _batchProcessor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./batchProcessor */ "./src/js/services/presence/batchProcessor.ts");



const messageDestination = 'presenceService.getUserPresence';
const presenceProcessor = new _batchProcessor__WEBPACK_IMPORTED_MODULE_2__["default"]();
const presenceCache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_1__["default"]('presenceService', 15 * 1000);
// Fetches the presence for a user.
const getUserPresence = (userId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, { userId });
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return presenceCache.getOrAdd(`${message.userId}`, () => 
    // Queue up the fetch request, when not in the cache
    presenceProcessor.enqueue(message.userId));
});
globalThis.presenceService = { getUserPresence };



/***/ }),

/***/ "./src/js/services/private-messages/getUnreadMessageCount.ts":
/*!*******************************************************************!*\
  !*** ./src/js/services/private-messages/getUnreadMessageCount.ts ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tix-factory/extension-utils */ "./libs/extension-utils/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");



const messageDestination = 'privateMessagesService.getUnreadMessageCount';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__["default"](messageDestination, 30 * 1000);
const failureDelay = 5 * 1000;
// Fetches the unread private message count for the currently authenticated user.
const getUnreadMessageCount = (userId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, { userId });
};
// Loads the unread private message count for the authenticated user.
const loadUnreadMessageCount = async (userId) => {
    // User ID is used as a cache buster.
    const response = await fetch(`https://privatemessages.roblox.com/v1/messages/unread/count`);
    // If we fail to send the request, delay the response to ensure we don't spam the API.
    if (response.status === 401) {
        await (0,_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__.wait)(failureDelay);
        throw 'User is unauthenticated';
    }
    else if (!response.ok) {
        await (0,_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__.wait)(failureDelay);
        throw 'Failed to load unread private message count';
    }
    const result = await response.json();
    return result.count;
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.userId}`, () => 
    // Queue up the fetch request, when not in the cache
    loadUnreadMessageCount(message.userId));
}, {
    levelOfParallelism: 1,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getUnreadMessageCount);


/***/ }),

/***/ "./src/js/services/private-messages/index.ts":
/*!***************************************************!*\
  !*** ./src/js/services/private-messages/index.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getUnreadMessageCount": () => (/* reexport safe */ _getUnreadMessageCount__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _getUnreadMessageCount__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./getUnreadMessageCount */ "./src/js/services/private-messages/getUnreadMessageCount.ts");

globalThis.privateMessagesService = { getUnreadMessageCount: _getUnreadMessageCount__WEBPACK_IMPORTED_MODULE_0__["default"] };



/***/ }),

/***/ "./src/js/services/settings/index.ts":
/*!*******************************************!*\
  !*** ./src/js/services/settings/index.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
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

/***/ "./src/js/services/thumbnails/batchProcessor.ts":
/*!******************************************************!*\
  !*** ./src/js/services/thumbnails/batchProcessor.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_batch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/batch */ "./node_modules/@tix-factory/batch/dist/index.js");
/* harmony import */ var roblox__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! roblox */ "./libs/roblox/dist/index.js");


class ThumbnailBatchProcessor extends _tix_factory_batch__WEBPACK_IMPORTED_MODULE_0__.Batch {
    constructor() {
        super({
            levelOfParallelism: 1,
            maxSize: 100,
            minimumDelay: 1 * 1000,
            enqueueDeferDelay: 10,
        });
    }
    async process(items) {
        const response = await fetch('https://thumbnails.roblox.com/v1/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(items.map(({ value }) => {
                return {
                    requestId: `${value.type}_${value.targetId}_${value.size}`,
                    type: value.type,
                    targetId: value.targetId,
                    size: value.size,
                };
            })),
        });
        if (!response.ok) {
            throw new Error('Failed to load thumbnails');
        }
        const result = await response.json();
        items.forEach((item) => {
            const thumbnail = result.data.find((t) => t.requestId ===
                `${item.value.type}_${item.value.targetId}_${item.value.size}`);
            if (thumbnail) {
                const thumbnailState = thumbnail.state;
                item.resolve({
                    state: thumbnailState,
                    imageUrl: thumbnailState === roblox__WEBPACK_IMPORTED_MODULE_1__.ThumbnailState.Completed
                        ? thumbnail.imageUrl
                        : '',
                });
            }
            else {
                item.resolve({
                    state: roblox__WEBPACK_IMPORTED_MODULE_1__.ThumbnailState.Error,
                    imageUrl: '',
                });
            }
        });
    }
}
const thumbnailBatchProcessor = new ThumbnailBatchProcessor();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (thumbnailBatchProcessor);


/***/ }),

/***/ "./src/js/services/thumbnails/index.ts":
/*!*********************************************!*\
  !*** ./src/js/services/thumbnails/index.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getAssetThumbnail": () => (/* binding */ getAssetThumbnail),
/* harmony export */   "getAvatarHeadshotThumbnail": () => (/* binding */ getAvatarHeadshotThumbnail),
/* harmony export */   "getDeveloperProductIcon": () => (/* binding */ getDeveloperProductIcon),
/* harmony export */   "getGameIcon": () => (/* binding */ getGameIcon),
/* harmony export */   "getGamePassIcon": () => (/* binding */ getGamePassIcon),
/* harmony export */   "getGroupIcon": () => (/* binding */ getGroupIcon)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var roblox__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! roblox */ "./libs/roblox/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");
/* harmony import */ var _batchProcessor__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./batchProcessor */ "./src/js/services/thumbnails/batchProcessor.ts");




const messageDestination = 'thumbnailsService.getThumbnail';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__["default"](messageDestination, 5 * 60 * 1000);
// Fetches an avatar headshot thumbnail, for the given user ID.
const getAvatarHeadshotThumbnail = (userId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {
        type: roblox__WEBPACK_IMPORTED_MODULE_1__.ThumbnailType.AvatarHeadShot,
        targetId: userId,
    });
};
// Fetches an asset thumbnail, for the given asset ID.
const getAssetThumbnail = (assetId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {
        type: roblox__WEBPACK_IMPORTED_MODULE_1__.ThumbnailType.Asset,
        targetId: assetId,
    });
};
// Fetches a group icon.
const getGroupIcon = (groupId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {
        type: roblox__WEBPACK_IMPORTED_MODULE_1__.ThumbnailType.GroupIcon,
        targetId: groupId,
    });
};
// Fetches a game pass icon.
const getGamePassIcon = (gamePassId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {
        type: roblox__WEBPACK_IMPORTED_MODULE_1__.ThumbnailType.GamePass,
        targetId: gamePassId,
    });
};
// Fetches a developer product icon.
const getDeveloperProductIcon = (gamePassId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {
        type: roblox__WEBPACK_IMPORTED_MODULE_1__.ThumbnailType.DeveloperProduct,
        targetId: gamePassId,
    });
};
// Fetches a game icon.
const getGameIcon = (gamePassId) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {
        type: roblox__WEBPACK_IMPORTED_MODULE_1__.ThumbnailType.GameIcon,
        targetId: gamePassId,
    });
};
// Gets the default size for the thumbnail, by type.
const getThumbnailSize = (thumbnailType) => {
    switch (thumbnailType) {
        case roblox__WEBPACK_IMPORTED_MODULE_1__.ThumbnailType.GamePass:
            return '150x150';
        case roblox__WEBPACK_IMPORTED_MODULE_1__.ThumbnailType.GameIcon:
            return '256x256';
        default:
            return '420x420';
    }
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, async (message) => {
    const cacheKey = `${message.type}:${message.targetId}`;
    // Check the cache
    const thumbnail = await cache.getOrAdd(cacheKey, () => 
    // Queue up the fetch request, when not in the cache
    _batchProcessor__WEBPACK_IMPORTED_MODULE_3__["default"].enqueue({
        type: message.type,
        targetId: message.targetId,
        size: getThumbnailSize(message.type),
    }));
    if (thumbnail.state !== roblox__WEBPACK_IMPORTED_MODULE_1__.ThumbnailState.Completed) {
        setTimeout(() => {
            // If the thumbnail isn't complete, evict it from the cache early.
            cache.evict(cacheKey);
        }, 30 * 1000);
    }
    return thumbnail;
}, {
    levelOfParallelism: -1,
    allowExternalConnections: true,
});
globalThis.thumbnailsService = {
    getAvatarHeadshotThumbnail,
    getAssetThumbnail,
    getGroupIcon,
    getGamePassIcon,
    getDeveloperProductIcon,
    getGameIcon,
};



/***/ }),

/***/ "./src/js/services/trades/getTradeCount.ts":
/*!*************************************************!*\
  !*** ./src/js/services/trades/getTradeCount.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tix-factory/extension-utils */ "./libs/extension-utils/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");



const messageDestination = 'tradesService.getTradeCount';
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__["default"](messageDestination, 30 * 1000);
const failureDelay = 5 * 1000;
// Fetches the unread private message count for the currently authenticated user.
const getTradeCount = (tradeStatusType) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {
        tradeStatusType,
    });
};
// Loads the unread private message count for the authenticated user.
const loadTradeCount = async (tradeStatusType) => {
    // User ID is used as a cache buster.
    const response = await fetch(`https://trades.roblox.com/v1/trades/${tradeStatusType}/count`);
    // If we fail to send the request, delay the response to ensure we don't spam the API.
    if (response.status === 401) {
        await (0,_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__.wait)(failureDelay);
        throw 'User is unauthenticated';
    }
    else if (!response.ok) {
        await (0,_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__.wait)(failureDelay);
        throw `Failed to load ${tradeStatusType} trade count`;
    }
    const result = await response.json();
    return result.count;
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(`${message.tradeStatusType}`, () => 
    // Queue up the fetch request, when not in the cache
    loadTradeCount(message.tradeStatusType));
}, {
    levelOfParallelism: 1,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getTradeCount);


/***/ }),

/***/ "./src/js/services/trades/index.ts":
/*!*****************************************!*\
  !*** ./src/js/services/trades/index.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getTradeCount": () => (/* reexport safe */ _getTradeCount__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _getTradeCount__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./getTradeCount */ "./src/js/services/trades/getTradeCount.ts");

globalThis.tradesService = { getTradeCount: _getTradeCount__WEBPACK_IMPORTED_MODULE_0__["default"] };



/***/ }),

/***/ "./src/js/services/transactions/email-transactions.ts":
/*!************************************************************!*\
  !*** ./src/js/services/transactions/email-transactions.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/xsrfFetch */ "./src/js/utils/xsrfFetch.ts");


const messageDestination = 'transactionsService.emailTransactions';
// Fetches the groups the user has access privileged roles in.
const emailTransactions = (targetType, targetId, transactionType, startDate, endDate) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {
        targetType,
        targetId,
        transactionType,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
    });
};
// Loads the groups the user has access privileged roles in.
const doEmailTransactions = async (targetType, targetId, transactionType, startDate, endDate) => {
    const response = await (0,_utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_1__["default"])(new URL(`https://economy.roblox.com/v2/sales/sales-report-download`), {
        method: 'POST',
        body: JSON.stringify({
            targetType,
            targetId,
            transactionType,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        }),
    });
    if (!response.ok) {
        throw 'Failed to send transactions email';
    }
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => {
    // Check the cache
    return doEmailTransactions(message.targetType, message.targetId, message.transactionType, new Date(message.startDate), new Date(message.endDate));
}, {
    levelOfParallelism: 1,
    allowExternalConnections: true,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (emailTransactions);


/***/ }),

/***/ "./src/js/services/transactions/index.ts":
/*!***********************************************!*\
  !*** ./src/js/services/transactions/index.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "emailGroupTransactionSales": () => (/* binding */ emailGroupTransactionSales),
/* harmony export */   "emailUserTransactionSales": () => (/* binding */ emailUserTransactionSales)
/* harmony export */ });
/* harmony import */ var _email_transactions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./email-transactions */ "./src/js/services/transactions/email-transactions.ts");

// Sends an email to the authenticated user with the group's transactions (sales).
const emailGroupTransactionSales = (groupId, startDate, endDate) => (0,_email_transactions__WEBPACK_IMPORTED_MODULE_0__["default"])('Group', groupId, 'Sale', startDate, endDate);
// Sends an email to the authenticated user with their personally transactions (sales).
const emailUserTransactionSales = (userId, startDate, endDate) => (0,_email_transactions__WEBPACK_IMPORTED_MODULE_0__["default"])('User', userId, 'Sale', startDate, endDate);
globalThis.transactionsService = { emailGroupTransactionSales, emailUserTransactionSales };



/***/ }),

/***/ "./src/js/services/users/get-user-by-id.ts":
/*!*************************************************!*\
  !*** ./src/js/services/users/get-user-by-id.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_batch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/batch */ "./node_modules/@tix-factory/batch/dist/index.js");
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");
/* harmony import */ var _utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils/xsrfFetch */ "./src/js/utils/xsrfFetch.ts");




const messageDestination = 'usersService.getUserById';
class UsersBatchProcessor extends _tix_factory_batch__WEBPACK_IMPORTED_MODULE_0__.Batch {
    constructor() {
        super({
            levelOfParallelism: 1,
            maxSize: 100,
            minimumDelay: 1000,
            enqueueDeferDelay: 10,
        });
    }
    async process(items) {
        const response = await (0,_utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_3__["default"])(new URL(`https://users.roblox.com/v1/users`), {
            method: 'POST',
            body: JSON.stringify({
                userIds: items.map((i) => i.key),
                excludeBannedUsers: false,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to users by ids');
        }
        const result = await response.json();
        items.forEach((item) => {
            const user = result.data.find((a) => a.id === item.value);
            if (user) {
                item.resolve({
                    id: user.id,
                    name: user.name,
                    displayName: user.displayName,
                });
            }
            else {
                item.resolve(null);
            }
        });
    }
    getKey(item) {
        return item.toString();
    }
}
const batchProcessor = new UsersBatchProcessor();
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__["default"](messageDestination, 2 * 60 * 1000);
// Fetches the date when a badge was awarded to the specified user.
const getUserById = async (id) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_1__.sendMessage)(messageDestination, {
        id,
    });
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_1__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(batchProcessor.getKey(message.id), () => {
        // Queue up the fetch request, when not in the cache
        return batchProcessor.enqueue(message.id);
    });
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getUserById);


/***/ }),

/***/ "./src/js/services/users/get-user-by-name.ts":
/*!***************************************************!*\
  !*** ./src/js/services/users/get-user-by-name.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_batch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/batch */ "./node_modules/@tix-factory/batch/dist/index.js");
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/expireableDictionary */ "./src/js/utils/expireableDictionary.ts");
/* harmony import */ var _utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils/xsrfFetch */ "./src/js/utils/xsrfFetch.ts");




const messageDestination = 'usersService.getUserByName';
class UserNamesBatchProcessor extends _tix_factory_batch__WEBPACK_IMPORTED_MODULE_0__.Batch {
    constructor() {
        super({
            levelOfParallelism: 1,
            maxSize: 100,
            minimumDelay: 1000,
            enqueueDeferDelay: 10,
        });
    }
    async process(items) {
        const response = await (0,_utils_xsrfFetch__WEBPACK_IMPORTED_MODULE_3__["default"])(new URL(`https://users.roblox.com/v1/usernames/users`), {
            method: 'POST',
            body: JSON.stringify({
                usernames: items.map((i) => i.key),
                excludeBannedUsers: false,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to users by names');
        }
        const result = await response.json();
        items.forEach((item) => {
            const user = result.data.find((a) => a.requestedUsername === item.key);
            if (user) {
                item.resolve({
                    id: user.id,
                    name: user.name,
                    displayName: user.displayName,
                });
            }
            else {
                item.resolve(null);
            }
        });
    }
    getKey(item) {
        return item;
    }
}
const batchProcessor = new UserNamesBatchProcessor();
const cache = new _utils_expireableDictionary__WEBPACK_IMPORTED_MODULE_2__["default"](messageDestination, 2 * 60 * 1000);
// Fetches the date when a badge was awarded to the specified user.
const getUserByName = async (name) => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_1__.sendMessage)(messageDestination, {
        name: name.toLowerCase(),
    });
};
// Listen for messages sent to the service worker.
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_1__.addListener)(messageDestination, (message) => {
    // Check the cache
    return cache.getOrAdd(batchProcessor.getKey(message.name), () => {
        // Queue up the fetch request, when not in the cache
        return batchProcessor.enqueue(message.name);
    });
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getUserByName);


/***/ }),

/***/ "./src/js/services/users/getAuthenticatedUser.ts":
/*!*******************************************************!*\
  !*** ./src/js/services/users/getAuthenticatedUser.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");

const messageDestination = 'usersService.getAuthenticatedUser';
const cacheDuration = 60 * 1000;
let authenticatedUser = undefined;
// Fetches the currently authenticated user.
const getAuthenticatedUser = () => {
    return (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, {});
};
// Loads the currently authenticated user.
const loadAuthenticatedUser = async () => {
    if (authenticatedUser !== undefined) {
        return authenticatedUser;
    }
    try {
        const response = await fetch('https://users.roblox.com/v1/users/authenticated');
        if (response.status === 401) {
            return (authenticatedUser = null);
        }
        else if (!response.ok) {
            throw new Error('Failed to load authenticated user');
        }
        const result = await response.json();
        return (authenticatedUser = {
            id: result.id,
            name: result.name,
            displayName: result.displayName,
        });
    }
    finally {
        setTimeout(() => {
            authenticatedUser = undefined;
        }, cacheDuration);
    }
};
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, () => loadAuthenticatedUser(), {
    levelOfParallelism: 1,
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getAuthenticatedUser);


/***/ }),

/***/ "./src/js/services/users/index.ts":
/*!****************************************!*\
  !*** ./src/js/services/users/index.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getAuthenticatedUser": () => (/* reexport safe */ _getAuthenticatedUser__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "getUserById": () => (/* reexport safe */ _get_user_by_id__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   "getUserByName": () => (/* reexport safe */ _get_user_by_name__WEBPACK_IMPORTED_MODULE_1__["default"])
/* harmony export */ });
/* harmony import */ var _getAuthenticatedUser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./getAuthenticatedUser */ "./src/js/services/users/getAuthenticatedUser.ts");
/* harmony import */ var _get_user_by_name__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./get-user-by-name */ "./src/js/services/users/get-user-by-name.ts");
/* harmony import */ var _get_user_by_id__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./get-user-by-id */ "./src/js/services/users/get-user-by-id.ts");



globalThis.usersService = { getAuthenticatedUser: _getAuthenticatedUser__WEBPACK_IMPORTED_MODULE_0__["default"], getUserByName: _get_user_by_name__WEBPACK_IMPORTED_MODULE_1__["default"], getUserById: _get_user_by_id__WEBPACK_IMPORTED_MODULE_2__["default"] };



/***/ }),

/***/ "./src/js/utils/expireableDictionary.ts":
/*!**********************************************!*\
  !*** ./src/js/utils/expireableDictionary.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
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

/***/ "./src/js/utils/fetchDataUri.ts":
/*!**************************************!*\
  !*** ./src/js/utils/fetchDataUri.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _expireableDictionary__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./expireableDictionary */ "./src/js/utils/expireableDictionary.ts");

const cache = new _expireableDictionary__WEBPACK_IMPORTED_MODULE_0__["default"]('fetchDataUri', 5 * 60 * 1000);
// Converts a URL to a data URI of its loaded contents.
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((url) => {
    return cache.getOrAdd(url.href, () => {
        return new Promise((resolve, reject) => {
            fetch(url.href)
                .then((result) => {
                const reader = new FileReader();
                reader.onerror = (err) => {
                    reject(err);
                };
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result);
                    }
                    else {
                        reject(new Error(`fetchDataUri: Unexpected result type (${typeof reader.result})`));
                    }
                };
                result
                    .blob()
                    .then((blob) => {
                    reader.readAsDataURL(blob);
                })
                    .catch(reject);
            })
                .catch(reject);
        });
    });
});


/***/ }),

/***/ "./src/js/utils/launchProtocolUrl.ts":
/*!*******************************************!*\
  !*** ./src/js/utils/launchProtocolUrl.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tix-factory/extension-utils */ "./libs/extension-utils/dist/index.js");


const messageDestination = 'launchProtocolUrl';
// Keep track of the tabs, so we can put the user back where they were.b
let previousTab = undefined;
let protocolLauncherTab = undefined;
// Attempt to launch the protocol URL in the current tab.
const tryDirectLaunch = (protocolUrl) => {
    if (!_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__.isServiceWorker && location) {
        location.href = protocolUrl;
        return true;
    }
    return false;
};
// Launch the protocol URL from a service worker.
const launchProtocolUrl = async (protocolUrl) => {
    if (tryDirectLaunch(protocolUrl)) {
        // We were able to directly launch the protocol URL.
        // Nothing more to do.
        return;
    }
    const currentTab = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });
    previousTab = currentTab[0];
    if (previousTab) {
        // Try to open the protocol launcher tab right next to the current tab, so that when it
        // closes, it will put the user back on the tab they are on now.
        protocolLauncherTab = await chrome.tabs.create({
            url: protocolUrl,
            index: previousTab.index + 1,
            windowId: previousTab.windowId,
        });
    }
    else {
        await chrome.tabs.create({ url: protocolUrl });
        // If we don't know where they were before, then don't try to keep track of anything.
        previousTab = undefined;
        protocolLauncherTab = undefined;
    }
};
if (_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_1__.isServiceWorker) {
    chrome.tabs.onRemoved.addListener((tabId) => {
        // Return the user to the tab they were on before, when we're done launching the protocol URL.
        // chrome self-closes the protocol URL tab when opened.
        if (tabId === protocolLauncherTab?.id && previousTab?.id) {
            chrome.tabs.update(previousTab.id, {
                active: true,
            });
        }
        previousTab = undefined;
        protocolLauncherTab = undefined;
    });
}
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.addListener)(messageDestination, (message) => launchProtocolUrl(message.protocolUrl));
// Launches a protocol URL, using the most user-friendly method.
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (async (protocolUrl) => {
    if (tryDirectLaunch(protocolUrl)) {
        // If we can directly launch the protocol URL, there's nothing left to do.
        return;
    }
    // Otherwise, we have to send a message out and try some nonsense.
    await (0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_0__.sendMessage)(messageDestination, { protocolUrl });
});


/***/ }),

/***/ "./src/js/utils/xsrfFetch.ts":
/*!***********************************!*\
  !*** ./src/js/utils/xsrfFetch.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const headerName = 'X-CSRF-Token';
let xsrfToken = '';
// A fetch request which will attach an X-CSRF-Token in all outbound requests.
const xsrfFetch = async (url, requestDetails) => {
    if (url.hostname.endsWith('.roblox.com')) {
        if (!requestDetails) {
            requestDetails = {};
        }
        requestDetails.credentials = 'include';
        if (!requestDetails.headers) {
            requestDetails.headers = new Headers();
        }
        if (requestDetails.headers instanceof Headers) {
            if (xsrfToken) {
                requestDetails.headers.set(headerName, xsrfToken);
            }
            if (requestDetails.body && !requestDetails.headers.has('Content-Type')) {
                requestDetails.headers.set('Content-Type', 'application/json');
            }
        }
    }
    const response = await fetch(url, requestDetails);
    const token = response.headers.get(headerName);
    if (response.ok || !token) {
        return response;
    }
    xsrfToken = token;
    return xsrfFetch(url, requestDetails);
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (xsrfFetch);


/***/ }),

/***/ "./node_modules/@tix-factory/batch/dist/batch/index.js":
/*!*************************************************************!*\
  !*** ./node_modules/@tix-factory/batch/dist/batch/index.js ***!
  \*************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
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

"use strict";
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

"use strict";
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

"use strict";
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

"use strict";
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
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
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
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!****************************************!*\
  !*** ./src/js/service-worker/index.ts ***!
  \****************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "assets": () => (/* reexport module object */ _services_assets__WEBPACK_IMPORTED_MODULE_0__),
/* harmony export */   "avatar": () => (/* reexport module object */ _services_avatar__WEBPACK_IMPORTED_MODULE_1__),
/* harmony export */   "badges": () => (/* reexport module object */ _services_badges__WEBPACK_IMPORTED_MODULE_2__),
/* harmony export */   "currency": () => (/* reexport module object */ _services_currency__WEBPACK_IMPORTED_MODULE_3__),
/* harmony export */   "executeNotifier": () => (/* reexport safe */ _notifiers__WEBPACK_IMPORTED_MODULE_22__.executeNotifier),
/* harmony export */   "followings": () => (/* reexport module object */ _services_followings__WEBPACK_IMPORTED_MODULE_4__),
/* harmony export */   "friends": () => (/* reexport module object */ _services_friends__WEBPACK_IMPORTED_MODULE_5__),
/* harmony export */   "gameLaunch": () => (/* reexport module object */ _services_game_launch__WEBPACK_IMPORTED_MODULE_6__),
/* harmony export */   "gamePasses": () => (/* reexport module object */ _services_game_passes__WEBPACK_IMPORTED_MODULE_7__),
/* harmony export */   "groups": () => (/* reexport module object */ _services_groups__WEBPACK_IMPORTED_MODULE_8__),
/* harmony export */   "inventory": () => (/* reexport module object */ _services_inventory__WEBPACK_IMPORTED_MODULE_9__),
/* harmony export */   "localization": () => (/* reexport module object */ _services_localization__WEBPACK_IMPORTED_MODULE_10__),
/* harmony export */   "premium": () => (/* reexport module object */ _services_premium__WEBPACK_IMPORTED_MODULE_11__),
/* harmony export */   "premiumPayouts": () => (/* reexport module object */ _services_premium_payouts__WEBPACK_IMPORTED_MODULE_12__),
/* harmony export */   "presence": () => (/* reexport module object */ _services_presence__WEBPACK_IMPORTED_MODULE_13__),
/* harmony export */   "privateMessages": () => (/* reexport module object */ _services_private_messages__WEBPACK_IMPORTED_MODULE_14__),
/* harmony export */   "settings": () => (/* reexport module object */ _services_settings__WEBPACK_IMPORTED_MODULE_15__),
/* harmony export */   "thumbnails": () => (/* reexport module object */ _services_thumbnails__WEBPACK_IMPORTED_MODULE_16__),
/* harmony export */   "trades": () => (/* reexport module object */ _services_trades__WEBPACK_IMPORTED_MODULE_17__),
/* harmony export */   "transactions": () => (/* reexport module object */ _services_transactions__WEBPACK_IMPORTED_MODULE_18__),
/* harmony export */   "users": () => (/* reexport module object */ _services_users__WEBPACK_IMPORTED_MODULE_19__)
/* harmony export */ });
/* harmony import */ var _services_assets__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../services/assets */ "./src/js/services/assets/index.ts");
/* harmony import */ var _services_avatar__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../services/avatar */ "./src/js/services/avatar/index.ts");
/* harmony import */ var _services_badges__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../services/badges */ "./src/js/services/badges/index.ts");
/* harmony import */ var _services_currency__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../services/currency */ "./src/js/services/currency/index.ts");
/* harmony import */ var _services_followings__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../services/followings */ "./src/js/services/followings/index.ts");
/* harmony import */ var _services_friends__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../services/friends */ "./src/js/services/friends/index.ts");
/* harmony import */ var _services_game_launch__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../services/game-launch */ "./src/js/services/game-launch/index.ts");
/* harmony import */ var _services_game_passes__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../services/game-passes */ "./src/js/services/game-passes/index.ts");
/* harmony import */ var _services_groups__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../services/groups */ "./src/js/services/groups/index.ts");
/* harmony import */ var _services_inventory__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../services/inventory */ "./src/js/services/inventory/index.ts");
/* harmony import */ var _services_localization__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../services/localization */ "./src/js/services/localization/index.ts");
/* harmony import */ var _services_premium__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../services/premium */ "./src/js/services/premium/index.ts");
/* harmony import */ var _services_premium_payouts__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../services/premium-payouts */ "./src/js/services/premium-payouts/index.ts");
/* harmony import */ var _services_presence__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../services/presence */ "./src/js/services/presence/index.ts");
/* harmony import */ var _services_private_messages__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../services/private-messages */ "./src/js/services/private-messages/index.ts");
/* harmony import */ var _services_settings__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../services/settings */ "./src/js/services/settings/index.ts");
/* harmony import */ var _services_thumbnails__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../services/thumbnails */ "./src/js/services/thumbnails/index.ts");
/* harmony import */ var _services_trades__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../services/trades */ "./src/js/services/trades/index.ts");
/* harmony import */ var _services_transactions__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ../services/transactions */ "./src/js/services/transactions/index.ts");
/* harmony import */ var _services_users__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ../services/users */ "./src/js/services/users/index.ts");
/* harmony import */ var _tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! @tix-factory/extension-messaging */ "./libs/extension-messaging/dist/index.js");
/* harmony import */ var _tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! @tix-factory/extension-utils */ "./libs/extension-utils/dist/index.js");
/* harmony import */ var _notifiers__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./notifiers */ "./src/js/service-worker/notifiers/index.ts");























chrome.action.setTitle({
    title: `${_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_21__.manifest.name} ${_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_21__.manifest.version}`,
});
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({
        url: _tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_21__.manifest.homepage_url,
        active: true,
    });
});
(0,_tix_factory_extension_messaging__WEBPACK_IMPORTED_MODULE_20__.addListener)('extension.reload', async () => {
    setTimeout(() => {
        chrome.runtime.reload();
    }, 250);
}, {
    levelOfParallelism: 1,
    allowExternalConnections: true,
});
console.log(_tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_21__.manifest.name, _tix_factory_extension_utils__WEBPACK_IMPORTED_MODULE_21__.manifest.version, 'started', chrome.extension.inIncognitoContext ? ' in icognito' : '');

})();

/******/ })()
;
//# sourceMappingURL=service-worker.js.map