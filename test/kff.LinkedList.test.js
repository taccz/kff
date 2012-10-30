var should = require('should');
var kff = require('../kff-all.js');


describe('kff.LinkedList', function()
{

	it('should append two values to linked list', function()
	{
		var list = new kff.LinkedList();
		list.append('A');
		list.append('B');
		list.count.should.equal(2);
	});

	it('should append two values then remove last one from linked list', function()
	{
		var list = new kff.LinkedList();
		list.append('A');
		list.append('B');
		list.removeVal('B');
		list.count.should.eql(1);
	});
	
	it('should append two values then remove first one from linked list', function()
	{
		var list = new kff.LinkedList();
		list.append('A');
		list.append('B');
		list.removeVal('A');
		list.count.should.eql(1);
		(list.tail.next === null).should.be.true;
	});
	
	it('should append two values to linked list then remove both', function()
	{
		var list = new kff.LinkedList();
		list.append('A');
		list.append('B');
		list.removeVal('A');
		list.removeVal('B');
		list.count.should.eql(0);
		(list.tail.next === null).should.be.true;
		list.tail.should.equal(list.head);
	});
	
});
