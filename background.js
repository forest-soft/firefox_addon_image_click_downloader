browser.runtime.onMessage.addListener(function(message) {
	download(message.url);
});

function onError(e) {
	console.error(e);
}

var download_id_list = {};

// ダウンロード状態変化時の処理
/*
function handleChanged(delta) {
	if (delta.id in download_id_list){
		if (delta.state && delta.state.current === "complete") {
			// ダウンロードが完了している状態であれば通知を表示する。
			var searching = browser.downloads.search({id: delta.id});
			searching.then(function(downloads){
				for (let download of downloads) {
					var real_filename = download.filename.split("\\").slice(-1)[0];
					
					var creating = browser.notifications.create({
						type: "basic",
						title: "Success!!",
						iconUrl: download_id_list[delta.id],
						message: real_filename
					});
					creating.then(function(id){
						// 3秒後に通知を消す。
						setTimeout(function(){
							browser.notifications.clear(id);
						}, 3000);
					});
					
					delete download_id_list[delta.id];
				}
			}, onError);
		}
	}
}
browser.downloads.onChanged.addListener(handleChanged);
*/

// ダウンロード処理
function download(url) {
	var folder = "image/";
	var temp_url = url;
	var url_parts = url.split("?")[0].split("#")[0].split("/");
	url_parts = url_parts.filter(function(value){return value.length != 0});
	var filename = url_parts.pop();
	// TwitterのURLだと「aaa.png:large」というようにコロンほにゃららがついている場合があるので除去する。
	filename = filename.split(":")[0];
	
	var save_path = folder + filename;
	
	// ダウンロード開始時の処理
	function onStartedDownload(download_id) {
		
		function logDownloads(downloads) {
			for (let download of downloads) {
				// ファイル名が被っていると自動でファイル名の末尾に連番が付与されるので、
				// 保存しようとしたときとファイル名が変わっていれば
				// ダウンロード処理をキャンセルしたうえで「名前を付けて保存」ダイアログを表示する。
				var real_filename = download.filename.split("\\").slice(-1)[0];
				if (filename != real_filename) {
					
					function onCanceled() {
						function onStartedManualDownload(download_id) {
							// download_id_list[download_id] = url;
							
							var searching = browser.downloads.search({id: download_id});
							searching.then(function(downloads){
								for (let download of downloads) {
									var real_filename = download.filename.split("\\").slice(-1)[0];
									
									var creating = browser.notifications.create({
										type: "basic",
										title: "Save...",
										// iconUrl: url,
										iconUrl: browser.runtime.getURL("icons/success-48.png"),
										message: real_filename
									});
									creating.then(function(id){
										// 3秒後に通知を消す。
										setTimeout(function(){
											browser.notifications.clear(id);
										}, 3000);
									});
								}
							}, onError);
						}
						var downloading = browser.downloads.download({
							url : url,
							filename: save_path,
							conflictAction : 'overwrite',
							saveAs: true
						});
						downloading.then(onStartedManualDownload, onFailedDownload);
					}
					var canceling = browser.downloads.cancel(download.id);
					canceling.then(onCanceled, onError);
				} else {
					// download_id_list[download_id] = url;
					
					var creating = browser.notifications.create({
						type: "basic",
						title: "Save...",
						//iconUrl: url,
						iconUrl: browser.runtime.getURL("icons/success-48.png"),
						message: real_filename
					});
					creating.then(function(id){
						// 3秒後に通知を消す。
						setTimeout(function(){
							browser.notifications.clear(id);
						}, 3000);
					});
				}
			}
		}
		
		var searching = browser.downloads.search({id: download_id});
		searching.then(logDownloads, onError);
	}
	
	// ダウンロード処理が開始できなかった場合の処理
	function onFailedDownload(error) {
		if (error.message == "Download canceled by the user") {
			return;
		}
		
		var creating = browser.notifications.create({
			type: "basic",
			title: "Error",
			iconUrl: browser.runtime.getURL("icons/error-48.png"),
			message: error.message
		});
		creating.then(function(id){
			// 3秒後に通知を消す。
			setTimeout(function(){
				browser.notifications.clear(id);
			}, 3000);
		});
	}
	
	// ダウンロードを実行する。
	// ホントは「conflictAction:"prompt"」にしたいがFirefoxでは未実装なようなので、
	// onStartedDownloadの中で疑似的にファイル名被りを検知する。
	var downloading = browser.downloads.download({
		url : url,
		filename: save_path,
		conflictAction : "uniquify",
		saveAs: false
	});
	downloading.then(onStartedDownload, onFailedDownload);
}
