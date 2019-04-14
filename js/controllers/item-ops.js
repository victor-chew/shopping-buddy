"use strict";

sbApp.controllers['page-item-ops'] = {

	isUpdated: false,
	imageData: null,

	init: function(page) {
		this.isUpdated = false;
		this.imageData = null;
		// Page setup
		let data = document.querySelector('#id-navigator').topPage.data;
		switch(data.func) {
			case 'new':
				page.querySelector('#id-page-title').textContent = 'Add new item';
				page.querySelector('#id-item-title').value = '';
				page.querySelector('#id-submit').addEventListener('click', this.addItem.bind(this));
				break;
			case 'edit':
				page.querySelector('#id-page-title').textContent = 'Edit item';
				page.querySelector('#id-item-title').value = data.item.doc.title;
				page.querySelector('#id-submit').addEventListener('click', this.updateItem.bind(this));
				// Setup item image if available
				if (data.item.doc._attachments !== undefined) {
					this.imageData = data.item.doc._attachments.image.data;
					let reader = new FileReader;
					reader.addEventListener('load', () => page.querySelector('#id-item-image').src = reader.result);
					reader.readAsDataURL(this.imageData);
				}
				break;
		};
		// Confirm cancellation when back button is clicked
		page.querySelector('ons-back-button').onClick = this.abortItem.bind(this);
		// Click on submit button when enter key is pressed in input fields
		page.querySelector('#id-item-title').addEventListener('keyup', this.onKeyUp.bind(this));
		// Show autocomplete popover when input changes
		page.querySelector('#id-item-title').addEventListener('input', this.onInput.bind(this));
		// Camera button proxies to actual file input element
		page.querySelector('#id-camera-input').addEventListener('click', this.onGetImage.bind(this));
		// Process image upon user selection
		page.querySelector('#id-image-reader').addEventListener('change', this.onImageSelected.bind(this));
		// Set focus on first input field
		page.querySelector('#id-item-title').querySelector('input').focus();
	},
	
	onGetImage: async function(event) {
		let page = document.querySelector('#id-navigator').topPage;
		if (this.imageData !== null) {
			let answer = await ons.notification.confirm({
				title: 'Existing image',
				message: 'Please select an action',
				buttonLabels: ['Cancel', 'Delete', 'Replace'],
			});
			if (answer === 0) return;
			this.isUpdated = true;
			if (answer === 1) {
				this.imageData = null;
				page.querySelector('#id-item-image').src = '';
				return;
			}
		}
		page.querySelector('#id-image-reader').click();
	},
	
	onImageSelected: function(event) {
		let page = document.querySelector('#id-navigator').topPage;
		let reader = new FileReader();
		reader.addEventListener('load', () => {
			let largeImage = new Image;
			largeImage.addEventListener('load', () => {
				let smallImage = this.getSmallImage(page, largeImage);
			});
			largeImage.src = reader.result;
		});
		reader.readAsDataURL(event.target.files[0]);
	},
	
	getSmallImage: async function(page, image) {
		let canvas = document.getElementById('id-canvas');
		if (image.width > image.height) {
			canvas.width = 640;
			canvas.height = 640 * image.height / image.width;
		} else {
			canvas.height = 640;
			canvas.width = 640 * image.width / image.height;
		}
		await window.pica().resize(image, canvas);
		canvas.toBlob(blob => {
			this.imageData = blob;
			let url = URL.createObjectURL(blob);
			let target = page.querySelector('#id-item-image');
			target.addEventListener('load', () => URL.revokeObjectURL(url));
			target.src = url;
		}, 'image/jpeg', 0.7);
	},
	
	validateFields: function(event) {
		let page = document.querySelector('#id-navigator').topPage;
		let title = page.querySelector('#id-item-title').value;
		let pin = sbApp.controllers['page-main'].getPin();
		if (pin !== null) title += ' #' + pin;
		let item = sbApp.services.list.parseItem(title);
		if (item.title.length == 0) {
			sbApp.util.error('Title cannot be empty');
			return false;
		};
		return { page: page, title: item.longtitle };
	},
	
	addItem: async function(event) {
		// Validate fields
		let item = this.validateFields(event);
		if (item === false) return;
		// Add new item
		await sbApp.services.list.addItem(item.title, this.imageData);
		// Go back
		document.querySelector('#id-navigator').popPage();
	},
	
	updateItem: async function(event) {
		// Validate fields
		let item = this.validateFields(event);
		if (item === false) return;
		// Update existing item
		let data = document.querySelector('#id-navigator').topPage.data;
		data.item.doc['title'] = item.title;
		await sbApp.services.list.updateItem(data.item.doc, this.imageData);
		// Go back
		document.querySelector('#id-navigator').popPage();
	},

	abortItem: async function(event) {
		if (this.isUpdated) {
			const button = await ons.notification.confirm({ messageHTML: 'Discard changes?' });
			if (button == 0) return;
		}
		document.querySelector('#id-navigator').popPage();
	},

	onInput: function(event) {
		// Setup
		let page = document.querySelector('#id-navigator').topPage;
		let autocomplete = sbApp.controllers['autocomplete'];
		let input = page.querySelector('#id-item-title');
		let value = input.value;
		// Show autocomplete for tags or items
		if (value[value.length-1] === '#') {
			autocomplete.show(page, input, 'tags');
		}	else {
			autocomplete.show(page, input, 'items');
		}
		this.isUpdated = true;
	},
	
	onKeyUp: function(event) {
		let page = document.querySelector('#id-navigator').topPage;
		if (event.key === 'Enter') return page.querySelector('#id-submit').click();
	},

}
