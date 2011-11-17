
incluir imagenes 

function cargaContextoCanvas(idCanvas){
   var elemento = document.getElementById(idCanvas);
   if(elemento && elemento.getContext){
      var contexto = elemento.getContext('2d');
      if(contexto){
         return contexto;
      }
   }
   return FALSE;
}


window.onload = function(){
   //Recibimos el elemento canvas
   var ctx = cargaContextoCanvas('micanvas');
   if(ctx){
      //Creo una imagen conun objeto Image de Javascript
      var img = new Image();
      //indico la URL de la imagen
      img.src = 'pikachu.jpg';
      //defino el evento onload del objeto imagen
      img.onload = function(){
         //incluyo la imagen en el canvas
         ctx.drawImage(img, 10, 10);
      }
   }
}



<--- para la barra de la vida --->

canvas = document.getElementById('canvas');
context = canvas.getContext('2d');
 
rectangleWidth = 50; // Ancho de la barra de vida
rectangleHeight = 10; // Alto de la barra de vida
 
var x = canvas.width - rectangleWidth;
var y = 10;
 
context.rect(x, y, rectangleWidth , rectangleHeight );
context.fill();