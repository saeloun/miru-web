import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { currencyFormat } from "helpers";
import paymentsApi from "apis/payments/payments";
import StatusBadge from "components/ui/status-badge";
import { CreditCard, Calendar, CurrencyDollar, CheckCircle } from "phosphor-react";

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
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!payments.length) {
    return null;
  }

  return (
    <div className="border-t border-miru-gray-400 px-10 py-5 bg-gray-50">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-miru-dark-purple-1000 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment History
        </h3>
      </div>

      <div className="space-y-3">
        {payments.map((payment, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Payment #{payment.id}
                  </span>
                  <StatusBadge status={payment.status} />
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {payment.transactionDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CurrencyDollar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold text-gray-900">
                      {currencyFormat(invoice.currency, payment.amount)}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {payment.transactionType}
                    </span>
                  </div>
                </div>

                {payment.note && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Note:</span> {payment.note}
                  </div>
                )}
              </div>

              <Link
                to="/payments"
                className="text-sm text-miru-han-purple-600 hover:text-miru-han-purple-1000 hover:underline"
              >
                View in Payments
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Paid:</span>
          <span className="text-lg font-bold text-miru-dark-purple-1000">
            {currencyFormat(invoice.currency, invoice.amountPaid)}
          </span>
        </div>
        {invoice.amountDue > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-medium text-gray-700">
              Remaining Due:
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
