import React from "react";
import { WarningCircle, TrendDown, TrendUp } from "phosphor-react";

import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";

type AnalyticsInsightsProps = {
  utilizationRate?: number;
  currentRevenue?: number;
  previousRevenue?: number;
  anomalyCount?: number;
};

const AnalyticsInsights: React.FC<AnalyticsInsightsProps> = ({
  utilizationRate = 0,
  currentRevenue = 0,
  previousRevenue = 0,
  anomalyCount = 0,
}) => {
  const insights = [] as Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
  }>;

  if (utilizationRate < 60) {
    insights.push({
      title: "Utilization is below recommended level",
      description: "Team utilization is below 60% for the selected period.",
      icon: <WarningCircle className="h-4 w-4" />,
    });
  }

  if (previousRevenue > 0 && currentRevenue < previousRevenue * 0.7) {
    insights.push({
      title: "Revenue decreased significantly",
      description: "Collected revenue is below 70% of the previous period.",
      icon: <TrendDown className="h-4 w-4" />,
    });
  }

  if (anomalyCount > 0) {
    insights.push({
      title: "Expense anomalies detected",
      description: `${anomalyCount} expense anomaly${anomalyCount === 1 ? " was" : "ies were"} detected in the selected period.`,
      icon: <TrendUp className="h-4 w-4" />,
    });
  }

  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      {insights.slice(0, 3).map(insight => (
        <Alert key={insight.title}>
          {insight.icon}
          <AlertTitle>{insight.title}</AlertTitle>
          <AlertDescription>{insight.description}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default AnalyticsInsights;
