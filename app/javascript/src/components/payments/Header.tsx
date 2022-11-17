import React from "react";

import { PlusIcon } from "miruIcons";

const Header = ( { setShowManualEntryModal } ) => (
  <div className="mt-6 mb-3 sm:flex sm:items-center justify-between">
    <div className="flex">
      <h2 className="header__title">Payments</h2>
      {/* <div className="header__searchWrap ml-12">
        <div className="header__searchInnerWrapper">
          <input
            type="search"
            className="header__searchInput"
            placeholder="Search"
          />

          <button className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer">
            <SearchIcon size={12} />
          </button>
        </div>
      </div> */}
    </div>
    <div className="flex">
      <button
        type="button"
        className="header__button"
        onClick={()=>setShowManualEntryModal(true)}
      >
        <PlusIcon weight="fill" size={16} />
        <span className="ml-2 inline-block">ADD MANUAL ENTRY</span>
      </button>
    </div>
  </div>
);

export default Header;
