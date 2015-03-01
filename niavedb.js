
var fs = require('fs'),
    path = require('path');

module.exports = function( filename, options, errorback ){

  if( 'string' !== typeof filename ) throw new Error( 'invalid file name' );
  if( 'object' !== typeof options || !options ) options = {};
  if( 'function' !== typeof errorback ) errorback = console.error;

  var store = collection();

  var niavedb = {
    synced: false,
    interval: null,
    get: function( key ){
      return store.get( key );
    },
    set: function( key, value ){
      niavedb.synced = false;
      return store.set( key, value );
    },
    del: function( key ){
      niavedb.synced = false;
      return store.del( key );
    },
    read: function(){
      var path = null;
      try { path = path.resolve( filename ); }
      catch( e ){ return errorback( e ); }

      if( path )
      fs.stat( path, function( err, stats ){
        if( err ) return errorback( err );
        fs.readFile( path, function( err, data ){
          if( err ) return errorback( err );
          store = collection( JSON.parse( data ) );
          niavedb.synced = true;
        });
      });
    },
    write: function(){
      if( !niavedb.synced ){
        fs.writeFile( path.resolve( filename ), JSON.stringify( niavedb.data ), function( err ){
          if( err ) throw new Error( err );
          niavedb.synced = true;
        });
      }
    },
    close: function(){
      clearInterval( niavedb.interval );
      niavedb.write();
    }
  };

  if( options.writeInterval ){
    niavedb.interval = setInterval( niavedb.write, options.writeInterval );
  }

  niavedb.read();

  return niavedb;
};

function collection( init ){

  var cache = {
    store: ( 'object' === typeof init ) ? init : {},
    get: function( key ){
      return cache.store[ key ];
    },
    set: function( key, value ){
      cache.store[ key ] = value;
    },
    del: function( key ){
      delete cache.store[ key ];
    }
  };

  return cache;
};