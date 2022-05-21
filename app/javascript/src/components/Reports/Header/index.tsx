import React from "react";
import {
  Funnel
} from "phosphor-react";
import NavigationFilter from "./NavigationFilter";

const Header = ({ setFilterVisibilty, isFilterVisible, showNavFilters }) => (
  <div>
    <div className="sm:flex sm:items-center sm:justify-between mt-6 mb-3">
      <div className="flex items-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl sm:truncate py-1">
          Time entry report
        </h2>
        <button className="ml-7 p-3 rounded hover:bg-miru-gray-1000 relative" onClick={() => { setFilterVisibilty(!isFilterVisible); }}>
          <Funnel size={16} color="#7C5DEE" />
          {/* Need to work on below code when integrating the api values */}
          {/* <sup className="filter__counter">3</sup> */}
        </button>
      </div>
    </div>
    <div>
      {
        showNavFilters &&
        <ul className="flex">
          <NavigationFilter />
        </ul>
      }
    </div>
  </div>
);

export default Header;
