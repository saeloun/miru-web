import * as React from "react";

const getPaginationButton = (pageCounter) => {
  const pageButtons = [];
  for (let counter=1; counter <= pageCounter; counter++) {
    pageButtons.push(
      <button key={counter} className="m-1 p-1 font-bold text-miru-han-purple-400">
        {counter}
      </button>
    );
  }
  return pageButtons;
};

const Pagination = ({ totalData = 41 }) => {

  const [pages, getPages] = React.useState(null);
  const [counter, setCounter] = React.useState(30);

  React.useEffect(() => {
    if (totalData && totalData > 0 ) {
      const listPerPage = Math.ceil(totalData/counter);
      getPages(listPerPage);
    }
  }, [counter]);

  const handleSelectChange = (e) => {
    setCounter(parseInt(e.target.value));
  };

  return (
    <div className="p-2 mt-5 flex w-full">
      <div className="p-2 flex justify-self-center bg-grey-400 justify-center w-2/3">
        { pages && pages > 1 && <div>
          <button className="m-1 p-1 font-bold text-miru-han-purple-400">
              &lt;
          </button>
          {getPaginationButton(pages)}
          <button className="m-1 p-1 font-bold text-miru-han-purple-400">
              &gt;
          </button>
        </div>
        }
      </div>
      <div className="p-2  flex justify-self-end bg-rose-400 justify-center items-center w-1/3">
        <select onChange={handleSelectChange} className="p-2 text-miru-han-purple-1000 text-xs font-bold">
          <option value="30">30</option>
          <option value="40">40</option>
          <option value="50">50</option>
        </select>
        <span className="p-2 text-xs">invoices per page</span>
      </div>
    </div>
  );
};

export default Pagination;
