import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { PaymentServiceType } from "../backend";
import { useActor } from "../hooks/useActor";

const ICP_ACCOUNT_ID =
  "f96703871a6cfcdfc4e920014a5e21d1f27e3b067817469bd0948b9d86a48e48";

interface Props {
  serviceType: PaymentServiceType;
}

function SuccessState() {
  return (
    <div
      className="text-center space-y-2 py-4"
      data-ocid="payment.success_state"
    >
      <Check className="w-8 h-8 mx-auto text-foreground" />
      <p className="font-semibold">Pago registrado correctamente.</p>
      <p className="text-sm text-muted-foreground">
        Me pondré en contacto para confirmar.
      </p>
    </div>
  );
}

function IcpForm({ serviceType }: { serviceType: PaymentServiceType }) {
  const { actor } = useActor();
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    txnHash: "",
    amountIcp: "",
    txnDate: "",
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
    if (
      !form.name ||
      !form.email ||
      !form.txnHash ||
      !form.amountIcp ||
      !form.txnDate
    ) {
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
        form.txnDate,
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
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Los pagos pueden realizarse a través del token ICP desde cualquier
          billetera compatible (NNS, Plug, Stoic u otras) o Exchange Crypto
          (Kraken, Binance, Coinbase u otros)
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
              data-ocid="payment.icp.copy_button"
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
          <SuccessState />
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
                  data-ocid="payment.icp.name.input"
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
                  data-ocid="payment.icp.email.input"
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
                data-ocid="payment.icp.amount.input"
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
                data-ocid="payment.icp.hash.input"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="icp-date"
                className="text-xs text-muted-foreground"
              >
                Fecha de transacción
              </label>
              <Input
                id="icp-date"
                type="date"
                value={form.txnDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, txnDate: e.target.value }))
                }
                className="rounded-none"
                data-ocid="payment.icp.date.input"
              />
            </div>
            {error && (
              <p
                className="text-sm text-destructive"
                data-ocid="payment.icp.error_state"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-none"
              data-ocid="payment.icp.submit_button"
            >
              {submitting ? "Enviando..." : "Confirmar pago"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function BankTransferForm({
  serviceType,
}: { serviceType: PaymentServiceType }) {
  const { actor } = useActor();
  const [form, setForm] = useState({
    name: "",
    email: "",
    amountUsd: "",
    bankName: "",
    transferDate: "",
    referenceNote: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.name ||
      !form.email ||
      !form.amountUsd ||
      !form.bankName ||
      !form.transferDate
    ) {
      setError("Por favor completá todos los campos obligatorios.");
      return;
    }
    if (!actor) {
      setError("Error de conexión. Intentá de nuevo.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await (actor as any).submitBankTransferRecord(
        form.name,
        form.email,
        form.amountUsd,
        form.bankName,
        form.transferDate,
        form.referenceNote,
        serviceType,
      );
      setSubmitted(true);
    } catch {
      setError("Error al registrar la transferencia. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Los pagos pueden realizarse mediante transferencia bancaria. Coordiná
          los datos bancarios por privado antes de realizar la transferencia.
        </p>

        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Pasos:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Coordiná el monto y los datos bancarios por privado.</li>
            <li>Realizá la transferencia desde tu banco.</li>
            <li>
              Completá el formulario de abajo con los datos de tu transferencia.
            </li>
          </ol>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        {submitted ? (
          <SuccessState />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm font-semibold">
              Confirmar transferencia realizada
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="bank-name"
                  className="text-xs text-muted-foreground"
                >
                  Nombre
                </label>
                <Input
                  id="bank-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Tu nombre"
                  className="rounded-none"
                  data-ocid="payment.bank.name.input"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="bank-email"
                  className="text-xs text-muted-foreground"
                >
                  Email
                </label>
                <Input
                  id="bank-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="tu@email.com"
                  className="rounded-none"
                  data-ocid="payment.bank.email.input"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="bank-amount"
                className="text-xs text-muted-foreground"
              >
                Monto (USD u otra moneda)
              </label>
              <Input
                id="bank-amount"
                value={form.amountUsd}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amountUsd: e.target.value }))
                }
                placeholder="Ej: 150 USD"
                className="rounded-none"
                data-ocid="payment.bank.amount.input"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="bank-entity"
                className="text-xs text-muted-foreground"
              >
                Banco / Entidad
              </label>
              <Input
                id="bank-entity"
                value={form.bankName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bankName: e.target.value }))
                }
                placeholder="Nombre del banco o entidad"
                className="rounded-none"
                data-ocid="payment.bank.bankname.input"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="bank-date"
                className="text-xs text-muted-foreground"
              >
                Fecha de transferencia
              </label>
              <Input
                id="bank-date"
                type="date"
                value={form.transferDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, transferDate: e.target.value }))
                }
                className="rounded-none"
                data-ocid="payment.bank.date.input"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="bank-reference"
                className="text-xs text-muted-foreground"
              >
                Referencia / Nota{" "}
                <span className="text-muted-foreground/60">(opcional)</span>
              </label>
              <Input
                id="bank-reference"
                value={form.referenceNote}
                onChange={(e) =>
                  setForm((f) => ({ ...f, referenceNote: e.target.value }))
                }
                placeholder="Número de referencia o nota de la transferencia"
                className="rounded-none"
                data-ocid="payment.bank.reference.input"
              />
            </div>
            {error && (
              <p
                className="text-sm text-destructive"
                data-ocid="payment.bank.error_state"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-none"
              data-ocid="payment.bank.submit_button"
            >
              {submitting ? "Enviando..." : "Confirmar transferencia"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function PaymentWidget({ serviceType }: Props) {
  return (
    <div className="border border-border rounded-none p-6 space-y-6">
      <Tabs defaultValue="icp" data-ocid="payment.tab">
        <TabsList className="w-full rounded-none grid grid-cols-2 h-10 bg-muted">
          <TabsTrigger
            value="icp"
            className="rounded-none text-xs sm:text-sm"
            data-ocid="payment.icp.tab"
          >
            Pago con ICP
          </TabsTrigger>
          <TabsTrigger
            value="bank"
            className="rounded-none text-xs sm:text-sm"
            data-ocid="payment.bank.tab"
          >
            Transferencia Bancaria
          </TabsTrigger>
        </TabsList>
        <TabsContent value="icp" className="mt-6">
          <IcpForm serviceType={serviceType} />
        </TabsContent>
        <TabsContent value="bank" className="mt-6">
          <BankTransferForm serviceType={serviceType} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
