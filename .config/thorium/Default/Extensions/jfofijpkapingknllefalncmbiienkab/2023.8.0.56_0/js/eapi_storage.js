'use strict';

function initEapiStorage()
{ /* local scope begin */
  // Cached local storage
  eApi.localStorage = {
    start: async function() {
        if ( this.cache instanceof Object ) { return this.cache; }
        
        await this.loadFromStore();

        this.onStorageChange = this.onStorageChangeLocal.bind(this);
        browser.storage.onChanged.addListener(this.onStorageChange);

        this.startClearCacheInterval();

        return this.cache;
    },
    clear: function() {
        this.cache = {};
    },
    getItem: function(key) {
        if ( this.cache instanceof Object === false ) {
            console.info(`localStorage.getItem('${key}') not ready`);
            return null;
        }
        const value = this.cache[key];
        return value !== undefined ? value : null;
    },
    getItemAsync: async function(key) {
        await this.start();
        const value = this.cache[key];
        return value !== undefined ? value : null;
    },
    removeItem: async function(key) {
        this.setItem(key);
    },
    setItem: async function(key, value = undefined) {
        await this.start();
        if ( value === this.cache[key] ) { return; }
        this.cache[key] = value;
        let obj = {};
        obj[key] = value;

        return browser.storage.local.set(obj);
    },

    loadFromStore: async function() {
      this.clear();
      let storeLocal = await chrome.storage.local.get();
      this.cache = storeLocal;
      return this.cache;
    },

    onStorageChangeLocal: async function (changes, area) {
      let changedItems = Object.keys(changes);

      await this.start();

      if (area === 'local') {
        for (let item of changedItems) {
          this.cache[item] = changes[item].newValue;
        }
      }   

      if (eApi.enableLogging) {
        let d = new Date();
        let t = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`;
        console.log(`${t}  Change in storage area: ${area}`);
        for (let item of changedItems) {
          console.log(`${item} has changed: "${JSON.stringify(changes[item].oldValue)}" => "${JSON.stringify(changes[item].newValue)}"`);
        }
      }
    },

    startClearCacheInterval: function () {
      setInterval(function() {
        let cache_object = getSetting("cache_object");
        if (cache_object) {
          var current_date = new Date().getTime();
          var changed = false;

          Object.keys(cache_object).forEach(function(key) {

              /* Taking the difference between current date and saved date in MINUTES. */
              var diff = (current_date - cache_object[key].timeSaved) / 1000 / 60;

              /* Everything saved for more than 15 minutes should be removed. */
              if (diff >= 15) {
                  delete cache_object[key];
                  changed = true;
              }
          });

          if (changed) {
            setSetting("cache_object", cache_object);
          }
        }
      }, 60000);
    },

    cache: undefined,

  };

  eApi.localStorage.start();

} /* local scope end */

function getSetting(key) {
  return eApi && eApi.localStorage ? eApi.localStorage.getItem(key) : null;
}

function setSetting(key, value) {
  if (eApi && eApi.localStorage) {
    eApi.localStorage.setItem(key, value);
  }
}


initEapiStorage();