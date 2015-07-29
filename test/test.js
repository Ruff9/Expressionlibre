process.env.NODE_ENV = 'test'
var should = require('should')

var io = require('socket.io-client')
var socketURL = 'http://localhost:3002'

var server = require('../server')

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
      client.emit('message', {'contenu': 'foo', 'posX':10, 'posY':10, 'id':2})
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
      client1.emit('message', {'contenu': 'foobar', 'posX':15, 'posY':15, 'id':3})
    })
    var client2 = io.connect(socketURL, options);
    client2.on('affiche_message', function(data) {
      client2.disconnect()    
      client1.disconnect()
      data.contenu.should.equal('foobar')
      done()
    })
  });

  it('should load previous messages at connection', function(done){

    var client1 = io.connect(socketURL, options);
    client1.on('connect', function(data){
      client1.emit('message', {'contenu': 'foobar', 'posX':15, 'posY':15, 'id':4})   
    })

    var client2 = io.connect(socketURL, options);
    client2.on('connect', function(data){
      client2.emit('message', {'contenu': 'foobar2', 'posX':25, 'posY':25, 'id':5})     
    })

    var client3 = io.connect(socketURL, options);
    console.log('client3 connecté');

    client3.on('affiche_base_message', function(data) {
        console.log('dans base message')
        client1.disconnect()
        client2.disconnect() 
        client3.disconnect()
        data.contenu.should.not.be.empty
        done()
 
    })
  })

})
