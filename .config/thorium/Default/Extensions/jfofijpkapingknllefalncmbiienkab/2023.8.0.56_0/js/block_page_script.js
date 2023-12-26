var url = new URL(location.href);
var hostname = url.searchParams.get('hostname');
var blocked_url = url.searchParams.get('blocked_url');
var cloud_verdict = url.searchParams.get('cloud_verdict');
var content_verdict = url.searchParams.get('content_verdict');
var host_rule = url.searchParams.get('host_rule');
var product_name = url.searchParams.get('product_name');
var deny_visit_anyway = url.searchParams.get('deny_visit_anyway') === 'true';

localize();

var rulemode = host_rule ? true : false;
var byContent = content_verdict ? true : false;
var hideVerdict = rulemode && !byContent;

byRule.hidden = !hideVerdict;
byVerdict.hidden = hideVerdict;
actionBtns.hidden = deny_visit_anyway;
var nonrules = document.querySelectorAll("[non-rule]");
for (const nonrule of nonrules) {
	nonrule.hidden = hideVerdict || deny_visit_anyway; 
}

if ((rulemode == true) || (byContent == true)) {
  productName.innerText = browser.i18n.getMessage('blockpage007').replace('[productname]', product_name);
	var ahtml = '<a target="_blank" href="https://scamadviser.com/check-website/' + hostname + '">ScamAdviser.com</a>';
  verdictSpan.innerHTML = browser.i18n.getMessage(content_verdict).replace('ScamAdviser.com', ahtml);
} else {
  verdictSpan.innerText = cloud_verdict ? browser.i18n.getMessage(cloud_verdict) : '';
  verdictSpan.style.color = "red";
}

hostnameSpan.innerText = hostname;

reportLink.addEventListener('click', function(e) {
	e.preventDefault();
	if  (byContent == true) {
		excludeHost(hostname, blocked_url);
	} else {
		$.ajax({
			type: "POST",
			data: JSON.stringify({
				url: blocked_url,
				type: "falsepositive"
			}),
			contentType: "application/json",
			url: "https://alomar.emsisoft.com/api/v1/url/report",
			success: function(data) {
				excludeHost(hostname, blocked_url);
			}
		});
	}

});

visitAnywayLink.addEventListener('click', function(e) {
	e.preventDefault();
	excludeHost(hostname, blocked_url);
});

(function() {
	var el = document.querySelector('.footer-current-time');

	var version = '0.0.0.0';
	try {
		version = browser.runtime.getManifest().version; 
	} catch {};

	if (el) {
		var date = new Date();

		var hour = date.getDate() > 9 ? date.getDate() : '0' + date.getDate()
		el.innerHTML = date.getFullYear() + '-' +
			((date.getMonth() + 1 < 10 ? '0' : '') + (1 + date.getMonth())) + '-' +
			(date.getDate() < 10 ? '0' : '') + date.getDate() + ' ' +
			(date.getHours() < 10 ? '0' : '') + date.getHours() + ':' +
			(date.getMinutes() < 10 ? '0' : '') + date.getMinutes() + 
			" - v" + version;
	}
})();