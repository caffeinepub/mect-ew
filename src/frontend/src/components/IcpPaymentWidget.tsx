import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { PaymentServiceType } from "../backend";
import { useActor } from "../hooks/useActor";

const ICP_ACCOUNT_ID =
  "f96703871a6cfcdfc4e920014a5e21d1f27e3b067817469bd0948b9d86a48e48";

interface Props {
  serviceType: PaymentServiceType;
}

export default function IcpPaymentWidget({ serviceType }: Props) {
  const { actor } = useActor();
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    txnHash: "",
    amountIcp: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(ICP_ACCOUNT_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.txnHash || !form.amountIcp) {
      setError("Por favor completá todos los campos.");
      return;
    }
    if (!actor) {
      setError("Error de conexión. Intentá de nuevo.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await actor.submitPaymentRecord(
        form.name,
        form.email,
        form.txnHash,
        form.amountIcp,
        serviceType,
      );
      setSubmitted(true);
    } catch {
      setError("Error al registrar el pago. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-border rounded-none p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Pago con ICP</h3>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Los pagos se realizan a través del token ICP desde cualquier billetera
          compatible: NNS, Plug, Stoic u otras.
        </p>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Account ID de destino
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-none border border-border break-all font-mono">
              {ICP_ACCOUNT_ID}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Pasos:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Coordiná el monto y servicio por privado.</li>
            <li>Realizá la transferencia ICP al Account ID indicado.</li>
            <li>
              Completá el formulario de abajo con el hash de tu transacción.
            </li>
          </ol>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        {submitted ? (
          <div className="text-center space-y-2 py-4">
            <Check className="w-8 h-8 mx-auto text-foreground" />
            <p className="font-semibold">Pago registrado correctamente.</p>
            <p className="text-sm text-muted-foreground">
              Me pondré en contacto para confirmar la transacción.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm font-semibold">Confirmar pago realizado</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="icp-name"
                  className="text-xs text-muted-foreground"
                >
                  Nombre
                </label>
                <Input
                  id="icp-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Tu nombre"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="icp-email"
                  className="text-xs text-muted-foreground"
                >
                  Email
                </label>
                <Input
                  id="icp-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="tu@email.com"
                  className="rounded-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="icp-amount"
                className="text-xs text-muted-foreground"
              >
                Monto enviado (ICP)
              </label>
              <Input
                id="icp-amount"
                value={form.amountIcp}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amountIcp: e.target.value }))
                }
                placeholder="Ej: 5.5"
                className="rounded-none"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="icp-hash"
                className="text-xs text-muted-foreground"
              >
                Hash / ID de transacción
              </label>
              <Input
                id="icp-hash"
                value={form.txnHash}
                onChange={(e) =>
                  setForm((f) => ({ ...f, txnHash: e.target.value }))
                }
                placeholder="Hash de la transacción ICP"
                className="rounded-none font-mono text-xs"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-none"
            >
              {submitting ? "Enviando..." : "Confirmar pago"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
