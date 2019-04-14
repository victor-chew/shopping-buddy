"use strict";

// Source: https://gist.github.com/mudge/5830382
// Modified on() to add listener only if it does not already exist in array
class EventEmitter{

	constructor(){
		this.events = {};
	}

	_getEventListByName(eventName){
		if(this.events[eventName] === undefined){
			this.events[eventName] = new Set();
		}
		return this.events[eventName];
	}

	on(eventName, fn){
		let list = this._getEventListByName(eventName);
		if (!list.has(fn)) this._getEventListByName(eventName).add(fn);
	}

	once(eventName, fn){
		const self = this;
		const onceFn = function(...args){
			self.removeListener(eventName, onceFn);
			fn.apply(self, args);
		};
		this.on(eventName, onceFn);
	}

	emit(eventName, ...args){
		this._getEventListByName(eventName).forEach(function(fn){
			fn.apply(this,args);
		}.bind(this));
	}

	removeListener(eventName, fn){
		this._getEventListByName(eventName).delete(fn);
	}
}
