// Importar módulos necesarios
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';
import fs from 'fs';
import schedule from 'node-schedule';
import variables from './Variables.js';

// ======== FUNCIONES ========

/**
 * Envía una imagen  y un texto (dos mensajes) al canal donde se recibió el mensaje.
 * @param {Message} message - Mensaje recibido
 * @param {string} imagePath - Ruta de la imagen a enviar
 * @param {string} content - Mensaje de texto que acompaña a la imagen
 * @param {boolean} inverso - Si es `true`, envía primero la imagen y luego el texto.
 */
async function enviarImagen(message, imagePath, content, inverso = false) { // Tiene que ser asíncrona para que los mensajes se manden bien en orden y tiene que ser dos porque discord impone (parece ya dictadura socialista) que si mandas en un mensaje imagen o gif y texto el texto arriba, jefe.
  try {
    // Configuración de parámetros según el valor de `inverso`
    if (inverso) {
      // Imagen primero
      await message.channel.send({ files: [imagePath] });
      await message.channel.send(content);
    } else {
      // Texto primero
      await message.channel.send(content);
      await message.channel.send({ files: [imagePath] });
    }
  } catch (error) {
    console.error('Error al enviar la imagen o el texto:', error)
  }
}

/**
 * Envía un mensaje al canal donde se recibió el mensaje.
 * @param {Message} message - Mensaje recibido
 * @param {string} content - Mensaje de texto que responde al mensaje inicial (como mensaje)
 */
function enviarMensaje(message, content) {
  message.channel
    .send({
      content,
    })
    .catch((error) => console.error('Error al enviar el mensaje:', error));
}

/**
 * Responde a un mensaje al canal donde se recibió el mensaje.
 * @param {Message} message - Mensaje recibido
 * @param {string} content - Mensaje de texto que responde al mensaje inicial (como respuesta)
 */
function responderMensaje(message, content) {
  message.
    reply({
      content,
    })
    .catch((error) => console.error('Error al responder al mensaje:', error));
}

/**
 * Envía un mensaje a un canal específico por ID.
 * @param {string} canalID - ID del canal de Discord.
 * @param {string} content - Contenido del mensaje a enviar.
 */
function enviarMensajeCanalEspecifico(canalID, content) {
  const canal = variables.CLIENT.channels.cache.get(canalID);
  if (!canal) {
    console.error(`No se pudo encontrar el canal con ID ${canalID}`);
    return;
  }
  canal.send({ content })
    .catch((error) => console.error('Error al enviar el mensaje en el canal dicho:', error));
}

/**
 * Programa el envío de imágenes y mensajes a canales específicos a horas concretas.
 */

function programarEnvioDeImagen() {
  // Imagen de buenas noches a las 00:00
  schedule.scheduleJob('0 0 * * *', async () => {
    await enviarImagenAlCanal(
      variables.CANAL_IDs.mensajeNocturno,
      '¡Buenas noches! @here a dormir todo el mundo.',
      variables.IMAGE_PATHS.sleep);
    console.log('🌙 Imagen de buenas noches enviada a las 00:00 AM 🌙');
  });

  // Imagen de buenos días a las 7:30
  schedule.scheduleJob('30 7 * * *', async () => {
    await enviarImagenAlCanal(
      variables.CANAL_IDs.mensajeNocturno,
      '¡Buenos días! @here buena suerte en la chamba, el Señor sea contigo.',
      variables.IMAGE_PATHS.wakeUp);
    console.log('☀️ Imagen de buenos días enviada a las 07:30 AM ☀️');
  });

  // Mensaje privado a las 01:00 para usuarios conectados
  schedule.scheduleJob('0 1 * * *', async () => {
    await enviarMensajePrivadoAMiembrosConectados(
      variables.CANAL_IDs.checkOnline,
      '😴 ¿Aún despierto? 😴',
      variables.IMAGE_PATHS.lateNight);
  });
}

/**
 * Envía una imagen y mensaje a un canal específico.
 * @param {string} canalId - ID del canal de Discord.
 * @param {string} content - Contenido del mensaje.
 * @param {string} imagePath - Ruta de la imagen a enviar.
 */
async function enviarImagenAlCanal(canalId, content, imagePath) {
  const canal = variables.CLIENT.channels.cache.get(canalId);
  if (!canal) {
    console.error(`No se pudo encontrar el canal con ID ${canalId}`);
    return;
  }
  try {
    await canal.send({ content, files: [imagePath] });
  } catch (error) {
    console.error('Error al enviar la imagen programada:', error);
  }
}

/**
 * Envía un mensaje privado con imagen a los miembros conectados de un canal de voz.
 * @param {string} canalId - ID del canal de voz.
 * @param {string} content - Contenido del mensaje.
 * @param {string} imagePath - Ruta de la imagen a enviar.
 */
async function enviarMensajePrivadoAMiembrosConectados(canalId, content, imagePath) {
  const canal = variables.CLIENT.channels.cache.get(canalId);
  if (!canal) {
    console.error('No se pudo encontrar el canal para comprobar usuarios conectados.');
    return;
  }
  try {
    const members = canal.members.filter(member => !member.roles.cache.has(variables.ROLE_IDs.toIgnore));
    const miembrosOnline = [];
    for (const member of members.values()) {
      const presencia = await obtenerPresenciaDeMiembro(canal.guild, member.id);
      if (presencia !== 'offline') {
        miembroPresencia = { member: member, presencia: presencia };
        miembrosOnline.push(miembroPresencia);
      }
    }
    if (miembrosOnline.length > 0) {
      console.log('Miembros conectados:', miembrosOnline.map(m => `${m.member.user.tag} (${m.presencia})`).join(', '));
      await Promise.all(miembrosOnline.map(async (miembroPresencia) => {
        try {
          await miembroPresencia.member.send({ content, files: [imagePath] });
          console.log(`Mensaje privado enviado a ${miembroPresencia.member.user.tag}`);
        } catch (dmError) {
          console.error(`Error al enviar mensaje privado a ${miembroPresencia.member.user.tag}:`, dmError);
        }
      }));

    } else {
      console.log('No hay miembros conectados en el canal a la 01:00 AM.');
    }
  } catch (error) {
    console.error('Error al procesar usuarios conectados:', error);
  }
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
    const presencia = miembro.presence?.status || 'offline';      // Si no tiene presencia, se considera 'offline'
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
- **no cojan dibujo**: Muestra una imagen mafiosa.
- **@Purgador chambeando por lo que veo**: Da una cura de humildad.
- **-function.on**: Activa mensajes repetitivos [**TEMPORAL** no abusen de esto que apago el bot y lo capo].
- **-function.off**: Desactiva mensajes repetitivos.
- **-contar**: Cuenta la cantidad de palabras del texto puesto a continuación del comando (en el mismo mensaje).
- **-play:**: Muestra un menú para seleccionar una playlist para reproducir en el canal de voz con la cantidad de repeticiones por canción que eligas.
- **-stop**: Detiene la reproducción de audio en el canal de voz.
- **-help**: A ver, no sé, si ya usaste -comandos para lo que se supone que hace esto... Emmm... Es -comandos "avanzado".
- **-working.on**: Activa el resgistro de chamba en el VS Code porque discord no me lo quiere detectar (solo para Bios).
- **-working.off**: Desactiva el resgistro de chamba en el VS Code porque discord no me lo quiere detectar (sigue siendo solo para Bios).
- **reaction**: Hace que el bot vuelva a quererme.
- **no reaction**: Hace que el bot y yo nos demos un tiempo (igualmente le nos seguimos amando)
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
  if (!cantidad || isNaN(cantidad) || !Number.isInteger(Number(cantidad)) || cantidad <= 0 || cantidad > 99) { // Se valida que cantidad sea un número entero positivo en rango (100 es el límite impuesto por Discord para borrar de una vez, aquí pone 99 porque borra tú mensaje de petición tambien)
    return message.reply('❌ Por favor, especifica un número válido entre 1 y 99 para borrar mensajes. ❌');
  }
  try {
    const mensajes = await message.channel.messages.fetch({ limit: cantidad + 1 });
    await message.channel.bulkDelete(mensajes, true);
    message.channel.send(`✅ Se han eliminado ${mensajes.size - 1} mensajes (sin incluir el propio comando). ✅`);
    console.log(`Se han eliminado ${mensajes.size - 1} mensaje(s) en el canal #${message.channel.name} de la mano de ${message.author.username}`, funciones.formatDate(new Date()));
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
function programarReproducciónDeAudio() {
  // Obtenemos el año actual
  const currentYear = new Date().getFullYear();
  // Calculamos el próximo año
  const nextYear = currentYear + 1;

  // Construimos las fechas usando los años calculados
  const startDate = new Date(`${currentYear}-12-08T00:00:00`); // No ponemos el clásico Z de UTC porque esto se va a ejecutar en invierno en España (UTC+1)
  const endDate = new Date(`${nextYear}-01-08T23:59:59`);      // Ya veo a los espabilados diciendo de ajustar entonces la hora y ya, esto es javascript no puede ser una solución sencilla y eficiente...

  schedule.scheduleJob(
    { start: startDate, end: endDate, rule: '*/5 * * * * *', tz: 'Europe/Madrid' },
    async () => {
      if (!variables.GLOBAL_VARIABLES.connection || variables.GLOBAL_VARIABLES.connection.state.status !== 'ready') {
        console.log('⏳ Conectando y configurando la reproducción... ⏳');
        await reproducirPlaylistEnBucle(variables.DATA_ESCTRUCTURES.cancionesNavidad, 2, variables.CANAL_IDs.ciudadVoice); // Cambia el canal de voz según sea necesario
      }
    }
  );
}

/**
 * Función general para reproducir un array de canciones en bucle.
 *
 * @param {string[]} playlist - Array de claves de canciones (se usa para obtener la ruta en variables.AUDIO_PATHS).
 * @param {number} repeticionesPorCancion - Número de veces que se reproduce una canción antes de cambiar a la siguiente.
 * @param {string} [voiceChannelId=variables.CANAL_IDs.ciudadVoice] - (Opcional) ID del canal de voz a usar.
 */
async function reproducirPlaylistEnBucle(playlist, repeticionesPorCancion, voiceChannelId = variables.CANAL_IDs.ciudadVoice) {
  const voiceChannel = variables.CLIENT.channels.cache.get(voiceChannelId);

  if (!voiceChannel || !voiceChannel.isVoiceBased()) {
    console.error("❌ No se encontró un canal de voz válido. ❌");
    return;
  }

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
      console.log("🔊 Reproductor de audio configurado. 🔊");
    }

    let currentSongIndex = 0;
    let playCount = 0;

    // Función para reproducir la canción actual del playlist
    const playAudio = () => {
      const songKey = playlist[currentSongIndex];
      // Se asume que variables.AUDIO_PATHS contiene las rutas indexadas por la key
      const resource = createAudioResource(variables.AUDIO_PATHS[songKey]);
      variables.GLOBAL_VARIABLES.player.play(resource);
    };

    // Manejo del evento Idle para reproducir en bucle
    variables.GLOBAL_VARIABLES.player.on(AudioPlayerStatus.Idle, () => {
      playCount++;

      // Opcional: mostrar mensaje cada vez que se complete un ciclo del playlist
      if (playCount % (repeticionesPorCancion * playlist.length) === 0) {
        const n = playCount / (repeticionesPorCancion * playlist.length);
        console.log(`🎵 Se han reproducido ${n} veces en total. 🎵`);
      }

      // Cambiar de canción cada 'repeticionesPorCancion' reproducciones
      if (playCount % repeticionesPorCancion === 0) {
        currentSongIndex = (currentSongIndex + 1) % playlist.length;
      }

      playAudio();
    });

    // Manejo de errores del reproductor
    variables.GLOBAL_VARIABLES.player.on('error', error => {
      console.error(`❌ Error en el reproductor de audio: ${error.message} ❌`);
    });

    // Iniciar la reproducción si el reproductor no está activo
    if (variables.GLOBAL_VARIABLES.player.state.status !== AudioPlayerStatus.Playing) {
      console.log("🎶 Reproduciendo audio en bucle... 🎶");
      playAudio();
    }
  } catch (error) {
    console.error("❌ Error al intentar conectar al canal de voz: ❌", error);
  }
}


/**
* Función para detener la reproducción del playlist en bucle.
* Se detiene el reproductor de audio y se desconecta del canal de voz.
*/
function detenerPlaylistBucle() {
  // Si existe el reproductor, detenemos la reproducción.
  if (variables.GLOBAL_VARIABLES.player) {
    variables.GLOBAL_VARIABLES.player.stop();
    console.log("🔇 Reproducción detenida en el reproductor de audio. 🔇");
  }

  // Si existe la conexión al canal de voz, procedemos a destruirla.
  if (variables.GLOBAL_VARIABLES.connection) {
    variables.GLOBAL_VARIABLES.connection.destroy();
    console.log("🔌 Desconectado del canal de voz. 🔌");
  }

  // Reinicializamos las variables globales para dejar el estado limpio.
  variables.GLOBAL_VARIABLES.player = null;
  variables.GLOBAL_VARIABLES.connection = null;
}


/**
* Función que administra la selección de la cantidad de repeticiones y la playlist,
* mostrando un mensaje interactivo con dos menús desplegables.
* 
* @param {Message} message Objeto del mensaje que disparó el comando.
*/
async function administrarPlaylist(message) {
  try {

    // Array de opciones para playlists. Puedes agregar o modificar según tus datos.
    const playlistArray = [
      { label: 'Canciones Navideñas', description: 'Canciones que se voten para estas fechas tan señaladas', value: 'cancionesNavidad' },
      { label: 'Salven Europa', description: 'Propaganda para llevarnos a Agartha', value: 'salvarEuropa' },
      { label: 'No hay aún', description: 'No hay aún', value: 'No hay aún' }
    ];

    // Crear menú desplegable para la cantidad de repeticiones (1 a 5).
    const quantitySelect = new StringSelectMenuBuilder()
      .setCustomId('select_quantity')
      .setPlaceholder('Repeticiones antes de cambiar de canción:')
      .addOptions([
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
        { label: '5', value: '5' }
      ]);

    // Crear menú desplegable para la selección de la playlist.
    const playlistSelect = new StringSelectMenuBuilder()
      .setCustomId('select_playlist')
      .setPlaceholder('Playlist a reproducir:')
      .addOptions(playlistArray);

    // Colocar cada select menu en su propia fila de acción.
    const rowQuantity = new ActionRowBuilder().addComponents(quantitySelect);
    const rowPlaylist = new ActionRowBuilder().addComponents(playlistSelect);

    // Crear un embed para informar al usuario
    const embed = new EmbedBuilder()
      .setTitle('Configurar Reproducción')
      .setDescription('Por favor, selecciona la cantidad de repeticiones y la playlist a reproducir:');

    // Enviar el mensaje al canal con el embed y los componentes.
    const sentMessage = await message.channel.send({
      embeds: [embed],
      components: [rowQuantity, rowPlaylist]
    });

    // Creamos un collector para gestionar las interacciones (solo del autor del mensaje).
    const filter = interaction => interaction.user.id === message.author.id;
    const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });

    let selectedQuantity, selectedPlaylist;

    collector.on('collect', async interaction => {
      if (interaction.customId === 'select_quantity') {
        // Convertimos la cantidad a número.
        selectedQuantity = parseInt(interaction.values[0], 10);
        await interaction.deferUpdate(); // Responder a la interacción para evitar que falle
        //await interaction.reply({ content: `Seleccionaste reproducir ${selectedQuantity} vez/veces.`, ephemeral: true });
      } else if (interaction.customId === 'select_playlist') {
        // Usamos la clave para obtener la playlist real.
        const key = interaction.values[0];
        selectedPlaylist = variables.PLAYLISTS[key];
        await interaction.deferUpdate(); // No quiero un mensaje goofy, pero tampoco quiero que falle
        //await interaction.reply({ content: `Seleccionaste la playlist: ${selectedPlaylist}.`, ephemeral: true });
      }

      // Si se han realizado ambas selecciones, llamamos a la función para reproducir.
      if (selectedQuantity && selectedPlaylist) {
        collector.stop(); // Detener el collector
        // Llamamos a la función que reproduce la playlist. Se asume que toma (cantidad, playlist).
        reproducirPlaylistEnBucle(selectedPlaylist, selectedQuantity);
        // Editamos el mensaje original para desactivar los componentes.
        await sentMessage.edit({ components: [] });
      }
    });

    collector.on('end', async () => {
      if (!selectedQuantity || !selectedPlaylist) {
        await message.channel.send('❌ No se completó la selección a tiempo. ❌');
        await sentMessage.edit({ components: [] });
      }
    });

  } catch (error) {
    console.error('Error en administrarPlaylist:', error);
    await message.channel.send('❌ Ocurrió un error al intentar administrar la playlist. ❌');
  }
}

/**
 * Da formato a una fecha para mostrarla en logs.
 * @param {Date} date - Objeto Date a formatear.
 * @returns {string} Fecha formateada como HH:mm:ss [dd/MM/yyyy].
 */
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses en JavaScript van de 0 a 11
  const year = String(date.getFullYear()); // Obtener el año
  const hours = String(date.getHours()).padStart(2, '0'); // Obtener las horas en formato 24h
  const minutes = String(date.getMinutes()).padStart(2, '0'); // Obtener los minutos
  const seconds = String(date.getSeconds()).padStart(2, '0'); // Obtener los segundos
  const fechaFormateada = `${hours}:${minutes}:${seconds} [${day}/${month}/${year}]`;
  return fechaFormateada;
}

/**
 * Cuenta los meses de desarrollo del bot, actualiza el archivo y envía un mensaje.
 */
function contadorMesesDesarrollo() {
  let numero;

  // Intentar leer el archivo
  try {
    const contenido = fs.readFileSync(variables.FILE_PATHS.mesesDesarollo, 'utf8');
    numero = parseInt(contenido, 10); // Convertir a número
    if (isNaN(numero)) throw new Error('El contenido no es un número.');
  } catch (err) {
    console.error('Error al leer el archivo:', err);
    return; // Salir de la función sin detener todo el programa MUY IMPORTANTE (y útil)
  }

  // Incrementar el número
  numero += 1;

  enviarMensajeCanalEspecifico(variables.CANAL_IDs.purga, `El bot lleva en desarrollo ${numero} meses.`);
  console.log(`El bot lleva en desarrollo ${numero} meses.`, formatDate(new Date())); // Para ver en la terminal el mensaje de desarrollo del bot

  // Escribir el nuevo valor en el archivo
  try {
    fs.writeFileSync(variables.FILE_PATHS.mesesDesarollo, numero.toString());
    console.log('Número actualizado:', numero);
  } catch (err) {
    console.error('Error al escribir en el archivo:', err);
  }
}

// Programar la ejecución de la función para el día 16 de cada mes a las 00:00 (no)
// La cadena de cron '0 0 1 * *' se interpreta como: minuto 0, hora 0, día 1, cada mes, cada día de la semana.
schedule.scheduleJob('00 13 16 * *', () => {
  contadorMesesDesarrollo();
});

/**
 * Cuenta las palabras de un texto.
 * @param {object} message - Mensaje original.
 * @returns {number} Numero palabras en el mensaje.
 */
function contarPalabras(message) {
  const texto = message.content; // Obtenemos el contenido del mensaje
  const palabras = texto.match(/\b[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+\b/g); // Captura solo palabras alfabéticas
  return palabras ? palabras.length - 1 : 0; // Retornamos la cantidad de palabras encontradas (menos la palabra del comando) (no haría falta la evalución porque nunca va a ser null palabras pero bueno, por si acaso)
}

/**
 * Activa el registro de actividad manual para Bios en Visual Studio Code.
 * Añade una entrada al HashMap de juegos activos.
 */
function activarActividadBios() {
  //Como al discord no le apetece ya detectarme cuando estoy en el puto VS Code, hago aquí aparte una entrada al Hashmap para meterme a mi mismo para que cuente el tiempo que estoy literalmente aquí que dependa de un booleano
  variables.DATA_ESCTRUCTURES.activeGames.set(variables.USER_IDs.biosID, { game: 'Visual Studio Code', startTime: Date.now(), manual: true }); //extremadamente importante marcar entrada como manual, esta flag evita que el evento maneje la entrada según su lógica
  console.log('biosbardo comenzó a jugar a Visual Studio Code', formatDate(new Date()));
}

/**
 * Desactiva el registro de actividad manual para Bios en Visual Studio Code.
 * Calcula el tiempo jugado y elimina la entrada del HashMap.
 */
function desactivarActividadBios() {
  if (variables.DATA_ESCTRUCTURES.activeGames.has(variables.USER_IDs.biosID)) {
    const { game, startTime } = variables.DATA_ESCTRUCTURES.activeGames.get(variables.USER_IDs.biosID);
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(2);
    enviarMensajeCanalEspecifico(variables.CANAL_IDs.purga, `biosbardo dejó de jugar a ${game} después de ${hours}h ${minutes}m ${seconds}s.`);
    console.log(`biosbardo dejó de jugar a ${game} después de ${hours}h ${minutes}m ${seconds}s.`, formatDate(new Date()));
    variables.DATA_ESCTRUCTURES.activeGames.delete(variables.USER_IDs.biosID);
  }
}

/**
 * Devuelve aleatoriamente el valor de uno de los atributos del objeto recibido,
 * evitando repetir el último valor devuelto.
 * @param {object} obj - Objeto del que se elegirá un atributo aleatorio.
 * @param {string} [ultimaClave] - Última clave seleccionada (opcional).
 * @returns {{valor: *, clave: string}|undefined} Objeto con el valor y la clave seleccionada, o undefined si vacío.
 */
function obtenerMensajeAleatorio(obj, ultimaClave = null) {
  const keys = Object.keys(obj);
  if (keys.length === 0) return undefined;

  // Si solo hay una clave, no hay opción de evitar repetición
  let posibles = keys;
  if (keys.length > 1 && ultimaClave && keys.includes(ultimaClave)) {
    posibles = keys.filter(k => k !== ultimaClave);
  }

  const indiceAleatorio = Math.floor(Math.random() * posibles.length);
  const claveSeleccionada = posibles[indiceAleatorio];
  return { valor: obj[claveSeleccionada], clave: claveSeleccionada };
}

/**
 * Si alguien responde a un mensaje enviado por el bot, responde con un mensaje aleatorio,
 * evitando repetir el mismo mensaje dos veces seguidas.
 * @param {Message} message - Mensaje recibido.
 * @param {string} ultimaClaveRespuestaBot - Última clave seleccionada (para evitar repetición).
 * @returns {Promise<string|null>} Devuelve la nueva clave seleccionada si responde, si no null.
 */
async function responderSiRespondenAlBot(message, ultimaClaveRespuestaBot) {
  // Verifica si el mensaje es una respuesta y el autor del mensaje original es el bot
  if (message.reference && message.reference.messageId && message.guild) {
    try {
      const originalMsg = await message.channel.messages.fetch(message.reference.messageId);
      if (originalMsg.author.id === variables.USER_IDs.botPurgador) {
        const resultado = funciones.obtenerMensajeAleatorio(variables.BOT_ANSWERS, ultimaClaveRespuestaBot);
        if (resultado) {
          await funciones.responderMensaje(message, resultado.valor);
          return resultado.clave; // Devuelve la nueva clave seleccionada
        }
      }
    } catch (error) {
      // Ignorar si no se puede obtener el mensaje original
    }
  }
  return null;
}

//Objeto con todas las funciones del archivo
const funciones = Object.freeze({
  enviarImagen,
  enviarMensaje,
  responderMensaje,
  enviarMensajeCanalEspecifico,
  programarEnvioDeImagen,
  obtenerPresenciaDeMiembro,
  mostrarComandos,
  borrarMensajes,
  gestionarMensajesRepetidos,
  esAdministrador,
  programarReproducciónDeAudio,
  reproducirPlaylistEnBucle,
  detenerPlaylistBucle,
  administrarPlaylist,
  formatDate,
  contadorMesesDesarrollo,
  contarPalabras,
  activarActividadBios,
  desactivarActividadBios,
  obtenerMensajeAleatorio,
  responderSiRespondenAlBot,
});

export default funciones;
