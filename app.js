var express = require('express');
var stylus = require('stylus');
var ejs = require('ejs');
var app = express();

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

app.get('/compter/:nombre', function(req, res) {
    res.render('page.ejs', {compteur: req.params.nombre});
});

app.use(function(req, res, next){
    res.setHeader('Content-Type', 'text/plain');
    res.send(404, 'Page introuvable !');
});

app.listen(8080);