import { G as GroupSummary } from "./Database-95399186.js";
import { K as KeeLog, u as utils } from "./ConfigManager-21f0f76b.js";
class DatabaseSummary {
  constructor(db) {
    this.name = db.name || "";
    this.fileName = db.fileName || "";
    this.icon = db.icon || { version: 1, iconImageData: "" };
    this.root = db.root || new GroupSummary({});
    this.active = db.active || false;
  }
  static fromKPRPCDatabaseSummaryDTO(dto) {
    return new DatabaseSummary({
      name: dto.name,
      fileName: dto.fileName,
      icon: { version: 1, iconImageData: dto.iconImageData },
      root: GroupSummary.fromKPRPCGroupSummaryDTO(dto.root),
      active: dto.active
    });
  }
  static fromDatabase(db) {
    return new DatabaseSummary({
      name: db.name,
      fileName: db.fileName,
      icon: db.icon,
      root: GroupSummary.fromGroup(db.root)
    });
  }
}
function isEntrySummary(item) {
  return !!item.url;
}
function calculateMatchScore(item, keywords, parentGroupMatchScore, searchConfig, filter) {
  if (filter) {
    if (!filter(item))
      return 0;
    if (keywords.length < 1)
      return 1;
  } else if (keywords.length < 1) {
    return 0;
  }
  if (!isEntrySummary(item)) {
    if (parentGroupMatchScore > 0)
      return 1;
    for (const keyword of keywords) {
      if (item.title.toLowerCase().indexOf(keyword) >= 0)
        return 1;
    }
    return 0;
  }
  let matchScore = 0;
  for (const keyword of keywords) {
    let keywordScore = 0;
    if (searchConfig.searchTitles && item.title && item.title.toLowerCase().indexOf(keyword) >= 0) {
      keywordScore += searchConfig.weightTitles;
    }
    if (searchConfig.searchUsernames && item.usernameValue && item.usernameValue.toLowerCase().indexOf(keyword) >= 0) {
      keywordScore += searchConfig.weightUsernames;
    }
    if (searchConfig.searchURLs && item.uRLs && item.uRLs.filter(function(i) {
      return i.toLowerCase().indexOf(keyword) >= 0;
    }).length > 0) {
      keywordScore += searchConfig.weightURLs;
    }
    matchScore += keywordScore * (1 / keywords.length);
  }
  if (parentGroupMatchScore > 0)
    matchScore += searchConfig.weightGroups;
  return matchScore;
}
function resolveConfig(config) {
  if (!config)
    config = {};
  else {
    if (config.version != 1) {
      KeeLog.warn("Unknown search config version. Will use version 1 defaults");
    }
  }
  return {
    version: 1,
    searchAllDatabases: typeof config.searchAllDatabases !== "undefined" ? config.searchAllDatabases : true,
    searchTitles: typeof config.searchTitles !== "undefined" ? config.searchTitles : true,
    searchUsernames: typeof config.searchUsernames !== "undefined" ? config.searchUsernames : true,
    searchGroups: typeof config.searchGroups !== "undefined" ? config.searchGroups : true,
    searchURLs: typeof config.searchURLs !== "undefined" ? config.searchURLs : true,
    weightTitles: config.weightTitles || 2,
    weightUsernames: config.weightUsernames || 1,
    weightGroups: config.weightGroups || 0.25,
    weightURLs: config.weightURLs || 0.75,
    maximumResults: typeof config.maximumResults !== "undefined" ? config.maximumResults : 30,
    onComplete: config.onComplete,
    onMatch: config.onMatch
  };
}
function tokenise(text) {
  const tokens = text.match(/'[^']*'|"[^"]*"|[^\s ]+/g) || [];
  tokens.forEach(function(_value, index, array) {
    array[index] = array[index].replace(/(^['"])|(['"]$)/g, "").replace(/[\s ]+/g, " ").toLowerCase();
  });
  return tokens;
}
class KeeURL {
  constructor(_domain, _url, _isIPAddress) {
    this._domain = _domain;
    this._url = _url;
    this._isIPAddress = _isIPAddress;
  }
  get domain() {
    return this._domain;
  }
  get url() {
    return this._url;
  }
  get isIPAddress() {
    return this._isIPAddress;
  }
  get domainOrIPAddress() {
    return this._domain ?? (this._isIPAddress ? this._url.hostname : "");
  }
  get domainWithPort() {
    if (!this._domain)
      return "";
    if (this._url.port)
      return this._domain + ":" + this._url.port;
    return this._domain;
  }
  static fromString(urlStr) {
    if (!urlStr.startsWith("https://") && !urlStr.startsWith("http://") && !urlStr.startsWith("file://")) {
      urlStr = "https://" + urlStr;
    }
    try {
      const url = new URL(urlStr);
      const isIPAddress = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(
        url.hostname
      );
      const domain = isIPAddress ? null : utils.psl.getDomain(url.hostname);
      return new KeeURL(domain, url, isIPAddress);
    } catch (e) {
      KeeLog.warn("Error processing URL: " + e);
    }
    return null;
  }
}
class SearcherAll {
  constructor(state, config) {
    this.state = state;
    this.searchConfig = resolveConfig(config);
    this.validateConfig();
  }
  execute(query, onComplete, filterDomains) {
    let abort = false;
    const filteringByDomain = filterDomains && filterDomains.length > 0 && Array.isArray(filterDomains) && filterDomains[0].length > 0 ? true : false;
    if (!this.configIsValid) {
      KeeLog.error("You can't execute a search while the search configuration is invalid.");
      abort = true;
    }
    if ((!query || query.length == 0) && !filteringByDomain)
      abort = true;
    if (this.state.KeePassDatabases.length == 0)
      abort = true;
    onComplete = onComplete || this.searchConfig.onComplete;
    if (abort) {
      if (onComplete) {
        onComplete([]);
        return;
      } else {
        return [];
      }
    }
    const results = [];
    const addResult = (result) => {
      if (this.searchConfig.onMatch) {
        result = this.searchConfig.onMatch(result);
        if (result)
          results.push(result);
        else
          return false;
      } else
        results.push(result);
      return true;
    };
    let keywords = [];
    if (Array.isArray(query))
      keywords = query;
    else if (query.length > 0)
      keywords = tokenise(query);
    let filter;
    if (filteringByDomain) {
      filter = (item) => {
        if (!item.uRLs || item.uRLs.length <= 0)
          return false;
        for (const filterDomain of filterDomains) {
          const filteredUrls = item.uRLs.filter((itemURL) => {
            try {
              if (itemURL.indexOf(filterDomain) < 0)
                return false;
              const url = KeeURL.fromString(itemURL);
              return url.domainOrIPAddress === filterDomain;
            } catch (e) {
              return false;
            }
          });
          if (filteredUrls.length > 0)
            return true;
        }
        return false;
      };
    }
    function actualSearch() {
      let databases;
      if (this.searchConfig.searchAllDatabases)
        databases = this.state.KeePassDatabases;
      else
        databases = [this.state.KeePassDatabases[this.state.ActiveKeePassDatabaseIndex]];
      for (let i = 0; i < databases.length; i++) {
        const root = databases[i].root;
        const dbFileName = databases[i].fileName;
        this.treeTraversal(root, keywords, 0, addResult.bind(this), 0, dbFileName, filter);
      }
      if (onComplete)
        onComplete(results);
    }
    if (onComplete) {
      this._makeAsyncTimer = window.setTimeout(actualSearch.bind(this), 1);
      return;
    } else {
      actualSearch.call(this);
      return results;
    }
  }
  validateConfig() {
    this.configIsValid = true;
    if (this.searchConfig.version != 1) {
      KeeLog.warn("Unknown config version");
      this.configIsValid = false;
    }
    if (this.searchConfig.searchAllDatabases !== true && this.searchConfig.searchAllDatabases !== false) {
      KeeLog.warn("searchAllDatabases should be a boolean");
      this.configIsValid = false;
    }
    if (this.searchConfig.searchTitles !== true && this.searchConfig.searchTitles !== false) {
      KeeLog.warn("searchTitles should be a boolean");
      this.configIsValid = false;
    }
    if (this.searchConfig.searchUsernames !== true && this.searchConfig.searchUsernames !== false) {
      KeeLog.warn("searchUsernames should be a boolean");
      this.configIsValid = false;
    }
    if (this.searchConfig.searchGroups !== true && this.searchConfig.searchGroups !== false) {
      KeeLog.warn("searchGroups should be a boolean");
      this.configIsValid = false;
    }
    if (this.searchConfig.searchURLs !== true && this.searchConfig.searchURLs !== false) {
      KeeLog.warn("searchURLs should be a boolean");
      this.configIsValid = false;
    }
    if (isNaN(this.searchConfig.weightTitles) || this.searchConfig.weightTitles <= 0) {
      KeeLog.warn("weightTitles should be a positive number");
      this.configIsValid = false;
    }
    if (isNaN(this.searchConfig.weightUsernames) || this.searchConfig.weightUsernames <= 0) {
      KeeLog.warn("weightUsernames should be a positive number");
      this.configIsValid = false;
    }
    if (isNaN(this.searchConfig.weightGroups) || this.searchConfig.weightGroups <= 0) {
      KeeLog.warn("weightGroups should be a positive number");
      this.configIsValid = false;
    }
    if (isNaN(this.searchConfig.weightURLs) || this.searchConfig.weightURLs <= 0) {
      KeeLog.warn("weightURLs should be a positive number");
      this.configIsValid = false;
    }
    if (isNaN(this.searchConfig.maximumResults) || this.searchConfig.maximumResults <= 0) {
      KeeLog.warn("maximumResults should be a positive number");
      this.configIsValid = false;
    }
    if (this.searchConfig.onComplete != null && typeof this.searchConfig.onComplete !== "function") {
      KeeLog.warn("onComplete should be a function (or ommitted)");
      this.configIsValid = false;
    }
    if (this.searchConfig.onMatch != null && typeof this.searchConfig.onMatch !== "function") {
      KeeLog.warn("onMatch should be a function (or ommitted)");
      this.configIsValid = false;
    }
    return this.configIsValid;
  }
  treeTraversal(branch, keywords, parentGroupMatchScore, addResult, currentResultCount, dbFileName, filter) {
    let totalResultCount = currentResultCount;
    for (const leaf of branch.entrySummaries) {
      const item = leaf;
      const matchResult = calculateMatchScore(
        item,
        keywords,
        parentGroupMatchScore,
        this.searchConfig,
        filter
      );
      if (matchResult > 0) {
        const accepted = addResult({
          ...item,
          ...{ relevanceScore: matchResult }
        });
        if (accepted) {
          totalResultCount++;
          if (totalResultCount >= this.searchConfig.maximumResults) {
            return totalResultCount;
          }
        }
      }
    }
    for (const subBranch of branch.groups) {
      const groupMatchScore = calculateMatchScore(
        { title: subBranch.title },
        keywords,
        parentGroupMatchScore,
        this.searchConfig,
        filter
      );
      totalResultCount = this.treeTraversal(
        subBranch,
        keywords,
        groupMatchScore,
        addResult,
        totalResultCount,
        dbFileName,
        filter
      );
      if (totalResultCount >= this.searchConfig.maximumResults)
        return totalResultCount;
    }
    return totalResultCount;
  }
}
export {
  DatabaseSummary as D,
  KeeURL as K,
  SearcherAll as S,
  calculateMatchScore as c,
  resolveConfig as r,
  tokenise as t
};
