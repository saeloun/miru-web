import React, { useEffect, useState } from "react";
import leadItemsApi from "apis/lead-items";
import leads from "apis/leads";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const newLeadSchema = Yup.object().shape({
  name: Yup.string().required("Name cannot be blank"),
  budget_amount: Yup.number().typeError("Invalid budget amount"),
  // budget_status_code: Yup.number().required("Budget Status cannot be blank"),
  // industry_code: Yup.number().required("Industry cannot be blank"),
  // quality_code: Yup.number().required("Quality cannot be blank"),
  // state_code: Yup.number().required("State cannot be blank"),
  // status_code: Yup.number().required("Status cannot be blank")
});

const getInitialvalues = (lead) => ({
  name: lead.name,
  budget_amount: lead.budget_amount,
  budget_status_code: lead.budget_status_code,
  industry_code: lead.industry_code,
  quality_code: lead.quality_code,
  state_code: lead.state_code,
  status_code: lead.status_code
});

const Summary = ({ leadDetails }) => {

  const [apiError, setApiError] = useState<string>("");

  const [budgetStatusCodeList, setBudgetStatusCodeList] = useState<any>(null);
  const [industryCodeList, setIndustryCodeList] = useState<any>(null);
  const [qualityCodeList, setQualityCodeList] = useState<any>(null);
  const [stateCodeList, setStateCodeList] = useState<any>(null);
  const [statusCodeList, setStatusCodeList] = useState<any>(null);

  const [budgetStatusCode, setBudgetStatusCode] = useState<any>(null);
  const [industryCode, setIndustryCode] = useState<any>(null);
  const [qualityCode, setQualityCode] = useState<any>(null);
  const [stateCode, setStateCode] = useState<any>(null);
  const [statusCode, setStatusCode] = useState<any>(null);

  useEffect(() => {
    const getLeadItems = async () => {
      leadItemsApi.get()
        .then((data) => {
          setBudgetStatusCodeList(data.data.budget_status_codes);
          setIndustryCodeList(data.data.industry_codes);
          setQualityCodeList(data.data.quality_codes);
          setStateCodeList(data.data.state_codes);
          setStatusCodeList(data.data.status_codes);
        }).catch(() => {
          setBudgetStatusCodeList({});
          setIndustryCodeList({});
          setQualityCodeList({});
          setStateCodeList({});
          setStatusCodeList({});
        });
    };

    getLeadItems();
  }, []);

  const handleSubmit = async values => {
    await leads.update(leadDetails.id, {
      lead: {
        "budget_amount": values.budget_amount,
        "budget_status_code": budgetStatusCode || values.budget_status_code,
        "industry_code": industryCode || values.industry_code,
        "quality_code": qualityCode || values.quality_code,
        "state_code": stateCode || values.state_code,
        "status_code": statusCode || values.status_code
      }
    }).then(() => {
      document.location.reload();
    }).catch((e) => {
      setApiError(e.message);
    });
  };

  return (
    <>
      <Formik
        initialValues={getInitialvalues(leadDetails)}
        validationSchema={newLeadSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form className="mb-4 md:flex md:flex-wrap md:justify-between">
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
                      <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
                        <Field className={`form__input rounded tracking-wider border block w-full px-3 py-2 bg-miru-gray-100 shadow-sm text-xs text-miru-dark-purple-1000 focus:outline-none ${errors.budget_amount && touched.budget_amount && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="budget_amount" type="number" min="0" />
                      </span>
                    </div>
                    {errors.budget_amount && touched.budget_amount &&
                      <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                        <span className="flex-1 ml-3 whitespace-nowrap"></span>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
                          <div className="tracking-wider block text-xs text-red-600">
                            {errors.budget_amount}
                          </div>
                        </span>
                      </div>
                    }
                  </li>
                  <li>
                    <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                      <span className="flex-1 ml-3 whitespace-nowrap">Budget Status</span>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
                        <select
                          defaultValue={leadDetails.budget_status_code}
                          className="rounded border-0 block w-full px-2 py-1 bg-miru-gray-100 h-8 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base"
                          name="budget_status_code" onChange={(e) => setBudgetStatusCode(e.target.value)}>
                          <option value=''>Select Budget Status</option>
                          {budgetStatusCodeList &&
                            budgetStatusCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.budget_status_code}>{e.name}</option>)}
                        </select>
                      </span>
                    </div>
                    {errors.budget_status_code && touched.budget_status_code &&
                      <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                        <span className="flex-1 ml-3 whitespace-nowrap"></span>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
                          <div className="tracking-wider block text-xs text-red-600">
                            {errors.budget_status_code}
                          </div>
                        </span>
                      </div>
                    }
                  </li>
                  <li>
                    <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                      <span className="flex-1 ml-3 whitespace-nowrap">Industry</span>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
                        <select
                          defaultValue={leadDetails.industry_code}
                          className="rounded border-0 block w-full px-2 py-1 bg-miru-gray-100 h-8 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base"
                          name="industry_code" onChange={(e) => setIndustryCode(e.target.value)}>
                          <option value=''>Select Industry</option>
                          {industryCodeList &&
                            industryCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.industry_code}>{e.name}</option>)}
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
                  <li>
                    <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                      <span className="flex-1 ml-3 whitespace-nowrap">Quality</span>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
                        <select
                          defaultValue={leadDetails.quality_code}
                          className="rounded border-0 block w-full px-2 py-1 bg-miru-gray-100 h-8 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base"
                          name="quality_code" onChange={(e) => setQualityCode(e.target.value)}>
                          <option value=''>Select Quality</option>
                          {qualityCodeList &&
                            qualityCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.quality_code}>{e.name}</option>)}
                        </select>
                      </span>
                    </div>
                    {errors.quality_code && touched.quality_code &&
                      <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                        <span className="flex-1 ml-3 whitespace-nowrap"></span>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
                          <div className="tracking-wider block text-xs text-red-600">
                            {errors.quality_code}
                          </div>
                        </span>
                      </div>
                    }
                  </li>
                  <li>
                    <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                      <span className="flex-1 ml-3 whitespace-nowrap">State</span>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
                        <select
                          defaultValue={leadDetails.state_code}
                          className="rounded border-0 block w-full px-2 py-1 bg-miru-gray-100 h-8 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base"
                          name="state_code" onChange={(e) => setStateCode(e.target.value)}>
                          <option value=''>Select State</option>
                          {stateCodeList &&
                            stateCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.state_code}>{e.name}</option>)}
                        </select>
                      </span>
                    </div>
                    {errors.state_code && touched.state_code &&
                      <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                        <span className="flex-1 ml-3 whitespace-nowrap"></span>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
                          <div className="tracking-wider block text-xs text-red-600">
                            {errors.state_code}
                          </div>
                        </span>
                      </div>
                    }
                  </li>
                  <li>
                    <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                      <span className="flex-1 ml-3 whitespace-nowrap">Status</span>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
                        <select
                          defaultValue={leadDetails.status_code}
                          className="rounded border-0 block w-full px-2 py-1 bg-miru-gray-100 h-8 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base"
                          name="status_code" onChange={(e) => setStatusCode(e.target.value)}>
                          <option value=''>Select Status</option>
                          {statusCodeList &&
                            statusCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.status_code}>{e.name}</option>)}
                        </select>
                      </span>
                    </div>
                    {errors.status_code && touched.status_code &&
                      <div className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                        <span className="flex-1 ml-3 whitespace-nowrap"></span>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
                          <div className="tracking-wider block text-xs text-red-600">
                            {errors.status_code}
                          </div>
                        </span>
                      </div>
                    }
                  </li>
                </ul>

                {/* <div>
                  <a href="#" className="inline-flex items-center text-xs font-normal text-gray-500 hover:underline dark:text-gray-400">
                        Why do I need to connect with my wallet?</a>
                </div> */}
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

export default Summary;
