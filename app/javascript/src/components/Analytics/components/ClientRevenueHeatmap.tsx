import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";

type HeatmapClient = {
  client_id: number;
  client_name: string;
  monthly_trend: Array<{ label: string; revenue: number }>;
};

type ClientRevenueHeatmapProps = {
  clients: HeatmapClient[];
  isMobile?: boolean;
};

const ClientRevenueHeatmap: React.FC<ClientRevenueHeatmapProps> = ({
  clients,
  isMobile = false,
}) => {
  const visibleClients = clients.slice(0, isMobile ? 5 : 8).map(client => ({
    ...client,
    monthly_trend: client.monthly_trend.slice(isMobile ? -6 : 0),
  }));

  const monthLabels =
    visibleClients[0]?.monthly_trend.map(({ label }) => label) || [];

  const maxRevenue = Math.max(
    0,
    ...visibleClients.flatMap(client =>
      client.monthly_trend.map(point => point.revenue || 0)
    )
  );

  if (visibleClients.length === 0) return null;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Client revenue heatmap</CardTitle>
        <CardDescription>
          Revenue intensity by client and month.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div
          className="grid min-w-max gap-2"
          style={{
            gridTemplateColumns: `180px repeat(${monthLabels.length}, minmax(56px, 1fr))`,
          }}
        >
          <div />
          {monthLabels.map(label => (
            <div
              key={label}
              className="text-center text-xs font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}

          {visibleClients.map(client => (
            <React.Fragment key={client.client_id}>
              <div className="pr-2 text-sm font-medium text-foreground">
                {client.client_name}
              </div>

              {client.monthly_trend.map(month => {
                const intensity =
                  maxRevenue > 0 ? month.revenue / maxRevenue : 0;

                const backgroundColor = `rgba(37, 99, 235, ${Math.max(
                  0.1,
                  intensity
                )})`;

                return (
                  <div
                    key={`${client.client_id}-${month.label}`}
                    className="flex h-9 min-w-[56px] items-center justify-center rounded-md text-xs font-medium"
                    style={{
                      backgroundColor,
                      color: intensity > 0.55 ? "white" : "#111827",
                    }}
                    title={`${client.client_name} · ${month.label}: ${month.revenue}`}
                  >
                    {month.revenue > 0 ? Math.round(month.revenue) : "-"}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientRevenueHeatmap;
