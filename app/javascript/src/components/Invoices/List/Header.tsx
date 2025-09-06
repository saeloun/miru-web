import { LocalStorageKeys } from "constants/index";

import React, { useCallback } from "react";

import { invoicesApi } from "apis/api";
import { UnifiedSearch } from "../../ui/enhanced-search";
import { PlusIcon, FilterIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";

const Header = ({
  setIsFilterVisible,
  params,
  setParams,
  filterParamsStr,
  isDesktop,
  handleOverlayVisibility,
}) => {
  let appliedFilterCount = (filterParamsStr.match(/&/g) || []).length;
  if (filterParamsStr.includes("custom")) {
    appliedFilterCount = appliedFilterCount - 2;
  }

  const navigate = useNavigate();

  // Search function for invoices
  const fetchInvoices = useCallback(async (searchQuery: string) => {
    const SEARCH_SIZE = 10;
    const searchParams = `invoices_per_page=${SEARCH_SIZE}&page=1&query=${searchQuery}`;

    try {
      const {
        data: { invoices },
      } = await invoicesApi.get(searchParams);

      // Transform for UnifiedSearch interface
      return (
        invoices?.map(invoice => ({
          id: invoice.id,
          label: `#${invoice.invoice_number}`,
          name: `#${invoice.invoice_number}`,
          type: "invoice" as const,
          subtitle: invoice.client_name,
          amount: invoice.amount,
          status: invoice.status,
          date: invoice.issue_date,
          ...invoice,
        })) || []
      );
    } catch (error) {
      console.error("Invoice search error:", error);

      return [];
    }
  }, []);

  const handleInvoiceSelect = invoice => {
    navigate(`/invoices/${invoice.id}`);
  };

  const handleEnterKey = (query: string) => {
    window.localStorage.setItem(LocalStorageKeys.INVOICE_SEARCH_PARAM, query);
    setParams({ ...params, query });
  };

  const handleClearSearch = () => {
    window.localStorage.setItem(LocalStorageKeys.INVOICE_SEARCH_PARAM, "");
    setParams({ ...params, query: "" });
  };

  return (
    <div className="relative mt-6 mb-3 flex flex-wrap items-center justify-between md:justify-start lg:justify-between">
      {isDesktop && <h2 className="header__title">Invoices</h2>}
      <div className="flex items-center gap-2 flex-1 max-w-2xl lg:max-w-lg">
        <UnifiedSearch
          searchAction={fetchInvoices}
          placeholder="Search invoices..."
          onSelect={handleInvoiceSelect}
          handleEnter={handleEnterKey}
          clearSearch={handleClearSearch}
          className="flex-1"
          variant="input"
          debounceMs={300}
          minSearchLength={1}
          size="md"
          highlightMatches={true}
          groupByType={false}
          fullWidthOnMobile={true}
        />
        <Button
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          style="ternary"
          onClick={() => setIsFilterVisible(true)}
        >
          {appliedFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-miru-han-purple-1000 text-xs font-semibold text-white">
              {appliedFilterCount}
            </span>
          )}
          <FilterIcon color="#5B34EA" size={18} weight="bold" />
        </Button>
      </div>
      <Button
        className="ml-2 flex items-center px-4 py-2.5 lg:ml-0"
        style="secondary"
        onClick={() => navigate("/invoices/generate")}
      >
        <PlusIcon size={16} weight="bold" />
        <span className="ml-2 hidden text-sm font-bold tracking-wide lg:inline-block">
          New Invoice
        </span>
      </Button>
    </div>
  );
};

export default Header;
