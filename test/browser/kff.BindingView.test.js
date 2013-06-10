if(typeof require === 'function') var kff = require('../build/kff-all.js');

describe('kff.BindingView', function()
{

	it('should bind a simple collection', function()
	{
		var collection = new kff.Collection();
		collection.append(new kff.Model());
		collection.append(new kff.Model());
		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection"/>');
		$div1.append($div2);
		var view = new kff.BindingView(
		{
			element: $div1,
			models: {
				collection: collection
			}
		});
		view.init();

		setTimeout(function(){

			$div1.find('div').length.should.equal(2);

		}, 0);

	});

	it('should bind a collection with text binder on the same element', function()
	{
		var collection = new kff.Collection();
		var model1 = new kff.Model({ name: 'foo' });
		var model2 = new kff.Model({ name: 'bar' });
		collection.append(model1);
		collection.append(model2);
		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection .name:text"/>');
		$div1.append($div2);
		var view = new kff.BindingView(
		{
			element: $div1,
			models: {
				collection: collection
			}
		});
		view.init();

		setTimeout(function(){

			$div1.find('div').length.should.equal(2);
			$div1.find('div').eq(0).text().should.equal('foo');
			$div1.find('div').eq(1).text().should.equal('bar');

			collection.remove(model1);

			$div1.find('div').length.should.equal(1);
			$div1.find('div').eq(0).text().should.equal('bar');
		}, 0);

	});

});
