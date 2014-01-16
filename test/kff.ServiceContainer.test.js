if(typeof require === 'function') var kff = require('../build/kff-all.js');

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
			kocka: 'kočka',
			pes: 'pes',
			numeric: 42.05,
			obj: { o1: 1, o2: 2 }
		},
		services:
		{
			'service1':
			{
				'construct': Service1,
			    'args': ['%kocka%', 'haf']
			},
			'Service7 #1':
			{
			},
			'service2':
			{
				'construct': Service2,
			    'args': ['@service1', 'Proč %kocka% není %pes%?'],
			    'shared': true
			},
			'service3':
			{
				'construct': Service1,
			    'args': ['%kocka%', '%obj%']
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
			}
		}
	};

	//console.log(kff.evalObjectPath('this'));

	var container = new kff.ServiceContainer(config);

	describe('#resolveParameters', function()
	{
		it('should interpolate plain string as the string itself', function(done)
		{
			container.resolveParameters('This is a plain string', function(ret)
			{
				ret.should.equal('This is a plain string');
				done();
			});
		});

		it('should interpolate string with two parameters', function(done)
		{
			container.resolveParameters('Proč %kocka% není %pes%?', function(ret)
			{
				ret.should.equal('Proč kočka není pes?');
				done();
			});
		});

		it('should interpolate string with referece to a service', function(done)
		{
			container.resolveParameters('@service1', function(ret)
			{
				ret.should.be.an.instanceof(Service1);
				done();
			});
		});

		it('should interpolate object with refereces to parameters and services', function(done)
		{
			container.resolveParameters({ x: '@service1', y: { z: 'Proč %kocka% není %pes%?' }}, function(a)
			{
				a.should.have.keys('x', 'y');
				a.x.should.be.an.instanceof(Service1);
				a.y.should.have.property('z', 'Proč kočka není pes?');
				done();
			});
		});

		it('should interpolate array with refereces to parameters and services', function(done)
		{
			container.resolveParameters([ '@service1', { z: 'Proč %kocka% není %pes%?' }], function(a)
			{
				a[0].should.be.an.instanceof(Service1);
				a[1].should.have.property('z', 'Proč kočka není pes?');
				done();
			});
		});

		it('should interpolate referece to container itself', function(done)
		{
			container.resolveParameters({ x: '@' }, function(a)
			{
				a.should.have.property('x');
				a.x.should.equal(container);
				done();
			});
		});

		it('should interpolate parameter with single % character', function(done)
		{
			container.resolveParameters('Proč %kocka% není %pes?', function(a)
			{
				a.should.equal('Proč kočka není %pes?');
				done();
			});
		});

		it('should interpolate parameter with escaped %% character', function(done)
		{
			container.resolveParameters('Proč %kocka% není %%pes, ale %kocka%?', function(a)
			{
				a.should.equal('Proč kočka není %pes, ale kočka?');
				done();
			});
		});

		it('should return cached interpolated parameter', function(done)
		{
			container.resolveParameters('Proč %kocka% není %%pes, ale %kocka%?', function(a)
			{
				a.should.equal('Proč kočka není %pes, ale kočka?');

				container.resolveParameters('Proč %kocka% není %%pes, ale %kocka%?', function(b)
				{
					b.should.equal('Proč kočka není %pes, ale kočka?');
					done();
				});
			});
		});

		it('should interpolate single numeric parameter', function(done)
		{
			container.resolveParameters('%numeric%', function(a)
			{
				a.should.equal(42.05);
				done();
			});
		});

	});

	describe('#createService', function()
	{
		it('should create service of type Service1', function(done)
		{
			container.createService('service1', function(a)
			{
				a.should.be.an.instanceof(Service1);
				done();
			});
		});

		it('should create service of type Service1 that have property a === kočka', function(done)
		{
			container.createService('service1', function(a)
			{
				a.should.have.property('a', 'kočka');
				done();
			});
		});

		it('should create service with overloaded arguments', function(done)
		{
			container.createService('service3', [undefined, { o2: 3 }], function(service3)
			{
				service3.should.have.property('a', 'kočka');
				service3.should.have.property('b');
				service3.b.should.have.property('o1', 1);
				service3.b.should.have.property('o2', 3);
				done();
			});
		});

		it('should create function service of type Service4', function(done)
		{
			container.createService('service4', function(a)
			{
				a.should.equal(Service4);
				done();
			});
		});

		it('should create factory service of type Service4', function(done)
		{
			container.createService('service4b', function(a)
			{
				a.should.equal('s4');
				done();
			});
		});

		it('should create object service Service6', function(done)
		{
			container.createService('Service6', function(a)
			{
				a.should.equal(Service6);
				done();
			});
		});

		it('should create object service Service7', function(done)
		{
			container.createService('Service7', function(a)
			{
				a.should.equal(Service7);
				done();
			});
		});

		it('should create object service with space', function(done)
		{
			container.createService('Service7 #1', function(a)
			{
				a.should.equal(Service7);
				done();
			});
		});

	});

	describe('#getService', function()
	{
		it('should return a service with another service as a constructor argument', function(done)
		{
			container.getService('service2', function(a)
			{
				a.should.be.an.instanceof(Service2);
				a.should.have.keys('a', 'b');
				a.a.should.be.an.instanceof(Service1);
				a.should.have.property('b', 'Proč kočka není pes?');
				done();
			});
		});

		it('should create two different instances of service', function(done)
		{
			container.getService('service1', function(a)
			{
				container.getService('service1', function(b)
				{
					a.should.not.equal(b);
					done();
				});
			});
		});

		it('should return the same instances of shared service', function(done)
		{
			container.getService('service2', function(a)
			{
				container.getService('service2', function(b)
				{
					a.should.equal(b);
					done();
				});
			});
		});
	});

	describe('#hasService', function()
	{
		it('should return false', function(done)
		{
			container.hasService('undefinedService', function(a)
			{
				a.should.be.false;
				done();
			})
		});

		it('should return true', function(done)
		{
			container.hasService('service1', function(a)
			{
				a.should.be.true;
				done();
			})
		});

	});

	describe('#registerService', function()
	{
		it('should properly register a new service', function(done)
		{
			container.registerServices({
				'service5': {
					'construct': function() {
						this.a = 'service 5';
					}
				}
			});

			container.getService('service5', function(a)
			{
				a.should.have.property('a', 'service 5');
				done();
			});
		});
	});

});
