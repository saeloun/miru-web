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
  description: lead.description,
  budget_amount: lead.budget_amount,
  budget_status_code: lead.budget_status_code,
  industry_code: lead.industry_code,
  quality_code: lead.quality_code,
  state_code: lead.state_code,
  status_code: lead.status_code,
  donotemail: lead.donotemail,
  donotbulkemail: lead.donotbulkemail,
  donotfax: lead.donotfax,
  donotphone: lead.donotphone
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
        "description": values.description,
        "budget_status_code": budgetStatusCode || values.budget_status_code,
        "industry_code": industryCode || values.industry_code,
        "quality_code": qualityCode || values.quality_code,
        "state_code": stateCode || values.state_code,
        "status_code": statusCode || values.status_code,
        "donotemail": values.donotemail,
        "donotbulkemail": values.donotbulkemail,
        "donotfax": values.donotfax,
        "donotphone": values.donotphone
      }
    }).then(() => {
      document.location.reload();
    }).catch((e) => {
      setApiError(e.message);
    });
  };

  return (
    <React.Fragment>

      <Formik
        initialValues={getInitialvalues(leadDetails)}
        validationSchema={newLeadSchema}
        enableReinitialize={true}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form>
            <div className="grid grid-cols-2 gap-6 justify-evenly">
              <div className="relative flex flex-col items-start justify-start p-5 bg-white">
                <div className="relative w-full mt-6 space-y-8">
                  {/* <h4 className="w-full text-4xl font-medium leading-snug">Details</h4> */}
                  <div className="relative">
                    <label className="absolute px-2 ml-2 -mt-3 font-medium text-gray-600 bg-white">Budget Amount</label>
                    <Field className="block w-full px-2 py-3 mt-2 text-base placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-black"
                      name="budget_amount" type="number" min="0" placeholder="Budget Amount" />
                    <div className="tracking-wider block text-xs text-red-600">
                      {errors.budget_amount && touched.budget_amount &&
                        <div>{errors.budget_amount}</div>
                      }
                    </div>
                  </div>
                  <div className="relative">
                    <label className="absolute px-2 ml-2 -mt-3 font-medium text-gray-600 bg-white">Budget Status</label>
                    <select
                      defaultValue={leadDetails.budget_status_code}
                      className="block w-full px-2 py-3 mt-2 text-base placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-black"
                      name="budget_status_code" onChange={(e) => setBudgetStatusCode(e.target.value)}>
                      <option value=''>Select Budget Status</option>
                      {budgetStatusCodeList &&
              budgetStatusCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.budget_status_code}>{e.name}</option>)}
                    </select>
                    <div className="tracking-wider block text-xs text-red-600">
                      {errors.budget_status_code && touched.budget_status_code &&
                        <div>{errors.budget_status_code}</div>
                      }
                    </div>
                  </div>
                  <div className="relative">
                    <label className="absolute px-2 ml-2 -mt-3 font-medium text-gray-600 bg-white">Industry</label>
                    <select
                      defaultValue={leadDetails.industry_code}
                      className="block w-full px-2 py-3 mt-2 text-base placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-black"
                      name="industry_code" onChange={(e) => setIndustryCode(e.target.value)}>
                      <option value=''>Select Industry</option>
                      {industryCodeList &&
              industryCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.industry_code}>{e.name}</option>)}
                    </select>
                    <div className="tracking-wider block text-xs text-red-600">
                      {errors.industry_code && touched.industry_code &&
                        <div>{errors.industry_code}</div>
                      }
                    </div>
                  </div>
                  <div className="relative">
                    <label className="absolute px-2 ml-2 -mt-3 font-medium text-gray-600 bg-white">Quality</label>
                    <select
                      defaultValue={leadDetails.quality_code}
                      className="block w-full px-2 py-3 mt-2 text-base placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-black"
                      name="quality_code" onChange={(e) => setQualityCode(e.target.value)}>
                      <option value=''>Select Quality</option>
                      {qualityCodeList &&
              qualityCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.quality_code}>{e.name}</option>)}
                    </select>
                    <div className="tracking-wider block text-xs text-red-600">
                      {errors.quality_code && touched.quality_code &&
                        <div>{errors.quality_code}</div>
                      }
                    </div>
                  </div>
                  <div className="relative">
                    <label className="absolute px-2 ml-2 -mt-3 font-medium text-gray-600 bg-white">State</label>
                    <select
                      defaultValue={leadDetails.state_code}
                      className="block w-full px-2 py-3 mt-2 text-base placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-black"
                      name="state_code" onChange={(e) => setStateCode(e.target.value)}>
                      <option value=''>Select State</option>
                      {stateCodeList &&
              stateCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.state_code}>{e.name}</option>)}
                    </select>
                    <div className="tracking-wider block text-xs text-red-600">
                      {errors.state_code && touched.state_code &&
                        <div>{errors.state_code}</div>
                      }
                    </div>
                  </div>
                  <div className="relative">
                    <label className="absolute px-2 ml-2 -mt-3 font-medium text-gray-600 bg-white">Status</label>
                    <select
                      defaultValue={leadDetails.status_code}
                      className="block w-full px-2 py-3 mt-2 text-base placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-black"
                      name="status_code" onChange={(e) => setStatusCode(e.target.value)}>
                      <option value=''>Select Status</option>
                      {statusCodeList &&
              statusCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.status_code}>{e.name}</option>)}
                    </select>
                    <div className="tracking-wider block text-xs text-red-600">
                      {errors.status_code && touched.status_code &&
                        <div>{errors.status_code}</div>
                      }
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative flex flex-col items-start justify-start p-5 bg-white">
                <p className="tracking-wider mt-3 block text-xs text-red-600">{apiError}</p>
                <div className="actions mt-4">
                  <input
                    type="submit"
                    name="commit"
                    value="SAVE CHANGES"
                    className="form__input_submit"
                  />
                </div>
                <div className="relative w-full mt-6 space-y-8 ">
                  {/* <h4 className="w-full text-4xl font-medium leading-snug">Preferences</h4> */}
                  <div className="relative flex items-start mb-4">
                    <label className="flex font-medium text-gray-600 bg-white">
                      <div className=" items-center h-5">
                        <Field className="bg-gray-50 border-gray-300 focus:ring-3 focus:ring-blue-300 h-4 w-4 rounded" type="checkbox" name="donotemail" />
                      </div>
                      <div className="text-sm ml-3">
                        Do not email
                      </div>
                    </label>
                  </div>
                  <div className="relative flex items-start mb-4">
                    <label className="flex font-medium text-gray-600 bg-white">
                      <div className=" items-center h-5">
                        <Field className="bg-gray-50 border-gray-300 focus:ring-3 focus:ring-blue-300 h-4 w-4 rounded" type="checkbox" name="donotbulkemail" />
                      </div>
                      <div className="text-sm ml-3">
                        Do not bulk email
                      </div>
                    </label>
                  </div>
                  <div className="relative flex items-start mb-4">
                    <label className="flex font-medium text-gray-600 bg-white">
                      <div className=" items-center h-5">
                        <Field className="bg-gray-50 border-gray-300 focus:ring-3 focus:ring-blue-300 h-4 w-4 rounded" type="checkbox" name="donotfax" />
                      </div>
                      <div className="text-sm ml-3">
                        Do not fax
                      </div>
                    </label>
                  </div>
                  <div className="relative flex items-start mb-4">
                    <label className="flex font-medium text-gray-600 bg-white">
                      <div className=" items-center h-5">
                        <Field className="bg-gray-50 border-gray-300 focus:ring-3 focus:ring-blue-300 h-4 w-4 rounded" type="checkbox" name="donotphone" />
                      </div>
                      <div className="text-sm ml-3">
                      Do not Phone
                      </div>
                    </label>
                  </div>
                </div>
                <div className="relative w-full mt-6 space-y-8">
                  <div className="relative">
                    <label className="absolute px-2 ml-2 -mt-3 font-medium text-gray-600 bg-white">Description</label>
                    <Field className="block w-full px-2 py-3 mt-2 text-base placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-black"
                      name="description" as="textarea" rows={8} placeholder="Description" />
                    <div className="tracking-wider block text-xs text-red-600">
                      {errors.description && touched.description &&
                        <div>{errors.description}</div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </React.Fragment>
  );
};

export default Summary;
