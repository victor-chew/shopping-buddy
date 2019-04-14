"use strict";

window.sbApp = {
	version: 'r0136',
	controllers: {},
	services: {},
	util: {},
	ldb: null,
	rdb: null,
};

ons.platform.select('android');

// Call init() function for each page controller
document.addEventListener('init', async function(event) {
	// Each page calls its own controller initializer
	let page = event.target;
	if (sbApp.controllers.hasOwnProperty(page.id)) {
		console.log('init(' + page.id + ')');
		sbApp.controllers[page.id].init(page);
	}
});

window.addEventListener('load', () => {
	navigator.serviceWorker.register('worker.js').then(reg => {
		if (navigator.serviceWorker.controller === null) return;
		if (reg.waiting) this.confirmUpdate(reg);
		reg.onupdatefound = () => {
			if (reg.installing) {
				reg.installing.onstatechange = event => {
					switch(event.target.state) {
						case 'installed': this.confirmUpdate(reg); break;
						case 'activated':	window.location.reload(); break;
					}
				}
			}
		}
	});
});

function confirmUpdate(reg) {
	getWorkerVersion(reg.waiting)
		.then(newVer => ons.notification.toast('New version ' + newVer + ' available', { buttonLabel: 'Update' , timeout: 30000 }))
		.then(async response => {
			if (response >= 0) {
				sbApp.util.block('Please wait...');
				// Stop background database sync, otherwise skipWaiting() will not work
				await sbApp.services.list.stopSync();
				reg.waiting.postMessage('skip-waiting');
			}
		});
}

function getWorkerVersion(worker) {
	return new Promise((resolve, reject) => {
		var channel = new MessageChannel();
		channel.port1.onmessage = event => {
			if (!event.data.error) resolve(event.data); else reject(event.data.error);
		};
		worker.postMessage('get-version', [ channel.port2 ]);
	});
}
