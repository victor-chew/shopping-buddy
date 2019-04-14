"use strict";

sbApp.controllers['page-menu'] = {

	init: function(page) {
		// Display version number
		page.querySelector('#id-version').textContent = sbApp.version;
		// Callback for menu item "Settings"
		page.querySelector('#id-settings').onclick = function() {
			document.querySelector('#id-splitter').left.toggle();
			document.querySelector('#id-navigator').pushPage('html/list-ops.html', { data: { func: 'settings' } } );
		}
		// Callback for menu item "Create new list"
		page.querySelector('#id-new-list').onclick = function() {
			document.querySelector('#id-splitter').left.toggle();
			document.querySelector('#id-navigator').pushPage('html/list-ops.html', { data: { func: 'new' } } );
		}
		// Callback for menu item "Open existing list"
		page.querySelector('#id-open-list').onclick = function() {
			document.querySelector('#id-splitter').left.toggle();
			document.querySelector('#id-navigator').pushPage('html/list-ops.html', { data: { func: 'open' } } );
		}
		// Callback when bookmarks list needs to be updated
		this.refreshBookmarks();
		sbApp.services.bookmarks.on('bookmarks-changed', this.refreshBookmarks);
	},

	refreshBookmarks: async function() {
		let controller = sbApp.controllers['page-menu'];
		let list = document.querySelector('#id-bookmarks');
		let clone = list.cloneNode(false);
		let bookmarks = await idbKeyval.get('bookmarks');
		if (bookmarks === undefined) bookmarks = [];
		if (bookmarks.length === 0) {
			list.style.display = 'none';
		}
		else {
			list.style.display = 'block';
			let header = ons.createElement('<ons-list-header>Bookmarks</ons-list-header>');
			clone.insertBefore(header, null);
			for (let i=0; i<bookmarks.length; i++) {
				let sep = bookmarks[i].lastIndexOf(':::');
				let name = bookmarks[i].substr(0, sep);
				let pin = bookmarks[i].substr(sep+3);
				let item	= ons.createElement(
					'<ons-list-item tappable><ons-icon icon="md-bookmark"></ons-icon>&nbsp;&nbsp;' + name +
					'<div class="right"><ons-toolbar-button id="id-remove-' + i + '" icon="md-close" /></div></ons-list-item>'
				);
				item.onclick = function(event) {
					let target = event.target.closest('ons-list-item');
					sbApp.util.waitFor(async function() {
						document.querySelector('#id-splitter').left.toggle();
						await sbApp.services.list.open(target.data.name, target.data.pin);
						sbApp.util.alert('List opened');
					});
				};
				item.querySelector('#id-remove-' + i).onclick = async function(event) {
					event.stopPropagation();
					let confirm = await ons.notification.confirm('Remove bookmark?');
					if (confirm) {
						let target = event.target.closest('ons-list-item');
						sbApp.services.bookmarks.remove(target.data);
					}
				};
				item.data = { name: name, pin: pin, index: i };
				clone.insertBefore(item, null);
			}
		}
		list.parentNode.replaceChild(clone, list);
	},

};
