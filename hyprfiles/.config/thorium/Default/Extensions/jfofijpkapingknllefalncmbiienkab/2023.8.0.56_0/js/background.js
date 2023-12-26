importScripts("../lib/browser-polyfill.min.js", "../lib/md5.min.js", "../lib/rc4.js");
importScripts("bg_common.js", "tools.js", "eapi.js", "eapi_storage.js");

// tabs onUpdate handler 
browser.tabs.onUpdated.addListener(checkDomainStatus);
browser.downloads.onCreated.addListener(checkDownloadStatus);

async function FindTabId(url) {
  var tabs = await browser.tabs.query({})
  
  for (const tab of tabs) {
    if (SameUrl(tab.url, url) || SameUrl(tab.pendingUrl, url)) {
      return tab.id;
    }
    parsedurl = new URL(tab.url);
    if (parsedurl.searchParams.get('blocked_url') == url) {
      return tab.id;
    }
  }
  return -1;
}

async function checkDownloadStatus(downloadItem) {
  function OnCancel() {
    return true;
  }
  function OnRemove() {
    return true;
  }
  console.log(downloadItem);
  var answer = await checkUrl(downloadItem.finalUrl);

  if (answer.redirectUrl) {
    console.log(`Redirecting download: to ${answer.redirectUrl}`);
    var id = downloadItem.id;
    var tabid = await FindTabId(downloadItem.finalUrl);
    browser.downloads.cancel(id);
    browser.downloads.removeFile(id);
    browser.downloads.erase({id: id});
    updateTabURL(tabid, answer.redirectUrl);
    if (tabid != -1) {
      browser.tabs.update(tabid, {active: true});
    }
  }
}

async function interogateExternal(uri) {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.text();
    return data;
  }
  catch (error) {
    console.error(`Could not get products: ${error}`);
  }
}


async function checkDomainStatus(tabId, changeInfo, requestDetails) {
  try {
    if ( (changeInfo.status !== 'loading') || (requestDetails.url.match(/^chrome/)) ) {
      return
    }

    console.log(changeInfo);
    console.log(requestDetails);

    var answer = await checkUrl(requestDetails.url);

    if (answer.redirectUrl) {
      updateTabURL(tabId, answer.redirectUrl);
    }

    console.log(answer);
    return answer;
  } catch(error) {
    console.error(`Failed domain status check: ${error}`);
  }
}

async function checkUrl(url) {
  /*
      The chain is:
          . check if extension is on or off
          . check if domain is excluded
          . looking up the local cache (which is saved for 15 minutes) ->
          . requesting the server if nothing was found in local cache ->
          . presenting results.
  */
  try {
    iconRefresh();
    checkAvc();

    var blocked_url = url;
    var hostname = new URL(blocked_url).hostname;
    var answer = null;
    var data = null;
    
    function BlockIt(params){
      var urlParams = new URLSearchParams();

      urlParams.set('hostname', hostname);
      urlParams.set('blocked_url', blocked_url);

      for(var param in params) {
        urlParams.set(param, params[param]);
      }
      
      answer = {redirectUrl: `${browser.runtime.getURL('block_page_template.html')}?${urlParams}`};
    }
    function AllowIt(){
      answer = {};
    }

    async function requestServerForData() {
      var hostname_array = createHostnameArray(hostname);
      var hashes_string = getStringOfHashes(hostname_array);
      var cloudURI = `https://alomar.emsisoft.com/api/v1/url/get/${hashes_string}`;
      var d = await interogateExternal(cloudURI);
      if (d) {
        //save this data to sync cache
        //  Also check if data is ok to save 
        data = d;
        saveDataToLocalCache(hostname, data);
      }
    }

    function saveDataToLocalCache(hostname, data){
      let cache_object = getSetting("cache_object");
      if (cache_object == null) {
        cache_object = {};
      }

      cache_object[hostname] = {
        data: data,
        timeSaved: new Date().getTime()
      };
            
      setSetting("cache_object", cache_object);
    }

  function NoAnswer() {
    return answer == null ? true: null;
  }

  function NoData() {
    return data == null ? true: null;
  }

    function ExtensionDisabled() {
      const state = getSetting("extension_state");
      return (state && state.toLowerCase() == "off");
    }

    if (hostname.match(/alomar\.emsisoft\.com$/)) {
      AllowIt();
    };
    
    if (NoAnswer() && ExtensionDisabled()) {
      AllowIt();
    };

    // checkExcludedDomainList
    if (NoAnswer()) {
      const excluded_domains = getSetting("excluded_domain_list");
      if (excluded_domains && (excluded_domains.indexOf(hostname) > -1)) {
        AllowIt();
      }
    }
 
    // checkHostInAvc
    if (NoAnswer()) {
      await checkHostInAvc({hostname: hostname},
        function onBlock(data){
          BlockIt({"host_rule": data.avcAnswer.host, "content_verdict": data.avcAnswer.type, "deny_visit_anyway":data.avcAnswer.denyvisitanyway , "product_name": getSetting("server_product")});
        },
        AllowIt,   //  onAllow -  doing nothing to allow 
        undefined  //  onUnknown 
      );
    }

    // checkHostRules
    if (NoAnswer()) {
      const host_rules = getSetting("host_rules");
      if (host_rules) {
        checkHostRulesForHost(host_rules, {hostname: hostname},
          function onBlock(data){
            BlockIt({"host_rule": data.host_rule, "product_name": getSetting("server_product")});
          },
          AllowIt,   //  onAllow -  doing nothing to allow 
          undefined  //  onUnknown 
        );
      }
    }

    // lookUpLocalCache
    if (NoAnswer()) {
      const cache_object = getSetting("cache_object")
      if (cache_object) {
        let hostname_object = cache_object[hostname];
        if (hostname_object){
          data = hostname_object.data;
        }
      }
    }

    // requestServerForData
    if (NoAnswer() && NoData()) {
      await requestServerForData()
    }

    // processData
    if (NoAnswer() && data) {
      data = JSON.parse(data);

      var should_block_url = false;

      for (let match of data.matches) {
        var cloud_verdict = match.type;

        var decoded = atob(match.regex);
        var per_url_salt = decoded.slice(0, 8);
        var encrypted_regex = decoded.slice(8);

        var subdomain = findSubdomainByHash(hostname, match.hash);
        var key = md5(hostname_salt + per_url_salt + subdomain, null, true);
        var result = rc4(key, encrypted_regex);

        var should_block_url = result.split("\t").some(function(value) {
          if (value !== "") {
            var regex = newRegExp(value, true);
            return (regex && regex.test(blocked_url));
          }
        });

        if (should_block_url === true) {
          BlockIt({ "cloud_verdict": cloud_verdict});
          break;
        };
      }
    }

    if (NoAnswer()) {
      AllowIt();
    }
    
  } catch(error) {
    console.error(`Failed domain status check: ${error}`);
  }

  return answer;
}

async function checkHostInAvc(data, onBlock, onAllow, onUnknown) {
  if (avcActive === true) {
    var cloudURI = `http://127.0.0.1:42357/checkhost/${data.hostname}`;
    try {
      data.avcAnswer = JSON.parse(await interogateExternal(cloudURI));
      if (data.avcAnswer) {
        switch (data.avcAnswer.action) {
          case  'block': onBlock(data); return;
          case  'allow': onAllow(data); return;
        }
      }
    } catch { eLog(`Failed avc request: ${cloudURI}`) }

    if (onUnknown) {
      onUnknown(data);
    }
  }
}

async function reloadBlockedIfAllowedNow() {
  browser.tabs.query({}).then(tabs => {
  
    for (const tab of tabs) {
      active_tab_id = tab.id;
      active_tab_url = tab.url;

      url = new URL(active_tab_url);
  
      if (url.pathname == "/block_page_template.html") {
        eLog(`Check to reload tab: ${active_tab_id}, ${active_tab_url}`);
        blocked_url = new URL(url.searchParams.get('blocked_url'));
        block_rule = url.searchParams.get('host_rule');

        checkHostInAvc({blocked_url: blocked_url, block_rule: block_rule, hostname: blocked_url.hostname, tabid: active_tab_id},
          undefined, //  block rule exists 
          doReloadBlocked,
          function onUnknown(data) { //  no rules 
            if (data && data.block_rule) {//  no rules but blocked by rule 
              doReloadBlocked(data)
            }
          }
        );
      }
    }
  });
}
