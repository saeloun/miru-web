import * as React from "react";
import { MagnifyingGlass, Plus } from "phosphor-react";

const Header = ({ setShowNewClientModal }) => (
  <div className="sm:flex mt-6 mb-3 sm:items-center sm:justify-between">
    <h2 className="header__title">
            Clients
    </h2>
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
    </div>
    <div className="flex">
      <button
        type="button"
        className="header__button"
        onClick={() => setShowNewClientModal(true)}
      >
        <Plus weight="fill" size={16} />
        <span className="ml-2 inline-block">NEW CLIENT</span>
      </button>
    </div>
  </div>
);

export default Header;
