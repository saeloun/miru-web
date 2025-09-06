import React, { useEffect, useState } from "react";

import { clientApi } from "apis/api";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import { useSearchParams } from "react-router-dom";
import { Pagination } from "StyledComponents";

import Header from "./Header";
import List from "./List";

const ClientInvoices = () => {
  const { isDesktop } = useUserContext();
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

  const handlePageChange = page => {
    if (page == "...") return;

    return setParams({ ...params, page });
  };

  const handleClickOnPerPage = e => {
    setParams({
      page: 1,
      invoices_per_page: Number(e.target.value),
    });
  };

  if (loading) {
    return <Loader />;
  }

  const InvoicesLayout = () => (
    <div className="h-full p-4 lg:p-0" id="invoice-list-page">
      <Header
        params={params}
        setParams={setParams}
        showSearch={invoices.length}
      />
      <List invoices={invoices} />
      {invoices.length > 0 && (
        <Pagination
          isPerPageVisible
          currentPage={pagy?.page}
          handleClick={handlePageChange}
          handleClickOnPerPage={handleClickOnPerPage}
          isFirstPage={pagy?.first}
          isLastPage={pagy?.last}
          itemsPerPage={pagy?.items}
          nextPage={pagy?.next}
          prevPage={pagy?.prev}
          title="invoices/page"
          totalPages={pagy?.pages}
        />
      )}
    </div>
  );

  const Main = withLayout(InvoicesLayout, !isDesktop, !isDesktop);

  return isDesktop ? InvoicesLayout() : <Main />;
};

export default ClientInvoices;
