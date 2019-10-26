"use strict";

var VERSION = 'r0157';

self.importScripts('./js/lib/idb-keyval-iife-3.2.0.min.js');
self.importScripts('./js/lib/pouchdb-7.0.0.min.js');

self.addEventListener('install', event => {
	console.log(VERSION + ': Service worker install');
	event.waitUntil(
		caches.open(VERSION).then(cache => {
			return cache.addAll([
				'/',
				'/app.webmanifest',
				'/appicon-src.png',
				'/appicon.png',
				'/favicon.png',
				'/index.html',
				'/style.css',
				'/worker.js',
				'/html/item-ops.html',
				'/html/list-ops.html',
				'/html/menu.html',
				'/js/app.js',
				'/js/eventemitter.js',
				'/js/mutex.js',
				'/js/util.js',
				'/js/controllers/autocomplete.js',
				'/js/controllers/index.js',
				'/js/controllers/item-ops.js',
				'/js/controllers/list-ops.js',
				'/js/controllers/menu.js',
				'/js/services/bookmarks.js',
				'/js/services/history.js',
				'/js/services/list.js',
				'/js/lib/idb-keyval-iife-3.2.0.min.js',
				'/js/lib/pica-5.0.0.min.js',
				'/js/lib/pouchdb-7.0.0.min.js',
				'/js/lib/onsenui-2.10.8/js/onsenui.min.js',
				'/js/lib/onsenui-2.10.8/css/onsenui-core.min.css',
				'/js/lib/onsenui-2.10.8/css/dark-onsen-css-components.min.css',
				'/js/lib/onsenui-2.10.8/css/material-design-iconic-font/css/material-design-iconic-font.min.css',
				'/js/lib/onsenui-2.10.8/css/material-design-iconic-font/fonts/Material-Design-Iconic-Font.woff2',
				'/js/lib/onsenui-2.10.8/css/material-design-iconic-font/fonts/Material-Design-Iconic-Font.woff',
				'/js/lib/onsenui-2.10.8/css/material-design-iconic-font/fonts/Material-Design-Iconic-Font.ttf',
			]);
		})
	);
});

self.addEventListener('activate', event => {
	console.log(VERSION + ': Service worker activate');
	event.waitUntil(caches.keys()
		.then(keys => {
			return Promise.all(keys.map(key => {
				if (key != VERSION) return caches.delete(key);
			}));
		})
		.then(() => {
			return self.clients.claim();
		})
	);
});

self.addEventListener('fetch', event => {
	console.log(VERSION + ': onfetch = ' + event.request.url);
	event.respondWith(caches.match(event.request)
		.then(cached => cached || fetch(event.request))
	);
});

self.addEventListener('message', event => {
	console.log(VERSION + ': onmessage = ' + event.data);
	if (event.data === 'skip-waiting') return skipWaiting();
	if (event.data === 'get-version') return event.ports[0].postMessage(VERSION);
});

self.addEventListener('sync', event => {
	console.log(VERSION + ': onsync = ' + event.tag);
	if (event.tag === 'background-sync') event.waitUntil(backgroundSync());
});

async function backgroundSync() {
	let listName = await idbKeyval.get('listName');
	let listPin = await idbKeyval.get('listPin');
	let dbName = await idbKeyval.get('dbName');
	let dbUser = await idbKeyval.get('dbUser');
	let dbPass = await idbKeyval.get('dbPass');
	let ldb = new PouchDB({
		name: listName + '-' + listPin,
		'revs_limit' : 50,
	});
	let rdb = new PouchDB({
		name: 'https://node10.vpslinker.com:6984/' + dbName,
		revs_limit: 50,
		auth: { 'username' : dbUser, 'password' : dbPass },
	});
	await ldb.sync(rdb);
}

