import React, { useCallback, useEffect, useState } from "react";

import { clientApi } from "apis/api";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import { useSearchParams } from "react-router-dom";
import { i18n } from "../../i18n";
import useInfiniteLoadTrigger from "../../hooks/useInfiniteLoadTrigger";

import Header from "./Header";
import List from "./List";

const ClientInvoices = () => {
  const { isDesktop } = useUserContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<any>({
    invoices_per_page: searchParams.get("invoices_per_page") || 20,
    query: searchParams.get("query") || "",
  });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [hasMoreInvoices, setHasMoreInvoices] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const buildQueryParams = (page = 1) =>
    new URLSearchParams({
      invoices_per_page: String(params.invoices_per_page),
      page: String(page),
      ...(params.query ? { query: params.query } : {}),
    }).toString();

  useEffect(() => {
    fetchInvoices();
    setSearchParams(cleanParams(params));
  }, [params.invoices_per_page, params.query]);

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
      } = await clientApi.invoices(buildQueryParams(1));
      setInvoices(invoices);
      setCurrentPage(pagy?.page || 1);
      setTotalInvoices(pagy?.count || invoices.length);
      setHasMoreInvoices(Boolean(pagy?.next));
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const loadMoreInvoices = useCallback(async () => {
    if (isLoadingMore || !hasMoreInvoices) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const {
        data: { invoices: nextInvoices, pagy },
      } = await clientApi.invoices(buildQueryParams(nextPage));

      setInvoices(previousInvoices => [
        ...previousInvoices,
        ...nextInvoices.filter(
          invoice =>
            !previousInvoices.some(
              existingInvoice => existingInvoice.id === invoice.id
            )
        ),
      ]);
      setCurrentPage(pagy?.page || nextPage);
      setTotalInvoices(pagy?.count || totalInvoices);
      setHasMoreInvoices(Boolean(pagy?.next));
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMoreInvoices, isLoadingMore, params, totalInvoices]);

  const loadMoreInvoicesRef = useInfiniteLoadTrigger({
    enabled: hasMoreInvoices,
    loading: isLoadingMore,
    onLoadMore: loadMoreInvoices,
  });

  const handleClickOnPerPage = e => {
    setParams({
      invoices_per_page: Number(e.target.value),
      query: params.query,
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
        <div className="mt-4 flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <span>
            {i18n.t("invoices.showingOfTotal", {
              shown: invoices.length,
              total: totalInvoices,
            })}
          </span>
          {hasMoreInvoices && (
            <span>{i18n.t("invoices.scrollToLoadMore")}</span>
          )}
          {hasMoreInvoices && (
            <div ref={loadMoreInvoicesRef} className="h-8 w-full" />
          )}
          {isLoadingMore && (
            <span>{i18n.t("invoices.loadingMoreInvoices")}</span>
          )}
          {!hasMoreInvoices && totalInvoices > 0 && (
            <span>{i18n.t("invoices.allInvoicesLoaded")}</span>
          )}
          <div className="mt-2 flex items-center gap-2">
            <label htmlFor="client-invoices-per-page">
              {i18n.t("invoices.invoicesPerPage")}
            </label>
            <select
              id="client-invoices-per-page"
              className="rounded-md border border-border bg-background px-2 py-1 text-sm"
              onChange={handleClickOnPerPage}
              value={params.invoices_per_page}
            >
              {[20, 50, 100].map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );

  const Main = withLayout(InvoicesLayout, !isDesktop, !isDesktop);

  return isDesktop ? InvoicesLayout() : <Main />;
};

export default ClientInvoices;
