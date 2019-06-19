"use strict";

sbApp.services.history = {

	doc: null,

	init: async function() {
		this.doc = { _id: 'history', items: [], tags: [] };
		await idbKeyval.set('history', this.doc);
	},
	
	setdoc: async function(doc) {
		this.doc = doc;
		await idbKeyval.set('history', this.doc);
	},

	update: async function(title) {
		let item = sbApp.services.list.parseItem(title);

		this.doc.items.push(item.longtitle);
		sbApp.util.sort(this.doc.items);
		this.doc.items = sbApp.util.unique(this.doc.items);
		if (this.doc.items.length > 100) this.doc.items = this.doc.items.slice(0, 100);

		if (item.tags.length > 0) {
			this.doc.tags = item.tags.concat(this.doc.tags);
			this.doc.tags = sbApp.util.unique(this.doc.tags);
			this.doc.tags = this.doc.tags.slice(0, 8);
			sbApp.util.sort(this.doc.tags);
		}
		
		let response = await sbApp.ldb.put(this.doc);
		if (this.doc._rev === undefined) this.doc._rev = response.rev;

		await idbKeyval.set('history', this.doc);
	},
	
	remove: async function(value) {
		if (value.tag !== undefined) {
			let index = this.doc.tags.indexOf(value.tag);
			if (index >= 0) this.doc.tags.splice(index, 1);
		} else {
			let index = this.doc.items.indexOf(value.item);
			if (index >= 0) this.doc.items.splice(index, 1);
		}

		let response = await sbApp.ldb.put(this.doc);
		if (this.doc._rev == undefined) this.doc._rev = response.rev;

		await idbKeyval.set('history', this.doc);
	},

};