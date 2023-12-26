/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/css/pages/games-list.scss":
/*!***************************************!*\
  !*** ./src/css/pages/games-list.scss ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


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
/*!******************************************!*\
  !*** ./src/js/pages/games-list/index.ts ***!
  \******************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _css_pages_games_list_scss__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../css/pages/games-list.scss */ "./src/css/pages/games-list.scss");

const rankAttribute = 'rplus-rank-indicator';
const getTileRank = (gameTile, index) => {
    if (gameTile.previousElementSibling instanceof HTMLElement) {
        const indicator = Number(gameTile.previousElementSibling.getAttribute(rankAttribute) || NaN);
        if (!isNaN(indicator)) {
            return indicator + 1;
        }
    }
    return index + 1;
};
const addRankIndicator = (gameTile, index) => {
    const rank = getTileRank(gameTile, index);
    gameTile.setAttribute(rankAttribute, `${rank}`);
    const thumbnail = gameTile.querySelector('.game-card-link');
    if (thumbnail instanceof HTMLElement) {
        const rankContainer = document.createElement('div');
        rankContainer.setAttribute('class', 'rplus-rank-indicator');
        const rankIndicator = document.createElement('b');
        rankIndicator.innerText = `#${rank.toLocaleString()}`;
        rankContainer.appendChild(rankIndicator);
        thumbnail.appendChild(rankContainer);
    }
};
setInterval(() => {
    document
        .querySelectorAll('ul.game-cards.game-tile-list')
        .forEach((gameList, i) => {
        gameList
            .querySelectorAll(`li.list-item.game-card.game-tile:not([${rankAttribute}])`)
            .forEach((e, i) => {
            if (e instanceof HTMLElement) {
                addRankIndicator(e, i);
            }
        });
    });
    document
        .querySelectorAll(`div.grid-item-container.game-card-container:not([${rankAttribute}])`)
        .forEach((e, i) => {
        if (e instanceof HTMLElement) {
            addRankIndicator(e, i);
        }
    });
}, 500);

})();

/******/ })()
;
//# sourceMappingURL=games-list.js.map