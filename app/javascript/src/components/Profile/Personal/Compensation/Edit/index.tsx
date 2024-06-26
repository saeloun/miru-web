/* eslint-disable no-unused-vars */
import React, { Fragment, useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import Loader from "common/Loader/index";
import { CompensationDetailsState } from "components/Profile/Context/CompensationDetailsState";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";

import EditPage from "./EditPage";
import MobileEditPage from "./MobileEditPage";

import Header from "../../../Common/EditHeader";

const CompensationEditPage = () => {
  const initialErrState = {
    earning_type_err: "",
    earning_amount_err: "",
    deduction_type_err: "",
    deduction_amount_err: "",
  };
  const navigate = useNavigate();
  const { memberId } = useParams();
  const { isDesktop, company } = useUserContext();
  const { isCalledFromSettings } = useProfileContext();
  const navigateToPath = isCalledFromSettings
    ? "/settings"
    : `/team/${memberId}`;
  const [isLoading, setIsLoading] = useState(false);
  const [earnings, setEarnings] = useState<Array<object>>(
    CompensationDetailsState.earnings
  );

  const [deductions, setDeductions] = useState<Array<object>>(
    CompensationDetailsState.deductions
  );

  const [total, setTotal] = useState<number | string>(
    CompensationDetailsState.total.amount
  );
  const [errDetails, setErrDetails] = useState<object>({});

  useEffect(() => {
    setIsLoading(true);
    getDevicesDetail();
    setErrDetails(initialErrState);
  }, []);

  useEffect(() => {
    const totalEarnings = earnings.reduce(
      (accumulator, currentValue) => accumulator + currentValue["amount"],
      0.0
    );

    const totalDeductions = deductions.reduce(
      (accumulator, currentValue) => accumulator + currentValue["amount"],
      0.0
    );
    setTotal(totalEarnings - totalDeductions);
  }, [deductions, earnings]);

  const getDevicesDetail = async () => {
    setIsLoading(false);
  };

  const handleAddDeduction = () => {
    const newDeduction = [...deductions, { deduction_type: "", amount: "" }];
    setDeductions(newDeduction);
  };

  const handleAddEarning = () => {
    const newEarning = [...earnings, { earning_type: "", amount: "" }];
    setEarnings(newEarning);
  };

  const handleDeleteDeduction = deduction => {
    setDeductions(deductions.filter(d => d !== deduction));
  };

  const handleDeleteEarning = earning => {
    setEarnings(earnings.filter(e => e !== earning));
  };

  const updateEarningsValues = (earning, event) => {
    const { name, value } = event.target;
    const updatedEarnings = earnings.map(e =>
      e == earning ? { ...e, [name]: value } : e
    );
    setEarnings(updatedEarnings);
  };

  const updateDeductionValues = (deduction, event) => {
    const { name, value } = event.target;
    const updatedDeductions = deductions.map(d =>
      d == deduction ? { ...d, [name]: value } : d
    );
    setDeductions(updatedDeductions);
  };

  const handleUpdateDetails = () => {
    //Todo: API integration for update details
  };

  const handleCancelDetails = () => {
    setIsLoading(true);
    navigate(`${navigateToPath}/compensation`, { replace: true });
  };

  return (
    <Fragment>
      <Header
        showButtons
        cancelAction={handleCancelDetails}
        isDisableUpdateBtn={false}
        saveAction={handleUpdateDetails}
        subTitle=""
        title="Compensation"
      />
      {isLoading ? (
        <Loader className="min-h-70v" />
      ) : (
        <Fragment>
          {isDesktop && (
            <EditPage
              currency={company.base_currency}
              deductions={deductions}
              earnings={earnings}
              errDetails={errDetails}
              handleAddDeduction={handleAddDeduction}
              handleAddEarning={handleAddEarning}
              handleDeleteDeduction={handleDeleteDeduction}
              handleDeleteEarning={handleDeleteEarning}
              total={total}
              updateDeductionValues={updateDeductionValues}
              updateEarningsValues={updateEarningsValues}
            />
          )}
          {!isDesktop && (
            <MobileEditPage
              currency={company.base_currency}
              deductions={deductions}
              earnings={earnings}
              errDetails={errDetails}
              handleAddDeduction={handleAddDeduction}
              handleAddEarning={handleAddEarning}
              handleCancelDetails={handleCancelDetails}
              handleDeleteDeduction={handleDeleteDeduction}
              handleDeleteEarning={handleDeleteEarning}
              handleUpdateDetails={handleUpdateDetails}
              total={total}
              updateDeductionValues={updateDeductionValues}
              updateEarningsValues={updateEarningsValues}
            />
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

export default CompensationEditPage;
