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

