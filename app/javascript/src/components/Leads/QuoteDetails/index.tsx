import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import leadLineItems from "apis/lead-line-items";
import leadQuotes from "apis/lead-quotes";
import { Formik, Form } from "formik";
import Header from "./Header";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadLineItemList } from "../../../mapper/lead.lineItem.mapper";
import { unmapLeadQuoteDetails } from "../../../mapper/lead.quote.mapper";

const getInitialvalues = (leadQuote) => ({
  lead_line_item_ids: leadQuote.lead_line_item_ids
});

const LeadList = () => {
  const [apiError, setApiError] = useState<string>("");

  const [leadDetails, setLeadDetails] = useState<any>({});
  const [leadLineItemList, setLeadLineItemList] = useState<any>(null);
  const [leadLineItemIdList, setLeadLineItemIdList] = useState<any>({ leadLineItemIds: [] });
  const { leadId } = useParams();
  const { quoteId } = useParams();

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    leadQuotes.show(leadId, quoteId, "")
      .then((res) => {
        const sanitized = unmapLeadQuoteDetails(res);
        setLeadDetails(sanitized.leadDetails);
      });
    leadLineItems.index(leadId, "")
      .then((res) => {
        const sanitized = unmapLeadLineItemList(res);
        setLeadLineItemList(sanitized.itemList);
      });
  }, [leadId]);

  const handleSubmit = async () => {
    await leadQuotes.updateLineItems(leadId, quoteId, leadLineItemIdList.leadLineItemIds).then(() => {
      // document.location.reload();
    }).catch((e) => {
      setApiError(e.message);
    });
  };

  const handleMultiSelect = (selectVal) => {
    setLeadLineItemIdList({ leadLineItemIds: (leadLineItemIdList.leadLineItemIds + selectVal) })
  };

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header leadDetails={leadDetails} />
      <Formik
        initialValues={getInitialvalues(leadDetails)}
        enableReinitialize={true}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form className="mb-4 md:flex md:flex-wrap md:justify-between">
            <div className="my-6">
              <div className="p-4 max-w-sm bg-white rounded-lg border shadow-md sm:p-6 dark:bg-gray-800 dark:border-gray-700">
                <ul className="my-4 space-y-3">
                  <li>
                    <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                      <span className="flex-1 ml-3 whitespace-nowrap">Line Item</span>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
                        <select
                          className="form-multiselect block w-full mt-1"
                          name="lead_line_item_ids" multiple  onChange={(e) => handleMultiSelect(e.target.value)} >
                          <option value=''>Select Line Item</option>
                          {leadLineItemList &&
                            leadLineItemList.map(e => <option value={e.id} key={e.id} selected={leadDetails.lead_line_item_ids && leadDetails.lead_line_item_ids.includes(e.id)}>{e.name}</option>)}
                        </select>
                      </span>
                    </div>
                    {errors.industry_code && touched.industry_code &&
                      <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                        <span className="flex-1 ml-3 whitespace-nowrap"></span>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
                          <div className="tracking-wider block text-xs text-red-600">
                            {errors.industry_code}
                          </div>
                        </span>
                      </div>
                    }
                  </li>
                </ul>
              </div>
            </div>
            <div className="my-6">
              <p className="tracking-wider mt-3 block text-xs text-red-600">{apiError}</p>
              <div className="actions mt-4">
                <input
                  type="submit"
                  name="commit"
                  value="SAVE CHANGES"
                  className="form__input_submit"
                />
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default LeadList;
