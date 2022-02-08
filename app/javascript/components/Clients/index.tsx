import * as React from "react";
import { useEffect, useState } from "react";

import { registerIntercepts, setAuthHeaders } from "apis/axios";
import { fetchClients, IClient } from "apis/clients";

import Client from "./Client";

const Clients = ({ searchIcon, plusIcon, editIcon, deleteIcon }) => {
  const [clients, setClients] = useState<IClient[]>([]);

  const fetchData = async () => {
    const clients = await fetchClients();
    setClients(clients);
  };

  useEffect(() => {
    registerIntercepts();
    setAuthHeaders();
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-2 md:px-11 font-manrope">
      <div className="px-5">
        <div>
          <div className="sm:flex sm:items-center sm:justify-between mt-6 mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-extrabold leading-7 text-gray-900 sm:text-4xl sm:truncate py-1">
                Clients
              </h2>
            </div>
            <div className="mt-6 flex sm:mt-0 md:ml-4 items-center sm:w-4/6">
              <div className="mt-1 relative rounded-md shadow-sm md:ml-10">
                <input
                  type="search"
                  className="rounded tracking-wider appearance-none border border-gray-100 block w-72 sm:w-96 px-3 py-2 bg-miru-gray-100 h-8 shadow-sm font-semibold text-xs text-miru-dark-purple-1000 focus:outline-none focus:ring-miru-gray-1000 focus:border-miru-gray-1000 sm:text-sm"
                  placeholder="Search"
                />
                <button className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                  <img
                    src={searchIcon}
                    className="h-3 w-3 text-miru-gray-400"
                  />
                </button>
              </div>
            </div>
            <div className="mt-6 flex sm:mt-0 md:ml-4">
              <button
                type="button"
                className="ml-2 tracking-widest inline-flex items-center h-10 w-full flex justify-center py-1 px-4 border-2 border-miru-han-purple-1000 shadow-sm bg-transparent hover:border-miru-han-purple-600 focus:outline-none rounded text-base font-sans font-medium text-miru-han-purple-1000 bg-transparent hover:text-miru-han-purple-600 cursor-pointer"
              >
                <img src={plusIcon} className="-ml-0.5 mr-2 h-4 w-4 " />
                NEW CLIENT
              </button>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="overflow-hidden border-b-2 border-miru-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 mt-4">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-5 text-left text-sm font-semibold text-miru-dark-purple-600 tracking-wider"
                        >
                          CLIENT
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-5 text-left text-sm font-semibold text-miru-dark-purple-600 tracking-wider"
                        >
                          EMAIL ID
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-5 text-right text-sm font-semibold text-miru-dark-purple-600 tracking-wider"
                        >
                          HOURS LOGGED
                        </th>
                        <th scope="col" className="relative px-6 py-3"></th>
                        <th scope="col" className="relative px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clients.map((client, index) => (
                        <Client
                          key={index}
                          {...client}
                          editIcon={editIcon}
                          deleteIcon={deleteIcon}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clients;
