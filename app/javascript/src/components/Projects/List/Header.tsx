import * as React from "react";
import { Funnel, MagnifyingGlass, Plus } from "phosphor-react";

const Header = ({ setShowProjectModal }) => (
  <div className="sm:flex mt-6 mb-3 sm:items-center sm:justify-between">
    <h2 className="header__title">
            Projects
    </h2>
    <React.Fragment>
      <div className="header__searchWrap">
        <div className="header__searchInnerWrapper">
          <input
            type="search"
            className="header__searchInput"
            placeholder="Search"
          />
          <button className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
            <MagnifyingGlass size={12} />
          </button>
        </div>
        <button className="ml-7">
          <Funnel size={16} />
        </button>
      </div>
      <button
        className="flex header__button"
        onClick={()=>setShowProjectModal(true)}
      >
        <Plus weight="fill" size={16} />
        <span className="ml-2 inline-block">NEW PROJECT</span>
      </button>
    </React.Fragment>

    {/* {
        isInvoiceSelected && <div className="flex justify-center items-center">
          <span>{selectedInvoiceCount} invoices selected</span>
          <button className="ml-2" onClick={handleCloseButton}>
            <X size={16} color="#5b34ea" weight="bold" />
          </button>
          <div className="flex">
            <button
              type="button"
              className="header__button border-miru-red-400 text-miru-red-400"
            >
              <Trash weight="fill" size={16} />
              <span className="ml-2 inline-block">DELETE</span>
            </button>
            <button
              type="button"
              className="header__button"
            >
              <PaperPlaneTilt weight="fill" size={16} />
              <span className="ml-2 inline-block">SEND TO</span>
            </button>
          </div>
        </div>
      } */}
  </div>
);

export default Header;
