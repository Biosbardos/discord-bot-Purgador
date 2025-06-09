# Custom Webhook Integration

## Descripción

Esta rama introduce la implementación de un **webhook personalizado**, diseñado para mejorar la automatización de la comunicación entre este repositorio de Github y el canal de noticias sobre este en mi servidor de Discord. Con este webhook, se facilita la recepción y el procesamiento personalizado de los payloads emitidos por Github sobre commits en tiempo real, incluyendo la autentificación de estos y el posterior envio al canal correspondiente con la aplicación principal del bot de discord. 

## Características

- **Compatibilidad**: Funciona con múltiples servicios y protocolos estándar, pese a estar pensado para su uso con Github.
- **Seguridad mejorada**: Incluye autenticación y validación de payloads.
- **Flexibilidad**: Permite la personalización del formateo del payload para enviar solo la información deseada.
- **Integración**: Completa el ciclo del proceso enviando finalmente el payload formateado correctamente al canal de destino, usando métodos propios del bot.

---

Este README proporciona una visión general del desarrollo de esta feature branch. Si tienes sugerencias o mejoras, no dudes en contribuir.

