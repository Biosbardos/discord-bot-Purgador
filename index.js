// Importar módulos necesarios
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const schedule = require('node-schedule');

// ======== CONSTANTES Y CONFIGURACIÓN ========
const TOKEN = 'TOKEN'; // Reemplaza con tu token
const IMAGE_PATHS = {
  esencia: './esencia.gif',  // Imagen para el comando "esencia"
  sleep: './Sleep.png',     // Imagen para el mensaje programado
};
const CANAL_ID_MENSAJE_NOCTURNO = 'CHANNEL ID'; // ID del canal para mensajes programados
const ROLE_ID_TO_IGNORE = 'BOTS ROLE ID'; // ID del rol de los BOTS
const CANAL_ID_ADMINS = 'CHANNEL ID'; // Reemplaza con el ID del canal específico
const INTERVALOS_MINUTOS = [1, 5, 10]; // Intervalos disponibles en minutos
let intervalo = null; // Variable global para controlar el temporizador de mensajes repetitivos
const CANAL_ESPECIFICO_ID = 'CHANNEL ID'
const CANAL_ID_REACCION = 'CHANNEL ID'; // ID del canal donde reaccionar
const REACCION = '❌'; // Cambia por el emoji que quieras usar


// Crear una instancia del cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ======== EVENTOS DEL BOT ========

// Evento: intento de inicio de sesión con el bot
client.login(TOKEN)
  .then(() => {
    //Evento: mandar información relevante una vez el bot inicie sesión correctamente
    client.once('ready', () => {
      console.log(`✅ Bot conectado exitosamente como ${client.user.username} ✅`);
      console.log(`Hora actual del sistema: ${new Date().toLocaleString()}`);
      programarEnvioDeImagen();
    });
  })
  //Manejo de errores al iniciar sesión
  .catch((error) => {
    console.error('❌ Error al iniciar sesión con el bot: ❌', error);
  });

// Evento: manejo de comandos
client.on('messageCreate', async (message) => {
  const member = await message.guild.members.fetch(message.author.id);

  if (member.roles.cache.has(ROLE_ID_TO_IGNORE)) return; //if (message.author.bot) return; // Ignorar mensajes de bots (pero es medio raro no sé cómo va exactamente el author.bot y es mejor, más eficiente y más completo poner el rol que poseen todos los bots)

  // Respuestas a comandos específicos
  manejarComandos(message);
});

//Evento: reacción de mensajes en #Canal concreto
client.on('messageCreate', async (message) => {
  // Verificar que el mensaje sea en el canal específico
  if (message.channel.id !== CANAL_ID_REACCION) return;

  try {
    // Obtener el miembro que envió el mensaje
    const member = await message.guild.members.fetch(message.author.id);

    // Verificar si el miembro tiene el rol a ignorar
    if (member.roles.cache.has(ROLE_ID_TO_IGNORE)) return;

    // Añadir reacción al mensaje
    await message.react(REACCION);
  } catch (error) {
    console.error('❌ Error al reaccionar al mensaje: ❌', error);
  }
});

// ======== FUNCIONES ========

/**
 * Maneja los comandos enviados por los usuarios en los canales donde el bot tiene acceso.
 * @param {Message} message - Mensaje recibido en el canal
 */
async function manejarComandos(message) {
  const args= message.content.trim().split(/ +/); //Divide le mensaje en palabras separadas por espacios
  const comando = args[0].toLowerCase(); //Obteniene el comando (Primera palabra de la cadena mensaje)
  const parametro = args[1]; //Obtiene el parametro numérico (si existe)

  switch (comando) {
    case '-comandos':
      mostrarComandos(message);
      break;
    case 'esencia': //Sobre este caso en específico, ya que puse JA JA JA JA, creí que quedaba mejor poner el texto abajo, implicando usar una función sobrecargada (lo cual no se puede en js) así que opté por un booleano
      enviarImagen(message,  IMAGE_PATHS.esencia, 'JA JA JA JA', true);  //Puse JA JA JA JA, pero funciona sin mandar nada de content aunque sea parametro de la función (extraño js)
      //enviarMensaje(message, 'https://tenor.com/es/view/broly-villain-laughing-dragon-ball-z-dbz-gif-17670507'); OPCIÓN mucho más fácil y eficiente, pero no me gusta como lo manda. Se tratará como imagen mejor
      break;
    case '7 palabras':
      enviarMensaje(message,'esencia');
      break;
    case '-help':
      enviarMensaje(message,'Pregúntale al Bios');
      break;
    case '-borrar':{
      //Valida el argumento como número y en un rango determinado
      const cantidad = parseInt(parametro, 10);
      if (!cantidad || cantidad <=0 || cantidad >100){
        return message.reply ('❌ Por favor, especifica un número válido entre 1 y 100 para borrar mensajes. ❌');
      }
      await borrarMensajes(message, cantidad);
      break;
    }
    case '-function.on':
      gestionarMensajesRepetidos(message, true);
      break;
    case '-function.off':
      gestionarMensajesRepetidos(message, false);
      break;
    default:
      // No hacer nada si no coincide con ningún comando
      break;
  }
}

/**
 * Envía una imagen  y un texto (dos mensajes) al canal donde se recibió el mensaje.
 * @param {Message} message - Mensaje recibido
 * @param {string} imagePath - Ruta de la imagen a enviar
 * @param {string} content - Mensaje de texto que acompaña a la imagen
 * @param {boolean} inverso - Si es `true`, envía primero la imagen y luego el texto.
 */
async function enviarImagen(message, imagePath, content, inverso = false) { // Tiene que ser asíncrona para que los mensajes se manden bien en orden y tiene que ser dos porque discord impone que si mandas en un mensaje imagen o gif y texto el texto arriba, jefe.
  try{
    // Configuración de parámetros según el valor de `inverso`
    if(inverso){
      // Imagen primero
      await message.channel.send ({ files: [imagePath] });
      await message.channel.send (content);
    }else{
      // Texto primero
      await message.channel.send (content);
      await message.channel.send ({ files: [imagePath] });
    }
  } catch (error){
    console.error('Error al enviar la imagen o el texto:', error)
  }
}

/**
 * Envía un mensaje al canal donde se recibió el mensaje.
 * @param {Message} message - Mensaje recibido
 * @param {string} content - Mensaje de texto que responde al mensaje inicial
 */
function enviarMensaje (message, content){
  message.channel
    .send({
      content,
    })
    .catch((error) => console.error ('Error al enviar el mensaje:', error));
}

/**
 * Programa el envío de una imagen a un canal específico a las 12:00 AM cada día.
 */
function programarEnvioDeImagen() {
  schedule.scheduleJob('0 0 * * *', async () => {
    const channel = client.channels.cache.get(CANAL_ID_MENSAJE_NOCTURNO);

    if (channel) {
      try {
        await channel.send({
          content: '¡Buenas noches! @here a dormir todo el mundo.',
          files: [IMAGE_PATHS.sleep],
        });
        console.log('🌙 Imagen de buenas noches enviada a las 00:00 AM 🌙');
      } catch (error) {
        console.error('Error al enviar la imagen programada:', error);
      }
    } else {
      console.error('No se pudo encontrar el canal para el mensaje programado.');
    }
  });
}

/**
 * Muestra una lista de comandos dependiendo del rol del usuario.
 * Si es administrador, recibe comandos administrativos por DM,
 * excepto en un canal específico para Admins donde se muestra todo en público.
 * @param {object} message - Mensaje original.
 */
function mostrarComandos(message) {
  const comandosGenerales = `
**Comandos Generales:**

- **-comandos**: Muestra todos los comandos disponibles.
- **esencia**: Muestra la verdadera esencia.
- **7 palabras**: Esencia.
- **-help**: A ver, no sé, si ya usaste -comandos para lo que se supone que hace esto... Emmm... Es -comandos "avanzado".
- **-function.on**: Activa mensajes repetitivos [**TEMPORAL** no abusen de esto que apago el bot y lo capo].
- **-function.off**: Desactiva mensajes repetitivos.
`;

  const comandosAdministrador = `
**Comandos Exclusivos para Administradores:**

- **-borrar <número>**: Elimina los últimos mensajes (a elegir cantidad) en el canal.
- **-bot on**: Activa el bot.
- **-bot off**: Desactiva el bot.
`;

  if (esAdministrador(message)) {
    if (message.channel.id === CANAL_ID_ADMINS) {
      // En el canal exclusivo de Admins, muestra todo en público
      message.channel.send({
        content: `${message.author}, aquí tienes todos los comandos disponibles:`,
        embeds: [
          {
            title: "🔒📜 **COMANDOS GENERALES Y ADMINISTRATIVOS** 📜🔒",
            description: comandosGenerales + comandosAdministrador,
            color: 0x00ff00, // Verde
            footer: {
              text: "Como estás en el canal exclusivo, no recibirás un mensaje privado.",
            },
          },
        ],
      });
    } else {
      // En otros canales, manda generales en público y administrativos por DM
      message.channel.send({
        content: `${message.author}, aquí tienes la lista de comandos generales:`,
        embeds: [
          {
            title: "📜 **COMANDOS GENERALES** 📜",
            description: comandosGenerales,
            color: 0x0000ff, // Azul
          },
        ],
      });

      // Enviar comandos de administrador por DM
      message.author
        .send({
          embeds: [
            {
              title: "🔒 **COMANDOS EXCLUSIVOS PARA ADMINISTRADORES** 🔒",
              description: comandosAdministrador,
              color: 0xff0000, // Rojo
              footer: {
                text: `USAR CON PRECAUCIÓN, un gran poder conlleva una gran corrupción`,
              },
            },
          ],
        })
        .then(() => {
          //Enviar un segundo mensaje con el contenido adicional
          return message.author.send(
            `Si prefieres no recibir este mensaje, usa el comando en el canal exclusivo para Admins (<#CHANNEL ID>).`, //Puesto así porque dentro del embed (text) no se puede hacer referencia al canal y puesto como then dentro de función asíncrona porque en un único mensaje Discord impone que el texto simple vaya encima del embed
          );
        })
        .catch((error) =>
          console.error('Error al enviar el mensaje directo al administrador:', error)
        );
    }
  } else {
    // Para usuarios no administradores, solo mostrar comandos generales
    message.channel.send({
      content: `${message.author}, aquí tienes la lista de comandos generales:`,
      embeds: [
        {
          title: "📜 **COMANDOS GENERALES** 📜",
          description: comandosGenerales,
          color: 0x0000ff, // Azul
        },
      ],
    });
  }
}

/**
 * Elimina un número de mensajes en un canal.
 * @param {object} message - Mensaje original.
 * @param {number} cantidad - Cantidad de mensajes a borrar.
 */
async function borrarMensajes(message, cantidad) {
  if (!esAdministrador(message)) {
    message.reply('❌ Solo los administradores pueden usar este comando. ❌');
    return;
  }
  if (cantidad < 1 || cantidad > 100) { //100 es un límite impuesto por Discord
    message.reply('❌ Especifica un número entre 1 y 100. ❌');
    return;
  }
  try {
    const mensajes = await message.channel.messages.fetch({ limit: cantidad + 1 });
    await message.channel.bulkDelete(mensajes, true);
    message.channel.send(`✅ Se han eliminado ${mensajes.size - 1} mensajes (sin incluir el propio comando). ✅`);
  } catch (error) {
    console.error('Error al borrar mensajes:', error);
    message.channel.send('❌ Ocurrió un error al intentar borrar los mensajes. ❌');
  }
}

/**
 * Gestiona la activación o desactivación de mensajes repetitivos en un canal específico.
 * @param {boolean} activar - `true` para activar, `false` para desactivar.
 * @param {object} message - Mensaje original de Discord.
 */
async function gestionarMensajesRepetidos(message, activar) {
  const canal = message.client.channels.cache.get(CANAL_ESPECIFICO_ID);

  if (!canal) {
    message.channel.send('❌ Canal incorrecto para la función. ❌');
    console.error('Error: Canal no encontrado.');
    return;
  }

  if (activar) {
    // Verificar si ya está activo
    if (intervalo) {
      return message.channel.send('✅ Los mensajes repetitivos ya están activos. ✅');
    }

    // Crear botones para intervalos
    const filaBotones = new ActionRowBuilder();
    INTERVALOS_MINUTOS.forEach((minutos) => {
      filaBotones.addComponents(
        new ButtonBuilder()
          .setCustomId(`intervalo_${minutos}`)
          .setLabel(`${minutos} minutos`)
          .setStyle(ButtonStyle.Primary)
      );
    });

    // Enviar mensaje con botones
    const mensajeBotones = await message.channel.send({
      content: '📋 Selecciona un intervalo para los mensajes repetitivos: 📋',
      components: [filaBotones],
    });

    // Crear un collector para manejar las interacciones
    const filtro = (i) => i.user.id === message.author.id; // Asegura que solo el autor del comando interactúe
    const collector = mensajeBotones.createMessageComponentCollector({ filter: filtro, time: 60000 });

    collector.on('collect', async (interaction) => {
      const minutosSeleccionados = parseInt(interaction.customId.split('_')[1], 10);
      const intervaloTiempo = minutosSeleccionados * 60 * 1000; // Conversión a milisegundos

      // Iniciar el temporizador
      intervalo = setInterval(() => {
        canal.send('📢 <@PERSONAL ID> Chambea. 📢')
          .catch((error) => console.error('Error al enviar el mensaje:', error));
      }, intervaloTiempo);

      await interaction.reply(`✅ Mensajes repetitivos activados. Intervalo: ${minutosSeleccionados} minutos. ✅`);
      collector.stop(); // Detener el collector
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        mensajeBotones.edit({ content: '⏳ Tiempo agotado. No se activaron los mensajes repetitivos. ⏳', components: [] });
      }
    });
  } else {
    // Desactivar mensajes repetitivos
    if (!intervalo) {
      return message.channel.send('❌ No hay mensajes repetitivos activos para detener. ❌');
    }

    clearInterval(intervalo);
    intervalo = null;
    message.channel.send('⏹️ Mensajes repetitivos desactivados. ⏹️');
  }
}

/**
 * Verifica si el usuario que envió el mensaje tiene permisos de administrador.
 * @param {object} message - Mensaje original.
 * @returns {boolean} `true` si es administrador, `false` de lo contrario.
 */
function esAdministrador(message) {
  return message.member.permissions.has('Administrator');
}