import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/solid";
import { setAuthHeaders, registerIntercepts } from "apis/axios";

const Invoices = () => {
  React.useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <>
      <div className="bg-gray-50 p-5 mt-5 w-full flex items-stretch">
        <div className="flex flex-col justify-start my-5 pl-8 w-full border-r-2 border-gray-200">
          <p className="font-light tracking-wider">OVERDUE</p>
          <p className="text-5xl font-light mt-3 tracking-wider">$35.5k</p>
        </div>
        <div className="flex flex-col justify-start my-5 pl-8 w-full border-r-2 border-gray-200">
          <p className="font-light tracking-wider">OUTSTANDING</p>
          <p className="text-5xl font-light mt-3 tracking-wider">$24.3k</p>
        </div>
        <div className="flex flex-col justify-start my-5 pl-8 w-full ">
          <p className="font-light tracking-wider">AMOUNT IN DRAFT</p>
          <p className="text-5xl font-light mt-3 tracking-wider">$24.5k</p>
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200 mt-4">
        <thead>
          <tr>
            <th scope="col">
              <input type="checkbox" />
            </th>
            <th
              scope="col"
              className="px-6 py-5 text-left text-sm font-light text-miru-dark-purple-600 tracking-wider"
            >
              CLIENT/INVOICE NO.
            </th>
            <th
              scope="col"
              className="px-6 py-5 text-left text-sm font-light text-miru-dark-purple-600 tracking-wider"
            >
              ISSUED DATE/DUE DATE
            </th>
            <th
              scope="col"
              className="px-6 py-5 text-center text-sm font-light text-miru-dark-purple-600 tracking-wider"
            >
              AMOUNT
            </th>
            <th
              scope="col"
              className="px-6 py-5 text-center text-sm font-light text-miru-dark-purple-600 tracking-wider"
            >
              STATUS
            </th>
            <th scope="col" className="relative px-6 py-3"></th>
            <th scope="col" className="relative px-6 py-3"></th>
          </tr>
        </thead>

        <tbody className="bg-white min-w-full divide-y divide-gray-200">
          <tr>
            <td>
              <input type="checkbox" className="" id="check1" />
              {/* <label htmlFor="check1" className="border-miru-han-purple-1000 border-2 rounded px-2"></label> */}
            </td>
            <td className="px-6 py-5 text-left font-medium w-2/4 ftracking-wider">
              <h1 className="text-left font-bold">Amazon</h1>
              <h3 className="text-left font-light">78388</h3>
            </td>
            <td className="px-6 py-5 text-left font-medium w-1/4 tracking-wider">
              <h1 className="text-left font-bold">Amazon</h1>
              <h3 className="text-left font-light">78388</h3>
            </td>
            <td className="px-6 py-5 text-left font-bold text-lg tracking-wider">
              $1975
            </td>
            <td className="px-6 py-5 text-left font-medium tracking-wider">
              <span className="rounded-xl text-sm px-1 bg-miru-alert-yellow-400">
                DRAFT
              </span>
            </td>
            <td className="px-6 py-5 text-left font-medium tracking-wider">
              <button>edit</button>
            </td>
            <td className="text-left w-full">
              <button>delete</button>
            </td>
          </tr>

          <tr>
            <td>
              <input type="checkbox" className="miru-dark-purpule-600" />
            </td>
            <td className="px-6 py-5 text-left font-medium   ftracking-wider">
              <h1 className="text-left font-bold">Amazon</h1>
              <h3 className="text-left font-light">78388</h3>
            </td>
            <td className="px-6 py-5 text-left font-  tracking-wider">
              <h1 className="text-left font-bold">Amazon</h1>
              <h3 className="text-left font-light">78388</h3>
            </td>
            <td className="px-6 py-5 text-left font-bold text-lg tracking-wider">
              $1975
            </td>
            <td className="px-6 py-5 text-left font-medium tracking-wider">
              <span className="rounded-xl text-sm px-1 bg-miru-alert-pink-400">
                OVERDUE
              </span>
            </td>
            <td className="px-6 py-5 text-left font-medium tracking-wider">
              <button>edit</button>
            </td>
            <td className="text-left w-full">
              <button>delete</button>
            </td>
          </tr>

          <tr>
            <td>
              <input type="checkbox" className="bg-miru-han-purpule-600" />
            </td>
            <td className="px-6 py-5 text-left font-medium   ftracking-wider">
              <h1 className="text-left font-bold">Amazon</h1>
              <h3 className="text-left font-light">78388</h3>
            </td>
            <td className="px-6 py-5 text-left font-medium  tracking-wider">
              <h1 className="text-left font-bold">Amazon</h1>
              <h3 className="text-left font-light">78388</h3>
            </td>
            <td className="px-6 py-5 text-left font-bold text-lg tracking-wider">
              $1975
            </td>
            <td className="px-6 py-5 text-left font-medium tracking-wider">
              <span className="rounded-xl text-sm px-1 bg-miru-alert-green-400">
                SENT
              </span>
            </td>
            <td className="px-6 py-5 text-left font-medium tracking-wider">
              <button>edit</button>
            </td>
            <td className="text-left w-full">
              <button>delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="p-2 mt-2 flex justify-evenly w-full">
        <div className="p-2 flex justify-center w-2/3">
          <button className="m-1 p-1 font-bold text-miru-han-purple-400">
            previous
          </button>
          <button className="m-1 p-1 font-bold text-miru-han-purple-400">
            1
          </button>
          <button className="m-1 p-1 font-bold text-miru-han-purple-400">
            2
          </button>
          <button className="m-1 p-1 font-bold text-miru-han-purple-400">
            3
          </button>
          <button className="m-1 p-1 font-bold text-miru-han-purple-400">
            4
          </button>
          <button className="m-1 p-1 font-bold text-miru-han-purple-400">
            5
          </button>
          <button className="m-1 p-1 font-bold text-miru-han-purple-400">
            Next
          </button>
        </div>
        <div className="p-2  flex justify-center w-1/3">
          <span className="p-2 mt-1 text-miru-han-purple-1000 font-medium">
            30
          </span>{" "}
          <span className="p-2 text-sm">invoices per page</span>
        </div>
      </div>
    </>
  );
};

export default Invoices;
