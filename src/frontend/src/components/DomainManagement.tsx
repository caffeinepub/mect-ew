import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useForceVerification } from "../hooks/useQueries";

type DNSStatus = "not-checked" | "checking" | "success" | "error" | "partial";

export default function DomainManagement() {
  const [customDomain, setCustomDomain] = useState("mectelliottwave.com");
  const [showDNSRecords, setShowDNSRecords] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<DNSStatus>("not-checked");
  const [verificationMessage, setVerificationMessage] = useState("");

  const forceVerificationMutation = useForceVerification();

  // Placeholder for canister ID - will be replaced with actual value during deployment
  const canisterId = "your-canister-id";
  const targetCname = "cname.caffeine.build";

  const cnameRecord = {
    type: "CNAME",
    name: "www",
    value: targetCname,
    ttl: "3600",
  };

  const txtRecord = {
    type: "TXT",
    name: "@",
    value: `icp-canister=${canisterId}`,
    ttl: "3600",
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const handleConfigureDomain = () => {
    if (!customDomain.trim()) {
      toast.error("Por favor ingresa un dominio válido");
      return;
    }
    setShowDNSRecords(true);
    setDnsStatus("not-checked");
    toast.success(
      "Configuración iniciada. Sigue las instrucciones a continuación.",
    );
  };

  const handleVerifyDNS = async () => {
    setDnsStatus("checking");
    setVerificationMessage("Verificando configuración DNS...");

    try {
      // Simulate DNS lookup - in production this would call a real DNS API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For demonstration, we'll simulate different outcomes
      // In production, this would perform actual DNS queries
      const response = await fetch(
        `https://dns.google/resolve?name=www.${customDomain}&type=CNAME`,
      );

      if (response.ok) {
        const data = await response.json();

        if (data.Answer && data.Answer.length > 0) {
          const cnameValue = data.Answer.find(
            (record: any) => record.type === 5,
          )?.data;

          if (cnameValue?.includes(targetCname)) {
            setDnsStatus("success");
            setVerificationMessage(
              `¡Perfecto! El registro CNAME está configurado correctamente y apunta a ${targetCname}`,
            );
            toast.success("Configuración DNS verificada correctamente");
          } else {
            setDnsStatus("partial");
            setVerificationMessage(
              `Se encontró un registro CNAME, pero apunta a: ${cnameValue}. Debe apuntar a ${targetCname}`,
            );
            toast.warning(
              "Registro CNAME encontrado pero con valor incorrecto",
            );
          }
        } else {
          setDnsStatus("error");
          setVerificationMessage(
            "No se encontró el registro CNAME. Asegúrate de haber guardado los cambios en GoDaddy.",
          );
          toast.error("Registro CNAME no encontrado");
        }
      } else {
        setDnsStatus("error");
        setVerificationMessage(
          "No se pudo verificar el DNS. Los cambios pueden estar propagándose aún (esto puede tardar hasta 48 horas).",
        );
        toast.info("Verificación pendiente - intenta de nuevo más tarde");
      }
    } catch (_error) {
      setDnsStatus("error");
      setVerificationMessage(
        "Error al verificar DNS. Verifica tu conexión e intenta nuevamente.",
      );
      toast.error("Error en la verificación");
    }
  };

  const handleForceVerification = async () => {
    setDnsStatus("checking");
    setVerificationMessage(
      "Forzando verificación de DNS y completando conexión...",
    );

    try {
      await forceVerificationMutation.mutateAsync();

      setDnsStatus("success");
      setVerificationMessage(
        "¡Verificación forzada completada! El dominio ha sido revalidado y la conexión está completa.",
      );
      toast.success("Verificación forzada exitosa");
    } catch (error: any) {
      console.error("Error en verificación forzada:", error);

      if ((error as any).message?.includes("already verified")) {
        setDnsStatus("success");
        setVerificationMessage(
          "El dominio ya está verificado y conectado correctamente.",
        );
        toast.info("El dominio ya está verificado");
      } else {
        setDnsStatus("error");
        setVerificationMessage(
          `Error al forzar verificación: ${error.message || "Error desconocido"}. Asegúrate de que los registros DNS estén configurados correctamente.`,
        );
        toast.error("Error en verificación forzada");
      }
    }
  };

  const getStatusIcon = () => {
    switch (dnsStatus) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "partial":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    switch (dnsStatus) {
      case "checking":
        return (
          <Badge variant="outline" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Verificando...
          </Badge>
        );
      case "success":
        return (
          <Badge
            variant="outline"
            className="gap-1 border-green-500 text-green-500"
          >
            <CheckCircle2 className="h-3 w-3" />
            Configurado
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="outline"
            className="gap-1 border-red-500 text-red-500"
          >
            <XCircle className="h-3 w-3" />
            No Configurado
          </Badge>
        );
      case "partial":
        return (
          <Badge
            variant="outline"
            className="gap-1 border-yellow-500 text-yellow-500"
          >
            <AlertTriangle className="h-3 w-3" />
            Configuración Incorrecta
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Sin Verificar
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Configurar Dominio Personalizado
          </CardTitle>
          <CardDescription>
            Conecta tu dominio personalizado de GoDaddy a tu sitio web MECT EW
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="domain">Dominio Personalizado</Label>
            <div className="flex gap-2">
              <Input
                id="domain"
                type="text"
                placeholder="ejemplo.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleConfigureDomain}>Configurar</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Ingresa el dominio que compraste en GoDaddy (sin www)
            </p>
          </div>

          {showDNSRecords && (
            <>
              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    Estado de Configuración
                  </h3>
                  {getStatusBadge()}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleVerifyDNS}
                    disabled={dnsStatus === "checking"}
                    variant="outline"
                  >
                    {dnsStatus === "checking" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      "Verificar configuración DNS"
                    )}
                  </Button>
                  <Button
                    onClick={handleForceVerification}
                    disabled={
                      forceVerificationMutation.isPending ||
                      dnsStatus === "checking"
                    }
                    variant="default"
                  >
                    {forceVerificationMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Forzando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Forzar Verificación
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {verificationMessage && (
                <Alert
                  variant={dnsStatus === "success" ? "default" : "destructive"}
                >
                  {getStatusIcon()}
                  <AlertTitle>
                    {dnsStatus === "success"
                      ? "¡Configuración Exitosa!"
                      : dnsStatus === "partial"
                        ? "Configuración Incorrecta"
                        : dnsStatus === "checking"
                          ? "Verificando..."
                          : "Verificación Fallida"}
                  </AlertTitle>
                  <AlertDescription>{verificationMessage}</AlertDescription>
                </Alert>
              )}

              <Separator />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  Instrucciones de Configuración DNS en GoDaddy
                </AlertTitle>
                <AlertDescription>
                  Sigue estos pasos cuidadosamente para configurar tu dominio
                  correctamente
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">
                    Paso 1: Accede a la Configuración DNS de GoDaddy
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      Inicia sesión en tu cuenta de{" "}
                      <a
                        href="https://www.godaddy.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        GoDaddy
                      </a>
                    </li>
                    <li>
                      Ve a <strong>"Mis Productos"</strong> en el menú principal
                    </li>
                    <li>
                      Busca tu dominio <strong>{customDomain}</strong> y haz
                      clic en el botón <strong>"DNS"</strong> o{" "}
                      <strong>"Administrar DNS"</strong>
                    </li>
                    <li>
                      Serás redirigido a la página de administración de
                      registros DNS
                    </li>
                  </ol>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-red-600">
                    Paso 2: Eliminar Registros CNAME Conflictivos (IMPORTANTE)
                  </h3>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>
                      ¡Atención! Elimina registros existentes primero
                    </AlertTitle>
                    <AlertDescription>
                      Si ya existe un registro CNAME para "www", debes
                      eliminarlo antes de crear uno nuevo para evitar
                      conflictos.
                    </AlertDescription>
                  </Alert>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      En la sección de <strong>"Registros"</strong>, busca
                      cualquier registro de tipo <strong>CNAME</strong> con el
                      nombre <strong>"www"</strong>
                    </li>
                    <li>
                      Si encuentras uno, haz clic en el icono de{" "}
                      <strong>lápiz (editar)</strong> o{" "}
                      <strong>tres puntos (más opciones)</strong> al lado del
                      registro
                    </li>
                    <li>
                      Selecciona <strong>"Eliminar"</strong> o{" "}
                      <strong>"Delete"</strong>
                    </li>
                    <li>
                      Confirma la eliminación cuando GoDaddy te lo solicite
                    </li>
                    <li>
                      Espera unos segundos para que GoDaddy procese la
                      eliminación
                    </li>
                  </ol>
                  <p className="text-sm text-muted-foreground mt-2">
                    ⚠️ <strong>Nota:</strong> Si no eliminas el registro CNAME
                    existente, no podrás agregar el nuevo y tu dominio no
                    funcionará correctamente.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-green-600">
                    Paso 3: Crear el Nuevo Registro CNAME
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      En la página de administración DNS, busca el botón{" "}
                      <strong>"Agregar"</strong> o <strong>"Add"</strong>{" "}
                      (generalmente en la parte superior)
                    </li>
                    <li>
                      Selecciona <strong>"CNAME"</strong> como tipo de registro
                    </li>
                    <li>
                      Completa los campos con los valores exactos que se
                      muestran a continuación:
                    </li>
                  </ol>

                  <Card className="bg-muted/50 border-2 border-primary/20">
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-3">
                        <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center">
                          <span className="text-sm font-semibold">Tipo:</span>
                          <code className="text-sm bg-background px-3 py-2 rounded border font-mono">
                            {cnameRecord.type}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopyToClipboard(cnameRecord.type, "Tipo")
                            }
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center">
                          <span className="text-sm font-semibold">Nombre:</span>
                          <code className="text-sm bg-background px-3 py-2 rounded border font-mono">
                            {cnameRecord.name}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopyToClipboard(cnameRecord.name, "Nombre")
                            }
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center">
                          <span className="text-sm font-semibold">
                            Valor/Destino:
                          </span>
                          <code className="text-sm bg-background px-3 py-2 rounded border font-mono break-all">
                            {cnameRecord.value}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopyToClipboard(cnameRecord.value, "Valor")
                            }
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center">
                          <span className="text-sm font-semibold">TTL:</span>
                          <code className="text-sm bg-background px-3 py-2 rounded border font-mono">
                            {cnameRecord.ttl} segundos (1 hora)
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopyToClipboard(cnameRecord.ttl, "TTL")
                            }
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <ol
                    start={4}
                    className="list-decimal list-inside space-y-2 text-sm"
                  >
                    <li>
                      Haz clic en <strong>"Guardar"</strong> o{" "}
                      <strong>"Save"</strong> para crear el registro
                    </li>
                    <li>
                      GoDaddy confirmará que el registro ha sido agregado
                      exitosamente
                    </li>
                  </ol>

                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Importante sobre el Valor del CNAME</AlertTitle>
                    <AlertDescription>
                      El valor debe ser exactamente{" "}
                      <strong>{cnameRecord.value}</strong> (sin punto final).
                      GoDaddy puede agregar automáticamente un punto al final -
                      esto es normal y correcto.
                    </AlertDescription>
                  </Alert>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">
                    Paso 4: Agregar Registro TXT (Verificación)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Este registro verifica que eres el propietario del dominio.
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      En la misma página de DNS, haz clic nuevamente en{" "}
                      <strong>"Agregar"</strong>
                    </li>
                    <li>
                      Selecciona <strong>"TXT"</strong> como tipo de registro
                    </li>
                    <li>Completa con los siguientes valores:</li>
                  </ol>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-6 space-y-3">
                      <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center">
                        <span className="text-sm font-semibold">Tipo:</span>
                        <code className="text-sm bg-background px-3 py-2 rounded border font-mono">
                          {txtRecord.type}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopyToClipboard(txtRecord.type, "Tipo")
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center">
                        <span className="text-sm font-semibold">Nombre:</span>
                        <code className="text-sm bg-background px-3 py-2 rounded border font-mono">
                          {txtRecord.name}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopyToClipboard(txtRecord.name, "Nombre")
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center">
                        <span className="text-sm font-semibold">Valor:</span>
                        <code className="text-sm bg-background px-3 py-2 rounded border font-mono break-all">
                          {txtRecord.value}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopyToClipboard(txtRecord.value, "Valor")
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center">
                        <span className="text-sm font-semibold">TTL:</span>
                        <code className="text-sm bg-background px-3 py-2 rounded border font-mono">
                          {txtRecord.ttl} segundos
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopyToClipboard(txtRecord.ttl, "TTL")
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <ol
                    start={4}
                    className="list-decimal list-inside space-y-2 text-sm"
                  >
                    <li>
                      Haz clic en <strong>"Guardar"</strong> para crear el
                      registro TXT
                    </li>
                  </ol>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">
                    Paso 5: Verificación y Propagación
                  </h3>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Tiempo de Propagación DNS</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>
                        Los cambios DNS pueden tardar entre{" "}
                        <strong>1 y 48 horas</strong> en propagarse
                        completamente por Internet.
                      </p>
                      <p>Durante este tiempo:</p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>
                          Tu dominio puede funcionar de forma intermitente
                        </li>
                        <li>
                          Algunos usuarios pueden ver el sitio mientras otros no
                        </li>
                        <li>Esto es completamente normal</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-semibold">
                      Usa los botones de verificación arriba para:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                      <li>
                        <strong>"Verificar configuración DNS"</strong>:
                        Comprobar si los registros están configurados
                        correctamente
                      </li>
                      <li>
                        <strong>"Forzar Verificación"</strong>: Revalidar
                        inmediatamente los registros DNS y completar la conexión
                        si la configuración es correcta
                      </li>
                      <li>Ver el estado de propagación en tiempo real</li>
                      <li>Detectar errores de configuración</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">
                    Solución de Problemas Comunes
                  </h3>
                  <div className="space-y-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          ❌ Error: "No se puede agregar el registro CNAME"
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p className="font-semibold mb-2">Solución:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>
                            Verifica que hayas eliminado cualquier registro
                            CNAME existente para "www"
                          </li>
                          <li>
                            Asegúrate de que no haya un registro A para "www"
                          </li>
                          <li>
                            Espera 5 minutos después de eliminar registros antes
                            de agregar nuevos
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          ⚠️ El dominio no funciona después de 24 horas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p className="font-semibold mb-2">Solución:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>
                            Usa el botón "Verificar configuración DNS" para
                            diagnosticar el problema
                          </li>
                          <li>
                            Verifica que el valor del CNAME sea exactamente:{" "}
                            <code className="bg-muted px-1 py-0.5 rounded">
                              {cnameRecord.value}
                            </code>
                          </li>
                          <li>
                            Confirma que el nombre del registro sea "www" (sin
                            comillas)
                          </li>
                          <li>
                            Revisa que no haya espacios extra en los valores
                          </li>
                          <li>
                            Usa el botón "Forzar Verificación" para completar la
                            conexión manualmente
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          🔄 El sitio funciona a veces pero no siempre
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p className="font-semibold mb-2">Solución:</p>
                        <p>
                          Esto es normal durante la propagación DNS. Espera
                          hasta 48 horas para que se estabilice completamente.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">
                    Recursos Adicionales de GoDaddy
                  </h3>
                  <div className="space-y-2">
                    <a
                      href="https://www.godaddy.com/help/add-a-cname-record-19236"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Guía oficial de GoDaddy: Cómo agregar un registro CNAME
                    </a>
                    <a
                      href="https://www.godaddy.com/help/add-a-txt-record-19232"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Guía oficial de GoDaddy: Cómo agregar un registro TXT
                    </a>
                    <a
                      href="https://www.godaddy.com/help/delete-a-dns-record-19239"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Guía oficial de GoDaddy: Cómo eliminar un registro DNS
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Técnica del Canister</CardTitle>
          <CardDescription>
            Detalles de tu aplicación en Internet Computer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Canister ID:</span>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-3 py-1 rounded font-mono">
                {canisterId}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyToClipboard(canisterId, "Canister ID")}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Destino CNAME:</span>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-3 py-1 rounded font-mono">
                {targetCname}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleCopyToClipboard(targetCname, "Destino CNAME")
                }
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
