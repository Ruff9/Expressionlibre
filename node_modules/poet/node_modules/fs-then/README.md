fs Then
=======

[![Build Status](https://travis-ci.org/scothis/fs-then.png)](https://travis-ci.org/scothis/fs-then)

Thin wrapper arround Node's fs module that makes the async functions promise
aware. The wrapped methods return a promise the represents the value of the
async operation. Traditional callback still work, allowing for a transparent
drop-in for fs. Sync methods, classes and other helpers are not modified.


Example
-------

Traditional Async

```javascript
var fs = require('fs-then');
fs.readFile('path to file', funciton (err, buffer) {
   ...
});
```

With Promises

```javascript
var fs = require('fs-then');
fs.readFile('path to file').then(...);
```


Wrapped methods
---------------

- appendFile
- chmod
- chown
- close
- exists
- fchmod
- fchown
- fdatasync
- fstat
- fsync
- ftruncate
- futimes
- lchmod
- lchown
- link
- lstat
- mkdir
- open
- read
- readFile
- readdir
- readlink
- realpath
- rename
- rmdir
- stat
- symlink
- truncate
- unlink
- utimes
- write
- writeFile
