// var should = require('should');

if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.Collection', function()
{
	var cls = new kff.Collection();
	var obj1 = new kff.Model();

	it('should append two values to the collection', function()
	{
		var collection = new kff.Collection();
		collection.append('A');
		collection.append('B');
		expect(collection.count()).to.equal(2);
	});

	it('should append two values then remove last one from the collection', function()
	{
		var collection = new kff.Collection();
		collection.append('A');
		collection.append('B');
		collection.remove('B');
		expect(collection.count()).to.equal(1);
	});

	it('should append two values then remove first one from the collection', function()
	{
		var collection = new kff.Collection();
		collection.append('A');
		collection.append('B');
		collection.remove('A');
		expect(collection.count()).to.equal(1);
		expect(collection.indexOf('B')).to.equal(0);
	});

	it('should append two values to the collection then remove both', function()
	{
		var collection = new kff.Collection();
		collection.append('A');
		collection.append('B');
		collection.remove('A');
		collection.remove('B');
		expect(collection.count()).to.equal(0);
	});

	it('should insert one value to the collection', function()
	{
		var collection = new kff.Collection();
		collection.append('A');
		collection.append('C');
		collection.insert('B', 1);

		expect(collection.count()).to.equal(3);
		expect(collection.get(1)).to.equal('B');
	});

	it('should get value from the collection', function()
	{
		var collection = new kff.Collection();
		collection.append('A');
		expect(collection.get(0)).to.equal('A');
	});

	it('should set value in the collection', function()
	{
		var collection = new kff.Collection();
		collection.append('A');
		collection.set(0, 'B');
		expect(collection.get(0)).to.equal('B');
		expect(collection.count()).to.equal(1);
	});

	it('should not set value on nonexistent index in the collection', function(done)
	{
		var collection = new kff.Collection();
		try
		{
			collection.set(42, 'B');
		}
		catch (error)
		{
			expect(collection.count()).to.equal(0);
			done();
		}
	});

	it('should empty the collection', function()
	{
		var collection = new kff.Collection();
		collection.append('A');
		collection.empty();
		expect(collection.count()).to.equal(0);
	});

	it('should iterate for each item in the collection', function()
	{
		var collection = new kff.Collection();
		var count = 0;
		collection.append('A');
		collection.append('B');
		collection.each(function(item, i){
			count++;
			if(i === 0) expect(item).to.equal('A');
			if(i === 1) expect(item).to.equal('B');
		});
		expect(count).to.equal(2);
	});

	it('should remove one item from the collection using callback', function()
	{
		var collection = new kff.Collection();
		collection.append('A');
		collection.append('B');
		collection.append('C');
		collection.remove(function(item){
			return item === 'A';
		});
		expect(collection.count()).to.equal(2);
		expect(collection.indexOf('B')).to.equal(0);
		expect(collection.indexOf('C')).to.equal(1);
	});


	it('should contain one item', function()
	{
		cls.append(obj1);
		expect(cls.count()).to.equal(1);
	});

	it('should create a new filtered collection', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1.append(m1);
		c1.append(m2);
		c1.append(m3);

		var c2 = c1.filter(function(item){
			return item.get('a') === 2;
		});

		expect(c2.count()).to.equal(1);
		expect(c2.get(0)).to.equal(m2);
	});

	it('should concat two collections', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1.append(m1);
		c1.append(m2);

		var c2 = new kff.Collection();
		c2.append(m3);

		var c3 = c1.concat(c2);

		expect(c3.count()).to.equal(3);
		expect(c3.get(2)).to.equal(m3);
	});

	it('should concat collection and two models', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1.append(m1);

		var c3 = c1.concat(m2, m3);

		expect(c3.count()).to.equal(3);
		expect(c3.get(2)).to.equal(m3);
	});

	it('should join collection', function()
	{
		var m1 = new kff.Model({ a: '1' });
		var m2 = new kff.Model({ a: '2' });

		m1.toString = m2.toString = function(){
			return this.get('a');
		};

		var out = new kff.Collection().concat(m1, m2).join(' ');

		expect(out).to.equal('1 2');
	});

	it('should map collection to another collection', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1 = c1.concat(m1, m2, m3);

		var thisObj = {
			increment: 2
		};

		var i = 0;

		var c2 = c1.map(function(item, index, collection)
		{
			expect(this).to.equal(thisObj);
			expect(collection).to.equal(c1);
			expect(index).to.equal(i);

			i++;
			return new kff.Model({ a: item.get('a') + this.increment });

		}, thisObj);

		expect(c2.count()).to.equal(3);
		expect(c2.get(1).get('a')).to.equal(4);
	});

	it('should reduce collection', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1 = c1.concat(m1, m2, m3);

		var sum = c1.reduce(function(prev, current)
		{
			return new kff.Model({ a: prev.get('a') +  current.get('a') });
		});

		expect(sum.get('a')).to.equal(6);
	});

	it('should reduce collection with initial value', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1 = c1.concat(m1, m2, m3);

		var sum = c1.reduce(function(prev, current)
		{
			if(prev instanceof kff.Model) return prev.get('a') + current.get('a');
			else return prev + current.get('a');
		}, 10);

		expect(sum).to.equal(16);
	});

	it('should reduceRight collection with initial value', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1 = c1.concat(m1, m2, m3);

		var sum = c1.reduceRight(function(prev, current)
		{
			if(prev instanceof kff.Model) return prev.get('a') - current.get('a');
			else return prev - current.get('a');
		}, 10);

		expect(sum).to.equal(4);
	});

	it('should slice collection', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1 = c1.concat(m1, m2, m3);

		var c2 = c1.slice(1, 3);

		expect(c2.count()).to.equal(2);
		expect(c2.get(0).get('a')).to.equal(2);
		expect(c2.get(1).get('a')).to.equal(3);
	});

	it('should push two items into a collection', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1.append(m1);

		c1.on('change', function(event){
			expect(event.type).to.equal('push');
			expect(event.items.length).to.equal(2);
			expect(event.items[0]).to.equal(m2);
			expect(event.items[1]).to.equal(m3);
		});

		var l = c1.push(m2, m3);

		expect(l).to.equal(3);
		expect(c1.get(0)).to.equal(m1);
		expect(c1.get(1)).to.equal(m2);
		expect(c1.get(2)).to.equal(m3);
	});

	it('should pop an item from a collection', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1.push(m1, m2, m3);

		c1.on('change', function(event){
			expect(event.type).to.equal('pop');
			expect(event.item).to.equal(m3);
		});

		var item = c1.pop();

		expect(item).to.equal(m3);
		expect(c1.count()).to.equal(2);
	});

	it('should shift an item from a collection', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1.push(m1, m2, m3);

		c1.on('change', function(event){
			expect(event.type).to.equal('shift');
			expect(event.item).to.equal(m1);
		});

		var item = c1.shift();

		expect(item).to.equal(m1);
		expect(c1.count()).to.equal(2);
	});

	it('should unshift two items into a collection', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1.append(m3);

		c1.on('change', function(event){
			expect(event.type).to.equal('unshift');
			expect(event.items.length).to.equal(2);
			expect(event.items[0]).to.equal(m1);
			expect(event.items[1]).to.equal(m2);
		});

		var l = c1.unshift(m1, m2);

		expect(l).to.equal(3);
		expect(c1.get(0)).to.equal(m1);
		expect(c1.get(1)).to.equal(m2);
		expect(c1.get(2)).to.equal(m3);
	});

});
