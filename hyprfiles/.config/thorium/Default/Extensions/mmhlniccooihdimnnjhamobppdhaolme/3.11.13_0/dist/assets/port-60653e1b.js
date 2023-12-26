import { b as browserPolyfillExports } from "./DollarPolyfills-e1e75c6d.js";
class ContentPortManager {
  // public mixin = {
  //     methods: {
  //         postMessage: msg => {
  //             this.port.postMessage(msg);
  //         }
  //     }
  // };
  postMessage(msg) {
    this.port.postMessage(msg);
  }
  startup(name) {
    this.port = browserPolyfillExports.runtime.connect({ name });
  }
  shutdown() {
    this.port = null;
  }
  get raw() {
    return this.port;
  }
}
const Port = new ContentPortManager();
export {
  Port as P
};
