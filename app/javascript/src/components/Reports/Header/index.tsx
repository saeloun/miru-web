/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState } from "react";
import { Link } from "react-router-dom";
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
import { getReports } from "./fetchReport";
import NavigationFilter from "./NavigationFilter";
import { useEntry } from "../context/EntryContext";

const leftArrow = require("../../../../images/back-arrow.svg");

const Header = ({
  setFilterVisibilty,
  isFilterVisible,
  showNavFilters,
  resetFilter,
  handleDownload,
  type
}) => {
  const { timeEntryReport, revenueByClientReport, currentReport } = useEntry();

  const selectedReport = getReports({ currentReport, timeEntryReport, revenueByClientReport });

  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mt-6 mb-3">
        <div className="flex items-center">
          <Link
            to={"/reports"}
            type="button"
          >
            <img src={leftArrow}></img>
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl sm:truncate py-1 ml-5">
            {type}
          </h2>
          <button className="ml-7 p-3 rounded hover:bg-miru-gray-1000 relative" onClick={() => { setFilterVisibilty(!isFilterVisible); }}>
            <Funnel size={16} color="#7C5DEE" />
            {selectedReport.filterCounter > 0 && <sup className="filter__counter">{selectedReport.filterCounter}</sup>}
          </button>
        </div>
        <div className="inline-flex">
          <div className="px-3 relative">
            <button
              className={"border inline-flex justify-center rounded-md border-miru-han-purple-1000 p-2 bg-white text-miru-han-purple-1000 hover:bg-gray-50 menuButton__button"}
              onClick={ () => setShowExportOptions(!showExportOptions) }
            >
              <Share className="" weight="bold" size={20} />
              <p className="mx-2 uppercase text-base font-medium tracking-wider">Export</p>
              <CaretDown size={20} weight={"bold"} />
            </button>
            {showExportOptions && (
              <ul className="menuButton__wrapper">
                <li>
                  <button
                    className="menuButton__list-item"
                    onClick={() => {
                      setShowExportOptions(false);
                      handleDownload("csv");
                    }}
                  >
                    <FileCsv size={16} color="#5B34EA" weight="bold" />
                    <span className="ml-3">Export as CSV</span>
                  </button>
                </li>
                <li>
                  <button
                    className="menuButton__list-item"
                    onClick={() => {
                      setShowExportOptions(false);
                      handleDownload("pdf");
                    }}
                  >
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
              selectedReport.filterCounter > 0 && <li key={"clear_all"} className="flex px-2 mr-4 py-1 px-1 ">
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
