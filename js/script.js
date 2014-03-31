$(function(){

    if(!('getContext' in document.createElement('canvas'))){
        alert('Désolé, votre navigateur ne supporte pas la fonction canvas :( Pour résoudre le problème, vous pouvez mettre à jour.');
        return false;
    }

    cible = document.getElementsByTagName('body')[0];
    cible.addEventListener('mousemove', positionSouris, false);

    function positionSouris(event) {

        var posX;
        var posY;
        posX = event.clientX;
        posY = event.clientY;
        document.getElementById('divPosition').innerHTML =
        'Coordonnées de la souris :<br/>X = ' + posX + '<br />Y = ' + posY;
        return posX;
        return posY;

    };

    function creerDeuxiemeCurseur(event) {

        var img = document.createElement("img");
        img.src = "/static/images/curseur.png";
        var target = document.getElementById('cloneCurseur');
        target.appendChild(img);

    };



});