import React, { useEffect, useState } from "react";

import { useSearchParams } from "react-router-dom";

import clientApi from "apis/clients";
import Loader from "common/Loader/index";
import Pagination from "common/Pagination/Pagination";

import Header from "./Header";
import List from "./List";

const ClientInvoices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [pagy, setPagy] = useState<any>(null);
  const [params, setParams] = useState<any>({
    invoices_per_page: searchParams.get("invoices_per_page") || 20,
    page: searchParams.get("page") || 1,
    query: searchParams.get("query") || "",
  });
  const [invoices, setInvoices] = useState<any>([]);

  const queryParams = () => new URLSearchParams(params).toString();

  useEffect(() => {
    fetchInvoices();
    setSearchParams(cleanParams(params));
  }, [params.invoices_per_page, params.page, params.query]);

  const cleanParams = (params: any) => {
    const newParams = { ...params };
    for (const key in newParams) {
      if (!newParams[key]) {
        delete newParams[key];
      }
    }

    return newParams;
  };

  const fetchInvoices = async () => {
    try {
      const {
        data: { invoices, pagy },
      } = await clientApi.invoices(queryParams());
      setInvoices(invoices);
      setPagy(pagy);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-80v w-full flex-col justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-0" id="invoice-list-page">
      <Header
        params={params}
        setParams={setParams}
        showSearch={invoices.length}
      />
      <List invoices={invoices} />
      {invoices.length > 0 && (
        <Pagination
          pagy={pagy}
          params={params}
          setParams={setParams}
          title="invoices/page"
        />
      )}
    </div>
  );
};

export default ClientInvoices;
