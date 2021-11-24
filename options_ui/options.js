// ローカライズ処理
var label_list = document.querySelectorAll("[class^=option_label_]");
for (var i = 0; i < label_list.length; i++) {
	while (label_list[i].firstChild) {
		label_list[i].removeChild(label_list[i].firstChild);
	}
	const class_name = label_list[i].className.split(" ")[0];
	label_list[i].appendChild(document.createTextNode(browser.i18n.getMessage(class_name)));
}

function saveOptions(e) {
	e.preventDefault();
	
	// 特殊機能設定(ダブルクリック速度)を整数値以外のものが入力されていればデフォルト値に戻す。
	let overwrite_click_double_click_speed = document.querySelector("#overwrite_click_double_click_speed").value;
	overwrite_click_double_click_speed = parseInt(overwrite_click_double_click_speed, 10);
	if (!Number.isInteger(overwrite_click_double_click_speed) || overwrite_click_double_click_speed == 0) {
		overwrite_click_double_click_speed = 300;
	}
	overwrite_click_double_click_speed = String(overwrite_click_double_click_speed);
	
	let overwrite_click_event_site_domain = document.querySelector("textarea[name=overwrite_click_event_site_domain]").value.split("\n");
	for (let i = 0; i < overwrite_click_event_site_domain.length; i++) {
		overwrite_click_event_site_domain[i] = overwrite_click_event_site_domain[i].trim();
	}
	overwrite_click_event_site_domain = overwrite_click_event_site_domain.join("\n");
	
	browser.storage.sync.set({
		save_dir: document.querySelector("#save_dir").value,
		is_show_popup_by_start: document.querySelector("input[name=is_show_popup_by_start]:checked").value,
		is_show_thumbnail_by_start: document.querySelector("input[name=is_show_thumbnail_by_start]:checked").value,
		is_show_popup_by_complete: document.querySelector("input[name=is_show_popup_by_complete]:checked").value,
		is_show_thumbnail_by_complete: document.querySelector("input[name=is_show_thumbnail_by_complete]:checked").value,
		is_overwrite_click_event: document.querySelector("input[name=is_overwrite_click_event]:checked").value,
		overwrite_click_double_click_speed: overwrite_click_double_click_speed,
		overwrite_click_event_site_domain: overwrite_click_event_site_domain
	}).then(function(){
		restoreOptions();
		alert(browser.i18n.getMessage("option_label_save_complete"));
	}, function(error){
		alert(browser.i18n.getMessage("option_label_save_error") + "\n" + error);
	});
}

function restoreOptions() {

	function setCurrentChoice(result) {
		// 保存ディレクトリ名
		document.querySelector("#save_dir").value = "save_dir" in result ? result.save_dir : "image";
		
		// ダウンロード開始ポップアップ設定(ポップアップ表示)
		result.is_show_popup_by_start = result.is_show_popup_by_start || "yes";
		document.querySelector("input[name=is_show_popup_by_start][value=" + result.is_show_popup_by_start + "]").checked = true;
		
		// ダウンロード開始ポップアップ設定(保存画像のサムネイル表示)
		result.is_show_thumbnail_by_start = result.is_show_thumbnail_by_start || "no";
		document.querySelector("input[name=is_show_thumbnail_by_start][value=" + result.is_show_thumbnail_by_start + "]").checked = true;
		
		// ダウンロード完了ポップアップ設定(ポップアップ表示)
		result.is_show_popup_by_complete = result.is_show_popup_by_complete || "no";
		document.querySelector("input[name=is_show_popup_by_complete][value=" + result.is_show_popup_by_complete + "]").checked = true;
		
		// ダウンロード完了ポップアップ設定(保存画像のサムネイル表示)
		result.is_show_thumbnail_by_complete = result.is_show_thumbnail_by_complete || "no";
		document.querySelector("input[name=is_show_thumbnail_by_complete][value=" + result.is_show_thumbnail_by_complete + "]").checked = true;
		
		// 特殊機能設定(クリックイベントの上書き)
		result.is_overwrite_click_event = result.is_overwrite_click_event || "no";
		document.querySelector("input[name=is_overwrite_click_event][value=" + result.is_overwrite_click_event + "]").checked = true;
		
		// 特殊機能設定(ダブルクリック速度)
		document.querySelector("#overwrite_click_double_click_speed").value = "overwrite_click_double_click_speed" in result ? result.overwrite_click_double_click_speed : "300";
		
		// 特殊機能設定(クリックイベントを上書きするサイトのドメイン名)
		result.overwrite_click_event_site_domain = result.overwrite_click_event_site_domain || "";
		document.querySelector("textarea[name=overwrite_click_event_site_domain]").value = result.overwrite_click_event_site_domain;
	}

	function onError(error) {
		console.log(`Error: ${error}`);
	}

	var getting = browser.storage.sync.get();
	getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
