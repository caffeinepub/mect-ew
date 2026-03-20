import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { type PaymentRecord, PaymentStatus } from "../backend";
import { useActor } from "../hooks/useActor";

function statusLabel(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.pending:
      return { label: "Pendiente", variant: "outline" as const };
    case PaymentStatus.confirmed:
      return { label: "Confirmado", variant: "default" as const };
    case PaymentStatus.rejected:
      return { label: "Rechazado", variant: "destructive" as const };
  }
}

function serviceLabel(type: string) {
  return type === "consultoria" ? "Consultoría" : "Mentoría";
}

export default function PaymentsPanel() {
  const { actor } = useActor();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    setError("");
    try {
      const records = await actor.getPaymentRecords();
      setPayments(
        [...records].sort((a, b) => Number(b.timestamp) - Number(a.timestamp)),
      );
    } catch {
      setError("Error al cargar pagos.");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: PaymentStatus) => {
    if (!actor) return;
    setUpdating(id);
    try {
      await actor.updatePaymentStatus(id, status, null);
      await load();
    } catch {
      setError("Error al actualizar estado.");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Cargando pagos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Pagos ICP recibidos</h3>
          <p className="text-sm text-muted-foreground">
            Account ID:{" "}
            <span className="font-mono text-xs">
              f96703871a6cfcdfc4e920014a5e21d1f27e3b067817469bd0948b9d86a48e48
            </span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {payments.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          No hay pagos registrados todavía.
        </p>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const { label, variant } = statusLabel(p.status);
            return (
              <div key={p.id} className="border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {serviceLabel(p.serviceType as string)}
                    </Badge>
                    <Badge variant={variant}>{label}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Monto: </span>
                    <span className="font-semibold">{p.amountIcp} ICP</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha: </span>
                    <span>
                      {new Date(
                        Number(p.timestamp) / 1_000_000,
                      ).toLocaleDateString("es-UY", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Hash de transacción:
                  </p>
                  <code className="text-xs font-mono break-all bg-muted px-2 py-1 block">
                    {p.txnHash}
                  </code>
                </div>

                {p.notes && (
                  <p className="text-sm text-muted-foreground">
                    Nota: {p.notes}
                  </p>
                )}

                {p.status === PaymentStatus.pending && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() =>
                        updateStatus(p.id, PaymentStatus.confirmed)
                      }
                      disabled={updating === p.id}
                      className="gap-1 rounded-none"
                    >
                      <Check className="w-3 h-3" /> Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatus(p.id, PaymentStatus.rejected)}
                      disabled={updating === p.id}
                      className="gap-1 rounded-none"
                    >
                      <X className="w-3 h-3" /> Rechazar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
