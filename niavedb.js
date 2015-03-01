
var fs = require('fs'),
    path = require('path'),
    through = require('through2');

module.exports = function( filename, options ){

  if( 'string' !== typeof filename ) throw new Error( 'invalid file name' );
  if( 'object' !== typeof options || !options ) options = {};

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
    _validatePath: function( done ){
      var filepath = null;
      filepath = path.resolve( filename );
      return filepath;
    },
    read: function( done ){
      try { var filepath = niavedb._validatePath(); }
      catch ( e ){ return done( e ); }
      fs.stat( filepath, function( err, stats ){
        if( err ) return done( e );
        fs.readFile( filepath, { encoding: 'utf8' }, function( err, data ){
          if( err ) return done( e );
          col = collection( JSON.parse( data ) );
          niavedb.synced = true;
          done( null, col );
        });
      });
    },
    readSync: function(){
      var filepath = niavedb._validatePath();
      var stats = fs.statSync( filepath );
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
    createWriteStream: function( idprop ){
      if( 'string' !== typeof idprop ) idprop = 'id';
      return through.obj( function( chunk, enc, next ){
        niavedb.set( chunk[idprop], chunk );
        next();
      }, function(){
        niavedb.close();
      });
    },
    close: function(){
      clearInterval( niavedb.interval );
      niavedb.write( genericErrorHandler );
    }
  };

  if( options.writeInterval ){
    niavedb.interval = setInterval( niavedb.write.bind( null, genericErrorHandler ), options.writeInterval );
  }

  niavedb.readSync();

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

function genericErrorHandler( err ){
  if( err ) console.error( err );
};