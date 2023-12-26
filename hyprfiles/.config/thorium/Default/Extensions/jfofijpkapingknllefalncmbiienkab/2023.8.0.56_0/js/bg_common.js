const HostExprType = Object.freeze({"regular":0, "regex":1});
const hostname_salt = "Kd3fIjAq";
const defExtVersion = "2022.12.0.1";

var avc = null; //  AV connection 
var avcActive = false;
var avcMsgs = [];
try {var verValue = browser.runtime.getManifest().version} catch {var verValue = defExtVersion};
var version = {"extension_version": verValue};

checkAvc();
browser.storage.local.remove("reported_sites");

//  Extension event handler 
browser.runtime.onMessage.addListener(function(msg, sender, callback) {

    if (msg.action == "exclude_domain") {
        excludeDomain(msg.data.hostname, msg.data.blocked_url, sender.tab.id);
    }

});

// When we exclude the domain, we want to "visit the website anyway".
// So once we save the new exluded domain list, we want to revisit the blocked page.
function excludeDomain(hostname, blocked_url, tabId) {

  var excluded_domain_list = [];

  browser.storage.local.get("excluded_domain_list").then(function(object) {
      function UpdateTab() {
        if (blocked_url)
          updateTabURL(tabId, blocked_url);
      }
      if (object.excluded_domain_list)
          excluded_domain_list = object.excluded_domain_list;

      if (!excluded_domain_list.includes(hostname)) {
        excluded_domain_list.push(hostname);

        browser.storage.local.set({
            "excluded_domain_list": excluded_domain_list
        }).then(function() {
          UpdateTab();
        });
      } else {
        UpdateTab();
      }
  });
}

function reloadPage(name) {
  var url = browser.runtime.getURL(name);
  browser.tabs.query({}).then(tabs => {
  
    for (const tab of tabs) {
      if (tab.url == url) {
        browser.tabs.reload(tab.id, {bypassCache: true});
        break;
      }
    }
  });
}

function clearCache(){
  return setSetting("cache_object", {});
}

function onHostRulesUpdate() {
  clearCache();
  reloadBlockedIfAllowedNow();
}

function matchesToOneOf(rules, exprtype, hostname, res) {
  if (rules && (rules.length > 0)) {
    for (let rule of rules) {
      
      if (rule.ExprType != exprtype) continue;

      switch (rule.ExprType) {
        case  HostExprType.regular: expr = `^([\\w\\-]+\\.)*${escapeRegExp(rule.NameExpr)}$`; break; //  domain itself and sub-domains 
        case  HostExprType.regex: expr = rule.NameExpr; break;
        default: continue;
      }

      regex = newRegExp(expr, false, "i");
      if (regex && hostname.match(regex)) { 
        res.host_rule = rule.NameExpr;
        return true;
      }
    }
  }
  return false;
}

function checkHostRulesForHost(host_rules, data, onBlock, onAllow, onUnknown) {
  function checkIt(rules, exprtype, data, onFound) {
    if (matchesToOneOf(rules, exprtype, data.hostname, data)) {
      if (onFound && data.host_rule) {
        onFound(data);
        return true;
      }
    }
    return false;
  }

  data.host_rule = null;
  if (host_rules) {
    if (checkIt(host_rules.block, HostExprType.regular, data, onBlock)) return;
    if (checkIt(host_rules.allow, HostExprType.regular, data, onAllow)) return;
    if (checkIt(host_rules.block, HostExprType.regex, data, onBlock)) return;
    if (checkIt(host_rules.allow, HostExprType.regex, data, onAllow)) return;
  }
  if (onUnknown) {
    onUnknown(data)
  }
}

function checkHostRulesForHostAsync(data, onBlock, onAllow, onUnknown) {
  browser.storage.local.get('host_rules').then(function(object) {
    checkHostRulesForHost(object.host_rules, data, onBlock, onAllow, onUnknown);
  });
}

function doReloadBlocked(data) {
  eLog(`Reloading: ${data.hostname}, ${JSON.stringify(data.host_rule)}, ${data.blocked_url.href}`);
  updateTabURL(data.tabid, data.blocked_url.href);
  reloadPage('options.html');
}


function createHostnameArray(hostname) {

  var result_arr = [];

  var temp_arr = hostname.split('.');

  while (temp_arr.length) {
      var hostname = temp_arr.join('.');
      result_arr.push(hostname);
      temp_arr.shift();
  }

  return result_arr;

}

function createHash(domain) {

  var encrypted = md5(hostname_salt + domain.toLowerCase());

  return encrypted.toString().toUpperCase();

}

function getStringOfHashes(arr) {
var string = "";

arr.forEach(domain => {
    string += createHash(domain);
    string += ",";
});

string = string.slice(0, -1);


return string;
}

function updateTabURL(tabId, url) {
  if (tabId < 0) {
      browser.tabs.create({
          url:url
      });
  } else {
      browser.tabs.update(tabId, {
          url: url
      });
  }
}

function findSubdomainByHash(hostname, hash) {
var res = "";
var arr = createHostnameArray(hostname);

for (let domain of arr ) {
  if (createHash(domain) == hash) {
    res = domain;
    break;
  }
};

return res;
}

function avcReconnectRequired() {
return !avc || (avc.readyState != WebSocket.CONNECTING && avc.readyState != WebSocket.OPEN)
}

function avcSendMessage(msg) {
if (avcReconnectRequired()) {
  avcMsgs.push(msg)
  eLog("queued: " + msg);
  checkAvc();
} else {
  avc.send(msg);
  eLog("sent: " + msg);
}
}

function sameValue(left, right) {
if (left instanceof Object) {
  if (right instanceof  Object) {
    return JSON.stringify(left) == JSON.stringify(right)
  }
} else {
  return left === right;
}
return false;
}

function saveSetting(id, value, onUpdated){
browser.storage.local.get(id).then(object => {
  if (sameValue(object[id], value)) {
    eLog(`Setting "${id}" is not saved as not changed.`);
    if (eApi.enableLogging && onUpdated) { onUpdated() }
  } else {
    object[id] = value;
    browser.storage.local.set(object).then(() => { if (onUpdated) { onUpdated() } });
  }
});
}

function newRegExp(value, convertFromPCRE = false, flags = '') {
function switchFlag(src, flag) {
  idx = src.indexOf(flag);
  return (idx == -1) ? src + flag : src.slice(0, idx) + str.slice(idx + 1);
}
var regex = null;
try {
  if (convertFromPCRE) {
    rexp = new RegExp('^\\(\\?([gmiu]+)\\)');
    match = rexp.exec(value);
    if (match) {
      match[1].split('').forEach(itm => { if (flags.indexOf(itm) == -1) { flags += itm} });
      value = value.replace(rexp, '');
    }
  }
  try {
    regex = new RegExp(value, flags);
  } catch {
    regex = new RegExp(value, switchFlag(flags, 'u'));
  }
} catch {
  eLog(`Wrong regex: "${value}"`);
  regex = null;
}
return regex;
}

function escapeRegExp(string) {
return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

function unescapeRegExp(string) {
for (c in ["^", "$", "*", "+", "?", ".", "(", ")", "|", "{", "}", "[", "]", "\\"]) {
  string = string.replace(new RegExp(`\\\\(\\${c})`, 'g'), '$1');
}
return string;
}

function makeSureRulesAreObjects(host_rules) {
function processList(hosts_list) {
  if (hosts_list && hosts_list.length > 0 && typeof hosts_list[0] == 'string') {
    hosts_list.forEach(function (value, i) {
      value = value.replace(/^\(\.\+\\\.\|\^\)/, '');
      value = value.replace(/\$$/, '');
      value = unescapeRegExp(value);

      hosts_list[i] = {NameExpr: value, ExprType: 0};
    });      
  }
}

processList(host_rules.allow);
processList(host_rules.block);

saveSetting("host_rules", host_rules, onHostRulesUpdate);
}

function processAvcMessage(msg) {
if (msg.command_answer) {
  eLog("received answer: " + JSON.stringify(msg.command_answer));
  if (msg.command_answer.extension_state) {
    saveSetting("extension_state", msg.command_answer.extension_state, iconRefresh);
  }
  if (msg.command_answer.host_rules) {
    makeSureRulesAreObjects(msg.command_answer.host_rules);
  }
  if (msg.command_answer.server_product) {
    saveSetting("server_product", msg.command_answer.server_product);
  }
} else if (msg.setting_changed) {
  eLog("received 'setting changed': " + JSON.stringify(msg.setting_changed));
  msg.setting_changed.forEach(elem => avcSendMessage(elem));
} else {
  eLog("received: " + JSON.stringify(msg));
}
}

function checkAvc() {
if (avcReconnectRequired()) {
  avc = undefined;
  avcMsgs = [];
  avcMsgs.push(JSON.stringify(version));
  avcMsgs.push('server_product');
  avcMsgs.push('settings');

  avc = new WebSocket("ws://127.0.0.1:42357");
  avc.onopen = function() {
    avcActive = true;
    eLog("WebSocket opened");
    while (avcMsgs.length > 0) {
      avcSendMessage(avcMsgs.shift());
    }
  }
  avc.onclose = function(e) {
    avcActive = false;
    eLog(`WebSocket closed (code: ${e.code}).`);
    if (avcMsgs.length > 0) {
      eLog(`${avcMsgs.length} message(s) was(were) removed from queue.`);
      avcMsgs = [];
    }
  }
  avc.onmessage = function(e) {
    try { 
      msg = JSON.parse(e.data);
    } catch {
      msg = {error: e.data};
    }
    processAvcMessage(msg);
  }
  avc.onerror = function() {
    eLog("WebSocket error.");
  };
  
}
}

function RemoveProtocol(url){
  if (!url) {
    return '';
  } else {
    return url.replace(/(^\w+:|^)\/\//, '');
  }
}

function SameUrl(left, right) {
  return (RemoveProtocol(left) == RemoveProtocol(right));
}
