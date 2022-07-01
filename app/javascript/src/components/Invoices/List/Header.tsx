import * as React from "react";
import { Link } from "react-router-dom";

import {
  Funnel,
  MagnifyingGlass,
  Plus,
  Trash,
  PaperPlaneTilt,
  X
} from "phosphor-react";

const Header = ({
  setFilterVisibilty,
  isInvoiceSelected,
  selectedInvoiceCount,
  clearCheckboxes,
  setShowBulkDeleteDialog
}) => (
  <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
    <h2 className="header__title">Invoices</h2>
    {!isInvoiceSelected && (
      <React.Fragment>
        <div className="header__searchWrap">
          <div className="header__searchInnerWrapper">
            <input
              type="search"
              className="header__searchInput"
              placeholder="Search"
            />

            <button className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer">
              <MagnifyingGlass size={12} />
            </button>
          </div>

          <button className="ml-7" onClick={() => setFilterVisibilty(true)}>
            <Funnel size={16} />
          </button>
        </div>

        <div className="flex">
          <Link
            to="/invoices/generate"
            type="button"
            className="header__button"
          >
            <Plus weight="fill" size={16} />
            <span className="inline-block ml-2">NEW INVOICE</span>
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
          <X size={16} color="#0033CC" weight="bold" />
        </button>

        <div className="flex">
          <button
            type="button"
            onClick={()=> {
              setShowBulkDeleteDialog(true);
            }}
            className="header__button border-col-red-400 text-col-red-400"
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

export default Header;
