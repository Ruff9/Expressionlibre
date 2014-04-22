// code JS côté client

$(function(){

    if(!('getContext' in document.createElement('canvas'))){
        alert('Désolé, votre navigateur ne supporte pas la fonction canvas :( Pour résoudre le problème, vous pouvez le mettre à jour.');
        return false;
    }

    // The URL of your web server (the port is set in app.js)
    var url = 'http://localhost:3000'||'http://joueavecmoi.herokuapp.com/';

    var doc = $(document),
        win = $(window),
        canvas = $('#paper'),
        ctx = canvas[0].getContext('2d'),
        
    // Generate an unique ID
    var id = Math.round($.now()*Math.random());
    var clients = {};
    var cursors = {};
    var socket = io.connect(url);

    // gestion du compteur de clients connectés 
    socket.on ('compteur', function()) {
        socket.emit('compteur');
    };

    gestion

    socket.on('moving', function (data) {

        if(! (data.id in clients)){
            // a new user has come online. create a cursor for them
            cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
        }

        // Move the mouse pointer
        cursors[data.id].css({
            'left' : data.x,
            'top' : data.y
        });

        // Saving the current client state
        clients[data.id] = data;
        clients[data.id].updated = $.now();
    });

    var lastEmit = $.now();

    doc.on('mousemove',function(e){
        if($.now() - lastEmit > 30){
            socket.emit('mousemove',{
                'x': e.pageX,
                'y': e.pageY,
                'drawing': drawing,
                'id': id
            });
            lastEmit = $.now();
        }
    });

    // Remove inactive clients after 10 seconds of inactivity
    setInterval(function(){

        for(ident in clients){
            if($.now() - clients[ident].updated > 10000){

                // Last update was more than 10 seconds ago.
                // This user has probably closed the page

                cursors[ident].remove();
                delete clients[ident];
                delete cursors[ident];
            }
        }

    },10000);

});