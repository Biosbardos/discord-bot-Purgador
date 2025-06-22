// ARCHIVO PARA TRABAJAR CON FUNCIONES ANTES DE INCORPORARLAS EN EL CÓDIGO PRINCIPAL O SIMPLEMENTE PARA MODIFICAR LAS FUNCIONES QUE YA EXISTEN SIN QUE SE VEAN AFECTADAS EN EL CÓDIGO PRINCIPAL

/**
 * const { spawn } = require('child_process');

  // Supongamos que tienes un ejecutable Java (por ejemplo, un archivo JAR)
  const javaProcess = spawn('java', ['-jar', 'miAplicacion.jar', 'dato1', 'dato2']);

  // Capturamos la salida estándar del proceso Java
  javaProcess.stdout.on('data', (data) => {
    console.log(Salida de Java: ${data})
  });

  // Capturamos la salida de error en caso de problemas
  javaProcess.stderr.on('data', (data) => {
    console.error(Error: ${data});
  });

  // Detectamos cuando el proceso termina
  javaProcess.on('close', (code) => {
    console.log(Proceso Java finalizado con código: ${code});
  });
 */



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
