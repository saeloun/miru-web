import React, { Fragment, useState } from "react";

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

import { useUserContext } from "context/UserContext";
import { Button } from "components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";

import { getReports } from "./fetchReport";
import NavigationFilter from "./NavigationFilter";

import { i18n } from "../../../i18n";
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
      <div className="sticky top-0 right-0 left-0 z-20 mt-0 mb-3 flex items-center justify-between border-b border-border bg-background/95 px-4 py-2 shadow-c1 backdrop-blur lg:static lg:mt-6 lg:border-b-0 lg:bg-transparent lg:px-0 lg:shadow-none lg:backdrop-blur-none">
        <div className="flex w-full items-center justify-between lg:w-auto">
          <Link
            to="/reports"
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
            aria-label={i18n.t("reports.backToReports")}
          >
            <ArrowLeftIcon />
          </Link>
          <span className="w-full py-1 px-3 text-left text-base font-medium leading-5 text-foreground lg:ml-5 lg:truncate lg:px-0 lg:text-center lg:text-3.5xl lg:font-bold  lg:leading-10">
            {type}
          </span>
          {showFilterIcon && (
            <button
              className="relative rounded-md p-3 text-foreground transition-colors hover:bg-muted lg:ml-7"
              onClick={() => handleFilterBtnClick(isDesktop)}
              aria-label={i18n.t("reports.toggleReportFilters")}
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
                className="flex items-center py-2 text-sm text-primary"
                onClick={() => {
                  setIsFilterVisible(!isFilterVisible);
                  setShowMoreOptions(false);
                }}
              >
                <FilterIcon className="mr-4" color="#7C5DEE" size={16} />{" "}
                {i18n.t("filters")}
              </li>
              {showExportButon && (
                <Fragment>
                  <li>
                    <button
                      className="menuButton__list-item px-0 text-foreground"
                      onMouseDown={() => {
                        setShowExportOptions(false);
                        handleDownload("csv");
                      }}
                    >
                      <FileCsvIcon color="#5E58F1" size={16} weight="bold" />
                      <span className="ml-3 text-sm">{i18n.t("reports.exportAsCsv")}</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className="menuButton__list-item px-0 text-foreground"
                      onMouseDown={() => {
                        setShowExportOptions(false);
                        handleDownload("pdf");
                      }}
                    >
                      <FilePdfIcon color="#5E58F1" size={16} weight="bold" />
                      <span className="ml-3 text-sm">{i18n.t("reports.exportAsPdf")}</span>
                    </button>
                  </li>
                </Fragment>
              )}
            </MobileMoreOptions>
          )}
        </div>
        {showExportButon && isDesktop && (
          <div className="mt-10 inline-flex lg:mt-0">
            <DropdownMenu
              open={showExportOptions}
              onOpenChange={setShowExportOptions}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-border bg-background text-foreground hover:bg-muted"
                  aria-label={`Export ${type}`}
                >
                  <ShareIcon size={18} weight="bold" />
                  <span className="text-sm font-semibold uppercase tracking-[0.18em]">
                    {i18n.t("reports.export")}
                  </span>
                  <CaretDownIcon size={18} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onSelect={() => {
                    setShowExportOptions(false);
                    handleDownload("csv");
                  }}
                >
                  <FileCsvIcon color="currentColor" size={16} weight="bold" />
                  <span className="ml-2">{i18n.t("reports.exportAsCsv")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setShowExportOptions(false);
                    handleDownload("pdf");
                  }}
                >
                  <FilePdfIcon color="currentColor" size={16} weight="bold" />
                  <span className="ml-2">{i18n.t("reports.exportAsPdf")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      <div>
        {showNavFilters && (
          <ul className="flex flex-wrap px-4 lg:px-0">
            <NavigationFilter />
            {showClearAllFilterBtn(selectedReport.filterCounter, type) && (
              <li className="mr-4 flex px-2 py-1" key="clear_all">
                <button
                  className="ml-1 flex items-center"
                  onClick={resetFilter}
                >
                  <XIcon
                    className="inline-block"
                    color="#5E58F1"
                    size={12}
                    weight="bold"
                  />
                  <span className="ml-1 whitespace-nowrap text-xs font-bold tracking-widest text-primary">
                    {i18n.t("reports.clearAll")}
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
