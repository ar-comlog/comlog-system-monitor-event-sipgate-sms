var util = require('util');
var Sipgate = require('sipgateio');

function SipgateSMS(options) {
	var _this = this;

	this.user = null;
	this.password = null;
	this.timeout = 5000;

	this.text = "Service {$label} status changed to {$status} at {$datetime}";
	this.to = ''; // 0123456789
	this.from = ''; // 0987654321
	this.debug = false;
	this.label = null;

	this.logger = console;

	var _handle = function (reason, res, cb) {
		var err = null;
		if (reason) {
			err = new Error(reason);
			if (_this.debug) _this.logger.error(err);
		} else {
			_this.logger.debug('SMS Sent!');
		}
		if (cb) cb(err, res);
	};

	this.start = function(info, cb) {
		var opt = {
			message: this.text,
			to: this.to,
			smsId: 's1'
		};

		if (this.from) opt.from = this.from;

		if (!info) info = {};
		info.datetime = (new Date())+'';
		for(var i in info) {
			if (typeof info[i] !== 'string' && typeof info[i] !== 'number') continue;
			opt.message = opt.message.split('{$'+i+'}').join(info[i]);
			opt.to = opt.to.split('{$'+i+'}').join(info[i]);
		}

		for(var i in this) {
			if (typeof this[i] !== 'string' && typeof this[i] !== 'number') continue;
			opt.message = opt.message.split('{$'+i+'}').join(this[i]);
			opt.to = opt.to.split('{$'+i+'}').join(this[i]);
		}

		var client;
		if (_this.user.indexOf('token') === 0) {
			client = Sipgate.sipgateIO({tokenId: _this.user, token: _this.password});
		}
		else {
			client = Sipgate.sipgateIO({username: _this.user, password: _this.password});
		}

		var sms = Sipgate.createSMSModule(client);

		sms
			.send(opt)
			.then(function () {
				_handle(null, null, cb);
				console.log('Sms sent.');
			})
			.catch(function (e) {
				_handle(e, null, cb);
			});

		return;
	};

	if (options) for(var i in options) this[i] = options[i];
	if (!this.label) this.label = this.name || this.host || 'unbekannt';

	var escape = function (nr) {
		if (!nr) return nr;
		nr = nr.replace(/[^0-9]/g, '');
		if (nr.substring(0, 2) === '00') nr = nr.substring(2);
		if (nr.substring(0, 1) === '0') nr = '49' + nr.substring(1);
		if (nr.substring(0, 1) === '+') nr = nr.substring(1);
		nr = '+'+nr;
		return nr;
	}

	this.to = escape(this.to);
	this.from = escape(this.from);
}

module.exports = SipgateSMS;
