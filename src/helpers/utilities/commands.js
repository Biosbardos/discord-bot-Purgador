// Importar módulos necesarios
const funciones = require('./Functions.js');
const variables = require('./Variables');

// ======== COMANDOS ========

/**
 * Maneja los comandos enviados por los usuarios en los canales donde el bot tiene acceso.
 * @param {Message} message - Mensaje recibido en el canal
 */
async function manejarComandos(message) {
  const args = message.content.trim().split(/ +/); // Divide le mensaje en palabras separadas por espacios
  const comando = args[0].toLowerCase();          // Obtiene el comando (Primera palabra de la cadena mensaje)

  switch (comando) { //en este switch se permite joder con poner lo que te de la gana si pones al inicio lo que es, incluso en borrar si pones el comando al inicio y en algún momento un numero funciona igual
    case '-comandos':
      funciones.mostrarComandos(message);
      break;
    case '-avatar':
      funciones.enviarImagen(message, variables.IMAGE_PATHS.avatar, 'Aquí está tu imagen:');
      break;
    case '-banner':
      funciones.enviarImagen(message, variables.IMAGE_PATHS.banner, 'Aquí está tu imagen:');
      break;
    case '-pececin':
      funciones.enviarImagen(message, variables.IMAGE_PATHS.pececin, 'Aquí está tu imagen:');
      break;
    case '-cores':
      funciones.enviarImagen(message, variables.IMAGE_PATHS.cores, 'Aquí está tu imagen:');
      break;
    case '-chanti':
      funciones.enviarImagen(message, variables.IMAGE_PATHS.chanti, 'Aquí está tu imagen:');
      break;
    case '-esencia':
    case 'esencia':                                                                                                 // Sobre este caso en específico, ya que puse JA JA JA JA, creí que quedaba mejor poner el texto abajo, implicando usar una función sobrecargada (lo cual no se puede en js) así que opté por un booleano
      funciones.enviarMensaje(message, 'Puede tardar un poquito, no desesperarse...');
      funciones.enviarImagen(message, variables.IMAGE_PATHS.esencia, 'JA JA JA JA', true);                                    // Puse JA JA JA JA, pero funciona sin mandar nada de content aunque sea parametro de la función (extraño js)
      //enviarMensaje(message, 'https://tenor.com/es/view/broly-villain-laughing-dragon-ball-z-dbz-gif-17670507');  // OPCIÓN mucho más fácil y eficiente, pero no me gusta como lo manda. Se tratará como imagen mejor
      break;
    case '-help':
      funciones.enviarMensaje(message, 'Pregúntale al Bios');
      break;
    case '-borrar': {
      const mensaje = message.content;
      const numero = mensaje.match(/\d+/); // Extrae el número del mensaje
      const cantidad = numero ? numero[0] : 0;
      await funciones.borrarMensajes(message, Number(cantidad));
      break;
    }
    case '-function.on':
      funciones.gestionarMensajesRepetidos(message, true);
      break;
    case '-function.off':
      funciones.gestionarMensajesRepetidos(message, false);
      break;
    case '-working.on':
      funciones.activarActividadBios();
      funciones.enviarMensaje(message, 'Listo, jefe.');
      break;
    case '-working.off':
      funciones.desactivarActividadBios();
      break;
    case '-contar:':
      funciones.enviarMensaje(message, `El mensaje tiene ${funciones.contarPalabras(message)} palabras.`);
      break;
    case '-play':
      if (!variables.GLOBAL_VARIABLES.connection || variables.GLOBAL_VARIABLES.connection.state.status !== 'ready') {
        funciones.administrarPlaylist(message);
        return;
      }
      funciones.enviarMensaje(message, '❌ Otro, qué no ves tú que ya está sonando algo o cómo. Para que carallo hay un comando de parar (-stop), mira a ver mejor si usas -chamba en vez de estar tocando los huevos. ❌');
      break;
    case '-stop':
      if (!variables.GLOBAL_VARIABLES.connection || variables.GLOBAL_VARIABLES.connection.state.status !== 'ready') {
        funciones.enviarMensaje(message, '❌ Qué, tonto tú o qué, no ves que no estoy conectado. Dime, que vas a desconectar. Prueba cuando esté conectado o, mejor, prueba a ponerte a chambear. ❌');
      }
      funciones.detenerPlaylistBucle();
      break;
    default: { // Para comandos de varias palabras (y no es -borrar [parámetro]) // Se usan switches anidados porque es más eficiente que usar dos separados
      const comandoEspecial = message.content.toLowerCase();

      switch (comandoEspecial) { //en este switch por la naturaleza de los switches y de estos comandos, no se puede joder, hay que poner el comando exacto y ya sino no funciona (espero que sea entendible)
        case '-7 palabras':
        case '7 palabras':
          funciones.enviarMensaje(message, 'esencia');
          break;
        case 'está el cores trabajando?':
          funciones.enviarMensaje(message, 'No sé, mira. Pero muy seguramente no');
          break;
        case '-no cojan dibujo':
        case 'no cojan dibujo':
          funciones.enviarImagen(message, variables.IMAGE_PATHS.dibujo, 'Dibujante Mafioso', true);
          break;
        case `<@${variables.USER_IDs.botPurgador}> chambeando por lo que veo`:
          funciones.responderMensaje(message, 'Habló');
          break;
        case 'no reaction':
          if (message.author.id === variables.USER_IDs.biosID) {
            variables.GLOBAL_VARIABLES.biosReaction = false;
          } break;
        case 'reaction':
          if (message.author.id === variables.USER_IDs.biosID) {
            variables.GLOBAL_VARIABLES.biosReaction = true;
          } break;
        default:
          // No hacer nada si no coincide con ningún comando
          break;
      }
    }
  }
}

const commands = Object.freeze({
  manejarComandos,
});

module.exports = commands; 