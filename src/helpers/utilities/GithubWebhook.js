const express = require('express');
const app = express();
const port = 3000;
const crypto = require('crypto');
const secret = 'TU_TOKEN_SECRETO'; // Reemplaza con tu token real

// Middleware para procesar JSON
app.use(express.json());

// Ruta que actuará como webhook para GitHub
app.post('/webhook', (req, res) => {
  const payload = req.body;

  // Aquí podrías verificar la autenticidad del webhook, por ejemplo, comparando un token o validando la firma si así lo necesitas

function verifySignature(req, res, buf, encoding) {
  // Obtenemos la firma que envía GitHub en la cabecera
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    throw new Error('No se encontró la cabecera X-Hub-Signature-256.');
  }

  // Calculamos la firma HMAC utilizando el token secreto y el cuerpo crudo de la petición
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(buf);
  const digest = 'sha256=' + hmac.digest('hex');

  // Comparamos la firma calculada con la que se envió, de forma segura
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    throw new Error('Firma no válida.');
  }
}

// Integra el verificador ajustando el middleware de JSON para capturar el cuerpo en crudo
app.use(express.json({ verify: verifySignature }));

  // Formatear el payload recibido
  const formattedPayload = formatPayload(payload);

  // Aquí podrías guardar, enviar o procesar el payload formateado
  console.log('Payload formateado:', formattedPayload);

  // Responder a GitHub confirmando que hemos recibido el webhook
  res.status(200).send('Webhook recibido');
});

function formatPayload(payload) {
  // Extraer información del repositorio. Si no existe, se asigna un valor por defecto.
  const repository = payload.repository && payload.repository.full_name ? payload.repository.full_name : "Repositorio desconocido";
  
  // Extraer la acción, en un push event no suele venir un campo "action",
  // así que se puede asumir la acción "push" o algún otro valor predeterminado.
  const action = payload.action || "push";
  
  // Determinar quién realizó la acción. Se prefiere que sea el "pusher" pero si no está se toma el "sender"
  const actor = (payload.pusher && payload.pusher.name) 
                  || (payload.sender && payload.sender.login)
                  || "Acción desconocida";
  
  // Para el commit, asumiremos que se procesa el primer commit del array, ya que el webhook se dispara solo cuando hay un commit.
  const commit = (payload.commits && payload.commits.length > 0) ? payload.commits[0] : null;
  const { commitTitle, commitDescription } = getCommitInfo(commit);
  
  return {
    repository,
    action,
    actor,
    commitTitle,
    commitDescription
  };
}

function getCommitInfo(commit) {
  if (!commit || !commit.message) {
    return {
      commitTitle: "Commit desconocido",
      commitDescription: "Sin descripción"
    };
  }
  
  // Se separa el mensaje del commit por líneas.
  const lines = commit.message.split("\n");
  // La primera línea se toma como el "nombre del commit"
  const commitTitle = lines[0] || "Commit sin título";
  // Las líneas restantes se unen y se tratan como la descripción.
  const commitDescription = lines.slice(1).join("\n").trim() || "Sin descripción";
  
  return { commitTitle, commitDescription };
}

app.listen(port, () => {
  console.log(`Servidor en ejecución en http://localhost:${port}`);
});
