import * as React from "react";
import cn from "classnames";
import { CaretCircleLeft, CaretCircleRight } from "phosphor-react";

const Pagination = ({ pagy, params, setParams, forPage }) => (
  <div className="w-full py-2 mt-5">
    <div className="grid w-full grid-cols-6 gap-4 bg-grey-400">
      <div className="col-span-3 col-start-2">
        {pagy?.pages > 1 && (
          <div className="flex items-center justify-center">
            <button
              className={cn("m-1 text-xs font-bold", {
                "text-miru-gray-400": !pagy?.prev,
                "text-miru-han-purple-400": pagy?.prev
              })}
              onClick={() => setParams({ ...params, page: pagy?.prev })}
              disabled={!pagy?.prev}
            >
              <CaretCircleLeft size={16} weight="bold" />
            </button>

            {Array.from({ length: pagy.pages }, (_, idx) => idx + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setParams({ ...params, page })}
                  className={cn("p-1 m-1 font-bold text-miru-han-purple-400", {
                    "bg-miru-han-purple-100": pagy?.page === page
                  })}
                  disabled={pagy?.page === page}
                >
                  {page}
                </button>
              )
            )}

            <button
              className={cn("m-1 text-xs font-bold", {
                "text-miru-gray-400": !pagy?.next,
                "text-miru-han-purple-400": pagy?.next
              })}
              onClick={() => setParams({ ...params, page: pagy?.next })}
              disabled={!pagy?.next}
            >
              <CaretCircleRight size={16} weight="bold" />
            </button>
          </div>
        )}
      </div>

      {forPage == "invoices" && <div className="flex items-center justify-end col-span-2">
        <select
          onChange={(e) =>
            setParams({ page: 1, invoices_per_page: Number(e.target.value) })
          }
          className="p-2 text-xs font-bold text-miru-han-purple-1000"
          value={pagy?.items}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="30">30</option>
          <option value="40">40</option>
          <option value="50">50</option>
        </select>

        <span className="p-2 text-xs">invoices per page</span>
      </div>
      }
      {forPage == "lead_timelines" && <div className="flex items-center justify-end col-span-2">
        <select
          onChange={(e) =>
            setParams({ page: 1, timelines_per_page: Number(e.target.value) })
          }
          className="p-2 text-xs font-bold text-miru-han-purple-1000"
          value={pagy?.items}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="30">30</option>
          <option value="40">40</option>
          <option value="50">50</option>
        </select>

        <span className="p-2 text-xs">timelines per page</span>
      </div>
      }
    </div>
  </div>
);

export default Pagination;
