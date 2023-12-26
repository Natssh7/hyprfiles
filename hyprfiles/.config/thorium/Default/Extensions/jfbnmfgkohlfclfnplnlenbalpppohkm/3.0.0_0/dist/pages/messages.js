/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
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
/*!****************************************!*\
  !*** ./src/js/pages/messages/index.ts ***!
  \****************************************/
__webpack_require__.r(__webpack_exports__);
setInterval(() => {
    document
        .querySelectorAll('#MessagesInbox .roblox-message-row a.avatar-card-link:not([rplus])')
        .forEach((link) => {
        if (!(link instanceof HTMLAnchorElement)) {
            return;
        }
        link.setAttribute('rplus', `${+new Date()}`);
        const userId = Number(link
            .querySelector('.thumbnail-2d-container')
            ?.getAttribute('thumbnail-target-id'));
        if (!userId) {
            return;
        }
        link.setAttribute('href', `/users/${userId}/profile`);
    });
}, 250);


/******/ })()
;
//# sourceMappingURL=messages.js.map