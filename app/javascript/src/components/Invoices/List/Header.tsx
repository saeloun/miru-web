import * as React from "react";

import { ApiStatus as InvoiceStatus } from "constants/index";

import { useDebounce } from "helpers";
import {
  MagnifyingGlass,
  Plus,
  Trash,
  PaperPlaneTilt,
  X
} from "phosphor-react";
import { Link } from "react-router-dom";

import invoicesApi from "apis/invoices";

import SearchDropdown from "./InvoiceSearch/SearchDropdown";

const Header = ({
  isInvoiceSelected,
  selectedInvoiceCount,
  clearCheckboxes,
  setShowBulkDeleteDialog,
  params,
  setParams
}) => {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [searchResult, setSearchResult] = React.useState<any[]>([]);
  const [status, setStatus] = React.useState<InvoiceStatus>(InvoiceStatus.IDLE);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  React.useEffect(() => {
    if (searchQuery) {
      fetchSearchinvoices(debouncedSearchQuery);
    } else {
      setSearchResult([]);
      setStatus(InvoiceStatus.IDLE);
    }
  }, [debouncedSearchQuery]);

  const fetchSearchinvoices = async (debouncedSearchQuery) => {
    const SEARCH_SIZE = 5;
    const searchParams = `invoices_per_page=${SEARCH_SIZE}&page=1&query=${debouncedSearchQuery}`;
    setStatus(InvoiceStatus.LOADING);
    try {
      const {
        data: { invoices }
      } = await invoicesApi.get(searchParams);
      setSearchResult(invoices);
      setStatus(InvoiceStatus.SUCCESS);
    } catch (error) {
      setStatus(InvoiceStatus.ERROR);
    }
  };

  const onSearchClear = () => {
    setSearchQuery("");
    setParams({ ...params, query: "" });
  };

  const onKeydownHandler = (e) => {
    if (e.key === "Enter") {
      setParams({ ...params, query: searchQuery });
    }
  };

  return (
    <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
      <h2 className="header__title" data-cy ="header__invoices">Invoices</h2>
      {!isInvoiceSelected && (
        <React.Fragment>
          <div className="header__searchWrap">
            <div className="header__searchInnerWrapper relative">
              <div>
                <input
                  type="text"
                  className="header__searchInput"
                  placeholder="Search"
                  data-cy="search-invoice"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => onKeydownHandler(e)}
                />
                <button className=" absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer ">
                  {searchQuery ? (
                    <X size={12} onClick={onSearchClear} />
                  ) : (
                    <MagnifyingGlass size={12} />
                  )}
                </button>

                <SearchDropdown display={(params.query !== searchQuery)} status={status} list={searchResult} />
              </div>
            </div>

            {/* <button className="ml-7" onClick={() => setFilterVisibilty(true)}>
              <Funnel size={16} />
            </button> */}
          </div>

          <div className="flex">
            <Link
              to="/invoices/generate"
              type="button"
              className="header__button"
            >
              <Plus weight="fill" size={16} />
              <span className="inline-block ml-2" data-cy="new-invoice-button">NEW INVOICE</span>
            </Link>
          </div>
        </React.Fragment>
      )}
      {isInvoiceSelected && (
        <div className="flex items-center justify-center">
          <span>
            {selectedInvoiceCount > 1
              ? `${selectedInvoiceCount} invoices selected`
              : `${selectedInvoiceCount} invoice selected`}{" "}
          </span>

          <button className="ml-2" onClick={clearCheckboxes}>
            <X size={16} color="#5b34ea" weight="bold" />
          </button>

          <div className="flex">
            <button
              type="button"
              onClick={() => {
                setShowBulkDeleteDialog(true);
              }}
              className="header__button border-miru-red-400 text-miru-red-400"
            >
              <Trash weight="fill" size={16} />
              <span className="inline-block ml-2">DELETE</span>
            </button>

            <button type="button" className="header__button">
              <PaperPlaneTilt weight="fill" size={16} />
              <span className="inline-block ml-2">SEND TO</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
