
kff.BinderMap = kff.createClass(
/** @lends kff.BinderMap.prototype */
{
	/**
	 * Class for keeping multiple view binders together
	 *
	 * @constructs
	 */
	constructor: function()
	{
		this.binders = [];
	},

	/**
	 * Adds binder
	 * @param {kff.Binder} binder Binder to add
	 */
	add: function(binder)
	{
		this.binders.push(binder);
	},

	/**
	 * Clones binder map
	 *
	 * @return {kff.BinderMap}  Cloned binder map
	 */
	clone: function()
	{
		var clonedBinderMap = new kff.BinderMap(),
			clonedBinders = clonedBinderMap.binders,
			l = this.binders.length;

		while(l--)
		{
			clonedBinders[l] = this.binders[l].clone();
		}
		return clonedBinderMap;
	},

	/**
	 * Sets an owner view to the binder map
	 *
	 * @param {kff.BindingView} view Owner view
	 */
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

	/**
	 * Inits all binders
	 */
	initBinders: function()
	{
		for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].init();
	},

	/**
	 * Destroys all binders
	 */
	destroyBinders: function()
	{
		for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].destroy();
	},

	/**
	 * Refreshes all binders
	 *
	 * @param  {boolean} force Force rebinding models and refreshing DOM
	 */
	refreshBinders: function(force)
	{
		for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].modelChange(null, force);
	},

	/**
	 * Rebinds models of all binders
	 */
	rebindModels: function()
	{
		for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].rebindModel();
	},

	/**
	 * Refreshes only binders that depend on their binding index
	 */
	refreshIndexedBinders: function()
	{
		for(var i = 0, l = this.binders.length; i < l; i++)
		{
			if(this.binders[i].isIndexed())
			{
				this.binders[i].modelChange(null, true);
			}
		}
	}

});
