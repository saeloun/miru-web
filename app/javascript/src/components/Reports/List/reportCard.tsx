import React from "react";

import { NavLink } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import {
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  Calendar,
} from "lucide-react";

// Map URLs to lucide-react icons
const getIconForUrl = (url: string) => {
  switch (url) {
    case "time-entry":
      return Clock;
    case "outstanding-overdue-invoice":
      return FileText;
    case "revenue-by-client":
      return DollarSign;
    case "accounts-aging":
      return Calendar;
    default:
      return TrendingUp;
  }
};

const ReportCard = ({ icon, iconHover, title, description, url }) => {
  const IconComponent = getIconForUrl(url);

  return (
    <NavLink end to={`/reports/${url}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/20">
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 group-hover:from-purple-500/20 group-hover:to-blue-500/20 transition-colors">
            <IconComponent className="h-6 w-6 text-purple-600 group-hover:text-purple-700" />
          </div>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    </NavLink>
  );
};

export default ReportCard;
