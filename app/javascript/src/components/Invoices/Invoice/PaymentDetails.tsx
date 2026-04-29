import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { currencyFormat } from "helpers";
import { paymentsApi } from "apis/api";
import StatusBadge from "components/ui/status-badge";
import {
  CreditCard,
  Calendar,
  CurrencyDollar,
  CheckCircle,
} from "phosphor-react";
import { i18n } from "../../../i18n";

interface PaymentDetailsProps {
  invoice: any;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ invoice }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [invoice?.id]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsApi.get();
      const invoicePayments = response.data.payments.filter(
        (payment: any) => payment.invoiceId === invoice.id
      );
      setPayments(invoicePayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-10 py-5">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-1/4 rounded bg-muted"></div>
          <div className="h-3 w-3/4 rounded bg-muted"></div>
        </div>
      </div>
    );
  }

  if (!payments.length) {
    return null;
  }

  return (
    <div className="border-t border-border bg-muted/30 px-10 py-5">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <CreditCard className="h-5 w-5" />
          {i18n.t("payments.paymentHistory")}
        </h3>
      </div>

      <div className="space-y-3">
        {payments.map((payment, index) => (
          <div
            key={index}
            className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-foreground">
                    {i18n.t("invoices.payment", { id: payment.id })}
                  </span>
                  <StatusBadge status={payment.status} />
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {i18n.t("date")}:
                    </span>
                    <span className="font-medium text-foreground">
                      {payment.transactionDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {i18n.t("amount")}:
                    </span>
                    <span className="font-semibold text-foreground">
                      {currencyFormat(invoice.currency, payment.amount)}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground">
                      {i18n.t("type")}:
                    </span>
                    <span className="ml-2 font-medium text-foreground">
                      {payment.transactionType}
                    </span>
                  </div>
                </div>

                {payment.note && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium">{i18n.t("notes")}:</span>{" "}
                    {payment.note}
                  </div>
                )}
              </div>

              <Link
                to="/payments"
                className="text-sm text-primary hover:text-primary hover:underline"
              >
                {i18n.t("payments.payments")}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">
            {i18n.t("invoices.paid")}:
          </span>
          <span className="text-lg font-bold text-foreground">
            {currencyFormat(invoice.currency, invoice.amountPaid)}
          </span>
        </div>
        {invoice.amountDue > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-medium text-muted-foreground">
              {i18n.t("invoices.dueDate")}:
            </span>
            <span className="text-lg font-bold text-red-600">
              {currencyFormat(invoice.currency, invoice.amountDue)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDetails;
