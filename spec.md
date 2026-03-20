# MECT EW

## Current State
El formulario de subida manual de videos (`ManualVideoUpload.tsx`) usa `Time.now()` del backend como timestamp, sin permitir al admin ingresar una fecha personalizada. El backend `uploadManualVideo` no acepta timestamp externo.

## Requested Changes (Diff)

### Add
- Campo de fecha y hora en el formulario de subida manual de videos (visible solo para el admin).
- Nueva función backend `uploadManualVideoWithDate` que acepta un timestamp personalizado (en nanosegundos) además de los campos existentes.

### Modify
- `ManualVideoUpload.tsx`: agregar input tipo `datetime-local` con label "Fecha original de publicación (opcional)". Si se completa, ese timestamp se envía al backend; si está vacío, se usa la fecha actual.
- El campo de fecha debe mostrar un hint explicando que sirve para restaurar la fecha original del análisis.

### Remove
- Nada.

## Implementation Plan
1. Agregar función `uploadManualVideoWithDate` en `main.mo` que acepta `customTimestamp: ?Int`.
2. Actualizar `ManualVideoUpload.tsx` para incluir el campo de fecha/hora y usarlo al llamar al backend.
