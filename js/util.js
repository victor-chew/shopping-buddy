"use strict";

sbApp.util = {

	showCount: 0,

	alert: function(msg) {
		console.log(msg);
		ons.notification.toast(msg, { buttonLabel: 'Dismiss', timeout: 3000 });
	},

	error: function(msg) {
		console.log('ERROR: ' + msg);
		console.trace();
		ons.notification.toast('ERROR: ' + msg, { buttonLabel: 'Dismiss' });
	},

	loading: function(show) {
		let loader = document.querySelector('#id-navigator').topPage.querySelector('#id-loading');
		if (show) {
			if (++sbApp.util.showCount === 1) loader.setAttribute('indeterminate');
		} else {
			if (--sbApp.util.showCount === 0) loader.removeAttribute('indeterminate');
		}
	},

	waitFor: async function(func) {
		sbApp.util.loading(true);
		try {
			await func();
		} catch(e) {
			sbApp.util.error(e.message);
		}
		finally {
			sbApp.util.loading(false);
		}
	},

	block: function(msg) {
		document.getElementById('id-modal-msg').textContent = msg;
		document.getElementById('id-modal-overlay').show();
	},
	
	unblock: function() {
		document.getElementById('id-modal-overlay').hide();
	},

	randomString: function(charset, len) {
		var randstr = '';
		for (var i=0; i<len; i++) {
			var randnum = Math.floor(Math.random() * charset.length);
			randstr += charset.substring(randnum, randnum+1);
		}
		return randstr;
	},
	
	unique: function(array) {
		return [...new Set(array)];
	},
	
	sort: function(array, field) {
		if (field === undefined)	return array.sort((a,b) => a.localeCompare(b));
		return array.sort((a,b) => a[field].localeCompare(b[field]));
	},

	// Source: http://stackoverflow.com/questions/11076975/insert-text-into-textarea-at-cursor-position-javascript
  insertAtCursor: function(field, text) {
		if (field.selectionStart || field.selectionStart == '0') {
			var startPos = field.selectionStart;
			var endPos = field.selectionEnd;
			field.value = field.value.substring(0, startPos) + text + field.value.substring(endPos, field.value.length);
			field.selectionStart = startPos + text.length;
			field.selectionEnd = startPos + text.length;
    } else {
			field.value += text;
		}
	},

}
