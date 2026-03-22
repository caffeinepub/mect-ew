# MECT EW

## Current State
El panel de Pagos ICP permite ver, confirmar y rechazar pagos. No existe opción para eliminar un registro de pago manualmente.

## Requested Changes (Diff)

### Add
- Función `deletePaymentRecord(id: Text)` en el backend (solo admin)
- Botón "Eliminar" en cada registro de pago en el PaymentsPanel
- Diálogo de confirmación antes de borrar

### Modify
- `PaymentsPanel.tsx`: agregar botón de eliminar con confirmación
- `main.mo`: agregar función deletePaymentRecord

### Remove
Nada

## Implementation Plan
1. Agregar `deletePaymentRecord` en backend main.mo
2. Actualizar PaymentsPanel.tsx con botón eliminar y confirmación
