import React from "react";
import { X, Filter } from "lucide-react";
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
          <Filter className="h-4 w-4" />
          <h3 className="font-semibold">Filters</h3>
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
        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFilterChange({ ...filters, status: value })
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Client Filter */}
        <div className="space-y-2">
          <Label htmlFor="client">Client</Label>
          <Select
            value={filters.client}
            onValueChange={(value) =>
              onFilterChange({ ...filters, client: value })
            }
          >
            <SelectTrigger id="client">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="paymentType">Payment Type</Label>
          <Select
            value={filters.paymentType}
            onValueChange={(value) =>
              onFilterChange({ ...filters, paymentType: value })
            }
          >
            <SelectTrigger id="paymentType">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="credit_card">Card Payment</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
              <SelectItem value="ach">ACH Transfer</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="check">Check</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex gap-2">
            <DatePicker
              date={filters.dateFrom}
              onDateChange={(date) =>
                onFilterChange({ ...filters, dateFrom: date })
              }
              placeholder="From"
            />
            <DatePicker
              date={filters.dateTo}
              onDateChange={(date) =>
                onFilterChange({ ...filters, dateTo: date })
              }
              placeholder="To"
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
            Reset
          </Button>
          <Button size="sm" className="flex-1" onClick={onClose}>
            Apply
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PaymentFilters;