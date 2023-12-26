function localize(){
	$("[class*=localize-").each(function(){
		var classes = $(this).attr('class').split(' ');
		classes.forEach(cls => {
			if (cls.startsWith("localize-")) {
				var msg_id = cls.replace("localize-", "");
				$(this).text(chrome.i18n.getMessage(msg_id));
			}
	  });
	});
	/*
	if (self.chrome && (typeof self.chrome.i18n === 'function')) {
		$("[class^=localize-").each(function(){
			var msg_id = $(this).attr('class').replace("localize-", "");
			$(this).text(chrome.i18n.getMessage(msg_id));
		});
	} else {
		var settings = {
			"cache": false,
			"dataType": "jsonp",
			"async": false,
			"url": "_locales/en/messages1.json",
			"crossDomain": true,
			"method": "GET",
			"headers": {
					"accept": "application/json",
					"Access-Control-Allow-Origin":"*"
			}
		}

		$.ajax(settings).done(function ( data ) {
			$("[class^=localize-").each(function(){
				var msg_id = $(this).attr('class').replace("localize-", "");
				$(this).text(data.msg_id);
			});
		});		
	}
	*/
}

function IsManifest(num) {
	return browser.runtime.getManifest().manifest_version == num;
}

function IsOff(state) {
	return state && state.toLowerCase() == "off";
}

function logoPath(state){
	if (IsOff(state)) {
		var pth = "assets/logo_grey.png";
	} else {
		var pth = "assets/logo.png";
	}
	if (!IsManifest(2)){
		pth = '../' + pth;
	}
	return pth;
}

function browserAction() {
	if (browser.browserAction) {
		return browser.browserAction;
	} else {
		return browser.action;
	}
}

function iconRefresh() {
  if (!browser.runtime.lastError) {
    browser.storage.local.get("extension_state").then(function(object) {
			browserAction().setIcon({path: logoPath(object.extension_state)});
    });
  }
}

function excludeHost(hostname, blocked_url) {
	browser.runtime.sendMessage({
		action: "exclude_domain",
		data: {
			hostname: hostname,
			blocked_url: blocked_url
		}
	});
}