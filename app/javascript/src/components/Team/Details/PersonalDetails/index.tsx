import React, { Fragment } from "react";
import { useEffect } from "react";
import { Formik, Form, Field, FormikProps } from "formik";
import { useTeamDetails } from "context/TeamDetailsContext";
import StaticPage from "./StaticPage";
import FormPage from "./FormPage";
import * as Yup from "yup";

const TeamPersonalDetailSchema = Yup.object().shape({
  firstName: Yup.string().required("First Name cannot be blank"),
  lastName: Yup.string().required("Last Name cannot be blank"),
  dob: Yup.date()
});


interface FormValues {
  firstName: string;
  lastName: string;
  dob: Date;
}

const getInitialValues = () => ({
  firstName: "",
  lastName: "",
  dob: new Date()
});

const PersonalDetails = () => {
  const { updateDetails } = useTeamDetails();

  useEffect(() => {
    updateDetails("personal", {
      name: "Jane Cooper",
      dob: "04. 05. 1989",
      phone: "+123345234",
      email: "jane.cooper@gmail.com"
    });
  }, []);

  return (
    <Fragment>
      <Formik
        initialValues={getInitialValues()}
        validationSchema={TeamPersonalDetailSchema}
        onSubmit={(values) => { console.log("values ===> ", values) }}
      >
        {(props: FormikProps<FormValues>) => {
          return (
            <Form>
              <div className="px-10 py-4 bg-miru-han-purple-1000 flex items-center justify-between">
                <h1 className="text-white font-bold text-2xl">Personal Details</h1>
                <button type="submit">Update</button>
              </div>
              <FormPage props={props} />
            </Form>
          )
        }
        }
      </Formik>

    </Fragment>
  );
};
export default PersonalDetails;
