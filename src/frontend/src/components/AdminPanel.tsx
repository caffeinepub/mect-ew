import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BankTransfersPanel from "./BankTransfersPanel";
import DomainManagement from "./DomainManagement";
import MessageManagement from "./MessageManagement";
import PaymentsPanel from "./PaymentsPanel";
import SectionAnalyticsPanel from "./SectionAnalyticsPanel";

export default function AdminPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Panel de Administración</h2>
        <p className="text-muted-foreground">
          Gestiona mensajes, pagos, analíticas y el dominio personalizado
        </p>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="messages" data-ocid="admin.messages.tab">
            Mensajes
          </TabsTrigger>
          <TabsTrigger value="payments" data-ocid="admin.payments.tab">
            Pagos ICP
          </TabsTrigger>
          <TabsTrigger
            value="bank-transfers"
            data-ocid="admin.bank_transfers.tab"
          >
            Transferencias
          </TabsTrigger>
          <TabsTrigger value="analytics" data-ocid="admin.analytics.tab">
            Analíticas
          </TabsTrigger>
          <TabsTrigger value="domain" data-ocid="admin.domain.tab">
            Dominio
          </TabsTrigger>
        </TabsList>
        <TabsContent value="messages" className="mt-6">
          <MessageManagement />
        </TabsContent>
        <TabsContent value="payments" className="mt-6">
          <PaymentsPanel />
        </TabsContent>
        <TabsContent value="bank-transfers" className="mt-6">
          <BankTransfersPanel />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <SectionAnalyticsPanel />
        </TabsContent>
        <TabsContent value="domain" className="mt-6">
          <DomainManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
