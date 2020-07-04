// 画像保存処理
function save_image(event) {
	function handleResponse(message) {
		console.log(`Message from the background script:  ${message.response}`);
	}
	
	function handleError(error) {
		console.log(`Error: ${error}`);
	}
	
	var sending = browser.runtime.sendMessage({
		url: event.target.src,
	});
	sending.then(handleResponse, handleError);
}

var image_list = document.getElementsByTagName("img");
for (var i = 0; i < image_list.length; i++) {
	var image_element = image_list[i];
	image_element.addEventListener("dblclick", save_image);
}


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
