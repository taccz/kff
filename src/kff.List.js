
kff.List = kff.createClass(
/** @lends kff.List.prototype */
{
	/**
	 * Class representing a list data structure.
	 * @constructs
	 */
	constructor: function()
	{
		this.array = [];
	},

	/**
	 * Returns number of items in the list.
	 *
	 * @return {number} Number of items (length of the list)
	 */
	count: function()
	{
		return this.array.length;
	},

	/**
	 * Iterates over each item in the list
	 * @param {function} fn A callback function to be called on each item. Takes two arguments - the iterated item and its index
	 */
	each: function(fn)
	{
		var a = this.array, l = a.length, i = 0;
		for(; i < l; i++)
		{
			if(fn.call(null, a[i], i) === false) break;
		}
	},

	/**
	 * Appends an item at the end of the list
	 * @param {mixed} item Item to be appended
	 */
	append: function(item)
	{
		this.array.push(item);
	},

	/**
	 * Inserts an item at specified index
	 * @param {mixed} item Item to be inserted
	 */
	insert: function(item, index)
	{
		this.array.splice(index, 0, item);
	},

	/**
	 * Removes item from the list
	 * @param {mixed} item Reference to the item to be removed
	 * @returns {number|false} Index of removed item or false if not found
	 */
	remove: function(item)
	{
		var i, a = this.array, currentItem, removed;
		if(typeof item === 'function')
		{
			removed = [];
			for(i = a.length - 1; i >= 0; i--)
			{
				currentItem = a[i];
				if(item(currentItem) === true)
				{
					this.array.splice(i, 1);
					removed.push({ item: currentItem, index: i });
				}
			}
			if(removed.length === 0) return false;
			else return removed;
		}
		else
		{
			i = kff.arrayIndexOf(a, item);
			if(i === -1) return false;
			a.splice(i, 1);
			return i;
		}
	},

	/**
	 * Removes items that pass filter function test from the list
	 * @param {function} fn Test function that accepts one argument (item). Returns false to remove item or true to leave it in the list.
	 */
	filter: function(fn)
	{
		var a = this.array, item;
		for(var i = a.length - 1; i >= 0; i--)
		{
			item = a[i];
			if(fn(item) !== true) this.remove(item);
		}
	},

	/**
	 * Removes all items from the list.
	 */
	empty: function()
	{
		this.array = [];
	},

	/**
	 * Splice list. Behavior is the same as of Array.splice.
	 */
	splice: function()
	{
		Array.prototype.splice.apply(this.array, arguments);
	},

	/**
	 * Returns an index of given item
	 *
	 * @param {mixed} item Value to be found
	 * @returns {number} index of the item or -1 if not found
	 */
	indexOf: function(item)
	{
		return kff.arrayIndexOf(this.array, item);
	},

	/**
	 * Sets an item at given position
	 *
	 * @param {number} index Index of item
	 * @param {mixed} item Item to set
	 */
	set: function(index, item)
	{
		if(this.array[index] !== undefined)	this.array[index] = item;
		else throw new RangeError('Bad index in kff.List.set');
	},

	/**
	 * Returns an item at given position
	 *
	 * @param {number} index Index of item
	 * @returns {mixed} Item at given position (or undefined if not found)
	 */
	get: function(index)
	{
		return this.array[index];
	},

	/**
	 * Sorts list using a compare function. The compare function follows the same specification
	 * as the standard Array.sort function
	 *
	 * @param {function} compareFunction Compare function
	 */
	sort: function(compareFunction)
	{
		this.array.sort(compareFunction);
	},

	/**
	 * Randomizes items in the list.
	 */
	shuffle: function()
	{
		var arr = this.array,
			len = arr.length,
			i = len,
			p, t;

		while(i--)
		{
			p = parseInt(Math.random()*len, 10);
			t = arr[i];
			arr[i] = arr[p];
			arr[p] = t;
		}
	}

});

// Backward-compatible alias:
kff.List.prototype.findByIndex = kff.List.prototype.get;
