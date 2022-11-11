import React, { useState } from "react";

import { Formik, Form, Field } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import candidates from "apis/candidates";
import Dialog from "common/Modal/Dialog";
import Toastr from "common/Toastr";

const newCandidateSchema = Yup.object().shape({
  first_name: Yup.string().required("First Name cannot be blank"),
  email: Yup.string().email('Not a proper email')
});

const initialValues = {
  first_name: "",
  email: "",
  last_name: "",
  consultancy_id: ""
};

const NewCandidate = ({ setnewCandidate, candidateData, setCandidateData }) => {
  const [apiError, setApiError] = useState<string>("");

  const navigate = useNavigate();

  const handleSubmit = (values) => {
    candidates.create({
      "first_name": values.first_name,
      "email": values.email,
      "last_name": values.last_name,
      "consultancy_id": values.consultancy_id
    })
      .then(res => {
        setCandidateData([...candidateData, { ...res.data }]);
        navigate("/recruitment/candidates");
        setnewCandidate(false);
        Toastr.success("Consultancy added successfully");
      }).catch((e) => {
        setApiError(e.message);
      });
  };

  return (
    <Dialog title="Add New Candidate" open={true} onClose={() => { setnewCandidate(false); }}>
      <Formik
        initialValues={initialValues}
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

export default NewCandidate;
