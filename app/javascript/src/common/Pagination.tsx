import * as React from "react";

import cn from "classnames";
import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";

const Pagination = ({ pagy, params, setParams }) => (
  <div className="w-full py-10">
    <div className="bg-grey-400 grid w-full grid-cols-6 gap-4">
      <div className="col-span-3 col-start-2">
        {pagy?.pages > 1 && (
          <div className="flex items-center justify-center">
            <button
              disabled={!pagy?.prev}
              className={cn("m-1 mx-4 font-bold", {
                "text-miru-gray-400": !pagy?.prev,
                "text-miru-han-purple-1000": pagy?.prev,
              })}
              onClick={() => setParams({ ...params, page: pagy?.prev })}
            >
              <CaretCircleLeftIcon size={16} weight="bold" />
            </button>
            {Array.from({ length: pagy.pages }, (_, idx) => idx + 1).map(
              page => (
                <button
                  disabled={pagy?.page === page}
                  key={page}
                  className={cn(
                    "m-1 mx-4 p-1 text-base font-bold text-miru-dark-purple-400",
                    {
                      "text-miru-han-purple-1000": pagy?.page === page,
                    }
                  )}
                  onClick={() => setParams({ ...params, page })}
                >
                  {page}
                </button>
              )
            )}
            <button
              disabled={!pagy?.next}
              className={cn("m-1 mx-4 font-bold", {
                "text-miru-gray-400": !pagy?.next,
                "text-miru-han-purple-1000": pagy?.next,
              })}
              onClick={() => setParams({ ...params, page: pagy?.next })}
            >
              <CaretCircleRightIcon size={16} weight="bold" />
            </button>
          </div>
        )}
      </div>
      <div className="col-span-2 flex items-center justify-end">
        <select
          className="p-2 text-xs font-bold text-miru-han-purple-1000"
          defaultValue={pagy?.items}
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
        <span className="p-2 text-xs">invoices per page</span>
      </div>
    </div>
  </div>
);

export default Pagination;
