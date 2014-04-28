var express = require('express');
var stylus = require('stylus');
var ejs = require('ejs');
var app = express();

var server = app.listen(process.env.PORT || 3000, function(){
	console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

var io = require('socket.io').listen(server);
var clients = io.sockets.clients;

app.use(stylus.middleware({
  src: __dirname + '/resources',
  dest: __dirname + '/public',
  debug: true,
  force: true
}));

app.use('/static', express.static(__dirname + '/public/static'));

app.get('/', function(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.render('home.ejs');
});

app.get('/about', function(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.render('about.ejs');
});

app.use(function(req, res, next){
  res.setHeader('Content-Type', 'text/plain');
  res.send(404, 'Page introuvable !');
});

// If the URL of the socket server is opened in a browser
function handler (request, response) {
  request.addListener('end', function () {
    fileServer.serve(request, response); // this will return the correct file
  });
};

// Delete this row if you want to see debug messages
io.set('log level', 1);

app.locals.connectCounter = clients.length;
app.locals.foo = "foobar";

console.log(app.locals.foo);


// Listen for incoming connections from clients
io.sockets.on('connection', function (socket) {

  console.log(app.locals.connectCounter);
  io.sockets.emit('compteur', app.locals.connectCounter);
  
  // Start listening for mouse move events
  socket.on('mousemove', function (data) {
      // This line sends the event (broadcasts it)
      // to everyone except the originating client.
      socket.broadcast.emit('moving', data);
  });

  // diffusion des messages
  socket.on('message', function (data) {
    console.log('dans le serveur dans');
    io.sockets.emit('contenu_message', data);
  });

});

// saisie de texte
