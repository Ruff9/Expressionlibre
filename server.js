var express = require('express');
var ejs = require('ejs');
var path = require('path');
var bodyParser = require('body-parser');
var redis = require('redis');
var nodemailer = require('nodemailer');

var app = express();

app.configure(function () {
  
  app.use(bodyParser());

  app.use('/', express.static(path.join(__dirname, 'public')));

});

app.configure('test', function(){
  process.env.PORT = 3002;
});

app.set('view engine', 'ejs');

var server = app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var client = redis.createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
} else {
  var client = redis.createClient();
}

client.on("error", function (err) {
    console.log("Error " + err);
});

var io = require('socket.io').listen(server);

io.configure(function () { 
  io.set('close timeout', 10);
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10);
  // Commenter ligne suivante pour logs de debug
  io.set('log level', 1);
});

var clients = io.sockets.clients();

// "client" est utilisé pour redis, et "clients" pour socket.IO. 

render_page = function(page, response) {
  response.setHeader('Content-Type', 'text/html')
  response.render(page)
}

app.get('/', function(req, res) {
  render_page('home', res);
})

app.post('/', function(req, res) {
  var mailOpts, smtpTrans;

  smtpTrans = nodemailer.createTransport('SMTP', {
    service: 'Yahoo',
    auth: {
      user: "remy.maucourt@yahoo.fr",
      pass: process.env.MDP || require('./config.js').mdp
    }
  });

  mailOpts = {
    from: req.body.emailFeedback,
    to: 'remy.maucourt@yahoo.fr',
    subject: 'Feedback Expression libre',
    text: req.body.messageFeedback
  };

  smtpTrans.sendMail(mailOpts, function (error, response) {
      if (error) {
        console.log("erreur feedback")
        res.render('home', { msg: 'Erreur: message non envoyé', err: true, page: 'home' })
      }
      else { res.render('home'); };
    });  

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

var connectCounter = 0;

client.get('compteur', function(err, compteur) {   
  var compteur = parseInt(compteur, 10) || 0
  client.set('compteur', compteur);
});

io.sockets.on('connection', function (socket) {

  connectCounter += 1
  io.sockets.emit('compteurSocket', connectCounter);

  setInterval(function() {
    io.sockets.emit('compteurSocket', connectCounter);
  }, 2000);

  var max_messages = 400

  client.get('compteur', function(err, compteur){
    
    socket.on('DOMLoaded', function() {
        
      socket.emit('messages_loading_start')  
      var initial = parseInt(compteur, 10)
      
      for(i = initial; i < (max_messages + initial); i++) {
        var key = (i % max_messages) + 1;   
        client.hgetall('message:' + key, function(error, message) {
          if(message) {
            socket.emit('affiche_base_message', message)
          }
        });          
      }
      socket.emit('messages_loaded')
    });
  
  })

  socket.on('mousemove', function (data) {
    socket.broadcast.emit('moving', data)
  })
  
  socket.on('message', function (data) {
    
    client.get('compteur', function(err, compteur) {
     
      var compteur = parseInt(compteur, 10) || 0
      
      // MessageCounter +=1;
      
      if (compteur >= max_messages) {
        client.set('compteur', 0)
        compteur = 0
      };

      compteur += 1;
      client.set('compteur', compteur)

      client.hset("message:"+compteur, "contenu", data.contenu);
      client.hset("message:"+compteur, "posX", data.posX);
      client.hset("message:"+compteur, "posY", data.posY);
      client.hset("message:"+compteur, "id", compteur);     

      io.sockets.emit('affiche_message', data)
  
    })
  })

  socket.on('disconnect', function () {
    io.sockets.emit('compteurSocket', connectCounter--);
  })
})