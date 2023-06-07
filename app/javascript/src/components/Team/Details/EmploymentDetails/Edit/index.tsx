/* eslint-disable no-unused-vars */
import React, { Fragment, useEffect, useRef, useState } from "react";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useOutsideClick } from "helpers";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";

import teamsApi from "apis/teams";
import Loader from "common/Loader/index";
import { useTeamDetails } from "context/TeamDetailsContext";
import { useUserContext } from "context/UserContext";
import { employmentMapper } from "mapper/teams.mapper";

import StaticPage from "./StaticPage";
import { employmentSchema } from "./validationSchema";

dayjs.extend(utc);

const schema = Yup.object().shape(employmentSchema);

const EmploymentDetails = () => {
  const initialErrState = {
    employee_id_err: "",
    employee_type_err: "",
    email_id_err: "",
    designation_err: "",
    date_of_joining_err: "",
    date_of_resignation_err: "",
    company_name_err: "",
    role_err: "",
  };

  const { memberId } = useParams();
  const {
    updateDetails,
    details: { employmentDetails },
  } = useTeamDetails();
  const navigate = useNavigate();
  const { isDesktop } = useUserContext();

  const DOJRef = useRef(null);
  const DORRef = useRef(null);

  const [previousEmployments, setPreviousEmployments] = useState([]);
  const [employeeType, setEmployeeType] = useState({ label: "", value: "" });
  const [showDOJDatePicker, setShowDOJDatePicker] = useState({
    visibility: false,
  });

  const [showDORDatePicker, setShowDORDatePicker] = useState({
    visibility: false,
  });
  const [errDetails, setErrDetails] = useState(initialErrState);
  const [isLoading, setIsLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState();
  const [emailId, setEmailId] = useState();
  const [designation, setDesignation] = useState();
  const [joiningDate, setJoiningDate] = useState();
  const [resignationDate, setResignationDate] = useState();

  useOutsideClick(DOJRef, () => setShowDOJDatePicker({ visibility: false }));

  useOutsideClick(DORRef, () => setShowDORDatePicker({ visibility: false }));

  const employeeTypes = [
    { label: "Salaried Employee", value: "salaried" },
    { label: "Contractor", value: "contractor" },
  ];

  const getDetails = async () => {
    const res1: any = await teamsApi.getEmploymentDetails(memberId);
    const res: any = await teamsApi.getPreviousEmployments(memberId);
    const employmentData = employmentMapper(
      res1.data.employment,
      res.data.previous_employments
    );
    updateDetails("employment", employmentData);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    getDetails();
  }, []);

  const handleOnChangeEmployeeType = empType => {
    setEmployeeType(empType);
    updateDetails("employment", {
      ...employmentDetails,
      ...{
        current_employment: {
          ...employmentDetails.current_employment,
          ...{ address_type: empType.value },
        },
      },
    });
  };

  const updateCurrentEmploymentDetails = (value, type) => {
    updateDetails("employment", {
      ...employmentDetails,
      ...{
        current_employment: {
          ...employmentDetails.current_employment,
          ...{ [type]: value },
        },
      },
    });
  };

  const handleDOJDatePicker = date => {
    setShowDOJDatePicker({ visibility: !showDOJDatePicker.visibility });
    const formattedDate = dayjs(date).format("DD-MM-YYYY");

    updateDetails("employment", {
      ...employmentDetails,
      ...{
        current_employment: {
          ...employmentDetails.current_employment,
          ...{ date_of_joining: formattedDate },
        },
      },
    });
  };

  const handleDORDatePicker = date => {
    setShowDORDatePicker({ visibility: !showDORDatePicker.visibility });
    const formattedDate = dayjs(date).format("DD-MM-YYYY");

    updateDetails("employment", {
      ...employmentDetails,
      ...{
        current_employment: {
          ...employmentDetails.current_employment,
          ...{ date_of_resignation: formattedDate },
        },
      },
    });
  };

  // const handleUpdateDetails = async () => {
  //   try {
  //     await schema.validate(
  //       {
  //         ...employmentDetails,
  //         ...{
  //           is_email: employmentDetails.current_employment.email_id
  //             ? employmentDetails.current_employment.email_id.length > 0
  //             : false,
  //         },
  //       },
  //       { abortEarly: false }
  //     );

  //     await teamsApi.updateUser(memberId, {
  //       user: {
  //         first_name: employmentDetails.first_name,
  //         last_name: employmentDetails.last_name,
  //         date_of_birth: employmentDetails.date_of_birth
  //           ? dayjs
  //               .utc(
  //                 employmentDetails.date_of_birth,
  //                 employmentDetails.date_format
  //               )
  //               .toISOString()
  //           : null,
  //         phone: employmentDetails.phone_number,
  //         personal_email_id: employmentDetails.email_id,
  //         social_accounts: {
  //           linkedin_url: employmentDetails.linkedin,
  //           github_url: employmentDetails.github,
  //         },
  //       },
  //     });

  //     if (addrId) {
  //       await teamsApi.updateAddress(memberId, addrId, {
  //         address: { ...employmentDetails.addresses },
  //       });
  //     } else {
  //       await teamsApi.createAddress(memberId, payload);
  //     }

  //     setErrDetails(initialErrState);
  //     navigate(`/team/${memberId}`, { replace: true });
  //   } catch (err) {
  //     setIsLoading(false);
  //     const errObj = initialErrState;
  //     if (err.inner) {
  //       err.inner.map(item => {
  //         if (item.path.includes("addresses")) {
  //           errObj[`${item.path.split(".").pop()}_err`] = item.message;
  //         } else {
  //           errObj[`${item.path}_err`] = item.message;
  //         }
  //       });
  //       setErrDetails(errObj);
  //     }
  //   }
  // };

  const handleCancelDetails = () => {
    setIsLoading(true);
    navigate(`/team/${memberId}/employment`, { replace: true });
  };

  return (
    <Fragment>
      {isDesktop && (
        <Fragment>
          <div className="flex items-center justify-between bg-miru-han-purple-1000 px-10 py-4">
            <h1 className="text-2xl font-bold text-white">
              Employement Details
            </h1>
            <div>
              <button
                className="mx-1 cursor-pointer rounded-md border border-white bg-miru-han-purple-1000 px-3 py-2 font-bold text-white	"
                onClick={handleCancelDetails} // eslint-disable-line  @typescript-eslint/no-empty-function
              >
                Cancel
              </button>
              <button className="mx-1 cursor-pointer rounded-md border bg-white px-3 py-2 font-bold text-miru-han-purple-1000">
                Update
              </button>
            </div>
          </div>
          {isLoading ? (
            <div className="flex min-h-70v items-center justify-center">
              <Loader />
            </div>
          ) : (
            <StaticPage
              DOJRef={DOJRef}
              DORRef={DORRef}
              employeeType={employeeType}
              employeeTypes={employeeTypes}
              employmentDetails={employmentDetails}
              errDetails={errDetails}
              handleDOJDatePicker={handleDOJDatePicker}
              handleDORDatePicker={handleDORDatePicker}
              handleOnChangeEmployeeType={handleOnChangeEmployeeType}
              setShowDOJDatePicker={setShowDOJDatePicker}
              setShowDORDatePicker={setShowDORDatePicker}
              showDOJDatePicker={showDOJDatePicker}
              showDORDatePicker={showDORDatePicker}
              updateCurrentEmploymentDetails={updateCurrentEmploymentDetails}
            />
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

export default EmploymentDetails;
