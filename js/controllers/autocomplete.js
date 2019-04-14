"use strict";

sbApp.controllers['autocomplete'] = {

	show: async function(page, target, type) {
		let list = page.querySelector('#id-autocomplete-list');
		let clone = list.cloneNode(false);
		let history = await idbKeyval.get('history');
		if (history === undefined) history = { items: [], tags: [] };
		if (this[type === 'tags' ? 'showTags' : 'showItems'](page, target, history, clone)) {
			list.parentNode.replaceChild(clone, list);
			page.querySelector('#id-autocomplete').show(target);
		} else {
			page.querySelector('#id-autocomplete').hide();
			target.querySelector('input').focus();
		}
	},

	hide: function(page) {
		page.querySelector('#id-autocomplete').hide();
		target.querySelector('input').focus();
	},

	// Returns true if there are tags to display
	showTags: function(page, target, history, list) {
		if (history.tags.length === 0) return false;
		history.tags.forEach((tag, index) => {
			let row = ons.createElement('<ons-list-item tappable>#' + tag + '<div class="right">' + 
				'<ons-toolbar-button id="id-remove-' + index + '" icon="md-close" />' +
				'</div></ons-list-item>');
			row.onclick = function(event) {
				let sel = event.currentTarget.closest('ons-list-item');
				sbApp.util.insertAtCursor(target.querySelector('input'), sel.textContent.substring(1) + ' ');
				page.querySelector('#id-autocomplete').hide();
				target.querySelector('input').focus();
			}
			row.querySelector('#id-remove-' + index).onclick = async function(event) {
				event.stopPropagation();
				let sel = event.target.closest('ons-list-item');
				sbApp.services.history.remove({ tag: sel.textContent.substring(1) });
				sel.remove();
				target.querySelector('input').focus();
			};
			list.insertBefore(row, null);
		});
		return true;
	},

	// Returns true if there are matching items to display
	showItems: function(page, target, history, list) {
		let title = target.value.trim();
		let matches = history.items.filter(match => 
			match.length !== title.length && match.toUpperCase().indexOf(title.toUpperCase()) === 0);
		if (title.trim().length === 0 || matches.length === 0) return false;
		if (matches.length > 5) matches = matches.slice(0, 5);
		matches.forEach((match, index) => {
			let row = ons.createElement('<ons-list-item tappable>' + match + '<div class="right">' + 
				'<ons-toolbar-button id="id-remove-' + index + '" icon="md-close" />' +
				'</div></ons-list-item>');
			row.onclick = function(event) {
				let sel = event.currentTarget.closest('ons-list-item');
				target.value = sel.textContent;
				page.querySelector('#id-autocomplete').hide();
				target.querySelector('input').focus();
			}
			row.querySelector('#id-remove-' + index).onclick = async function(event) {
				event.stopPropagation();
				let sel = event.target.closest('ons-list-item');
				sbApp.services.history.remove({ item: sel.textContent });
				sel.remove();
				target.querySelector('input').focus();
			};
			list.insertBefore(row, null);
		});
		return true;
	},

};
