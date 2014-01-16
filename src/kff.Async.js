
kff.Async = kff.createClass(
/** @lends kff.Async.prototype */
{
	/**
	 * @constructs
	 */
	constructor: function(attrs)
	{
		this.events = new kff.Events();
		this.callbacks = [];
		this.unresolvedCount = 0;
	},

	add: function()
	{
		var that = this;
		var item = {
			resolved: false,
			value: null,
			callback: function(value)
			{
				that.resolve(item);
				item.value = value;
			}
		};
		this.callbacks.push(item);
		this.unresolvedCount++;
		return item.callback;
	},

	resolve: function(item)
	{
		var i = kff.arrayIndexOf(this.callbacks, item);
		if(i !== -1)
		{
			this.callbacks[i].resolved = true;
			this.trigger('each', i, this.callbacks[i].value);
			this.unresolvedCount--;
			if(this.unresolvedCount === 0)
			{
				var values = [];
				for(var j = 0, l = this.callbacks.length; j < l; j++)
				{
					values.push(this.callbacks[j].value);
				}
				this.trigger('all', values);
			}
		}
	},

	on: function(eventType, fn)
	{
		if(eventType === 'all' && this.unresolvedCount === 0)
		{
			var values = [];
			for(var j = 0, l = this.callbacks.length; j < l; j++)
			{
				values.push(this.callbacks[j].value);
			}
			fn.call(null, values);
		}
		return this.events.on(eventType, fn);
	},

	one: function(eventType, fn){ return this.events.one(eventType, fn); },
	off: function(eventType, fn){ return this.events.off(eventType, fn); },
	trigger: function(eventType, eventData){ return this.events.trigger(eventType, eventData); }

});
