var chai = require('chai');
var expect = require('chai').expect,
    util = require('util');

var configLoader = require('../index.js');

describe("config", function() {
	beforeEach(function(done) {
		Object.keys(process.env).forEach(function(x) {
			delete process.env[x]
		});
		done()
	});

	it("Should load config.json from example 1", function(done) {
		configLoader.loadConfig({}, {
			configFolders: "test/testdata/1"
		}, function(err, config) {
			expect(err).to.not.be.ok;
			expect(config).to.eql({key: "value", key2: 2, key3: [1], key4: true, key5: {subkey: "subvalue"}});
			done();
		});
	});
	it("Should load other.json from example 1", function(done) {
		configLoader.loadConfig({}, {
			configFolders: "test/testdata/1",
			filePrefix: 'other',
		}, function(err, config) {
			expect(err).to.not.be.ok;
			expect(config).to.eql({key: "value2", key2: 4, key3: [2], key4: false, key5: {subkey: "subvalue2"}});
			done();
		});
	});
	it("Should load defaults", function(done) {
		configLoader.loadConfig({
			key: "value",
		}, {}, function(err, config) {
			expect(err).to.not.be.ok;
			expect(config).to.eql({key: "value"});
			done();
		});
	});
	it("should load standard form defaults", function(done) {
		configLoader.loadConfig({
			key: {default: "value"}
		}, {}, function(err, config) {
			expect(err).to.not.be.ok;
			expect(config).to.eql({key: "value"});
			done();
		});
	});
	it("should let you omit the extra options", function(done) {
		configLoader.loadConfig({
			key: "value",
		},function(err, config) {
			expect(err).to.not.be.ok;
			expect(config).to.eql({key: "value"});
			done();
		});
	});
	it("Should work with environment values", function(done) {
		process.env.key = "value";
		configLoader.loadConfig({key: {}},function(err, config) {
			expect(err).to.not.be.ok;
			expect(config).to.eql({key: "value"});
			done();
		});
	});
	it("Should work with snake-case environment variables", function(done) {
		process.env.ENV_KEY = "value";
		configLoader.loadConfig({envKey: {}},function(err, config) {
			expect(err).to.not.be.ok;
			expect(config).to.eql({envKey: "value"});
			done();
		});
	});
	it("Should work with promise-style calling", function(done) {
		configLoader.loadConfig({key: "value"}).then(function(config) {
			expect(config).to.eql({key: "value"});
			done();
		});
	});
	it("Should handle default values of null", function(done) {
		configLoader.loadConfig({key: null}).then(function(config) {
			expect(config).to.eql({key: null});
			done();
		});
	});
	it("should override defaults appropriately from json config, by default", function(done) {
		configLoader.loadConfig({
			key: "this value will be overridden",
			key2: {default: 10},
			key6: "default"
		}, {
			configFolders: "test/testdata/1"
		}, function(err, config) {
			expect(err).to.not.be.ok;
			expect(config).to.eql({key: "value", key2: 2, key3: [1], key4: true, key5: {subkey: "subvalue"}, key6: "default"});
			done();
		});
	});
})
