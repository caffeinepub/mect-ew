import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, RefreshCw, Trash2, X } from "lucide-react";
import { useState } from "react";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      if (typeof (actor as any).getPaymentRecords !== "function") {
        throw new Error("Actor not ready");
      }
      const records = await actor!.getPaymentRecords();
      return [...records].sort(
        (a, b) => Number(b.timestamp) - Number(a.timestamp),
      );
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: true,
    retry: 5,
    retryDelay: 2000,
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await (actor as any).deletePaymentRecord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentRecords"] });
      setDeletingId(null);
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

      {deleteMutation.isError && (
        <p className="text-sm text-destructive">Error al eliminar pago.</p>
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
            const isDeleting =
              deleteMutation.isPending && deleteMutation.variables === p.id;
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

                <div className="flex flex-wrap gap-2 pt-1">
                  {p.status === PaymentStatus.pending && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          updateMutation.mutate({
                            id: p.id,
                            status: PaymentStatus.confirmed,
                          })
                        }
                        disabled={isUpdating || isDeleting}
                        className="gap-1 rounded-none"
                        data-ocid="payments.confirm_button"
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
                        disabled={isUpdating || isDeleting}
                        className="gap-1 rounded-none"
                        data-ocid="payments.secondary_button"
                      >
                        <X className="w-3 h-3" /> Rechazar
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeletingId(p.id)}
                    disabled={isUpdating || isDeleting}
                    className="gap-1 rounded-none"
                    data-ocid="payments.delete_button"
                  >
                    <Trash2 className="w-3 h-3" />
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
      >
        <AlertDialogContent data-ocid="payments.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro de pago será
              eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeletingId(null)}
              data-ocid="payments.cancel_button"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) deleteMutation.mutate(deletingId);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="payments.confirm_button"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
