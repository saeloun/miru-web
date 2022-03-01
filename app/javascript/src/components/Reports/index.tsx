import * as React from "react";

const Reports = () => {
  return (
    <>
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden border-b-2 border-miru-gray-200">
              <table className="min-w-full divide-y divide-gray-200 mt-4">
                <thead>
                  <tr className="flex flex-row justify-between items-center">
                    <th
                      scope="col"
                      className="px-6 py-5 text-left text-sm font-semibold text-miru-dark-purple-600 tracking-wider"
                    >
                      PROJECT/
                      <br />
                      CLIENT
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-5 text-left text-sm font-semibold text-miru-dark-purple-600 tracking-wider"
                    >
                      NOTE
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-5 text-left text-sm font-semibold text-miru-dark-purple-600 tracking-wider"
                    >
                      TEAM MEMBER/
                      <br />
                      DATE
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-5 text-left text-sm font-semibold text-miru-dark-purple-600 tracking-wider"
                    >
                      HOURS
                      <br />
                      LOGGED
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Reports;
