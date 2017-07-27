'use strict';
var EventEmitter, Q, Sipgate, identity, util, xmlrpc;
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
	for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
	function ctor() { this.constructor = child; }
	ctor.prototype = parent.prototype;
	child.prototype = new ctor;
	child.__super__ = parent.prototype;
	return child;
}, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
util = require('util');
xmlrpc = require('xmlrpc');
Q = require('q');
EventEmitter = require('events').EventEmitter;
identity = [
	{
		ClientName: 'comlog-system-monitor',
		ClientVersion: '0.0.1',
		ClientVendor: 'SebastianJanzen'
	}
];
module.exports = Sipgate = (function() {
	__extends(Sipgate, EventEmitter);
	function Sipgate(auth, callback) {
		var identify;
		this.config = {
			host: "samurai.sipgate.net",
			port: 443,
			path: "/RPC2",
			basic_auth: auth
		};
		this.client = new xmlrpc.createSecureClient(this.config);
		this.methodCall = Q.nbind(this.client.methodCall, this.client);
		identify = this.clientIdentify()["catch"](this._errorHandler);
		if (typeof callback === 'function') {
			identify.then(callback);
		}
	}
	Sipgate.prototype._errorHandler = function(reason) {
		console.error(reason);
		throw new Error(reason);
	};
	Sipgate.prototype._validateResponse = function(response) {
		if (response.StatusCode !== 200) {
			return Q.reject("The Sipgate API returned " + response.StatusCode + ": " + response.StatusString);
		}
		return response;
	};
	Sipgate.prototype._methodCallSafe = function(_arg) {
		var args, method, prefix, responseName;
		method = _arg.method, prefix = _arg.prefix, responseName = _arg.responseName, args = _arg.args;
		if (args == null) {
			args = null;
		}
		if (prefix == null) {
			prefix = 'samurai';
		}
		if (!method) {
			return Q.reject("Method was not set!");
		}
		return this.methodCall("" + prefix + "." + method, args).then(this._validateResponse).then(function(response) {
			if (typeof response[responseName] === 'undefined') {
				return Q.reject("Response does not contain attribute '" + responseName + "'");
			}
			return response[responseName];
		});
	};
	Sipgate.prototype.listMethods = function() {
		return this._methodCallSafe({
			method: 'listMethods',
			prefix: 'system',
			responseName: 'listMethods'
		});
	};
	Sipgate.prototype.clientIdentify = function() {
		return this.methodCall("samurai.ClientIdentify", identity).then(this._validateResponse).then(__bind(function(response) {
			if (response.StatusCode !== 200) {
				return Q.reject("Couldn't identify to server!");
			}
			this.emit("ready", this, response);
			return this;
		}, this));
	};
	Sipgate.prototype.sessionInitiate = function(options) {
		var _ref;
		if ((_ref = options.TOS) == null) {
			options.TOS = 'voice';
		}
		if (!(options.LocalUri && options.RemoteUri)) {
			return Q.reject("Mandatory options: 'LocalUri' and 'RemoteUri'");
		}
		return this._methodCallSafe({
			method: "SessionInitiate",
			args: [options],
			responseName: "SessionID"
		});
	};
	Sipgate.prototype.ownUriListGet = function() {
		return this._methodCallSafe({
			method: "OwnUriListGet",
			responseName: "OwnUriList"
		});
	};
	Sipgate.prototype.sessionStatusGet = function(sessionId) {
		return this._methodCallSafe({
			method: "SessionStatusGet",
			args: [
				{
					SessionID: sessionId
				}
			],
			responseName: "StatusCode"
		});
	};
	Sipgate.prototype.balanceGet = function() {
		return this._methodCallSafe({
			method: "BalanceGet",
			responseName: "CurrentBalance"
		});
	};
	return Sipgate;
})();