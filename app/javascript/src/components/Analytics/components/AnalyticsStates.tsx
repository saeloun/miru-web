import React from "react";
import { Link } from "react-router-dom";
import { WarningCircle } from "phosphor-react";

import { Paths } from "../../../constants";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";

export const AnalyticsLoading: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: rows }).map((_, index) => (
        <Card key={index} className="border-border">
          <CardHeader>
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="mt-3 h-3 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card className="border-border">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[320px] w-full" />
      </CardContent>
    </Card>
  </div>
);

export const AnalyticsErrorState: React.FC<{
  title: string;
  description: string;
  onRetry: () => void;
}> = ({ title, description, onRetry }) => (
  <Alert variant="destructive">
    <WarningCircle className="h-4 w-4" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription className="space-y-3">
      <p>{description}</p>
      <div>
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </AlertDescription>
  </Alert>
);

export const AnalyticsEmptyState: React.FC<{
  title: string;
  description: string;
  ctaLabel?: string;
  ctaPath?: string;
}> = ({
  title,
  description,
  ctaLabel = "View invoices",
  ctaPath = Paths.INVOICES.replace("/*", ""),
}) => (
  <Card className="border-border">
    <CardHeader>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardHeader>
    <CardContent>
      <Button asChild variant="outline">
        <Link to={ctaPath}>{ctaLabel}</Link>
      </Button>
    </CardContent>
  </Card>
);

export const AnalyticsRestrictedState: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => (
  <Card className="border-dashed border-border/80 bg-muted/20">
    <CardHeader>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardHeader>
  </Card>
);
