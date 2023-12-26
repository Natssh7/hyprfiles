'use strict';

if ( self.browser instanceof Object ) {
  self.chrome = self.browser;
} else {
  self.browser = self.chrome;
}

var eApi = self.eApi;

if (
    ((browser.runtime.getManifest().manifest_version >= 3) || 
      ( // manifest v2 check
        (
          document instanceof HTMLDocument ||
          document instanceof XMLDocument &&
          document.createElement('div') instanceof HTMLDivElement
        ) &&
        (
            /^image\/|^text\/plain/.test(document.contentType || '') === false
        )
      )
    ) &&
    (
        self.eApi instanceof Object === false || eApi.eMark !== true
    )
) {
    eApi = self.eApi = { eMark: true, enableLogging: true, };
}

function eLog(msg) {
  if (eApi && eApi.enableLogging) {
    console.log(msg);
  }
}


void 0; /* do not remove this line and keep it last one */