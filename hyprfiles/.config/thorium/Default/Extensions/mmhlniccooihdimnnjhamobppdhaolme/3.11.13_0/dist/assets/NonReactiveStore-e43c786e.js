import { d as defaults, a as addNotification, r as removeFieldFromActiveEntry, u as updateActiveKeePassDatabaseIndex, b as updateConnected, c as updateConnectedWebsocket, e as updateCurrentSearchTerm, f as updateEntryUpdateStartedAtTimestamp, g as updateGeneratedPassword, h as updateKeePassDatabases, i as updateLastKeePassRPCRefresh, j as updateLatestConnectionError, k as updateLoginsFound, l as updateNotifications, m as updatePasswordProfiles, n as updateSaveEntryResult, o as updateSaveState, p as updateSearchResultWithFullDetails, q as updateSearchResults, s as updateSubmittedData, M as Mutation, S as SaveState } from "./Mutation-73212a9c.js";
import { F as Field } from "./Database-95399186.js";
function undefAbort(payload) {
  if (payload === void 0) {
    throw new Error(
      "FATAL! undefined value sent to commit that must never set an undefined value. No-one knows what will happen now but Kee is probably broken in some way until a browser restart."
    );
  }
}
class NonReactiveStore {
  constructor(distributeAction) {
    this.distributeAction = distributeAction;
    this._state = defaults;
  }
  get state() {
    return this._state;
  }
  onRemoteMessage(sourcePort, mutation) {
    if (mutation.type === addNotification) {
      this.addNotification(mutation.payload, false);
    } else if (mutation.type === removeFieldFromActiveEntry) {
      this.removeFieldFromActiveEntry(mutation.payload, false);
    } else if (mutation.type === updateActiveKeePassDatabaseIndex) {
      this.updateActiveKeePassDatabaseIndex(mutation.payload, false);
    } else if (mutation.type === updateConnected) {
      this.updateConnected(mutation.payload, false);
    } else if (mutation.type === updateConnectedWebsocket) {
      this.updateConnectedWebsocket(mutation.payload, false);
    } else if (mutation.type === updateCurrentSearchTerm) {
      this.updateCurrentSearchTerm(mutation.payload, false);
    } else if (mutation.type === updateEntryUpdateStartedAtTimestamp) {
      this.updateEntryUpdateStartedAtTimestamp(mutation.payload, false);
    } else if (mutation.type === updateGeneratedPassword) {
      this.updateGeneratedPassword(mutation.payload, false);
    } else if (mutation.type === updateKeePassDatabases) {
      this.updateKeePassDatabases(mutation.payload, false);
    } else if (mutation.type === updateLastKeePassRPCRefresh) {
      this.updateLastKeePassRPCRefresh(mutation.payload, false);
    } else if (mutation.type === updateLatestConnectionError) {
      this.updateLatestConnectionError(mutation.payload, false);
    } else if (mutation.type === updateLoginsFound) {
      this.updateLoginsFound(mutation.payload, false);
    } else if (mutation.type === updateNotifications) {
      this.updateNotifications(mutation.payload, false);
    } else if (mutation.type === updatePasswordProfiles) {
      this.updatePasswordProfiles(mutation.payload, false);
    } else if (mutation.type === updateSaveEntryResult) {
      this.updateSaveEntryResult(mutation.payload, false);
    } else if (mutation.type === updateSaveState) {
      this.updateSaveState(mutation.payload, false);
    } else if (mutation.type === updateSearchResultWithFullDetails) {
      this.updateSearchResultWithFullDetails(mutation.payload, false);
    } else if (mutation.type === updateSearchResults) {
      this.updateSearchResults(mutation.payload, false);
    } else if (mutation.type === updateSubmittedData) {
      this.updateSubmittedData(mutation.payload, false);
    }
  }
  resetTo(s) {
    this._state = s;
  }
  updateActiveKeePassDatabaseIndex(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.ActiveKeePassDatabaseIndex = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateActiveKeePassDatabaseIndex, payload));
  }
  updateConnected(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.connected = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateConnected, payload));
  }
  updateConnectedWebsocket(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.connectedWebsocket = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateConnectedWebsocket, payload));
  }
  updateCurrentSearchTerm(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.currentSearchTerm = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateCurrentSearchTerm, payload));
  }
  updateKeePassDatabases(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.KeePassDatabases = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateKeePassDatabases, payload));
  }
  updateLastKeePassRPCRefresh(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.lastKeePassRPCRefresh = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateLastKeePassRPCRefresh, payload));
  }
  updateLatestConnectionError(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.latestConnectionError = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateLatestConnectionError, payload));
  }
  updateLoginsFound(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.loginsFound = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateLoginsFound, payload));
  }
  updateNotifications(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.notifications = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateNotifications, payload));
  }
  updatePasswordProfiles(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.PasswordProfiles = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updatePasswordProfiles, payload));
  }
  updateGeneratedPassword(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.generatedPassword = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateGeneratedPassword, payload));
  }
  updateSubmittedData(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    if (!this.state.saveState) {
      this.state.saveState = new SaveState();
    }
    this.state.saveState.submittedData = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateSubmittedData, payload));
  }
  updateSaveState(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.saveState = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateSaveState, payload));
  }
  updateSearchResults(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.searchResults = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateSearchResults, payload));
  }
  updateSearchResultWithFullDetails(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    const id = payload.uuid;
    for (const s of this.state.searchResults) {
      if (s.uuid === id) {
        s.fullDetails = payload;
        break;
      }
    }
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateSearchResultWithFullDetails, payload));
  }
  addNotification(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.notifications.push(payload);
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(addNotification, payload));
  }
  updateSaveEntryResult(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.saveEntryResult = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateSaveEntryResult, payload));
  }
  removeFieldFromActiveEntry(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    const firstTextFieldIndex = this.state.saveState.newEntry.fields.findIndex(
      (f) => f.type === "text"
    );
    const firstPasswordFieldIndex = this.state.saveState.newEntry.fields.findIndex(
      (f) => f.type === "password"
    );
    const originalFieldIndex = this.state.saveState.newEntry.fields.findIndex(
      (f) => f.uuid === payload
    );
    this.state.saveState.newEntry.fields.splice(originalFieldIndex, 1);
    if (originalFieldIndex === firstTextFieldIndex) {
      const newUsernameIndex = this.state.saveState.newEntry.fields.findIndex(
        (f) => f.type === "text"
      );
      if (newUsernameIndex >= 0) {
        const newUsername = this.state.saveState.newEntry.fields.splice(newUsernameIndex, 1)[0];
        this.state.saveState.newEntry.fields.splice(
          originalFieldIndex,
          0,
          new Field({ ...newUsername, name: "KeePass username" })
        );
      }
    } else if (originalFieldIndex === firstPasswordFieldIndex) {
      const newPasswordIndex = this.state.saveState.newEntry.fields.findIndex(
        (f) => f.type === "password"
      );
      if (newPasswordIndex >= 0) {
        const newPassword = this.state.saveState.newEntry.fields.splice(newPasswordIndex, 1)[0];
        this.state.saveState.newEntry.fields.splice(
          originalFieldIndex,
          0,
          new Field({ ...newPassword, name: "KeePass password" })
        );
      }
    }
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(removeFieldFromActiveEntry, payload));
  }
  updateEntryUpdateStartedAtTimestamp(payload, distribute = true) {
    var _a;
    undefAbort(payload);
    this.state.entryUpdateStartedAtTimestamp = payload;
    if (distribute)
      (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateEntryUpdateStartedAtTimestamp, payload));
  }
}
export {
  NonReactiveStore as N
};
