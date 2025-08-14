import React, { Fragment, useState } from "react";

import { useUserContext } from "context/UserContext";
import {
  CaretDownIcon,
  FileCsvIcon,
  FilePdfIcon,
  FilterIcon,
  ShareIcon,
  XIcon,
  ArrowLeftIcon,
  MoreOptionIcon,
} from "miruIcons";
import { Link } from "react-router-dom";
import { MobileMoreOptions } from "StyledComponents";

import { getReports } from "./fetchReport";
import NavigationFilter from "./NavigationFilter";

import { useEntry } from "../context/EntryContext";
import { REVENUE_REPORT_PAGE } from "../RevenueByClientReport/util";
import { TIME_ENTRY_REPORT_PAGE } from "../TimeEntryReport/utils";

const Header = ({
  setIsFilterVisible,
  isFilterVisible,
  showNavFilters,
  resetFilter,
  handleDownload,
  type,
  revenueFilterCounter,
  showExportButon,
  showFilterIcon = true,
}) => {
  const {
    timeEntryReport,
    revenueByClientReport,
    currentReport,
    outstandingOverdueInvoice,
    accountsAgingReport,
  } = useEntry();

  const selectedReport = getReports({
    currentReport,
    timeEntryReport,
    revenueByClientReport,
    outstandingOverdueInvoice,
    accountsAgingReport,
  });

  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);
  const { isDesktop } = useUserContext();

  const showClearAllFilterBtn = (filterCounter = 0, type = "") => {
    let minNumberOfFilters = 0;
    if (type == TIME_ENTRY_REPORT_PAGE) {
      minNumberOfFilters =
        !selectedReport?.selectedFilter?.groupBy?.value?.trim() ||
        selectedReport?.selectedFilter?.groupBy?.label?.trim()?.toLowerCase() ==
          "none"
          ? 1
          : 2;
    } else if (type == REVENUE_REPORT_PAGE) {
      return revenueFilterCounter > minNumberOfFilters;
    }

    return filterCounter > minNumberOfFilters;
  };

  const handleFilterBtnClick = (isDesktop: any) => {
    if (isDesktop) {
      setIsFilterVisible(!isFilterVisible);
    } else {
      setShowMoreOptions(true);
    }
  };

  return (
    <div>
      <div className="sticky top-0 right-0 left-0 mt-0 mb-3 flex items-center justify-between bg-white px-4 py-2 shadow-c1 lg:static lg:mt-6 lg:bg-transparent lg:px-0 lg:shadow-none">
        <div className="flex w-full items-center justify-between lg:w-auto">
          <Link to="/reports" type="button">
            <ArrowLeftIcon />
          </Link>
          <span className="w-full py-1 px-3 text-left text-base font-medium leading-5 text-miru-dark-purple-1000 lg:ml-5 lg:truncate lg:px-0 lg:text-center lg:text-3.5xl lg:font-bold  lg:leading-10">
            {type}
          </span>
          {showFilterIcon && (
            <button
              className="relative rounded p-3 hover:bg-miru-gray-1000 lg:ml-7"
              onClick={() => handleFilterBtnClick(isDesktop)}
            >
              {isDesktop ? (
                <>
                  <FilterIcon color="#7C5DEE" size={16} />
                  {type == TIME_ENTRY_REPORT_PAGE &&
                    selectedReport.filterCounter > 0 && (
                      <sup className="filter__counter">
                        {selectedReport.filterCounter}
                      </sup>
                    )}
                  {type == REVENUE_REPORT_PAGE && revenueFilterCounter > 0 && (
                    <sup className="filter__counter">
                      {revenueFilterCounter}
                    </sup>
                  )}
                </>
              ) : (
                <img className="h-4 w-4" src={MoreOptionIcon} />
              )}
            </button>
          )}
          {showMoreOptions && (
            <MobileMoreOptions
              setVisibilty={setShowMoreOptions}
              visibilty={showMoreOptions}
            >
              <li
                className="flex items-center py-2 text-sm text-miru-han-purple-1000"
                onClick={() => {
                  setIsFilterVisible(!isFilterVisible);
                  setShowMoreOptions(false);
                }}
              >
                <FilterIcon className="mr-4" color="#7C5DEE" size={16} />{" "}
                Filters
              </li>
              {showExportButon && (
                <Fragment>
                  <li>
                    <button
                      className="menuButton__list-item px-0"
                      onMouseDown={() => {
                        setShowExportOptions(false);
                        handleDownload("csv");
                      }}
                    >
                      <FileCsvIcon color="#5B34EA" size={16} weight="bold" />
                      <span className="ml-3 text-sm">Export as CSV</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className="menuButton__list-item px-0"
                      onMouseDown={() => {
                        setShowExportOptions(false);
                        handleDownload("pdf");
                      }}
                    >
                      <FilePdfIcon color="#5B34EA" size={16} weight="bold" />
                      <span className="ml-3 text-sm">Export as PDF</span>
                    </button>
                  </li>
                </Fragment>
              )}
            </MobileMoreOptions>
          )}
        </div>
        {showExportButon && isDesktop && (
          <div
            className="mt-10 inline-flex lg:mt-0"
            onBlur={() => setShowExportOptions(false)}
          >
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
                      onMouseDown={() => {
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
                      onMouseDown={() => {
                        setShowExportOptions(false);
                        handleDownload("pdf");
                      }}
                    >
                      <FilePdfIcon color="#5B34EA" size={16} weight="bold" />
                      <span className="ml-3">Export as PDF</span>
                    </button>
                  </li>
                  {/* <li>
                    <button
                      className="menuButton__list-item"
                      onClick={() => window.print()}
                    >
                      <PrinterIcon color="#5B34EA" size={16} weight="bold" />
                      <span className="ml-3">Print</span>
                    </button>
                  </li> */}
                </ul>
              )}
            </div>
            {/* <div>
              <button className="inline-flex justify-center rounded-md border border-miru-han-purple-1000 bg-white p-2 text-miru-han-purple-1000 hover:bg-gray-50">
                <PaperPlaneTiltIcon size={20} weight="bold" />
                <p className="mx-2 text-base font-medium uppercase tracking-wider">
                  Share
                </p>
              </button>
            </div> */}
          </div>
        )}
      </div>
      <div>
        {showNavFilters && (
          <ul className="flex flex-wrap px-4 lg:px-0 mb-6">
            <NavigationFilter />
            {showClearAllFilterBtn(selectedReport.filterCounter, type) && (
              <li className="mr-4 flex px-2 py-1" key="clear_all">
                <button
                  className="ml-1 flex items-center"
                  onClick={resetFilter}
                >
                  <XIcon
                    className="inline-block"
                    color="#5B34EA"
                    size={12}
                    weight="bold"
                  />
                  <span className="ml-1 whitespace-nowrap text-xs font-bold tracking-widest text-miru-han-purple-1000">
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
