# MECT EW

## Current State
Las visitas por sección se registran en el hook `useSectionTracker`, pero la lógica actual solo graba la visita en el cleanup del useEffect (al salir de la página). Si el usuario cierra el navegador, navega a una URL externa, o llega desde otro servidor, el evento de salida nunca se dispara y la visita no se guarda.

## Requested Changes (Diff)

### Add
- Registro de visitas en el momento de **entrada** (después de 4 segundos de permanencia), no de salida
- Listener de `visibilitychange` para capturar visitas cuando el usuario cambia de pestaña o cierra el navegador
- API de geolocalización con fallback (ipapi.co → api.country.is)

### Modify
- `useSectionTracker.ts`: lógica reescrita para registrar al entrar en lugar de al salir

### Remove
- Lógica de registro en cleanup del useEffect (causaba pérdida de visitas)

## Implementation Plan
1. Reescribir `useSectionTracker` con timer de entrada (4 segundos)
2. Agregar listener `visibilitychange` como respaldo
3. Agregar API de geolocalización secundaria como fallback
