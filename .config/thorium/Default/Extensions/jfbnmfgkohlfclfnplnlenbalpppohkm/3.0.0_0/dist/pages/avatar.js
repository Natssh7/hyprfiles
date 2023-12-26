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
/*!**************************************!*\
  !*** ./src/js/pages/avatar/index.ts ***!
  \**************************************/
__webpack_require__.r(__webpack_exports__);
const filterInput = document.createElement('input');
filterInput.setAttribute('class', 'form-control input-field');
filterInput.setAttribute('placeholder', 'Filter items by name...');
const getItemName = (itemCard) => {
    const itemName = itemCard.querySelector('a.item-card-thumb-container');
    return itemName?.getAttribute('data-item-name');
};
const filterItemCard = (itemCard) => {
    if (!itemCard ||
        !itemCard.classList.contains('list-item') ||
        !itemCard.classList.contains('item-card')) {
        // Not an item card
        return;
    }
    if (!itemCard.closest('.avatar-item-list')) {
        // It's an item card, but it's not an avatar item card.
        return;
    }
    const itemName = getItemName(itemCard);
    if (!itemName) {
        // This.. must not be what we're looking for.
        // Should probably log a warning here.
        return;
    }
    itemCard.classList.toggle('hidden', filterInput.value
        ? !itemName.toLowerCase().includes(filterInput.value.toLowerCase())
        : false);
};
const filterAllItems = () => {
    document
        .querySelectorAll('.avatar-item-list .item-card')
        .forEach((element) => {
        if (!(element instanceof HTMLElement)) {
            return;
        }
        filterItemCard(element);
    });
};
globalThis.addEventListener('DOMNodeInserted', (event) => {
    if (!(event.target instanceof HTMLElement)) {
        return;
    }
    filterItemCard(event.target);
});
filterInput.addEventListener('change', filterAllItems);
filterInput.addEventListener('keyup', filterAllItems);
setInterval(() => {
    const tabHeader = document.querySelector('div[avatar-tab-content-header]');
    const breadcrumbs = tabHeader?.querySelector('.breadcrumb-container');
    if (tabHeader?.contains(filterInput) || !breadcrumbs) {
        return;
    }
    breadcrumbs.after(filterInput);
}, 250);


/******/ })()
;
//# sourceMappingURL=avatar.js.map