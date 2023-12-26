var avName = null;

fillTable();

function fillTable() {
  $(".hosts-table .body").each(function () { 
    $(this)[0].innerHTML = ''
  });
  
  browser.storage.local.get("server_product").then(object => {
    avName = object.server_product;

    browser.storage.local.get("excluded_domain_list").then(object => {
      if (object.excluded_domain_list && object.excluded_domain_list.length > 0){
        object.excluded_domain_list.forEach(domain => {
          addRow({domain: domain, mode: 'Allow', category: 'Internal'});
        });
      }

      browser.storage.local.get('host_rules').then(function(object) {
        if (object.host_rules) {
          if (object.host_rules.block && object.host_rules.block.length > 0) {
            object.host_rules.block.forEach(rule => {
              addRow({domain: rule.NameExpr, mode: 'Block', category: 'External'});
            })
          }
          if (object.host_rules.allow && object.host_rules.allow.length > 0) {
            object.host_rules.allow.forEach(rule => {
              addRow({domain: rule.NameExpr, mode: 'Allow', category: 'External'});
            })
          }
        }
        $(".hosts-table .body").each(function () {
          if ($(this).find(".row").length == 0) {
            $(this).append("<div>")
            .addClass('row')
            .append('<div class="left"><span class="localize-options005"></span></div>');
          }
        });  
        localize();
      })
    
    });
  });
}

function removeRow(Element) {
  var row = Element.closest('.row');
  if (row && row[0]) {
    var domain = row[0].querySelector('.left').innerText;
    if (domain) {
      browser.storage.local.get("excluded_domain_list").then(object => {
        if (object.excluded_domain_list && object.excluded_domain_list.length > 0){
          object.excluded_domain_list = object.excluded_domain_list.filter(item => item != domain);
          browser.storage.local.set({"excluded_domain_list": object.excluded_domain_list}).then(() => {
            location.reload();
          });
        }
      });
    }
  }
}

function addRow(object) {
  var $row = $("<div>").addClass('row');
  var $left = $("<div>").addClass("left").text(object.domain);

  var $right = $("<div>").addClass("right");
  var hint = '';

  if (object.category == "Internal") {
    $right.click(event => { 
      var Element = $(event.target);
      removeRow(Element);
    })
  } else {
    $right.disabled = true;
    hint = chrome.i18n.getMessage('optionsNoRemoveHint').replace('[productname]', avName);
    hint = ` title="${hint}" `;
  };

  $right.append(`<img ${object.category} src='assets/remove.png' ${hint} />`);

  $row.append($left, $right).appendTo(`.${object.mode.toLowerCase()} .body`);
}


(function() {
	var el = document.querySelector('.footer-current-time');

	var version = browser.runtime.getManifest().version;

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