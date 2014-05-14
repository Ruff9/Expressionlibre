$(function(){

    if(!('getContext' in document.createElement('canvas'))){
        alert('Votre navigateur ne supporte pas la fonction canvas :( Pour résoudre le problème, vous pouvez le mettre à jour.');
        return false;
    };

    // var url = app.locals.url;
    var url = 'http://localhost:3000';
    // var url = 'http://joueavecmoi.herokuapp.com/';

    var doc = $(document),
        win = $(window),
        sidebar_width = win.width()/4,
        canvas = $('#paper'),
        ctx = canvas[0].getContext('2d');
        
    var id = Math.round($.now()*Math.random());

    var clients = {};
    var cursors = {};
    var socket = io.connect(url);
    var position_message = {};
    var messages = {};

    var nb_messages_max = 150;
    var pas_opacite = 1/nb_messages_max;

    function encodeHTML(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }

    $("#zone_de_jeu").click(function(e){

        if ($('#champ_saisie').val() == ''){
            position_message = [e.pageX, e.pageY];
        };

        $("#saisie_texte").css({
            'left' : position_message[0],
            'top' : position_message[1] - 15, 
            'display' : 'block'
        });

        $('#champ_saisie').focus();
    });

    $("#saisie_texte").submit(function(e){
        e.preventDefault();
        socket.emit('message', {
            'contenu': encodeHTML($('#champ_saisie').val()),
            'posX': position_message[0],
            'posY': position_message[1] - 10
        });

        $(this).find('#champ_saisie').val('');

        $("#saisie_texte").css({
            'display' : 'none'
        });
    });

    socket.on('compteurSocket', function (data) {
        $("#compteurVal").text(data);
    });

    socket.on('affiche_message', function (data) {
        messages[data.id] = $('<div class="message">'+ data.contenu +'</div>').appendTo('#messages');
        messages[data.id].css({
            'left': function() {
                if (data.posX > sidebar_width){
                    return data.posX;
                } else {
                    return data.posX + sidebar_width;
                };
            },
            'top': data.posY 
        });
        
        $(".message").each(function () {
            op = $(this).css("opacity");
            newop = op - pas_opacite;
            if (newop == 0){
                $(this).remove();
            };
            $(this).css("opacity", newop);
        });
    });

    socket.on('moving', function (data) {

        if(! (data.id in clients)){
    
            cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
        }

        cursors[data.id].css({
            'left' : data.x,
            'top' : data.y
        });

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

    // supprime le client après 10secondes d'inactivité

    setInterval(function(){

        for(ident in clients){
            if($.now() - clients[ident].updated > 10000){

                cursors[ident].remove();
                delete clients[ident];
                delete cursors[ident];
            }
        }

    },10000);

});