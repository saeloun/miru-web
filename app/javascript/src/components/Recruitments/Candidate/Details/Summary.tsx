import React, { useEffect, useState } from "react";
import candidateItemsApi from "apis/candidate-items";
import candidates from "apis/candidates";
import { Formik, Form, Field, FieldArray } from "formik";
import { Multiselect } from 'multiselect-react-dropdown';
import * as Yup from "yup";
import { unmapCandidateDetails } from "../../../../mapper/candidate.mapper";

const newCandidateSchema = Yup.object().shape({
  first_name: Yup.string().required("First Name cannot be blank"),
  last_name: Yup.string().required("Last Name cannot be blank"),
  budget_amount: Yup.number().nullable().typeError("Invalid budget amount"),
  email: Yup.string().nullable().email("Invalid email ID"),
  mobilephone: Yup.number().nullable().typeError("Invalid mobilephone"),
  telephone: Yup.number().nullable().typeError("Invalid telephone"),
  emails: Yup.array().min(0).of(Yup.string().nullable().email("Invalid email ID"))
});

const getInitialvalues = (candidate: any) => ({
  name: candidate.name,
  description: candidate.description,
  cover_letter: candidate.cover_letter,
  preferred_contact_method_code: candidate.preferred_contact_method_code,
  initial_communication: candidate.initial_communication,
  priority_code: candidate.priority_code,
  first_name: candidate.first_name,
  last_name: candidate.last_name,
  source_code: candidate.source_code,
  tech_stack_ids: candidate.tech_stack_ids || [],
  emails: candidate.emails || [],
  preferred_contact_method_code_name: candidate.preferred_contact_method_code_name,
  initial_communication_name: candidate.initial_communication_name,
  source_code_name: candidate.source_code_name,
  title: candidate.title,
  email: candidate.email,
  mobilephone: candidate.mobilephone,
  telephone: candidate.telephone,
  address: candidate.address,
  country: candidate.country,
  skypeid: candidate.skypeid,
  linkedinid: candidate.linkedinid
});

const Summary = ({
  candidateDetails,
  setCandidateDetails,
  isEdit,
  setFormRef
}) => {

  const [apiError, setApiError] = useState<string>("");
  const [showButton, setShowButton] = useState(false);

  const [preferredContactMethodCodeList, setPreferredContactMethodCodeList] = useState<any>(null);
  const [initialCommunicationList, setInitialCommunicationList] = useState<any>(null);
  const [sourceCodeList, setSourceCodeList] = useState<any>(null);
  const [countryList, setCountryList] = useState<any>(null);
  const [techStackList, setTechStackList] = useState<any>(null);
  const [selectedTechStacks, setSelectedTechStacks] = useState<any>(null);

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
    const getCandidateItems = async () => {
      candidateItemsApi.get()
        .then((data) => {
          setPreferredContactMethodCodeList(data.data.preferred_contact_method_code_names);
          setInitialCommunicationList(data.data.initial_communications);
          setSourceCodeList(data.data.source_codes);
          setCountryList(data.data.countries);
          setTechStackList(data.data.tech_stacks);
        }).catch(() => {
          setPreferredContactMethodCodeList({});
          setInitialCommunicationList({});
          setSourceCodeList({});
          setCountryList({});
          setTechStackList({});
        });
    };

    getCandidateItems();
  }, [candidateDetails]);

  useEffect(() => {
    if (techStackList && candidateDetails && candidateDetails.tech_stack_ids && candidateDetails.tech_stack_ids.length > 0){
      const sanitizedSelectedStackList = techStackList.filter((option: any) =>
        candidateDetails.tech_stack_ids.map(Number).includes(parseInt(option.id))
      );
      setSelectedTechStacks([...sanitizedSelectedStackList]);

      const stackArray = []
      sanitizedSelectedStackList.filter((option: any) =>
        stackArray.push(parseInt(option.id))
      );
      setTechStacks(stackArray);
    }
  }, [techStackList]);

  const addRemoveStack = (selectedList: any) => {
    const newStackArray = []
    selectedList.filter((option: any) =>
      newStackArray.push(parseInt(option.id))
    );
    setTechStacks(newStackArray);
  };

  const handleSubmit = async (values: any) => {

    await candidates.update(candidateDetails.id, {
      candidate: {
        "title": values.title,
        "first_name": values.first_name,
        "last_name": values.last_name,
        "email": values.email,
        "description": values.description,
        "cover_letter": values.cover_letter,
        "preferred_contact_method_code": Number(preferredContactMethodCode || values.preferred_contact_method_code),
        "initial_communication": Number(initialCommunication || values.initial_communication),
        "source_code": Number(sourceCode || values.source_code),
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
      setCandidateDetails(unmapCandidateDetails(res).candidateDetails);
    }).catch((e) => {
      setApiError(e.message);
    });
  };

  return (
    <React.Fragment>
      <Formik
        initialValues={getInitialvalues(candidateDetails)}
        validationSchema={newCandidateSchema}
        enableReinitialize={true}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values }) => (
          <Form ref={ref => setFormRef(ref)}>
            <div className="bg-white dark:bg-gray-800">
              <p className="block mt-3 text-xs tracking-wider text-red-600">{apiError}</p>
              <div className="container mx-auto bg-white rounded dark:bg-gray-800">
                <div className="mx-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="mx-auto xl:mx-0">
                      <div className="flex flex-col w-full mt-8 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Title</label>
                        <Field className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="title" placeholder="Title" disabled={!isEdit} />
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.title && touched.title &&
                            <p className="text-xs">{`${errors.title}`}</p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">First Name</label>
                        <Field className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="first_name" placeholder="First Name" disabled={!isEdit} />
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.first_name && touched.first_name &&
                            <p className="text-xs">{`${errors.first_name}`}</p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Last Name</label>
                        <Field className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="last_name" placeholder="Last Name" disabled={!isEdit} />
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.last_name && touched.last_name &&
                            <p className="text-xs">{`${errors.last_name}`}</p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Primary Email</label>
                        <Field className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="email" placeholder="Primary Email" disabled={!isEdit} />
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.email && touched.email &&
                            <p className="text-xs">{`${errors.email}`}</p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
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
                                          className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                                          name={`emails.${index}`}
                                          placeholder="Email"
                                          disabled={!isEdit}
                                        />
                                        <div className="flex items-center justify-between pt-1 text-red-700">
                                          {errors.emails && touched.emails &&
                                          <p className="text-xs">{`${errors.emails}`}</p>
                                          }
                                        </div>
                                      </div>
                                      {isEdit &&
                                        <div>
                                          <svg onClick={() => remove(index)} className="w-6 h-6 mt-2 text-red-500 fill-current" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                                        </div>
                                      }
                                    </div>
                                  ))
                              }
                              <button
                                type="button"
                                className="w-2/6 mt-4 text-sm header__button disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                                onClick={() => push('')}
                                disabled={!isEdit}
                              >
                                  Add Email
                              </button>
                            </div>
                          )}
                        </FieldArray>
                      </div>
                    </div>
                    <div className="mx-auto xl:mx-0">
                      <div className="py-5 border-b border-gray-300 xl:w-full dark:border-gray-700">
                        <div className="flex items-center w-11/12 mx-auto xl:w-full xl:mx-0">
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">More Information</p>
                        </div>
                      </div>

                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Contact Method</label>
                        <select
                          defaultValue={candidateDetails.preferred_contact_method_code}
                          className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="preferred_contact_method_code" onChange={(e) => setPreferredContactMethodCode(e.target.value)} disabled={!isEdit} >
                          <option value=''>Select Contact Method</option>
                          {preferredContactMethodCodeList &&
                            preferredContactMethodCodeList.map(e => <option value={e.id} selected={e.id === candidateDetails.preferred_contact_method_code} key={e.id}>{e.name}</option>)}
                        </select>
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.preferred_contact_method_code && touched.preferred_contact_method_code &&
                            <p className="text-xs">{`${errors.preferred_contact_method_code}`}</p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Source</label>
                        <select
                          defaultValue={candidateDetails.source_code}
                          className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="source_code" onChange={(e) => setSourceCode(e.target.value)} disabled={!isEdit} >
                          <option value=''>Select Source</option>
                          {sourceCodeList &&
                            sourceCodeList.map(e => <option value={e.id} selected={e.id === candidateDetails.source_code} key={e.id}>{e.name}</option>)}
                        </select>
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.source_code && touched.source_code &&
                            <p className="text-xs">{`${errors.source_code}`}</p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Initial Communication</label>
                        <select
                          defaultValue={candidateDetails.initial_communication}
                          className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="initial_communication" onChange={(e) => setInitialCommunication(e.target.value)} disabled={!isEdit} >
                          <option value=''>Select Initial Communication</option>
                          {initialCommunicationList &&
                            initialCommunicationList.map(e => <option value={e.id} selected={e.id === candidateDetails.initial_communication} key={e.id}>{e.name}</option>)}
                        </select>
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.initial_communication && touched.initial_communication &&
                            <p className="text-xs">{`${errors.initial_communication}`}</p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Description</label>
                        <Field className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="description" as="textarea" rows={8} placeholder="Description" disabled={!isEdit} />
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.description && touched.description &&
                            <p className="text-xs">{`${errors.description}`}</p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Tech Stacks</label>
                        <Multiselect
                          closeOnSelect={true}
                          avoidHighlightFirstOption={true}
                          selectedValues={selectedTechStacks}
                          options={techStackList ? techStackList : [{}]}
                          name="tech_stack_ids"
                          onSelect={((selectedList) => addRemoveStack(selectedList))}
                          onRemove={((selectedList) => addRemoveStack(selectedList))}
                          displayValue="name"
                          disable={!isEdit} />
                      </div>

                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Cover Letter</label>
                        <Field className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="cover_letter" as="textarea" rows={8} placeholder="Cover Letter" disabled={!isEdit} />
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.cover_letter && touched.cover_letter &&
                            <p className="text-xs">{`${errors.cover_letter}`}</p>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="container mx-auto my-6 bg-white rounded dark:bg-gray-800">
                <div className="py-5 border-b border-gray-300 xl:w-full dark:border-gray-700">
                  <div className="flex items-center w-11/12 mx-auto xl:w-full xl:mx-0">
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-100">Contact Information</p>
                  </div>
                </div>
                <div className="mx-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="mx-auto xl:mx-0">
                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Country</label>
                        <select
                          defaultValue={candidateDetails.country}
                          className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="industry_code" onChange={(e) => setCountry(e.target.value)} disabled={!isEdit} >
                          <option value=''>Select Country</option>
                          <option value="IN" selected={"IN" === candidateDetails.country} key="IN">India</option>
                          <option value="US" selected={"US" === candidateDetails.country} key="US">United States of America</option>
                          <option value="CA" selected={"CA" === candidateDetails.country} key="CA">Canada</option>
                          {countryList &&
                            countryList.filter((e: any) => ['IN', 'US', 'CA'].indexOf(e[0]) === -1).map((e: any) => <option value={e[0]} selected={e[0] === candidateDetails.country} key={e[0]}>{e[1]}</option>)}
                        </select>
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.country && touched.country &&
                            <p className="text-xs">{`${errors.country}`}</p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Address</label>
                        <Field className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="address" as="textarea" rows={8} placeholder="Address" disabled={!isEdit} />
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.address && touched.address &&
                            <p className="text-xs">{`${errors.address}`}</p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Moobile Phone</label>
                        <Field className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="mobilephone" placeholder="Moobile Phone" disabled={!isEdit} />
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.mobilephone && touched.mobilephone &&
                            <p className="text-xs">{`${errors.mobilephone}`}</p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Tele Phone</label>
                        <Field className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="telephone" placeholder="Tele Phone" disabled={!isEdit} />
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.telephone && touched.telephone &&
                            <p className="text-xs">{`${errors.telephone}`}</p>
                          }
                        </div>
                      </div>
                    </div>
                    <div className="mx-auto xl:mx-0">
                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Skype ID</label>
                        <Field className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="skypeid" placeholder="Skpe ID" disabled={!isEdit} />
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.skypeid && touched.skypeid &&
                            <p className="text-xs">{`${errors.skypeid}`}</p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col w-full mt-4 lg:w-9/12 md:w-1/2">
                        <label className="pb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Linkedin ID</label>
                        <Field className="w-full p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-400 rounded shadow-sm focus:outline-none focus:border-blue-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                          name="linkedinid" placeholder="Linkedin ID" disabled={!isEdit} />
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.linkedinid && touched.linkedinid &&
                            <p className="text-xs">{`${errors.linkedinid}`}</p>
                          }
                        </div>
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
                  className="fixed inline-block p-3 text-xs font-medium leading-tight text-white uppercase transition duration-150 ease-in-out rounded-full shadow-md bg-miru-han-purple-1000 hover:bg-miru-han-purple-700 hover:shadow-lg focus:bg-miru-han-purple-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg bottom-5 right-5"
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
