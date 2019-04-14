"use strict";

sbApp.controllers['page-list-ops'] = {

	init: async function(page) {
		// Page setup
		switch(document.querySelector('#id-navigator').topPage.data.func) {
			case 'settings':
				page.querySelector('#id-page-title').textContent = 'Settings';
				page.querySelector('#id-list-name').value = await idbKeyval.get('listName');
				page.querySelector('#id-list-pin').value = await idbKeyval.get('listPin');
				page.querySelector('#id-section-get-code').style.display = 'none';
				page.querySelector('#id-section-settings').style.display = 'block';
				page.querySelector('#id-section-open').style.display = 'none';
				page.querySelector('#id-submit').addEventListener('click', this.saveSettings.bind(this));
				page.querySelector('#id-get-code').addEventListener('click', this.getCode.bind(this));
				page.querySelector('#id-list-name').querySelector('input').focus();
				break;
			case 'new':
				page.querySelector('#id-page-title').textContent = 'Create list';
				page.querySelector('#id-section-settings').style.display = 'none';
				page.querySelector('#id-section-open').style.display = 'none';
				page.querySelector('#id-submit').addEventListener('click', this.newList.bind(this));
				page.querySelector('#id-list-name').querySelector('input').focus();
				break;
			case 'open':
				page.querySelector('#id-page-title').textContent = 'Open list';
				page.querySelector('#id-section-settings').style.display = 'none';
				page.querySelector('#id-section-open').style.display = 'block';
				page.querySelector('#id-submit').addEventListener('click', this.openList.bind(this));
				page.querySelector('#id-access-code').querySelector('input').focus();
				break;
		}
		// Callback when any input field value changes
		page.querySelector('#id-list-name').addEventListener('input', this.onFieldChange);
		page.querySelector('#id-list-pin').addEventListener('input', this.onFieldChange);
		page.querySelector('#id-access-code').addEventListener('input', this.onFieldChange);
		// Click on submit button when enter key is pressed in input fields
		// Make all code input field uppercase
		page.querySelector('#id-list-name').addEventListener('keyup', this.onKeyUp);
		page.querySelector('#id-list-pin').addEventListener('keyup', this.onKeyUp);
		page.querySelector('#id-access-code').addEventListener('keyup', this.onKeyUp);
	},

	// Validates list name, pin and quick access code
	// Returns { page, listName, listPin and listCode } if validation is successful
	// Otherwise, returns false.
	validateFields: function(event) {
		let page = document.querySelector('#id-navigator').topPage;
		let listName = page.querySelector('#id-list-name').value.trim();
		let listPin = page.querySelector('#id-list-pin').value.trim();
		let listCode = page.querySelector('#id-access-code').value.toUpperCase().trim();
		// Target list code only if non-empty
		if (listCode.length > 0) {
			if (listCode.length !== 4) {
				sbApp.util.error('Quick access code must have exactly 4 characters.');
				return false;
			}
			return { page: page, listName: listName, listPin: listPin, listCode: listCode };
		// Otherwise target list name and PIN
		} else if (listName.length < 10) {
			sbApp.util.error('List name must have at least 10 characters.');
			return false;
		} else if (listPin.length < 4) {
			sbApp.util.error('Access PIN must have at least 4 characters.');
			return false;
		}
		return { page: page, listName: listName, listPin: listPin, listCode: listCode };
	},
	
	getCode: async function(event) {
		// Get code from server
		let code = null;
		await sbApp.util.waitFor(async () => { code = await sbApp.services.list.getQuickAccessCode(); });
		if (code === null) return;
		// Display the code
		let page = document.querySelector('#id-navigator').topPage;
		page.querySelector('#id-get-code').setAttribute('disabled', '');
		page.querySelector('#id-section-get-code').style.display = 'block';
		page.querySelector('#id-code-value').textContent = code;
		// Start countdown
		function setCountdown(page, counter) {
			let mm = '00' + (Math.floor(counter / 60));
			let ss = '00' + (counter % 60);
			mm = mm.substr(-2);
			ss = ss.substr(-2);
			page.querySelector('#id-countdown').textContent = mm + ':' + ss;
		}
		let counter = 5 * 60;
		setCountdown(page, counter);
		let tid = setInterval(() => {
			counter -= 1;
			if (counter > 0) {
				setCountdown(page, counter);
			} else {
				clearInterval(tid);
				page.querySelector('#id-get-code').removeAttribute('disabled');
				page.querySelector('#id-section-get-code').style.display = 'none';
			}
		}, 1000);
	},
	
	saveSettings: async function(event) {
		// Validate fields
		let fields = this.validateFields(event);
		if (fields === false) return;
		// If name and PIN have not changed, no need to do anything
		if (fields.listName === await idbKeyval.get('listName') && fields.listPin === await idbKeyval.get('listPin')) {
			document.querySelector('#id-navigator').popPage();
			return;
		}
		// Confirmation followed by list rename (cloning)
		const button = await ons.notification.confirm({ 
			messageHTML:
				'This will create a clone of the existing list with the new name and PIN.<br /><br />' +
				'All users using the old list name and PIN must switch over to the new one if they want ' + 
				'to access the new list.<br /><br />' +
				'Do you wish to continue?'
		});
		if (button == 1) {
			sbApp.util.waitFor(async () => {
				await sbApp.services.list.copy(fields.listName, fields.listPin);
				document.querySelector('#id-navigator').popPage();
			});
		}
	},
	
	newList: function(event) {
		// Validate fields
		let fields = this.validateFields(event);
		if (fields === false) return;
		// Create new list
		sbApp.util.waitFor(async () => {
			await sbApp.services.list.create(fields.listName, fields.listPin);
			document.querySelector('#id-navigator').popPage();
			sbApp.util.alert('New list created');
		});
	},
	
	openList: function(event) {
		// Validate fields
		let fields = this.validateFields(event);
		if (fields === false) return;
		// Open list
		sbApp.util.waitFor(async () => {
			// Redeem code if present
			if (fields.listCode.length > 0) {
				let json = await sbApp.services.list.redeemQuickAccessCode(fields.listCode);
				fields.listName = json.listName;
				fields.listPin = json.listPin;
			}
			// Open list with given name and PIN
			await sbApp.services.list.open(fields.listName, fields.listPin);
			document.querySelector('#id-navigator').popPage();
			sbApp.util.alert('List opened');
		});
	},
	
	onFieldChange: function(event) {
		let page = document.querySelector('#id-navigator').topPage;
		let listName = page.querySelector('#id-list-name');
		let listPin = page.querySelector('#id-list-pin');
		let listCode = page.querySelector('#id-access-code');
		if (listName.value.length > 0 || listPin.value.length > 0) {
			listCode.setAttribute('disabled', '');
		} else if (listCode.value.length > 0) {
			listName.setAttribute('disabled', '');
			listPin.setAttribute('disabled', '');
		} else {
			listName.removeAttribute('disabled');
			listPin.removeAttribute('disabled');
			listCode.removeAttribute('disabled');
		}
	},
	
	onKeyUp: function(event) {
		if (event.key == 'Enter') {
			event.target.closest('ons-page').querySelector('#id-submit').click();
		} else {
			setTimeout(function() {
				let target = event.target.closest('ons-page').querySelector('#id-access-code');
				target.value = target.value.substr(0, 4).toUpperCase();
			}, 1);
		}
	},
};
