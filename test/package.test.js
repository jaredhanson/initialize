/* global describe, it, expect */

var bootable = require('..');

describe('bootable', function() {
    
  it('should export function', function() {
    expect(bootable).to.be.a('function');
  });
  
  it('should export Initializer constructor', function() {
    expect(bootable.Initializer).to.be.a('function');
  });
  
  it('should export phases', function() {
    expect(bootable.initializers).to.be.a('function');
    expect(bootable.routes).to.be.a('function');
  });
  
  it('should export DI phases', function() {
    expect(bootable.di.initializers).to.be.a('function');
    expect(bootable.di.routes).to.be.a('function');
  });
  
});
