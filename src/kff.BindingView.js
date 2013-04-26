
kff.BindingView = kff.createClass(
{
	extend: kff.View,
	staticProperties:
	/** @lends kff.BindingView */
	{
		bindingRegex: /([.a-zA-Z0-9-]+):?([a-zA-Z0-9]+)?(\([^\(\))]*\))?:?([a-zA-Z0-9]+\([a-zA-Z0-9,\s]*\))?:?([a-zA-Z0-9]+\([a-zA-Z0-9,\s]*\))?:?([a-zA-Z0-9]+\([a-zA-Z0-9,\s]*\))?/g,

		modifierRegex: /([a-zA-Z0-9]+)\(([^\(\)]*)\)/,

		commaSeparateRegex: /\s*,\s*/,

		leadingPeriodRegex: /^\./,

		/**
		 * Object hash that holds references to binder classes under short key names
		 * @private
		*/
		binders: {},

		helpers: {},

		/**
		 * Registers binder class
		 *
		 * @param {string} alias Alias name used in binding data-attributes
		 * @param {kff.Binder} binder Binder class to register
		 */
		registerBinder: function(alias, binder)
		{
			kff.BindingView.binders[alias] = binder;
		},

		/**
		 * Registers helper function to be used as parser/formatter
		 *
		 * @param {string} alias Name of helper function
		 * @param {function} helper Helper function
		 */
		registerHelper: function(alias, helper)
		{
			kff.BindingView.helpers[alias] = helper;
		}
	}
},
/** @lends kff.BindingView.prototype */
{
	/**
	 * Specialized View class for two-way data binding.
	 *
	 * @constructs
	 * @augments kff.View
	 */
	constructor: function(options)
	{
		options = options || {};
		this.modelBinders = {};
		this.collectionBinder = null;
		this.bindingIndex = null;

		this.values = {};
		this.formatters = [];
		this.parsers = [];

		kff.View.call(this, options);
	},

	/**
	 * Renders the view and inits bindings.
	 *
	 * @param {Boolean} silent If true, does not trigger events
	 */
	render: function(silent)
	{
		this.initBinding();
		if(this.collectionBinder) this.renderBoundViews();
		kff.BindingView._super.render.call(this, silent);
		setTimeout(this.f('refreshOwnBinders'), 0);
	},

	/**
	 * Destroys the view including bindings.
	 *
	 * @param {Boolean} silent If true, does not trigger events
	 */
	destroy: function(silent)
	{
		this.destroyBinding();
		kff.BindingView._super.destroy.call(this, true);
		this.destroyBoundViews();
		if(!silent) this.trigger('destroy');
	},

	/**
	 * Initializes all bindings.
	 *
	 * Parses data-kff-bind attribute of view element and creates appropriate binder objects.
	 */
	initBinding: function()
	{
		var model, attr, result, subresults, name, binderName, binderParams, formatters, parsers, getters, setters, eventNames;
		var modifierName, modifierParams;
		var dataBind = this.$element.attr(kff.View.DATA_BIND_ATTR);

		var regex = kff.BindingView.bindingRegex;
		var modifierRegex = kff.BindingView.modifierRegex;
		var commaSeparateRegex = kff.BindingView.commaSeparateRegex;
		var leadingPeriodRegex = kff.BindingView.leadingPeriodRegex;

		regex.lastIndex = 0;

		this.modelBinders = {};

		while((result = regex.exec(dataBind)) !== null)
		{
			name = result[1];
			name = name.replace(leadingPeriodRegex, '*.').split('.');

			binderName = result[2];
			binderParams = result[3];

			if(binderParams)
			{
				binderParams = binderParams.slice(1,-1).split(commaSeparateRegex);
			}
			else binderParams = [];

			formatters = [];
			parsers = [];
			setters = [];
			getters = [];
			eventNames = [];

			for(var i = 4, l = result.length; i < l && result[i]; i++)
			{
				subresults = result[i].match(modifierRegex);

				if(subresults)
				{
					modifierName = subresults[1];
					modifierParams = [];

					if(subresults[2])
					{
						modifierParams = subresults[2].split(commaSeparateRegex);
					}

					switch(modifierName){
						case 'f':
							this.parseModifiers(modifierParams, formatters);
							break;
						case 'p':
							this.parseModifiers(modifierParams, parsers);
							break;
						case 'on':
							this.parseSetters(modifierParams, eventNames);
							break;
						case 'set':
							this.parseSetters(modifierParams, setters);
							break;
						case 'get':
							this.parseSetters(modifierParams, getters);
							break;
					}
				}
			}

			model = this.getModel([].concat(name));

			if(model instanceof kff.Collection)
			{
				if(!this.options.isBoundView)
				{
					this.collectionBinder = {
						collection: model
					};
				}
			}
			else
			{
				if(!binderName || !(binderName in kff.BindingView.binders)) break;

				attr = name.pop();
				model = this.getModel(name);

				// Special binding for collection count property
				if(model instanceof kff.Collection && attr === 'count')
				{
					model = this.bindCollectionCount(model);
				}

				if(model instanceof kff.Model)
				{
					if(!(binderName in this.modelBinders))
					{
						this.modelBinders[binderName] = [];
						this.values[binderName] = [];
					}
					var valueIndex = this.modelBinders[binderName].length;
					var modelBinder = new kff.BindingView.binders[binderName]({
						view: this,
						$element: this.$element,
						valueIndex: valueIndex,
						values: this.values[binderName],
						params: binderParams,
						attr: attr,
						model: model,
						formatters: formatters,
						parsers: parsers,
						setters: setters,
						getters: getters,
						eventNames: eventNames
					});

					this.modelBinders[binderName].push(modelBinder);
					this.values[binderName].push(null);

					modelBinder.init();
				}
			}
		}
	},

	/**
	 * Special binding for Collection count property which is not bindable in a standard way.
	 * Creates a proxy model object that observes the collection for a change event and mirrors the
	 * count property of collection in the count attribute of the proxy model.
	 *
	 * @param {kff.Collection} collection The collection to be observed
	 */
	bindCollectionCount: function(collection)
	{
		var model = new kff.Model();
		var handler = function(){
			model.set('count', collection.count());
		};

		handler();

		if(!this.boundCollectionCounts) this.boundCollectionCounts = [];
		this.boundCollectionCounts.push({
			collection: collection,
			handler: handler
		});
		collection.on('change', handler);
		return model;
	},

	/**
	 * Destroys all collectin count bindings previously created by the bindCollectionCount method
	 */
	destroyCollectionCountBindings: function()
	{
		if(this.boundCollectionCounts)
		{
			for(var i = 0, l = this.boundCollectionCounts.length; i < l; i++)
			{
				this.boundCollectionCounts[i].collection.off('change', this.boundCollectionCounts[i].handler);
			}
		}
	},

	/**
	 * Parses modifier parameters of binding. Used to create parsers and formatters.
	 *
	 * @param {Array} modifierParams An arrray with modifier names
	 * @param {Array} modifiers An empty array that will be filled by modifier classes that corresponds to modifier names
	 */
	parseModifiers: function(modifierParams, modifiers)
	{
		for(var j = 0; j < modifierParams.length; j++)
		{
			if(kff.BindingView.helpers[modifierParams[j]]) modifiers.push(kff.BindingView.helpers[modifierParams[j]]);
		}
	},

	/**
	 * Parses modifier parameters of binding. Used to create parsers and formatters.
 	 *
	 * @param {Array} modifierParams An arrray with modifier names
	 * @param {Array} modifiers An empty array that will be filled by modifier classes that corresponds to modifier names
	 */
	parseSetters: function(modifierParams, modifiers)
	{
		for(var j = 0; j < modifierParams.length; j++)
		{
			modifiers.push(modifierParams[j]);
		}
	},

	/**
	 * Destroys all bindings
	 */
	destroyBinding: function()
	{
		for(var b in this.modelBinders)
		{
			for(var i = 0, mb = this.modelBinders[b], l = mb.length; i < l; i++) mb[i].destroy();
		}
		this.modelBinders = {};
		this.values = {};
		this.destroyCollectionCountBindings();
	},

	/**
	 * Renders "bound" views.
	 * This method generates DOM elements corresponding to each item in the bound collection and
	 * creates the bindingView for each element. If the collection changes, it reflects those changes
	 * automatically in real time.
	 */
	renderBoundViews: function()
	{
		this.$anchor = $(document.createTextNode(''));
		this.$element.before(this.$anchor);
		this.$element.remove();
		this.subViewsMap = [];

		// Subview options:
		this.subViewName = this.$element.attr(kff.View.DATA_VIEW_ATTR);
		var opt = this.$element.attr(kff.View.DATA_OPTIONS_ATTR);

		this.initCollectionFilter();

		this.subViewOptions = opt ? JSON.parse(opt) : {};
		this.subViewOptions.parentView = this;

		this.collectionBinder.collection.on('change', this.f('refreshBoundViews'));

		this.refreshBoundViewsAll();

	},

	/**
	 * Inits filtering of colelction items
	 *
	 * @private
	 */
	initCollectionFilter: function()
	{
		var filterName = this.$element.attr('data-kff-filter');


		if(filterName)
		{
			this.collectionFilter =
			{
				model: null,
				fn: null
			};
			filterName = filterName.replace(/^\./, '').split('.');
			if(filterName.length === 1)
			{
				this.collectionFilter.fn = filterName[0];
			}
			else
			{
				this.collectionFilter.fn =  filterName.pop();
				this.collectionFilter.model =  this.getModel([].concat(filterName));
			}
		}
	},

	/**
	 * Destroys previously bound views.
	 *
	 * @private
	 */
	destroyBoundViews: function()
	{
		if(this.elements)
		{
			for(var i = 0, l = this.elements.length; i < l; i++) this.elements[i].remove();
		}
		this.elements = [];
		if(this.$anchor)
		{
			this.$anchor.after(this.$element);
			this.$anchor.remove();
		}
		this.destroySubviews();
	},

	/**
	 * Updates bound views when collection changes.
	 *
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViews: function(event)
	{
		switch(event ? event.type : null)
		{
			case 'append':
				this.refreshBoundViewsOnAppend(event);
				break;
			case 'insert':
				this.refreshBoundViewsOnInsert(event);
				break;
			case 'remove':
				this.refreshBoundViewsOnRemove(event);
				break;
			default:
				this.refreshBoundViewsAll();
		}
	},

	/**
	 * Updates bound views when collection changes by appending item.
	 *
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViewsOnAppend: function(event)
	{
		this.subViewsMap.push({
			renderIndex: null,
			rendered: false
		});
		event.item.on('change', this.f('collectionItemChange'));
		this.collectionItemChange({ model: event.item });
	},
	/**
	 * Updates bound views when collection changes by inserting item.
	 *
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViewsOnInsert: function(event)
	{
		this.subViewsMap.splice(event.index, 0, {
			renderIndex: null,
			rendered: false
		});
		event.item.on('change', this.f('collectionItemChange'));
		this.collectionItemChange({ model: event.item });
	},

	/**
	 * Updates bound views when collection changes by removing item.
	 *
	 * @private
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViewsOnRemove: function(event)
	{
		event.item.off('change', this.f('collectionItemChange'));

		// Find render index:
		for(var i = 0, l = this.subViews.length; i < l; i++)
		{
			if(event.item === this.subViews[i].models['*']) break;
		}

		var renderIndex = i;
		var realIndex = null;

		// Find real index in collection:
		for(var i = 0, l = this.subViewsMap.length; i < l; i++)
		{
			if(this.subViewsMap[i].renderIndex === renderIndex)
			{
				realIndex = i;
				break;
			}
		}

		if(realIndex !== null)
		{
			if(this.subViewsMap[i].rendered) this.removeSubViewAt(renderIndex);
			this.subViewsMap.splice(i, 1);
		}

		this.reindexSubviews(i);
	},

	/**
	 * Updates bound views when collection changes on other events.
	 *
	 * @private
	 */
	refreshBoundViewsAll: function()
	{
		this.destroySubviews();
		if(this.elements)
		{
			for(var i = 0, l = this.elements.length; i < l; i++) this.elements[i].remove();
		}
		this.elements = [];
		this.subViewsMap = [];

		this.collectionBinder.collection.each(this.f(function(item, i)
		{
			this.subViewsMap.push({
				renderIndex: null,
				rendered: false
			});
			item.on('change', this.f('collectionItemChange'));
			this.collectionItemChange({ model: item });

		}));
		this.reindexSubviews();
	},

	/**
	 * Event handler for collection item change
	 *
	 * @private
	 * @param  {mixed} event Model's event object
	 */
	collectionItemChange: function(event)
	{
		var item = event.model,
			i = this.collectionBinder.collection.indexOf(item),
			j,
			renderIndex,
			filter,
			filterModel;

		if(this.collectionFilter)
		{
			filterModel = item;
			if(this.collectionFilter.model) filterModel = this.collectionFilter.model;

			renderIndex = 0;
			filter = !!filterModel[this.collectionFilter.fn].call(filterModel, item);

			if(filter && !this.subViewsMap[i].rendered)
			{
				for(j = 0; j < i; j++)
				{
					if(this.subViewsMap[j].rendered) renderIndex++;
				}
				this.addSubViewAt(i, renderIndex);
			}
			else if(!filter && this.subViewsMap[i].rendered)
			{
				this.subViewsMap[i].rendered = false;
				this.removeSubViewAt(this.subViewsMap[i].renderIndex);
			}
		}
		else
		{
			if(!this.subViewsMap[i].rendered) this.addSubViewAt(i, i);
		}
	},

	/**
	 * Applies filter to the whole collection. Used when the filter changes.
	 *
	 * @private
	 */
	refilterCollection: function()
	{
		this.collectionBinder.collection.each(this.f(function(item, i)
		{
			this.collectionItemChange({ model: item });
		}));
	},

	/**
	 * Removes a view at given index (rendered index)
	 *
	 * @private
	 * @param  {number} renderIndex Rendered index of item
	 */
	removeSubViewAt: function(renderIndex)
	{
		this.subViews[renderIndex].destroy();
		this.subViews.splice(renderIndex, 1);
		this.elements[renderIndex].remove();
		this.elements.splice(renderIndex, 1);

		// Reindex subsequent subviews:
		this.reindexSubviews(renderIndex);
	},

	/**
	 * Adds a view at given index
	 *
	 * @private
	 * @param {number} collectionIndex Index of item in the collection
	 * @param {number} renderIndex     Index of item in the view (view can be filtered)
	 */
	addSubViewAt: function(collectionIndex, renderIndex)
	{
		var item = this.collectionBinder.collection.findByIndex(collectionIndex);
		var $element = this.createSubView(item, renderIndex);

		// debugger;
		if(renderIndex === 0)
		{
			this.$anchor.after($element);
		}
		else
		{
			this.elements[renderIndex - 1].after($element);
		}
		this.elements.splice(renderIndex, 0, $element);

		this.subViewsMap[collectionIndex].renderIndex = renderIndex;
		this.subViewsMap[collectionIndex].rendered = true;

		// Reindex subsequent subviews:
		this.reindexSubviews(renderIndex);
	},

	/**
	 * Refreshes view indices when the collection changes
	 *
	 * @private
	 * @param  {nubmer} from Render index at which reindexing starts
	 * @param  {number} to   Render index at which reindexing ends
	 */
	reindexSubviews: function(from, to)
	{
		if(!from) from = 0;
		if(!to || to > this.subViews.length) to = this.subViews.length;

		// Reindex subsequent subviews:
		for(var i = from; i < to; i++)
		{
			this.subViews[i].setBindingIndex(i);
			this.subViews[i].refreshBinders(true);
		}
		// Reindex subViewsMap
		for(var i = 0, l = this.subViewsMap.length, j = 0; i < l; i++)
		{
			if(this.subViewsMap[i].rendered)
			{
				this.subViewsMap[i].renderIndex = j;
				j++;
			}
			else this.subViewsMap[i].renderIndex = null;
		}
	},

	/**
	 * Creates a new subview for item in collection
	 * @param  {kff.Model} item Item for data-binding
	 * @param  {number} i 		Binding index
	 * @return {jQuery} 		JQuery-wrapped DOM element of the view
	 */
	createSubView: function(item, i)
	{
		var $element = this.$element.clone();

		this.subViewOptions.element = $element;
		this.subViewOptions.models = { '*': item };
		this.subViewOptions.isBoundView = true;
		var subView = this.viewFactory.createView(this.subViewName, this.subViewOptions);
		if(subView instanceof kff.View)
		{
			subView.viewFactory = this.viewFactory;
			this.subViews.splice(i, 0, subView);
			subView.setBindingIndex(i);
			subView.init();
			$element.attr(kff.View.DATA_RENDERED_ATTR, true);
		}
		return $element;
	},

	/**
	 * Returns model object for given keypath.
	 *
	 * @param  {string|Array} modelPath Object keypath
	 * @return {kff.Model}           	Model found
	 */
	getModel: function(modelPath)
	{
		var modelIndex;
		if(typeof modelPath === 'string') modelPath = modelPath.split('.');

		modelIndex = parseInt(modelPath[0], 10);

		if(this.collectionBinder && !isNaN(modelIndex)) return this.collectionBinder.collection.findByIndex(modelIndex);

		return kff.BindingView._super.getModel.call(this, modelPath);
	},

	/**
	 * Refreshes own data-binders
	 *
	 * @private
	 */
	refreshOwnBinders: function(event)
	{
		for(var b in this.modelBinders)
		{
			for(var i = 0, mb = this.modelBinders[b], l = mb.length; i < l; i++) mb[i].modelChange(true);
		}
		if(event !== true && this.collectionBinder) this.refilterCollection();
	},

	/**
	 * Refreshes binders
	 *
	 * @private
	 */
	refreshBinders: function(event)
	{
		this.refreshOwnBinders(event);
		kff.BindingView._super.refreshBinders.call(this, event);
	},

	renderSubviews: function()
	{
		if(!this.collectionBinder) kff.BindingView._super.renderSubviews.call(this);
	},

	/**
	 * Returns index of item in bound collection (closest collection in the view scope)
	 *
	 * @return {number} Item index
	 */
	getBindingIndex: function()
	{
		if(this.bindingIndex !== null) return this.bindingIndex;
		if(this.parentView instanceof kff.BindingView) return this.parentView.getBindingIndex();
		return null;
	},

	/**
	 * Sets current binding index
	 *
	 * @private
	 */
	setBindingIndex: function(index)
	{
		this.bindingIndex = index;
	},

	/**
	 * Concatenates multiple values using single space as separator.
	 *
	 * @param  {Array} values Array of values
	 * @return {string}       Concatenated string
	 */
	concat: function(values)
	{
		if(values.length === 1) return values[0];
		else return values.join(' ');
	}
});



kff.BindingView.registerHelper('index', function(v)
{
	if(this.getBindingIndex() !== null) return this.getBindingIndex();
	return v;
});

kff.BindingView.registerHelper('indexFromOne', function(v)
{
	if(this.getBindingIndex() !== null) return this.getBindingIndex() + 1;
	return v;
});

kff.BindingView.registerHelper('boolean', function(v)
{
	var parsed = parseInt(v, 10);
	if(!isNaN(parsed)) return !!parsed;
	return v === 'true';
});

kff.BindingView.registerHelper('not', function(v)
{
	return !v;
});

kff.BindingView.registerHelper('null', function(v)
{
	return v === null || v === 'null' ? null : v;
});

kff.BindingView.registerHelper('int', function(v)
{
	v = parseInt(v, 10);
	if(isNaN(v)) v = 0;
	return v;
});

kff.BindingView.registerHelper('float', function(v)
{
	v = parseFloat(v);
	if(isNaN(v)) v = 0;
	return v;
});

kff.BindingView.registerHelper('string', function(v)
{
	return v.toString();
});
