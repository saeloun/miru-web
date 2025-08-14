import React, { useCallback } from "react";

import paymentsApi from "apis/payments/payments";
import { UnifiedSearch } from "../ui/enhanced-search";
import { PlusIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";

import { HeaderProps } from "./interfaces";
import MobileHeader from "./Mobile/Header";

const Header = ({
  setShowManualEntryModal,
  payments,
  setShowSearchedPayments,
  setSearchedPaymentList,
  params,
  setParams,
  showSearchedPayments,
}: HeaderProps) => {
  const navigate = useNavigate();

  const fetchSearchedPayments = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery?.trim()) {
        setSearchedPaymentList([]);
        setShowSearchedPayments(false);
        setParams({ ...params, query: "" });

        return [];
      }

      try {
        // Use API endpoint for search
        const response = await paymentsApi.get(
          `?query=${encodeURIComponent(searchQuery)}`
        );
        const searchResults = response.data.payments || [];

        setSearchedPaymentList(searchResults);
        setShowSearchedPayments(true);
        setParams({ ...params, query: searchQuery });

        // Transform for UnifiedSearch interface
        return searchResults.slice(0, 10).map(payment => ({
          id: payment.id,
          label: payment.invoiceNumber,
          type: "payment" as const,
          subtitle: `${payment.clientName} • $${payment.amount}`,
          invoiceId: payment.invoiceId,
        }));
      } catch (error) {
        console.error("Payment search error:", error);
        // Fallback to local filtering if API fails
        const filtered =
          payments?.filter(payment =>
            payment?.clientName
              ?.toLowerCase()
              .trim()
              ?.includes(searchQuery?.toLowerCase().trim())
          ) || [];

        setSearchedPaymentList(filtered);
        setShowSearchedPayments(true);
        setParams({ ...params, query: searchQuery });

        return filtered.slice(0, 10).map(payment => ({
          id: payment.id,
          label: payment.invoiceNumber,
          type: "payment" as const,
          subtitle: `${payment.clientName} • $${payment.amount}`,
          invoiceId: payment.invoiceId,
        }));
      }
    },
    [setSearchedPaymentList, setShowSearchedPayments, setParams, params]
  );

  const handlePaymentSelect = payment => {
    // Navigate to the invoice page for this payment
    if (payment.invoiceId) {
      navigate(`/invoices/${payment.invoiceId}`);
    } else {
      // Fallback: filter to show payments for the same client
      const filtered =
        payments?.filter(p => p.clientName === payment.clientName) || [];
      setSearchedPaymentList(filtered);
      setShowSearchedPayments(true);
      setParams({ ...params, query: payment.clientName });
    }
  };

  const handleEnterKey = (query: string) => {
    fetchSearchedPayments(query);
  };

  const handleClearSearch = () => {
    setSearchedPaymentList([]);
    setShowSearchedPayments(false);
    setParams({ ...params, query: "" });
  };

  return (
    <div className="relative mt-6 mb-3 flex flex-wrap items-center justify-between">
      <h2 className="header__title hidden md:flex md:items-center md:gap-2">
        <span>Payments</span>
      </h2>
      <div className="flex items-center gap-3 hidden md:flex mx-auto">
        <UnifiedSearch
          searchAction={fetchSearchedPayments}
          placeholder="Search payments by client, invoice, or amount..."
          onSelect={handlePaymentSelect}
          handleEnter={handleEnterKey}
          clearSearch={handleClearSearch}
          className="w-96"
          variant="input"
          debounceMs={300}
          minSearchLength={1}
          size="lg"
          highlightMatches={true}
          fullWidthOnMobile={true}
          dropdownClassName="w-96 max-w-2xl"
        />
      </div>
      <Button
        className="ml-2 flex items-center px-2 py-2 lg:ml-0 lg:px-4 hidden md:flex"
        id="addEntry"
        style="secondary"
        onClick={() => setShowManualEntryModal(true)}
      >
        <PlusIcon size={16} weight="bold" />
        <span className="ml-2 hidden text-base font-bold tracking-widest lg:inline-block">
          Add Manual Entry
        </span>
      </Button>
      <MobileHeader
        fetchSearchedPayments={fetchSearchedPayments}
        params={params}
        payments={payments}
        setParams={setParams}
        setShowManualEntryModal={setShowManualEntryModal}
        setShowSearchedPayments={setShowSearchedPayments}
        showSearchedPayments={showSearchedPayments}
      />
    </div>
  );
};

export default Header;
