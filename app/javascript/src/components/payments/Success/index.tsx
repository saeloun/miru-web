import React, { useEffect, useState } from "react";

import { invoicesApi } from "apis/api";
import Loader from "common/Loader";
import { LeftArrowIcon } from "miruIcons";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "StyledComponents";

const Success = () => {
  const [invoice, setInvoice] = useState<any>({});
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { id } = useParams();
  const navigate = useNavigate();

  const fetchPaymentSuccess = async () => {
    try {
      setLoading(true);
      const res = await invoicesApi.paymentSuccess(id);

      setError("");
      setInvoice(res?.data?.invoice);
    } catch (e) {
      setError(e.response.data.error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const redirectToHomePage = () => {
    navigate("/invoices");
  };

  useEffect(() => {
    fetchPaymentSuccess();
  }, []);

  if (loading) {
    return (
      <div className="flex h-80v w-full flex-col justify-center">
        <Loader />
      </div>
    );
  }

  return (
    !error && (
      <div className="my-auto flex min-h-full flex-col pt-16 pb-12">
        <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col justify-center self-center px-4 sm:px-6 lg:px-8">
          <div className="flex flex-shrink-0 justify-center">
            <svg
              aria-hidden="true"
              className="h-16 w-auto rounded-full bg-green-200 text-green-400 shadow-sm"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                fillRule="evenodd"
              />
            </svg>
          </div>
          <div className="py-16">
            <div className="flex flex-col items-center">
              <p className="tracking-wide text-sm font-semibold uppercase text-indigo-600">{`Invoice ${invoice?.invoice_number}`}</p>
              <h1 className="tracking-tight mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl">
                Payment was successful. 🎉
              </h1>
              <p className="mt-2 text-base text-gray-500">
                We have received your payment.
              </p>
              <Button
                className="mt-8 flex items-center justify-between text-lg font-semibold"
                onClick={redirectToHomePage}
              >
                <LeftArrowIcon className="mr-1" />
                Go To Home Page
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  );
};

export default Success;
