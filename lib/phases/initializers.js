/**
 * Module dependencies.
 */
var path = require('path')
  , fs = require('fs')
  , existsSync = fs.existsSync || path.existsSync // node <=0.6
  , debug = require('debug')('bootable');


/**
 * Initializer execution phase.
 *
 * This phase will execute all initializer scripts in a directory, allowing the
 * application to initialize modules, including connecting to databases and
 * other network services.
 *
 * Examples:
 *
 *   app.phase(bootable.initializers());
 *
 *   app.phase(bootable.initializers('config/initializers'));
 *
 * @param {String|Object} options
 * @return {Function}
 * @api public
 */
module.exports = function(options) {
  if ('string' == typeof options) {
    options = { dirname: options };
  }

  if (Array.isArray(options)) {
    options = {dirname: options};
  }

  options = options || {};
  var dirnames = []
    , extensions = options.extensions || Object.keys(require.extensions).map(function(ext) { return ext; })
    , exts = extensions.map(function(ext) {
        if ('.' != ext[0]) { return ext; }
        return ext.slice(1);
      })
    , regex = new RegExp('\\.(' + exts.join('|') + ')$');

   if (Array.isArray(options.dirname)) {
     dirnames = options.dirname;
   }
   else{
     dirnames.push(options.dirname || '/etc/init/');
   }

  return function initializers(done) {

    var dirs = [],
        files = [],
        self = this,
        idx = 0;

    dirs = dirnames.filter(function(dirname){
      var folder = path.resolve(dirname);
      if (!existsSync(folder)) {
        return false;
      }
      return true;
    }).map(function(dirname){
      return path.resolve(dirname);;
    });

    //Sanity check
    if (dirs.length !== dirnames.length) {
      return done(new Error('One or more directory does not exist'));
    }

    files = dirs.map(function(dir){
      return fs.readdirSync(dir).map(function(file){
        return {filename:file, filePath:path.join(dir, file)}
      });
    });

    //Flatten and sort array of array to one level array.
    files = [].concat.apply([], files).sort(function(a, b){
      if (a.filename < b.filename) {
        return -1;
      }
      if (a.filename > b.filename) {
        return 1;
      }

      return 0;
    });

    function next(err) {
      if (err) { return done(err); }

      var file = files[idx++];
      // all done
      if (!file) { return done(); }

      if (regex.test(file.filename)) {
        try {

          var mod = require(file.filePath);

          if (typeof mod == 'function') {
            var arity = mod.length;
            if (arity == 1) {
              // Async initializer.  Exported function will be invoked, with next
              // being called when the initializer finishes.
              mod.call(self, next);
            } else {
              // Sync initializer.  Exported function will be invoked, with next
              // being called immediately.
              mod.call(self);
              next();
            }
          } else {
            // Initializer does not export a function.  Requiring the initializer
            // is sufficient to invoke it, next immediately.
            next();
          }
        } catch (ex) {
          next(ex);
        }
      } else {
        next();
      }
    }
    next();
  };
};
