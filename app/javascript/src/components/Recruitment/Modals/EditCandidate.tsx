import React, { useState } from "react";

import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

import candidates from "apis/candidates";
import Dialog from "common/Modal/Dialog";

const newCandidateSchema = Yup.object().shape({
  first_name: Yup.string().required("First Name cannot be blank")
});

const getInitialvalues = (candidate) => ({
  first_name: candidate.first_name,
  email: candidate.email,
  last_name: candidate.last_name,
  consultancy_id: candidate.consultancy_id
});

export interface IEditCandidate {
  setShowEditDialog: any;
  candidate: any;
}

const EditCandidate = ({ setShowEditDialog, candidate }: IEditCandidate) => {

  const [apiError, setApiError] = useState<string>("");

  const handleSubmit = async values => {
    await candidates.update(candidate.id, {
      candidate: {
        "first_name": values.first_name,
        "last_name": values.last_name,
        "email": values.email
      }
    }).then(() => {
      setShowEditDialog(false);
      document.location.reload();
    }).catch((e) => {
      setApiError(e.message);
    });
  };

  return (
    <Dialog title="Edit Candidate" open={true} onClose={() => { setShowEditDialog(false); }}>
      <Formik
        initialValues={getInitialvalues(candidate)}
        validationSchema={newCandidateSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">First Name</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.first_name && touched.first_name &&
                    <div>{`${errors.first_name}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <Field className={`form__input ${errors.first_name && touched.first_name && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="first_name" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Last Name</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.last_name && touched.last_name &&
                    <div>{`${errors.last_name}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <Field className={`form__input ${errors.last_name && touched.last_name && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="last_name" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Email</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.email && touched.email &&
                    <div>{`${errors.email}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <Field className={`form__input ${errors.email && touched.email && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="email" />
                </div>
              </div>
            </div>
            <p className="tracking-wider mt-3 block text-xs text-red-600">{apiError}</p>
            <div className="actions mt-4">
              <input
                type="submit"
                name="commit"
                value="SAVE CHANGES"
                className="form__input_submit"
              />
            </div>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default EditCandidate;
