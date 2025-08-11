import React from "react";

import { currencyFormat } from "helpers";
import {
  CoinsIcon,
  DeductionIconSVG,
  DeleteIcon,
  EarningsIconSVG,
} from "miruIcons";
import "react-phone-number-input/style.css";
import { Button } from "StyledComponents";
import { CustomInputText } from "common/CustomInputText";
import { ErrorSpan } from "common/ErrorSpan";

const MobileEditPage = ({
  handleAddEarning,
  handleAddDeduction,
  updateDeductionValues,
  updateEarningsValues,
  handleDeleteEarning,
  handleDeleteDeduction,
  handleCancelDetails,
  handleUpdateDetails,
  earnings,
  deductions,
  total,
  currency,
  errDetails,
}) => (
  <div className="bg-white p-4">
    <div className="border-b border-b-miru-gray-400 pb-10">
      <div className="mt-2 flex w-full">
        <img className="mr-4 mt-1 h-4 w-4" src={EarningsIconSVG} />
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Earnings
        </span>
      </div>
      <div className="mt-6 w-full">
        {earnings.length > 0 ? (
          earnings.map((earning, index) => (
            <div
              className="mb-6 flex w-full flex-col items-center justify-between gap-y-3 "
              key={index}
            >
              <div className="flex w-full flex-row">
                <div className="flex w-11/12 flex-col">
                  <CustomInputText
                    id={`earning_type_${index}`}
                    label="Earnings Type"
                    name={`earning_type_${index}`}
                    type="text"
                    value={earning.type}
                    onChange={e => {
                      updateEarningsValues(earning, e);
                    }}
                  />
                  {errDetails.earning_type_err && (
                    <ErrorSpan
                      className="text-xs text-red-600"
                      message={errDetails.earning_type_err}
                    />
                  )}
                </div>
                <Button
                  className="rounded p-1vh hover:bg-miru-dark-purple-100"
                  style="ternary"
                  onClick={() => handleDeleteEarning(earning)}
                >
                  <DeleteIcon size={16} weight="bold" />
                </Button>
              </div>
              <div className="flex w-full flex-col">
                <CustomInputText
                  id={`earning_amount_${index}`}
                  label="Amount"
                  name={`earning_amount_${index}`}
                  type="text"
                  value={earning.amount}
                  onChange={e => {
                    updateEarningsValues(earning, e);
                  }}
                />
                {errDetails.earning_amount_err && (
                  <ErrorSpan
                    className="text-xs text-red-600"
                    message={errDetails.earning_amount_err}
                  />
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="m-4">No Earnings found</div>
        )}
        <div className="mt-10 flex items-center">
          <Button
            className="w-full py-3"
            style="dashed"
            onClick={handleAddEarning}
          >
            + Add Earning
          </Button>
        </div>
      </div>
    </div>
    <div className="border-b border-b-miru-gray-400 py-10">
      <div className="mt-2 flex w-full">
        <img className="mr-4 mt-1 h-4 w-4" src={DeductionIconSVG} />
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Deductions
        </span>
      </div>
      <div className="mt-6 w-full">
        {deductions.length > 0 ? (
          deductions.map((deduction, index) => (
            <div
              className="mb-6 flex w-full flex-col items-center justify-between gap-y-3"
              key={index}
            >
              <div className="flex w-full flex-row">
                <div className="flex w-11/12 flex-col">
                  <CustomInputText
                    id={`deduction_type_${index}`}
                    label="Deduction Type"
                    name="type"
                    type="text"
                    value={deduction.type}
                    onChange={e => {
                      updateDeductionValues(deduction, e);
                    }}
                  />
                  {errDetails.deduction_type_err && (
                    <ErrorSpan
                      className="text-xs text-red-600"
                      message={errDetails.deduction_type_err}
                    />
                  )}
                </div>
                <Button
                  className="rounded p-1vh hover:bg-miru-dark-purple-100"
                  style="ternary"
                  onClick={() => handleDeleteDeduction(deduction)}
                >
                  <DeleteIcon size={16} weight="bold" />
                </Button>
              </div>
              <div className="flex w-full flex-col">
                <CustomInputText
                  id={`deduction_amount_${index}`}
                  label="Amount"
                  name="amount"
                  type="text"
                  value={deduction.amount}
                  onChange={e => {
                    updateDeductionValues(deduction, e);
                  }}
                />
                {errDetails.deduction_amount_err && (
                  <ErrorSpan
                    className="text-xs text-red-600"
                    message={errDetails.deduction_amount_err}
                  />
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="m-4">No deductions found</div>
        )}
        <div className="mt-10 flex items-center">
          <Button
            className="w-full py-3"
            style="dashed"
            onClick={handleAddDeduction}
          >
            + Add Deductions
          </Button>
        </div>
      </div>
    </div>
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="flex w-1/2 py-5">
        <CoinsIcon
          className="mr-4 mt-1 text-miru-dark-purple-1000"
          size={16}
          weight="bold"
        />
        <span className="flex flex-wrap text-sm font-medium text-miru-dark-purple-1000">
          Total
        </span>
      </div>
      <div className="flex w-1/2 flex-col justify-center">
        <span className="w-full text-xl font-medium text-miru-dark-purple-1000">
          {currencyFormat(currency, total)}
        </span>
      </div>
    </div>
    <div className="mt-4 flex items-center justify-between gap-x-2">
      <div className="w-1/2 text-center">
        <Button
          className="w-full"
          style="secondary"
          onClick={handleCancelDetails}
        >
          Cancel
        </Button>
      </div>
      <div className="w-1/2 text-center">
        <Button className="w-full" onClick={handleUpdateDetails}>
          Update
        </Button>
      </div>
    </div>
  </div>
);

export default MobileEditPage;
