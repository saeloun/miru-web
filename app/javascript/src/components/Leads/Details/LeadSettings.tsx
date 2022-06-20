/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import leadAllowedUsersApi from "apis/lead-allowed-users";
import leadItemsApi from "apis/lead-items";
import leads from "apis/leads";
import { Formik, Form } from "formik";
import { X } from "phosphor-react";
import { unmapLeadDetails } from "../../../mapper/lead.mapper";

const getInitialvalues = (lead) => ({
  assignee_id: lead.assignee_id,
  reporter_id: lead.reporter_id,
  quality_code: lead.quality_code,
  state_code: lead.state_code,
  status_code: lead.status_code,
  priority_code: lead.priority_code
});

const LeadSettings = ({ leadDetails, setLeadDetails, setShowLeadSetting }) => {
  const [qualityCodeList, setQualityCodeList] = useState<any>(null);
  const [stateCodeList, setStateCodeList] = useState<any>(null);
  const [statusCodeList, setStatusCodeList] = useState<any>(null);
  const [priorityCodeList, setPriorityCodeList] = useState<any>(null);
  const [allowUserList, setAllowUserLIst] = useState<any>(null);
  // const navigate = useNavigate();

  useEffect(() => {
    const getAllowedUsers = async () => {
      leadAllowedUsersApi.get()
        .then((data) => {
          setAllowUserLIst(data.data.allowed_user_list);
        }).catch(() => {
          setAllowUserLIst({});
        });
      leadItemsApi.get()
        .then((data) => {
          setQualityCodeList(data.data.quality_codes);
          setStateCodeList(data.data.state_codes);
          setStatusCodeList(data.data.status_codes);
          setPriorityCodeList(data.data.priority_codes);
        }).catch(() => {
          setQualityCodeList({});
          setStateCodeList({});
          setStatusCodeList({});
          setPriorityCodeList({});
        });
    };

    getAllowedUsers();
    setLeadDetails(leadDetails);
  }, []);

  const handleSubmit = async values => {
    await leads.update(leadDetails.id, {
      lead: {
        "assignee_id": values.assignee_id,
        "reporter_id": values.reporter_id,
        "quality_code": values.quality_code,
        "state_code": values.state_code,
        "status_code": values.status_code,
        "priority_code": values.priority_code
      }
    }).then((res) => {
      setShowLeadSetting(false);
      setLeadDetails(unmapLeadDetails(res).leadDetails);
    })
  };

  const changeAssignee = async (val) => {
    await leads.update(leadDetails.id, {
      lead: {
        "assignee_id": val
      }
    }).then((res) => {
      setShowLeadSetting(false);
      setLeadDetails(unmapLeadDetails(res).leadDetails);
    })
  };

  const changeReporter = async (val) => {
    await leads.update(leadDetails.id, {
      lead: {
        "reporter_id": val
      }
    }).then((res) => {
      setShowLeadSetting(false);
      setLeadDetails(unmapLeadDetails(res).leadDetails);
    })
  };

  const changeQuality = async (val) => {
    await leads.update(leadDetails.id, {
      lead: {
        "quality_code": val
      }
    }).then((res) => {
      setShowLeadSetting(false);
      setLeadDetails(unmapLeadDetails(res).leadDetails);
    })
  };

  const changeStateCode = async (val) => {
    await leads.update(leadDetails.id, {
      lead: {
        "state_code": val
      }
    }).then((res) => {
      setShowLeadSetting(false);
      setLeadDetails(unmapLeadDetails(res).leadDetails);
    })
  };

  const changeStatusCode = async (val) => {
    await leads.update(leadDetails.id, {
      lead: {
        "status_code": val
      }
    }).then((res) => {
      setShowLeadSetting(false);
      setLeadDetails(unmapLeadDetails(res).leadDetails);
    })
  };

  const changePriorityCode = async (val) => {
    await leads.update(leadDetails.id, {
      lead: {
        "priority_code": val
      }
    }).then((res) => {
      setShowLeadSetting(false);
      setLeadDetails(unmapLeadDetails(res).leadDetails);
    })
  };

  return (
    <div className="sidebar__container flex flex-col p-6 justify-between">
      <div>

        <span className="mb-3 flex justify-between font-extrabold text-base text-miru-dark-purple-1000 leading-5">
          Lead Settings
          <button onClick={() => setShowLeadSetting(false)}>
            <X size={15} color="#CDD6DF" />
          </button>
        </span>
        <Formik
          initialValues={getInitialvalues(leadDetails)}
          enableReinitialize={true}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form>
              <div className="mb-6">
                <label className="block mb-2 text-sm text-gray-600">Assignee</label>
                <select
                  defaultValue={leadDetails.assignee_id}
                  className="w-full px-3 py-2 bg-miru-gray-100 border border-gray-300 rounded-md  focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300"
                  name="assignee_id" onChange={(e) => changeAssignee(e.target.value)}>
                  <option value=''>Select Assignee</option>
                  {allowUserList &&
  allowUserList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.assignee_id}>{e.first_name}{' '}{e.last_name}</option>)}
                </select>
                <div className="tracking-wider block text-xs text-red-600">
                  {errors.assignee_id && touched.assignee_id &&
            <div>{errors.assignee_id}</div>
                  }
                </div>
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-sm text-gray-600">Reporter</label>
                <select
                  defaultValue={leadDetails.reporter_id}
                  className="w-full px-3 py-2 bg-miru-gray-100 border border-gray-300 rounded-md  focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300"
                  name="reporter_id" onChange={(e) => changeReporter(e.target.value)}>
                  <option value=''>Select Reporter</option>
                  {allowUserList &&
  allowUserList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.reporter_id}>{e.first_name}{' '}{e.last_name}</option>)}
                </select>
                <div className="tracking-wider block text-xs text-red-600">
                  {errors.reporter_id && touched.reporter_id &&
            <div>{errors.reporter_id}</div>
                  }
                </div>
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-sm text-gray-600">Quality</label>
                <select
                  defaultValue={leadDetails.quality_code}
                  className="w-full px-3 py-2 bg-miru-gray-100 border border-gray-300 rounded-md  focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300"
                  name="quality_code" onChange={(e) => changeQuality(e.target.value)}>
                  <option value=''>Select Quality</option>
                  {qualityCodeList &&
qualityCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.quality_code}>{e.name}</option>)}
                </select>
                <div className="flex justify-between items-center pt-1 text-red-700">
                  {errors.quality_code && touched.quality_code &&
              <p className="text-xs">{errors.quality_code}</p>
                  }
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm text-gray-600">State</label>
                <select
                  defaultValue={leadDetails.state_code}
                  className="w-full px-3 py-2 bg-miru-gray-100 border border-gray-300 rounded-md  focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300"
                  name="state_code" onChange={(e) => changeStateCode(e.target.value)}>
                  <option value=''>Select State</option>
                  {stateCodeList &&
stateCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.state_code}>{e.name}</option>)}
                </select>
                <div className="flex justify-between items-center pt-1 text-red-700">
                  {errors.state_code && touched.state_code &&
              <p className="text-xs">{errors.state_code}</p>
                  }
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm text-gray-600">Status</label>
                <select
                  defaultValue={leadDetails.status_code}
                  className="w-full px-3 py-2 bg-miru-gray-100 border border-gray-300 rounded-md  focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300"
                  name="status_code" onChange={(e) => changeStatusCode(e.target.value)}>
                  <option value=''>Select Status</option>
                  {statusCodeList &&
statusCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.status_code}>{e.name}</option>)}
                </select>
                <div className="flex justify-between items-center pt-1 text-red-700">
                  {errors.status_code && touched.status_code &&
              <p className="text-xs">{errors.status_code}</p>
                  }
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm text-gray-600">Priority</label>
                <select
                  defaultValue={leadDetails.priority_code}
                  className="w-full px-3 py-2 bg-miru-gray-100 border border-gray-300 rounded-md  focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300"
                  name="priority_code" onChange={(e) => changePriorityCode(e.target.value)}>
                  <option value=''>Select Priority</option>
                  {priorityCodeList &&
                priorityCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === leadDetails.priority_code}>{e.name}</option>)}
                </select>
                <div className="flex justify-between items-center pt-1 text-red-700">
                  {errors.priority_code && touched.priority_code &&
                <p className="text-xs">{errors.priority_code}</p>
                  }
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default LeadSettings;
