var express = require('express');
var stylus = require('stylus');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var redis = require('redis');
var Poet = require('poet');
var nodemailer = require('nodemailer');

var app = express();

app.configure(function () {
  
  app.use(bodyParser());

  app.use(stylus.middleware({
    src: __dirname + '/resources',
    dest: __dirname + '/public',
    debug: true,
    force: true
  }));

  app.use('/static', express.static(__dirname + '/public/static'));

});

app.configure('test', function(){
  process.env.PORT = 3002;
});

app.set('view engine', 'ejs');

var server = app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

// Todo gestion metrics avec statsmix
// var statsmix = require('metrics-statsmix');
// var statsmixClient = new statsmix.Client();
// var MessageCounter = 0;
// statsmixClient.addMetric('Messages', MessageCounter, { track : true });

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

var poet = Poet(app, {
  posts: './_posts/',
  postsPerPage: 5,
  metaFormat: 'json',
  routes: {
    '/blog/:post': 'blog/post',
    '/blog/pagination/:page': 'blog/page'
  }
});

poet.watch().init();

// "client" est utilisé pour redis, et "clients" pour socket.IO. 

render_page = function(page, response) {
  response.setHeader('Content-Type', 'text/html')
  response.render(page)
}

function is_mobile(req) {
  var ua = req.header('user-agent');
  if (/mobile/i.test(ua)) return true;
  else return false;
};

// Pas la meilleure méthode, todo : faire la meme chose en css pur 

app.get('/', function(req, res) {
  if (is_mobile(req)) render_page ('mobile_warning', res);
  else render_page('home', res);
});

app.get('/home', function(req, res) {
  render_page('home', res);
});

app.get('/about', function(req, res) {
  render_page('about', res)
});

app.get('/blog', function(req, res) {
  render_page('blog/index', res)
});

app.get('/feedback', function(req, res) {
  render_page('feedback', res)
});

app.post('/feedback', function(req, res) {
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
        res.render('feedback', { msg: 'Erreur: message non envoyé', err: true, page: 'feedback' })
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
  // console.log("compteurinitial: " + compteur)

});

io.sockets.on('connection', function (socket) {

  connectCounter += 1
  io.sockets.emit('compteurSocket', connectCounter);

  setInterval(function() {
    io.sockets.emit('compteurSocket', connectCounter);
  }, 2000);

  var max_messages = 1000

  client.get('compteur', function(err, compteur){
         
    // console.log("compteurConnection: " + compteur)
    console.log("diffusion message initiaux");
      
    var initial = parseInt(compteur, 10) 

    for(i = initial; i < (max_messages + initial); i++) {
      var key = (i % max_messages) + 1;
      // console.log("i: " + i + '  // key: ' + key)      
      client.hgetall('message:' + key, function(error, message) {
        // console.log("message : " + message)
        if(message) {
          socket.emit('affiche_base_message', message)
        }
      });          
    }
  });
  
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
      // console.log("clé message" + compteur)

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