var express = require('express');
var stylus = require('stylus');
var ejs = require('ejs');
var app = express();

if (process.env.REDISTOGO_URL) {
    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
    var redis = require("redis");
    var client = redis.createClient(rtg.port, rtg.hostname);
    client.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require('redis');
  var client = redis.createClient();
  }

client.on("error", function (err) {
        console.log("Error " + err);
    });

var server = app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

var io = require('socket.io').listen(server);
var clients = io.sockets.clients();

// "client" est utilisé pour redis, et "clients" pour socket.IO. 

// hack pour faire tourner socket.io sur Heroku (?)
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

app.use(stylus.middleware({
  src: __dirname + '/resources',
  dest: __dirname + '/public',
  debug: true,
  force: true
}));

app.use(function(req, res, next){
  var ua = req.headers['user-agent'];
  client.zadd('online', Date.now(), ua, next);
});

app.use(function(req, res, next){
  var min = 60 * 1000;
  var ago = Date.now() - min;
  client.zrevrangebyscore('online', '+inf', ago, function(err, users){
    if (err) return next(err);
    req.online = users;
    next();
  });
});

app.use('/static', express.static(__dirname + '/public/static'));

app.get('/', function(req, res) {
  res.setHeader('Content-Type', 'text/html');
  app.locals.=req.online.length;
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

function handler (request, response) {
  request.addListener('end', function () {
    fileServer.serve(request, response);
  });
};

// Commenter la ligne suivante pour obtenir des logs de debug
io.set('log level', 1);

app.locals.connectCounter = 0;

io.sockets.on('connection', function (socket) {

  app.locals.connectCounter += 1;
  socket.emit('compteurSocket', app.locals.connectCounter);

  var max_messages = 150
  var initial = client.get('compteur')

  for(i = initial; i < (max_messages + initial); i++) {
    var next_key = (i % max_messages)
    client.hgetall('message:' + next_key, function (err, message){
      if(message) {
        socket.emit('affiche_message', message)
      }
    })
  }
  
  socket.on('mousemove', function (data) {
      socket.broadcast.emit('moving', data);
  });

  // création et renvoi des messages
  var compteur = 0;

  socket.on('message', function (data) {
    
    compteur += 1;

    client.hset("message:"+compteur, "contenu", data.contenu);
    client.hset("message:"+compteur, "posX", data.posX);
    client.hset("message:"+compteur, "posY", data.posY);
     
    client.hget("message:"+compteur, "contenu", redis.print);
    client.set('compteur', compteur)

    if (compteur >= max_messages) {
      compteur = 0;
    };

    io.sockets.emit('affiche_message', data);
  
  });

  socket.on('disconnect', function (data) {
    app.locals.connectCounter -= 1;
    socket.emit('compteurSocket', app.locals.connectCounter);
  });

});