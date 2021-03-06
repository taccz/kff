if(typeof require === 'function') var kff = require('../build/kff.js');

var Service7 = {};

describe('kff.ServiceContainer', function()
{
	var Service1 = function(a, b){ this.a = a; this.b = b; };
	var Service2 = function(a, b){ this.a = a; this.b = b; };
	var Service4 = function(){ return 's4'; };
	var Service6 = {};

	var config = {
		parameters:
		{
			foo: 'foo',
			bar: 'bar',
			numeric: 42.05,
			obj: { o1: 1, o2: 2 }
		},
		services:
		{
			'service1':
			{
				'construct': Service1,
			    'args': ['%foo%', 'haf']
			},
			'Service7 #1':
			{
			},
			'service2':
			{
				'construct': Service2,
			    'args': ['@service1', '%foo% is not a %bar%'],
			    'shared': true
			},
			'service3':
			{
				'construct': Service1,
			    'args': ['%foo%', '%obj%']
			},
			'service4':
			{
				'construct': Service4,
			    'type': 'function'
			},
			'service4b':
			{
				'construct': Service4,
			    'type': 'factory'
			},
			'Service6': {
				'construct': Service6,
			},
			'Service8': {
				'construct': Service1,
				'args': ['@@Service2', null],
				'shared': true
			}
		}
	};

	var container = new kff.ServiceContainer(config);

	describe('#resolveParameters', function()
	{
		it('should interpolate plain string as the string itself', function()
		{
			expect(container.resolveParameters('This is a plain string')).to.equal('This is a plain string');
		});

		it('should interpolate string with two parameters', function()
		{
			expect(container.resolveParameters('%foo% is not a %bar%')).to.equal('foo is not a bar');
		});

		it('should interpolate string with referece to a service', function()
		{
			expect(container.resolveParameters('@service1') instanceof Service1).to.be.true;
		});

		it('should interpolate object with refereces to parameters and services', function()
		{
			var a = container.resolveParameters({ x: '@service1', y: { z: '%foo% is not a %bar%' }});
			expect(a).to.have.keys('x', 'y');
			expect(a.x instanceof Service1).to.be.true;
			expect(a.y).to.have.property('z', 'foo is not a bar');

		});

		it('should interpolate array with refereces to parameters and services', function()
		{
			var a = container.resolveParameters([ '@service1', { z: '%foo% is not a %bar%' }]);

			expect(a[0] instanceof Service1).to.be.true;
			expect(a[1]).to.have.property('z', 'foo is not a bar');
		});

		it('should interpolate referece to container itself', function()
		{
			var a = container.resolveParameters({ x: '@' });
			expect(a).to.have.property('x');
			expect(a.x).to.equal(container);
		});

		it('should interpolate parameter with single % character', function()
		{
			var a = container.resolveParameters('%foo% is not a %bar?');
			expect(a).to.equal('foo is not a %bar?');
		});

		it('should interpolate parameter with escaped %% character', function()
		{
			var a = container.resolveParameters('The %foo% is not a %%bar but %foo%?');
			expect(a).to.equal('The foo is not a %bar but foo?');
		});

		it('should return cached interpolated parameter', function()
		{
			var a = container.resolveParameters('The %foo% is not a %%bar but %foo%?');
			expect(a).to.equal('The foo is not a %bar but foo?');
			a = container.resolveParameters('The %foo% is not a %%bar but %foo%?');
			expect(a).to.equal('The foo is not a %bar but foo?');
		});

		it('should interpolate single numeric parameter', function()
		{
			var a = container.resolveParameters('%numeric%');
			expect(a).to.equal(42.05);
		});

		it('should interpolate string to a service factory', function()
		{
			var a = container.resolveParameters('@@service1');
			expect(a() instanceof Service1).to.be.true;
		});

		it('should interpolate string to a service factory that returns separate instances of service', function()
		{
			var a = container.resolveParameters('@@service1');
			var instance1 = a();
			var instance2 = a();

			expect(instance1 instanceof Service1).to.be.true;
			expect(instance2 instanceof Service1).to.be.true;
			expect(instance1 === instance2).to.be.false;
		});

		it('should interpolate string to the same service factory everytime', function()
		{
			var a = container.resolveParameters('@@service1');
			var b = container.resolveParameters('@@service1');
			var instance1 = a();
			var instance2 = b();

			expect(instance1 instanceof Service1).to.be.true;
			expect(instance2 instanceof Service1).to.be.true;
			expect(instance1 === instance2).to.be.false;
		});

	});

	describe('#createService', function()
	{
		it('should create service of type Service1', function()
		{
			expect(container.createService('service1') instanceof Service1).to.be.true;
		});

		it('should create service of type Service1 that have property a === foo', function()
		{
			expect(container.createService('service1')).to.have.property('a', 'foo');
		});

		it('should create service with overloaded arguments', function()
		{
			var service3 = container.createService('service3', [undefined, { o2: 3 }]);
			expect(service3).to.have.property('a', 'foo');
			expect(service3).to.have.property('b');
			expect(service3.b).to.have.property('o1', 1);
			expect(service3.b).to.have.property('o2', 3);
		});

		it('should create function service of type Service4', function()
		{
			expect(container.createService('service4') === Service4).to.be.true;
		});

		it('should create factory service of type Service4', function()
		{
			expect(container.createService('service4b')).to.equal('s4');
		});

		it('should create object service Service6', function()
		{
			expect(container.createService('Service6')).to.equal(Service6);
		});

		it('should create object service Service7', function()
		{
			expect(container.createService('Service7')).to.equal(Service7);
		});

		it('should create object service with space', function()
		{
			expect(container.createService('Service7 #1')).to.equal(Service7);
		});

	});

	describe('#getService', function()
	{
		it('should return a service with another service as a constructor argument', function()
		{
			var a = container.getService('service2');
			expect(a instanceof Service2).to.be.true;
			expect(a).to.have.keys('a', 'b');
			expect(a.a instanceof Service1).to.be.true;
			expect(a).to.have.property('b', 'foo is not a bar');
		});

		it('should create two different instances of service', function()
		{
			var a = container.getService('service1');
			var b = container.getService('service1');
			expect(a).to.not.equal(b);
		});

		it('should return the same instances of shared service', function()
		{
			var a = container.getService('service2');
			var b = container.getService('service2');
			expect(a).to.equal(b);
		});
	});

	describe('#hasService', function()
	{
		it('should return false', function()
		{
			expect(container.hasService('undefinedService')).to.be.false;
		});

		it('should return true', function()
		{
			expect(container.hasService('service1')).to.be.true;
		});

	});

	describe('#registerService', function()
	{
		it('should properly register a new service', function()
		{
			container.registerServices({
				'service5': {
					'construct': function() {
						this.a = 'service 5';
					}
				}
			});

			expect(container.getService('service5')).to.have.property('a', 'service 5');
		});
	});

});
