// Importar módulos necesarios
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('../../libraries/node_modules/discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('../../libraries/node_modules/@discordjs/voice');
const schedule = require('../../libraries/node_modules/node-schedule'); //temporal
const variables = require('./Variables');

// ======== FUNCIONES ========

/**
 * Maneja los comandos enviados por los usuarios en los canales donde el bot tiene acceso.
 * @param {Message} message - Mensaje recibido en el canal
 */
async function manejarComandos(message) {
    const args= message.content.trim().split(/ +/);                                                                   // Divide le mensaje en palabras separadas por espacios
    const comando = args[0].toLowerCase();                                                                            // Obtiene el comando (Primera palabra de la cadena mensaje)
  
    switch (comando) {
      case '-comandos':
        mostrarComandos(message);
        break;
      case '-avatar':
        enviarImagen(message, variables.IMAGE_PATHS.avatar, 'Aquí está tu imagen:');
        break;
      case '-banner':
        enviarImagen(message, variables.IMAGE_PATHS.banner, 'Aquí está tu imagen:'); 
        break;
      case '-pececin':
        enviarImagen(message, variables.IMAGE_PATHS.pececin, 'Aquí está tu imagen:');
        break;
      case '-cores':
        enviarImagen(message, variables.IMAGE_PATHS.cores, 'Aquí está tu imagen:');
        break;
      case '-chanti':
        enviarImagen(message, variables.IMAGE_PATHS.chanti, 'Aquí está tu imagen:');
        break;
      case '-esencia':
      case 'esencia':                                                                                                 // Sobre este caso en específico, ya que puse JA JA JA JA, creí que quedaba mejor poner el texto abajo, implicando usar una función sobrecargada (lo cual no se puede en js) así que opté por un booleano
        enviarImagen(message,  variables.IMAGE_PATHS.esencia, 'JA JA JA JA', true);                                   // Puse JA JA JA JA, pero funciona sin mandar nada de content aunque sea parametro de la función (extraño js)
        //enviarMensaje(message, 'https://tenor.com/es/view/broly-villain-laughing-dragon-ball-z-dbz-gif-17670507');  // OPCIÓN mucho más fácil y eficiente, pero no me gusta como lo manda. Se tratará como imagen mejor
        break;
      case '-help':
        enviarMensaje(message,'Pregúntale al Bios');
        break;
      case '-borrar':{     
        const cantidad = args[1];
        await borrarMensajes(message, Number(cantidad));
        break;
      }
      case '-function.on':
        gestionarMensajesRepetidos(message, true);
        break;
      case '-function.off':
        gestionarMensajesRepetidos(message, false);
        break;
      default: { // Para comandos de varias palabras (y no es -borrar [parámetro])
        const mensajeCompleto = message.content.toLowerCase();
  
        if (mensajeCompleto === '7 palabras' || mensajeCompleto === '-7 palabras'){
          enviarMensaje(message, 'esencia');
        } else if (mensajeCompleto === 'está el cores trabajando?') {
          enviarMensaje(message, 'No sé, mira. Pero muy seguramente no');
        } else if (mensajeCompleto === `<@${variables.USER_IDs.botPurgador}> chambeando por lo que veo`){
          responderMensaje(message, 'Habló');
        } else {
          // No hacer nada si no coincide con ningún comando
        }
       
        break;
      }
    }
  }

/**
 * Envía una imagen  y un texto (dos mensajes) al canal donde se recibió el mensaje.
 * @param {Message} message - Mensaje recibido
 * @param {string} imagePath - Ruta de la imagen a enviar
 * @param {string} content - Mensaje de texto que acompaña a la imagen
 * @param {boolean} inverso - Si es `true`, envía primero la imagen y luego el texto.
 */
async function enviarImagen(message, imagePath, content, inverso = false) { // Tiene que ser asíncrona para que los mensajes se manden bien en orden y tiene que ser dos porque discord impone (parece ya dictadura socialista) que si mandas en un mensaje imagen o gif y texto el texto arriba, jefe.
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
 * @param {string} content - Mensaje de texto que responde al mensaje inicial (como mensaje)
 */
function enviarMensaje (message, content){
    message.channel
      .send({
        content,
      })
      .catch((error) => console.error ('Error al enviar el mensaje:', error));
  }

/**
 * Responde a un mensaje al canal donde se recibió el mensaje.
 * @param {Message} message - Mensaje recibido
 * @param {string} content - Mensaje de texto que responde al mensaje inicial (como respuesta)
 */
function responderMensaje (message, content){
  message.
    reply({
      content,
    })
    .catch((error) => console.error ('Error al responder al mensaje:', error));
}

/**
 * Programa el envío de una imagen a un canal específico a las 00:00 AM cada día y más cosa hay como 3 funciones aquí, no juzguen.
 */ 
function programarEnvioDeImagen() {
  // Imagen de buenas noches a las 00:00
  schedule.scheduleJob('0 0 * * *', async () => {
    const channel = client.channels.cache.get(variables.CANAL_IDs.mensajeNocturno);

    if (channel) {
      try {
        await channel.send({
          content: '¡Buenas noches! @here a dormir todo el mundo.',
          files: [variables.IMAGE_PATHS.sleep],
        });
        console.log('🌙 Imagen de buenas noches enviada a las 00:00 AM 🌙');
      } catch (error) {
        console.error('Error al enviar la imagen programada:', error);
      }
    } else {
      console.error('No se pudo encontrar el canal para el mensaje programado.');
    }
  });

  // Imagen de buenos días a las 7:30
  schedule.scheduleJob('30 7 * * *', async () => {
    const channel = client.channels.cache.get(variables.CANAL_IDs.mensajeNocturno); // Debería poner mensajeDiurno, pero ya es un coñazo no se si pondré al final todo purga y ya

    if (channel) {
      try {
        await channel.send({
          content: '¡Buenos días! @here buena suerte en la chamba, el Señor sea contigo.',
          files: [variables.IMAGE_PATHS.wakeUp],
        });
        console.log('☀️ Imagen de buenos días enviada a las 07:30 AM ☀️');
      } catch (error) {
        console.error('Error al enviar la imagen programada:', error);
      }
    } else {
      console.error('No se pudo encontrar el canal para el mensaje programado.');
    }
  });

  // Mensaje privado a las 01:00 para usuarios conectados
  schedule.scheduleJob('0 1 * * *', async () => {
    const channel = client.channels.cache.get(variables.CANAL_IDs.checkOnline);

    if (channel) {
      try {

        // Obtiene los miembros del canal menos los que tienen el rol a ignorar
        const members = channel.members.filter(member => !member.roles.cache.has(variables.ROLE_IDs.toIgnore));
        const miembrosOnline = [];

        for (const member of members.values()) {
          const presencia = obtenerPresenciaDeMiembro(channel.guild, member.id);
          if (presencia !== 'offline') {
            miembrosOnline.push(member);
          }
        }

        if (miembrosOnline.length > 0) {
          console.log('Miembros conectados:', miembrosOnline.map(member => member.user.tag).join(', '));

          for (const member of miembrosOnline) {
            try {
              // Enviar mensaje privado con una imagen específica
              await member.send({
                content: '😴 ¿Aún despierto? 😴',
                files: [variables.IMAGE_PATHS.lateNight],
               });
              console.log(`Mensaje privado enviado a ${member.user.tag}`);
             } catch (dmError) {
              console.error(`Error al enviar mensaje privado a ${member.user.tag}:`, dmError);
            }
          }
        } else {
          console.log('No hay miembros conectados en el canal a la 01:00 AM.');
        }
      } catch (error) {
        console.error('Error al procesar usuarios conectados:', error);
      }
    } else {
      console.error('No se pudo encontrar el canal para comprobar usuarios conectados.');
    }
  });
}

/**
 * Obtiene el estado de presencia de un miembro en un servidor.
 * 
 * @param {object} guild - El objeto del servidor (guild) de Discord.
 * @param {string} memberId - El ID del miembro cuyo estado de presencia se dese obtener.
 * @returns {string} El estado de presencia del miembro (online, idle, dnd, offline).
 */
async function obtenerPresenciaDeMiembro(guild, memberId) {
  try {
    const miembro = await guild.members.fetch(memberId);
    const presencia = miembro.presence?.status || 'offline'; // Si no tiene presencia, se considera 'offline'
    //console.log(`Estado de ${miembro.user.tag}: ${presencia}`); // No es necesario pues en la función en la que se llama sería lógica duplicada
    return presencia;
  } catch (error) {
    console.error(`Error al obtener la presencia de ${memberId}:`, error);
    return 'offline';
  }
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
- **-avatar**: Muestra foto de perfil del BOT.
- **-banner**: Muestra foto del banner del BOT.
- **-pececin**: Muestra una foto, de entre múltiples, del Pececin (posibilidad de una navideño-festiva).
- **-cores**: Muestra una fotobullying, de entre varias, del Cores (posibilidad de una navideña también).
- **-chanti**: Muestra una fotobullying, de entre mucha, del Santi.
- **esencia**: Muestra la verdadera esencia.
- **7 palabras**: Esencia.
- **está el cores trabajando?**: Muestra la verdad sobre la pregunta.
- **@Purgador chambeando por lo que veo**: Da una cura de humildad.
- **-help**: A ver, no sé, si ya usaste -comandos para lo que se supone que hace esto... Emmm... Es -comandos "avanzado".
- **-function.on**: Activa mensajes repetitivos [**TEMPORAL** no abusen de esto que apago el bot y lo capo].
- **-function.off**: Desactiva mensajes repetitivos.
`;

  const comandosAdministrador = `
**Comandos Exclusivos para Administradores:**

- **-borrar <número>**: Elimina los últimos mensajes (a elegir cantidad) en el canal.
- **-gótica culona on**: Genera una gótica culona soltera.
- **-bot on**: Activa el bot.
- **-bot off**: Desactiva el bot.
`;

  if (esAdministrador(message)) {
    if (message.channel.id === variables.CANAL_IDs.admins) {
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
            `Si prefieres no recibir este mensaje, usa el comando en el canal exclusivo para Admins (<#862284750759526420>).`, //Puesto así porque dentro del embed (text) no se puede hacer referencia al canal y puesto como then dentro de función asíncrona porque en un único mensaje Discord impone que el texto simple vaya encima del embed
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
  if (!cantidad || isNaN(cantidad) || !Number.isInteger(Number(cantidad)) || cantidad <=0 || cantidad >99){    // Se valida que cantidad sea un número entero positivo en rango (100 es el límite impuesto por Discord para borrar de una vez, aquí pone 99 porque borra tú mensaje de petición tambien)
    return message.reply ('❌ Por favor, especifica un número válido entre 1 y 99 para borrar mensajes. ❌');
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
  const canal = message.client.channels.cache.get(variables.CANAL_IDs.mensajesRepetitivos);

  if (!canal) {
    message.channel.send('❌ Canal incorrecto para la función. ❌');
    console.error('Error: Canal no encontrado.');
    return;
  }

  if (activar) {
    // Verificar si ya está activo
    if (variables.GLOBAL_VARIABLES.intervalo) {
      return message.channel.send('✅ Los mensajes repetitivos ya están activos. ✅');
    }

    // Verificar si ya hay un collector activo
    if (variables.GLOBAL_VARIABLES.collectorActivo) {
      return message.channel.send('⏳ Ya se enviaron botones, responde al mensaje anterior. ⏳');
    }

    // Marcar el collector como activo
    variables.GLOBAL_VARIABLES.collectorActivo = true;

    // Crear botones para intervalos
    const filaBotones = new ActionRowBuilder();
    variables.DATA_ESCTRUCTURES.intervalosMinutos.forEach((minutos) => {
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
      variables.GLOBAL_VARIABLES.intervalo = setInterval(() => {
        canal.send(`📢 ${variables.USER_IDs.coresID} Chambea. 📢`)
          .catch((error) => console.error('Error al enviar el mensaje:', error));
      }, intervaloTiempo);

      await interaction.reply(`✅ Mensajes repetitivos activados. Intervalo: ${minutosSeleccionados} minutos. ✅`);
      collector.stop(); // Detener el collector
    });

    collector.on('end', (_, reason) => {
      variables.GLOBAL_VARIABLES.collectorActivo = false; // Marcar el collector como inactivo
      if (reason === 'time') {
        mensajeBotones.edit({ content: '⏳ Tiempo agotado. No se activaron los mensajes repetitivos. ⏳', components: [] });
      }
    });
  } else {
    // Desactivar mensajes repetitivos
    if (!variables.GLOBAL_VARIABLES.intervalo) {
      return message.channel.send('❌ No hay mensajes repetitivos activos para detener. ❌');
    }

    clearInterval(variables.GLOBAL_VARIABLES.intervalo);
    variables.GLOBAL_VARIABLES.intervalo = null;
    variables.GLOBAL_VARIABLES.collectorActivo = false; // Desactivar el estado del collector cuando se apagan los mensajes repetitivos
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

/**
 * Función para programar la reproducción de un audio entre unas fechas concretas
 */
function programarReproducciónDeAudio(){
  schedule.scheduleJob(
    { start: new Date('2024-12-01T00:00:00Z'), end: new Date('2025-01-31T23:59:59Z'), rule: '*/1 * * * *' }, 
    async () => {
      if (!variables.GLOBAL_VARIABLES.connection ||variables.GLOBAL_VARIABLES.connection.state.status !== 'ready') {
        console.log('⏳ Conectando y configurando la reproducción... ⏳');
        await reproducirAudioEnBucle();
      }
    }
  );
}

/**
 * Función para reproducir audio en bucle
 */
async function reproducirAudioEnBucle() {
  const voiceChannel = variables.CLIENT.channels.cache.get(variables.CANAL_IDs.ciudadVoice);

  if (voiceChannel && voiceChannel.isVoiceBased()) {
    try {
      // Conectar al canal de voz si no está conectado
      if (!variables.GLOBAL_VARIABLES.connection || variables.GLOBAL_VARIABLES.connection.state.status !== 'ready') {
        variables.GLOBAL_VARIABLES.connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: voiceChannel.guild.id,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
      }

      // Crear el reproductor de audio si no existe
      if (!variables.GLOBAL_VARIABLES.player) {
        variables.GLOBAL_VARIABLES.player = createAudioPlayer();
        variables.GLOBAL_VARIABLES.connection.subscribe(variables.GLOBAL_VARIABLES.player);
        console.log('🔊 Reproductor de audio configurado. 🔊');
      }
      
       // Índice para la canción actual
       let currentSongIndex = 0;

       // Función para crear y reproducir el recurso de audio
      const playAudio = () => {
        const songKey = variables.DATA_ESCTRUCTURES.cancionesNavidad[currentSongIndex];
        const resource = createAudioResource(variables.AUDIO_PATHS[songKey]);
        variables.GLOBAL_VARIABLES.player.play(resource);
      };

      // Manejar el evento de finalización para reproducir en bucle
      variables.GLOBAL_VARIABLES.player.on(AudioPlayerStatus.Idle, () => {
        variables.GLOBAL_VARIABLES.playCount++; // Incrementa el contador de cada vez que el audio termina

        // Solo muestra el mensaje cada 10 intercambios de canciones para no saturar la terminal
        if (variables.GLOBAL_VARIABLES.playCount % (10*5*variables.DATA_ESCTRUCTURES.cancionesNavidad.length) === 0){
          console.log(`🎵 El audio ha terminado de intercambiarse ${variables.GLOBAL_VARIABLES.playCount/10} veces. 🎵`); // No sé porque ni este emoji de notas musicales ni el otro aparecen en la terminal de VSCode, no me pregunten
        }

        // Cambiar de canción cada 5 reproducciones
        if (variables.GLOBAL_VARIABLES.playCount % 5 === 0) {
          currentSongIndex = (currentSongIndex + 1) % variables.DATA_ESCTRUCTURES.cancionesNavidad.length;
        }

        playAudio();
      });
      
      // Manejo error audio
      variables.GLOBAL_VARIABLES.player.on('error', error => {
        console.error(`❌ Error en el reproductor de audio: ${error.message} ❌`);
      });

      // Iniciar la reproducción si no está activo
      if (variables.GLOBAL_VARIABLES.player.state.status !== AudioPlayerStatus.Playing) {
        console.log('🎶 Reproduciendo audio en bucle... 🎶');
        playAudio();
      }
    } catch (error) {
      console.error('❌ Error al intentar conectar al canal de voz: ❌', error);
    }
  } else {
    console.error('❌ No se encontró el canal de voz o no es un canal válido. ❌');
  }
}

/**
 * Cuenta las palabras de un texto.
 * @param {object} message - Mensaje original.
 * @returns {number} Numero palabras en el mensaje.
 */
function contarPalabras(message) {
  // Elimina espacios en blanco al principio y al final y divide el texto en palabras
  const palabras = message.trim().split(/\s+/);
  return palabras.length;
}

//Objeto con todas las funciones del archivo
const funciones = Object.freeze({
    manejarComandos,
    enviarImagen,
    enviarMensaje,
    programarEnvioDeImagen,      //separar la lógica a un evento que llama a la función
    mostrarComandos,
    borrarMensajes,
    gestionarMensajesRepetidos,
    esAdministrador,
    programarReproducciónDeAudio,
});

//Exportar el objeto funciones con todas las funciones del archivo para poder usarlas en el index.js
module.exports = funciones;

//POR INCORPORAR

/**
 * Función para manejar las prioridades de reproducción.
 * @param {Object} interaction - La interacción del comando.
 * @param {String} audioPath - Ruta del archivo de audio.
 * @param {Boolean} forcePlay - Ignorar restricciones si es programado.
 
async function manejarReproduccion(interaction, audioPath, forcePlay = false) {
  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) {
    await interaction.reply({ content: '¡Debes estar en un canal de voz para usar esta función!', ephemeral: true });
    return;
  }

  const fechaActual = new Date();
  const enPeriodoProgramado =
    fechaActual.getMonth() === 11 || (fechaActual.getMonth() === 0 && fechaActual.getDate() <= 8);

  if (enPeriodoProgramado && !forcePlay) {
    await interaction.reply({
      content: '🎄 El bot está ocupado reproduciendo música navideña. Intenta después del 8 de enero.🎄',
      ephemeral: true,
    });
    return;
  }

  if (variables.GLOBAL_VARIABLES.isPlaying) {
    await interaction.reply({ content: '⏳ El bot está reproduciendo otro audio. Intenta más tarde.⏳', ephemeral: true });
    return;
  }

  // Conectar y reproducir
  try {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    const resource = createAudioResource(audioPath);

    player.play(resource);
    connection.subscribe(player);
    variables.GLOBAL_VARIABLES.isPlaying = true;

    await interaction.reply({ content: `🎵 Reproduciendo audio: ${path.basename(audioPath)}🎵`, ephemeral: true });

    player.on(AudioPlayerStatus.Idle, () => {
      variables.GLOBAL_VARIABLES.isPlaying = false;
      connection.destroy();
      if (audioQueue.length > 0) {
        // Reproducir siguiente audio en cola
        manejarReproduccion(interaction, audioQueue.shift());
      }
    });

    player.on('error', (error) => {
      console.error('Error al reproducir audio:', error);
      variables.GLOBAL_VARIABLES.isPlaying = false;
      connection.destroy();
    });
  } catch (error) {
    console.error('Error al manejar reproducción:', error);
    variables.GLOBAL_VARIABLES.isPlaying = false;
    await interaction.reply({ content: 'Hubo un problema al reproducir el audio.', ephemeral: true });
  }
}

// Configuración del audio programado
schedule.scheduleJob('0 0 1 12 *', () => {
  client.channels.fetch('ID_DEL_CANAL_DE_VOZ') // Cambia con el ID del canal
    .then((channel) => {
      manejarReproduccion(
        { member: { voice: { channel } } },
        variables.AUDIO_PATHS,
        true // Forzar reproducción
      );
    })
    .catch(console.error);
});
*/