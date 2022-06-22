import React, { useEffect, useState } from "react";
import leadItemsApi from "apis/lead-items";
import { Formik, Form, Field, FieldArray } from "formik";
import { Multiselect } from 'multiselect-react-dropdown';
import * as Yup from "yup";

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
  setTitle,
  setFirstName,
  setLastName,
  setEmail,
  setBudgetAmount,
  setDescription,
  setAddress,
  setSkypeId,
  setLinkedinId,
  setEmails,
  setMobilePhone,
  setTelePhone,
  setDoNotEmail,
  setDoNotBulkEmail,
  setDoNotFax,
  setDoNotPhone,
  setBudgetStatusCode,
  setIndustryCode,
  setNeed,
  setPreferredContactMethodCode,
  setInitialCommunication,
  setSourceCode,
  setCountry,
  setTechStacks,
  handleSubmit }) => {

  const [budgetStatusCodeList, setBudgetStatusCodeList] = useState<any>(null);
  const [industryCodeList, setIndustryCodeList] = useState<any>(null);
  const [needList, setNeedList] = useState<any>(null);
  const [preferredContactMethodCodeList, setPreferredContactMethodCodeList] = useState<any>(null);
  const [initialCommunicationList, setInitialCommunicationList] = useState<any>(null);
  const [sourceCodeList, setSourceCodeList] = useState<any>(null);
  const [countryList, setCountryList] = useState<any>(null);
  const [techStackList, setTechStackList] = useState<any>(null);
  const [selectedTechStacks, setSelectedTechStacks] = useState<any>(null);
  const [emailList, setEmailList] = useState<any>(null);

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

    if (leadDetails){
      setTitle(leadDetails.title)
      setFirstName(leadDetails.first_name)
      setLastName(leadDetails.last_name)
      setEmail(leadDetails.email)
      setBudgetAmount(leadDetails.budget_amount)
      setDescription(leadDetails.description)
      setAddress(leadDetails.address)
      setSkypeId(leadDetails.skypeid)
      setLinkedinId(leadDetails.linkedinid)
      setMobilePhone(leadDetails.mobilephone)
      setTelePhone(leadDetails.telephone)
      setEmails(leadDetails.emails)
      setDoNotEmail(leadDetails.donotemail)
      setDoNotBulkEmail(leadDetails.donotbulkemail)
      setDoNotFax(leadDetails.donotfax)
      setDoNotPhone(leadDetails.donotphone)
      setBudgetStatusCode(leadDetails.budget_status_code)
      setIndustryCode(leadDetails.industry_code)
      setNeed(leadDetails.need)
      setPreferredContactMethodCode(leadDetails.preferred_contact_method_code)
      setInitialCommunication(leadDetails.initial_communication)
      setSourceCode(leadDetails.source_code)
      setCountry(leadDetails.country)

      setEmailList(getInitialvalues(leadDetails).emails)
    }
  }, [leadDetails]);

  useEffect(() => {
    if (techStackList && leadDetails && leadDetails.tech_stack_ids && leadDetails.tech_stack_ids.length > 0){
      const sanitizedSelectedStackList = techStackList.filter(option =>
        leadDetails.tech_stack_ids.map(Number).includes(parseInt(option.id))
      );
      setSelectedTechStacks([...sanitizedSelectedStackList]);

      const newArray = []
      sanitizedSelectedStackList.filter(option =>
        newArray.push(parseInt(option.id))
      );
      setTechStacks(newArray);
    }
  }, [techStackList]);

  const addRemoveStack = (selectedList) => {
    const newArray = []
    selectedList.filter(option =>
      newArray.push(parseInt(option.id))
    );
    setTechStacks(newArray);
  };

  const onAddEmail = (index, emailVal) => {
    const newArray = [...emailList]
    newArray.splice(index, 0, emailVal);
    setEmails(newArray);
  };

  const onRemoveEmail = (index) => {
    const newArray = [...emailList]
    if (index !== -1) {
      newArray.splice(index, 1);
      setEmails(newArray);
    }
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
          <Form>
            <div className="bg-white dark:bg-gray-800">
              <div className="container mx-auto bg-white dark:bg-gray-800 rounded">
                <div className="mx-auto">
                  <div className="grid gap-4 grid-cols-2">
                    <div className="mx-auto xl:mx-0">
                      <div className="mt-8 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Title</label>
                        <Field className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="title" placeholder="Title" onKeyUp={e => setTitle(e.target.value)} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.title && touched.title &&
                            <p className="text-xs">{errors.title}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">First Name</label>
                        <Field className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="first_name" placeholder="First Name" onKeyUp={e => setFirstName(e.target.value)} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.first_name && touched.first_name &&
                            <p className="text-xs">{errors.first_name}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Last Name</label>
                        <Field className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="last_name" placeholder="Last Name" onKeyUp={e => setLastName(e.target.value)} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.last_name && touched.last_name &&
                            <p className="text-xs">{errors.last_name}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Primary Email</label>
                        <Field className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="email" placeholder="Primary Email" onKeyUp={e => setEmail(e.target.value)} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.email && touched.email &&
                            <p className="text-xs">{errors.email}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Budget Amount</label>
                        <Field className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="budget_amount" type="number" min="0" placeholder="Budget Amount" onKeyUp={e => setBudgetAmount(e.target.value)} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.budget_amount && touched.budget_amount &&
                            <p className="text-xs">{errors.budget_amount}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Budget Status</label>
                        <select
                          defaultValue={leadDetails.budget_status_code}
                          className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="budget_status_code" onChange={(e) => setBudgetStatusCode(e.target.value)}>
                          <option value=''>Select Budget Status</option>
                          {budgetStatusCodeList &&
                            budgetStatusCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.budget_status_code}>{e.name}</option>)}
                        </select>
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.budget_status_code && touched.budget_status_code &&
                            <p className="text-xs">{errors.budget_status_code}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Industry</label>
                        <select
                          defaultValue={leadDetails.industry_code}
                          className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="industry_code" onChange={(e) => setIndustryCode(e.target.value)}>
                          <option value=''>Select Industry</option>
                          {industryCodeList &&
                            industryCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.industry_code}>{e.name}</option>)}
                        </select>
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.industry_code && touched.industry_code &&
                            <p className="text-xs">{errors.industry_code}</p>
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
                                          className="w-full border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                                          name={`emails.${index}`}
                                          placeholder="Email"
                                          onKeyUp={(e) => onAddEmail(index, e.target.value)}
                                        />
                                        <div className="flex justify-between items-center pt-1 text-red-700">
                                          {errors.emails && touched.emails &&
                                          <p className="text-xs">{errors.emails}</p>
                                          }
                                        </div>
                                      </div>
                                      <div>
                                        <svg onClick={() => {remove(index); onRemoveEmail(index)}} className="mt-2 fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                                      </div>
                                    </div>
                                  ))
                              }
                              <button
                                type="button"
                                className="mt-4 w-2/6 header__button text-sm"
                                onClick={() => push('')}
                              >
                                Add Email
                              </button>
                            </div>
                          )}
                        </FieldArray>
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
                          className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="need" onChange={(e) => setNeed(e.target.value)}>
                          <option value=''>Select Need</option>
                          {needList &&
                            needList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.need}>{e.name}</option>)}
                        </select>
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.need && touched.need &&
                            <p className="text-xs">{errors.need}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Contact Method</label>
                        <select
                          defaultValue={leadDetails.preferred_contact_method_code}
                          className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="preferred_contact_method_code" onChange={(e) => setPreferredContactMethodCode(e.target.value)}>
                          <option value=''>Select Contact Method</option>
                          {preferredContactMethodCodeList &&
                            preferredContactMethodCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.preferred_contact_method_code}>{e.name}</option>)}
                        </select>
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.preferred_contact_method_code && touched.preferred_contact_method_code &&
                            <p className="text-xs">{errors.preferred_contact_method_code}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Source</label>
                        <select
                          defaultValue={leadDetails.source_code}
                          className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="source_code" onChange={(e) => setSourceCode(e.target.value)}>
                          <option value=''>Select Source</option>
                          {sourceCodeList &&
                            sourceCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.source_code}>{e.name}</option>)}
                        </select>
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.source_code && touched.source_code &&
                            <p className="text-xs">{errors.source_code}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Initial Communication</label>
                        <select
                          defaultValue={leadDetails.initial_communication}
                          className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="initial_communication" onChange={(e) => setInitialCommunication(e.target.value)}>
                          <option value=''>Select Initial Communication</option>
                          {initialCommunicationList &&
                            initialCommunicationList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.initial_communication}>{e.name}</option>)}
                        </select>
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.initial_communication && touched.initial_communication &&
                            <p className="text-xs">{errors.initial_communication}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Description</label>
                        <Field className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="description" as="textarea" rows={8} placeholder="Description" onKeyUp={e => setDescription(e.target.value)} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.description && touched.description &&
                            <p className="text-xs">{errors.description}</p>
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
                          displayValue="name" />
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
                          className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="industry_code" onChange={(e) => setCountry(e.target.value)}>
                          <option value=''>Select Country</option>
                          <option value="US" key="US">United States of America</option>
                          <option value="CA" key="CA">Canada</option>
                          <option value="IN" key="IN">India</option>
                          {countryList &&
                            countryList.map(e => <option value={e[0]} key={e[0]} selected={e[0] === leadDetails.country}>{e[1]}</option>)}
                        </select>
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.country && touched.country &&
                            <p className="text-xs">{errors.country}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Address</label>
                        <Field className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="address" as="textarea" rows={8} placeholder="Address" onKeyUp={(e) => setAddress(e.target.value)} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.address && touched.address &&
                            <p className="text-xs">{errors.address}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Moobile Phone</label>
                        <Field className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="mobilephone" placeholder="Moobile Phone" onKeyUp={(e) => setMobilePhone(e.target.value)} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.mobilephone && touched.mobilephone &&
                            <p className="text-xs">{errors.mobilephone}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Tele Phone</label>
                        <Field className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="telephone" placeholder="Tele Phone" onKeyUp={(e) => setTelePhone(e.target.value)} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.telephone && touched.telephone &&
                            <p className="text-xs">{errors.telephone}</p>
                          }
                        </div>
                      </div>
                    </div>
                    <div className="mx-auto xl:mx-0">
                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Skype ID</label>
                        <Field className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="skypeid" placeholder="Skpe ID" onKeyUp={(e) => setSkypeId(e.target.value)} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.skypeid && touched.skypeid &&
                            <p className="text-xs">{errors.skypeid}</p>
                          }
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col lg:w-9/12 md:w-1/2 w-full">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Linkedin ID</label>
                        <Field className="border border-gray-300 dark:border-gray-700 pl-3 py-3 shadow-sm rounded text-sm focus:outline-none focus:border-purple-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                          name="linkedinid" placeholder="Linkedin ID" onKeyUp={(e) => setLinkedinId(e.target.value)} />
                        <div className="flex justify-between items-center pt-1 text-red-700">
                          {errors.linkedinid && touched.linkedinid &&
                            <p className="text-xs">{errors.linkedinid}</p>
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
                        <Field aria-labelledby="cb1" type="checkbox" name="donotemail" className="focus:outline-none checkbox w-6 h-6 rounded-full bg-white dark:bg-gray-400 absolute shadow-sm appearance-none cursor-pointer border border-transparent top-0 bottom-0 m-auto switch-checkbox" onClick={(e) => setDoNotEmail(e.target.checked)} />
                        <label className="toggle-label block w-12 h-4 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-800 cursor-pointer"></label>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-8 mt-4">
                      <div className="w-9/12">
                        <p className="text-sm text-gray-800 dark:text-gray-100 pb-1">Do not bulk email</p>
                      </div>
                      <div className="cursor-pointer rounded-full bg-gray-200 relative shadow-sm">
                        <Field aria-labelledby="cb1" type="checkbox" name="donotbulkemail" className="focus:outline-none checkbox w-6 h-6 rounded-full bg-white dark:bg-gray-400 absolute shadow-sm appearance-none cursor-pointer border border-transparent top-0 bottom-0 m-auto switch-checkbox" onClick={(e) => setDoNotBulkEmail(e.target.checked)} />
                        <label className="toggle-label block w-12 h-4 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-800 cursor-pointer"></label>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-8 mt-4">
                      <div className="w-9/12">
                        <p className="text-sm text-gray-800 dark:text-gray-100 pb-1">Do not fax</p>
                      </div>
                      <div className="cursor-pointer rounded-full bg-gray-200 relative shadow-sm">
                        <Field aria-labelledby="cb1" type="checkbox" name="donotfax" className="focus:outline-none checkbox w-6 h-6 rounded-full bg-white dark:bg-gray-400 absolute shadow-sm appearance-none cursor-pointer border border-transparent top-0 bottom-0 m-auto switch-checkbox" onClick={(e) => setDoNotFax(e.target.checked)} />
                        <label className="toggle-label block w-12 h-4 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-800 cursor-pointer"></label>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-8 mt-4">
                      <div className="w-9/12">
                        <p className="text-sm text-gray-800 dark:text-gray-100 pb-1">Do not Phone</p>
                      </div>
                      <div className="cursor-pointer rounded-full bg-gray-200 relative shadow-sm">
                        <Field aria-labelledby="cb1" type="checkbox" name="donotphone" className="focus:outline-none checkbox w-6 h-6 rounded-full bg-white dark:bg-gray-400 absolute shadow-sm appearance-none cursor-pointer border border-transparent top-0 bottom-0 m-auto switch-checkbox" onClick={(e) => setDoNotPhone(e.target.checked)} />
                        <label className="toggle-label block w-12 h-4 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-800 cursor-pointer"></label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* <div className="container mx-auto w-11/12 xl:w-full">
                <div className="w-full py-4 sm:px-0 bg-white dark:bg-gray-800 flex justify-end">
                  <p className="tracking-wider mt-3 block text-xs text-red-600">{apiError}</p>
                  <input
                    type="submit"
                    name="commit"
                    value="SAVE CHANGES"
                    className="form__input_submit"
                  />
                </div>
              </div> */}
            </div>
          </Form>
        )}
      </Formik>
    </React.Fragment>
  );
};

export default Summary;
