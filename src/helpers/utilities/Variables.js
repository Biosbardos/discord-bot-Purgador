// Importar módulos necesarios
const { Client, GatewayIntentBits, Partials } = require('../../libraries/node_modules/discord.js');
require ('../../libraries/node_modules/dotenv').config({path: './helpers/resources/.env'});

// ======== VARIABLES Y CONFIGURACIÓN ========

// ¡¡¡ EXTREMA IMPORTANCIA !!! CAMBIAR RUTAS SI SE CAMBIA DE DISPOSITIVO (ya sean absolutas o relativas puede dar lugar a error, más que nada por el nombre de usuario)

const TOKEN = process.env.TOKEN; // Reemplaza con tu token

const IMAGE_PATHS = Object.freeze ({
  default: process.env.default,      // Imagen predeterminada para errores
  callar: process.env.callar,        // Imagen para callar a usuarios
  avatar: process.env.avatar ,       // Imagen para el comando "avatar"
  banner: process.env.banner,        // Imagen para el comando "banner"
  pececin: process.env.pececin,      // Imagen para el comando "pececin"
  chanti: process.env.chanti,        // Imagen para el comando "chanti"
  cores: process.env.cores,          // Imagen para el comando "cores"
  esencia: process.env.esencia,      // Imagen para el comando "esencia"
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

const AUDIO_PATHS = Object.freeze ({
  navidad1: process.env.navidad1,     // Ruta al archivo audio mp3 entre 1 dic y 8 ene (futura incorporacion en un AUDIO_PATHS) // No se puede poner navideño, no reconoce eñes
  navidad2: process.env.navidad2, 
  programado: process.env.programado, // Ruta al archivo de audio esencial (no es el que está puesto)
});

const CANAL_IDs = Object.freeze ({
  purga: process.env.purga,                              // ID del canal para reaccionar mensajes // Todas las propiedades de un objeto en js son independientes no puedes declarar una variable que en su inicialización dependa de otra variable declarada en el objeto
  mensajeNocturno: process.env.purga,                    // ID del canal para mensajes programados
  checkOnline:process.env.purga,                         // ID del canal dónde comprobar quién sigue despierto a la 01:00 
  reaccion: process.env.purga,                           // ID del canal donde reaccionar
  
  mensajesRepetitivos: process.env.mensajesRepetitivos,  //ID del canal dónde petar a usuarios para que chambeen con mensajes repetitivos
  admins: process.env.admins,                            //  ID del canal de admins
  ciudadVoice: process.env.ciudadVoice,                  //  ID del canal de voz navideño
});

const ROLE_IDs = Object.freeze ({
  toIgnore: process.env.toIgnore, // ID del rol de los BOTS
});

const USER_IDs = Object.freeze ({ 
  botPurgador: process.env.botPurgador, // ID del Purgador
  coresID: process.env.coresID,         // ID del Cores
});

const REACTIONS = Object.freeze ({
  reaccionImagenGeneralNegativa: '❌',  // Reacción para imagenes de no chambear
  reaccionImagenGeneralPositiva: '✅',  // Reacción para imagenes de chambear
  reaccionImagenDormir: '😴',           // Reacción para la imagen programada
  reaccionMensajes: '🗣️',               // Reacción para mensajes de tirar mierda y criticar por chambear
  reaccionMensajesAdmins: '🥵',         // Reacción para mensajes de admins
});

const DATA_ESCTRUCTURES =  Object.freeze ({
    intervalosMinutos: [1, 5, 10],              // Intervalos disponibles en minutos
    cancionesNavidad: ['navidad1', 'navidad2'], // Canciones navideñas (ampliable)
    audioQueue: [],                             // Cola de reproducción
    userStateDM: new Map(),                     // Mapa de mensajes y cooldown (para enviar la foto y el emoji juntos) de usuarios por DM
});

const GLOBAL_VARIABLES = { // En este objeto no se aplica Object.freeze para hacer el contenido del objeto constante (inmutable) porque son variables, en todos los demás sí se aplica por tratarse de constantes.
  connection: null,        // Conexión al canal de voz // Hay que inicializar todas las propiedades de un objeto porque sino js se pone triste
  player: null,            // Reproductor de audio
  isPlaying: false,        // Indica si el bot está reproduciendo algo
  playCount: 0,            // Inicializa un contador para el mensaje de terminal de "El audio ha terminado. Reproduciendo de nuevo..."
  intervalo: null,         // Variable global para controlar el temporizador de mensajes repetitivos
  collectorActivo: false,  // Indica si el collector está activo
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
  ], 
});

//Objeto con todas las funciones del archivo //cambiar nombres
const variables = Object.freeze ({
    TOKEN,
    IMAGE_PATHS,
    AUDIO_PATHS,
    CANAL_IDs,
    ROLE_IDs,
    USER_IDs,
    REACTIONS,
    DATA_ESCTRUCTURES,
    GLOBAL_VARIABLES,
    CLIENT,
});

//Exportar el objeto funciones con todas las funciones del archivo para poder usarlas en el index.js
module.exports = variables;