// Importar módulos necesarios
const schedule = require('./libraries/node_modules/node-schedule');
const funciones = require('./helpers/utilities/Functions.js');
const variables = require('./helpers/utilities/Variables.js');

// ======== EVENTOS DEL BOT ========

// Evento: intento de inicio de sesión con el bot
variables.CLIENT.login(variables.TOKEN)
  .then(() => {
    //Evento: mandar información relevante una vez el bot inicie sesión correctamente
    variables.CLIENT.once('ready', () => {
      console.log(`✅ Bot conectado exitosamente como ${variables.CLIENT.user.username} ✅`);
      console.log(`Hora actual del sistema: ${new Date().toLocaleString()}`);
      //manejo caché (con función caché)
      funciones.programarEnvioDeImagen();
      funciones.programarReproducciónDeAudio();

    });
  })
  //Manejo de errores al iniciar sesión
  .catch((error) => {
    console.error('❌ Error al iniciar sesión con el bot: ❌', error);
  });

// Evento: manejo de comandos
variables.CLIENT.on('messageCreate', async (message) => {
  try {
    // Validar si el guild existe (en caso de que el mensaje provenga de un DM)
    if (message.channel.type === 1 && message.author.id !== variables.USER_IDs.botPurgador) {
      console.log('⚠️  Mensaje recibido en DM: ', message.author.username, ' ', message.content, ' ⚠️');

      const userId = message.author.id;

      // Mapa para manejar el estado de los usuarios
      if (!variables.DATA_ESCTRUCTURES.userStateDM) {
        variables.DATA_ESCTRUCTURES.userStateDM = new Map();
      }

      const userState = variables.DATA_ESCTRUCTURES.userStateDM;

        // Si el usuario está bloqueado (esperando envío de imagen/emoji), no responder
      if (userState.get(userId)?.isBlocked) return; 

       // Inicializar contador si no existe
       const count = userState.get(userId)?.messageCount || 0;

      if (count < 4) {
        // Incrementar contador y responder con el mensaje
        userState.set(userId, { messageCount: count + 1, isBlocked: false });
        await message.reply('📬 No puedo responder mensajes directos (por ahora). 📬');
      } else {
        // Enviar imagen y emoji, y bloquear usuario temporalmente
        userState.set(userId, { messageCount: 0, isBlocked: true });

        try {
          //Envía foto para que se calle ya a la verga
          await message.author.send({ files: [variables.IMAGE_PATHS.callar] });
          await message.author.send('🤫');
        } catch (error) {
          console.error('❌ Error al enviar imagen o emoji: ❌', error);
        } finally {
          // Desbloquear usuario después de 3 segundos
          setTimeout(() => {
            userState.set(userId, { messageCount: 0, isBlocked: false });
          }, 3000);
        }
      }
      return;
    } else {
      if (!message.guild) return;

      // Intentar obtener al miembro desde la caché
      let member = message.guild.members.cache.get(message.author.id);

      // Si no está en la caché, hacer un fetch
      if (!member) {
        member = await message.guild.members.fetch(message.author.id);
      }

      // Validar si el miembro tiene el rol a ignorar
     if (member.roles.cache.has(variables.ROLE_IDs.toIgnore)) return;

      // Manejar comandos
      funciones.manejarComandos(message);
    }
  } catch (error) {
    // Manejo de errores para casos como miembros desconocidos y problemas con los guilds pero sobre los servidores en los que está el bot (relacionados con la caché supongo yo)
    if (error.code === 10007) {
      console.warn(`⚠️ Miembro desconocido (ID: ${message.author.id}) ⚠️`);
    } else if (error.code === 30001) {
      console.warn(`⚠️ Problemas con el servidor (ID: ${message.guild.id}) ⚠️`); //no me acaba de convencer, no tiene mucho sentido manejarlo así pero es que tampoco entiendo como da el error, de todas formas no ha vuelto a darlo y al manejar la caché no debería volver a darlo
    } else {
      console.error('❌ Error al manejar el evento messageCreate: ❌', error);
    }
  }
});

//Evento: reacción de mensajes en #purga
variables.CLIENT.on('messageCreate', async (message) => {
  try {
    // Verificar que el mensaje sea en el canal específico
    if (message.channel.id !== variables.CANAL_IDs.reaccion) return;

    // Verificar si el autor tiene el rol a ignorar
    const member = await message.guild.members.fetch(message.author.id); //incorporar intentar cogerlo de la caché
    if (member.roles.cache.has(variables.ROLE_IDs.toIgnore) && message.author.id !== variables.USER_IDs.botPurgador) return;

    // Verificar si el mensaje contiene adjuntos
    if (message.attachments.size > 0) {
      // Obtener el primer archivo adjunto
      const adjunto = message.attachments.first();

      // Verificar si el nombre del archivo coincide con la imagen específica
      if (adjunto.name === 'sleep.png') {
        // Reaccionar con el emoji para la imagen específica
        await message.react(variables.REACTIONS.reaccionImagenDormir);
      } else if (adjunto.name === 'wakeUp.png') {
        // Reaccionar con el emoji para la imagen específica
        await message.react(variables.REACTIONS.reaccionImagenDespertar);
      } else {
        // Reaccionar con el emoji para imágenes generales
        await message.react(variables.REACTIONS.reaccionImagenGeneralNegativa);
      } 
    } else {
      // Reaccionar a los mensajes de texto
      await message.react(variables.REACTIONS.reaccionMensajes);
      if (funciones.esAdministrador(message)) { //en js no hace falta poner === true, si es true ya lo toma como true
        await message.react(variables.REACTIONS.reaccionMensajesAdmins);
      }
    }
  } catch (error) {
    console.error('❌ Error al reaccionar al mensaje: ❌', error);
  }
});

/* Comando para reproducir sonido (soundboard y normales) en desarrollo

variables.CLIENT.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'reproducir') {
    const audio = interaction.options.getString('audio');
    const audioPath = path.join(__dirname, `${audio}.mp3`);

    if (!audioPath) {
      await interaction.reply({ content: 'Audio no válido.', ephemeral: true });
      return;
    }

    manejarReproduccion(interaction, audioPath);
  }
});
**/