// Importar módulos necesarios
import { ActivityType } from 'discord.js';
import commands from './helpers/utilities/commands.js';
import funciones from './helpers/utilities/Functions.js';
//import  getSteamPresence  from './APIs/steamAPI.js';
import variables from './helpers/utilities/Variables.js';

// ======== EVENTOS DEL BOT ========

// Evento: intento de inicio de sesión con el bot
variables.CLIENT.login(variables.TOKEN)
  .then(() => {
    //Evento: mandar información relevante una vez el bot inicie sesión correctamente
    variables.CLIENT.once('ready', () => {
      console.log(`✅ Bot conectado exitosamente como ${variables.CLIENT.user.username} ✅`);
      console.log(`Hora actual del sistema: ${funciones.formatDate(new Date())}`);

      // Actividad personalizada
      variables.CLIENT.user.setActivity('Purgando a los perezosos...', {type: ActivityType.Playing });
      variables.CLIENT.user.setStatus('online');
      console.log('Presencia y estado establecidos');

      //manejo caché (con función caché)
      funciones.programarEnvioDeImagen();
      funciones.programarReproducciónDeAudio();
    });
  })
  //Manejo de errores al iniciar sesión
  .catch((error) => {
    console.error('❌ Error al iniciar sesión con el bot: ❌', error);
  });

let ultimaClaveRespuestaBot = null; //Chapuzada máxima, no me juzguen

// Evento: manejo de comandos
variables.CLIENT.on('messageCreate', async (message) => {
  try {
    // Responder si el mensaje es del bot o si responde al bot (No tengo dónde meterlo, queda aquí chapucero)
    const nuevaClave = await funciones.responderSiRespondenAlBot(message, ultimaClaveRespuestaBot);
    if (nuevaClave) {
      ultimaClaveRespuestaBot = nuevaClave;
    }
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
      // Intentar obtener al miembro desde la caché o hacer fetch si no está
      let member = message.guild.members.cache.get(message.author.id)
        ?? await message.guild.members.fetch(message.author.id).catch(() => null); // Para evitar exceciones con undefined y posibles rollos de JS

      if (!member) {
        console.error('Miembro no encontrado tras fetch.');
        return;
      }
      // Validar si el miembro tiene el rol a ignorar
      if (member.roles.cache.has(variables.ROLE_IDs.toIgnore)) return;

      // Manejar comandos
      commands.manejarComandos(message);
    }
  } catch (error) {
    // Manejo de errores
    if (error.code === 10007) {
      console.warn(`⚠️ Miembro desconocido (ID: ${message.author.id}) ⚠️`);
    } else if (error.code === 30001) {
      console.warn(`⚠️ Problemas con el servidor (ID: ${message.guild.id}) ⚠️`);
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

//Evento: Manejo reacciones Positivas
variables.CLIENT.on('messageReactionAdd', async (reaction, user) => { //Si se añade reacción a historial de mensajes manejar las reacciones negativas (por ahora funciona de manera cronológica y no hay conflicto)
  try {
    if (user.id === variables.USER_IDs.biosID) {
      const emojiReaccionado = reaction.emoji.name;
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

    // Validar que guild y channel existen
    if (!guild || !channel) {
      console.error('Guild o canal no encontrado.');
      return;
    }

    const member = guild.members.cache.get(user.id);
    const role = guild.roles.cache.get(variables.ROLE_IDs.rolReactivo);

    if (!member || !role) {
      console.error('Miembro o rol no encontrado.');
      return;
    }

    if (user.bot || reaction.message.channel.id !== variables.CANAL_IDs.decretosOficiales) return;

    await channel.messages.fetch(variables.MESSAGE_IDs.mensajeRolReactivo);
    //console.log(`✅ Mensaje con ID ${variables.MESSAGE_IDs.mensajeRolReactivo} cargado en caché para monitorear reacciones. ✅`);

    if (reaction.message.id !== variables.MESSAGE_IDs.mensajeRolReactivo) return; // Verificar que el mensaje es el específico
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

    // Validar que guild y channel existen
    if (!guild || !channel) {
      console.error('Guild o canal no encontrado.');
      return;
    }

    const member = guild.members.cache.get(user.id);
    const role = guild.roles.cache.get(variables.ROLE_IDs.rolReactivo);

    if (!member || !role) {
      console.error('Miembro o rol no encontrado.');
      return;
    }

    if (user.bot || reaction.message.channel.id !== variables.CANAL_IDs.decretosOficiales) return;

    await channel.messages.fetch(variables.MESSAGE_IDs.mensajeRolReactivo);
    if (reaction.message.id !== variables.MESSAGE_IDs.mensajeRolReactivo) return; // Verificar que el mensaje es el específico

    await member.roles.remove(role);
    console.log(`Rol ${role.name} retirado de ${user.tag} por quitar la reacción del mensaje`);
  } catch (error) {
    console.error(`❌ Error al remover el rol: ❌`, error);
  }
});

variables.CLIENT.on('presenceUpdate', (oldPresence, newPresence) => {

  // Verificar si el miembro es válido
  if (!newPresence || !newPresence.member) return;
  const member = newPresence.member;

  // Obtener el canal de texto
  const textChannel = variables.CLIENT.channels.cache.get(variables.CANAL_IDs.checkActivities);
  if (!textChannel) return;

  // Obtener los miembros del canal
  const membersInChannel = textChannel.members //.filter(m => !m.member.hasRole(variables.ROLE_IDs.toIgnore));
  if (!membersInChannel.has(member.id)) return;

  // Obtener las actividades actuales del usuario
  const activities = newPresence.activities;
  let isPlaying = false;

  activities.forEach(activity => {
    if (activity.type === 0) { // 0 corresponde a PLAYING en Discord.js v14+
      isPlaying = true;
      if (!variables.DATA_ESCTRUCTURES.activeGames.has(member.id)) {
        const startTime = Date.now();
        variables.DATA_ESCTRUCTURES.activeGames.set(member.id, { game: activity.name, startTime });
        //funciones.enviarMensajeCanalEspecifico(variables.CANAL_IDs.checkActivities,`${member.user.tag} comenzó a jugar a ${activity.name}` );  // Peta mucho el canal y no da mucha información. Es decir, dice que empezó a jugar a qué pero ya, el mensaje de acabar te dice a que juego estaba jugando igualmente y además cuanto jugó.
        console.log(`${member.user.tag} comenzó a jugar a ${activity.name}`, funciones.formatDate(new Date()));
      }
    }
  });

  for (const member of membersInChannel.values()) {
    const steamId = variables.DATA_ESCTRUCTURES.steamIds?.[member.id];
    if (steamId) {
      const presence = getSteamPresence(steamId);
      if (presence) {
        let estado = '';
        switch (presence.personaState) {
          case 0: estado = 'offline'; break;
          case 1: estado = 'online'; break;
          case 2: estado = 'ocupado'; break;
          case 3: estado = 'ausente'; break;
          case 4: estado = 'en modo snooze'; break;
          case 5: estado = 'buscando intercambio'; break;
          case 6: estado = 'buscando partida'; break;
        }
        let mensaje = `${member.user.tag} está ${estado} en Steam.`;
        if (presence.gameExtraInfo) {
          mensaje += ` Jugando a: ${presence.gameExtraInfo}`;
        }
        funciones.enviarMensajeCanalEspecifico(variables.CANAL_IDs.checkActivities, mensaje);
      }
    }
  }

  // Si el usuario ya no está jugando, registrar cuándo dejó de jugar
  if (!isPlaying && variables.DATA_ESCTRUCTURES.activeGames.has(member.id)) {
    const { game, startTime, manual } = variables.DATA_ESCTRUCTURES.activeGames.get(member.id);

    // Ignorar entradas manuales
    if (manual) return;

    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(2);
    funciones.enviarMensajeCanalEspecifico(variables.CANAL_IDs.checkActivities, `${member.user.tag} dejó de jugar a ${game} después de ${hours}h ${minutes}m ${seconds}s.`);
    console.log(`${member.user.tag} dejó de jugar a ${game} después de ${hours}h ${minutes}m ${seconds}s.`, funciones.formatDate(new Date()));
    if (hours >= 3 && hours < 6) {
      funciones.enviarMensajeCanalEspecifico(variables.CANAL_IDs.checkActivities, `Chaaacho, ${member.user.tag} ya te vale eh! Jornada laboral completa jugando al ${game}`);
    } else if (hours >= 6) {
      funciones.enviarMensajeCanalEspecifico(variables.CANAL_IDs.checkActivities, ` <@${member.user.id}> qué pasa tarántula, deixame ver unha cousiña, ${game} == ${hours}h ${minutes}m ${seconds}s vs Chamba == 0h 0m 0s`);
    }
    variables.DATA_ESCTRUCTURES.activeGames.delete(member.id);
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
