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
import { PaymentStatus } from "../backend";
import type { Time } from "../backend";
import { useActor } from "../hooks/useActor";

interface BankTransferRecord {
  id: string;
  name: string;
  email: string;
  amountUsd: string;
  bankName: string;
  transferDate: string;
  referenceNote: string;
  serviceType: string;
  status: PaymentStatus;
  timestamp: Time;
  notes?: string;
}

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

export default function BankTransfersPanel() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: transfers,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<BankTransferRecord[]>({
    queryKey: ["bankTransferRecords"],
    queryFn: async () => {
      const a = actor as any;
      if (typeof a.getBankTransferRecords !== "function") {
        throw new Error("Actor not ready");
      }
      const records: BankTransferRecord[] = await a.getBankTransferRecords();
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
      await (actor as any).updateBankTransferStatus(id, status, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bankTransferRecords"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const a = actor as any;
      if (typeof a.deleteBankTransferRecord !== "function") {
        throw new Error(
          "deleteBankTransferRecord no está disponible en el actor",
        );
      }
      await a.deleteBankTransferRecord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bankTransferRecords"] });
      setDeletingId(null);
    },
    onError: () => {
      setDeletingId(null);
    },
  });

  if (isLoading || actorFetching) {
    return (
      <div
        className="text-center py-8"
        data-ocid="bank_transfers.loading_state"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">
          Cargando transferencias...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Transferencias Bancarias recibidas</h3>
          <p className="text-sm text-muted-foreground">
            Registros de transferencias bancarias con confirmación manual
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
          data-ocid="bank_transfers.refresh.button"
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>

      {isError && (
        <div
          className="border border-red-800 bg-red-950/30 p-4"
          data-ocid="bank_transfers.error_state"
        >
          <p className="text-red-400 text-sm">
            Error al cargar transferencias: {String(error)}
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
        <p className="text-sm text-destructive">
          Error al eliminar transferencia: {String(deleteMutation.error)}
        </p>
      )}

      {!isError && (!transfers || transfers.length === 0) ? (
        <p
          className="text-muted-foreground text-sm text-center py-8"
          data-ocid="bank_transfers.empty_state"
        >
          No hay transferencias registradas todavía.
        </p>
      ) : (
        <div className="space-y-3">
          {transfers?.map((t, idx) => {
            const { label, variant } = statusLabel(t.status);
            const isUpdating =
              updateMutation.isPending &&
              (updateMutation.variables as { id: string })?.id === t.id;
            const isDeleting =
              deleteMutation.isPending && deleteMutation.variables === t.id;
            return (
              <div
                key={t.id}
                className="border border-border p-4 space-y-3"
                data-ocid={`bank_transfers.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {serviceLabel(t.serviceType)}
                    </Badge>
                    <Badge variant={variant}>{label}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Monto: </span>
                    <span className="font-semibold">{t.amountUsd}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Fecha registro:{" "}
                    </span>
                    <span>
                      {new Date(
                        Number(t.timestamp) / 1_000_000,
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Banco: </span>
                    <span>{t.bankName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Fecha transferencia:{" "}
                    </span>
                    <span>{t.transferDate}</span>
                  </div>
                </div>

                {t.referenceNote && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Referencia: </span>
                    <span className="font-mono text-xs">{t.referenceNote}</span>
                  </div>
                )}

                {t.notes && (
                  <p className="text-sm text-muted-foreground">
                    Nota admin: {t.notes}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {t.status === PaymentStatus.pending && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          updateMutation.mutate({
                            id: t.id,
                            status: PaymentStatus.confirmed,
                          })
                        }
                        disabled={isUpdating || isDeleting}
                        className="gap-1 rounded-none"
                        data-ocid="bank_transfers.confirm_button"
                      >
                        <Check className="w-3 h-3" /> Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          updateMutation.mutate({
                            id: t.id,
                            status: PaymentStatus.rejected,
                          })
                        }
                        disabled={isUpdating || isDeleting}
                        className="gap-1 rounded-none"
                        data-ocid="bank_transfers.secondary_button"
                      >
                        <X className="w-3 h-3" /> Rechazar
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeletingId(t.id)}
                    disabled={isUpdating || isDeleting}
                    className="gap-1 rounded-none"
                    data-ocid="bank_transfers.delete_button"
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
        <AlertDialogContent data-ocid="bank_transfers.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar transferencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro de transferencia
              será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeletingId(null)}
              data-ocid="bank_transfers.cancel_button"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) deleteMutation.mutate(deletingId);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="bank_transfers.confirm_button"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
