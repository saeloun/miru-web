/* eslint-disable no-unused-vars */
import React, { Fragment, useEffect, useRef, useState } from "react";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useOutsideClick } from "helpers";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import teamsApi from "apis/teams";
import Loader from "common/Loader/index";
import { MobileDetailsHeader } from "common/Mobile/MobileDetailsHeader";
import { useProfile } from "components/Profile/context/EntryContext";
import { employmentSchema } from "components/Team/Details/EmploymentDetails/Edit/validationSchema";
import { useUserContext } from "context/UserContext";
import { employmentMapper } from "mapper/teams.mapper";

import MobileEditPage from "./MobileEditPage";
import StaticPage from "./StaticPage";

import { employeeTypes } from "../helpers";

dayjs.extend(utc);

const schema = Yup.object().shape(employmentSchema);

const EmploymentDetailsEdit = () => {
  const initialErrState = {
    employee_id_err: "",
    employment_type_err: "",
    email_err: "",
    designation_err: "",
    joined_at_err: "",
    resigned_at_err: "",
    company_name_err: "",
    role_err: "",
  };
  const { user } = useUserContext();
  const { setUserState, employmentDetails } = useProfile();
  const navigate = useNavigate();
  const { isDesktop } = useUserContext();

  const DOJRef = useRef(null);
  const DORRef = useRef(null);

  const InitialPrevEmployments = {
    added_employments: [],
    updated_employments: [],
    removed_employment_ids: [],
  };

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
  const [dateFormat, setDateFormat] = useState("DD-MM-YYYY");
  const [resignedAt, setResignedAt] = useState(null);
  const [joinedAt, setJoinedAt] = useState(null);

  useOutsideClick(DOJRef, () => setShowDOJDatePicker({ visibility: false }));
  useOutsideClick(DORRef, () => setShowDORDatePicker({ visibility: false }));

  const getDetails = async () => {
    const curr: any = await teamsApi.getEmploymentDetails(user.id);
    const prev: any = await teamsApi.getPreviousEmployments(user.id);
    setDateFormat(curr.data.date_format);
    setJoinedAt(curr.data.employment.joined_at);
    setResignedAt(curr.data.employment.resigned_at);
    const employmentData = employmentMapper(
      curr.data.employment,
      prev.data.previous_employments
    );
    if (employmentData.current_employment?.employment_type?.length > 0) {
      setEmployeeType(
        employeeTypes.find(
          item =>
            item.value === employmentData.current_employment.employment_type
        )
      );
    } else {
      setEmployeeType(employeeTypes[0]);
      employmentData.current_employment.employment_type =
        employeeTypes[0].value;
    }
    setUserState("employmentDetails", employmentData);
    if (employmentData.previous_employments?.length > 0) {
      setPreviousEmployments(employmentData.previous_employments);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    getDetails();
  }, []);

  const handleOnChangeEmployeeType = empType => {
    setEmployeeType(empType);
    setUserState("employmentDetails", {
      ...employmentDetails,
      ...{
        current_employment: {
          ...employmentDetails.current_employment,
          ...{ employment_type: empType.value },
        },
      },
    });
  };

  const updateCurrentEmploymentDetails = (value, type) => {
    setUserState("employmentDetails", {
      ...employmentDetails,
      ...{
        current_employment: {
          ...employmentDetails.current_employment,
          ...{ [type]: value },
        },
      },
    });
  };

  const updatePreviousEmploymentValues = (previous, event) => {
    const { name, value } = event.target;
    const updatedPreviousEmployments = previousEmployments.map(prevEmployment =>
      prevEmployment == previous
        ? { ...prevEmployment, [name]: value }
        : prevEmployment
    );
    setPreviousEmployments(updatedPreviousEmployments);
  };

  const handleDOJDatePicker = date => {
    setShowDOJDatePicker({ visibility: !showDOJDatePicker.visibility });
    setJoinedAt(date);
    setUserState("employmentDetails", {
      ...employmentDetails,
      ...{
        current_employment: {
          ...employmentDetails.current_employment,
          ...{
            joined_at: date,
          },
        },
      },
    });
  };

  const handleDORDatePicker = date => {
    setShowDORDatePicker({ visibility: !showDORDatePicker.visibility });
    setResignedAt(date);
    setUserState("employmentDetails", {
      ...employmentDetails,
      ...{
        current_employment: {
          ...employmentDetails.current_employment,
          ...{
            resigned_at: date,
          },
        },
      },
    });
  };

  const handleAddPastEmployment = () => {
    const pastEmployments = [
      ...previousEmployments,
      { company_name: "", role: "" },
    ];
    setPreviousEmployments(pastEmployments);
  };

  const handleDeletePreviousEmployment = previous => {
    setPreviousEmployments(
      previousEmployments.filter(prev => prev !== previous)
    );
  };

  const handleUpdateDetails = async () => {
    setIsLoading(true);
    const getDifference = (array1, array2) =>
      array1.filter(object1 => !array2.some(object2 => object1 === object2));

    //creating an array which includes removed records
    const removed = employmentDetails.previous_employments.filter(
      e => !previousEmployments.includes(e)
    );

    //creating an array which includes updated and added records
    const unSortedEmployments = getDifference(
      previousEmployments,
      employmentDetails.previous_employments
    );

    const pastEmployments = InitialPrevEmployments;

    //sorting new entries and updated entries into
    unSortedEmployments.map(unSorted => {
      if (unSorted.id) {
        pastEmployments.updated_employments.push(unSorted);
      } else {
        pastEmployments.added_employments.push(unSorted);
      }
    });

    //Extracting removed records id
    if (removed.length > 0) {
      removed.map(remove => {
        if (pastEmployments.updated_employments.length > 0) {
          pastEmployments.updated_employments.filter(updated => {
            if (updated.id !== remove.id) {
              pastEmployments.removed_employment_ids.push(remove?.id);
            }
          });
        } else {
          pastEmployments.removed_employment_ids.push(remove?.id);
        }
      });
    }
    updateEmploymentDetails(pastEmployments);
  };

  const updateEmploymentDetails = async updatedPreviousEmployments => {
    try {
      await schema.validate(employmentDetails, { abortEarly: false });
      const joined_at = employmentDetails.current_employment.joined_at;
      const resigned_at = employmentDetails.current_employment.resigned_at;
      const payload = {
        ...updatedPreviousEmployments,
        current_employment: {
          ...employmentDetails.current_employment,
          joined_at:
            dateFormat == "DD-MM-YYYY"
              ? joined_at
              : dayjs(joined_at).format("DD-MM-YYYY"),
          resigned_at:
            dateFormat == "DD-MM-YYYY"
              ? resigned_at
              : dayjs(resigned_at).format("DD-MM-YYYY"),
        },
      };

      await teamsApi.updatePreviousEmployments(user.id, {
        employments: payload,
      });
      setIsLoading(false);
      navigate(`/settings/employment`, { replace: true });
    } catch (err) {
      setIsLoading(false);
      const errObj = initialErrState;
      if (err.inner) {
        err.inner.map(item => {
          if (item.path.includes("current_employment")) {
            errObj[`${item.path.split(".").pop()}_err`] = item.message;
          } else {
            errObj[`${item.path}_err`] = item.message;
          }
        });
        setErrDetails(errObj);
      }
    }
  };

  const handleCancelDetails = () => {
    setIsLoading(true);
    navigate(`/settings/employment`, { replace: true });
  };

  return (
    <Fragment>
      {isDesktop && (
        <Fragment>
          <div className="items-center justify-between bg-miru-han-purple-1000 px-10 py-4 lg:flex">
            <h1 className="text-2xl font-bold text-white">
              Employment Details
            </h1>
            <div>
              <button
                className="mx-1 cursor-pointer rounded-md border border-white bg-miru-han-purple-1000 px-3 py-2 font-bold text-white	"
                onClick={handleCancelDetails}
              >
                Cancel
              </button>
              <button
                className="mx-1 cursor-pointer rounded-md border bg-white px-3 py-2 font-bold text-miru-han-purple-1000"
                onClick={handleUpdateDetails}
              >
                Update
              </button>
            </div>
          </div>
          {isLoading ? (
            <Loader className="min-h-70v" />
          ) : (
            <StaticPage
              DOJRef={DOJRef}
              DORRef={DORRef}
              dateFormat={dateFormat}
              employeeType={employeeType}
              employeeTypes={employeeTypes}
              employmentDetails={employmentDetails}
              errDetails={errDetails}
              handleAddPastEmployment={handleAddPastEmployment}
              handleDOJDatePicker={handleDOJDatePicker}
              handleDORDatePicker={handleDORDatePicker}
              handleDeletePreviousEmployment={handleDeletePreviousEmployment}
              handleOnChangeEmployeeType={handleOnChangeEmployeeType}
              joinedAt={joinedAt}
              previousEmployments={previousEmployments}
              resignedAt={resignedAt}
              setShowDOJDatePicker={setShowDOJDatePicker}
              setShowDORDatePicker={setShowDORDatePicker}
              showDOJDatePicker={showDOJDatePicker}
              showDORDatePicker={showDORDatePicker}
              updateCurrentEmploymentDetails={updateCurrentEmploymentDetails}
              updatePreviousEmploymentValues={updatePreviousEmploymentValues}
            />
          )}
        </Fragment>
      )}
      {!isDesktop && (
        <Fragment>
          <MobileDetailsHeader
            href="/settings/employment"
            title="Employment Details"
          />
          {isLoading ? (
            <Loader className="min-h-70v" />
          ) : (
            <MobileEditPage
              DOJRef={DOJRef}
              DORRef={DORRef}
              dateFormat={dateFormat}
              employeeType={employeeType}
              employeeTypes={employeeTypes}
              employmentDetails={employmentDetails}
              errDetails={errDetails}
              handleAddPastEmployment={handleAddPastEmployment}
              handleCancelDetails={handleCancelDetails}
              handleDOJDatePicker={handleDOJDatePicker}
              handleDORDatePicker={handleDORDatePicker}
              handleDeletePreviousEmployment={handleDeletePreviousEmployment}
              handleOnChangeEmployeeType={handleOnChangeEmployeeType}
              handleUpdateDetails={handleUpdateDetails}
              joinedAt={joinedAt}
              previousEmployments={previousEmployments}
              resignedAt={resignedAt}
              setShowDOJDatePicker={setShowDOJDatePicker}
              setShowDORDatePicker={setShowDORDatePicker}
              showDOJDatePicker={showDOJDatePicker}
              showDORDatePicker={showDORDatePicker}
              updateCurrentEmploymentDetails={updateCurrentEmploymentDetails}
              updatePreviousEmploymentValues={updatePreviousEmploymentValues}
            />
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

export default EmploymentDetailsEdit;
