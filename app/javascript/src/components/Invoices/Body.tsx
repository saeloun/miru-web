import * as React from "react";
import Pagination from "./Pagination";
import Table from "./Table";

const Body = () => {
  return (
    <React.Fragment>
      <div className="bg-gray-50 p-5 mt-5 w-full flex items-stretch text-miru-dark-purple-1000">
        <div className="flex flex-col justify-start my-5 pl-8 w-full border-r-2 border-gray-200">
          <p className="font-normal text-sm tracking-wider">OVERDUE</p>
          <p className="text-5xl font-normal mt-3 tracking-wider">$35.5k</p>
        </div>
        <div className="flex flex-col justify-start my-5 pl-8 w-full border-r-2 border-gray-200">
          <p className="font-normal text-sm tracking-wider">OUTSTANDING</p>
          <p className="text-5xl font-normal mt-3 tracking-wider ">$24.3k</p>
        </div>
        <div className="flex flex-col justify-start my-5 pl-8 w-full ">
          <p className="font-normal text-sm tracking-wider">AMOUNT IN DRAFT</p>
          <p className="text-5xl font-normal mt-3 tracking-wider ">$24.5k</p>
        </div>
      </div>
      <div>
        <Table/>
      </div>
      <Pagination />
    </React.Fragment>
  );
};

export default Body;
