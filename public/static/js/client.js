$(function(){

  var socket = io.connect();

  socket.emit('DOMLoaded')

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

  // ecran de chargement

  socket.on('messages_loading_start', function(){
    console.log('messages_loading_start')
    $('#loading_screen').fadeIn()
  }) 

  socket.on('messages_loaded', function(){
    console.log('messages_loaded')
    $('#loading_screen').fadeOut()
  })

  // modals 
  $('a.poplight').on('click', function() {
    var popID = $(this).data('rel');

    $('#' + popID).fadeIn().prepend('<a href="#" class="close"><img src="/static/images/close-icon.png" class="btn_close" title="Fermer la fenêtre" alt="Close" /></a>');
    
    var popMargTop = ($('#' + popID).height() + 80) / 2;
    var popMargLeft = ($('#' + popID).width() + 80) / 2;
    
    $('#' + popID).css({ 
      'margin-top' : -popMargTop,
      'margin-left' : -popMargLeft
    });
    
    //'alpha(opacity=80)' pour corriger les bugs de IE
    $('body').append('<div id="fade"></div>');
    $('#fade').css({'filter' : 'alpha(opacity=80)'}).fadeIn();
    
    return false;
  });
  
  $('body').on('click', 'a.close, #fade', function() {
    $('#fade , .popup_block').fadeOut(function() {
      $('#fade, a.close').remove();  
    });   
    return false;
  });

  $("#sidebar").click(function(e){

    $('#sidebar').animate({height:"270px"}, 400, function(){
      $('.texte_sidebar').show();
      $('#social').show();
      $('.lien_about').show();
    });

  })

  $("#warning").click(function(e){
    $('#mobileWarning').remove();
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
    if (parseInt(data) > 1) {
      $("#pluriel").show();
    } else {
      $("#pluriel").hide();
    }
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