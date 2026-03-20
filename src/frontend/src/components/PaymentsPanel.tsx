import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, RefreshCw, X } from "lucide-react";
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
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const {
    data: payments,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<PaymentRecord[]>({
    queryKey: ["paymentRecords"],
    queryFn: async () => {
      const records = await actor!.getPaymentRecords();
      return [...records].sort(
        (a, b) => Number(b.timestamp) - Number(a.timestamp),
      );
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: true,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: PaymentStatus;
    }) => {
      await actor!.updatePaymentStatus(id, status, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentRecords"] });
    },
  });

  if (isLoading || actorFetching) {
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>

      {isError && (
        <div className="border border-red-800 bg-red-950/30 p-4">
          <p className="text-red-400 text-sm">
            Error al cargar pagos: {String(error)}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-xs text-red-400 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {updateMutation.isError && (
        <p className="text-sm text-destructive">Error al actualizar estado.</p>
      )}

      {!isError && (!payments || payments.length === 0) ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          No hay pagos registrados todavía.
        </p>
      ) : (
        <div className="space-y-3">
          {payments?.map((p) => {
            const { label, variant } = statusLabel(p.status);
            const isUpdating =
              updateMutation.isPending &&
              (updateMutation.variables as { id: string })?.id === p.id;
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
                        updateMutation.mutate({
                          id: p.id,
                          status: PaymentStatus.confirmed,
                        })
                      }
                      disabled={isUpdating}
                      className="gap-1 rounded-none"
                    >
                      <Check className="w-3 h-3" /> Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        updateMutation.mutate({
                          id: p.id,
                          status: PaymentStatus.rejected,
                        })
                      }
                      disabled={isUpdating}
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
