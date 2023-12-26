import { E as Entry } from "./Database-95399186.js";
var Action = /* @__PURE__ */ ((Action2) => {
  Action2["CloseAllPanels"] = "closeAllPanels";
  Action2["DetectForms"] = "detectForms";
  Action2["ResetForms"] = "resetForms";
  Action2["GetPasswordProfiles"] = "getPasswordProfiles";
  Action2["GeneratePassword"] = "generatePassword";
  Action2["ManualFill"] = "manualFill";
  Action2["Primary"] = "primary";
  Action2["ShowMatchedLoginsPanel"] = "showMatchedLoginsPanel";
  Action2["PageHide"] = "pageHide";
  Action2["OpenKeePass"] = "openkeepass";
  Action2["CreateEntry"] = "createEntry";
  Action2["UpdateEntry"] = "updateEntry";
  return Action2;
})(Action || {});
const updateActiveKeePassDatabaseIndex = "updateActiveKeePassDatabaseIndex";
const updateConnected = "updateConnected";
const updateConnectedWebsocket = "updateConnectedWebsocket";
const updateCurrentSearchTerm = "updateCurrentSearchTerm";
const updateLatestConnectionError = "updateLatestConnectionError";
const updateLastKeePassRPCRefresh = "updateLastKeePassRPCRefresh";
const updateKeePassDatabases = "updateKeePassDatabases";
const updatePasswordProfiles = "updatePasswordProfiles";
const updateGeneratedPassword = "updateGeneratedPassword";
const updateNotifications = "updateNotifications";
const updateSubmittedData = "updateSubmittedData";
const updateLoginsFound = "updateLoginsFound";
const updateSearchResultWithFullDetails = "updateSearchResultWithFullDetails";
const updateSearchResults = "updateSearchResults";
const addNotification = "addNotification";
const updateSaveState = "updateSaveState";
const updateSaveEntryResult = "updateSaveEntryResult";
const removeFieldFromActiveEntry = "removeFieldFromActiveEntry";
const updateEntryUpdateStartedAtTimestamp = "updateEntryUpdateStartedAtTimestamp";
class SaveState {
  constructor() {
    this.newEntry = new Entry({});
  }
}
const defaults = {
  latestConnectionError: "",
  lastKeePassRPCRefresh: 0,
  ActiveKeePassDatabaseIndex: -1,
  KeePassDatabases: [],
  PasswordProfiles: [],
  notifications: [],
  connected: false,
  connectedWebsocket: false,
  currentSearchTerm: null,
  loginsFound: false,
  searchResults: null,
  saveState: new SaveState(),
  generatedPassword: "",
  saveEntryResult: {
    result: null,
    receivedAt: /* @__PURE__ */ new Date(),
    fileName: null,
    uuid: null
  },
  entryUpdateStartedAtTimestamp: 0
};
class Mutation {
  constructor(type, payload) {
    this.type = type;
    this.payload = payload;
  }
}
export {
  Action as A,
  Mutation as M,
  SaveState as S,
  addNotification as a,
  updateConnected as b,
  updateConnectedWebsocket as c,
  defaults as d,
  updateCurrentSearchTerm as e,
  updateEntryUpdateStartedAtTimestamp as f,
  updateGeneratedPassword as g,
  updateKeePassDatabases as h,
  updateLastKeePassRPCRefresh as i,
  updateLatestConnectionError as j,
  updateLoginsFound as k,
  updateNotifications as l,
  updatePasswordProfiles as m,
  updateSaveEntryResult as n,
  updateSaveState as o,
  updateSearchResultWithFullDetails as p,
  updateSearchResults as q,
  removeFieldFromActiveEntry as r,
  updateSubmittedData as s,
  updateActiveKeePassDatabaseIndex as u
};
