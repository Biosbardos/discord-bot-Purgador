import { STEAM_API_KEY } from '../utilities/Variables.js';

/**
 * Consulta el estado online y el juego actual de varios usuarios de Steam por sus SteamID64.
 * @param {string[]} steamIds - Array de SteamID64 de los usuarios.
 * @returns {Promise<Array<{steamId: string, isPlaying: boolean, gameExtraInfo?: string}>>}
 */
export async function getSteamPresences(steamIds) {
  const ids = steamIds.join(',');
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${ids}`;
  const res = await fetch(url);
  const data = await res.json();
   // personaState: 0=offline, 1=online, 2=busy, 3=away, 4=snooze, 5=looking to trade, 6=looking to play
  return data.response.players.map(player => ({
    steamId: player.steamid,
    isPlaying: !!player.gameextrainfo,
    gameExtraInfo: player.gameextrainfo
  }));
}