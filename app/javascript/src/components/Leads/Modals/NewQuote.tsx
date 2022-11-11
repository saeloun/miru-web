import React from "react";

import { Formik, Form, Field } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import leadQuotes from "apis/lead-quotes";
import Dialog from "common/Modal/Dialog";
import Toastr from "common/Toastr";

const newLeadSchema = Yup.object().shape({
  name: Yup.string().required("Name cannot be blank")
});

const initialValues = {
  name: "",
  description: "",
  price: 0.0
};

const NewQuote = ({ leadDetails, setnewLead, leadData, setLeadData }) => {
  const navigate = useNavigate();

  const handleSubmit = (values) => {
    leadQuotes.create(leadDetails.id, {
      "name": values.name,
      "description": values.description,
      "status": "draft"
    })
      .then(res => {
        setLeadData([...leadData, { ...res.data }]);
        navigate(`/leads/${leadDetails.id}/quotes`)
        setnewLead(false);
        Toastr.success("Line item added successfully");
      });
  };

  return (
    <Dialog title="Add New Quote" open={true} onClose={() => { setnewLead(false); }}>
      <Formik
        initialValues={initialValues}
        validationSchema={newLeadSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Name</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.name && touched.name &&
                      <div>{`${errors.name}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <Field className={`form__input ${errors.name && touched.name && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="name" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Description</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.description && touched.description &&
                      <div>{`${errors.description}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <Field className={`form__input ${errors.description && touched.description && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="description" />
                </div>
              </div>
            </div>
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

export default NewQuote;
