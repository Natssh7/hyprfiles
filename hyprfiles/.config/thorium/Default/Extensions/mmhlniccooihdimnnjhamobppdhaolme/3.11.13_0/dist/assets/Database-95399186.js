import { u as utils } from "./ConfigManager-21f0f76b.js";
import { $ as $STR } from "./DollarPolyfills-e1e75c6d.js";
var SessionType = /* @__PURE__ */ ((SessionType2) => {
  SessionType2["Event"] = "event";
  SessionType2["Websocket"] = "websocket";
  return SessionType2;
})(SessionType || {});
class Locator {
  constructor(locator) {
    this.id = locator.id || "";
    this.name = locator.name || "";
    this.type = locator.type || "";
    this.query = locator.query;
    this.labels = locator.labels;
    this.autocompleteValues = locator.autocompleteValues;
  }
  //TODO:4: Things like MaxLength that can be used to both help identify the field and generate new values/passwords
}
class EntryDto {
}
var FormFieldTypeDTO = /* @__PURE__ */ ((FormFieldTypeDTO2) => {
  FormFieldTypeDTO2["radio"] = "FFTradio";
  FormFieldTypeDTO2["username"] = "FFTusername";
  FormFieldTypeDTO2["text"] = "FFTtext";
  FormFieldTypeDTO2["password"] = "FFTpassword";
  FormFieldTypeDTO2["select"] = "FFTselect";
  FormFieldTypeDTO2["checkbox"] = "FFTcheckbox";
  return FormFieldTypeDTO2;
})(FormFieldTypeDTO || {});
class Field {
  constructor(field) {
    this.name = field.name || "";
    this.value = field.value || "";
    this.resetValue = field.resetValue || "";
    this.uuid = field.uuid || utils.newGUID();
    this.type = field.type || "text";
    this.locators = field.locators || [];
  }
  static getDisplayValueInternal(field, revealPasswords, replacementIfProtected) {
    if (field.type === "boolean") {
      return field.value === "KEEFOX_CHECKED_FLAG_TRUE" ? $STR("enabled") : $STR("disabled");
    } else {
      return field.type === "password" && !revealPasswords ? replacementIfProtected : field.value;
    }
  }
  static getDisplayValue(field, revealPasswords) {
    return Field.getDisplayValueInternal(
      field,
      revealPasswords,
      "*".repeat(field.value.length)
    );
  }
  static getDisplayName(field) {
    if (field.name === "KeePass username") {
      return $STR("username");
    } else if (field.name === "KeePass password") {
      return $STR("password");
    } else {
      return field.name ? field.name : "[ " + $STR("no_name") + " ]";
    }
  }
  static getDisplayTooltip(field, revealPasswords) {
    return Field.getDisplayName(field) + ": " + Field.getDisplayValueInternal(field, revealPasswords, $STR("click_to_reveal_hide"));
  }
  static typeFromDOMtype(domType) {
    switch (domType) {
      case "password":
        return "password";
      case "radio":
        return "existing";
      case "checkbox":
        return "boolean";
      case "select-one":
        return "existing";
      default:
        return "text";
    }
  }
  // By convention the first non-password item will be the username and the password will be either 1st or 2nd in the list
  static combineDomFieldLists(usernameIndex, otherFields, passwords) {
    const fields = [];
    if (usernameIndex >= 0 && otherFields[usernameIndex]) {
      fields.push(otherFields[usernameIndex]);
    }
    passwords.forEach((f) => {
      fields.push(f);
    });
    otherFields.forEach((f, index) => {
      if (index !== usernameIndex) {
        fields.push(f);
      }
    });
    return fields;
  }
  static fromDOM(element, domType, value) {
    const labels = collectLabels(element);
    return new Field({
      uuid: utils.newGUID(),
      name: labels && labels.length ? labels[0] : element.name,
      locators: [
        new Locator({
          name: element.name,
          id: element.id,
          type: domType,
          labels,
          autocompleteValues: collectAutocompleteValues(element)
        })
      ],
      value,
      type: Field.typeFromDOMtype(domType)
    });
  }
  static fromKPRPCFieldDTO(f) {
    let type = "text";
    let locatorType = "text";
    switch (f.type) {
      case FormFieldTypeDTO.password:
        type = "password";
        locatorType = "password";
        break;
      case FormFieldTypeDTO.radio:
        type = "existing";
        locatorType = "radio";
        break;
      case FormFieldTypeDTO.checkbox:
        type = "boolean";
        locatorType = "checkbox";
        break;
      case FormFieldTypeDTO.select:
        type = "existing";
        locatorType = "select";
        break;
      case FormFieldTypeDTO.username:
        type = "text";
        locatorType = "text";
        break;
      case FormFieldTypeDTO.text:
        type = "text";
        locatorType = "text";
        break;
    }
    return new Field({
      name: f.displayName || f.name,
      uuid: utils.newGUID(),
      value: f.value,
      resetValue: f.value,
      type,
      locators: [
        new Locator({
          id: f.id,
          name: f.name,
          type: locatorType
        })
      ]
    });
  }
  static toKPRPCFieldDTO(f, isUsername) {
    let fft;
    switch (f.locators[0].type) {
      case "password":
        fft = FormFieldTypeDTO.password;
        break;
      case "radio":
        fft = FormFieldTypeDTO.radio;
        break;
      case "checkbox":
        fft = FormFieldTypeDTO.checkbox;
        break;
      case "select-one":
        fft = FormFieldTypeDTO.select;
        break;
      default:
        fft = isUsername ? FormFieldTypeDTO.username : FormFieldTypeDTO.text;
        break;
    }
    return {
      displayName: f.name,
      id: f.locators[0].id,
      name: f.locators[0].name,
      type: fft,
      value: f.value,
      page: -1
    };
  }
}
function collectLabels(element) {
  var _a, _b, _c, _d;
  const labels = [];
  const labelsCount = ((_a = element.labels) == null ? void 0 : _a.length) || 0;
  for (let i = 0; i < labelsCount; i++) {
    const label = element.labels[i];
    if (label == null ? void 0 : label.innerText)
      labels.push(label.innerText);
  }
  const ariaLabel = (_b = element.getAttribute("aria-label")) == null ? void 0 : _b.toLowerCase();
  if (ariaLabel)
    labels.push(ariaLabel);
  const ariaLabelIds = [];
  (_c = element.getAttribute("aria-labelledby")) == null ? void 0 : _c.trim().split(" ").forEach((id) => {
    if (id)
      ariaLabelIds.push(id);
  });
  (_d = element.getAttribute("aria-describedby")) == null ? void 0 : _d.trim().split(" ").forEach((id) => {
    if (id)
      ariaLabelIds.push(id);
  });
  ariaLabelIds.forEach((id) => {
    const labelElement = document.getElementById(id);
    if (labelElement == null ? void 0 : labelElement.innerText)
      labels.push(labelElement.innerText);
  });
  return labels.length ? labels : void 0;
}
function collectAutocompleteValues(element) {
  var _a, _b;
  const values = [];
  (_b = (_a = element.attributes["autocomplete"]) == null ? void 0 : _a.value) == null ? void 0 : _b.trim().split(" ").forEach((v) => {
    if (v)
      values.push(v.toLowerCase());
  });
  return values.length ? values : void 0;
}
class GroupSummary {
  constructor(g) {
    this.title = g.title || "";
    this.uuid = g.uuid || utils.newGUID();
    this.icon = g.icon || { version: 1, iconImageData: "" };
    this.path = g.path || "UNKNOWN PATH";
  }
  static fromKPRPCGroupSummaryDTO(groupSummaryDto) {
    return new GroupSummary({
      title: groupSummaryDto.title,
      uuid: groupSummaryDto.uniqueID,
      icon: { version: 1, iconImageData: groupSummaryDto.iconImageData },
      path: groupSummaryDto.path
    });
  }
  static fromGroup(group) {
    return new GroupSummary({
      title: group.title,
      uuid: group.uuid,
      icon: group.icon,
      path: group.path
    });
  }
}
const TemporaryIDString = "TEMPORARY ID TO IDENTIFY THIS AS A DIRTY ENTRY THAT DOESN'T EXIST IN SOURCE DATABASE YET";
class Entry {
  constructor(e) {
    this.alwaysAutoFill = e.alwaysAutoFill || false;
    this.alwaysAutoSubmit = e.alwaysAutoSubmit || false;
    this.neverAutoFill = e.neverAutoFill || false;
    this.neverAutoSubmit = e.neverAutoSubmit || false;
    this.URLs = e.URLs || [];
    this.fields = e.fields || [];
    this.httpRealm = e.httpRealm || "";
    this.parentGroup = e.parentGroup || null;
    this.uuid = e.uuid || utils.newGUID();
    this.title = e.title || "";
    this.matchAccuracy = e.matchAccuracy || 0;
    this.icon = e.icon || { version: 1, iconImageData: "" };
    this.database = e.database || new Database({});
    this.relevanceScore = e.relevanceScore;
    this.lowFieldMatchRatio = e.lowFieldMatchRatio;
    this.formIndex = e.formIndex;
    this.entryIndex = e.entryIndex;
    this.isPreferredMatch = e.isPreferredMatch;
  }
  static getUsernameField(entry) {
    return entry.fields.find((f) => f.type === "text");
  }
  static getPasswordField(entry) {
    return entry.fields.find((f) => f.type === "password");
  }
  static fromKPRPCEntryDTO(entryDto, db) {
    const sortedFields = [];
    let maximumPage = 1;
    const usernameIndex = entryDto.formFieldList.findIndex(
      (f) => f.type === FormFieldTypeDTO.username
    );
    const unsortedFields = entryDto.formFieldList.map((f) => {
      if (f.page > maximumPage)
        maximumPage = f.page;
      return Field.fromKPRPCFieldDTO(f);
    });
    const firstPasswordIndex = unsortedFields.findIndex((f) => f.type === "password");
    if (usernameIndex > -1) {
      sortedFields.push(unsortedFields[usernameIndex]);
    }
    if (firstPasswordIndex > -1) {
      sortedFields.push(unsortedFields[firstPasswordIndex]);
    }
    unsortedFields.forEach((f, i) => {
      if (i !== usernameIndex && i !== firstPasswordIndex) {
        sortedFields.push(f);
      }
    });
    const entry = new Entry({
      URLs: entryDto.uRLs,
      neverAutoFill: entryDto.neverAutoFill,
      alwaysAutoFill: entryDto.alwaysAutoFill,
      neverAutoSubmit: entryDto.neverAutoSubmit,
      alwaysAutoSubmit: entryDto.alwaysAutoSubmit,
      icon: { version: 1, iconImageData: entryDto.iconImageData },
      parentGroup: GroupSummary.fromKPRPCGroupSummaryDTO(entryDto.parent),
      database: db,
      matchAccuracy: entryDto.matchAccuracy,
      httpRealm: entryDto.hTTPRealm,
      uuid: entryDto.uniqueID,
      title: entryDto.title,
      fields: sortedFields
    });
    return entry;
  }
  static toKPRPCEntryDTO(entry) {
    const entryDto = new EntryDto();
    entryDto.alwaysAutoFill = entry.alwaysAutoFill;
    entryDto.alwaysAutoSubmit = entry.alwaysAutoSubmit;
    entryDto.formFieldList = entry.fields.map((f, i) => Field.toKPRPCFieldDTO(f, i === 0));
    entryDto.hTTPRealm = entry.httpRealm;
    entryDto.iconImageData = entry.icon.iconImageData;
    entryDto.neverAutoFill = entry.neverAutoFill;
    entryDto.neverAutoSubmit = entry.neverAutoSubmit;
    entryDto.title = entry.title;
    entryDto.uRLs = entry.URLs;
    return entryDto;
  }
}
class EntrySummary {
  constructor(e) {
    this.icon = e.icon || { version: 1, iconImageData: "" };
    this.usernameValue = e.usernameValue || "<no username>";
    this.usernameName = e.usernameName || "<no username>";
    this.path = e.path || "UNKNOWN PATH";
    this.title = e.title || "";
    this.uRLs = e.uRLs || [];
    this.url = (e == null ? void 0 : e.url) || "";
    this.uuid = e.uuid || utils.newGUID();
    this.dbFileName = e.dbFileName || "";
    this.relevanceScore = e.relevanceScore;
    this.fullDetails = e.fullDetails;
    this.isPreferredMatch = e.isPreferredMatch;
  }
  static fromEntry(entry) {
    var _a, _b;
    return new EntrySummary({
      icon: entry.icon,
      usernameValue: (_a = Entry.getUsernameField(entry)) == null ? void 0 : _a.value,
      usernameName: (_b = Entry.getUsernameField(entry)) == null ? void 0 : _b.name,
      title: entry.title,
      uRLs: entry.URLs,
      url: entry == null ? void 0 : entry.URLs[0],
      uuid: entry.uuid,
      dbFileName: entry.database.fileName,
      fullDetails: entry,
      isPreferredMatch: entry.isPreferredMatch
    });
  }
  static fromKPRPCEntrySummaryDTO(entrySummaryDto, path, dbFileName) {
    return new EntrySummary({
      icon: { version: 1, iconImageData: entrySummaryDto.iconImageData },
      usernameValue: entrySummaryDto.usernameValue,
      usernameName: entrySummaryDto.usernameName,
      path,
      title: entrySummaryDto.title,
      uRLs: entrySummaryDto.uRLs,
      url: entrySummaryDto == null ? void 0 : entrySummaryDto.uRLs[0],
      uuid: entrySummaryDto.uniqueID,
      dbFileName
    });
  }
}
class Group {
  //childEntries: Entry[] - this is only needed if we ever request GetAllDatabases(true) but Kee currently has no need for this KPRPC feature
  constructor(g) {
    this.title = g.title || "";
    this.uuid = g.uuid || utils.newGUID();
    this.icon = g.icon || { version: 1, iconImageData: "" };
    this.path = g.path || "UNKNOWN PATH";
    this.entrySummaries = g.entrySummaries || [];
    this.groups = g.groups || [];
  }
  static fromKPRPCGroupDTO(groupDto, dbFileName) {
    return new Group({
      title: groupDto.title,
      uuid: groupDto.uniqueID,
      icon: { version: 1, iconImageData: groupDto.iconImageData },
      path: groupDto.path,
      entrySummaries: groupDto.childLightEntries.map(
        (childLightEntry) => EntrySummary.fromKPRPCEntrySummaryDTO(childLightEntry, groupDto.path, dbFileName)
      ),
      groups: groupDto.childGroups.map(
        (childGroup) => this.fromKPRPCGroupDTO(childGroup, dbFileName)
      )
    });
  }
  static containsId(group, id) {
    if (group.uuid === id)
      return true;
    if (group.groups && group.groups.some((g) => Group.containsId(g, id)))
      return true;
    return false;
  }
  static matchingId(group, id) {
    if (group.uuid === id) {
      return group;
    }
    for (const childGroup of group.groups) {
      const matchingChildGroup = Group.matchingId(childGroup, id);
      if (matchingChildGroup) {
        return matchingChildGroup;
      }
    }
    return null;
  }
}
class Database {
  constructor(db) {
    this.name = db.name || "";
    this.fileName = db.fileName || "";
    this.icon = db.icon || { version: 1, iconImageData: "" };
    this.root = db.root || new Group({});
    this.active = db.active || false;
    this.sessionType = db.sessionType || SessionType.Event;
    this.sessionFeatures = db.sessionFeatures || [""];
  }
  static fromKPRPCDatabaseDTO(dto, sessionType, sessionFeatures) {
    return new Database({
      name: dto.name,
      fileName: dto.fileName,
      icon: { version: 1, iconImageData: dto.iconImageData },
      root: Group.fromKPRPCGroupDTO(dto.root, dto.fileName),
      active: dto.active,
      sessionType,
      sessionFeatures
    });
  }
}
export {
  Database as D,
  Entry as E,
  Field as F,
  GroupSummary as G,
  Locator as L,
  TemporaryIDString as T,
  EntrySummary as a,
  Group as b
};
