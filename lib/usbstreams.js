var
	_      = require('lodash'),
	events = require('events'),
	stream = require('stream'),
	usb    = require('usb'),
	util   = require('util'),
	P      = require('p-promise')
	;

// ----- Wrap the node-usb incoming stream-like object with new node streams

function ReadableUSBStream(endpoint, options)
{
	stream.Readable.call(this, options);

	this.endpoint = endpoint;
	this.endpoint.addListener('data', this.onData.bind(this));
	this.endpoint.addListener('error', this.onError.bind(this));
	this.endpoint.addListener('end', this.onEnd.bind(this));

	this.paused = true;
}
util.inherits(ReadableUSBStream, stream.Readable);

ReadableUSBStream.prototype._read = function(size)
{
	if (this.paused)
	{
		this.paused = false;
		this.endpoint.startPoll(3, 64, function () {
			return;
		});
	}
};

ReadableUSBStream.prototype.onData = function(chunk)
{
	if (!this.push(chunk))
	{
		this.paused = true;
		this.endpoint.stopPoll();
	}
};

ReadableUSBStream.prototype.onError = function(error)
{
	// TODO
	console.log(error);
};

ReadableUSBStream.prototype.onEnd = function()
{
	// TODO
	console.log('readable stream end');
};

// ----- Wrap the node-usb outgoing stream-like-object with new node streams

function WritableUSBStream(endpoint, options)
{
	options = options || {};
	options.decodeStrings = false;
	stream.Writable.call(this, options);

	this.paused = false;

	this.endpoint = endpoint;
	this.endpoint.addListener('drain', this.onDrain.bind(this));
	this.endpoint.addListener('error', this.onError.bind(this));
	this.endpoint.addListener('end', this.onEnd.bind(this));

	this.endpoint.startPoll(3, 64, function () {
		return;
	});
}
util.inherits(WritableUSBStream, stream.Writable);

WritableUSBStream.prototype._write = function(chunk, encoding, callback)
{
	this.endpoint.transfer(chunk, callback());
};

WritableUSBStream.prototype.onDrain = function()
{
	// console.log('drain');
};

WritableUSBStream.prototype.onError = function(err)
{
	console.log('error in out stream:', err);
};

WritableUSBStream.prototype.onEnd = function()
{
	console.log('out stream ended');
};



module.exports =
{
	ReadableUSBStream: ReadableUSBStream,
	WritableUSBStream: WritableUSBStream
};
