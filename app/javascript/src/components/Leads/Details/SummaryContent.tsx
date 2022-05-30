import React from "react";

const SummaryContent = ({ leadDetails }) =>

// const [renderTabData, setRenderTabData] = useState<any>(null);

  (
    <>
      <div className="my-6">
        <div className="p-4 max-w-sm bg-white rounded-lg border shadow-md sm:p-6 dark:bg-gray-800 dark:border-gray-700">
          {/* <h5 className="mb-3 text-base font-semibold text-gray-900 lg:text-xl dark:text-white">
              Connect wallet
          </h5>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Connect with one of our available wallet providers or create a new one.</p> */}
          <ul className="my-4 space-y-3">
            <li>
              <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                <span className="flex-1 ml-3 whitespace-nowrap">Budget Amount</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">{leadDetails.budget_amount}</span>
              </div>
            </li>
            <li>
              <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                <span className="flex-1 ml-3 whitespace-nowrap">Budget Status</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">{leadDetails.budget_status_code}</span>
              </div>
            </li>
            <li>
              <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                <span className="flex-1 ml-3 whitespace-nowrap">Industry</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">{leadDetails.industry_code}</span>
              </div>
            </li>
            <li>
              <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                <span className="flex-1 ml-3 whitespace-nowrap">Quality</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">{leadDetails.quality_code}</span>
              </div>
            </li>
            <li>
              <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                <span className="flex-1 ml-3 whitespace-nowrap">State</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">{leadDetails.state_code}</span>
              </div>
            </li>
            <li>
              <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                <span className="flex-1 ml-3 whitespace-nowrap">Status</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">{leadDetails.status_code}</span>
              </div>
            </li>
          </ul>
          {/* <div>
            <a href="#" className="inline-flex items-center text-xs font-normal text-gray-500 hover:underline dark:text-gray-400">
                  Why do I need to connect with my wallet?</a>
          </div> */}
        </div>
      </div>
    </>
  )
;

export default SummaryContent;
