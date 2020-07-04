browser.runtime.onMessage.addListener(function(message) {
	download(message.url);
});

function onError(e) {
	console.error(e);
}

var setting = {
	save_dir: "image",
	is_show_popup_by_start: "yes",
	is_show_thumbnail_by_start: "no",
	is_show_popup_by_complete: "no",
	is_show_thumbnail_by_complete: "no"
};

function onGot(storage_data) {
	for (key in storage_data) {
		setting[key] = storage_data[key];
	}
}

var getting = browser.storage.sync.get();
getting.then(onGot, onError);

browser.storage.onChanged.addListener(function(change_data){
	for (key in change_data) {
		setting[key] = change_data[key]["newValue"];
	}
});


var download_id_list = {};

// ダウンロード状態変化時の処理
function handleChanged(delta) {
	if (delta.id in download_id_list){
		if (delta.state) {
			if (delta.state.current === "complete") {
				// ダウンロードが完了している状態であれば通知を表示する。
				show_save_popup(delta.id, "complete");
				
				delete download_id_list[delta.id];
			} else if (delta.state.current === "interrupted") {
				var creating = browser.notifications.create({
					type: "basic",
					title: "Error",
					iconUrl: browser.runtime.getURL("icons/error-48.png"),
					message: "DownloadError(" + delta.error.current + ")"
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
}
browser.downloads.onChanged.addListener(handleChanged);

// ダウンロード処理
function download(url) {
	var save_dir = setting.save_dir;
	if (save_dir.length != 0 && save_dir.slice(-1) != "/") {
		save_dir += "/";
	}
	
	var temp_url = url;
	
	var filename = "";
	var content_type = "";
	var header_download = new Promise(function(resolve, reject) {
		setTimeout(function() {
			reject(new Error("timeout"))
		}, 5000);
		content.fetch(url, {method: "HEAD"}).then(resolve, reject);
  	});
	header_download.then(response => {
		if (response.ok) {
			content_type = response.headers.get('Content-Type');
			var content_disposition = response.headers.get('Content-Disposition');
			if (content_disposition != null && content_disposition.length != 0) {
				content_disposition_parts = content_disposition.split(";");
				content_disposition_param = {};
				for(var i = 0; i < content_disposition_parts.length; i++) {
					var param_parts = content_disposition_parts[i].split("=");
					content_disposition_param[decodeURIComponent(param_parts[0]).trim()] = param_parts[1];
				}
				if (typeof content_disposition_param["filename*"] !== "undefined") {
					filename = decodeURIComponent(content_disposition_param["filename*"].trim().split("'")[2]);
				} else if (typeof content_disposition_param["filename"] !== "undefined") {
					filename = decodeURIComponent(content_disposition_param["filename"].trim().replace(/"/g, ''));
				}
			}
		} else {
			throw new Error("status ng");
		}
	}).catch(function(error) {
		console.log(error);
	}).finally(function(){
		if (filename == "") {
			var url_parts = url.split("?")[0].split("#")[0].split("/");
			url_parts = url_parts.filter(function(value){return value.length != 0});
			filename = decodeURIComponent(url_parts.pop());
			// TwitterのURLだと「aaa.png:large」というようにコロンほにゃららがついている場合があるので除去する。
			filename = filename.split(":")[0];
		}
		
		var find_ext = true;
		if (filename.indexOf(".") == -1) {
			find_ext = false;
			
			if (content_type != null && content_type.length != 0) {
				var content_type_list = {
					"image/jpeg": "jpg",
					"image/jpeg": "jpg",
					"image/png": "png",
					"image/gif": "gif",
					"image/webp": "webp",
					"image/bmp": "bmp"
				};
				
				if (typeof content_type_list[content_type] != "undefined") {
					filename += "." + content_type_list[content_type];
					find_ext = true;
				}
			}
			
			if (!find_ext) {
				// Twitterの「https://pbs.twimg.com/media/xxx?format=jpg」というURLの場合用の拡張子特定処理
				// ※基本的にはヘッダーから特定するが、何らかの理由でヘッダー情報が取れなかった場合はURLから特定する。
				var request = {};
				var param_list = url.split("?")[1].split("#")[0].split("&");
				for(var i = 0; i < param_list.length; i++) {
					var param_parts = param_list[i].split("=");
					request[decodeURIComponent(param_parts[0])] = decodeURIComponent(param_parts[1]);
				}
				if (typeof request["format"] !== "undefined") {
					var format = request["format"].toLowerCase();
					var ext_list = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
					if (ext_list.indexOf(format) != -1) {
						filename += "." + request["format"];
						find_ext = true;
					}
				}
			}
		}
		
		var save_path = save_dir + filename;
		
		// ダウンロード開始時の処理
		function onStartedDownload(download_id) {
			function logDownloads(downloads) {
				for (let download of downloads) {
					// ファイル名が被っていると自動でファイル名の末尾に連番が付与されるので、
					// 保存しようとしたときとファイル名が変わっていれば
					// ダウンロード処理をキャンセルしたうえで「名前を付けて保存」ダイアログを表示する。
					var real_filename = download.filename.split("\\").slice(-1)[0];
					if (find_ext && filename != real_filename) {
						
						function onCanceled() {
							function onStartedManualDownload(download_id) {
								download_id_list[download_id] = url;
								
								show_save_popup(download_id, "start");
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
						download_id_list[download_id] = url;
						
						show_save_popup(download_id, "start");
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
		var download_save_as = false;
		if (!find_ext) {
			// 拡張子が特定できない場合は保存ダイアログで入力する形にする。
			download_save_as = true;
		}
		var downloading = browser.downloads.download({
			url : url,
			filename: save_path,
			conflictAction : "uniquify",
			saveAs: download_save_as
		});
		downloading.then(onStartedDownload, onFailedDownload);
	});
}

function show_save_popup(download_id, status) {
	var is_show = false;
	if (status == "start" && setting.is_show_popup_by_start == "yes") {
		is_show = true;
	} else if (status == "complete" && setting.is_show_popup_by_complete == "yes") {
		is_show = true;
	}
	if (is_show) {
		var searching = browser.downloads.search({id: download_id});
		searching.then(function(downloads){
			for (let download of downloads) {
				var real_filename = download.filename.split("\\").slice(-1)[0];
				
				var title = "";
				var icon_url = null;
				if (status == "start") {
					title = browser.i18n.getMessage("popup_download_start");
					icon_url = browser.runtime.getURL("icons/download_start-48.png");
					if (setting.is_show_thumbnail_by_start == "yes") {
						icon_url = download.url;
					}
				} else if (status == "complete") {
					title = browser.i18n.getMessage("popup_download_complete");
					icon_url = browser.runtime.getURL("icons/success-48.png");
					if (setting.is_show_thumbnail_by_complete == "yes") {
						icon_url = download.url;
					}
				}
				var creating = browser.notifications.create({
					type: "basic",
					title: title,
					iconUrl: icon_url,
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
}
