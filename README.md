### Install

```bash
npm install naivedb --save
```

[![NPM](https://nodei.co/npm/naivedb.png?downloads=true&stars=true)](https://nodei.co/npm/naivedb/)

---

## Minimum viable database

It would be hard to make something that did less.

## Create your database

Yep, those 2 squiggly brackets are your whole database, deal with it.

```bash
echo '{}' > /tmp/database.json
```

or you can do it with javascript..

```javascript
var fs = require('fs');
fs.writeFileSync( '/tmp/database.json', '{}' );
```

## Usage

```bash
$ node
> var naivedb = require('naivedb');
undefined
> var db = naivedb('/tmp/database.json');
undefined
> db.set( 'foo', 'bar' );
undefined
> db.get( 'foo' );
'bar'
> db.del( 'foo' );
undefined
> db.get( 'foo' );
undefined
```

... pretty mind-blowing stuff huh?

## Streaming writes

Streams are max radical to the power of sick, you probably still use callbacks, deal with it.

```javascript
var request = require('request'),
    naivedb = require('naivedb'),
    through = require('through2');

request
  .get( 'https://graph.facebook.com/yournamehere' )
  .pipe( through.obj( function( chunk, enc, next ){
    this.push( JSON.parse( chunk.toString('utf8') ) );
    next();
  }))
  .pipe( naivedb('/tmp/res.json').createWriteStream() )
```

## Options

```javascript
var naivedb = require('naivedb');
var db = naivedb('/tmp/database.json', { safeMode: true, pretty: true } );
```

Pass in the path to your db, if it doesnt exist you will get a fatal error, that's the computers way of telling you that you should have read the manual.

`safeMode` - this defaults to `true`, if you set it to `false` then the db will not write to disk when the process exits, i'm not sure why you would want this turned off.

`pretty` - again; this defaults to `true`, if you set it to `false` then the json is un-readable and you should probably be using a better database.

---

## License

```
This work ‘as-is’ we provide.
No warranty express or implied.
  We’ve done our best,
  to debug and test.
Liability for damages denied.

Permission is granted hereby,
to copy, share, and modify.
  Use as is fit,
  free or for profit.
These rights, on this notice, rely.
```