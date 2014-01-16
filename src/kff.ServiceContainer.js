
kff.ServiceContainer = kff.createClass(
{
	statics:
	{
		CONFIG_CONSTRUCTOR: 'construct',
		singleParamRegex: /^%[^%]+%$/g,
		multipleParamsRegex: /%([^%]+)%/g,
		serviceNameRegex: /^[^\s#]*/
	}
},
/** @lends kff.ServiceContainer.prototype */
{
	/**
	 * Simple dependency injection (or service) container class.
	 * @constructs
	 * @param {Object} config Configuration object
	 */
	constructor: function(config, loader)
	{
		this.config = config || { parameters: {}, services: {} };
		this.services = {};
		this.cachedParams = {};
		if(loader) this.loadService = loader;
	},

	/**
	 * Returns instance of service class.
	 * @param {string} service Service name (service config to be found in config.services[service])
	 * @param {Array} argsExtend Array to overload default arguments array (optional)
	 * @returns {Object} Instance of service
	 */
	getService: function(serviceName, argsExtend, callback)
	{
		var serviceConfig;

		if(!callback)
		{
			callback = argsExtend;
			argsExtend = null;
		}
			// console.log('getService ' + serviceName);

		var processServiceConfig = this.f(function(serviceName)
		{
			// console.log('processServiceConfig ' + serviceName);
			if(this.config.services[serviceName].shared)
			{
				if(typeof this.services[serviceName] === 'undefined')
				{
					this.createService(serviceName, argsExtend, this.f(function(service){
						this.services[serviceName] = service;
						callback(service);
					}));
				}
				else callback(this.services[serviceName]);
			}
			else
			{
				this.createService(serviceName, argsExtend, callback);
			}
		});

		if(!this.config.services.hasOwnProperty(serviceName))
		{
			this.getServiceConfigAnnotation(serviceName, this.f(function(serviceConfig){
				if(serviceConfig)
				{
					this.config.services[serviceName] = serviceConfig;
					processServiceConfig(serviceName);
				}
				else throw new Error('Service ' + serviceName + ' not defined');
			}));
		}
		else processServiceConfig(serviceName);
	},

	/**
	 * Checks if given serviceName exists in container declaration
	 * @param {string} serviceName Service name
	 * @returns {boolean} True if service exists, false otherwise
	 */
	hasService: function(serviceName, callback)
	{
		if(this.config.services.hasOwnProperty(serviceName)) callback(true);
		else
		{
			this.getServiceConfigAnnotation(serviceName, this.f(function(serviceConfig)
			{
				var ret = false;
				if(serviceConfig)
				{
					this.config.services[serviceName] = serviceConfig;
					ret = true;
				}
				callback(ret);
			}));
		}
	},

	/**
	 * Creates instance of service.
	 *
	 * If second argument is passed, then it will be used to overload constructor arguments.
	 * If items at the same index are both objects, then the second one will bee deep-mixed into
	 * the first one resulting in a new object (i.e. the config args won't be overwritten).
	 *
	 * @param {string} serviceName Name of service to be instantiated
	 * @param {Array} argsExtend Array to overload default arguments array (optional)
	 * @returns {Object} Instance of service
	 */
	createService: function(serviceName, argsExtend, callback)
	{
		var serviceConfig, Ctor, Temp, service, ret, i, l, args, argsExtended, calls;

		if(!callback)
		{
			callback = argsExtend;
			argsExtend = null;
		}

		serviceConfig = this.config.services[serviceName];

		this.getServiceConstructor(serviceName, this.f(function(Ctor)
		{

			if(typeof Ctor !== 'function' || serviceConfig.type === 'function')
			{
				callback(Ctor);
				return;
			}

			if(serviceConfig.type !== 'factory')
			{
				Temp = function(){};
				Temp.prototype = Ctor.prototype;
				service = new Temp();
			}

			this.resolveParameters(serviceConfig.args || [], this.f(function(args)
			{

				if(argsExtend && argsExtend instanceof Array)
				{
					argsExtended = [];
					for(i = 0, l = argsExtend.length; i < l; i++)
					{
						if(argsExtend[i] !== undefined)
						{
							if(kff.isPlainObject(args[i]) && kff.isPlainObject(argsExtend[i])) argsExtended[i] = kff.mixins({}, args[i], argsExtend[i]);
							else argsExtended[i] = argsExtend[i];
						}
						else argsExtended[i] = args[i];
					}
					args = argsExtended;
				}

				if(serviceConfig.type === 'factory')
				{
					service = Ctor.apply(null, args);
				}
				else
				{
					ret = Ctor.apply(service, args);
					if(Object(ret) === ret) service = ret;
				}

				calls = serviceConfig.calls;
				if(calls instanceof Array)
				{
					var async = new kff.Async();
					for(i = 0, l = calls.length; i < l; i++)
					{
						this.resolveParameters(calls[i].args, async.add());

						service[calls[i].method].apply(service, this.resolveParameters(calls[i].args));
					}
					async.on('all', function(values)
					{
						service[calls[i].method].apply(service, values[i]);
						callback(service);
					});
				}
				else callback(service);

			}));

		}));

	},

	/**
	 * Returns constructor function for given service name.
	 * @param {string} serviceName Service name
	 * @returns {function} Constructor function for service
	 */
	getServiceConstructor: function(serviceName, callback)
	{
		var serviceConfig, ctor, construct = kff.ServiceContainer.CONFIG_CONSTRUCTOR, type, name, serviceObject, construct;

		var processServiceConfig = this.f(function(serviceConfig)
		{
			if(serviceConfig.construct) construct = serviceConfig.construct;
			else construct = serviceName;

			if(!serviceConfig.hasOwnProperty('serviceObject'))
			{
				if(typeof construct === 'string')
				{
					this.loadService(construct, function(serviceObject){
						serviceConfig['serviceObject'] = serviceObject;
						callback(serviceObject);
					});
					return;
				}
				else serviceConfig['serviceObject'] = construct;
				if(!serviceConfig['serviceObject'])
				{
					callback(null);
					return;
				}
			}

			callback(serviceConfig['serviceObject']);
		});

		serviceConfig = this.config.services[serviceName];

		if(!serviceConfig)
		{
			this.getServiceConfigAnnotation(serviceName, this.f(function(serviceConfig)
			{
				if(!serviceConfig) callback(null);
				else
				{
					this.config.services[serviceName] = serviceConfig;
					processServiceConfig(serviceConfig);
				}
			}));
		}
		else processServiceConfig(serviceConfig);

	},

	/**
	 * Returns configuration object of a service from its constructor (function).
	 * @param  {string} serviceName Name of service
	 * @return {object}             Service configuration object
	 */
	getServiceConfigAnnotation: function(serviceName, callback)
	{
		// console.log('getServiceConfigAnnotation ' + serviceName);
		this.loadService(serviceName, function(ctor)
		{
			var serviceConfig = {}, ret = null;
			if(typeof ctor === 'function')
			{
				if('service' in ctor && kff.isPlainObject(ctor.service)) serviceConfig = ctor.service;
				serviceConfig.serviceObject = ctor;
				ret = serviceConfig;
			}
			else if(ctor)
			{
				serviceConfig.serviceObject = ctor;
				ret = serviceConfig;
			}
			callback(ret);
		});
	},

	/**
	 * Evaluates parameter defined in container configuration.
	 *
	 * Parameter could be:
	 *
	 * - a string - see below
	 * - an Array or Object - iterates over properties and evaluates them recursively
	 *
	 * String parameters refers to parameters defined in config.parameters section
	 * If parameter is a string, it could have these special chars:
	 * '@serviceName' - resolves to instance of service
	 * '%parameterName%' - resolves to reference to parameter parameterName
	 * '%someParameter% some %otherParameter% some more string' - resolves to string with 'inner parameters' resolved to strings as well
	 *
	 * @param {string|Array|Object} params Parameters to be resolved
	 * @returns {mixed} Resolved parameter value
	 */
	resolveParameters: function(params, callback)
	{
		var ret, i, l, config;

		config = this.config;

		if(typeof params === 'string')
		{
			if(params.charAt(0) === '@')
			{
				params = params.slice(1);
				if(params.length === 0) callback(this);
				else this.getService(params, callback);
			}
			else if(this.cachedParams[params] !== undefined) callback(this.cachedParams[params]);
			else
			{
				if(params.search(kff.ServiceContainer.singleParamRegex) !== -1)
				{
					ret = config.parameters[params.slice(1, -1)];
				}
				else
				{
					ret = params.replace('%%', 'escpersign');
					ret = ret.replace(kff.ServiceContainer.multipleParamsRegex, function(match, p1)
					{
						if(config.parameters[p1]) return config.parameters[p1];
						else return '';
					});
					ret = ret.replace('escpersign', '%');
				}
				this.cachedParams[params] = ret;
				callback(ret);
			}
		}
		else if(params instanceof Array)
		{
			var async = new kff.Async();
			for(i = 0, l = params.length; i < l; i++)
			{
				this.resolveParameters(params[i], async.add());
			}
			async.on('all', callback);
		}
		else if(kff.isPlainObject(params))
		{
			var keys = [];
			var async = new kff.Async();
			ret = {};
			for(i in params)
			{
				if(params.hasOwnProperty(i))
				{
					keys.push(i);
					this.resolveParameters(params[i], async.add());
				}
			}
			async.on('all', function(values)
			{
				for(i = 0, l = keys.length; i < l; i++)
				{
					ret[keys[i]] = values[i];
				}
				callback(ret);
			});
		}
		else
		{
			callback(params);
		}
	},

	/**
	 * Registers a new service configuration
	 *
	 * @param  {Object} services Services configuration object
	 * @param  {Boolean} overwrite If service already exists, overwrite it with new config
	 */
	registerServices: function(services, overwrite)
	{
		var service;
		for(service in services)
		{
			if(!this.config.services.hasOwnProperty(service) || overwrite)
			{
				this.config.services[service] = services[service];
				this.services[service] = undefined;
			}
		}
	},

	/**
	 * Registers a new parameters configuration
	 *
	 * @param  {Object} parameters Parameters configuration object
	 * @param  {Boolean} overwrite If parameter already exists, overwrite it with new config
	 */
	registerParameters: function(parameters, overwrite)
	{
		var parameter;
		for(parameter in parameters)
		{
			if(!this.config.parameters.hasOwnProperty(parameter) || overwrite)
			{
				this.config.parameters[parameter] = parameters[parameter];
			}
		}
	},

	/**
	 * Returns a service (constructor, function or another type of service)
	 * @param  {string}   serviceName Name of service
	 * @return {mixed}                Service constructor or factory or any other type of service
	 */
	loadService: function(serviceName, callback)
	{
		if(typeof serviceName === 'string')
		{
			var match = serviceName.match(kff.ServiceContainer.serviceNameRegex);
			if(match)
			{
				serviceName = match[0];
			}
		}
		var service = kff.evalObjectPath(serviceName);
		setTimeout(function(){
			callback(service);
		}, 10);
	}
});

