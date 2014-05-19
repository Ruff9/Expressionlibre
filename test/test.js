var should = require('should')
var io = require('socket.io-client')

var socketURL = 'http://0.0.0.0:3000'

describe("Chat Server",function(){
  it('Should change number of user at each connection', function(done){
    var client = io.connect(socketURL);
    client.on('compteurSocket', function(data){
      client.disconnect()
      data.should.equal(1)
      done()
    });
  });


  // it('Should moving', function(done){
  //   var client = io.connect(socketURL);
  //   client.on('moving', function(data){
  //     client.disconnect()
  //     done()
  //   });
  // });


  // it('Should affiche_message', function(done){
  //   var client = io.connect(socketURL);
  //   client.on('affiche_message', function(data){
  //     client.disconnect()
  //     done()
  //   });
  // });  
});
