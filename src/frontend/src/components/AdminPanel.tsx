import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DomainManagement from "./DomainManagement";
import MessageManagement from "./MessageManagement";

export default function AdminPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Panel de Administración</h2>
        <p className="text-muted-foreground">
          Gestiona todos los mensajes recibidos y configura tu dominio
          personalizado
        </p>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages">Mensajes</TabsTrigger>
          <TabsTrigger value="domain">Dominio Personalizado</TabsTrigger>
        </TabsList>
        <TabsContent value="messages" className="mt-6">
          <MessageManagement />
        </TabsContent>
        <TabsContent value="domain" className="mt-6">
          <DomainManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
