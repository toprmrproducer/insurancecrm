import { AppShell } from "@/components/app-shell";
import { OrdersPanel } from "@/components/orders-panel";
import { SectionCard } from "@/components/ui";
import { getLeadsPageData, getOrdersPageData } from "@/lib/live-data";

export default async function OrdersPage() {
  const [orders, leads] = await Promise.all([getOrdersPageData(), getLeadsPageData()]);

  return (
    <AppShell
      title="Orders"
      description="Track policy orders, move status through your pipeline, and update fulfillment notes in real time."
    >
      <SectionCard title="Order pipeline" meta="Recent orders and status controls">
        <OrdersPanel
          orders={orders}
          leads={leads.map((lead) => ({
            id: lead.id,
            name: lead.name,
          }))}
        />
      </SectionCard>
    </AppShell>
  );
}
