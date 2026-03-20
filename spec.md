# MECT EW

## Current State
App completa con backend Motoko, frontend React, secciones Consultorías y Mentorías, panel de administración con analíticas, gestión de videos.

## Requested Changes (Diff)

### Add
- Tipo `PaymentRecord` en backend: txnHash, amount (ICP), sender name, email, serviceType (consultoría/mentoría), status (pending/confirmed/rejected), timestamp, notes
- Función `submitPaymentRecord` (pública): permite a visitantes registrar un pago
- Función `getPaymentRecords` (solo admin): lista todos los pagos
- Función `updatePaymentStatus` (solo admin): confirmar o rechazar un pago
- Sección de pago ICP en ConsultancyPage y MentoringPage: muestra Account ID con botón copiar, instrucciones claras, formulario para que el cliente registre su txn hash
- Pestaña "Pagos ICP" en AdminPanel: lista pagos con status, nombre, email, monto, hash, fecha; botones para confirmar/rechazar
- Persistencia de pagos en stable storage

### Modify
- Backend main.mo: agregar tipos y funciones de pagos, agregar a stable storage
- ConsultancyPage.tsx: agregar sección de pago ICP debajo del contenido
- MentoringPage.tsx: agregar sección de pago ICP debajo del contenido
- AdminPanel.tsx: agregar pestaña de pagos ICP
- backend.d.ts: agregar tipos e interfaces para pagos

### Remove
- Nada

## Implementation Plan
1. Actualizar backend main.mo con PaymentRecord, submitPaymentRecord, getPaymentRecords, updatePaymentStatus
2. Actualizar backend.d.ts con nuevos tipos
3. Actualizar ConsultancyPage.tsx con widget de pago ICP
4. Crear MentoringPage.tsx con widget de pago ICP (si no existe ya)
5. Actualizar AdminPanel.tsx con pestaña de pagos
