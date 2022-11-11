import React, { useState } from "react";

import { Formik, Form, Field } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import consultancies from "apis/consultancies";
import Dialog from "common/Modal/Dialog";
import Toastr from "common/Toastr";

const newConsultancySchema = Yup.object().shape({
  name: Yup.string().required("Name cannot be blank")
});

const initialValues = {
  name: "",
  email: "",
  phone: "",
  address: ""
};

const NewConsultancy = ({ setnewConsultancy, consultancyData, setConsultancyData }) => {
  const [apiError, setApiError] = useState<string>("");

  const navigate = useNavigate();

  const handleSubmit = (values) => {
    consultancies.create({
      "name": values.name,
      "address": values.address,
      "email": values.email,
      "phone": values.phone
    })
      .then(res => {
        setConsultancyData([...consultancyData, { ...res.data }]);
        navigate("/recruitment/consultancies");
        setnewConsultancy(false);
        Toastr.success("Consultancy added successfully");
      }).catch((e) => {
        setApiError(e.message);
      });
  };

  return (
    <Dialog title="Add New Consultancy" open={true} onClose={() => { setnewConsultancy(false); }}>
      <Formik
        initialValues={initialValues}
        validationSchema={newConsultancySchema}
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
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Address</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.address && touched.address &&
                    <div>{`${errors.address}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <Field className={`form__input ${errors.address && touched.address && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="address" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Phone</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.phone && touched.phone &&
                    <div>{`${errors.phone}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <Field className={`form__input ${errors.phone && touched.phone && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="phone" />
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

export default NewConsultancy;
