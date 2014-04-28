$(function(){

    if(!('getContext' in document.createElement('canvas'))){
        alert('Votre navigateur ne supporte pas la fonction canvas :( Pour résoudre le problème, vous pouvez le mettre à jour.');
        return false;
    };
    var url = 'http://localhost:3000'||'http://joueavecmoi.herokuapp.com/';

    var doc = $(document),
        win = $(window),
        canvas = $('#paper'),
        ctx = canvas[0].getContext('2d');
        
    // génère une id unique
    var id = Math.round($.now()*Math.random());
    var clients = {};
    var cursors = {};
    var socket = io.connect(url);
    var position_message = {};
    var messages = {};

    // gestion du compteur de clients connectés?

    // socket.on('compteur', function () {
    //     socket.emit(app.locals.connectCounter);
    // });

    // écriture sur le mur

    $("#zone_de_jeu").click(function(e){
            position_message = [e.pageX, e.pageY];
            $("#saisie_texte").css({
                'left' : position_message[0],
                'top' : position_message[1], 
                'display' : 'block',
            });
            $('#champ_saisie').focus();
           
        });

            $("#saisie_texte").submit(function(e){
                e.preventDefault()
                socket.emit('message', {
                    'contenu': $('#champ_saisie').val(),
                    'posX': position_message[0],
                    'posY': position_message[1], 
                    'id': id
                });
            });

    // affichage des messages
    socket.on('contenu_message', function (data) {
        messages[data.id] = $('<div class="message">'+ data.contenu +'</div>').appendTo('#messages');
        messages[data.id].css({
            'left' : data.posX,
            'top' : data.posY,
        });
    });

    // gestion du multi curseurs temps réel

    socket.on('moving', function (data) {

        if(! (data.id in clients)){
            // nouvel utilisateur => création d'un curseur
            cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
        }

        // déplacement du curseur
        cursors[data.id].css({
            'left' : data.x,
            'top' : data.y
        });

        // sauvegarde de l'état actuel du client
        clients[data.id] = data;
        clients[data.id].updated = $.now();
    });

    var lastEmit = $.now();

    doc.on('mousemove',function(e){
        if($.now() - lastEmit > 30){
            socket.emit('mousemove',{
                'x': e.pageX,
                'y': e.pageY,
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