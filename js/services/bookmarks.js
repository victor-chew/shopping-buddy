"use strict";

sbApp.services.bookmarks = {

	emitter: new EventEmitter(),

	on: function(evt, func) {
		this.emitter.on(evt, func);
	},

	switchTo: async function(listName, listPin) {
		let curListName = await idbKeyval.get('listName');
		let curListPin = await idbKeyval.get('listPin');
		if (curListName !== undefined) {
			let bookmarks = await idbKeyval.get('bookmarks');
			if (bookmarks === undefined) bookmarks = [];
			// Add current list to bookmarks
			bookmarks.push(curListName + ':::' + curListPin);
			// Remove duplicate bookmarks
			bookmarks = sbApp.util.unique(bookmarks);
			// Remove target list from bookmarks (if exists)
			bookmarks = bookmarks.filter(bookmark => bookmark !== listName + ':::' + listPin);
			await idbKeyval.set('bookmarks', bookmarks);
			this.emitter.emit('bookmarks-changed');
		}
	},

	remove: async function(target) {
		let bookmarks = await idbKeyval.get('bookmarks');
		let ldb = new PouchDB(target.name + '-' + target.pin);
		await ldb.destroy();
		bookmarks.splice(target.index, 1);
		await idbKeyval.set('bookmarks', bookmarks);
		this.emitter.emit('bookmarks-changed');
	},

};