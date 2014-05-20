var should = require('should')
var redis = require ('redis')
var io = require('socket.io-client')
var socketURL = 'http://localhost:3000'
var options = {
  transports: ['websocket'],
  'force new connection': true
}

describe("Server",function(){

  it('Should count one user for one connection', function(done){
    var client = io.connect(socketURL, options);
    client.on('compteurSocket', function(data){
      client.disconnect()
      data.should.equal(1)
      done()
    });
  });

  it('Should count two users for two connections', function(done){
    var client1 = io.connect(socketURL, options);
    var client2 = io.connect(socketURL, options);
    client2.on('compteurSocket', function(data){
      client1.disconnect()
      client2.disconnect()
      data.should.equal(2)
      done()
    });
  });

  it('Should broadcast message after user type it', function(done){  
    var client = io.connect(socketURL, options);
    client.on('connect', function(data){
      client.emit('message', {'contenu': 'foo'})
    })     
    client.on('affiche_message', function(data) {
      client.disconnect()
      data.contenu.should.equal('foo')
      done()
    })
  })

  it('Should broadcast message after another user type it', function(done){
    var client1 = io.connect(socketURL, options);
    client1.on('connect', function(data){
      client1.emit('message', {'contenu': 'foo'})
    })
    var client2 = io.connect(socketURL, options);
    client2.on('affiche_message', function(data) {
      client2.disconnect()    
      client1.disconnect()
      data.contenu.should.equal('foo')
      done()
    })
  });

  it('Should save message after user type it', function(done){
    var client = io.connect(socketURL, options);
    var db = redis.createClient()

    client.on('connect', function(data){
      client.emit('message', {'contenu': 'foo'})
      //asynchrone est mon pb...
      var test = db.hget('message:1', 'contenu')
      console.log(test)
      test.should.equal("foo")
      client1.disconnect()
      done()
    })


  })

  // it('Should save messages in the right order', function(done){
  //   true.should.be.true
  // })

  // it('Should load messages in the right order at connection', function(done){
  //   true.should.be.true
  // })



});
