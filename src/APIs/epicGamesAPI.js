import { EPIC_ACCESS_TOKEN } from '../utilities/Variables.js';

/**
 * Consulta el estado online y el juego actual de varios usuarios de Epic Games por sus Epic Account IDs.
 * @param {string[]} epicAccountIds - Array de Epic Account IDs de los usuarios.
 * @returns {Promise<Array<{epicAccountId: string, isOnline: boolean, status?: string, productName?: string}>>}
 */
export async function getEpicGamesPresences(epicAccountIds) {
  // Este endpoint es un ejemplo, debes adaptarlo a tu integración EOS real.
  const results = [];

  for (const id of epicAccountIds) {
    const url = `https://api.epicgames.dev/epic/presence/v1/${id}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${EPIC_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      results.push({
        epicAccountId: id,
        isOnline: false,
        status: 'unknown'
      });
      continue;
    }

    const data = await res.json();
    // Los campos pueden variar según la integración EOS, ejemplo:
    // status: "online", "offline", "away", "extended_away", "do_not_disturb"
    // productName: nombre del juego o aplicación si está jugando
    results.push({
      epicAccountId: id,
      isOnline: data.status === 'online',
      status: data.status,
      productName: data.productName // Puede ser undefined si no está jugando
    });
  }

  return results;
}