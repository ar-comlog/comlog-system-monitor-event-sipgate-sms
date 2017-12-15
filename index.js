var util = require('util');
Sipgate = require('./sipgate');

function SipgateSMS(options) {
	var _this = this;

	this.user = null;
	this.password = null;
	this.timeout = 5000;

	this.text = "Service {$label} status changed to {$status} at {$datetime}";
	this.to = "target-number"; // 49123456789
	this.from = 'sipgate-number'; // 49987654321
	this.debug = false;
	this.label = null;

	var _handle = function (reason, res, cb) {
		var err = null;
		if (reason) {
			err = new Error(reason);
			if (_this.debug) console.error(err);
		} else {
			if (_this.debug) console.log(util.inspect(res, {
				colors: true,
				depth: null
			}));
		}
		if (cb) cb(err, res);
	};

	this.start = function(info, cb) {
		var opt = {
			text: this.text,
			to: this.to,
			from: this.from
		};

		if (!info) info = {};
		info.datetime = (new Date())+'';
		for(var i in info) {
			if (typeof info[i] !== 'string' && typeof info[i] !== 'number') continue;
			opt.text = opt.text.split('{$'+i+'}').join(info[i]);
			opt.to = opt.to.split('{$'+i+'}').join(info[i]);
		}

		for(var i in this) {
			if (typeof this[i] !== 'string' && typeof this[i] !== 'number') continue;
			opt.text = opt.text.split('{$'+i+'}').join(this[i]);
			opt.to = opt.to.split('{$'+i+'}').join(this[i]);
		}

		/*new Sipgate({"user": _this.user, "pass": _this.password}, function(sipgate) {
			return sipgate.ownUriListGet().then(
				function (res) { return _handle(null, res, cb); }
				, function (res) { return _handle(res, null, cb); }
			);
		});*/
		new Sipgate({"user": _this.user, "pass": _this.password}, function(sipgate) {
			return sipgate.sessionInitiate({
				TOS:'text',
				RemoteUri: 'sip:'+opt.to+'@sipgate.net',
				LocalUri: 'sip:'+opt.from+'@sipgate.net',
				Content: opt.text
			}).then(
				function (res) { _handle(null, res, cb); },
				function (res) { _handle(res, null, cb); }
			);
		});
	};

	if (options) for(var i in options) this[i] = options[i];
	if (!this.label) this.label = this.name || this.host || 'unbekannt';

	this.to = this.to.replace(/[^0-9]/g, '');
	if (this.to.substr(0, 2) === '00') this.to = this.to.substr(2);
	if (this.to.substr(0, 1) === '0') this.to = '49' + this.to.substr(1);
	if (this.to.substr(0, 1) === '+') this.to = this.to.substr(1);
}

module.exports = SipgateSMS;