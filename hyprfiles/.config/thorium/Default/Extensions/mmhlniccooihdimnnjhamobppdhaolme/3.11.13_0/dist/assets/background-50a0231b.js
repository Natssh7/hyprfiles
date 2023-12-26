import { b as browserPolyfillExports, $ as $STR, a as $STRF } from "./DollarPolyfills-e1e75c6d.js";
import { K as KeeLog, u as utils, c as configManager, d as deepEqual, p as punycode } from "./ConfigManager-21f0f76b.js";
import { S as SessionType } from "./SessionType-21786bb4.js";
import { E as Entry, D as Database } from "./Database-95399186.js";
import { D as DatabaseSummary, S as SearcherAll } from "./SearcherAll-815f108b.js";
import { A as Action } from "./Mutation-73212a9c.js";
import { c as copyStringToClipboard } from "./copyStringToClipboard-aa1005c2.js";
import { N as NonReactiveStore } from "./NonReactiveStore-e43c786e.js";
const isFirefox = () => {
  var _a;
  return (_a = globalThis.navigator) == null ? void 0 : _a.userAgent.includes("Firefox");
};
class JWT {
  static async verify(sig) {
    const sigParts = sig.split(".");
    if (sigParts.length !== 3) {
      throw new Error("Invalid JWT");
    }
    const claimJSON = window.kee.utils.base64urlDecode(sigParts[1]);
    let claim;
    try {
      claim = JSON.parse(claimJSON);
      if (claim.aud !== "client") {
        return { audience: claim.aud };
      }
    } catch (e) {
      throw new Error("Invalid claim");
    }
    const data = new TextEncoder().encode(sigParts[0] + "." + sigParts[1]).buffer;
    let jwk;
    switch (claim.iss) {
      case "idProd":
        jwk = {
          kty: "EC",
          crv: "P-256",
          x: "O6bWMktjPnOtZAkmz9NzMTO9O2VzuECTa9Jj5g90QSA",
          y: "aIE-8dLpJIoAnLIzH1XDCPxK_asKtIC_fVlSLJyGpcg",
          ext: true
        };
        break;
      case "idBeta":
        jwk = {
          kty: "EC",
          crv: "P-256",
          x: "CinRkFHv6IGNcd52YlzD3BF_WruIMs-6Nn5oI7QmgjU",
          y: "pJ66MRPoCC2MUBFdYyRqGPfw3pZEnPGtHVhvspLTVDA",
          ext: true
        };
        break;
      case "idDev":
        jwk = {
          kty: "EC",
          crv: "P-256",
          x: "mk8--wDgrkPyHttzjQH6jxmjfZS9MaHQ5Qzj53OnNLo",
          y: "XAFQCFwKL7qrV27vI1tug3X2v50grAk_ioieHRe8h18",
          ext: true
        };
        break;
      default:
        throw new Error("Unknown JWT issuer so cannot verify");
    }
    const key = await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        //these are the algorithm options
        name: "ECDSA",
        namedCurve: "P-256"
        //can be "P-256", "P-384", or "P-521"
      },
      false,
      //whether the key is extractable (i.e. can be used in exportKey)
      ["verify"]
      //"verify" for public key import, "sign" for private key imports
    );
    const isValid = await window.crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" }
        //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
      },
      key,
      //from generateKey or importKey above
      window.kee.utils.base64urltoByteArray(sigParts[2]),
      //ArrayBuffer of the signature
      data
      //ArrayBuffer of the data
    );
    if (!isValid) {
      throw new Error("JWT signature did not verify");
    }
    return { claim, audience: claim.aud };
  }
}
class KeeAccount {
  constructor() {
    this._features = [];
  }
  get features() {
    return this._features;
  }
  get featureExpiry() {
    return this._featureExpiry;
  }
  get tokens() {
    return this._tokens;
  }
  async parseJWTs(JWTs) {
    this._tokens = {};
    if (!JWTs || !JWTs.client)
      return;
    const jwt = JWTs.client;
    try {
      const { audience, claim } = await JWT.verify(jwt);
      if (audience === "client") {
        if (claim !== void 0) {
          if (claim.exp > Date.now() - 3600 * 24 * 30 * 1e3) {
            this._features = claim.features;
            this._featureExpiry = claim.featureExpiry;
            this._tokens.client = jwt;
          }
        }
      }
    } catch (e) {
      KeeLog.error("Token error: " + e);
    }
  }
}
class AccountManager {
  async processNewTokens(tokens) {
    await this.account.parseJWTs(tokens);
    this.notify();
  }
  notify() {
    this.listeners.forEach((element) => {
      element();
    });
  }
  addListener(listener) {
    this.listeners.push(listener);
  }
  get features() {
    return this.account.features;
  }
  constructor() {
    this.account = new KeeAccount();
    this.listeners = [];
  }
  featuresValidSecondsAgo(seconds) {
    return this.account.featureExpiry > Date.now() - seconds * 1e3;
  }
  get featureEnabledMultiSessionTypes() {
    return this.account.features.indexOf("multiSession") >= 0 && this.featuresValidSecondsAgo(3600 * 24 * 7);
  }
  get featureEnabledSyncSettings() {
    return this.account.features.indexOf("syncSettings") >= 0 && this.featuresValidSecondsAgo(3600 * 24 * 14);
  }
  get featureEnabledFormAccuracy() {
    return this.account.features.indexOf("formAccuracy") >= 0 && this.featuresValidSecondsAgo(3600 * 24 * 3);
  }
}
var VaultProtocol = /* @__PURE__ */ ((VaultProtocol2) => {
  VaultProtocol2["Teardown"] = "teardown";
  VaultProtocol2["Jsonrpc"] = "jsonrpc";
  VaultProtocol2["Ping"] = "ping";
  VaultProtocol2["Error"] = "error";
  VaultProtocol2["Reconnect"] = "reconnect";
  VaultProtocol2["AckInit"] = "ackinit";
  VaultProtocol2["ShowGenerator"] = "showgenerator";
  return VaultProtocol2;
})(VaultProtocol || {});
class EventSession {
  constructor(sessionId, messageToWebPage) {
    this.sessionId = sessionId;
    this.messageToWebPage = messageToWebPage;
  }
}
class EventSessionManager {
  constructor(onOpen, onClose, onMessage) {
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onMessage = onMessage;
    this.eventActivityTimeout = 3e4;
    this._features = [];
    this.eventActivityTimer = null;
    this.callbacks = {};
  }
  isActive() {
    return !!this.latestSession;
  }
  features() {
    return this.latestSession ? this._features : [];
  }
  registerCallback(requestId, callback) {
    this.callbacks[requestId] = callback;
  }
  invokeCallback(requestId, resultWrapper) {
    if (this.callbacks[requestId] != null)
      this.callbacks[requestId](resultWrapper);
  }
  unregisterCallback(requestId) {
    delete this.callbacks[requestId];
  }
  startSession(sessionId, features, messageToWebPage) {
    KeeLog.debug("Event session starting");
    if (!sessionId) {
      return {
        protocol: VaultProtocol.Error,
        error: {
          code: "SESSION_NOT_SUPPLIED",
          messageParams: ["you must supply a sessionId"]
        }
      };
    }
    if (this.latestSession && this.latestSession.sessionId) {
      if (sessionId === this.latestSession.sessionId) {
        KeeLog.warn("Duplicate session start request received");
        return;
      } else {
        KeeLog.warn(
          "Session start request received while session still active. Destroying old session."
        );
        this.closeSession();
      }
    }
    this.latestSession = new EventSession(sessionId, messageToWebPage);
    this.onOpen(features);
    if (this.isActive()) {
      this._features = features;
      clearTimeout(this.eventActivityTimer);
      this.eventActivityTimer = window.setTimeout(() => {
        this.closeSession();
      }, this.eventActivityTimeout);
      return {
        protocol: VaultProtocol.AckInit
      };
    }
  }
  // We invoke this when our content script receives a message event from the KPRPC server running in a web page.
  // After a few sanity checks relating to the low-level session maintenance
  // (the sort of stuff that the websockets Web API already handles for us with KeePass)
  // we forward the message to the same message handler that is used for the KeePass plugin.
  messageReciever(data) {
    KeeLog.debug("message received");
    if (!data.sessionId) {
      this.sendErrorMessage({
        code: "SESSION_NOT_SUPPLIED",
        messageParams: ["you must supply a sessionId"]
      });
      return;
    }
    if (data.protocol === VaultProtocol.Teardown) {
      this.closeSession();
      return;
    }
    if (!this.latestSession) {
      return {
        protocol: VaultProtocol.Error,
        error: {
          code: "SESSION_MISSING",
          messageParams: ["Session not initialised or has timed out"]
        }
      };
    }
    if (data.sessionId != this.latestSession.sessionId) {
      this.sendErrorMessage({
        code: "SESSION_MISMATCH",
        messageParams: [
          "Already attached to a session (maybe in a different tab). Reinitialisation required."
        ]
      });
      return {
        protocol: VaultProtocol.Error,
        error: {
          code: "SESSION_MISMATCH",
          messageParams: [
            "Already attached to a session (maybe in a different tab). Reinitialisation required."
          ]
        }
      };
    }
    clearTimeout(this.eventActivityTimer);
    this.eventActivityTimer = window.setTimeout(() => {
      this.closeSession();
    }, this.eventActivityTimeout);
    if (data.protocol === VaultProtocol.Ping)
      return;
    if (data.protocol === VaultProtocol.Jsonrpc) {
      data.encryptionNotRequired = true;
      this.onMessage(data);
    }
  }
  sendErrorMessage(error) {
    if (!this.latestSession) {
      KeeLog.error("Server session went away.");
      throw new Error("Server session went away.");
    }
    this.latestSession.messageToWebPage({
      error,
      protocol: VaultProtocol.Error
    });
  }
  sendMessage(msg) {
    if (!this.latestSession) {
      KeeLog.error("Server session went away.");
      throw new Error("Server session went away.");
    }
    this.latestSession.messageToWebPage(msg);
  }
  closeSession() {
    KeeLog.debug("Closing event session");
    clearTimeout(this.eventActivityTimer);
    this.latestSession = null;
    this._features = [];
    this.callbacks = {};
    window.kee.configSyncManager.reset();
    this.onClose();
  }
}
class SRPc {
  constructor() {
    const Nstr = "d4c7f8a2b32c11b8fba9581ec4ba4f1b04215642ef7355e37c0fc0443ef756ea2c6b8eeb755a1c723027663caa265ef785b8ff6a9b35227a52d86633dbdfca43";
    this.N = BigInteger.parse(Nstr, 16);
    this.g = new BigInteger("2");
    this.k = BigInteger.parse("b7867f1299da8cc24ab93e08986ebc4d6a478ad0", 16);
    this.a = utils.BigIntFromRandom(32);
    this.A = this.g.modPow(this.a, this.N);
    while (this.A.remainder(this.N) == 0) {
      this.a = utils.BigIntFromRandom(32);
      this.A = this.g.modPow(this.a, this.N);
    }
    this.Astr = this.A.toString(16);
    this.S = null;
    this.K = null;
    this.M = null;
    this.M2 = null;
    this.authenticated = false;
    this.I = null;
    this.p = null;
  }
  setup(username) {
    this.I = username;
  }
  // Receive login salts from the server, promise to start calculations
  receiveSalts(s, Bstr) {
    return this.calculations(s, Bstr, this.p);
  }
  // Calculate S, M, and M2
  calculations(s, ephemeral, pass) {
    const B = BigInteger.parse(ephemeral, 16);
    const Bstr = ephemeral;
    return Promise.all([utils.hash(this.Astr + Bstr), utils.hash(s + pass)]).then((digests) => {
      const u = BigInteger.parse(digests[0], 16);
      const x = BigInteger.parse(digests[1], 16);
      const kgx = this.k.multiply(this.g.modPow(x, this.N));
      const aux = this.a.add(u.multiply(x));
      this.S = B.subtract(kgx).modPow(aux, this.N);
      const Mstr = this.A.toString(16) + B.toString(16) + this.S.toString(16);
      return utils.hash(Mstr);
    }).then((digest) => {
      this.M = digest;
      return utils.hash(this.A.toString(16) + this.M + this.S.toString(16));
    }).then((digest) => {
      this.M2 = digest;
    });
  }
  // Receive M2 from the server and verify it
  confirmAuthentication(M2server) {
    if (M2server.toLowerCase() == this.M2.toLowerCase()) {
      this.authenticated = true;
      this.success();
    } else
      KeeLog.error("Server key does not match");
  }
  success() {
    return;
  }
  // When someone wants to use the session key for encrypting traffic, they can
  // access the key with this function. It's a deferred calculation to reduce impact
  // of DOS attacks (which would generally fail the connection attempt before getting this far)
  key() {
    if (this.K == null) {
      if (this.authenticated) {
        return utils.hash(this.S.toString(16)).then((digest) => {
          this.K = digest.toLowerCase();
          return this.K;
        });
      } else {
        KeeLog.error("User has not been authenticated.");
        return Promise.resolve(null);
      }
    } else {
      return Promise.resolve(this.K);
    }
  }
}
class WebsocketSessionManager {
  constructor(onOpening, onOpen, onClose, onMessage, isKPRPCAuthorised) {
    this._features = [];
    this.onOpening = onOpening;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onMessage = onMessage;
    this.isKPRPCAuthorised = isKPRPCAuthorised;
    this.reconnectionAttemptFrequency = 2e3;
    this.connectLock = false;
    this.wasEverOpen = false;
    this.webSocketHost = "127.0.0.1";
    this.webSocket = null;
    this._reconnectTimer = null;
    this.connectionProhibitedUntil = /* @__PURE__ */ new Date(0);
    this.speculativeWebSocketAttemptProhibitedUntil = /* @__PURE__ */ new Date(0);
    this.callbacks = {};
  }
  isActive() {
    return this.webSocket !== void 0 && this.webSocket !== null && this.webSocket.readyState == WebSocket.OPEN && this.isKPRPCAuthorised();
  }
  features() {
    return this.isActive() ? this._features : [];
  }
  setClaimedFeatures(features) {
    this._features = features;
  }
  registerCallback(requestId, callback) {
    this.callbacks[requestId] = callback;
  }
  invokeCallback(requestId, resultWrapper) {
    if (this.callbacks[requestId] != null)
      this.callbacks[requestId](resultWrapper);
  }
  unregisterCallback(requestId) {
    delete this.callbacks[requestId];
  }
  startup() {
    this.pendingPortChange = null;
    browserPolyfillExports.runtime.onMessage.addListener((request) => {
      if (request.action !== "KPRPC_Port_Change")
        return;
      if (this.pendingPortChange != null) {
        clearTimeout(this.pendingPortChange);
      }
      this.pendingPortChange = window.setTimeout(() => {
        this.configureConnectionURIs();
        if (this.webSocket !== void 0 && this.webSocket !== null && this.webSocket.readyState != WebSocket.CLOSED) {
          this.webSocket.close();
        }
      }, 1e3);
    });
    this.configureConnectionURIs();
    this._reconnectTimer = window.setInterval(
      this.attemptConnection.bind(this),
      this.reconnectionAttemptFrequency
    );
    KeeLog.debug("Created an HTTP/ws reconnection timer.");
  }
  configureConnectionURIs() {
    const defaultWebSocketPort = 12546;
    this.webSocketPort = configManager.current.KeePassRPCWebSocketPort;
    if (this.webSocketPort <= 0 || this.webSocketPort > 65535 || this.webSocketPort == 19455) {
      configManager.current.KeePassRPCWebSocketPort = defaultWebSocketPort;
      configManager.save();
      this.webSocketPort = defaultWebSocketPort;
    }
    this.webSocketURI = "ws://" + this.webSocketHost + ":" + this.webSocketPort;
    this.httpChannelURI = "http://" + this.webSocketHost + ":" + this.webSocketPort;
  }
  tryToconnectToWebsocket() {
    KeeLog.debug("Attempting to connect to RPC server webSocket.");
    const connectResult = this.connect();
    if (connectResult == "alive")
      KeeLog.debug("Connection already established.");
    if (connectResult == "locked")
      KeeLog.debug("Connection attempt already underway.");
  }
  httpConnectionAttemptCallback() {
    this._webSocketTimer = window.setTimeout(this.tryToconnectToWebsocket.bind(this), 100);
  }
  // Initiates a connection to the KPRPC server.
  connect() {
    const _this = this;
    if (this.connectLock)
      return "locked";
    if (this.webSocket !== void 0 && this.webSocket !== null && this.webSocket.readyState == WebSocket.OPEN) {
      return "alive";
    }
    if (this.connectionProhibitedUntil.getTime() > (/* @__PURE__ */ new Date()).getTime())
      return "locked";
    if (!this.onOpening())
      return "locked";
    KeeLog.debug("Trying to open a webSocket connection");
    this.connectLock = true;
    this.wasEverOpen = false;
    try {
      this.webSocket = new WebSocket(this.webSocketURI);
    } catch (ex) {
      this.connectLock = false;
      return;
    }
    this.webSocket.onopen = function() {
      KeeLog.info("Websocket connection opened");
      _this.connectLock = false;
      _this.wasEverOpen = true;
      _this.onOpen();
    };
    this.webSocket.onmessage = function(event) {
      KeeLog.debug("received message from web socket");
      const obj = JSON.parse(event.data);
      if (!obj) {
        KeeLog.error("received bad message from web socket. Can't parse from JSON.");
        return;
      }
      _this.onMessage(obj);
    };
    this.webSocket.onerror = function() {
      if (_this.wasEverOpen) {
        KeeLog.debug("Websocket connection error");
      }
      _this.connectLock = false;
    };
    this.webSocket.onclose = function() {
      if (_this.wasEverOpen) {
        _this.wasEverOpen = false;
        _this.onCloseSession();
        KeeLog.debug("Websocket connection closed");
      }
    };
  }
  closeSession() {
    if (this.webSocket)
      this.webSocket.close();
  }
  onCloseSession() {
    this.callbacks = {};
    this.onClose();
  }
  attemptConnection() {
    const rpc = this;
    if (rpc.connectLock)
      return;
    if (rpc.webSocket !== void 0 && rpc.webSocket !== null && rpc.webSocket.readyState != WebSocket.CLOSED) {
      return;
    }
    if (rpc.connectionProhibitedUntil.getTime() > (/* @__PURE__ */ new Date()).getTime())
      return;
    if ((/* @__PURE__ */ new Date()).getTime() > rpc.speculativeWebSocketAttemptProhibitedUntil.getTime()) {
      KeeLog.debug("Speculatively trying to open a webSocket connection");
      rpc.speculativeWebSocketAttemptProhibitedUntil = /* @__PURE__ */ new Date();
      rpc.speculativeWebSocketAttemptProhibitedUntil.setTime(
        rpc.speculativeWebSocketAttemptProhibitedUntil.getTime() + 73e3
      );
      rpc.httpConnectionAttemptCallback();
    } else {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", rpc.httpChannelURI, true);
      xhr.timeout = 750;
      xhr.onerror = function() {
        KeeLog.debug(
          "HTTP connection did not timeout. We will now attempt a web socket connection."
        );
        rpc.httpConnectionAttemptCallback();
      };
      xhr.ontimeout = function() {
        KeeLog.debug("HTTP connection timed out. Will not attempt web socket connection.");
      };
      xhr.onabort = function() {
        KeeLog.warn("HTTP connection aborted. Will not attempt web socket connection.");
      };
      xhr.send();
    }
  }
  sendMessage(data) {
    try {
      this.webSocket.send(data);
    } catch (ex) {
      KeeLog.error(
        "Failed to send a websocket message. Exception details: " + ex + ", stack: " + ex.stack
      );
    }
  }
}
class FeatureFlags {
}
FeatureFlags.offered = [
  // Full feature set as of KeeFox 1.6
  "KPRPC_FEATURE_VERSION_1_6",
  // Trivial example showing how we've added a new client feature
  "KPRPC_FEATURE_WARN_USER_WHEN_FEATURE_MISSING",
  // This version can communicate with a browser-hosted server
  "KPRPC_FEATURE_BROWSER_HOSTED",
  // Sync settings across multiple browsers and devices
  "BROWSER_SETTINGS_SYNC"
  // in the rare event that we want to check for the absense of a feature
  // we would add a feature flag along the lines of "KPRPC_FEATURE_REMOVED_INCOMPATIBLE_THING_X"
];
FeatureFlags.required = [
  // Full feature set as of KeeFox 1.6
  "KPRPC_FEATURE_VERSION_1_6",
  // Allow clients without the name KeeFox to connect
  "KPRPC_GENERAL_CLIENTS",
  // Require the security fix released on 29th July 2020
  "KPRPC_SECURITY_FIX_20200729"
];
class KeeNotification {
  constructor(name, buttons, id, messages, priority) {
    this.name = name;
    this.buttons = buttons;
    this.id = id;
    this.messages = messages;
    this.priority = priority;
  }
}
class SessionResponseManager {
  constructor(responsesRequired) {
    this.responsesRequired = responsesRequired;
    this.responses = [];
    this.pendingResponses = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
  onResponse(sessionType, resultWrapper, features) {
    this.responses.push({ sessionType, resultWrapper, features });
    if (this.responses.length === this.responsesRequired) {
      this.resolve(this.responses);
    }
  }
}
class kprpcClient {
  constructor(store) {
    this.nextRequestId = 1;
    this.clientVersion = [2, 0, 0];
    this.srpClientInternals = null;
    this.secretKey = null;
    this.eventSessionManager = new EventSessionManager(
      (features) => this.setupEventSession(features),
      () => this.onEventSessionClosed(),
      (obj) => this.receive(obj, this.eventSessionManager)
    );
    this.websocketSessionManager = new WebsocketSessionManager(
      () => window.kee.accountManager.featureEnabledMultiSessionTypes || !this.eventSessionManager.isActive(),
      () => this.setupWebsocketSession(),
      () => this.onWebsocketSessionClosed(),
      (obj) => this.receive(obj, this.websocketSessionManager),
      () => !!this.secretKey
    );
    this.store = store;
  }
  startWebsocketSessionManager() {
    this.websocketSessionManager.startup();
  }
  startEventSession(sessionId, features, messageToWebPage) {
    return this.eventSessionManager.startSession(sessionId, features, messageToWebPage);
  }
  eventSessionMessageFromPage(data) {
    return this.eventSessionManager.messageReciever(data);
  }
  getSessionManagerByType(sessionType) {
    return sessionType === SessionType.Event ? this.eventSessionManager : this.websocketSessionManager;
  }
  getPrimarySessionManager() {
    if (this.eventSessionManager.isActive())
      return this.eventSessionManager;
    else if (this.websocketSessionManager.isActive())
      return this.websocketSessionManager;
    else
      return null;
  }
  getManagersForActiveSessions() {
    const activeSessions = [];
    if (this.eventSessionManager.isActive())
      activeSessions.push(this.eventSessionManager);
    if (this.websocketSessionManager.isActive()) {
      activeSessions.push(this.websocketSessionManager);
    }
    return activeSessions;
  }
  // Each request (uniquely identified by the requestId) may be distributed to one or more servers.
  request(sessionManagers, method, params) {
    const requestId = ++this.nextRequestId;
    const data = JSON.stringify({
      jsonrpc: "2.0",
      params,
      method,
      id: requestId
    });
    KeeLog.debug("Sending a JSON-RPC request");
    const responseManager = new SessionResponseManager(sessionManagers.length);
    for (const sessionManager of sessionManagers) {
      try {
        if (sessionManager instanceof EventSessionManager) {
          this.eventSessionManager.registerCallback(
            requestId,
            (resultWrapper) => responseManager.onResponse(
              SessionType.Event,
              resultWrapper,
              sessionManager.features()
            )
          );
          this.sendJSONRPCUnencrypted(data);
        } else {
          if (typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined") {
            this.websocketSessionManager.registerCallback(
              requestId,
              (resultWrapper) => responseManager.onResponse(
                SessionType.Websocket,
                resultWrapper,
                sessionManager.features()
              )
            );
            this.encrypt(data, this.sendJSONRPCEncrypted);
          }
        }
      } catch (ex) {
        KeeLog.warn(
          "JSON-RPC request could not be sent. Expect an async error soon. Exception: " + ex.message + ":" + ex.stack
        );
        window.setTimeout(() => {
          this.processJSONRPCresponse(
            {
              id: requestId,
              error: {
                message: "Send failure. Maybe the server went away?"
              },
              message: "error"
            },
            sessionManager
          );
        }, 50);
      }
    }
    return responseManager.pendingResponses;
  }
  // interpret the message from the RPC server
  evalJson(method, params) {
    let data = JSON.stringify(params);
    KeeLog.debug("Evaluating a JSON-RPC object we just received");
    if (data) {
      data = data.match(/\s*\[(.*)\]\s*/)[1];
    }
    if (method == "KPRPCListener" || method == "callBackToKeeFoxJS")
      this.KPRPCListener(data);
  }
  KPRPCListener(signal) {
    window.setTimeout(function() {
      window.kee.KPRPCListener(signal);
    }, 5);
  }
  sendJSONRPCEncrypted(encryptedContainer) {
    const data2server = {
      protocol: VaultProtocol.Jsonrpc,
      srp: null,
      key: null,
      error: null,
      jsonrpc: encryptedContainer,
      version: utils.versionAsInt(this.clientVersion)
    };
    this.websocketSessionManager.sendMessage(JSON.stringify(data2server));
  }
  sendJSONRPCUnencrypted(json) {
    const data2server = {
      protocol: VaultProtocol.Jsonrpc,
      srp: null,
      key: null,
      error: null,
      jsonrpc: json,
      encryptionNotRequired: true,
      version: utils.versionAsInt(this.clientVersion)
    };
    this.eventSessionManager.sendMessage(data2server);
  }
  // After the current connection has been closed we reset those variables
  // that are shared at the moment (e.g. secret key + authenticated status)
  // and notify Kee Vault that it can try to connect now (if applicable)
  onWebsocketSessionClosed() {
    this.srpClientInternals = null;
    this.secretKey = null;
    if (!this.eventSessionManager.isActive()) {
      window.kee._pauseKee();
      window.kee.inviteKeeVaultConnection();
    } else {
      window.kee._refreshKPDB();
    }
  }
  onEventSessionClosed() {
    if (!this.websocketSessionManager.isActive()) {
      window.kee._pauseKee();
    } else {
      window.kee._refreshKPDB();
    }
  }
  // data = JSON (underlying network/transport layer must have already formed incoming message(s) into JSON objects)
  receive(data, sessionManager) {
    if (data === void 0 || data === null)
      return;
    if (data.protocol === void 0 || data.protocol === null)
      return;
    switch (data.protocol) {
      case "setup":
        this.receiveSetup(data);
        break;
      case "jsonrpc":
        this.receiveJSONRPC(data);
        break;
      case "error":
        if (data.error) {
          const extra = [];
          if (data.error.messageParams && data.error.messageParams.length >= 1) {
            extra[0] = data.error.messageParams[0];
          }
          if (data.error.code == "VERSION_CLIENT_TOO_LOW") {
            KeeLog.error(
              $STR("conn_setup_client_features_missing") + " Extra info: " + extra
            );
            this.store.updateLatestConnectionError("VERSION_CLIENT_TOO_LOW");
            this.showConnectionMessage($STR("conn_setup_client_features_missing"));
          } else if (data.error.code == "UNRECOGNISED_PROTOCOL") {
            KeeLog.error(
              $STR("conn_unknown_protocol") + " " + $STRF("further_info_may_follow", extra)
            );
            this.store.updateLatestConnectionError("UNRECOGNISED_PROTOCOL");
          } else if (data.error.code == "INVALID_MESSAGE") {
            KeeLog.error(
              $STR("conn_invalid_message") + " " + $STRF("further_info_may_follow", extra)
            );
            this.store.updateLatestConnectionError("INVALID_MESSAGE");
          } else if (data.error.code == "AUTH_RESTART") {
            KeeLog.error(
              $STR("conn_setup_restart") + " " + $STRF("further_info_may_follow", extra)
            );
            this.store.updateLatestConnectionError("AUTH_RESTART");
            this.removeStoredKey(this.getUsername(this.getSecurityLevel()));
            this.showConnectionMessage(
              $STR("conn_setup_restart") + " " + $STR("conn_setup_retype_password")
            );
          } else {
            KeeLog.error(
              $STR("conn_unknown_error") + " " + $STRF("further_info_may_follow", extra)
            );
            this.store.updateLatestConnectionError("UNKNOWN_JSONRPC");
            this.showConnectionMessage(
              $STR("conn_unknown_error") + " " + $STRF("further_info_may_follow", ["See Kee log"])
            );
          }
        }
        sessionManager.closeSession();
        break;
      default:
        return;
    }
  }
  receiveSetup(data) {
    if (data.protocol != "setup")
      return;
    if (data.error) {
      const extra = [];
      if (data.error.messageParams && data.error.messageParams.length >= 1) {
        extra[0] = data.error.messageParams[0];
      }
      switch (data.error.code) {
        case "AUTH_CLIENT_SECURITY_LEVEL_TOO_LOW": {
          KeeLog.warn($STR("conn_setup_client_sl_low"));
          this.store.updateLatestConnectionError(
            "AUTH_CLIENT_SECURITY_LEVEL_TOO_LOW"
          );
          const button = {
            label: $STR("conn_setup_client_sl_low_resolution"),
            action: "enableHighSecurityKPRPCConnection"
          };
          this.showConnectionMessage($STR("conn_setup_client_sl_low"), [button]);
          break;
        }
        case "AUTH_FAILED": {
          KeeLog.warn(
            $STR("conn_setup_failed") + " " + $STRF("further_info_may_follow", extra)
          );
          this.store.updateLatestConnectionError("AUTH_FAILED");
          this.showConnectionMessage(
            $STR("conn_setup_failed") + " " + $STR("conn_setup_retype_password")
          );
          this.removeStoredKey(this.getUsername(this.getSecurityLevel()));
          break;
        }
        case "AUTH_RESTART": {
          KeeLog.warn(
            $STR("conn_setup_restart") + " " + $STRF("further_info_may_follow", extra)
          );
          this.store.updateLatestConnectionError("AUTH_RESTART");
          this.removeStoredKey(this.getUsername(this.getSecurityLevel()));
          this.showConnectionMessage(
            $STR("conn_setup_restart") + " " + $STR("conn_setup_retype_password")
          );
          break;
        }
        case "AUTH_EXPIRED": {
          KeeLog.warn($STRF("conn_setup_expired", extra));
          this.store.updateLatestConnectionError("AUTH_EXPIRED");
          this.removeStoredKey(this.getUsername(this.getSecurityLevel()));
          this.showConnectionMessage(
            $STR("conn_setup_expired") + " " + $STR("conn_setup_retype_password")
          );
          break;
        }
        case "AUTH_INVALID_PARAM": {
          KeeLog.error($STRF("conn_setup_invalid_param", extra));
          this.store.updateLatestConnectionError("AUTH_INVALID_PARAM");
          break;
        }
        case "AUTH_MISSING_PARAM": {
          KeeLog.error($STRF("conn_setup_missing_param", extra));
          this.store.updateLatestConnectionError("AUTH_MISSING_PARAM");
          break;
        }
        default: {
          KeeLog.error(
            $STR("conn_unknown_error") + " " + $STRF("further_info_may_follow", extra)
          );
          this.store.updateLatestConnectionError("UNKNOWN_SETUP");
          this.showConnectionMessage(
            $STR("conn_unknown_error") + " " + $STRF("further_info_may_follow", ["See Kee log"])
          );
          break;
        }
      }
      this.websocketSessionManager.closeSession();
      return;
    }
    if (data.srp && data.srp.stage === "identifyToClient" || data.key && data.key.sc) {
      if (!this.serverHasRequiredFeatures(data.features)) {
        KeeLog.error(
          $STRF("conn_setup_server_features_missing", [
            "https://www.kee.pm/upgrade-kprpc"
          ])
        );
        this.store.updateLatestConnectionError("VERSION_CLIENT_TOO_HIGH");
        const button = {
          label: $STR("upgrade_kee"),
          action: "loadUrlUpgradeKee"
        };
        this.showConnectionMessage(
          $STRF("conn_setup_server_features_missing", [
            "https://www.kee.pm/upgrade-kprpc"
          ]),
          [button]
        );
        this.websocketSessionManager.closeSession();
        return;
      }
      this.websocketSessionManager.setClaimedFeatures(data.features);
    }
    if (data.key !== void 0 && data.key !== null) {
      if (this.checkServerSecurityLevel(data.key.securityLevel)) {
        if (data.key.sc) {
          this.keyChallengeResponse1(data);
        } else if (data.key.sr) {
          this.keyChallengeResponse2(data);
        }
      } else {
        KeeLog.warn(
          $STRF("conn_setup_server_sl_low", [
            this.getSecurityLevelServerMinimum().toString()
          ])
        );
        this.store.updateLatestConnectionError("AUTH_SERVER_SECURITY_LEVEL_TOO_LOW");
        this.sendWebsocketsError("AUTH_SERVER_SECURITY_LEVEL_TOO_LOW", [
          this.getSecurityLevelServerMinimum()
        ]);
        this.showConnectionMessage(
          $STRF("conn_setup_server_sl_low", [
            this.getSecurityLevelServerMinimum().toString()
          ])
        );
      }
    }
    if (data.srp !== void 0 && data.srp !== null) {
      if (this.checkServerSecurityLevel(data.srp.securityLevel)) {
        switch (data.srp.stage) {
          case "identifyToClient":
            this.getSideChannelPassword(data);
            break;
          case "proofToClient":
            this.proofToClient(data);
            break;
          default:
            return;
        }
      } else {
        KeeLog.warn(
          $STRF("conn_setup_server_sl_low", [
            this.getSecurityLevelServerMinimum().toString()
          ])
        );
        this.store.updateLatestConnectionError("AUTH_SERVER_SECURITY_LEVEL_TOO_LOW");
        this.sendWebsocketsError("AUTH_SERVER_SECURITY_LEVEL_TOO_LOW", [
          this.getSecurityLevelServerMinimum()
        ]);
        this.showConnectionMessage(
          $STRF("conn_setup_server_sl_low", [
            this.getSecurityLevelServerMinimum().toString()
          ])
        );
      }
    }
  }
  sendWebsocketsError(errCode, errParams) {
    const data2server = {
      protocol: "setup",
      srp: null,
      key: null,
      error: {
        code: errCode,
        params: errParams
      },
      version: utils.versionAsInt(this.clientVersion)
    };
    this.websocketSessionManager.sendMessage(JSON.stringify(data2server));
  }
  serverHasRequiredFeatures(features) {
    if (!features || !FeatureFlags.required.every(function(feature) {
      return features.indexOf(feature) !== -1;
    })) {
      return false;
    }
    return true;
  }
  checkServerSecurityLevel(serverSecurityLevel) {
    if (serverSecurityLevel >= this.getSecurityLevelServerMinimum())
      return true;
    return false;
  }
  keyChallengeResponse1(data) {
    this.keyChallengeParams = {
      sc: data.key.sc,
      cc: utils.BigIntFromRandom(32).toString(16).toLowerCase()
    };
    utils.hash(
      "1" + this.getStoredKey() + this.keyChallengeParams.sc + this.keyChallengeParams.cc
    ).then((digest) => {
      const cr = digest.toLowerCase();
      const data2server = {
        protocol: "setup",
        key: {
          cc: this.keyChallengeParams.cc,
          cr,
          securityLevel: this.getSecurityLevel()
        },
        version: utils.versionAsInt(this.clientVersion)
      };
      this.websocketSessionManager.sendMessage(JSON.stringify(data2server));
    });
  }
  keyChallengeResponse2(data) {
    utils.hash(
      "0" + this.getStoredKey() + this.keyChallengeParams.sc + this.keyChallengeParams.cc
    ).then((digest) => {
      const sr = digest.toLowerCase();
      if (sr != data.key.sr) {
        KeeLog.warn($STR("conn_setup_failed"));
        this.store.updateLatestConnectionError("CHALLENGE_RESPONSE_MISMATCH");
        this.showConnectionMessage(
          $STR("conn_setup_failed") + " " + $STR("conn_setup_retype_password")
        );
        this.removeStoredKey(this.getUsername(this.getSecurityLevel()));
        this.websocketSessionManager.closeSession();
        return;
      } else {
        this.secretKey = this.getStoredKey();
        window.setTimeout(this.onConnectStartup.bind(this), 50, "CR");
      }
    });
  }
  async getSideChannelPassword(data) {
    const s = data.srp.s;
    const B = data.srp.B;
    const _this = this;
    const vaultTabs = await browserPolyfillExports.tabs.query({
      url: ["https://keevault.pm/*", "https://app-beta.kee.pm/*", "https://app-dev.kee.pm/*"]
    });
    function handleMessage(request) {
      if (request.action !== "SRP_ok")
        return;
      _this.identifyToClient(request.password, s, B);
      browserPolyfillExports.runtime.onMessage.removeListener(handleMessage);
    }
    browserPolyfillExports.runtime.onMessage.addListener(handleMessage);
    const createData = {
      url: "/dist/dialogs/SRP.html",
      active: !(vaultTabs && vaultTabs[0] && vaultTabs[0].active)
    };
    const tab = await browserPolyfillExports.tabs.create(createData);
    browserPolyfillExports.windows.update(tab.windowId, { focused: true, drawAttention: true });
  }
  identifyToClient(password, s, B) {
    this.srpClientInternals.p = password;
    this.srpClientInternals.receiveSalts(s, B).then(() => {
      const data2server = {
        protocol: "setup",
        srp: {
          stage: "proofToServer",
          M: this.srpClientInternals.M,
          securityLevel: this.getSecurityLevel()
        },
        version: utils.versionAsInt(this.clientVersion)
      };
      this.websocketSessionManager.sendMessage(JSON.stringify(data2server));
    });
  }
  proofToClient(data) {
    this.srpClientInternals.confirmAuthentication(data.srp.M2);
    if (!this.srpClientInternals.authenticated) {
      KeeLog.warn($STR("conn_setup_failed"));
      this.store.updateLatestConnectionError("SRP_AUTH_FAILURE");
      this.showConnectionMessage(
        $STR("conn_setup_failed") + " " + $STR("conn_setup_retype_password")
      );
      this.removeStoredKey(this.getUsername(this.getSecurityLevel()));
      this.websocketSessionManager.closeSession();
      return;
    } else {
      this.srpClientInternals.key().then((key) => {
        if (!key)
          return;
        this.secretKey = key;
        this.setStoredKey(this.srpClientInternals.I, this.getSecurityLevel(), key);
        window.setTimeout(this.onConnectStartup.bind(this), 50, "SRP");
      });
    }
  }
  onConnectStartup() {
    window.kee.removeUserNotifications(
      (notification) => notification.name != "kee-connection-message"
    );
    this.store.updateLatestConnectionError("");
    window.kee._refreshKPDB();
  }
  // No need to return anything from this function so sync or async implementation is fine
  receiveJSONRPC(data) {
    if (data.encryptionNotRequired) {
      this.receiveJSONRPCUnencrypted(data.jsonrpc);
    } else {
      if (typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined") {
        this.decrypt(data.jsonrpc, this.receiveJSONRPCDecrypted);
        return;
      }
      throw new Error("Webcrypto required but disabled or broken");
    }
  }
  receiveJSONRPCUnencrypted(data) {
    if (data === null)
      return;
    const obj = JSON.parse(data);
    if (!obj)
      return;
    this.processJSONRPCresponse(obj, this.eventSessionManager);
  }
  receiveJSONRPCDecrypted(data) {
    if (data === null) {
      return;
    }
    const obj = JSON.parse(data);
    if (!obj)
      return;
    this.processJSONRPCresponse(obj, this.websocketSessionManager);
  }
  processJSONRPCresponse(obj, sessionManager) {
    const sessionType = sessionManager instanceof EventSessionManager ? SessionType.Event : SessionType.Websocket;
    if ("result" in obj && obj.result !== false) {
      try {
        sessionManager.invokeCallback(obj.id, obj);
        sessionManager.unregisterCallback(obj.id);
      } catch (e) {
        sessionManager.unregisterCallback(obj.id);
        KeeLog.warn(
          "[" + sessionType + "] An error occurred when processing the result callback for JSON-RPC object id " + obj.id + ": " + e
        );
      }
    } else if ("error" in obj) {
      try {
        KeeLog.error(
          "[" + sessionType + "] An error occurred in KeePassRPC object id: " + obj.id + " with this message: " + obj.message + " and this error: " + obj.error + " and this error message: " + obj.error.message
        );
        sessionManager.invokeCallback(obj.id, obj);
        sessionManager.unregisterCallback(obj.id);
      } catch (e) {
        sessionManager.unregisterCallback(obj.id);
        KeeLog.warn(
          "[" + sessionType + "] An error occurred when processing the error callback for JSON-RPC object id " + obj.id + ": " + e
        );
      }
    } else if ("method" in obj) {
      const result = { id: obj.id };
      try {
        result.result = this.evalJson(obj.method, obj.params);
        if (!result.result)
          result.result = null;
      } catch (e) {
        result.error = e;
        KeeLog.error(
          "[" + sessionType + "] An error occurred when processing a JSON-RPC request: " + e
        );
      }
    } else if (!("id" in obj)) {
      KeeLog.error("[" + sessionType + "] Unexpected error processing receiveJSONRPC");
    }
  }
  setupEventSession(features) {
    if (!window.kee.accountManager.featureEnabledMultiSessionTypes && this.websocketSessionManager.isActive()) {
      KeeLog.debug(
        "Session activation aborted: Existing session already active and account does not have the multiple sessions feature."
      );
      this.eventSessionManager.closeSession();
      return;
    }
    if (!this.serverHasRequiredFeatures(features)) {
      KeeLog.error(
        "eventSession: " + $STRF("conn_setup_server_features_missing", [
          "https://www.kee.pm/upgrade-kprpc"
        ])
      );
      this.store.updateLatestConnectionError("VERSION_CLIENT_TOO_HIGH");
      const button = {
        label: $STR("upgrade_kee"),
        action: "loadUrlUpgradeKee"
      };
      this.showConnectionMessage(
        $STRF("conn_setup_server_features_missing", ["https://www.kee.pm/upgrade-kprpc"]),
        [button]
      );
      this.eventSessionManager.closeSession();
      return;
    }
    this.onConnectStartup();
  }
  setupWebsocketSession() {
    if (!window.kee.accountManager.featureEnabledMultiSessionTypes && this.eventSessionManager.isActive()) {
      KeeLog.debug(
        "Session activation aborted: Existing session already active and account does not have the multiple sessions feature."
      );
      this.websocketSessionManager.closeSession();
      return;
    }
    try {
      let setupKey = null;
      let setupSRP = null;
      const securityLevel = this.getSecurityLevel();
      const username = this.getUsername(securityLevel);
      const storedKey = this.getStoredKey(username, securityLevel);
      if (storedKey) {
        setupKey = {
          username,
          securityLevel
        };
      } else {
        this.srpClientInternals = new SRPc();
        this.srpClientInternals.setup(username);
        setupSRP = {
          stage: "identifyToServer",
          I: this.srpClientInternals.I,
          A: this.srpClientInternals.Astr,
          securityLevel
        };
      }
      const data2server = {
        protocol: "setup",
        srp: setupSRP,
        key: setupKey,
        version: utils.versionAsInt(this.clientVersion),
        features: FeatureFlags.offered,
        // these parameters allows KPRPC to identify which type of client is making
        // this request. We can't trust it but it can help the user to understand what's going on.
        clientTypeId: "keefox",
        clientDisplayName: "Kee",
        clientDisplayDescription: $STR("conn_display_description")
      };
      this.websocketSessionManager.sendMessage(JSON.stringify(data2server));
    } catch (ex) {
      KeeLog.warn(
        "An attempt to setup the KPRPC secure channel has failed. It will not be retried for at least 10 seconds. If you see this message regularly and are not sure why, please ask on the help forum. Technical detail about the problem follows: " + ex
      );
      this.websocketSessionManager.connectionProhibitedUntil = /* @__PURE__ */ new Date();
      this.websocketSessionManager.connectionProhibitedUntil.setTime(
        this.websocketSessionManager.connectionProhibitedUntil.getTime() + 1e4
      );
      this.websocketSessionManager.closeSession();
      KeeLog.debug("Connection state reset ready for next attempt in at least 10 seconds");
    }
  }
  getUsername(securityLevel) {
    let username = "";
    if (securityLevel <= 2 && configManager.current.KPRPCUsername) {
      username = configManager.current.KPRPCUsername;
    }
    if (username.length <= 0) {
      username = utils.newGUID();
      configManager.current.KPRPCUsername = username;
      configManager.save();
    }
    return username;
  }
  getSecurityLevel() {
    return configManager.current.connSLClient;
  }
  getSecurityLevelServerMinimum() {
    return configManager.current.connSLServerMin;
  }
  getStoredKey(username, securityLevel = 0) {
    if (username === void 0) {
      securityLevel = this.getSecurityLevel();
      username = this.getUsername(securityLevel);
    }
    if (securityLevel >= 3 || securityLevel <= 0)
      return null;
    if (securityLevel == 2 || securityLevel == 1) {
      return configManager.current.KPRPCStoredKeys[username];
    }
  }
  setStoredKey(username, securityLevel, key) {
    if (securityLevel >= 3 || securityLevel <= 0)
      return;
    if (securityLevel == 2 || securityLevel == 1) {
      configManager.current.KPRPCStoredKeys[username] = key;
      configManager.save();
    }
  }
  removeStoredKey(username, securityLevel) {
    if (!securityLevel || securityLevel == 2 || securityLevel == 1) {
      configManager.current.KPRPCStoredKeys[username] = "";
      configManager.save();
    }
  }
  // Encrypt plaintext using web crypto api
  encrypt(plaintext, callback) {
    KeeLog.debug("starting webcrypto encryption");
    const KPRPC = this;
    const wc = crypto.subtle;
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const secretKey = this.secretKey;
    const messageAB = utils.stringToByteArray(plaintext);
    const secretKeyAB = utils.hexStringToByteArray(secretKey);
    const typescriptHack = wc.importKey(
      "raw",
      // Exported key format
      secretKeyAB,
      // The exported key
      { name: "AES-CBC", length: 256 },
      // Algorithm the key will be used with
      true,
      // Can extract key value to binary string
      ["encrypt", "decrypt"]
      // Use for these operations
    );
    typescriptHack.then(function(pwKey) {
      const alg = { name: "AES-CBC", iv };
      return wc.encrypt(alg, pwKey, messageAB);
    }).then(function(encrypted) {
      const typescriptHack2 = wc.digest(
        { name: "SHA-1" },
        secretKeyAB
      );
      typescriptHack2.then(function(secretkeyHash) {
        const hmacData = new Uint8Array(20 + encrypted.byteLength + 16);
        const len = hmacData.byteLength;
        hmacData.set(new Uint8Array(secretkeyHash));
        hmacData.set(new Uint8Array(encrypted), 20);
        hmacData.set(iv, encrypted.byteLength + 20);
        utils.hash(hmacData, "base64", "SHA-1").then((ourHMAC) => {
          const ivAB = hmacData.subarray(len - 16);
          const encryptedMessage = {
            message: utils.byteArrayToBase64(encrypted),
            iv: utils.byteArrayToBase64(ivAB),
            hmac: ourHMAC
          };
          const callbackTarget = function(func, data) {
            func(data);
          };
          window.setTimeout(callbackTarget, 1, callback.bind(KPRPC), encryptedMessage);
        });
      }).catch(function(e) {
        KeeLog.error("Failed to calculate HMAC. Exception: " + e);
        callback(null);
      });
    }).catch(function(e) {
      KeeLog.error("Failed to encrypt. Exception: " + e);
      callback(null);
    });
  }
  // Decrypt incoming data from KeePassRPC using AES-CBC and a separate HMAC
  async decrypt(encryptedContainer, callback) {
    KeeLog.debug("starting webcrypto decryption");
    const KPRPC = this;
    let t = (/* @__PURE__ */ new Date()).getTime();
    const wc = crypto.subtle;
    const message = encryptedContainer.message;
    const iv = encryptedContainer.iv;
    const hmac = encryptedContainer.hmac;
    const secretKey = this.secretKey;
    const secretKeyAB = utils.hexStringToByteArray(secretKey);
    const hmacData = utils.base64toByteArrayForHMAC(message, 36);
    const len = hmacData.length;
    const secretkeyHashAB = hmacData.subarray(0, 20);
    const messageAB = hmacData.subarray(20, len - 16);
    const ivAB = hmacData.subarray(len - 16);
    let tn = (/* @__PURE__ */ new Date()).getTime();
    KeeLog.debug("decryption stage 'data prep 1' took: " + (tn - t));
    t = tn;
    try {
      const secretkeyHash = await wc.digest({ name: "SHA-1" }, secretKeyAB);
      tn = (/* @__PURE__ */ new Date()).getTime();
      KeeLog.debug("decryption stage 'key hash' took: " + (tn - t));
      t = tn;
      secretkeyHashAB.set(new Uint8Array(secretkeyHash));
      utils.base64toByteArrayForHMAC(iv, 0, ivAB);
      tn = (/* @__PURE__ */ new Date()).getTime();
      KeeLog.debug("decryption stage 'data prep 2' took: " + (tn - t));
      t = tn;
      const digest = await utils.hash(hmacData, "base64", "SHA-1");
      const ourHMAC = digest;
      tn = (/* @__PURE__ */ new Date()).getTime();
      KeeLog.debug("decryption stage 'generate HMAC' took: " + (tn - t));
      t = tn;
      if (ourHMAC != hmac)
        return;
      try {
        const pwKey = await wc.importKey(
          "raw",
          // Exported key format
          secretKeyAB,
          // The exported key
          { name: "AES-CBC", length: 256 },
          // Algorithm the key will be used with
          true,
          // Can extract key value to binary string
          ["encrypt", "decrypt"]
          // Use for these operations
        );
        tn = (/* @__PURE__ */ new Date()).getTime();
        KeeLog.debug("decryption stage 'import key' took: " + (tn - t));
        t = tn;
        const alg = { name: "AES-CBC", iv: ivAB };
        const decrypted = await wc.decrypt(alg, pwKey, messageAB);
        tn = (/* @__PURE__ */ new Date()).getTime();
        KeeLog.debug("decryption stage 'aes-cbc' took: " + (tn - t));
        t = tn;
        const plainText = new TextDecoder("utf-8").decode(decrypted);
        tn = (/* @__PURE__ */ new Date()).getTime();
        KeeLog.debug("decryption stage 'utf-8 conversion' took: " + (tn - t));
        t = tn;
        const callbackTarget = function(func, data) {
          func(data);
        };
        window.setTimeout(callbackTarget, 1, callback.bind(KPRPC), plainText);
      } catch (e) {
        KeeLog.error("Failed to decrypt. Exception: " + e);
        KeeLog.warn($STR("conn_setup_restart"));
        this.store.updateLatestConnectionError("DECRYPTION_FAILED");
        KPRPC.showConnectionMessage(
          $STR("conn_setup_restart") + " " + $STR("conn_setup_retype_password")
        );
        KPRPC.removeStoredKey(KPRPC.getUsername(KPRPC.getSecurityLevel()));
        KPRPC.websocketSessionManager.closeSession();
        callback(null);
      }
    } catch (e) {
      KeeLog.error("Failed to hash secret key. Exception: " + e);
      KeeLog.warn($STR("conn_setup_restart"));
      this.store.updateLatestConnectionError("SECRET_KEY_HASH_FAILED");
      KPRPC.showConnectionMessage(
        $STR("conn_setup_restart") + " " + $STR("conn_setup_retype_password")
      );
      KPRPC.removeStoredKey(KPRPC.getUsername(KPRPC.getSecurityLevel()));
      KPRPC.websocketSessionManager.closeSession();
      callback(null);
    }
  }
  showConnectionMessage(msg, buttons) {
    window.kee.notifyUser(
      new KeeNotification(
        "kee-connection-message",
        buttons ? buttons : [],
        utils.newGUID(),
        [msg],
        "Medium"
      )
    );
  }
}
class jsonrpcClient {
  constructor(store) {
    this.store = store;
    this.kprpcClient = new kprpcClient(store);
    this.kprpcClient.startWebsocketSessionManager();
  }
  startEventSession(sessionId, features, messageToWebPage) {
    return this.kprpcClient.startEventSession(sessionId, features, messageToWebPage);
  }
  eventSessionMessageFromPage(data) {
    return this.kprpcClient.eventSessionMessageFromPage(data);
  }
  sessionManagerForFilename(dbFileName) {
    const sessionType = this.store.state.KeePassDatabases.find((db) => db.fileName === dbFileName).sessionType;
    return this.kprpcClient.getSessionManagerByType(sessionType);
  }
  sessionManagerForPasswordProfile(profile) {
    const sessionType = this.store.state.PasswordProfiles.find((p) => p.name === profile).sessionType;
    return this.kprpcClient.getSessionManagerByType(sessionType);
  }
  get eventSessionManagerIsActive() {
    return this.kprpcClient.getSessionManagerByType(SessionType.Event).isActive();
  }
  get websocketSessionManagerIsActive() {
    return this.kprpcClient.getSessionManagerByType(SessionType.Websocket).isActive();
  }
  //***************************************
  // Functions below orchestrate requests to one or more KPRPC servers,
  // targeting methods exposed in the KeePassRPC server.
  // See KeePassRPCService.cs for more detail on what each method does.
  //***************************************
  launchGroupEditor(uuid, dbFileName) {
    this.kprpcClient.request(
      [this.sessionManagerForFilename(dbFileName)],
      "LaunchGroupEditor",
      [uuid, dbFileName]
    );
  }
  launchLoginEditor(uuid, dbFileName) {
    this.kprpcClient.request(
      [this.sessionManagerForFilename(dbFileName)],
      "LaunchLoginEditor",
      [uuid, dbFileName]
    );
  }
  selectAndFocusDatabase(vaultFileName, keepassFilename) {
    let sessionManager;
    const smEvent = this.kprpcClient.getSessionManagerByType(SessionType.Event);
    const smWebsocket = this.kprpcClient.getSessionManagerByType(SessionType.Websocket);
    if (smEvent.isActive() && smWebsocket.isActive()) {
      if (vaultFileName && !keepassFilename) {
        sessionManager = smEvent;
      } else if (keepassFilename && !vaultFileName) {
        sessionManager = smWebsocket;
      } else {
        sessionManager = smEvent;
      }
    } else if (smEvent.isActive()) {
      sessionManager = smEvent;
    } else if (smWebsocket.isActive()) {
      sessionManager = smWebsocket;
    }
    if (!sessionManager) {
      KeeLog.info("No active session found");
      return null;
    }
    if (sessionManager instanceof WebsocketSessionManager) {
      this.kprpcClient.request([sessionManager], "OpenAndFocusDatabase", [
        keepassFilename,
        false
      ]);
    }
    return sessionManager instanceof EventSessionManager ? SessionType.Event : SessionType.Websocket;
  }
  selectDB(fileName, requestFocusReturn, sessionType) {
    const sessionManager = sessionType ? this.kprpcClient.getSessionManagerByType(sessionType) : null;
    if (!requestFocusReturn) {
      if (sessionManager instanceof EventSessionManager) {
        KeeLog.error("Kee Vault does not support OpenAndFocusDatabase feature");
        return;
      }
      this.kprpcClient.request([sessionManager], "OpenAndFocusDatabase", [
        fileName,
        requestFocusReturn
      ]);
    } else {
      this.kprpcClient.request([sessionManager], "ChangeDatabase", [fileName, false]);
    }
  }
  async addLogin(entry, parentUUID, dbFileName) {
    var _a;
    const jslogin = Entry.toKPRPCEntryDTO(entry);
    const sessionResponses = await this.kprpcClient.request(
      [this.sessionManagerForFilename(dbFileName)],
      "AddLogin",
      [jslogin, parentUUID, dbFileName]
    );
    const result = (_a = sessionResponses == null ? void 0 : sessionResponses[0].resultWrapper) == null ? void 0 : _a.result;
    if (result) {
      const db = DatabaseSummary.fromKPRPCDatabaseSummaryDTO(result.db);
      return Entry.fromKPRPCEntryDTO(result, db);
    }
    return null;
  }
  async updateLogin(entry, oldLoginUUID, dbFileName) {
    var _a;
    const jslogin = Entry.toKPRPCEntryDTO(entry);
    const sessionManager = this.sessionManagerForFilename(dbFileName);
    const urlMergeMode = sessionManager.features().some((f) => f === "KPRPC_FEATURE_ENTRY_URL_REPLACEMENT") ? 5 : 2;
    const sessionResponses = await this.kprpcClient.request([sessionManager], "UpdateLogin", [
      jslogin,
      oldLoginUUID,
      urlMergeMode,
      dbFileName
    ]);
    const result = (_a = sessionResponses == null ? void 0 : sessionResponses[0].resultWrapper) == null ? void 0 : _a.result;
    if (result) {
      const db = DatabaseSummary.fromKPRPCDatabaseSummaryDTO(result.db);
      return Entry.fromKPRPCEntryDTO(result, db);
    }
    return null;
  }
  async findLogins(fullURL, httpRealm, uuid, dbFileName, freeText, username) {
    var _a, _b;
    if (this.store.state.KeePassDatabases.length <= 0) {
      return [];
    }
    const lst = "LSTnoForms";
    if (dbFileName == void 0 || dbFileName == null || dbFileName == "") {
      if (!configManager.current.searchAllOpenDBs) {
        dbFileName = this.store.state.KeePassDatabases[this.store.state.ActiveKeePassDatabaseIndex].fileName;
      } else
        dbFileName = "";
    }
    const potentialSessionManagers = [];
    if (dbFileName)
      potentialSessionManagers.push(this.sessionManagerForFilename(dbFileName));
    else {
      potentialSessionManagers.push(...this.kprpcClient.getManagersForActiveSessions());
    }
    const sessionManagers = potentialSessionManagers.filter(
      (sm) => sm instanceof EventSessionManager && this.store.state.KeePassDatabases.some((db) => db.sessionType == SessionType.Event) || sm instanceof WebsocketSessionManager && this.store.state.KeePassDatabases.some(
        (db) => db.sessionType == SessionType.Websocket
      )
    );
    if (sessionManagers.length <= 0) {
      return [];
    }
    const urls = [];
    if (fullURL) {
      urls.push(fullURL);
      if (fullURL.search(/$https:\/\/accounts\.youtube\.com\/?/) >= 0) {
        urls.push("https://accounts.google.com");
      }
    }
    const sessionResponses = await this.kprpcClient.request(sessionManagers, "FindLogins", [
      urls,
      null,
      httpRealm,
      lst,
      false,
      uuid,
      dbFileName,
      freeText,
      username
    ]);
    const results = [];
    for (const sessionResponse of sessionResponses) {
      if ((_b = (_a = sessionResponse.resultWrapper) == null ? void 0 : _a.result) == null ? void 0 : _b[0]) {
        const db = DatabaseSummary.fromKPRPCDatabaseSummaryDTO(
          sessionResponse.resultWrapper.result[0].db
        );
        results.push(
          ...sessionResponse.resultWrapper.result.map(
            (res) => Entry.fromKPRPCEntryDTO(res, db)
          )
        );
      }
    }
    return results;
  }
  async getAllDatabases() {
    const activeSessions = this.kprpcClient.getManagersForActiveSessions();
    const sessionResponses = await this.kprpcClient.request(
      activeSessions,
      "GetAllDatabases",
      null
    );
    const dbs = [];
    sessionResponses.sort((s) => s.sessionType === SessionType.Event ? -1 : 1);
    for (const sessionResponse of sessionResponses) {
      if (sessionResponse.resultWrapper.result !== null) {
        const recievedDBs = sessionResponse.sessionType === SessionType.Event ? sessionResponse.resultWrapper.result.dbs : sessionResponse.resultWrapper.result;
        for (const db of recievedDBs) {
          if (!dbs.find((d) => d.fileName === db.fileName)) {
            dbs.push(
              Database.fromKPRPCDatabaseDTO(
                db,
                sessionResponse.sessionType,
                sessionResponse.features
              )
            );
          } else {
            KeeLog.debug("Database with duplicate file name found. Ignoring.");
          }
        }
        if (sessionResponse.sessionType === SessionType.Event) {
          window.kee.configSyncManager.updateFromRemoteConfig(
            sessionResponse.resultWrapper.result.config
          );
        }
      }
    }
    window.kee.updateKeePassDatabases(dbs);
  }
  updateAddonSettings(settings, version) {
    const sessionManager = this.kprpcClient.getSessionManagerByType(SessionType.Event);
    if (!sessionManager) {
      return;
    }
    this.kprpcClient.request([sessionManager], "UpdateAddonSettings", [settings, version]);
  }
  async getPasswordProfiles() {
    const activeSessions = this.kprpcClient.getManagersForActiveSessions();
    const sessionResponses = await this.kprpcClient.request(
      activeSessions,
      "GetPasswordProfiles",
      null
    );
    const profiles = [];
    sessionResponses.sort((s) => s.sessionType === SessionType.Event ? -1 : 1);
    for (const sessionResponse of sessionResponses) {
      if (sessionResponse.resultWrapper.result !== null) {
        for (const profileName of sessionResponse.resultWrapper.result) {
          if (!profiles.find((p) => p.name === profileName)) {
            profiles.push({
              name: profileName,
              sessionType: sessionResponse.sessionType
            });
          } else {
            KeeLog.debug("Password profile with duplicate name found. Ignoring.");
          }
        }
      }
    }
    return profiles;
  }
  async generatePassword(profileName, url) {
    const session = this.sessionManagerForPasswordProfile(profileName);
    const sessionResponses = await this.kprpcClient.request([session], "GeneratePassword", [
      profileName,
      url
    ]);
    const sessionResponse = sessionResponses[0];
    if (sessionResponse.resultWrapper.result !== null) {
      return sessionResponse.resultWrapper.result;
    }
  }
}
class ConfigSyncManager {
  constructor() {
    this.enabled = false;
  }
  updateFromRemoteConfig(config) {
    if (!config || !config.settings || !config.version) {
      return;
    }
    if (config.version !== configManager.current.version) {
      configManager.migrateFromRemoteToLatestVersion();
    }
    this.enabled = true;
    this.lastKnownSynced = JSON.parse(JSON.stringify(config));
    configManager.setASAP(config.settings);
  }
  updateToRemoteConfig(settings) {
    if (!this.enabled)
      return;
    const syncableSettings = {
      autoFillForms: settings.autoFillForms,
      autoFillFormsWithMultipleMatches: settings.autoFillFormsWithMultipleMatches,
      autoSubmitForms: settings.autoSubmitForms,
      autoSubmitMatchedForms: settings.autoSubmitMatchedForms,
      listAllOpenDBs: settings.listAllOpenDBs,
      logLevel: settings.logLevel,
      mruGroup: settings.mruGroup,
      notifyWhenEntryUpdated: settings.notifyWhenEntryUpdated,
      overWriteFieldsAutomatically: settings.overWriteFieldsAutomatically,
      rememberMRUDB: settings.rememberMRUDB,
      rememberMRUGroup: settings.rememberMRUGroup,
      saveFavicons: settings.saveFavicons,
      searchAllOpenDBs: settings.searchAllOpenDBs,
      siteConfig: settings.siteConfig,
      autoSubmitNetworkAuthWithSingleMatch: settings.autoSubmitNetworkAuthWithSingleMatch,
      notificationCountGeneric: settings.notificationCountGeneric,
      notificationCountSavePassword: settings.notificationCountSavePassword,
      currentSearchTermTimeout: settings.currentSearchTermTimeout,
      animateWhenOfferingSave: settings.animateWhenOfferingSave,
      manualSubmitOverrideProhibited: !!settings.manualSubmitOverrideProhibited,
      autoFillFieldsWithExistingValue: settings.autoFillFieldsWithExistingValue
    };
    const syncableConfig = {
      settings: syncableSettings,
      version: settings.version
    };
    if (deepEqual(syncableConfig, this.lastKnownSynced))
      return;
    const serialisedLatest = JSON.stringify(syncableConfig);
    KeeLog.debug(
      `Config different. latest: ${serialisedLatest} this.lastKnownSynced: ${JSON.stringify(
        this.lastKnownSynced
      )}`
    );
    try {
      window.kee.KeePassRPC.updateAddonSettings(syncableSettings, settings.version);
      this.lastKnownSynced = JSON.parse(JSON.stringify(syncableConfig));
    } catch (e) {
      KeeLog.error(
        "Unexpected exception while connecting to KeePassRPC. Please inform the Kee team that they should be handling this exception: " + e
      );
      throw e;
    }
  }
  reset() {
    this.enabled = false;
    this.lastKnownSynced = null;
  }
}
class NetworkAuth {
  constructor(store) {
    this.store = store;
    this.pendingRequests = [];
  }
  completed(requestDetails) {
    const index = this.pendingRequests.indexOf(requestDetails.requestId);
    if (index > -1) {
      this.pendingRequests.splice(index, 1);
    }
  }
  provideCredentialsAsyncBlockingCallback(requestDetails, callback) {
    this.provideCredentialsAsync(requestDetails).then((result) => callback(result)).catch((reason) => {
      KeeLog.error("AsyncBlockingCallback promise failed", reason);
      callback({ cancel: false });
    });
  }
  async provideCredentialsAsync(requestDetails) {
    this.pendingRequests.push(requestDetails.requestId);
    KeeLog.debug("Providing credentials for: " + requestDetails.requestId);
    if (!this.store.state.connected || this.store.state.ActiveKeePassDatabaseIndex < 0) {
      return { cancel: false };
    }
    const url = new URL(requestDetails.url);
    url.hostname = punycode.toUnicode(url.hostname);
    const result = await window.kee.findLogins(
      url.href,
      requestDetails.realm,
      null,
      null,
      null,
      null
    );
    let matchedEntries = [];
    let isError = false;
    try {
      if (result) {
        matchedEntries = result.filter(
          (entry) => Entry.getUsernameField(entry) && Entry.getPasswordField(entry)
        );
      } else {
        isError = true;
      }
    } catch (e) {
      isError = true;
    }
    if (isError || matchedEntries.length <= 0) {
      return { cancel: false };
    }
    if (matchedEntries.length === 1 && configManager.current.autoSubmitNetworkAuthWithSingleMatch) {
      const entry = matchedEntries[0];
      return {
        authCredentials: {
          username: Entry.getUsernameField(entry).value,
          password: Entry.getPasswordField(entry).value
        }
      };
    }
    matchedEntries.sort((_e1, e2) => e2.httpRealm === requestDetails.realm ? 1 : 0);
    return new Promise((resolve) => {
      function handleMessage(request, sender) {
        switch (request.action) {
          case "NetworkAuth_ok": {
            const entry = matchedEntries[request.selectedEntryIndex];
            resolve({
              authCredentials: {
                username: Entry.getUsernameField(entry).value,
                password: Entry.getPasswordField(entry).value
              }
            });
            browserPolyfillExports.runtime.onMessage.removeListener(handleMessage);
            break;
          }
          case "NetworkAuth_cancel": {
            resolve({ cancel: false });
            browserPolyfillExports.runtime.onMessage.removeListener(handleMessage);
            break;
          }
          case "NetworkAuth_load": {
            browserPolyfillExports.tabs.sendMessage(sender.tab.id, {
              action: "NetworkAuth_matchedEntries",
              entries: matchedEntries,
              realm: requestDetails.realm,
              url: url.href,
              isProxy: requestDetails.isProxy
            });
            break;
          }
        }
      }
      browserPolyfillExports.runtime.onMessage.addListener(handleMessage);
      const createData = {
        type: "popup",
        url: "/dist/dialogs/NetworkAuth.html",
        width: 600,
        height: 300
      };
      browserPolyfillExports.windows.create(createData);
    });
  }
  startListening() {
    if (isFirefox()) {
      browserPolyfillExports.webRequest.onAuthRequired.addListener(
        (requestDetails) => this.provideCredentialsAsync(requestDetails),
        { urls: ["<all_urls>"] },
        ["blocking"]
      );
    } else {
      chrome.webRequest.onAuthRequired.addListener(
        (requestDetails, callback) => {
          this.provideCredentialsAsyncBlockingCallback(requestDetails, callback);
        },
        { urls: ["<all_urls>"] },
        ["asyncBlocking"]
      );
    }
    browserPolyfillExports.webRequest.onCompleted.addListener(
      (requestDetails) => {
        this.completed(requestDetails);
      },
      { urls: ["<all_urls>"] }
    );
    browserPolyfillExports.webRequest.onErrorOccurred.addListener(
      (requestDetails) => {
        this.completed(requestDetails);
      },
      { urls: ["<all_urls>"] }
    );
    KeeLog.debug("Network authentication listeners started");
  }
}
class AnimateIcon {
  constructor() {
    this.timer = null;
    this.cache = [];
    this.loadingImage = false;
    this.KEE_ICON_48 = // eslint-disable-next-line max-len
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAACxQAAAsUBidZ/7wAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAAOdEVYdFRpdGxlAEtlZSBsb2dvN59B9AAAABB0RVh0QXV0aG9yAEtlZSBWYXVsdGXwy5UAAAa9SURBVGiBtZlrbBzVFYC/M+v1ev0I2IkdG6gUU6eFPFqpBpNAUUulIhXRVqhCELWqWrWiVQGh/mhp1RKZPxVUaoXxE1cxVEIKkEJbpzKJH8Twg5IgN0oaV8RJiHFt764faxLver2Pmdsf8TrrfczcXW+/X7v3njmPmTvn3nNGSOGm+594BFQr0ASU4EwCONqwGH9kbKw3rh5rdvvdkYew5CEl3CuKeiVKBALKkFEx1V/rTe/fpHcs3tz8mNu3teQNkAe1bSkmQH49O9TRnxyU5I/6bzy5yzCtM5rK0lDf+nDnqGEo+aOCWwGCppuxSDUAzd4lalzxawaFS5bi53deuE8Q9ff8bRE1RO2ZPt51kVRnXQmzRYkU4DxWx81nD4iSR9XaDflgpZpfBXYTMq+pqzISPFc/zl3lSyjFZwX6O246c/gJ3xcswMjTnkcpuQe4yIaLRRYKcJ6f1EzG93mXDrDm/KoyOBjYte48wLJVwsG524la183tqwge+P6N/40XYtOyxJ/8va4xFlOjQCQfRfsrgvy4ZtKTOjYRrSRoujNkFxOlTMQqN4z9bOvHnmbvlXxMAgRqqredSP5ZD2B+tCsEHNbVIsBTNZeuv0RrlBtmzmvS50pE8YvaiQwdDpZ7xo+0xpL/Nqw/w7DadNW0lC/R5AlnjDeWhtntuZoxvrfsCo2lKxnjTaVh7ihf0jUbjZdYPakDGwKYPtZ9FnhHR9OXyxezjruA3zeM0+INIlx7UneVL/F8/X8wUFmvuTeHrnQU8vr8QJc/dSwz6yhpQ9TXnJTtLsu8y0m2l0TpuvksIcsFQKXNsgLYY6MrFRGVsUIyUtjsPdv+wVqKsqPGFXMSodIwHZ0HqHYlHGWA92aPd/4rfTAzB7e2WkC7kzZL5Zu+c5PIvrI2oBQvZBvP6kWsLPIyYJvf5s1SDdf0WDA9TiKTvhvn+rNNZA1gob9vWQmH7DSeiWzR806D05EbbOdF0c6RI1nXYs51YCnpAHIu4HfCtbr+OXIivM1uOuSOu/tyTeYMIDDYcRnI+tgAPopW8eFKtZaDdpxcqeZCtDK3gPDnydEXPs01bfsmKrK/OEmem//chvNNvqwqg+cXdtq7IJZtQrG17hvsfA/ISF1JPol7eXb+ttzrzAYTeNZ/G1Ox8txCSgZmj3Wft9PjePuybR6pDC7X8Vv/LsLK5aRqnbBy8Rv/LobCdQ7G7W2DRgBew/U64LeTGQrV8b2pZkZCtTkOC9dQwEiolu9O3cFwyMF5GJ8d7Bx2EnK8bcGLp8yqppYK4D47uauWm+FQHauWi305Dme/m/s87Yu3ctXKPG6no5BnQpdOjTnJab2BpjJ7gFUdWV8ic1MygYHl7QwuO971JIviib2qI6gVQGCwZw6lXyuk0xts5GDg9jzeE/nT7NHezLN3FrRzoBiGdq2Qzk9rLvOHhnO2xU4KcXFJp65u7QBmjrefAU44CmZBgK9ULPAZt9ZNfXPm7fZpXd357UJCQU/h36tbeHz2i5yPVjmbsPSrQsgzgNn9tUeBS/lcM7C8nR9Of4mTeseOkzPD3R/koz+/J9DaaikljrVCKg9UBWhvOMveMo3ug3LeuNLJ+yAT9670AXo14Br7K4L03XKanZ6QndhMQzDxl3z9yTuAhf6+ZYXY1grZeD+8FV+8LOe8gs6xsd68G10FHSUty7StFdJ5aXEHT/n2ErJydi4jhklvIb4UFEBguPtjbGqFdH5U8wnP1J3HY1g5JOTVmZFOvd5KGgUf5i2ln+5KRPHtLT6a3JmNMECZJF4s1I+CA/APdb+LqNM6spdj5Tzt28141n1AjQQGe84V6semeiOiROspnIvewKlI9n1A0NORi00F4HUZr+FQKwB8s8rH0R3/ZEdGb1RdmLm7dmAzPmwqgItvt0dBbWi2ziUyU2XEcvHap7cwk55GhRfXGmkFs+n2WsJ09wDR5P+PopVqOsXRiOXi4ak76Qk2Et/YzbsSj/LKZu1vOoC5kbYAcr1WiClDfunfs16sL1lu/FmeihIOrX2T2BSFfBPLQCzVpkR+kPw/Ea3k4akWGj1hrOwLxFxrnG3edjGUADR8/fETInxVy6iSt2aGOr5TDLtFazGL6KdDS6NdokvRApi9e1s/OrWCqNNrDbOiULwmf2urpQTHdS0O7cp8KV4AQNwTOYT9d4U5d3TljWLaLGoAC/19ywIv55ZQXZOjr2j1l3QpagAApmG2kb1WiMZLeKnY9ooegP9YzyRIxgcJEdWT/om0GBRlI0un3CVPrpgqATwKKITDXsP19P/D1v8A9c9y4AkuIcMAAAAASUVORK5CYII=";
    this.IMG_SIZE = 48;
  }
  start(duration, smooth) {
    if (this.loadingImage) {
      return;
    }
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const interval = smooth ? 17 : 100;
    this.timeStarted = Date.now();
    this.duration = smooth ? duration : 1600;
    if (!smooth) {
      this.timer = window.setInterval(() => this.drawLowFramerate(), interval);
      return;
    }
    if (this.cache.length > 0) {
      this.timer = window.setInterval(() => this.draw(), interval);
      return;
    } else {
      const canvas = document.createElement("canvas");
      canvas.height = this.IMG_SIZE;
      canvas.width = this.IMG_SIZE;
      const context = canvas.getContext("2d");
      const img = document.createElement("img");
      img.addEventListener("load", () => {
        this.buildCache(context, img);
        this.timer = window.setInterval(() => this.draw(), interval);
        this.loadingImage = false;
      });
      this.loadingImage = true;
      img.src = this.KEE_ICON_48;
    }
  }
  buildCache(context, img) {
    const start = Date.now();
    const HALF_IMG_SIZE = this.IMG_SIZE / 2;
    for (let i = 0; i <= this.IMG_SIZE; i++) {
      context.clearRect(0, 0, this.IMG_SIZE, this.IMG_SIZE);
      const radius = 13 * this.IMG_SIZE / 16 - i / 2;
      const gradient = context.createRadialGradient(
        HALF_IMG_SIZE,
        HALF_IMG_SIZE,
        HALF_IMG_SIZE / 8,
        HALF_IMG_SIZE,
        HALF_IMG_SIZE,
        radius
      );
      gradient.addColorStop(0, "rgb(255, 255, 165, 1)");
      gradient.addColorStop(0.6, "rgb(255, 255, 0, 1)");
      gradient.addColorStop(1, "rgb(255, 255, 165, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 48, 48);
      const left = HALF_IMG_SIZE - i / 2;
      context.drawImage(img, left, 0, i, this.IMG_SIZE);
      const imageData = context.getImageData(0, 0, this.IMG_SIZE, this.IMG_SIZE);
      this.cache[i] = imageData;
    }
    KeeLog.debug("Animated icon cache build time: " + (Date.now() - start));
  }
  drawLowFramerate() {
    const timeElapsed = Date.now() - this.timeStarted;
    if (timeElapsed > this.duration) {
      clearInterval(this.timer);
      this.timer = null;
      browserPolyfillExports.browserAction.setIcon({ path: "/assets/images/48.png" });
      return;
    }
    const cycleProgress = timeElapsed / this.duration;
    if (cycleProgress * 16 % 4 < 2) {
      browserPolyfillExports.browserAction.setIcon({
        path: "/assets/images/highlight-48.png"
      });
    } else {
      browserPolyfillExports.browserAction.setIcon({ path: "/assets/images/48.png" });
    }
  }
  draw() {
    const timeElapsed = Date.now() - this.timeStarted;
    if (timeElapsed > this.duration) {
      clearInterval(this.timer);
      this.timer = null;
      browserPolyfillExports.browserAction.setIcon({ path: "/assets/images/48.png" });
      return;
    }
    const cycleProgress = timeElapsed / this.duration;
    const width = Math.abs(this.IMG_SIZE * Math.cos(Math.PI * 2 * cycleProgress));
    const imageData = this.cache[Math.round(width)];
    browserPolyfillExports.browserAction.setIcon({
      imageData
    });
  }
}
var Command = /* @__PURE__ */ ((Command2) => {
  Command2["DetectForms"] = "detect-forms";
  Command2["PrimaryAction"] = "primary-action";
  Command2["GeneratePassword"] = "generate-password";
  return Command2;
})(Command || {});
class KFCommands {
  constructor() {
    this.contextMenuUpdateLock = false;
  }
  init() {
    browserPolyfillExports.commands.onCommand.addListener((command) => {
      const store = window.kee.store;
      switch (command) {
        case Command.DetectForms:
          if (store.state.connected && store.state.ActiveKeePassDatabaseIndex >= 0) {
            window.kee.tabStates.get(window.kee.foregroundTabId).framePorts.forEach((port) => {
              port.postMessage({
                action: Action.DetectForms
              });
            }, this);
          }
          break;
        case Command.PrimaryAction:
          if (store.state.ActiveKeePassDatabaseIndex < 0) {
            window.kee.loginToPasswordManager();
          } else {
            window.kee.tabStates.get(window.kee.foregroundTabId).framePorts.forEach((port) => {
              port.postMessage({ action: Action.Primary });
            }, this);
          }
          break;
        case Command.GeneratePassword:
          window.kee.initiatePasswordGeneration();
          break;
      }
    });
    browserPolyfillExports.contextMenus.onClicked.addListener((info) => {
      const id = info.menuItemId;
      const store = window.kee.store;
      switch (id) {
        case Command.DetectForms:
          if (store.state.connected && store.state.ActiveKeePassDatabaseIndex >= 0) {
            window.kee.tabStates.get(window.kee.foregroundTabId).framePorts.forEach((port) => {
              port.postMessage({
                action: Action.DetectForms
              });
            }, this);
          }
          break;
        case Command.GeneratePassword:
          window.kee.initiatePasswordGeneration();
          break;
      }
      if (id.startsWith("matchedLogin-")) {
        window.kee.tabStates.get(window.kee.foregroundTabId).framePorts.get(info.frameId).postMessage({
          action: Action.ManualFill,
          selectedEntryIndex: id.substr(id.indexOf("-") + 1)
        });
      }
    });
  }
  async setupContextMenuItems() {
    if (commandManager.contextMenuUpdateLock) {
      KeeLog.debug(
        "If you are missing entries from your context menu, we will need to spend more effort on the setupContextMenuItems implementation (wait by using semaphores rather than assuming new search results always follow setup requests with no results)"
      );
      return;
    }
    const store = window.kee.store;
    commandManager.contextMenuUpdateLock = true;
    try {
      await browserPolyfillExports.contextMenus.removeAll();
      if (store.state.connected && store.state.ActiveKeePassDatabaseIndex >= 0) {
        try {
          browserPolyfillExports.contextMenus.create({
            id: Command.DetectForms,
            title: $STR("Menu_Button_fillCurrentDocument_label"),
            documentUrlPatterns: ["http://*/*", "https://*/*"],
            contexts: [
              "editable",
              "frame",
              "image",
              "link",
              "page",
              "password",
              "selection"
            ]
          });
        } catch (e) {
          browserPolyfillExports.contextMenus.create({
            id: Command.DetectForms,
            title: $STR("Menu_Button_fillCurrentDocument_label"),
            documentUrlPatterns: ["http://*/*", "https://*/*"],
            contexts: ["editable", "frame", "image", "link", "page", "selection"]
          });
        }
      }
      if (store.state.connected) {
        try {
          browserPolyfillExports.contextMenus.create({
            id: Command.GeneratePassword,
            title: $STR("Menu_Button_copyNewPasswordToClipboard_label"),
            documentUrlPatterns: ["http://*/*", "https://*/*"],
            contexts: [
              "editable",
              "frame",
              "image",
              "link",
              "page",
              "password",
              "selection"
            ]
          });
        } catch (e) {
          browserPolyfillExports.contextMenus.create({
            id: Command.GeneratePassword,
            title: $STR("Menu_Button_copyNewPasswordToClipboard_label"),
            documentUrlPatterns: ["http://*/*", "https://*/*"],
            contexts: ["editable", "frame", "image", "link", "page", "selection"]
          });
        }
      }
      if (window.kee.foregroundTabId >= 0 && window.kee.tabStates.has(window.kee.foregroundTabId) && window.kee.tabStates.get(window.kee.foregroundTabId).frames) {
        window.kee.tabStates.get(window.kee.foregroundTabId).frames.forEach((frame) => {
          for (let j = 0; j < frame.entries.length; j++) {
            const entry = frame.entries[j];
            try {
              browserPolyfillExports.contextMenus.create({
                id: "matchedLogin-" + j,
                title: entry.title,
                documentUrlPatterns: ["http://*/*", "https://*/*"],
                contexts: [
                  "editable",
                  "frame",
                  "image",
                  "link",
                  "page",
                  "password",
                  "selection"
                ]
              });
            } catch (e) {
              browserPolyfillExports.contextMenus.create({
                id: "matchedLogin-" + j,
                title: entry.title,
                documentUrlPatterns: ["http://*/*", "https://*/*"],
                contexts: [
                  "editable",
                  "frame",
                  "image",
                  "link",
                  "page",
                  "selection"
                ]
              });
            }
          }
        });
      }
    } finally {
      commandManager.contextMenuUpdateLock = false;
    }
  }
}
const commandManager = new KFCommands();
commandManager.init();
var VaultAction = /* @__PURE__ */ ((VaultAction2) => {
  VaultAction2["Init"] = "init";
  VaultAction2["MessageToClient"] = "messageToClient";
  VaultAction2["FocusRequired"] = "focusRequired";
  VaultAction2["AccountChanged"] = "accountChanged";
  return VaultAction2;
})(VaultAction || {});
async function browserPopupMessageHandler(msg) {
  if (msg.mutation) {
    window.kee.store.onRemoteMessage(this, msg.mutation);
  }
  if (KeeLog && KeeLog.debug) {
    KeeLog.debug("In background script, received message from browser popup script.");
  }
  if (msg.removeNotification) {
    window.kee.removeUserNotifications((n) => n.id != msg.removeNotification);
  }
  if (msg.loadUrlUpgradeKee) {
    browserPolyfillExports.tabs.create({
      url: "https://www.kee.pm/upgrade-kprpc"
    });
  }
  if (msg.action == Action.GetPasswordProfiles) {
    const passwordProfiles = await window.kee.getPasswordProfiles();
    window.kee.store.updatePasswordProfiles(passwordProfiles);
  }
  if (msg.action === Action.GeneratePassword) {
    const generatedPassword = await window.kee.generatePassword(
      msg.passwordProfile,
      msg.url ?? "unknown URL"
    );
    if (generatedPassword) {
      window.kee.store.updateGeneratedPassword(generatedPassword);
    } else {
      KeeLog.warn(
        "Kee received an empty/missing password. Check the configuration of your password manager."
      );
    }
  }
  if (msg.action === Action.CreateEntry || msg.action === Action.UpdateEntry) {
    if (window.kee.store.state.connected) {
      const sourceEntry = window.kee.store.state.saveState.newEntry;
      const existingOrTemporaryUuid = sourceEntry.uuid;
      const dbFileName = sourceEntry.database.fileName;
      const parentGroupUuid = sourceEntry.parentGroup.uuid;
      const entry = new Entry(
        Object.assign(Object.assign({}, sourceEntry), {
          parentGroup: void 0,
          uuid: null,
          database: void 0,
          // We will rarely have access to the favicon data at the time the initial
          // Entry is created for editing in the popup so set it at this much later
          // point instead.
          icon: configManager.current.saveFavicons ? {
            version: 1,
            iconImageData: window.kee.store.state.saveState.favicon
          } : null
        })
      );
      const tabId = window.kee.foregroundTabId;
      const clearSubmittedData = () => {
        var _a, _b;
        if (((_b = (_a = window.kee.persistentTabStates.get(tabId)) == null ? void 0 : _a.items) == null ? void 0 : _b.length) > 0) {
          window.kee.persistentTabStates.get(
            tabId
          ).items = window.kee.persistentTabStates.get(tabId).items.filter((item) => item.itemType !== "submittedData");
        }
      };
      if (msg.action === Action.UpdateEntry) {
        window.kee.store.updateEntryUpdateStartedAtTimestamp(Date.now());
        window.kee.updateLogin(
          entry,
          existingOrTemporaryUuid,
          dbFileName,
          clearSubmittedData
        );
      } else {
        window.kee.addLogin(entry, parentGroupUuid, dbFileName, clearSubmittedData);
      }
      if (!configManager.current.mruGroup)
        configManager.current.mruGroup = {};
      configManager.current.mruGroup[dbFileName] = parentGroupUuid;
      configManager.current.mruGroup["{<{{<<kee-primary>>}}>}"] = parentGroupUuid;
      configManager.save();
    }
  }
  if (msg.action == Action.ManualFill && msg.selectedEntryIndex != null) {
    window.kee.tabStates.get(window.kee.foregroundTabId).framePorts.get(msg.frameId || 0).postMessage(msg);
    window.kee.tabStates.get(window.kee.foregroundTabId).framePorts.get(0).postMessage({ action: Action.CloseAllPanels });
  }
  if (msg.action === Action.OpenKeePass) {
    window.kee.openKeePass();
  }
  if (msg.findMatches) {
    const result = await window.kee.findLogins(
      null,
      null,
      msg.findMatches.uuid,
      msg.findMatches.DBfilename,
      null,
      null
    );
    window.kee.browserPopupPort.postMessage({
      findMatchesResult: result
    });
  }
  if (msg.loginEditor) {
    window.kee.launchLoginEditor(msg.loginEditor.uuid, msg.loginEditor.DBfilename);
  }
  if (msg.action === Action.DetectForms) {
    window.kee.tabStates.get(window.kee.foregroundTabId).framePorts.forEach((port) => {
      port.postMessage({
        action: Action.DetectForms
      });
    }, this);
  }
}
async function pageMessageHandler(msg) {
  if (KeeLog && KeeLog.debug) {
    KeeLog.debug("In background script, received message from page script.");
  }
  if (msg.mutation) {
    window.kee.store.onRemoteMessage(this, msg.mutation);
  }
  if (msg.findMatches) {
    window.kee.tabStates.get(this.sender.tab.id).frames.get(this.sender.frameId).entries = [];
    const result = await window.kee.findLogins(
      msg.findMatches.uri,
      null,
      null,
      null,
      null,
      null
    );
    this.postMessage({
      isForegroundTab: this.sender.tab.id === window.kee.foregroundTabId,
      findMatchesResult: result
    });
  }
  if (msg.removeNotification) {
    window.kee.removeUserNotifications((n) => n.id != msg.removeNotification);
    try {
      window.kee.browserPopupPort.postMessage({
        isForegroundTab: this.sender.tab.id === window.kee.foregroundTabId
      });
    } catch (e) {
    }
  }
  if (msg.entries) {
    window.kee.tabStates.get(this.sender.tab.id).frames.get(this.sender.frameId).entries = msg.entries;
  }
  if (msg.submittedData) {
    const persistentItem = {
      itemType: "submittedData",
      submittedData: msg.submittedData,
      creationDate: /* @__PURE__ */ new Date()
    };
    if (!window.kee.persistentTabStates.get(this.sender.tab.id)) {
      window.kee.persistentTabStates.set(this.sender.tab.id, {
        items: []
      });
    }
    if (window.kee.persistentTabStates.get(this.sender.tab.id)) {
      window.kee.persistentTabStates.get(
        this.sender.tab.id
      ).items = window.kee.persistentTabStates.get(this.sender.tab.id).items.filter((item) => item.itemType !== "submittedData");
    }
    window.kee.persistentTabStates.get(this.sender.tab.id).items.push(persistentItem);
    if (window.kee.store.state.entryUpdateStartedAtTimestamp >= Date.now() - 9e4)
      return;
    if (configManager.current.notificationCountSavePassword < 10) {
      browserPolyfillExports.notifications.create({
        type: "basic",
        iconUrl: browserPolyfillExports.extension.getURL("/assets/images/128.png"),
        title: $STR("savePasswordText"),
        message: $STR("notification_save_password_tip") + "\n" + $STR("notification_only_shown_some_times")
      });
      configManager.setASAP({
        notificationCountSavePassword: configManager.current.notificationCountSavePassword + 1
      });
    }
    if (configManager.current.animateWhenOfferingSave) {
      window.kee.animateBrowserActionIcon();
    }
  }
  if (msg.action === Action.ShowMatchedLoginsPanel) {
    window.kee.tabStates.get(this.sender.tab.id).framePorts.get(0).postMessage({
      action: Action.ShowMatchedLoginsPanel,
      frameId: this.sender.frameId
    });
  }
  if (msg.action === Action.PageHide) {
    try {
      window.kee.tabStates.get(this.sender.frameId).framePorts.forEach((port, key, map) => {
        try {
          port.disconnect();
        } catch (e) {
          if (KeeLog && KeeLog.debug) {
            KeeLog.debug(
              "failed to disconnect a frame port on tab " + key + ". This is probably not a problem but we may now be reliant on browser GC to clear down memory. The exception that caused this is: " + e.message + " : " + e.stack
            );
          }
        } finally {
          map.delete(key);
        }
      });
    } catch (e) {
    }
    if (this.sender.frameId === 0) {
      window.kee.deleteTabState(this.sender.tab.id);
    }
  }
}
function vaultMessageHandler(msg) {
  if (msg.mutation) {
    window.kee.store.onRemoteMessage(this, msg.mutation);
  }
  let result;
  if (KeeLog && KeeLog.debug) {
    KeeLog.debug("In background script, received message from vault script.");
  }
  switch (msg.action) {
    case VaultAction.Init:
      result = window.kee.KeePassRPC.startEventSession(
        msg.sessionId,
        msg.features,
        (msgToPage) => this.postMessage(msgToPage)
      );
      if (result) {
        this.postMessage(result);
      }
      return;
    case VaultAction.MessageToClient:
      result = window.kee.KeePassRPC.eventSessionMessageFromPage(msg);
      if (result) {
        this.postMessage(result);
      }
      return;
    case VaultAction.FocusRequired:
      browserPolyfillExports.tabs.update(this.sender.tab.id, { active: true });
      browserPolyfillExports.windows.update(this.sender.tab.windowId, { focused: true });
      return;
    case VaultAction.AccountChanged:
      window.kee.accountManager.processNewTokens(msg.tokens);
      return;
  }
}
async function iframeMessageHandler(msg) {
  if (msg.mutation) {
    window.kee.store.onRemoteMessage(this, msg.mutation);
  }
  if (KeeLog && KeeLog.debug) {
    KeeLog.debug("In background script, received message from iframe script.");
  }
  const tabId = this.sender.tab.id;
  if (msg.action == Action.ManualFill && msg.selectedEntryIndex != null) {
    window.kee.tabStates.get(tabId).framePorts.get(msg.frameId || 0).postMessage(msg);
    window.kee.tabStates.get(tabId).framePorts.get(0).postMessage({ action: Action.CloseAllPanels });
  }
  if (msg.action == Action.CloseAllPanels) {
    window.kee.tabStates.get(tabId).framePorts.get(0).postMessage(msg);
  }
  if (msg.action == Action.GetPasswordProfiles) {
    const passwordProfiles = await window.kee.getPasswordProfiles();
    window.kee.store.updatePasswordProfiles(passwordProfiles);
  }
  if (msg.action == Action.GeneratePassword) {
    const generatedPassword = await window.kee.generatePassword(
      msg.passwordProfile,
      window.kee.tabStates.get(tabId).url
    );
    if (generatedPassword) {
      window.kee.store.updateGeneratedPassword(generatedPassword);
      this.postMessage({
        generatedPassword
      });
    } else {
      KeeLog.warn(
        "Kee received an empty/missing password. Check the configuration of your password manager."
      );
    }
  }
  if (msg.loginEditor) {
    window.kee.launchLoginEditor(msg.loginEditor.uuid, msg.loginEditor.DBfilename);
  }
  if (msg.copyToClipboard) {
    await copyStringToClipboard(msg.copyToClipboard);
  }
}
class TabState {
  constructor() {
    this.frames = /* @__PURE__ */ new Map();
    this.url = "";
    this.framePorts = /* @__PURE__ */ new Map();
    this.ourIframePorts = /* @__PURE__ */ new Map();
  }
}
class FrameState {
  constructor() {
    this.entries = [];
  }
}
class BackgroundStore extends NonReactiveStore {
  onRemoteMessage(sourcePort, mutation) {
    super.onRemoteMessage(sourcePort, mutation);
    KeeLog.debug("BackgroundStore.onRemoteMessage distributing");
    this.distributeAction(mutation, sourcePort);
  }
}
class Kee {
  constructor() {
    this.configSyncManager = new ConfigSyncManager();
    this.store = new BackgroundStore((mutation, excludedPort) => {
      const allPorts = [];
      allPorts.push(this.browserPopupPort);
      allPorts.push(this.vaultPort);
      const ts = window.kee.tabStates.get(window.kee.foregroundTabId);
      if (ts) {
        ts.framePorts.forEach((port) => {
          allPorts.push(port);
        });
        ts.ourIframePorts.forEach((port) => {
          allPorts.push(port);
        });
      }
      for (const port of allPorts) {
        if (port !== excludedPort) {
          try {
            const json = JSON.stringify(mutation);
            KeeLog.debug("New background mutation for distribution");
            port.postMessage({ mutation: JSON.parse(json) });
          } catch (e) {
            KeeLog.warn("Dead port found", e);
          }
        }
      }
    });
    this.accountManager = new AccountManager();
    this.tabStates = /* @__PURE__ */ new Map();
    this.persistentTabStates = /* @__PURE__ */ new Map();
    this.foregroundTabId = -1;
    this.utils = utils;
    this.search = new SearcherAll(this.store.state, {
      version: 1,
      searchAllDatabases: configManager.current.searchAllOpenDBs
    });
    this.networkAuth = new NetworkAuth(this.store);
    this.animateIcon = new AnimateIcon();
    this.browserPopupPort = { postMessage: (_msg) => {
    } };
    this.vaultPort = { postMessage: (_msg) => {
    } };
    this.onPortConnected = function(p) {
      var _a, _b;
      if (KeeLog && KeeLog.debug)
        KeeLog.debug(p.name + " port connected");
      let name = p.name;
      let parentFrameId;
      if (name.startsWith("iframe")) {
        parentFrameId = parseInt(name.substr(7));
        name = "iframe";
      }
      switch (name) {
        case "browserPopup": {
          clearTimeout(window.kee.currentSearchTermTimer);
          p.onMessage.addListener(browserPopupMessageHandler.bind(p));
          p.onDisconnect.addListener(() => {
            window.kee.browserPopupPort = {
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              postMessage: (_msg) => {
              }
            };
            window.kee.currentSearchTermTimer = window.setTimeout(() => {
              var _a2, _b2, _c, _d;
              (_b2 = (_a2 = window.kee) == null ? void 0 : _a2.store) == null ? void 0 : _b2.updateCurrentSearchTerm(null);
              (_d = (_c = window.kee) == null ? void 0 : _c.store) == null ? void 0 : _d.updateSearchResults(null);
            }, configManager.current.currentSearchTermTimeout * 1e3);
          });
          let submittedData = null;
          let loginsFound = false;
          if (window.kee.persistentTabStates.get(window.kee.foregroundTabId)) {
            window.kee.persistentTabStates.get(window.kee.foregroundTabId).items.forEach((item) => {
              if (item.itemType === "submittedData") {
                submittedData = item.submittedData;
              }
            });
          }
          const matchedLogins = {};
          if (window.kee.tabStates.has(window.kee.foregroundTabId)) {
            const frames = window.kee.tabStates.get(window.kee.foregroundTabId).frames;
            const matchedFrameID = window.kee.frameIdWithMatchedLogins(frames);
            if (matchedFrameID >= 0) {
              loginsFound = true;
              matchedLogins.entries = frames.get(matchedFrameID).entries;
              matchedLogins.frameId = matchedFrameID;
              matchedLogins.tabId = window.kee.foregroundTabId;
            }
          }
          window.kee.store.updateSubmittedData(submittedData);
          window.kee.store.updateLoginsFound(loginsFound);
          const connectMessage = {
            initialState: window.kee.store.state
          };
          if (matchedLogins.entries) {
            connectMessage.entries = matchedLogins.entries;
            connectMessage.frameId = matchedLogins.frameId;
            connectMessage.tabId = matchedLogins.tabId;
          }
          try {
            p.postMessage(connectMessage);
          } catch (e) {
            KeeLog.error("postMessage error", e);
          }
          window.kee.browserPopupPort = p;
          window.kee.resetBrowserActionColor();
          break;
        }
        case "page": {
          p.onMessage.addListener(pageMessageHandler.bind(p));
          const tabId = p.sender.tab.id;
          const frameId = p.sender.frameId;
          const connectMessage = {
            initialState: window.kee.store.state,
            frameId,
            tabId,
            isForegroundTab: tabId === window.kee.foregroundTabId
          };
          window.kee.createTabStateIfMissing(tabId);
          if (frameId === 0) {
            window.kee.tabStates.get(tabId).url = p.sender.tab.url;
            if (((_b = (_a = window.kee.persistentTabStates.get(tabId)) == null ? void 0 : _a.items) == null ? void 0 : _b.length) > 0) {
              window.kee.persistentTabStates.get(
                tabId
              ).items = window.kee.persistentTabStates.get(tabId).items.filter(
                (item) => item.itemType !== "submittedData" || item.creationDate > new Date(Date.now() - 36e5)
              );
            }
          }
          window.kee.tabStates.get(tabId).frames.set(frameId, new FrameState());
          window.kee.tabStates.get(tabId).framePorts.set(frameId, p);
          p.postMessage(connectMessage);
          break;
        }
        case "vault": {
          p.onMessage.addListener(vaultMessageHandler.bind(p));
          const connectMessage = {
            initialState: window.kee.store.state,
            frameId: p.sender.frameId,
            tabId: p.sender.tab.id,
            isForegroundTab: p.sender.tab.id === window.kee.foregroundTabId
          };
          window.kee.vaultPort = p;
          p.postMessage(connectMessage);
          break;
        }
        case "iframe": {
          p.onMessage.addListener(iframeMessageHandler.bind(p));
          const connectMessage = {
            initialState: window.kee.store.state,
            frameState: window.kee.tabStates.get(p.sender.tab.id).frames.get(parentFrameId),
            frameId: p.sender.frameId,
            tabId: p.sender.tab.id,
            isForegroundTab: p.sender.tab.id === window.kee.foregroundTabId
          };
          if (window.kee.persistentTabStates.get(p.sender.tab.id)) {
            window.kee.persistentTabStates.get(p.sender.tab.id).items.forEach((item) => {
              if (item.itemType === "submittedData") {
                connectMessage.submittedData = item.submittedData;
              }
            });
          }
          p.postMessage(connectMessage);
          window.kee.tabStates.get(p.sender.tab.id).ourIframePorts.set(p.sender.frameId, p);
          break;
        }
      }
    };
  }
  frameIdWithMatchedLogins(frames) {
    let frameId = -1;
    frames.forEach((frame, i) => {
      if (frameId == -1 && frame && frame.entries && frame.entries.length > 0)
        frameId = i;
    });
    return frameId;
  }
  async init() {
    this.regularKPRPCListenerQueueHandlerTimer = window.setInterval(
      this.RegularKPRPCListenerQueueHandler,
      5e3
    );
    this._keeBrowserStartup();
    this.accountManager.addListener(() => {
      if (this.accountManager.featureEnabledMultiSessionTypes && !this.KeePassRPC.eventSessionManagerIsActive) {
        this.inviteKeeVaultConnection();
      }
    });
    browserPolyfillExports.runtime.onConnect.addListener(this.onPortConnected);
    this.networkAuth.startListening();
    await browserPolyfillExports.privacy.services.passwordSavingEnabled.set({
      value: false
    });
    if (browserPolyfillExports.runtime.lastError != null) {
      KeeLog.warn(
        "KeeFox was unable to disable built-in password manager saving - confusion may ensue! " + browserPolyfillExports.runtime.lastError.message
      );
    }
  }
  notifyUser(notification, nativeNotification) {
    window.kee.removeUserNotifications((n) => n.name != notification.name);
    window.kee.store.addNotification(notification);
    browserPolyfillExports.browserAction.setIcon({
      path: "/assets/images/highlight-48.png"
    });
    if (nativeNotification) {
      browserPolyfillExports.notifications.create({
        type: "basic",
        iconUrl: browserPolyfillExports.extension.getURL("/assets/images/128.png"),
        title: nativeNotification.title,
        message: nativeNotification.message
      });
    } else {
      if (configManager.current.notificationCountGeneric < 5) {
        browserPolyfillExports.notifications.create({
          type: "basic",
          iconUrl: browserPolyfillExports.extension.getURL("/assets/images/128.png"),
          title: $STR("notification_raised_title"),
          message: $STR("notification_yellow_background") + "\n" + $STR("notification_only_shown_some_times")
        });
        configManager.setASAP({
          notificationCountGeneric: configManager.current.notificationCountGeneric + 1
        });
      }
    }
  }
  removeUserNotifications(unlessTrue) {
    this.store.updateNotifications(this.store.state.notifications.filter(unlessTrue));
  }
  animateBrowserActionIcon(duration = 1200) {
    this.animateIcon.start(duration, !isFirefox());
  }
  resetBrowserActionColor() {
    browserPolyfillExports.browserAction.setIcon({ path: "/assets/images/48.png" });
  }
  shutdown() {
    KeeLog.debug("Kee module shutting down...");
    KeeLog.debug("Kee module shut down.");
  }
  _keeBrowserStartup() {
    KeeLog.debug("Kee initialising");
    this.KeePassRPC = new jsonrpcClient(this.store);
    KeeLog.info(
      "Kee initialised OK although the connection to a KeePassRPC server is probably not established just yet..."
    );
  }
  // Temporarily disable Kee. Used (for e.g.) when KeePass is shut down.
  _pauseKee() {
    KeeLog.debug("Pausing Kee.");
    this.store.updateKeePassDatabases([]);
    this.store.updateActiveKeePassDatabaseIndex(-1);
    this.store.updateConnected(false);
    this.store.updateConnectedWebsocket(false);
    this.store.updateCurrentSearchTerm(null);
    this.store.updateSearchResults(null);
    try {
      this.refreshFormStatus(Action.ResetForms);
    } catch (e) {
      KeeLog.error(
        "Uncaught exception posting message in _pauseKee: " + e.message + " : " + e.stack
      );
    }
    browserPolyfillExports.browserAction.setBadgeText({ text: "OFF" });
    browserPolyfillExports.browserAction.setBadgeBackgroundColor({ color: "red" });
    commandManager.setupContextMenuItems();
    KeeLog.info("Kee paused.");
  }
  _refreshKPDB() {
    this.getAllDatabases();
    KeeLog.debug("Refresh of Kee's view of the KeePass database initiated.");
  }
  inviteKeeVaultConnection() {
    if (this.vaultPort) {
      this.vaultPort.postMessage({
        protocol: VaultProtocol.Reconnect
      });
    }
  }
  updateKeePassDatabases(newDatabases) {
    let newDatabaseActiveIndex = -1;
    for (let i = 0; i < newDatabases.length; i++) {
      if (newDatabases[i].active) {
        newDatabaseActiveIndex = i;
        break;
      }
    }
    this.store.updateConnected(true);
    this.store.updateConnectedWebsocket(this.KeePassRPC.websocketSessionManagerIsActive);
    this.store.updateKeePassDatabases(newDatabases);
    this.store.updateActiveKeePassDatabaseIndex(newDatabaseActiveIndex);
    this.store.updateSearchResults(null);
    this.store.updateCurrentSearchTerm(null);
    KeeLog.info("Number of databases open: " + newDatabases.length);
    if (newDatabases.length > 0) {
      browserPolyfillExports.browserAction.setBadgeText({ text: "" });
      browserPolyfillExports.browserAction.setBadgeBackgroundColor({ color: "blue" });
    } else {
      browserPolyfillExports.browserAction.setBadgeText({ text: "OFF" });
      browserPolyfillExports.browserAction.setBadgeBackgroundColor({ color: "orange" });
    }
    if (configManager.current.rememberMRUDB) {
      const MRUFN = this.getDatabaseFileName();
      if (MRUFN != null && MRUFN != void 0)
        configManager.current.keePassMRUDB = MRUFN;
      configManager.save();
    }
    try {
      this.refreshFormStatus(Action.DetectForms);
    } catch (e) {
      KeeLog.error(
        "Uncaught exception posting message in updateKeePassDatabases: " + e.message + " : " + e.stack
      );
    }
    commandManager.setupContextMenuItems();
  }
  refreshFormStatus(action) {
    window.kee.tabStates.forEach((ts, tabId) => {
      ts.framePorts.forEach((port, key, map) => {
        try {
          if (port.sender.tab.id === this.foregroundTabId) {
            port.postMessage({ action });
          }
        } catch (e) {
          if (KeeLog && KeeLog.info) {
            KeeLog.info(
              "failed to request form field reset/update on tab " + tabId + ". Assuming port is broken (possible browser bug) and deleting the port. Kee may no longer work in the affected tab, if indeed the tab even exists any more. The exception that caused this is: " + e.message + " : " + e.stack
            );
          }
          map.delete(key);
        }
      }, this);
    }, this);
  }
  // if the MRU database is known, open that but otherwise send empty string which will cause user
  // to be prompted to choose a DB to open
  getKeePassFileNameToOpen() {
    let databaseFileName = configManager.current.keePassDBToOpen;
    if (databaseFileName == "" || this.isKeeVaultFileName(databaseFileName)) {
      databaseFileName = configManager.current.keePassMRUDB;
    }
    return !this.isKeeVaultFileName(databaseFileName) ? databaseFileName : "";
  }
  getVaultFileNameToOpen() {
    let databaseFileName = configManager.current.keePassDBToOpen;
    if (databaseFileName == "" || !this.isKeeVaultFileName(databaseFileName)) {
      databaseFileName = configManager.current.keePassMRUDB;
    }
    return this.isKeeVaultFileName(databaseFileName) ? databaseFileName : "";
  }
  isKeeVaultFileName(name) {
    if (name.indexOf("-") === -1)
      return false;
    if (name.indexOf("/") >= 0 || name.indexOf("\\") >= 0)
      return false;
    return true;
  }
  openKeePass() {
    const hasWebsocketDBs = this.store.state.KeePassDatabases.some(
      (db) => db.sessionType === SessionType.Websocket
    );
    const supportsWebsocketFocus = this.store.state.KeePassDatabases.some(
      (db) => db.sessionType === SessionType.Websocket && db.sessionFeatures.indexOf("KPRPC_OPEN_AND_FOCUS_DATABASE") >= 0
    );
    if (hasWebsocketDBs && !supportsWebsocketFocus) {
      KeeLog.warn(
        "Can't open KeePass because KeePassRPC version does not support KPRPC_OPEN_AND_FOCUS_DATABASE"
      );
      return;
    }
    this.selectDatabase(
      this.getKeePassFileNameToOpen(),
      !hasWebsocketDBs,
      SessionType.Websocket
    );
  }
  async loginToPasswordManager() {
    const sessionType = await this.selectAndFocusDatabase(
      this.getVaultFileNameToOpen(),
      this.getKeePassFileNameToOpen()
    );
    if (sessionType !== SessionType.Websocket) {
      const vaultTabs = await browserPolyfillExports.tabs.query({
        url: [
          "https://keevault.pm/*",
          "https://app-beta.kee.pm/*",
          "https://app-dev.kee.pm/*"
        ]
      });
      if (vaultTabs && vaultTabs[0]) {
        browserPolyfillExports.tabs.update(vaultTabs[0].id, { active: true });
        browserPolyfillExports.windows.update(vaultTabs[0].windowId, { focused: true });
      } else {
        browserPolyfillExports.tabs.create({
          url: "https://keevault.pm/",
          active: true
        });
      }
    }
  }
  recordEntrySaveResult(saveType, entry) {
    if (!entry) {
      this.store.updateSaveEntryResult({
        result: "error",
        receivedAt: /* @__PURE__ */ new Date()
      });
      return false;
    } else {
      this.store.updateSaveEntryResult({
        result: saveType,
        receivedAt: /* @__PURE__ */ new Date(),
        fileName: entry.database.fileName,
        uuid: entry.uuid
      });
      return true;
    }
  }
  /*******************************************
  / These functions are essentially wrappers for the actions that
  / Kee needs to take against KeePass via the KeePassRPC plugin connection.
  /*******************************************/
  getDatabaseName(index) {
    if (index == void 0)
      index = this.store.state.ActiveKeePassDatabaseIndex;
    if (this.store.state.KeePassDatabases.length > 0 && this.store.state.KeePassDatabases[index] != null && this.store.state.KeePassDatabases[index].root != null) {
      return this.store.state.KeePassDatabases[index].name;
    } else
      return null;
  }
  getDatabaseFileName(index) {
    if (index == void 0)
      index = this.store.state.ActiveKeePassDatabaseIndex;
    if (this.store.state.KeePassDatabases.length > 0 && this.store.state.KeePassDatabases[index] != null && this.store.state.KeePassDatabases[index].root != null) {
      return this.store.state.KeePassDatabases[index].fileName;
    } else
      return null;
  }
  selectDatabase(fileName, requestReturnFocus, sessionType) {
    try {
      this.KeePassRPC.selectDB(fileName, requestReturnFocus, sessionType);
    } catch (e) {
      KeeLog.error(
        "Unexpected exception while connecting to KeePassRPC. Please inform the Kee team that they should be handling this exception: " + e
      );
      throw e;
    }
  }
  selectAndFocusDatabase(vaultFileName, keepassFilename) {
    try {
      return this.KeePassRPC.selectAndFocusDatabase(vaultFileName, keepassFilename);
    } catch (e) {
      KeeLog.error(
        "Unexpected exception while connecting to KeePassRPC. Please inform the Kee team that they should be handling this exception: " + e
      );
      throw e;
    }
  }
  async addLogin(entry, parentUUID, dbFileName, clearSubmittedData) {
    try {
      const newEntry = await this.KeePassRPC.addLogin(entry, parentUUID, dbFileName);
      const success = this.recordEntrySaveResult("created", newEntry);
      if (success)
        clearSubmittedData();
    } catch (e) {
      KeeLog.error(
        "Unexpected exception while connecting to KeePassRPC. Please inform the Kee team that they should be handling this exception: " + e
      );
      throw e;
    }
  }
  async updateLogin(entry, oldLoginUUID, dbFileName, clearSubmittedData) {
    try {
      const changedEntry = await this.KeePassRPC.updateLogin(entry, oldLoginUUID, dbFileName);
      const success = this.recordEntrySaveResult("updated", changedEntry);
      if (success)
        clearSubmittedData();
    } catch (e) {
      KeeLog.error(
        "Unexpected exception while connecting to KeePassRPC. Please inform the Kee team that they should be handling this exception: " + e
      );
      throw e;
    }
  }
  getAllDatabases() {
    try {
      return this.KeePassRPC.getAllDatabases();
    } catch (e) {
      KeeLog.error(
        "Unexpected exception while connecting to KeePassRPC. Please inform the Kee team that they should be handling this exception: " + e
      );
      throw e;
    }
  }
  async findLogins(fullURL, httpRealm, uuid, dbFileName, freeText, username) {
    try {
      return this.KeePassRPC.findLogins(
        fullURL,
        httpRealm,
        uuid,
        dbFileName,
        freeText,
        username
      );
    } catch (e) {
      KeeLog.error(
        "Unexpected exception while connecting to KeePassRPC. Please inform the Kee team that they should be handling this exception: " + e
      );
      throw e;
    }
  }
  launchLoginEditor(uuid, dbFileName) {
    try {
      this.KeePassRPC.launchLoginEditor(uuid, dbFileName);
    } catch (e) {
      KeeLog.error(
        "Unexpected exception while connecting to KeePassRPC. Please inform the Kee team that they should be handling this exception: " + e
      );
      throw e;
    }
  }
  launchGroupEditor(uuid, dbFileName) {
    try {
      this.KeePassRPC.launchGroupEditor(uuid, dbFileName);
    } catch (e) {
      KeeLog.error(
        "Unexpected exception while connecting to KeePassRPC. Please inform the Kee team that they should be handling this exception: " + e
      );
      throw e;
    }
  }
  async getPasswordProfiles() {
    try {
      return this.KeePassRPC.getPasswordProfiles();
    } catch (e) {
      KeeLog.error(
        "Unexpected exception while connecting to KeePassRPC. Please inform the Kee team that they should be handling this exception: " + e
      );
      throw e;
    }
  }
  async generatePassword(profileName, url) {
    try {
      return this.KeePassRPC.generatePassword(profileName, url);
    } catch (e) {
      KeeLog.error(
        "Unexpected exception while connecting to KeePassRPC. Please inform the Kee team that they should be handling this exception: " + e
      );
      throw e;
    }
  }
  // Could use multiple callback functions but just one keeps KeePassRPC simpler
  // this is only called once no matter how many windows are open. so functions
  // within need to handle all open windows for now, that just means every
  // window although in future maybe there could be a need to store a list of
  // relevant windows and call those instead
  KPRPCListener(sig) {
    const sigTime = Date();
    KeeLog.debug("Signal received by KPRPCListener (" + sig + ") @" + sigTime);
    let executeNow = false;
    let refresh = false;
    switch (sig) {
      case "0":
        KeeLog.warn("KeePassRPC is requesting authentication [deprecated].");
        break;
      case "3":
        KeeLog.info("KeePass' currently active DB is about to be opened.");
        break;
      case "4":
        KeeLog.info("KeePass' currently active DB has just been opened.");
        refresh = true;
        break;
      case "5":
        KeeLog.info("KeePass' currently active DB is about to be closed.");
        break;
      case "6":
        KeeLog.info("KeePass' currently active DB has just been closed.");
        refresh = true;
        break;
      case "7":
        KeeLog.info("KeePass' currently active DB is about to be saved.");
        break;
      case "8":
        KeeLog.info("KeePass' currently active DB has just been saved.");
        refresh = true;
        break;
      case "9":
        KeeLog.info("KeePass' currently active DB is about to be deleted.");
        break;
      case "10":
        KeeLog.info("KeePass' currently active DB has just been deleted.");
        break;
      case "11":
        KeeLog.info("KeePass' active DB has been changed/selected.");
        refresh = true;
        break;
      case "12":
        KeeLog.info(
          "KeePass is shutting down. [deprecated: Now inferred from connection loss]"
        );
        break;
      default:
        KeeLog.error("Invalid signal received by KPRPCListener (" + sig + ")");
        break;
    }
    if (!refresh)
      return;
    const now = (/* @__PURE__ */ new Date()).getTime();
    if (!window.kee.processingCallback && window.kee.pendingCallback == "") {
      KeeLog.debug("Signal executing now. @" + sigTime);
      window.kee.processingCallback = true;
      executeNow = true;
    }
    if (refresh) {
      if (executeNow) {
        window.kee.store.updateLastKeePassRPCRefresh(now);
        window.kee._refreshKPDB();
      } else {
        window.kee.pendingCallback = "_refreshKPDB";
      }
    }
    KeeLog.debug("Signal handled or queued. @" + sigTime);
    if (executeNow) {
      try {
        if (window.kee.pendingCallback == "_refreshKPDB")
          window.kee._refreshKPDB();
        else
          KeeLog.debug("A pending signal was found and handled.");
      } finally {
        window.kee.pendingCallback = "";
        window.kee.processingCallback = false;
      }
      KeeLog.debug("Signal handled. @" + sigTime);
    }
  }
  RegularKPRPCListenerQueueHandler() {
    if (window.kee.processingCallback || window.kee.pendingCallback == "")
      return;
    KeeLog.debug("RegularKPRPCListenerQueueHandler will execute the pending item now");
    window.kee.processingCallback = true;
    try {
      if (window.kee.pendingCallback == "_refreshKPDB")
        window.kee._refreshKPDB();
    } finally {
      window.kee.pendingCallback = "";
      window.kee.processingCallback = false;
    }
    KeeLog.debug("RegularKPRPCListenerQueueHandler has finished executing the item");
  }
  createTabStateIfMissing(tabId) {
    if (!window.kee.tabStates.has(tabId)) {
      window.kee.tabStates.set(tabId, new TabState());
    }
  }
  deleteTabState(tabId) {
    window.kee.tabStates.delete(tabId);
  }
  initiatePasswordGeneration() {
    if (window.kee.store.state.connected) {
      const tabState = window.kee.tabStates.get(window.kee.foregroundTabId);
      if (tabState) {
        const framePort = tabState.framePorts.get(0);
        if (framePort) {
          framePort.postMessage({ action: Action.GeneratePassword });
          return;
        }
      }
      if (window.kee.vaultPort) {
        window.kee.vaultPort.postMessage({
          protocol: VaultProtocol.ShowGenerator
        });
        browserPolyfillExports.tabs.update(window.kee.vaultPort.sender.tab.id, {
          active: true
        });
        browserPolyfillExports.windows.update(window.kee.vaultPort.sender.tab.windowId, { focused: true });
      }
    }
  }
}
const userBusySeconds = 60 * 15;
const maxUpdateDelaySeconds = 60 * 60 * 8;
browserPolyfillExports.browserAction.setBadgeText({ text: "OFF" });
browserPolyfillExports.browserAction.setBadgeBackgroundColor({ color: "red" });
browserPolyfillExports.browserAction.disable();
async function startup() {
  KeeLog.attachConfig(configManager.current);
  await showReleaseNotesAfterUpdate();
  window.kee = new Kee();
  window.kee.init();
  configManager.addChangeListener(
    () => window.kee.configSyncManager.updateToRemoteConfig(configManager.current)
  );
  browserPolyfillExports.browserAction.enable();
}
async function showReleaseNotesAfterUpdate() {
  if (configManager.current.mustShowReleaseNotesAtStartup) {
    const tab = await browserPolyfillExports.tabs.create({
      url: "/dist/release-notes/update-notes.html",
      active: true
    });
    browserPolyfillExports.windows.update(tab.windowId, { focused: true, drawAttention: true });
    configManager.setASAP({ mustShowReleaseNotesAtStartup: false });
  }
}
browserPolyfillExports.windows.onFocusChanged.addListener(async function(windowId) {
  if (KeeLog && KeeLog.debug)
    KeeLog.debug("Focus changed for id: " + windowId);
  if (windowId !== browserPolyfillExports.windows.WINDOW_ID_NONE) {
    const tabs = await browserPolyfillExports.tabs.query({
      active: true,
      windowId
    });
    if (tabs[0] && tabs[0].id != null)
      onTabActivated(tabs[0].id);
  }
});
browserPolyfillExports.tabs.onActivated.addListener((event) => {
  if (KeeLog && KeeLog.debug)
    KeeLog.debug("Tab activated with id: " + event.tabId);
  onTabActivated(event.tabId);
});
function onTabActivated(tabId) {
  updateForegroundTab(tabId);
  if (window.kee) {
    commandManager.setupContextMenuItems();
  }
}
function updateForegroundTab(tabId) {
  if (window.kee && window.kee.foregroundTabId !== tabId) {
    window.kee.foregroundTabId = tabId;
    if (window.kee.tabStates.has(tabId) && window.kee.tabStates.get(tabId).framePorts) {
      if (KeeLog && KeeLog.debug)
        KeeLog.debug("kee activated on tab: " + tabId);
      window.kee.tabStates.get(tabId).framePorts.forEach((port) => {
        port.postMessage({
          isForegroundTab: true,
          action: Action.DetectForms,
          resetState: window.kee.store.state
        });
      });
    }
  }
}
if (!isFirefox()) {
  browserPolyfillExports.runtime.onInstalled.addListener(() => {
    var _a;
    const showErrors = () => {
      if (browserPolyfillExports.runtime.lastError) {
        if (KeeLog && KeeLog.error)
          KeeLog.error(browserPolyfillExports.runtime.lastError.message);
        else
          console.error(browserPolyfillExports.runtime.lastError);
      }
    };
    (_a = browserPolyfillExports.runtime.getManifest().content_scripts) == null ? void 0 : _a.forEach((script) => {
      const allFrames = script.all_frames;
      const url = script.matches;
      const vaultURLs = [
        "https://app-dev.kee.pm:8087/",
        "https://app-beta.kee.pm/",
        "https://app.kee.pm/",
        "https://keevault.pm/"
      ];
      const loadContentScripts = (tab) => {
        if (tab.url && tab.url.startsWith("chrome://"))
          return;
        if (script.exclude_globs && script.exclude_globs.length > 0) {
          if (vaultURLs.some((excludedURL) => tab.url.startsWith(excludedURL)))
            return;
        }
        if (script.include_globs && script.include_globs.length > 0) {
          if (!vaultURLs.some((includedURL) => tab.url.startsWith(includedURL)))
            return;
        }
        (script.js || []).forEach((file) => {
          browserPolyfillExports.tabs.executeScript(tab.id, { allFrames, file }).then(showErrors);
        });
        (script.css || []).forEach((file) => {
          browserPolyfillExports.tabs.insertCSS(tab.id, { allFrames, file }).then(showErrors);
        });
      };
      browserPolyfillExports.tabs.query({ url }).then((tabs) => tabs.forEach(loadContentScripts));
    });
  });
}
browserPolyfillExports.runtime.onInstalled.addListener(async function(details) {
  if (details.reason === "install") {
    const vaultTabs = await browserPolyfillExports.tabs.query({
      url: ["https://keevault.pm/*", "https://app-beta.kee.pm/*", "https://app-dev.kee.pm/*"]
    });
    if (vaultTabs && vaultTabs[0]) {
      browserPolyfillExports.tabs.update(vaultTabs[0].id, { active: true });
      browserPolyfillExports.windows.update(vaultTabs[0].windowId, { focused: true });
    } else {
      browserPolyfillExports.tabs.create({
        url: "/dist/release-notes/install-notes.html"
      });
    }
  }
});
browserPolyfillExports.runtime.onUpdateAvailable.addListener(async () => {
  await configManager.setASAP({ mustShowReleaseNotesAtStartup: true });
  if (await browserPolyfillExports.idle.queryState(userBusySeconds) === "idle") {
    browserPolyfillExports.runtime.reload();
  } else {
    browserPolyfillExports.idle.setDetectionInterval(userBusySeconds);
    browserPolyfillExports.idle.onStateChanged.addListener((status) => {
      if (status !== "active") {
        browserPolyfillExports.runtime.reload();
      }
    });
    window.setTimeout(() => {
      browserPolyfillExports.runtime.reload();
    }, maxUpdateDelaySeconds * 1e3);
  }
});
configManager.load(startup);
