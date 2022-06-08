import React, { useState } from "react";
import {
  CaretDown,
  FileCsv,
  FilePdf,
  Funnel,
  PaperPlaneTilt,
  Printer,
  Share,
  X
} from "phosphor-react";
import NavigationFilter from "./NavigationFilter";
import { useEntry } from "../context/EntryContext";

const Header = ({
  setFilterVisibilty,
  isFilterVisible,
  showNavFilters,
  resetFilter,
  handleDownload
}) => {
  const { filterCounter } = useEntry();
  const [showExportOption, setShowExportOption] = useState<boolean>(false);

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mt-6 mb-3">
        <div className="flex items-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl sm:truncate py-1">
            Time entry report
          </h2>
          <button className="ml-7 p-3 rounded hover:bg-miru-gray-1000 relative" onClick={() => { setFilterVisibilty(!isFilterVisible); }}>
            <Funnel size={16} color="#7C5DEE" />
            {filterCounter > 0 && <sup className="filter__counter">{filterCounter}</sup>}
          </button>
        </div>
        <div className="inline-flex">
          <div className="px-3 relative">
            <button
              className={"border inline-flex justify-center rounded-md border-miru-han-purple-1000 p-2 bg-white text-miru-han-purple-1000 hover:bg-gray-50 menuButton__button"}
              onClick={ () => setShowExportOption(!showExportOption) }
            >
              <Share className="" weight="bold" size={20} />
              <p className="mx-2 uppercase text-base font-medium tracking-wider">Export</p>
              <CaretDown size={20} weight={"bold"} />
            </button>
            {showExportOption && (
              <ul className="menuButton__wrapper">
                <li>
                  <button className="menuButton__list-item" onClick={() => handleDownload("csv")}>
                    <FileCsv size={16} color="#5B34EA" weight="bold" />
                    <span className="ml-3">Export as CSV</span>
                  </button>
                </li>
                <li>
                  <button className="menuButton__list-item" onClick={() => handleDownload("pdf")}>
                    <FilePdf size={16} color="#5B34EA" weight="bold" />
                    <span className="ml-3">Export as PDF</span>
                  </button>
                </li>
                <li>
                  <button className="menuButton__list-item" onClick={ () => window.print() }>
                    <Printer size={16} color="#5B34EA" weight="bold" />
                    <span className="ml-3">Print</span>
                  </button>
                </li>
              </ul>
            )}
          </div>
          <div>
            <button
              className="border inline-flex justify-center rounded-md border-miru-han-purple-1000 p-2 bg-white text-miru-han-purple-1000 hover:bg-gray-50"
            >
              <PaperPlaneTilt size={20} weight={"bold"} />
              <p className="mx-2 uppercase text-base font-medium tracking-wider">Share</p>
            </button>
          </div>
        </div>
      </div>
      <div>
        {
          showNavFilters &&
          <ul className="flex">
            <NavigationFilter />
            {
              filterCounter > 0 && <li key={"clear_all"} className="flex px-2 mr-4 py-1 px-1 ">
                <button onClick={resetFilter} className="inline-block ml-1 flex items-center">
                  <X size={12} color="#5B34EA" className="inline-block" weight="bold" />
                  <span className="text-miru-han-purple-1000 ml-1 text-xs tracking-widest font-bold">CLEAR ALL</span>
                </button>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  );
};

export default Header;
