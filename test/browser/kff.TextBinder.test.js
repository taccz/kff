if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.TextBinder', function()
{

	it('should bind text binder', function()
	{
		var $div = $('<div data-kff-bind="myModel.name:text"></div>');
		var view = new kff.BindingView(
		{
			element: $div,
			models: {
				myModel: new kff.Model({
					name: 'Karel'
				})
			}
		});
		view.init();
		setTimeout(function()
		{
			expect($div.text()).to.equal('Karel');
			view.getModel('myModel').set('name', 'Petr');
			expect($div.text()).to.equal('Petr');
		}, 0);
	});

	it('should bind text binder without specified attribute', function()
	{
		var $div = $('<div data-kff-bind="myModel:text:get(getName)"></div>');
		var myModel = new kff.Model({
			name: 'Karel'
		});
		myModel.getName = function()
		{
			return this.get('name')	;
		};

		var view = new kff.BindingView(
		{
			element: $div,
			models: {
				myModel: myModel
			}
		});
		view.init();
		setTimeout(function()
		{
			expect($div.text()).to.equal('Karel');
			view.getModel('myModel').set('name', 'Petr');
			expect($div.text()).to.equal('Petr');
		}, 0);
	});

});
