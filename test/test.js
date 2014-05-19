var should = require('should')
var io = require('socket.io-client')

var socketURL = 'http://localhost:3000'

var options = {
  transports: ['websocket'],
  'force new connection': true
}

describe("Server",function(){

  it('Should change number of user at each connection', function(done){
    var client = io.connect(socketURL, options);
    client.on('compteurSocket', function(data){
      client.disconnect()
      data.should.equal(1)
      done()
    });
  });

  it('Should emit message after user type it', function(done){  
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

  it('Should emit message when page loads', function(done){
    var client1 = io.connect(socketURL, options);
    client1.emit('message', {'contenu': 'foo'})

    var client2 = io.connect(socketURL, options);
    client2.on('affiche_message', function(data) {
      client2.disconnect()    
      client1.disconnect()
      data.contenu.should.equal('foo')
      done()
    })
  });  

});
