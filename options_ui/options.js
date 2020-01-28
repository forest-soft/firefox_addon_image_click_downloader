// ローカライズ処理
var label_list = document.querySelectorAll("[class^=option_label_]");
for (var i = 0; i < label_list.length; i++) {
	while (label_list[i].firstChild) {
		label_list[i].removeChild(label_list[i].firstChild);
	}
	label_list[i].appendChild(document.createTextNode(browser.i18n.getMessage(label_list[i].className)));
}

function saveOptions(e) {
	e.preventDefault();
	
	browser.storage.sync.set({
		save_dir: document.querySelector("#save_dir").value,
		is_show_popup_by_start: document.querySelector("input[name=is_show_popup_by_start]:checked").value,
		is_show_thumbnail_by_start: document.querySelector("input[name=is_show_thumbnail_by_start]:checked").value,
		is_show_popup_by_complete: document.querySelector("input[name=is_show_popup_by_complete]:checked").value,
		is_show_thumbnail_by_complete: document.querySelector("input[name=is_show_thumbnail_by_complete]:checked").value
	}).then(function(){
		alert(browser.i18n.getMessage("option_label_save_complete"));
	}, function(error){
		alert(browser.i18n.getMessage("option_label_save_error") + "\n" + error);
	});
}

function restoreOptions() {

	function setCurrentChoice(result) {
		
		document.querySelector("#save_dir").value = "save_dir" in result ? result.save_dir : "image";
		
		result.is_show_popup_by_start = result.is_show_popup_by_start || "yes";
		document.querySelector("input[name=is_show_popup_by_start][value=" + result.is_show_popup_by_start + "]").checked = true;
		
		result.is_show_thumbnail_by_start = result.is_show_thumbnail_by_start || "no";
		document.querySelector("input[name=is_show_thumbnail_by_start][value=" + result.is_show_thumbnail_by_start + "]").checked = true;
		
		result.is_show_popup_by_complete = result.is_show_popup_by_complete || "no";
		document.querySelector("input[name=is_show_popup_by_complete][value=" + result.is_show_popup_by_complete + "]").checked = true;
		
		result.is_show_thumbnail_by_complete = result.is_show_thumbnail_by_complete || "no";
		document.querySelector("input[name=is_show_thumbnail_by_complete][value=" + result.is_show_thumbnail_by_complete + "]").checked = true;
	}

	function onError(error) {
		console.log(`Error: ${error}`);
	}

	var getting = browser.storage.sync.get();
	getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
