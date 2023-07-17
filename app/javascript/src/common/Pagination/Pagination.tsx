import React, { Fragment } from "react";

import cn from "classnames";
import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";

import { useUserContext } from "context/UserContext";

import { usePagination } from "./usePagination";

type Pagination = {
  title?: string;
  pagy: any;
  params: any;
  setParams: any;
  handleClick?: any;
  isReport?: boolean;
  isTeamPage?: boolean;
};

const Pagination = ({
  pagy,
  params,
  setParams,
  title,
  handleClick,
  isReport = false,
  isTeamPage = false,
}: Pagination) => {
  const { isDesktop } = useUserContext();

  const currentPage = params?.page;
  const totalPageCount = pagy?.pages;
  const siblingCount = 1;

  const paginationRange = usePagination({
    currentPage,
    totalPageCount,
    siblingCount,
  });

  const handlePageNumberClick = page => {
    if (page == "...") return;

    return setParams({ ...params, page });
  };

  const disableNextButton = () => {
    if (!isNaN(Number(pagy?.last)) && pagy?.last === currentPage) {
      return true;
    }

    if (typeof pagy?.last === "boolean") {
      return pagy?.last;
    }
  };

  const handleOnClick = e => {
    if (isTeamPage) {
      handleClick(Number(1), Number(e.target.value));
      setParams({ ...params, items: Number(e.target.value) });
    } else {
      setParams({
        page: 1,
        invoices_per_page: Number(e.target.value),
      });
    }
  };

  return (
    <div className="bg-grey-400 relative flex w-full items-center px-0 pt-5 pb-20 md:pb-28 lg:py-10 lg:pl-36">
      <div className="mx-auto w-full">
        {pagy?.pages > 1 && (
          <div className="flex items-center justify-center">
            {!pagy?.first && (
              <button
                disabled={pagy?.first}
                className={cn("m-1 mx-4 font-bold", {
                  "text-miru-gray-400": pagy?.first,
                  "text-miru-han-purple-1000": !pagy?.first,
                })}
                onClick={() => {
                  isReport || isTeamPage
                    ? handleClick(pagy?.prev)
                    : setParams({ ...params, page: pagy?.prev });
                }}
              >
                <CaretCircleLeftIcon size={16} weight="bold" />
              </button>
            )}
            <div className="flex overflow-x-scroll ">
              {paginationRange.map((page, index) => (
                <Fragment key={index}>
                  <button
                    disabled={pagy?.page === page || currentPage === page}
                    key={page}
                    className={cn(
                      "m-1 mx-4 p-1 text-base font-bold text-miru-dark-purple-400",
                      {
                        "text-miru-han-purple-1000": pagy?.prev + 1 === page,
                      }
                    )}
                    onClick={() => {
                      isReport || isTeamPage
                        ? handleClick(page)
                        : handlePageNumberClick(page);
                    }}
                  >
                    {page}
                  </button>
                </Fragment>
              ))}
            </div>
            {!pagy?.last ||
              (!isNaN(Number(pagy?.last)) && (
                <button
                  disabled={disableNextButton()}
                  className={cn("m-1 mx-4 font-bold", {
                    "text-miru-gray-400": disableNextButton(),
                    "text-miru-han-purple-1000": !pagy?.last,
                  })}
                  onClick={() => {
                    isReport || isTeamPage
                      ? handleClick(pagy?.next)
                      : setParams({ ...params, page: pagy?.next });
                  }}
                >
                  <CaretCircleRightIcon size={16} weight="bold" />
                </button>
              ))}
          </div>
        )}
      </div>
      {isDesktop && !isReport && (
        <div className="flex items-center justify-end">
          <select
            className="p-2 text-xs font-bold text-miru-han-purple-1000"
            defaultValue={pagy?.items}
            value={isTeamPage ? params?.items : params.invoices_per_page}
            onChange={handleOnClick}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="40">40</option>
            <option value="50">50</option>
          </select>
          <span className="p-2 text-xs">{title || "items/page"}</span>
        </div>
      )}
    </div>
  );
};

export default Pagination;
