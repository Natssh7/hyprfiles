var active_tab_id, active_tab_url, active_tab_hostname;

localize();

/* 

	Extension State

*/

browser.storage.local.get("extension_state").then(function(object) {
	if (object.extension_state && object.extension_state.toLowerCase() == "off") {
		$(stateToggleBtn).attr("src", "assets/toggle_off.png");
	}
});

/*

	Getting info about active tab (if it's excluded or not).

*/

browser.tabs.query({
	active: true,
	currentWindow: true
}).then(function(tabs) {

	active_tab_id = tabs[0].id;
	active_tab_url = tabs[0].url;
	active_tab_hostname = new URL(active_tab_url).hostname;
	whitelisted_schemas = ["about:", "chrome-extension:", "chrome:", "moz-extension:", "opera:", "vivaldi:", "wyciwyg:"];


	if (whitelisted_schemas.some(schema => active_tab_url.startsWith(schema)) || active_tab_hostname == "emsisoft.com" || active_tab_hostname.endsWith(".emsisoft.com")) {
		linksContainer.hidden = true;
	} else {
    linksContainer.hidden = false;

    browser.storage.local.get("reported_sites").then(object => {
      var url_was_reported = (object.reported_sites && object.reported_sites.find(item => item == active_tab_url));
      reportLink.hidden = url_was_reported;
      thanks.hidden = !url_was_reported;
    });
  
    browser.storage.local.get("excluded_domain_list").then(object => {
      var domain_is_excluded = (object.excluded_domain_list && object.excluded_domain_list.find(item => item == active_tab_hostname));
      removeExclusion.hidden = !domain_is_excluded;
    });
  }

});

stateToggleBtn.addEventListener('click', function(e) {
	var src = $(this).attr('src');

	if (src == "assets/toggle_on.png") {
		browser.storage.local.set({
			"extension_state": "off"
		}).then(function() {
			$(stateToggleBtn).attr('src', 'assets/toggle_off.png');
		});
	} else {
		browser.storage.local.set({
			"extension_state": "on"
		}).then(function() {
			$(stateToggleBtn).attr('src', 'assets/toggle_on.png');
		});
	}

	iconRefresh();

});

manageExclusionsLink.addEventListener('click', function(e) {
	e.preventDefault();
	browser.runtime.openOptionsPage();
});

reportLink.addEventListener('click', function(e) {
	e.preventDefault();

	$.ajax({
		type: "POST",
		data: JSON.stringify({
			url: active_tab_url,
			type: "malicious"
		}),
		contentType: "application/json",
		url: "https://alomar.emsisoft.com/api/v1/url/report",
		success: function(data) {
			// nothing		
		}
	});
	$('#reportLinkDiv').text(chrome.i18n.getMessage("thanks"));
	addToReported(active_tab_url);
});

removeExclusionLink.addEventListener('click', function(e) {
	e.preventDefault();

	browser.storage.local.get("excluded_domain_list").then(function(object) {

		if (object.excluded_domain_list) {

			var excluded_domain_list = object.excluded_domain_list;

			excluded_domain_list = excluded_domain_list.filter(item => item != active_tab_hostname);

			browser.storage.local.set({
				"excluded_domain_list": excluded_domain_list
			}).then(function() {
				browser.tabs.reload(active_tab_id);
				location.reload();
			});

		}
	});
});

function addToReported(url) {

    browser.storage.local.get("reported_sites").then(function(object) {
      var reported_sites = [];

      if (object.reported_sites)
          reported_sites = object.reported_sites;

      reported_sites.push(url);

      browser.storage.local.set({
          "reported_sites": reported_sites
      });
    });
}