import React, { Fragment, useEffect, useRef, useState } from "react";

import teamsApi from "apis/teams";
import Loader from "common/Loader/index";
import { MobileDetailsHeader } from "common/Mobile/MobileDetailsHeader";
import EditHeader from "components/Profile/Common/EditHeader";
import { employmentSchema } from "components/Profile/Schema/employmentSchema";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useOutsideClick } from "helpers";
import { employmentMapper } from "mapper/teams.mapper";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
import { useCurrentUser } from "~/hooks/useCurrentUser";

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
  const { user, isDesktop } = useUserContext();
  const { currentUser } = useCurrentUser();
  const { updateDetails, employmentDetails, isCalledFromSettings } =
    useProfileContext();
  const navigate = useNavigate();
  const { memberId } = useParams();

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
  const [currentUserId, setCurrentUserId] = useState(null);

  // Effect to determine current user ID
  useEffect(() => {
    if (isCalledFromSettings) {
      // Use fresh user data from _me endpoint for settings
      if (currentUser) {
        setCurrentUserId(currentUser.id);
      }
    } else {
      // Use memberId for team view
      setCurrentUserId(memberId);
    }
  }, [isCalledFromSettings, currentUser, memberId]);

  const navigateToPath = isCalledFromSettings
    ? "/settings"
    : `/team/${currentUserId || memberId}`;

  useOutsideClick(DOJRef, () => setShowDOJDatePicker({ visibility: false }));
  useOutsideClick(DORRef, () => setShowDORDatePicker({ visibility: false }));

  const getDetails = async () => {
    if (!currentUserId) return;

    try {
      const curr: any = await teamsApi.getEmploymentDetails(currentUserId);
      const prev: any = await teamsApi.getPreviousEmployments(currentUserId);
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
      updateDetails("employmentDetails", employmentData);
      if (employmentData.previous_employments?.length > 0) {
        setPreviousEmployments(employmentData.previous_employments);
      }
    } catch (error) {
      console.error("Failed to fetch employment details:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUserId) {
      setIsLoading(true);
      getDetails();
    }
  }, [currentUserId]);

  const handleOnChangeEmployeeType = empType => {
    setEmployeeType(empType);
    updateDetails("employmentDetails", {
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
    updateDetails("employmentDetails", {
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
    updateDetails("employmentDetails", {
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
    updateDetails("employmentDetails", {
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

      await teamsApi.updatePreviousEmployments(currentUserId, {
        employments: payload,
      });
      setIsLoading(false);
      navigate(`${navigateToPath}/employment`, { replace: true });
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
    navigate(`${navigateToPath}/employment`, { replace: true });
  };

  return (
    <Fragment>
      {isDesktop && (
        <Fragment>
          <EditHeader
            showButtons
            cancelAction={handleCancelDetails}
            isDisableUpdateBtn={false}
            saveAction={handleUpdateDetails}
            subTitle=""
            title="Employment Details"
          />
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
            href={`${navigateToPath}/employment`}
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
