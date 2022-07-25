import React, { useEffect, useState } from "react";
import leadItemsApi from "apis/lead-items";
import leads from "apis/leads";
import { Formik, Form, Field, FieldArray } from "formik";
import { Multiselect } from 'multiselect-react-dropdown';
import * as Yup from "yup";
import { unmapLeadDetails } from "../../../mapper/lead.mapper";

const newLeadSchema = Yup.object().shape({
  first_name: Yup.string().required("First Name cannot be blank"),
  last_name: Yup.string().required("Last Name cannot be blank"),
  budget_amount: Yup.number().nullable().typeError("Invalid budget amount"),
  email: Yup.string().nullable().email("Invalid email ID"),
  mobilephone: Yup.number().nullable().typeError("Invalid mobilephone"),
  telephone: Yup.number().nullable().typeError("Invalid telephone"),
  emails: Yup.array().min(0).of(Yup.string().nullable().email("Invalid email ID"))
});

const getInitialvalues = (lead) => ({
  name: lead.name,
  description: lead.description,
  budget_amount: lead.budget_amount,
  budget_status_code: lead.budget_status_code,
  industry_code: lead.industry_code,
  donotemail: lead.donotemail,
  donotbulkemail: lead.donotbulkemail,
  donotfax: lead.donotfax,
  donotphone: lead.donotphone,
  need: lead.need,
  preferred_contact_method_code: lead.preferred_contact_method_code,
  initial_communication: lead.initial_communication,
  priority_code: lead.priority_code,
  first_name: lead.first_name,
  last_name: lead.last_name,
  source_code: lead.source_code,
  tech_stack_ids: lead.tech_stack_ids || [],
  emails: lead.emails || [],
  need_name: lead.need_name,
  preferred_contact_method_code_name: lead.preferred_contact_method_code_name,
  initial_communication_name: lead.initial_communication_name,
  source_code_name: lead.source_code_name,
  title: lead.title,
  email: lead.email,
  mobilephone: lead.mobilephone,
  telephone: lead.telephone,
  address: lead.address,
  country: lead.country,
  skypeid: lead.skypeid,
  linkedinid: lead.linkedinid
});

const Summary = ({
  leadDetails,
  setLeadDetails,
  isEdit,
  setFormRef }) => {

  const [apiError, setApiError] = useState<string>("");
  const [showButton, setShowButton] = useState(false);

  const [budgetStatusCodeList, setBudgetStatusCodeList] = useState<any>(null);
  const [industryCodeList, setIndustryCodeList] = useState<any>(null);
  const [needList, setNeedList] = useState<any>(null);
  const [preferredContactMethodCodeList, setPreferredContactMethodCodeList] = useState<any>(null);
  const [initialCommunicationList, setInitialCommunicationList] = useState<any>(null);
  const [sourceCodeList, setSourceCodeList] = useState<any>(null);
  const [countryList, setCountryList] = useState<any>(null);
  const [techStackList, setTechStackList] = useState<any>(null);
  const [selectedTechStacks, setSelectedTechStacks] = useState<any>(null);

  const [budgetStatusCode, setBudgetStatusCode] = useState<any>(null);
  const [industryCode, setIndustryCode] = useState<any>(null);
  const [need, setNeed] = useState<any>(null);
  const [preferredContactMethodCode, setPreferredContactMethodCode] = useState<any>(null);
  const [initialCommunication, setInitialCommunication] = useState<any>(null);
  const [sourceCode, setSourceCode] = useState<any>(null);
  const [country, setCountry] = useState<any>(null);
  const [techStacks, setTechStacks] = useState<any>([]);

  useEffect(() => {
    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const getLeadItems = async () => {
      leadItemsApi.get()
        .then((data) => {
          setBudgetStatusCodeList(data.data.budget_status_codes);
          setIndustryCodeList(data.data.industry_codes);
          setNeedList(data.data.needs);
          setPreferredContactMethodCodeList(data.data.preferred_contact_method_code_names);
          setInitialCommunicationList(data.data.initial_communications);
          setSourceCodeList(data.data.source_codes);
          setCountryList(data.data.countries);
          setTechStackList(data.data.tech_stacks);
        }).catch(() => {
          setBudgetStatusCodeList({});
          setIndustryCodeList({});
          setNeedList({});
          setPreferredContactMethodCodeList({});
          setInitialCommunicationList({});
          setSourceCodeList({});
          setCountryList({});
          setTechStackList({});
        });
    };

    getLeadItems();
  }, [leadDetails]);

  useEffect(() => {
    if (techStackList && leadDetails && leadDetails.tech_stack_ids && leadDetails.tech_stack_ids.length > 0){
      const sanitizedSelectedStackList = techStackList.filter(option =>
        leadDetails.tech_stack_ids.map(Number).includes(parseInt(option.id))
      );
      setSelectedTechStacks([...sanitizedSelectedStackList]);

      const stackArray = []
      sanitizedSelectedStackList.filter(option =>
        stackArray.push(parseInt(option.id))
      );
      setTechStacks(stackArray);
    }
  }, [techStackList]);

  const addRemoveStack = (selectedList) => {
    const newStackArray = []
    selectedList.filter(option =>
      newStackArray.push(parseInt(option.id))
    );
    setTechStacks(newStackArray);
  };

  const handleSubmit = async (values) => {

    await leads.update(leadDetails.id, {
      lead: {
        "title": values.title,
        "first_name": values.first_name,
        "last_name": values.last_name,
        "email": values.email,
        "budget_amount": values.budget_amount,
        "description": values.description,
        "budget_status_code": budgetStatusCode || values.budget_status_code,
        "industry_code": industryCode || values.industry_code,
        "donotemail": values.donotemail,
        "donotbulkemail": values.donotbulkemail,
        "donotfax": values.donotfax,
        "donotphone": values.donotphone,
        "need": need || values.need,
        "preferred_contact_method_code": preferredContactMethodCode || values.preferred_contact_method_code,
        "initial_communication": initialCommunication || values.initial_communication,
        "source_code": sourceCode || values.source_code,
        "address": values.address,
        "country": country || values.country,
        "skypeid": values.skypeid,
        "linkedinid": values.linkedinid,
        "emails": values.emails || [],
        "mobilephone": values.mobilephone,
        "telephone": values.telephone,
        "tech_stack_ids": techStacks ? techStacks.map(Number) : []
      }
    }).then((res) => {
      setLeadDetails(unmapLeadDetails(res).leadDetails);
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
        {({ errors, touched, values }) => (
          <Form ref={ref => setFormRef(ref)}>
            <div className="bg-white dark:bg-gray-800">
              <p className="tracking-wider mt-3 block text-xs text-red-600">{apiError}</p>
              <div className="container mx-auto bg-white dark:bg-gray-800 rounded">
                <div className="mx-auto">
                  <div className="grid gap-4 grid-cols-2">
                    <div className="mx-auto xl:mx-0">
                      <div className="mt-8 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Title</label>
                        <Field className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="title" placeholder="Title" disabled={!isEdit} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.title && touched.title &&
                            <p className="text-xs">{`${errors.title}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">First Name</label>
                        <Field className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="first_name" placeholder="First Name" disabled={!isEdit} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.first_name && touched.first_name &&
                            <p className="text-xs">{`${errors.first_name}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Last Name</label>
                        <Field className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="last_name" placeholder="Last Name" disabled={!isEdit} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.last_name && touched.last_name &&
                            <p className="text-xs">{`${errors.last_name}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Primary Email</label>
                        <Field className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="email" placeholder="Primary Email" disabled={!isEdit} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.email && touched.email &&
                            <p className="text-xs">{`${errors.email}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Other Emails</label>
                        <FieldArray name="emails">
                          {({ remove, push }) => (
                            <div>
                              {
                                values.emails && values.emails.length > 0 &&
                                  values.emails.map((email, index) => (
                                    <div className="grid grid-flow-row-dense grid-cols-12 gap-2" key={index}>
                                      <div className="col-span-11">
                                        <Field
                                          className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                                          name={`emails.${index}`}
                                          placeholder="Email"
                                          disabled={!isEdit}
                                        />
                                        <div className="flex justify-between items-center pt-1 text-red-700">
                                          {errors.emails && touched.emails &&
                                          <p className="text-xs">{`${errors.emails}`}</p>
                                          }
                                        </div>
                                      </div>
                                      {isEdit &&
                                        <div>
                                          <svg onClick={() => remove(index)} className="mt-2 fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                                        </div>
                                      }
                                    </div>
                                  ))
                              }
                              <button
                                type="button"
                                className="mt-4 w-2/6 header__button text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                                onClick={() => push('')}
                                disabled={!isEdit}
                              >
                                  Add Email
                              </button>
                            </div>
                          )}
                        </FieldArray>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Budget Status</label>
                        <select
                          defaultValue={leadDetails.budget_status_code}
                          className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="budget_status_code" onChange={(e) => setBudgetStatusCode(e.target.value)} disabled={!isEdit} >
                          <option value=''>Select Budget Status</option>
                          {budgetStatusCodeList &&
                            budgetStatusCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.budget_status_code}>{e.name}</option>)}
                        </select>
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.budget_status_code && touched.budget_status_code &&
                            <p className="text-xs">{`${errors.budget_status_code}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Budget Amount</label>
                        <Field className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="budget_amount" type="number" min="0" placeholder="Budget Amount" disabled={!isEdit} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.budget_amount && touched.budget_amount &&
                            <p className="text-xs">{`${errors.budget_amount}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Industry</label>
                        <select
                          defaultValue={leadDetails.industry_code}
                          className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="industry_code" onChange={(e) => setIndustryCode(e.target.value)} disabled={!isEdit} >
                          <option value=''>Select Industry</option>
                          {industryCodeList &&
                            industryCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.industry_code}>{e.name}</option>)}
                        </select>
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.industry_code && touched.industry_code &&
                            <p className="text-xs">{`${errors.industry_code}`}</p>
                          }
                        </div>
                      </div>
                    </div>
                    <div className="mx-auto xl:mx-0">
                      <div className="xl:w-full border-b border-gray-300 dark:border-gray-700 py-5">
                        <div className="flex w-11/12 mx-auto xl:w-full xl:mx-0 items-center">
                          <p className="text-lg text-gray-800 dark:text-gray-100 font-bold">More Information</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Need</label>
                        <select
                          defaultValue={leadDetails.need}
                          className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none
                          "
                          name="need" onChange={(e) => setNeed(e.target.value)} disabled={!isEdit} >
                          <option value=''>Select Need</option>
                          {needList &&
                            needList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.need}>{e.name}</option>)}
                        </select>
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.need && touched.need &&
                            <p className="text-xs">{`${errors.need}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Contact Method</label>
                        <select
                          defaultValue={leadDetails.preferred_contact_method_code}
                          className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="preferred_contact_method_code" onChange={(e) => setPreferredContactMethodCode(e.target.value)} disabled={!isEdit} >
                          <option value=''>Select Contact Method</option>
                          {preferredContactMethodCodeList &&
                            preferredContactMethodCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.preferred_contact_method_code}>{e.name}</option>)}
                        </select>
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.preferred_contact_method_code && touched.preferred_contact_method_code &&
                            <p className="text-xs">{`${errors.preferred_contact_method_code}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Source</label>
                        <select
                          defaultValue={leadDetails.source_code}
                          className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="source_code" onChange={(e) => setSourceCode(e.target.value)} disabled={!isEdit} >
                          <option value=''>Select Source</option>
                          {sourceCodeList &&
                            sourceCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.source_code}>{e.name}</option>)}
                        </select>
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.source_code && touched.source_code &&
                            <p className="text-xs">{`${errors.source_code}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Initial Communication</label>
                        <select
                          defaultValue={leadDetails.initial_communication}
                          className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="initial_communication" onChange={(e) => setInitialCommunication(e.target.value)} disabled={!isEdit} >
                          <option value=''>Select Initial Communication</option>
                          {initialCommunicationList &&
                            initialCommunicationList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.initial_communication}>{e.name}</option>)}
                        </select>
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.initial_communication && touched.initial_communication &&
                            <p className="text-xs">{`${errors.initial_communication}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Description</label>
                        <Field className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="description" as="textarea" rows={8} placeholder="Description" disabled={!isEdit} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.description && touched.description &&
                            <p className="text-xs">{`${errors.description}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Tech Stacks</label>
                        <Multiselect
                          selectedValues={selectedTechStacks}
                          options={techStackList ? techStackList : [{}]}
                          name="tech_stack_ids"
                          onSelect={((selectedList) => addRemoveStack(selectedList))}
                          onRemove={((selectedList) => addRemoveStack(selectedList))}
                          displayValue="name"
                          disable={!isEdit} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="container mx-auto bg-white dark:bg-gray-800 mt-6 rounded">
                <div className="xl:w-full border-b border-gray-300 dark:border-gray-700 py-5">
                  <div className="flex w-11/12 mx-auto xl:w-full xl:mx-0 items-center">
                    <p className="text-lg text-gray-800 dark:text-gray-100 font-bold">Contact Information</p>
                  </div>
                </div>
                <div className="mx-auto">
                  <div className="grid gap-4 grid-cols-2">
                    <div className="mx-auto xl:mx-0">
                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Country</label>
                        <select
                          defaultValue={leadDetails.country}
                          className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="industry_code" onChange={(e) => setCountry(e.target.value)} disabled={!isEdit} >
                          <option value=''>Select Country</option>
                          <option value="US" key="US">United States of America</option>
                          <option value="CA" key="CA">Canada</option>
                          <option value="IN" key="IN">India</option>
                          {countryList &&
                            countryList.map(e => <option value={e[0]} key={e[0]} selected={e[0] === leadDetails.country}>{e[1]}</option>)}
                        </select>
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.country && touched.country &&
                            <p className="text-xs">{`${errors.country}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Address</label>
                        <Field className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="address" as="textarea" rows={8} placeholder="Address" disabled={!isEdit} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.address && touched.address &&
                            <p className="text-xs">{`${errors.address}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Moobile Phone</label>
                        <Field className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="mobilephone" placeholder="Moobile Phone" disabled={!isEdit} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.mobilephone && touched.mobilephone &&
                            <p className="text-xs">{`${errors.mobilephone}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Tele Phone</label>
                        <Field className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="telephone" placeholder="Tele Phone" disabled={!isEdit} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.telephone && touched.telephone &&
                            <p className="text-xs">{`${errors.telephone}`}</p>
                          }
                        </div>
                      </div>
                    </div>
                    <div className="mx-auto xl:mx-0">
                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Skype ID</label>
                        <Field className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="skypeid" placeholder="Skpe ID" disabled={!isEdit} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.skypeid && touched.skypeid &&
                            <p className="text-xs">{`${errors.skypeid}`}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Linkedin ID</label>
                        <Field className="w-full border border-gray-400 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="linkedinid" placeholder="Linkedin ID" disabled={!isEdit} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.linkedinid && touched.linkedinid &&
                            <p className="text-xs">{`${errors.linkedinid}`}</p>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="container mx-auto mt-10 rounded bg-gray-100 dark:bg-gray-700 w-11/12 xl:w-full">
                <div className="xl:w-full py-5 px-8">
                  <div className="flex items-center mx-auto">
                    <div className="container mx-auto">
                      <div className="mx-auto xl:w-full">
                        <p className="text-lg text-gray-800 dark:text-gray-100 font-bold">Alerts</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 pt-1">Get updates of any new activity or features. Turn on/off your preferences</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="container mx-auto pb-6">
                  <div className="px-8">
                    <div className="flex justify-between items-center mb-8 mt-4">
                      <div className="w-9/12">
                        <p className="text-sm text-gray-800 dark:text-gray-100 pb-1">Do not email</p>
                      </div>
                      <div className="cursor-pointer rounded-full bg-gray-200 relative shadow-sm">
                        <Field id="cb1" type="checkbox" name="donotemail" className="focus:outline-none checkbox w-6 h-6 rounded-full bg-white dark:bg-gray-400 absolute shadow-sm appearance-none cursor-pointer border border-transparent top-0 bottom-0 m-auto switch-checkbox" disabled={!isEdit} />
                        <label htmlFor="cb1" className="toggle-label block w-12 h-4 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-800 cursor-pointer"></label>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-8 mt-4">
                      <div className="w-9/12">
                        <p className="text-sm text-gray-800 dark:text-gray-100 pb-1">Do not bulk email</p>
                      </div>
                      <div className="cursor-pointer rounded-full bg-gray-200 relative shadow-sm">
                        <Field id="cb2" type="checkbox" name="donotbulkemail" className="focus:outline-none checkbox w-6 h-6 rounded-full bg-white dark:bg-gray-400 absolute shadow-sm appearance-none cursor-pointer border border-transparent top-0 bottom-0 m-auto switch-checkbox" disabled={!isEdit} />
                        <label htmlFor="cb2" className="toggle-label block w-12 h-4 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-800 cursor-pointer"></label>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-8 mt-4">
                      <div className="w-9/12">
                        <p className="text-sm text-gray-800 dark:text-gray-100 pb-1">Do not fax</p>
                      </div>
                      <div className="cursor-pointer rounded-full bg-gray-200 relative shadow-sm">
                        <Field id="cb3" type="checkbox" name="donotfax" className="focus:outline-none checkbox w-6 h-6 rounded-full bg-white dark:bg-gray-400 absolute shadow-sm appearance-none cursor-pointer border border-transparent top-0 bottom-0 m-auto switch-checkbox" disabled={!isEdit} />
                        <label htmlFor="cb3" className="toggle-label block w-12 h-4 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-800 cursor-pointer"></label>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-8 mt-4">
                      <div className="w-9/12">
                        <p className="text-sm text-gray-800 dark:text-gray-100 pb-1">Do not Phone</p>
                      </div>
                      <div className="cursor-pointer rounded-full bg-gray-200 relative shadow-sm">
                        <Field id="cb4" type="checkbox" name="donotphone" className="focus:outline-none checkbox w-6 h-6 rounded-full bg-white dark:bg-gray-400 absolute shadow-sm appearance-none cursor-pointer border border-transparent top-0 bottom-0 m-auto switch-checkbox" disabled={!isEdit} />
                        <label htmlFor="cb4" className="toggle-label block w-12 h-4 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-800 cursor-pointer"></label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {showButton && (
                <button
                  type="button"
                  onClick={scrollToTop}
                  data-mdb-ripple="true"
                  data-mdb-ripple-color="light"
                  className="inline-block p-3 bg-miru-han-purple-1000 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-miru-han-purple-700 hover:shadow-lg focus:bg-miru-han-purple-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg transition duration-150 ease-in-out bottom-5 right-5 fixed"
                  id="btn-back-to-top"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fas"
                    className="w-4 h-4"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                  >
                    <path
                      fill="currentColor"
                      d="M34.9 289.5l-22.2-22.2c-9.4-9.4-9.4-24.6 0-33.9L207 39c9.4-9.4 24.6-9.4 33.9 0l194.3 194.3c9.4 9.4 9.4 24.6 0 33.9L413 289.4c-9.5 9.5-25 9.3-34.3-.4L264 168.6V456c0 13.3-10.7 24-24 24h-32c-13.3 0-24-10.7-24-24V168.6L69.2 289.1c-9.3 9.8-24.8 10-34.3.4z"
                    ></path>
                  </svg>
                </button>
              )}
            </div>
          </Form>
        )}
      </Formik>
    </React.Fragment>
  );
};

export default Summary;
