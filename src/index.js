// Importar módulos necesarios
const commands = require('./helpers/utilities/commands.js');
const funciones = require('./helpers/utilities/Functions.js');
const variables = require('./helpers/utilities/Variables.js');

// ======== EVENTOS DEL BOT ========

// Evento: intento de inicio de sesión con el bot
variables.CLIENT.login(variables.TOKEN)
  .then(() => {
    //Evento: mandar información relevante una vez el bot inicie sesión correctamente
    variables.CLIENT.once('ready', () => {
      console.log(`✅ Bot conectado exitosamente como ${variables.CLIENT.user.username} ✅`);
      console.log(`Hora actual del sistema: ${funciones.formatDate(new Date())}`);
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
      console.log('⚠️  Mensaje recibido en DM de', message.author.username, ': ', message.content, ' ⚠️ ', funciones.formatDate(new Date()));

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
      commands.manejarComandos(message);
    }
  } catch (error) {
    // Manejo de errores para casos como miembros desconocidos y problemas con los guilds pero sobre los servidores en los que está el bot (relacionados con la caché supongo yo)
    if (error.code === 10007) {
      console.warn(`⚠️ Miembro desconocido (ID: ${message.author.id}) ⚠️`);
    } else if (error.code === 30001) {
      console.warn(`⚠️ Problemas con el servidor (ID: ${message.guild.id}) ⚠️`); //no me acaba de convencer, no tiene mucho sentido manejarlo así pero es que tampoco entiendo como da el error, de todas formas no ha vuelto a darlo y al manejar la caché no debería volver a darlo
    } else if (error.code === -3001) {
      console.warn(`⚠️ Posibles problemas con la conexión ⚠️`);
    } else {
      console.error('❌ Error al manejar el evento messageCreate: ❌', error);
    }
  }
});

//Evento: reacción de mensajes en #purga
variables.CLIENT.on('messageCreate', async (message) => {
  try {
    //  Reacción para mí por que soy un puto genio
    if (message.author.id === variables.USER_IDs.biosID && variables.GLOBAL_VARIABLES.biosReaction) {
      await message.react('❤️');
    }

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
    } else if (message.author.id == variables.USER_IDs.botPurgador) {

        const palabrasClave = ['Visual Studio Code', 'Code::Blocks 20.03', 'Apache NetBeans IDE', 'SolidWorks', 'El bot lleva en desarrollo'];

      if (palabrasClave.some((palabra) => message.content.includes(palabra))) {
        // Reaccionar a los mensajes de chamba
        await message.react(variables.REACTIONS.reaccionImagenGeneralPositiva);
      } else {
        // Reaccionar a los mensajes del bot
        await message.react(variables.REACTIONS.reaccionImagenGeneralNegativa);
      }
    } else if (message.author.id !== variables.USER_IDs.botPurgador) {
      // Reaccionar a los mensajes de texto
      await message.react(variables.REACTIONS.reaccionMensajes);
      if (funciones.esAdministrador(message)) {
        await message.react(variables.REACTIONS.reaccionMensajesAdmins);
      }
    }
  } catch (error) {
    console.error('❌ Error al reaccionar al mensaje: ❌', error);
  }
});

//Hay que poner esto en su sitio
const CHANNEL_ID = '747553011009847376'; 
const MESSAGE_ID = '1308231460804890625';
const ROLE_ID = '1007035110123642881';

//Evento: Manejo reacciones Positivas
variables.CLIENT.on('messageReactionAdd', async (reaction, user) => { //Si se añade reacción a historial de mensajes manejar las reacciones negativas (por ahora funciona de manera cronológica y no hay conflicto)
  try {
    if(user.id === variables.USER_IDs.biosID){
      const emojiReaccionado= reaction.emoji.name;
      reaction.message.react(emojiReaccionado);
    }

    // Verificar que el mensaje sea en el canal específico
    if (reaction.message.channel.id !== variables.CANAL_IDs.reaccion) return;

    if (reaction.emoji.name === variables.REACTIONS.reaccionImagenGeneralPositiva) {
      reaction.message.react(variables.REACTIONS.reaccionImagenGeneralPositiva);

      const negativeReaction = reaction.message.reactions.resolve(variables.REACTIONS.reaccionImagenGeneralNegativa);
      if (negativeReaction) {
        negativeReaction.users.remove();
      }
    }
  } catch (error) {
    console.error('❌ Error al "reaccionar" a la reacción: ❌', error);
  }
});

//Evento: Asignación de roles reactivos para #purga
variables.CLIENT.on('messageReactionAdd', async (reaction, user) => { //Si se añade reacción a historial de mensajes manejar las reacciones negativas (por ahora funciona de manera cronológica y no hay conflicto)
  try {
    
    const guild = reaction.message.guild;
    const channel = reaction.message.channel;
    const member = guild.members.cache.get(user.id);
    const role = guild.roles.cache.get(ROLE_ID);

    if (user.bot || reaction.message.channel.id !== CHANNEL_ID) return;

    await channel.messages.fetch(MESSAGE_ID);
    //console.log(`✅ Mensaje con ID ${MESSAGE_ID} cargado en caché para monitorear reacciones. ✅`);

    if (reaction.message.id !== MESSAGE_ID) return; // Verificar que el mensaje es el específico
    if (member.roles.cache.has(role.id)) return; // Verificar si el usuario ya tiene el rol

    await member.roles.add(role);
    console.log(`Rol ${role.name} asignado a ${user.tag} por reaccionar al mensaje`);

  } catch (error) {
    console.error(`❌ Error al asignar el rol reactivo: ❌`, error);
  }
});

variables.CLIENT.on('messageReactionRemove', async (reaction, user) => {
  try {

    const guild = reaction.message.guild;
    const channel = reaction.message.channel;
    const member = guild.members.cache.get(user.id);
    const role = guild.roles.cache.get(ROLE_ID);

    if (user.bot || reaction.message.channel.id !== CHANNEL_ID) return;

    await channel.messages.fetch(MESSAGE_ID);
    if (reaction.message.id !== MESSAGE_ID) return; // Verificar que el mensaje es el específico

    await member.roles.remove(role);
    console.log(`Rol ${role.name} retirado de ${user.tag} por quitar la reacción del mensaje`);
  } catch (error) {
    console.error(`❌ Error al remover el rol: ❌`, error);
  }
});

//TODO ESTE EVENTO HAY QUE ARREGLARLO MOVER VARIABLES A VARIABLES METER COSAS EN UNA FUNCIÓN Y DEMÁS
const activeGames = variables.DATA_ESCTRUCTURES.activeGames; // Mapa para almacenar los juegos activos de los usuarios

variables.CLIENT.on('presenceUpdate', (oldPresence, newPresence) => {
  // ID del canal de texto específico donde se supervisarán los cambios de actividad
  const CHANNEL_ID = variables.CANAL_IDs.purga;

  // Verificar si el miembro es válido
  if (!newPresence || !newPresence.member) return;
  const member = newPresence.member;

  // Obtener el canal de texto
  const textChannel = variables.CLIENT.channels.cache.get(CHANNEL_ID);
  if (!textChannel) return;

  // Obtener los miembros del canal
  const membersInChannel = textChannel.members;
  if (!membersInChannel.has(member.id)) return;

  // Obtener las actividades actuales del usuario
  const activities = newPresence.activities;
  let isPlaying = false;

  activities.forEach(activity => {
    if (activity.type === 0) { // 0 corresponde a PLAYING en Discord.js v14+
      isPlaying = true;
      if (!activeGames.has(member.id)) {
        const startTime = Date.now();
        activeGames.set(member.id, { game: activity.name, startTime });
        //funciones.enviarMensajeCanalEspecifico(CHANNEL_ID,`${member.user.tag} comenzó a jugar a ${activity.name}` );  // Peta mucho el canal y no da mucha información. Es decir, dice que empezó a jugar a qué pero ya, el mensaje de acabar te dice a que juego estaba jugando igualmente y además cuanto jugó.
        console.log(`${member.user.tag} comenzó a jugar a ${activity.name}`, funciones.formatDate(new Date()));
      }
    }
  });

  // Si el usuario ya no está jugando, registrar cuándo dejó de jugar
  if (!isPlaying && activeGames.has(member.id)) {
    const { game, startTime, manual } = activeGames.get(member.id);

    // Ignorar entradas manuales
    if (manual) return;

    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(2);
    funciones.enviarMensajeCanalEspecifico(CHANNEL_ID, `${member.user.tag} dejó de jugar a ${game} después de ${hours}h ${minutes}m ${seconds}s.`);
    console.log(`${member.user.tag} dejó de jugar a ${game} después de ${hours}h ${minutes}m ${seconds}s.`, funciones.formatDate(new Date()));
    if (hours >= 3 && hours < 6) {
      funciones.enviarMensajeCanalEspecifico(CHANNEL_ID, `Chaaacho, ${member.user.tag} ya te vale eh! Jornada laboral completa jugando al ${game}`);
    } else if (hours >= 6) {
      funciones.enviarMensajeCanalEspecifico(CHANNEL_ID, ` <@${member.user.id}> qué pasa tarántula, deixame ver unha cousiña, ${game} == ${hours}h ${minutes}m ${seconds}s vs Chamba == 0h 0m 0s`);
    }
    activeGames.delete(member.id);
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