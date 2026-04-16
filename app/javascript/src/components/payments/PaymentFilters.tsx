import React from "react";
import { X, Funnel } from "phosphor-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { DatePicker } from "../ui/date-picker";
import { Badge } from "../ui/badge";
import { i18n } from "../../i18n";

interface PaymentFiltersProps {
  filters: {
    status: string;
    client: string;
    paymentType: string;
    dateFrom: Date | null;
    dateTo: Date | null;
  };
  onFilterChange: (filters: any) => void;
  clients: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
}

const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  filters,
  onFilterChange,
  clients,
  isOpen,
  onClose,
}) => {
  const handleReset = () => {
    onFilterChange({
      status: "all",
      client: "all",
      paymentType: "all",
      dateFrom: null,
      dateTo: null,
    });
  };

  const activeFiltersCount = [
    filters.status !== "all",
    filters.client !== "all",
    filters.paymentType !== "all",
    filters.dateFrom !== null,
    filters.dateTo !== null,
  ].filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <Card className="absolute right-0 top-12 z-50 w-80 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Funnel className="h-4 w-4" />
          <h3 className="font-semibold">{i18n.t("filters")}</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Status Funnel */}
        <div className="space-y-2">
          <Label htmlFor="status">{i18n.t("status")}</Label>
          <Select
            value={filters.status}
            onValueChange={value =>
              onFilterChange({ ...filters, status: value })
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder={i18n.t("payments.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {i18n.t("payments.allStatuses")}
              </SelectItem>
              <SelectItem value="paid">{i18n.t("payments.paid")}</SelectItem>
              <SelectItem value="pending">
                {i18n.t("payments.pending")}
              </SelectItem>
              <SelectItem value="failed">
                {i18n.t("payments.failed")}
              </SelectItem>
              <SelectItem value="refunded">
                {i18n.t("payments.refunded")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Client Funnel */}
        <div className="space-y-2">
          <Label htmlFor="client">{i18n.t("client")}</Label>
          <Select
            value={filters.client}
            onValueChange={value =>
              onFilterChange({ ...filters, client: value })
            }
          >
            <SelectTrigger id="client">
              <SelectValue placeholder={i18n.t("payments.allClients")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {i18n.t("payments.allClients")}
              </SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Type Funnel */}
        <div className="space-y-2">
          <Label htmlFor="paymentType">{i18n.t("payments.paymentType")}</Label>
          <Select
            value={filters.paymentType}
            onValueChange={value =>
              onFilterChange({ ...filters, paymentType: value })
            }
          >
            <SelectTrigger id="paymentType">
              <SelectValue placeholder={i18n.t("payments.allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{i18n.t("payments.allTypes")}</SelectItem>
              <SelectItem value="credit_card">
                {i18n.t("payments.cardPayment")}
              </SelectItem>
              <SelectItem value="bank_transfer">
                {i18n.t("payments.bankTransfer")}
              </SelectItem>
              <SelectItem value="wire_transfer">
                {i18n.t("payments.wireTransfer")}
              </SelectItem>
              <SelectItem value="ach">
                {i18n.t("payments.achTransfer")}
              </SelectItem>
              <SelectItem value="paypal">
                {i18n.t("payments.paypal")}
              </SelectItem>
              <SelectItem value="stripe">
                {i18n.t("payments.stripe")}
              </SelectItem>
              <SelectItem value="cash">{i18n.t("payments.cash")}</SelectItem>
              <SelectItem value="check">{i18n.t("payments.check")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Funnel */}
        <div className="space-y-2">
          <Label>{i18n.t("dateRange")}</Label>
          <div className="flex gap-2">
            <DatePicker
              date={filters.dateFrom}
              onSelect={date => onFilterChange({ ...filters, dateFrom: date })}
              placeholder={i18n.t("from")}
            />
            <DatePicker
              date={filters.dateTo}
              onSelect={date => onFilterChange({ ...filters, dateTo: date })}
              placeholder={i18n.t("to")}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleReset}
          >
            {i18n.t("resetAction")}
          </Button>
          <Button size="sm" className="flex-1" onClick={onClose}>
            {i18n.t("apply")}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PaymentFilters;
