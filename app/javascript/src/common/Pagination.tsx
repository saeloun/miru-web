import * as React from "react";
import { CaretCircleLeft, CaretCircleRight } from "phosphor-react";

const getPaginationButton = (pageCounter) => {
  const pageButtons = [];
  for (let counter = 1; counter <= pageCounter; counter++) {
    pageButtons.push(
      <button
        key={counter}
        className="p-1 m-1 font-bold text-miru-han-purple-400"
      >
        {counter}
      </button>
    );
  }
  return pageButtons;
};

const Pagination = ({ totalData = 0 }) => {
  const [pages, getPages] = React.useState(null);
  const [counter, setCounter] = React.useState(30);

  React.useEffect(() => {
    if (totalData && totalData > 0) {
      const listPerPage = Math.ceil(totalData / counter);
      getPages(listPerPage);
    }
  }, [counter]);

  const handleSelectChange = (e) => {
    setCounter(parseInt(e.target.value));
  };

  return (
    <div className="w-full py-2 mt-5">
      <div className="grid w-full grid-cols-6 gap-4 bg-grey-400">
        <div className="col-span-3 col-start-2">
          {pages && pages > 1 && (
            <div className="flex items-center justify-center">
              <button className="m-1 text-xs font-bold text-miru-han-purple-400">
                <CaretCircleLeft size={16} weight="bold" />
              </button>

              {getPaginationButton(pages)}

              <button className="m-1 text-xs font-bold text-miru-han-purple-400">
                <CaretCircleRight size={16} weight="bold" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end col-span-2">
          <select
            onChange={handleSelectChange}
            className="p-2 text-xs font-bold text-miru-han-purple-1000"
          >
            <option value="30">30</option>
            <option value="40">40</option>
            <option value="50">50</option>
          </select>

          <span className="p-2 text-xs">invoices per page</span>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
