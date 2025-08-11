import React, { Fragment } from "react";

import cn from "classnames";
import { useUserContext } from "context/UserContext";
import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";

import { usePagination } from "./usePagination";

type Iprops = {
  handleClick: (e: any) => void; // eslint-disable-line
  totalPages: number;
  currentPage: number;
  isFirstPage: boolean;
  prevPage: number;
  nextPage: number;
  isLastPage: boolean;
  isPerPageVisible?: boolean;
  title?: string;
  itemsPerPage?: number;
  handleClickOnPerPage?: (e: any) => void; // eslint-disable-line
};

const Pagination = ({
  handleClick,
  totalPages,
  currentPage,
  isFirstPage,
  prevPage,
  nextPage,
  isLastPage,
  isPerPageVisible = false,
  title = "items/page",
  itemsPerPage = 10,
  handleClickOnPerPage,
}: Iprops) => {
  const { isDesktop } = useUserContext();

  const siblingCount = 1;

  const paginationRange = usePagination({
    currentPage,
    totalPages,
    siblingCount,
  });

  return (
    <div className="bg-grey-400 relative flex w-full items-center px-0 pt-5 pb-20 md:pb-28 lg:py-10 lg:pl-36">
      <div className="mx-auto w-full">
        {totalPages > 1 && (
          <div className="flex items-center justify-center">
            {!isFirstPage && (
              <button
                disabled={isFirstPage}
                className={cn("m-1 mx-4 font-bold", {
                  "text-miru-gray-400": isFirstPage,
                  "text-miru-han-purple-1000": !isFirstPage,
                })}
                onClick={() => {
                  handleClick(prevPage);
                }}
              >
                <CaretCircleLeftIcon size={16} weight="bold" />
              </button>
            )}
            <div className="flex overflow-x-scroll ">
              {paginationRange?.map((page, index) => (
                <Fragment key={index}>
                  <button
                    disabled={currentPage === page}
                    key={page}
                    className={cn(
                      "m-1 mx-4 p-1 text-base font-bold text-miru-dark-purple-400",
                      {
                        "text-miru-han-purple-1000": prevPage + 1 === page,
                      }
                    )}
                    onClick={() => {
                      handleClick(page);
                    }}
                  >
                    {page}
                  </button>
                </Fragment>
              ))}
            </div>
            {!isLastPage && (
              <button
                disabled={isLastPage}
                className={cn("m-1 mx-4 font-bold", {
                  "text-miru-gray-400": isLastPage,
                  "text-miru-han-purple-1000": !isLastPage,
                })}
                onClick={() => {
                  handleClick(nextPage);
                }}
              >
                <CaretCircleRightIcon size={16} weight="bold" />
              </button>
            )}
          </div>
        )}
      </div>
      {isDesktop && isPerPageVisible && (
        <div className="flex items-center justify-end">
          <select
            className="p-2 text-xs font-bold text-miru-han-purple-1000"
            value={itemsPerPage}
            onChange={handleClickOnPerPage}
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
