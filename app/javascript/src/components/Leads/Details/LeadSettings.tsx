/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import leadAllowedUsersApi from "apis/lead-allowed-users";
import leads from "apis/leads";
import { Formik, Form } from "formik";
import { X } from "phosphor-react";

const getInitialvalues = (lead) => ({
  assignee_id: lead.assignee_id,
  reporter_id: lead.reporter_id
});

const LeadSettings = ({ leadDetails, setShowLeadSetting }) => {
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
    };

    getAllowedUsers();
  }, []);

  const handleSubmit = async values => {
    await leads.update(leadDetails.id, {
      lead: {
        "assignee_id": values.assignee_id,
        "reporter_id": values.reporter_id
      }
    }).then(() => {
      // navigate(`/leads/${leadDetails.id}`);
      document.location.reload();
    })
  };

  const changeAssignee = async (val) => {
    await leads.update(leadDetails.id, {
      lead: {
        "assignee_id": val
      }
    }).then(() => {
      // navigate(`/leads/${leadDetails.id}`);
      document.location.reload();
    })
  };

  const changeReporter = async (val) => {
    await leads.update(leadDetails.id, {
      lead: {
        "reporter_id": val
      }
    }).then(() => {
      // navigate(`/leads/${leadDetails.id}`);
      document.location.reload();
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
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default LeadSettings;
