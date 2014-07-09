$(function(){

  var socket = io.connect();

  var doc = $(document),
  win = $(window);

  var id = Math.round($.now()*Math.random());

  var clients = {};
  var cursors = {};
  var messages = {};
  var position_message = {};
  var nb_messages_max = 400;
  var pas_opacite = 1/nb_messages_max;

  // empeche l'injection de JS
  function encodeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  // positionnement initial 
  win.scrollTop($('#windowSetter').offset().top)
  win.scrollLeft($('#windowSetter').offset().left)

  $(window).keydown(function(event) {
    if((event.keyCode == 107 && event.ctrlKey == true) || (event.keyCode == 109 && event.ctrlKey == true))
    { event.preventDefault(); }

    $(window).bind('mousewheel DOMMouseScroll', function(event){ 
      if(event.ctrlKey == true){ event.preventDefault(); }
    });
  });

  $("#sidebar").click(function(e){

    $('#sidebar').animate({height:"270px"}, 400, function(){
      $('.texte_sidebar').show();
      $('#social').show();
      $('.lien_about').show();
    });

  })

  $("#zone_de_jeu").click(function(e){

    var sidebar = $('#sidebar');

    if (!sidebar.is(e.target) && sidebar.has(e.target).length === 0){

      $('#sidebar').animate({height:"75px"}, 400, function(){
        $('.texte_sidebar').hide();
        $('#social').hide();
        $('.lien_about').hide();
      });

      if ($('#champ_saisie').val() == ''){
        position_message = [e.pageX, e.pageY];
      };

      $("#saisie_texte").css({
        'left' : position_message[0],
        'top' : position_message[1] - 15, 
        'display' : 'block'
      });

      $('#champ_saisie').focus();
    }

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

  var AfficheMessage = function (data) {

    $(".message").each(function () {
      op = $(this).css("opacity");
      newop = op - pas_opacite;
      if (newop == 0){
        $(this).remove();
      };
      $(this).css("opacity", newop);
    });

    messages[data.id] = $('<div class="message">'+ data.contenu +'</div>').appendTo('#messages');

    messages[data.id].css({
      'left': data.posX + "px",
      'top': data.posY + "px"
    });

  };

  socket.on('affiche_base_message', function (data) {
    console.log("affiche_base_message")
    AfficheMessage(data);
  });

  socket.on('affiche_message', function (data) {
    AfficheMessage(data);
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

  // supprime le client après 10 secondes d'inactivité

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