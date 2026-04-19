import React from "react";
import { ChartBar } from "phosphor-react";
import { Link } from "react-router-dom";

import { Button } from "../ui/button";

type ViewInAnalyticsButtonProps = {
  to: string;
};

const ViewInAnalyticsButton: React.FC<ViewInAnalyticsButtonProps> = ({ to }) => (
  <Button asChild variant="outline">
    <Link to={to}>
      <ChartBar className="mr-2 h-4 w-4" />
      View in Analytics
    </Link>
  </Button>
);

export default ViewInAnalyticsButton;
