import React from "react";

import cn from "classnames";
import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";

import { useUserContext } from "context/UserContext";

type Pagination = {
  title?: string;
  pagy: any;
  params: any;
  setParams: any;
};

const Pagination = ({ pagy, params, setParams, title }: Pagination) => {
  const { isDesktop } = useUserContext();

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
                onClick={() => setParams({ ...params, page: pagy?.prev })}
              >
                <CaretCircleLeftIcon size={16} weight="bold" />
              </button>
            )}
            <div className="flex overflow-x-scroll ">
              {Array.from({ length: pagy.pages }, (_, idx) => idx + 1).map(
                page => (
                  <button
                    disabled={pagy?.page === page}
                    key={page}
                    className={cn(
                      "m-1 mx-4 p-1 text-base font-bold text-miru-dark-purple-400",
                      {
                        "text-miru-han-purple-1000": pagy?.prev + 1 === page,
                      }
                    )}
                    onClick={() => setParams({ ...params, page })}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            {!pagy?.last && (
              <button
                disabled={pagy?.last}
                className={cn("m-1 mx-4 font-bold", {
                  "text-miru-gray-400": pagy?.last,
                  "text-miru-han-purple-1000": !pagy?.last,
                })}
                onClick={() => setParams({ ...params, page: pagy?.next })}
              >
                <CaretCircleRightIcon size={16} weight="bold" />
              </button>
            )}
          </div>
        )}
      </div>
      {isDesktop && (
        <div className="flex items-center justify-end">
          <select
            className="p-2 text-xs font-bold text-miru-han-purple-1000"
            defaultValue={pagy?.items}
            value={params.invoices_per_page}
            onChange={e =>
              setParams({ page: 1, invoices_per_page: Number(e.target.value) })
            }
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
