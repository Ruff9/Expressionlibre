// code JS côté serveur

var express = require('express');
var stylus = require('stylus');
var ejs = require('ejs');
var app = express();

var server = app.listen(process.env.PORT || 3000, function(){
	console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

var io = require('socket.io').listen(server);

app.use(stylus.middleware({
  src: __dirname + '/resources',
  dest: __dirname + '/public',
  debug: true,
  force: true
}));

app.locals({
  connectCounter: 0
});

app.use('/static', express.static(__dirname + '/public/static'));

app.get('/', function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.render('home.ejs');
});

app.use(function(req, res, next){
    res.setHeader('Content-Type', 'text/plain');
    res.send(404, 'Page introuvable !');
});

// le code ci dessous provient de http://tutorialzine.com/2012/08/nodejs-drawing-game/

// If the URL of the socket server is opened in a browser
function handler (request, response) {

    request.addListener('end', function () {
        fileServer.serve(request, response); // this will return the correct file
    });
}

// Delete this row if you want to see debug messages
// io.set('log level', 1);

// Listen for incoming connections from clients
io.sockets.on('connection', function (socket) {

    app.locals.connectCounter++;
    io.socket.emit('compteur', app.locals.connectCounter);

    // Start listening for mouse move events
    socket.on('mousemove', function (data) {
        // This line sends the event (broadcasts it)
        // to everyone except the originating client.
        io.socket.emit('moving', data);
    });
});

io.sockets.on('disconnect', function (socket) {
  app.locals.connectCounter--;
  io.socket.emit('compteur', app.locals.connectCounter);
});