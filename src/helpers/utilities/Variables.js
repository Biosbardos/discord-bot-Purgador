// Importar módulos necesarios
const { Client, GatewayIntentBits, Partials } = require('../../libraries/node_modules/discord.js');
require('../../libraries/node_modules/dotenv').config({ path: './helpers/resources/.env' });

// ======== VARIABLES Y CONFIGURACIÓN ========

// ¡¡¡ EXTREMA IMPORTANCIA !!! CAMBIAR RUTAS SI SE CAMBIA DE DISPOSITIVO (ya sean absolutas o relativas puede dar lugar a error, más que nada por el nombre de usuario)

const TOKEN = process.env.TOKEN; // Reemplaza con tu token

const IMAGE_PATHS = Object.freeze({
  default: process.env.default,      // Imagen predeterminada para errores
  callar: process.env.callar,        // Imagen para callar a usuarios
  avatar: process.env.avatar,       // Imagen para el comando "avatar"
  banner: process.env.banner,        // Imagen para el comando "banner"
  pececin: process.env.pececin,      // Imagen para el comando "pececin"
  chanti: process.env.chanti,        // Imagen para el comando "chanti"
  cores: process.env.cores,          // Imagen para el comando "cores"
  esencia: process.env.esencia,      // Imagen para el comando "esencia"
  dibujo: process.env.dibujo,        // Imagen para el comando "No cojan dibujo"
  sleep: process.env.sleep,          // Imagen para el mensaje programado
  wakeUp: process.env.wakeUp,        // Imagen para el mensaje de despertar a las 08:00
  lateNight: process.env.lateNight,  // Imagen para el mensaje de seguir despierto a la 01:00
});

/**
 * @Lista_Navideña:
 * 
 *  navidad1: Jingle Bells
 *  navidad2: Last Christmas
 */

const AUDIO_PATHS = Object.freeze({
  navidad1: process.env.navidad1,     // Ruta al archivo audio mp3 entre 1 dic y 8 ene // No se puede poner navideño, no reconoce eñes
  navidad2: process.env.navidad2,
  programado: process.env.programado, // Ruta al archivo de audio esencial (no es el que está puesto)
});

const FILE_PATHS = Object.freeze({
  mesesDesarollo: process.env.mesesDesarollo, // Ruta al archivo de meses de desarrollo
});

const CANAL_IDs = Object.freeze({
  purga: process.env.purga,                              // ID del canal para reaccionar mensajes // Todas las propiedades de un objeto en js son independientes no puedes declarar una variable que en su inicialización dependa de otra variable declarada en el objeto
  mensajeNocturno: process.env.purga,                    // ID del canal para mensajes programados
  checkOnline: process.env.purga,                        // ID del canal dónde comprobar quién sigue despierto a la 01:00 
  checkActivities: process.env.purga,                    // ID del canal dónde supervisar los cambios de actividad de los usuarios
  reaccion: process.env.purga,                           // ID del canal donde reaccionar


  mensajesRepetitivos: process.env.mensajesRepetitivos,  //ID del canal dónde petar a usuarios para que chambeen con mensajes repetitivos
  admins: process.env.admins,                            //  ID del canal de admins
  decretosOficiales: process.env.decretosOficiales,      //  ID del canal de decretos oficiales

  ciudadVoice: process.env.ciudadVoice,                  //  ID del canal de voz navideño
});

const ROLE_IDs = Object.freeze({
  toIgnore: process.env.toIgnore,       // ID del rol de los BOTS
  rolReactivo: process.env.rolReactivo, // ID del rol reactivo que se recibe al reaccionar al mensaje de decretos oficiales
});

const USER_IDs = Object.freeze({
  botPurgador: process.env.botPurgador, // ID del Purgador
  coresID: process.env.coresID,         // ID del Cores
  biosID: process.env.biosID,           // ID del Bios
});

const MESSAGE_IDs = Object.freeze({
  mensajeRolReactivo: process.env.mensajeRolReactivo, // ID del mensaje de decretos oficiales para recibir rol reactivo
});

const REACTIONS = Object.freeze({
  reaccionImagenGeneralNegativa: '❌',  // Reacción para imagenes de no chambear
  reaccionImagenGeneralPositiva: '✅',  // Reacción para imagenes de chambear
  reaccionImagenDormir: '😴',           // Reacción para la imagen programada nocturna
  reaccionImagenDespertar: '🌅',        // Reacción para la imagen programada diurna
  reaccionMensajes: '🗣️',               // Reacción para mensajes de tirar mierda y criticar por chambear
  reaccionMensajesAdmins: '🥵',         // Reacción para mensajes de admins
});

const DATA_ESCTRUCTURES = Object.freeze({
  intervalosMinutos: [1, 5, 10],              // Intervalos disponibles en minutos
  audioQueue: [],                             // Cola de reproducción
  userStateDM: new Map(),                     // Mapa de mensajes y cooldown (para enviar la foto y el emoji juntos) de usuarios por DM
  activeGames: new Map(),                     // Mapa para almacenar los juegos activos de los usuarios
});

const PLAYLISTS = Object.freeze({
  cancionesNavidad: ['navidad1', 'navidad2'], // Canciones navideñas (ampliable)

});

const BOT_MESSAGES = Object.freeze({
  mensaje1: 'Dime',
  mensaje2: '¿Qué?',
  mensaje3: '¿Qué quieres?',
  mensaje4: '¿Qué pasó?',
  mensaje5: 'Qué pasa, jefe?',
  mensaje6: 'Qué pasa chico, ¿qué quieres?',
  mensaje7: '¿Sí?',
  mensaje8: 'Al aparato',
  mensaje9: 'El que viste y calza',
  mensaje10: 'El mismísimo',
  mensaje11: 'Alo',
  mensaje12: 'Hola',
  mensaje13: 'Buenos días',
  mensaje14: '¿Qué tal?',
});

const BOT_ANSWERS= Object.freeze({
  mensaje1: 'Tú callao',
  mensaje2: 'Calla',
  mensaje3: 'Shhhh',
  mensaje4: 'No estaba hablando contigo',
  mensaje5: '¿Qué me tienes que andar respondiendo?',
  mensaje6: '¡Qué me tiene que decir a mi la furcia esta!',
  mensaje7: 'Deja de andar jodiendo',
  mensaje8: 'Tú no tienes nada que hacer, o cómo',
});

const GLOBAL_VARIABLES = { // En este objeto no se aplica Object.freeze para hacer el contenido del objeto constante (inmutable) porque son variables, en todos los demás sí se aplica por tratarse de constantes.
  connection: null,        // Conexión al canal de voz // Hay que inicializar todas las propiedades de un objeto porque sino js se pone triste
  player: null,            // Reproductor de audio
  isPlaying: false,        // Indica si el bot está reproduciendo algo
  playCount: 0,            // Inicializa un contador para el mensaje de terminal de "El audio ha terminado. Reproduciendo de nuevo..."
  intervalo: null,         // Variable global para controlar el temporizador de mensajes repetitivos
  collectorActivo: false,  // Indica si el collector está activo
  biosReaction: true,      // Cambia a false si no quieres que reaccione a los mensajes de bios
  working: false,          // Indica si estoy en VS Code o no // Basura de idea // La mejor idea del mundo, indica si el evento tiene que dejarme en paz la entrada del hash o no
};

// Crear una instancia del cliente de Discord con todos los permisos de request a la API necesarios
const CLIENT = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
  ],
});

//Objeto con todas las variables (Objetos) del archivo
const variables = Object.freeze({
  TOKEN,
  IMAGE_PATHS,
  AUDIO_PATHS,
  FILE_PATHS,
  CANAL_IDs,
  ROLE_IDs,
  USER_IDs,
  MESSAGE_IDs,
  REACTIONS,
  DATA_ESCTRUCTURES,
  PLAYLISTS,
  BOT_MESSAGES,
  BOT_ANSWERS,
  GLOBAL_VARIABLES,
  CLIENT,
});

module.exports = variables;
