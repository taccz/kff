
kff.BinderMap = kff.createClass(
{
	constructor: function()
	{
		this.binders = [];
	},

	add: function(binder)
	{
		this.binders.push(binder);
	},

	clone: function(options)
	{
		var clonedBinderMap = new kff.BinderMap(),
			clonedBinders = clonedBinderMap.binders,
			i, l;

		for(i = 0, l = this.binders.length; i < l; i++)
		{
			clonedBinders[i] = this.binders[i].clone();
		}
		return clonedBinderMap;
	},

	setView: function(view)
	{
		var i, l, b;
		for(i = 0, l = this.binders.length; i < l; i++)
		{
			b = this.binders[i];
			b.view = view;
			b.$element = view.$element;
			b.model = view.getModel(b.options.modelPathArray);
			b.value = null;
		}
	},

	initBinders: function()
	{
		for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].init();
	},

	destroyBinders: function()
	{
		for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].destroy();
	},

	refreshBinders: function(event)
	{
		for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].modelChange(true);
	}

});
