if(typeof require === 'function') var kff = require('../build/kff-all.js');


describe('kff.List', function()
{

	it('should append two values to the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('B');
		list.count.should.equal(2);
	});

	it('should append two values then remove last one from the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('B');
		list.remove('B');
		list.count.should.eql(1);
	});

	it('should append two values then remove first one from the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('B');
		list.remove('A');
		list.count.should.eql(1);
		list.indexOf('B').should.eql(0);
	});

	it('should append two values to the list then remove both', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('B');
		list.remove('A');
		list.remove('B');
		list.count.should.eql(0);
	});

	it('should insert one value to the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('C');
		list.insert('B', 1);

		list.count.should.eql(3);
		list.findByIndex(1).should.equal('B');
	});

});
