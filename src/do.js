/*
 * Do.js - Simple Event Listener/Dispatcher System
 */
function Do(parent) {
	var listeners = [];
	this.do = function(callback) {
		listeners.push(callback);
	};
	this.undo = function(callback) {
		listeners.splice(listeners.indexOf(callback), 1);
	};
	this.fire = function() {
		for (var v = 0; v<listeners.length; v++) {
			listeners[v].apply(parent, arguments);
		}
	};
}