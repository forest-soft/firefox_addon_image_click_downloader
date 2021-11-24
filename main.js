// 画像保存処理
function save_image(event) {
	function handleResponse(message) {
		// console.log(`Message from the background script:  ${message.response}`);
	}
	
	function handleError(error) {
		console.log(`Error: ${error}`);
	}
	
	var sending = browser.runtime.sendMessage({
		url: event.target.src,
	});
	sending.then(handleResponse, handleError);
}

/*
// 初期の処理
var image_list = document.getElementsByTagName("img");
for (var i = 0; i < image_list.length; i++) {
	var image_element = image_list[i];
	image_element.addEventListener("dblclick", save_image);
}
*/


/*
// 動的に追加した要素に対応するバージョン
window.addEventListener("dblclick", function(event) {
	if (event.srcElement.nodeName == "IMG") {
		save_image(event);
	}
});
*/


// 設定値の取得処理
function onError(e) {
	console.error(e);
}

var setting = {
	save_dir: "image",
	is_show_popup_by_start: "yes",
	is_show_thumbnail_by_start: "no",
	is_show_popup_by_complete: "no",
	is_show_thumbnail_by_complete: "no",
	is_overwrite_click_event: "no",
	overwrite_click_double_click_speed: "300",
	overwrite_click_event_site_domain: ""
};

function onGot(storage_data) {
	for (key in storage_data) {
		setting[key] = storage_data[key];
	}
	
	setting.overwrite_click_double_click_speed = parseInt(setting.overwrite_click_double_click_speed, 10);
	setting.overwrite_click_event_site_domain = setting.overwrite_click_event_site_domain.toLowerCase().split("\n");
	setting.overwrite_click_event_site_domain = setting.overwrite_click_event_site_domain.filter(Boolean);
	
	// 現在見ているサイトが「クリックイベントを上書きするサイトのドメイン名」に含まれていなければクリックイベントを上書きしない。
	if (setting.overwrite_click_event_site_domain.length != 0 && !setting.overwrite_click_event_site_domain.includes(document.domain.toLowerCase())) {
		setting.is_overwrite_click_event = "no";
	}
	
	let is_browser_image_view = false;
	if (document && document.body && document.body.childNodes.length == 1 && document.body.childNodes[0].tagName == "IMG") {
		is_browser_image_view = true;
	}
	
	if (is_browser_image_view || setting.is_overwrite_click_event == "no") {
		window.addEventListener("dblclick", function(event) {
			if (event.srcElement.nodeName == "IMG") {
				save_image(event);
			}
		});
	} else {
		console.log("クリックイベント上書き！");
		
		const overwrite_click_event = function(event) {
			console.log("クリックした要素");
			console.log(event.target);
			
			if (event.target.nodeName != "IMG") {
				return true;
			}
			console.log("乗っ取りX");

			console.log(event.target.dataset.xxx_click);
			/*
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			*/
			if ((typeof event.target.dataset.xxx_click === "undefined") || (event.target.dataset.xxx_click == "end")) {
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();
				event.target.dataset.xxx_click = "start";
				console.log("single start");
				
				setTimeout(function () {
					if (event.target.dataset.xxx_click == "start") {
						console.log("single click!");
						event.target.dataset.xxx_click = "single";
						event.target.click();
					}
				}, setting.overwrite_click_double_click_speed);
				
				return false;
			} else if (event.target.dataset.xxx_click == "single") {
				// シングルクリック
				console.log("single通常");
				event.target.dataset.xxx_click = "end";
				
				return true;
			} else {
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();
				event.target.dataset.xxx_click = "end";
				console.log("ダブルクリック");
				save_image(event);
				
				return false;
			}
			
			return false;
		}
		
		// キャプチャーフェーズでクリックを補足してクリックイベントを調整する。
		window.addEventListener("click", overwrite_click_event, true);
/*
		// 元々ある要素にクリックイベント割り当て
		const image_list = document.getElementsByTagName("img");
		for (let i = 0; i < image_list.length; i++) {
			const image_element = image_list[i];
			image_element.addEventListener("click", overwrite_click_event);
		}
		
		// 追加された要素へのクリックイベントの割り当て
		const attributes_area_observer = new MutationObserver((mutations) => {
			console.log("追加された要素");
			mutations.forEach((mutation) => {
				
				for (let i = 0; i < mutation.addedNodes.length; i++) {
					if (typeof mutation.addedNodes[i].getElementsByTagName === "undefined") {
						continue;
					}
					
					console.log(mutation.addedNodes[i]);
					
					if (mutation.addedNodes[i].nodeName == "IMG") {
						mutation.addedNodes[i].removeEventListener("click", overwrite_click_event);
						mutation.addedNodes[i].addEventListener("click", overwrite_click_event);
					} else {
						const image_list = mutation.addedNodes[i].getElementsByTagName("img");
						for (let i = 0; i < image_list.length; i++) {
							const image_element = image_list[i];
							image_element.removeEventListener("click", overwrite_click_event);
							image_element.addEventListener("click", overwrite_click_event);
						}
					}
				}
			});
		});

		var attributes_area_observer_config = {
			childList: true,
			subtree: true,
		};

		attributes_area_observer.observe(document.getElementsByTagName("body")[0], attributes_area_observer_config);
*/
	}
}

var getting = browser.storage.sync.get();
getting.then(onGot, onError);


/*
パーミッションを追加リクエストを行う仕組みがまだ実装されていないので、
実装されたら<all_urls>をオプションレベルに引き下げたい。
https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/permissions
const permissionsToRequest = {
  permissions: ["<all_urls>"]
}

function requestPermissions() {
	function onResponse(response) {
		if (response) {
			console.log("Permission was granted");
		} else {
			console.log("Permission was refused");
		}
		return browser.permissions.getAll();  
	}
	
	try {
		browser.permissions.request(permissionsToRequest)
			.then(onResponse)
			.then((currentPermissions) => {
				console.log("Current permissions:", currentPermissions);
		});
	} catch (e) {
		// 2020年07月時点では「TypeError: browser.permissions is undefined」となる。
		console.log(e);
	}
}
requestPermissions();
*/
