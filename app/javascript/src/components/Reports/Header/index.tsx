/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState } from "react";

import {
  CaretDownIcon,
  FileCsvIcon,
  FilePdfIcon,
  FilterIcon,
  PrinterIcon,
  ShareIcon,
  XIcon,
} from "miruIcons";
import { Link } from "react-router-dom";

import { getReports } from "./fetchReport";
import NavigationFilter from "./NavigationFilter";

import { useEntry } from "../context/EntryContext";

const leftArrow = require("../../../../images/back-arrow.svg");

const Header = ({
  setIsFilterVisible,
  isFilterVisible,
  showNavFilters,
  resetFilter,
  handleDownload,
  type,
  showExportButon,
}) => {
  const {
    timeEntryReport,
    revenueByClientReport,
    currentReport,
    outstandingOverdueInvoice,
  } = useEntry();

  const selectedReport = getReports({
    currentReport,
    timeEntryReport,
    revenueByClientReport,
    outstandingOverdueInvoice,
  });

  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);

  return (
    <div>
      <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Link to="/reports" type="button">
            <img src={leftArrow} />
          </Link>
          <h2 className="ml-5 py-1 text-3xl font-extrabold text-gray-900 sm:truncate sm:text-4xl">
            {type}
          </h2>
          <button
            className="relative ml-7 rounded p-3 hover:bg-miru-gray-1000"
            onClick={() => {
              setIsFilterVisible(!isFilterVisible);
            }}
          >
            <FilterIcon color="#7C5DEE" size={16} />
            {selectedReport.filterCounter > 0 && (
              <sup className="filter__counter">
                {selectedReport.filterCounter}
              </sup>
            )}
          </button>
        </div>
        {showExportButon && (
          <div className="inline-flex">
            <div className="relative px-3">
              <button
                className="menuButton__button inline-flex justify-center rounded-md border border-miru-han-purple-1000 bg-white p-2 text-miru-han-purple-1000 hover:bg-gray-50"
                onClick={() => setShowExportOptions(!showExportOptions)}
              >
                <ShareIcon className="" size={20} weight="bold" />
                <p className="mx-2 text-base font-medium uppercase tracking-wider">
                  Export
                </p>
                <CaretDownIcon size={20} weight="bold" />
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
                      <FileCsvIcon color="#5B34EA" size={16} weight="bold" />
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
                      <FilePdfIcon color="#5B34EA" size={16} weight="bold" />
                      <span className="ml-3">Export as PDF</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className="menuButton__list-item"
                      onClick={() => window.print()}
                    >
                      <PrinterIcon color="#5B34EA" size={16} weight="bold" />
                      <span className="ml-3">Print</span>
                    </button>
                  </li>
                </ul>
              )}
            </div>
            <div>
              {/* <button
              className="border inline-flex justify-center rounded-md border-miru-han-purple-1000 p-2 bg-white text-miru-han-purple-1000 hover:bg-gray-50"
            >
              <PaperPlaneTiltIcon size={20} weight={"bold"} />
              <p className="mx-2 uppercase text-base font-medium tracking-wider">Share</p>
            </button> */}
            </div>
          </div>
        )}
      </div>
      <div>
        {showNavFilters && (
          <ul className="flex">
            <NavigationFilter />
            {selectedReport.filterCounter > 0 && (
              <li className="mr-4 flex px-2 py-1 px-1 " key="clear_all">
                <button
                  className="ml-1 inline-block flex items-center"
                  onClick={resetFilter}
                >
                  <XIcon
                    className="inline-block"
                    color="#5B34EA"
                    size={12}
                    weight="bold"
                  />
                  <span className="ml-1 text-xs font-bold tracking-widest text-miru-han-purple-1000">
                    CLEAR ALL
                  </span>
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Header;
