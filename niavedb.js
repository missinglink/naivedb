
var fs = require('fs'),
    path = require('path'),
    through = require('through2'),
    databases = {};

module.exports = function( filename, options ){

  if( 'string' !== typeof filename ) throw new Error( 'invalid file name' );
  if( 'object' !== typeof options || !options ) options = {};
  if( !options.hasOwnProperty('safeMode') ) options.safeMode = true;
  if( !options.hasOwnProperty('pretty') ) options.pretty = true;

  // validate filepath
  var filepath = path.resolve( filename );
  var stat = fs.statSync( filepath );

  // allow databases to reused across modules
  if( !databases.hasOwnProperty(filepath) ){

    // create collection
    var col = collection();

    var niavedb = {
      synced: false,
      interval: null,
      get: function( key ){
        return col.get( key );
      },
      set: function( key, value ){
        niavedb.synced = false;
        return col.set( key, value );
      },
      del: function( key ){
        niavedb.synced = false;
        return col.del( key );
      },
      read: function( done ){
        fs.readFile( filepath, { encoding: 'utf8' }, function( err, data ){
          if( err ) return done( e );
          col = collection( JSON.parse( data ) );
          niavedb.synced = true;
          done( null, col );
        });
      },
      readSync: function(){
        var data = fs.readFileSync( filepath, { encoding: 'utf8' } );
        col = collection( JSON.parse( data ) );
        niavedb.synced = true;
      },
      write: function( done ){
        if( !niavedb.synced ){
          var str = options.pretty
            ? JSON.stringify( col.store, null, 2 )
            : JSON.stringify( col.store );
          fs.writeFile( path.resolve( filename ), str, function( err ){
            if( err ) return done( e );
            niavedb.synced = true;
            done();
          });
        }
        else return done();
      },
      writeSync: function(){
        if( !niavedb.synced ){
          var str = options.pretty
            ? JSON.stringify( col.store, null, 2 )
            : JSON.stringify( col.store );
          fs.writeFileSync( path.resolve( filename ), str );
          niavedb.synced = true;
        }
      },
      createWriteStream: function( idprop ){
        if( 'string' !== typeof idprop ) idprop = 'id';
        return through.obj( function( chunk, enc, next ){
          niavedb.set( chunk[idprop], chunk );
          next();
        });
      },
      close: function(){
        clearInterval( niavedb.interval );
        niavedb.writeSync();
      }
    };

    // save database
    databases[filepath] = niavedb;

    // write to disk regularly on interval
    if( options.writeInterval ){
      niavedb.interval = setInterval( niavedb.write.bind( null, genericErrorHandler ), options.writeInterval );
    }

    // ensure data is written to disk on process termination
    if( options.safeMode ){
      process.on( 'exit', niavedb.close );
    }

    niavedb.readSync();
  }

  return databases[filepath];
};

function collection( init ){

  var cache = {
    store: ( 'object' === typeof init ) ? init : {},
    get: function( key ){
      return cache.store[key];
    },
    set: function( key, value ){
      cache.store[key] = value;
    },
    del: function( key ){
      delete cache.store[key];
    }
  };

  return cache;
};

function genericErrorHandler( err ){
  if( err ) console.error( err );
};