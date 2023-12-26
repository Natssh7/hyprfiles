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

/***/ "./libs/roblox/dist/enums/asset-type.js":
/*!**********************************************!*\
  !*** ./libs/roblox/dist/enums/asset-type.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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

/***/ "./src/js/pages/profile/details.ts":
/*!*****************************************!*\
  !*** ./src/js/pages/profile/details.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "user": () => (/* binding */ user)
/* harmony export */ });
/* harmony import */ var roblox__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! roblox */ "./libs/roblox/dist/index.js");

const displayNameElement = document.querySelector('.header-title>h1:first-of-type');
const usernameElement = document.querySelector('.profile-display-name');
const displayName = displayNameElement?.innerText?.trim() || '';
const user = {
    id: (0,roblox__WEBPACK_IMPORTED_MODULE_0__.getIdFromUrl)(new URL(location.href)),
    name: usernameElement?.innerText?.trim().substring(1) || displayName,
    displayName,
};



/***/ }),

/***/ "./src/js/pages/profile/rap.ts":
/*!*************************************!*\
  !*** ./src/js/pages/profile/rap.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _services_inventory__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../services/inventory */ "./src/js/services/inventory/index.ts");
/* harmony import */ var _services_settings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../services/settings */ "./src/js/services/settings/index.ts");
/* harmony import */ var _utils_abbreviateNumber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/abbreviateNumber */ "./src/js/utils/abbreviateNumber.ts");
/* harmony import */ var _details__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./details */ "./src/js/pages/profile/details.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils */ "./src/js/pages/profile/utils.ts");





const getTotalInventoryValue = (limitedInventory) => {
    let value = 0;
    limitedInventory.forEach((item) => {
        if (!isNaN(item.recentAveragePrice)) {
            value += item.recentAveragePrice;
        }
    });
    return value;
};
(0,_services_settings__WEBPACK_IMPORTED_MODULE_1__.getToggleSettingValue)('profileRAP')
    .then((enabled) => {
    if (!enabled) {
        return;
    }
    const inventoryValueStat = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.createStat)('RAP', '...');
    inventoryValueStat.parentElement?.addEventListener('click', async (event) => {
        event.preventDefault();
        globalThis.postMessage({
            messageType: 'open-roblox-plus-widget',
            searchValue: location.href,
        });
    });
    (0,_services_inventory__WEBPACK_IMPORTED_MODULE_0__.getLimitedInventory)(_details__WEBPACK_IMPORTED_MODULE_3__.user.id)
        .then((limitedInventory) => {
        const value = getTotalInventoryValue(limitedInventory);
        inventoryValueStat.setAttribute('title', `R\$${value.toLocaleString()}`);
        inventoryValueStat.innerText = (0,_utils_abbreviateNumber__WEBPACK_IMPORTED_MODULE_2__["default"])(value);
    })
        .catch((err) => {
        console.error('Failed to load limited inventory', err);
        inventoryValueStat.parentElement?.parentElement?.remove();
    });
})
    .catch((err) => {
    console.error('Failed to check RAP setting.', err);
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({});


/***/ }),

/***/ "./src/js/pages/profile/utils.ts":
/*!***************************************!*\
  !*** ./src/js/pages/profile/utils.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "createStat": () => (/* binding */ createStat)
/* harmony export */ });
const headerDetails = document.querySelector('.header-details>ul.details-info');
const createStat = (labelText, valueText) => {
    const container = document.createElement('li');
    const label = document.createElement('div');
    label.setAttribute('class', 'text-label font-caption-header');
    label.innerText = labelText;
    const valueLink = document.createElement('a');
    valueLink.setAttribute('class', 'text-name');
    const value = document.createElement('span');
    value.setAttribute('class', 'font-header-2');
    value.innerText = valueText;
    container.appendChild(label);
    container.appendChild(valueLink);
    valueLink.appendChild(value);
    headerDetails?.appendChild(container);
    return value;
};



/***/ }),

/***/ "./src/js/services/inventory/get-asset-owners.ts":
/*!*******************************************************!*\
  !*** ./src/js/services/inventory/get-asset-owners.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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

/***/ "./src/js/services/users/get-user-by-id.ts":
/*!*************************************************!*\
  !*** ./src/js/services/users/get-user-by-id.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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

/***/ "./src/js/utils/abbreviateNumber.ts":
/*!******************************************!*\
  !*** ./src/js/utils/abbreviateNumber.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "abbreviations": () => (/* binding */ abbreviations),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// All the values to abbreviate a number at.
const abbreviations = [
    {
        value: 1000,
        abbreviation: 'K',
    },
    {
        value: 1000000,
        abbreviation: 'M',
    },
    {
        value: 1000000000,
        abbreviation: 'B',
    },
    {
        value: 1000000000000,
        abbreviation: 'T',
    },
];

// Abbreviates a number, for human readability, after it surpasses a given value (or after 1,000 if not provided).
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((value, abbreviateAt) => {
    if (!abbreviateAt) {
        abbreviateAt = abbreviations[0].value;
    }
    if (value >= abbreviateAt) {
        for (let i = abbreviations.length - 1; i >= 0; i--) {
            if (value >= abbreviations[i].value) {
                return `${Math.floor(value / abbreviations[i].value).toLocaleString()}${abbreviations[i].abbreviation}+`;
            }
        }
    }
    return value.toLocaleString();
});


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

/***/ "./src/js/utils/xsrfFetch.ts":
/*!***********************************!*\
  !*** ./src/js/utils/xsrfFetch.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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
/*!***************************************!*\
  !*** ./src/js/pages/profile/index.ts ***!
  \***************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "rap": () => (/* reexport safe */ _rap__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _rap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./rap */ "./src/js/pages/profile/rap.ts");

setTimeout(() => {
    // Allow the thumbnail to be dragged, and copy the URL of the user.
    const thumbnail = document.querySelector('.profile-avatar-thumb>.thumbnail-2d-container');
    if (!thumbnail || !(thumbnail instanceof HTMLElement)) {
        return;
    }
    thumbnail.draggable = true;
    thumbnail.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('text/plain', location.href);
    });
}, 1000);

})();

/******/ })()
;
//# sourceMappingURL=profile.js.map