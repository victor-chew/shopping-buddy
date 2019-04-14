"use strict";

sbApp.controllers['page-main'] = {

	pinned: null,

	init: function(page) {
		// Callback for "Menu" button
		page.querySelector('#id-menu').addEventListener('click', () => document.querySelector('#id-splitter').left.toggle());
		// Callback for "New item" button
		let element = page.querySelector('#id-new-item');
		element.onclick = () => document.querySelector('#id-navigator').pushPage('html/item-ops.html', {data:{ func:'new' }});
		element.show && element.show(); // Fix ons-fab in Safari.
		// Callback for "Delete bought" button
		page.querySelector('#id-delete').addEventListener('click', async () => {
			let button = await ons.notification.confirm({ message: 'Delete bought items?' });
			if (button == 1) {
				sbApp.util.waitFor(async function() {
					await sbApp.services.list.deleteBought();
				});
			}
		});
		// Initialize database and refresh view
		sbApp.services.list.on('list-changed', this.refreshList);
		sbApp.services.list.on('initial-sync-start', () => sbApp.util.loading(true));
		sbApp.services.list.on('initial-sync-stop', () => sbApp.util.loading(false));
		sbApp.services.list.init();
	},

	getPin: function() {
		return this.pinned;
	},
	
	refreshList: async function() {
		// Sanity checks
		if (sbApp.ldb === undefined) return;
		// Populate list items
		document.querySelector('#id-list-title').textContent = await idbKeyval.get('listName');
		try {
			// We protect the refresh by a mutex to make sure it runs to completion before 
			// another refresh starts. This prevents the display from being messed up if 
			// another refresh request comes in before the current one finishes.
			let mutex = new Mutex();
			var unlock = await mutex.lock();
			// Setup
			let controller = sbApp.controllers['page-main'];
			let tags = await sbApp.services.list.getAll();
			let list = document.querySelector('#id-main-list');
			let clone = list.cloneNode(false);
			// If a certain tag has been pinned, try looking for it and using only that slice of the tag array.
			// Unpin the tag if the pinned tag cannot be found (maybe it's been removed remotely).
			let ptag = tags.filter(tag => tag.title === controller.pinned);
			if (ptag.length == 0) controller.pinned = null; else tags = ptag; 
			// Generate new list
			tags.forEach(tag => {
				// Handle tag header
				if (tag.title !== '') {
					let header = ons.createElement(
						'<ons-list-header ' +  (controller.pinned === null ? '' : 'class="pinned" ') + 'tappable modifier="longdivider">' +
						(controller.pinned === null ? '' : '<ons-icon icon="md-long-arrow-return"></ons-icon> ') + 
						tag.title + '</ons-list-header>'
					);
					header.data = tag.title;
					header.addEventListener('click', event => {
						let target = event.currentTarget.closest('ons-list-header');
						controller.pinned = (controller.pinned === null) ? target.data : null;
						controller.refreshList();
					});
					clone.insertBefore(header, null);
				}
				// Handle tag items
				tag.items.forEach(item => {
					let checked = item.doc['bought'] ? 'checked' : '';
					let attachment = item.attachment ? '<ons-icon class="item-attachment" icon="md-attachment-alt" />' : '';
					let dom =
							'<ons-list-item tappable modifier="longdivider" id="list-item-' + item.doc._id + '">' +
							'<label class="left">' +
							'<ons-checkbox id="list-bought-' + item.doc._id + '" ' + checked + '></ons-checkbox>' + 
							'</label>' +
							'<div class="center">' + item.title + attachment + '</div>' +
							'<div class="right"><ons-toolbar-button id="button-edit-' + item.doc._id + '" icon="md-edit" /></div>';
							'</ons-list-item>';
					let listItem	= ons.createElement(dom);
					listItem.addEventListener('click', async event => {
						await sbApp.services.list.toggleBought(listItem.data.doc._id);
					});
					listItem.querySelector('#list-bought-' + item.doc._id).addEventListener('click', async event => {
						event.stopPropagation();
						let target = event.currentTarget.closest('ons-list-item');
						await sbApp.services.list.toggleBought(target.data.doc._id);
					});
					listItem.querySelector('#button-edit-' + item.doc._id).addEventListener('click', async event => {
						event.stopPropagation();
						let target = event.currentTarget.closest('ons-list-item');
						document.querySelector('#id-navigator').pushPage('html/item-ops.html', { data: { func: 'edit', item: target.data } } );
					});
					listItem.data = item;
					listItem.data.bought = item.doc.bought;
					listItem.classList[listItem.data.bought ? 'add' : 'remove']('item-bought');
					clone.insertBefore(listItem, null);
				});
			});
			// Replace existing list with new list if different
			list.parentNode.replaceChild(clone, list);
		} finally {
			unlock();
		}
	},
};
