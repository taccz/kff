if(typeof require === 'function') var kff = require('../build/kff-all.js');

describe('kff.extends', function()
{
	it('should create a class constructor that extends another class', function()
	{
		var A = function(){};
		var B = function(){};
		kff.extend(B, A);

		var objB = new B;

		objB.should.be.an.instanceOf(A);
		objB.should.be.an.instanceOf(B);
	});
});

describe('kff.mixins', function()
{
	it('should mixin properties from one object', function()
	{
		var a = { prop1: 'prop1' };
		var b = { prop2: 'prop2' };
		var ret;

		ret = kff.mixins(b, a);

		b.should.have.property('prop1');
		b.should.have.property('prop2');
		b.prop1.should.equal('prop1');
		b.should.equal(ret);
	});

	it('should mixin properties from multiple objects', function()
	{
		var a = { prop1: 'prop1' };
		var b = { prop2: 'prop2', prop3: 'prop3' };
		var c = { prop3: 'prop3c', prop4: 'prop4' };

		kff.mixins(a, b, c);

		a.should.have.property('prop1');
		a.should.have.property('prop2');
		a.should.have.property('prop3');
		a.should.have.property('prop4');
		a.prop3.should.equal('prop3c');
		a.prop4.should.equal('prop4');
	});

	it('should mixin properties from one objects using deep flag', function()
	{
		var a = { prop1: 'prop1', prop3: { prop4: 'prop4' }};
		var b = { prop2: 'prop2', prop3: { prop4: 'prop4b', prop5: 'prop5b' } };
		var ret;

		ret = kff.mixins(a, b, true);

		a.should.have.property('prop1');
		a.should.have.property('prop2');
		a.should.have.property('prop3');

		a.prop2.should.equal('prop2');
		a.prop3.prop4.should.equal('prop4b');
		a.prop3.prop5.should.equal('prop5b');
	});

	it('should deep mixin property with null value in extended object', function()
	{
		var a = { prop1: { prop2: null }};
		var b = { prop1: { prop2: 'prop2', prop3: 'prop3' } };
		var ret;

		ret = kff.mixins(a, b, true);

		a.should.have.property('prop1');
		a.prop1.prop2.should.equal('prop2');
		a.prop1.prop3.should.equal('prop3');
	});

	it('should deep mixin property with null value in extending object', function()
	{
		var a = { prop1: { prop2: 'prop2' }};
		var b = { prop1: { prop2: null, prop3: 'prop3' } };
		var ret;

		ret = kff.mixins(a, b, true);

		a.should.have.property('prop1');

		should.equal(a.prop1.prop2, null);
		a.prop1.prop3.should.equal('prop3');
	});
});

describe('kff.createClass', function()
{
	var A = kff.createClass(
	{
		mixins: {
			m1: 15,
			m2: 'test'
		}
	},
	{
		constructor: function()
		{
			this.a = 42;
		},

		getA: function()
		{
			return this.a;
		}
	});
	var objA = new A();

	it('should create a class with mixins', function()
	{
		objA.should.be.an.instanceof(A);
		objA.a.should.equal(42);
		objA.m1.should.equal(15);
		objA.m2.should.equal('test');
	});

	it('should create a class with mixins and extends', function()
	{
		var B = kff.createClass({
			extend: A,
			mixins: {
				m3: 'm3'
			}
		},{
			constructor: function()
			{
				this.constructor._super.constructor.call(this);
			}
		});

		var objB = new B();
		objB.should.be.an.instanceof(A);
		objB.should.be.an.instanceof(B);

		objB.a.should.equal(42);
		objB.getA().should.equal(42);
		objB.m1.should.equal(15);
		objB.m2.should.equal('test');
		objB.m3.should.equal('m3');
	});

});

