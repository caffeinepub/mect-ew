import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { FormType } from "../backend";
import { useSubmitContactForm } from "../hooks/useQueries";

interface ContactFormProps {
  formType: FormType;
}

export default function ContactForm({ formType }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submitMutation = useSubmitContactForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Por favor ingresa un email válido");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        form: {
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        },
        formType,
      });

      toast.success("Mensaje enviado exitosamente");
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error al enviar el mensaje. Por favor intenta nuevamente.");
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`name-${formType}`}>Nombre</Label>
              <Input
                id={`name-${formType}`}
                placeholder="Tu nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitMutation.isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`email-${formType}`}>Email</Label>
              <Input
                id={`email-${formType}`}
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitMutation.isPending}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`message-${formType}`}>Mensaje</Label>
            <Textarea
              id={`message-${formType}`}
              placeholder="Cuéntame sobre tu consulta..."
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={submitMutation.isPending}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar Mensaje
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
