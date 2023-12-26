import { d as browser, b as browserPolyfillExports } from "./DollarPolyfills-e1e75c6d.js";
import { A as Action } from "./Mutation-73212a9c.js";
import { c as configManager, K as KeeLog } from "./ConfigManager-21f0f76b.js";
import { P as PasswordGenerator, m as mapState, u as useStore, _ as _export_sfc, r as resolveComponent, o as openBlock, b as createBlock, w as withCtx, d as createVNode, y as createPinia, z as createApp, A as h, B as createVuetify, C as components, D as directives, I as IPCPiniaPlugin } from "./IPCPiniaPlugin-cd3ffaf7.js";
import { P as Port } from "./port-60653e1b.js";
import { s as setup } from "./i18n-018df846.js";
import "./Database-95399186.js";
import "./SessionType-21786bb4.js";
const _sfc_main = {
  components: {
    PasswordGenerator
  },
  data: () => ({
    showPasswordGenerator: false
  }),
  computed: {
    ...mapState(useStore, [
      "showGeneratePasswordLink",
      "connectionStatus",
      "connectionStatusDetail",
      "connected",
      "databaseIsOpen"
    ])
  },
  methods: {
    passwordGeneratorClosed: function() {
      Port.postMessage({ action: Action.CloseAllPanels });
    },
    copyToClipboard: function(payload) {
      if (payload == null ? void 0 : payload.value) {
        Port.postMessage({ copyToClipboard: payload.value });
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_PasswordGenerator = resolveComponent("PasswordGenerator");
  const _component_v_app = resolveComponent("v-app");
  return openBlock(), createBlock(_component_v_app, null, {
    default: withCtx(() => [
      createVNode(_component_PasswordGenerator, {
        standalone: true,
        topmost: true,
        onDialogClosed: $options.passwordGeneratorClosed,
        onCopyToClipboard: $options.copyToClipboard
      }, null, 8, ["onDialogClosed", "onCopyToClipboard"])
    ]),
    _: 1
  });
}
const Panel = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render]]);
function updateFrameState(newState) {
}
let vueApp;
let store;
function startup() {
  KeeLog.debug("iframe page starting");
  KeeLog.attachConfig(configManager.current);
  Port.startup("iframe_" + parentFrameId);
  const darkTheme = params["theme"] === "dark";
  switch (params["panel"]) {
    case "generatePassword":
      Port.raw.onMessage.addListener(function(m) {
        KeeLog.debug("In iframe script, received message from background script");
        if (m.initialState) {
          try {
            const piniaInstance = createPinia();
            vueApp = createApp({
              render: () => h(Panel, {})
            });
            const vuetify = createVuetify({
              components,
              directives,
              theme: {
                defaultTheme: darkTheme ? "dark" : "light",
                themes: {
                  dark: {
                    dark: true,
                    colors: {
                      primary: "#1a466b",
                      secondary: "#ABB2BF",
                      tertiary: "#e66a2b",
                      error: "#C34034",
                      info: "#2196F3",
                      success: "#4CAF50",
                      warning: "#FFC107"
                    }
                  },
                  light: {
                    dark: false,
                    colors: {
                      primary: "#1a466b",
                      secondary: "#13334e",
                      tertiary: "#e66a2b",
                      error: "#C34034",
                      info: "#2196F3",
                      success: "#4CAF50",
                      warning: "#FFC107"
                    }
                  }
                }
              }
            });
            piniaInstance.use(IPCPiniaPlugin);
            vueApp.use(vuetify);
            vueApp.use(piniaInstance);
            vueApp.config.globalProperties.$browser = browser;
            vueApp.config.globalProperties.$i18n = browserPolyfillExports.i18n.getMessage;
            store = useStore();
            store.$patch(m.initialState);
            vueApp.mount("#main");
            Port.postMessage({
              action: Action.GetPasswordProfiles
            });
          } catch (e) {
            KeeLog.error("Failed to create user interface.", e);
          }
        }
        if (m.mutation) {
          store.onRemoteMessage(Port.raw, m.mutation);
          return;
        }
        if (m.frameState)
          updateFrameState(m.frameState);
      });
      break;
  }
  KeeLog.info("iframe page ready");
}
const params = {};
document.location.search.substr(1).split("&").forEach((pair) => {
  const [key, value] = pair.split("=");
  params[key] = value;
});
const parentFrameId = parseInt(params["parentFrameId"]);
configManager.load(startup);
setup();
