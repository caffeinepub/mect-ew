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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  Mail,
  Reply,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FormType, type StoredMessage } from "../backend";
import {
  useDeleteMessage,
  useGetAllMessages,
  useReplyToMessage,
} from "../hooks/useQueries";

const formTypeLabels = {
  [FormType.consultoria]: "Consultoría",
  [FormType.mentoria]: "Mentoría",
  [FormType.contacto]: "Contacto",
};

export default function MessageManagement() {
  const { data: allMessages = [], isLoading } = useGetAllMessages();
  const replyMutation = useReplyToMessage();
  const deleteMutation = useDeleteMessage();

  const [selectedMessage, setSelectedMessage] = useState<StoredMessage | null>(
    null,
  );
  const [replyText, setReplyText] = useState("");
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<StoredMessage | null>(
    null,
  );
  const [filterFormType, setFilterFormType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReply = (message: StoredMessage) => {
    setSelectedMessage(message);
    setReplyText(message.reply || "");
    setShowReplyDialog(true);
  };

  const submitReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      toast.error("Por favor ingresa una respuesta");
      return;
    }

    try {
      await replyMutation.mutateAsync({
        messageId: selectedMessage.id,
        replyContent: replyText.trim(),
      });
      toast.success("Respuesta enviada exitosamente");
      setShowReplyDialog(false);
      setSelectedMessage(null);
      setReplyText("");
    } catch (error) {
      console.error("Error replying to message:", error);
      toast.error("Error al enviar la respuesta");
    }
  };

  const handleDelete = (message: StoredMessage) => {
    setMessageToDelete(message);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;

    try {
      await deleteMutation.mutateAsync(messageToDelete.id);
      toast.success("Mensaje eliminado exitosamente");
      setShowDeleteDialog(false);
      setMessageToDelete(null);
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Error al eliminar el mensaje");
    }
  };

  const filteredMessages = allMessages.filter((message) => {
    const matchesFormType =
      filterFormType === "all" || message.formType === filterFormType;
    const matchesStatus =
      filterStatus === "all" || message.status === filterStatus;
    return matchesFormType && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Cargando mensajes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Gestión de Mensajes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select
                  value={filterFormType}
                  onValueChange={setFilterFormType}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Tipo de formulario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los formularios</SelectItem>
                    <SelectItem value={FormType.consultoria}>
                      Consultoría
                    </SelectItem>
                    <SelectItem value={FormType.mentoria}>Mentoría</SelectItem>
                    <SelectItem value={FormType.contacto}>Contacto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="replied">Respondidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredMessages.length === 0 ? (
            <div className="py-12 text-center">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {allMessages.length === 0
                  ? "No hay mensajes recibidos"
                  : "No se encontraron mensajes con los filtros aplicados"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {filteredMessages.length} mensaje
                {filteredMessages.length !== 1 ? "s" : ""} encontrado
                {filteredMessages.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className="p-4 bg-muted/50 rounded-lg border border-border space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{message.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {formTypeLabels[message.formType]}
                          </Badge>
                          <Badge
                            variant={
                              message.status === "replied"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {message.status === "replied" ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Respondido
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Pendiente
                              </>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {message.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(message.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReply(message)}
                        >
                          <Reply className="w-4 h-4 mr-2" />
                          Responder
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(message)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                      {message.reply && (
                        <div className="mt-3 p-3 bg-primary/10 rounded border-l-4 border-primary">
                          <p className="text-xs font-semibold text-primary mb-1">
                            Tu respuesta:
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {message.reply}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder Mensaje</DialogTitle>
            <DialogDescription>
              Respondiendo a {selectedMessage?.name} ({selectedMessage?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">Mensaje original:</p>
              <p className="text-sm whitespace-pre-wrap">
                {selectedMessage?.content}
              </p>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="reply-textarea-mm"
                className="text-sm font-medium"
              >
                Tu respuesta:
              </label>
              <Textarea
                id="reply-textarea-mm"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                rows={6}
                disabled={replyMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReplyDialog(false)}
              disabled={replyMutation.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={submitReply} disabled={replyMutation.isPending}>
              {replyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Reply className="w-4 h-4 mr-2" />
                  Enviar Respuesta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar el mensaje de{" "}
              {messageToDelete?.name}? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
