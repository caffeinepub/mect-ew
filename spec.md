# MECT EW

## Current State

Las secciones Consultorías y Mentorías tienen un único método de pago: ICP (token de Internet Computer). El widget `IcpPaymentWidget` muestra el Account ID, instrucciones de transferencia ICP y un formulario con campos: nombre, email, monto ICP, hash de transacción. El backend almacena `PaymentRecord` con campos: id, name, email, txnHash, amountIcp, serviceType, status, timestamp, notes. El panel de administración tiene una pestaña de Pagos ICP donde se pueden ver, confirmar/rechazar y borrar pagos.

## Requested Changes (Diff)

### Add
- Nuevo tipo `BankTransferRecord` en el backend con campos: id, name, email, amountUsd, bankName, transferDate, serviceType, status, timestamp, notes
- Funciones backend: `submitBankTransferRecord`, `getBankTransferRecords`, `deleteBankTransferRecord`, `updateBankTransferStatus`
- Componente `PaymentWidget` unificado que reemplaza `IcpPaymentWidget`, con dos tabs: "Pago con ICP" y "Transferencia Bancaria"
- El tab de transferencia bancaria pide: nombre, email, monto (USD o moneda local), banco/entidad, fecha de transferencia, y un campo de notas/referencia
- El admin puede ver, confirmar/rechazar y borrar registros de transferencias bancarias en el panel admin

### Modify
- `ConsultancyPage.tsx`: reemplazar `IcpPaymentWidget` por `PaymentWidget`
- `MentoringPage.tsx`: reemplazar `IcpPaymentWidget` por `PaymentWidget`
- `AdminPanel.tsx`: agregar sub-tab o sección "Transferencias Bancarias" junto a la de Pagos ICP
- `backend.d.ts` y `declarations/backend.did.js`: agregar nuevos tipos y funciones
- `main.mo`: agregar nuevo tipo, almacenamiento estable y funciones CRUD

### Remove
- `IcpPaymentWidget.tsx` (reemplazado por `PaymentWidget.tsx`)

## Implementation Plan

1. Actualizar `main.mo` con tipo `BankTransferRecord`, stable storage y 4 nuevas funciones
2. Actualizar `backend.d.ts` con el nuevo tipo e interfaces
3. Actualizar `declarations/backend.did.js` con los nuevos IDL
4. Crear `PaymentWidget.tsx` con tabs ICP/Transferencia Bancaria, formularios idénticos en estructura
5. Actualizar `ConsultancyPage.tsx` y `MentoringPage.tsx` para usar `PaymentWidget`
6. Actualizar `AdminPanel.tsx` para gestionar transferencias bancarias
7. Validar y desplegar
