import React from "react";

import { currencyFormat } from "helpers";
import {
  DeleteIcon,
  CoinsIcon,
  EarningsIconSVG,
  DeductionIconSVG,
} from "miruIcons";
import "react-phone-number-input/style.css";
import { Button } from "StyledComponents";

import { CustomInputText } from "common/CustomInputText";
import { ErrorSpan } from "common/ErrorSpan";

const EditPage = ({
  handleAddEarning,
  handleAddDeduction,
  updateDeductionValues,
  updateEarningsValues,
  handleDeleteEarning,
  handleDeleteDeduction,
  earnings,
  deductions,
  total,
  currency,
  errDetails,
}) => (
  <div className="mt-4 h-full bg-miru-gray-100 px-10">
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="flex w-1/5 pr-4">
        <img className="mr-4 mt-1 h-4 w-4" src={EarningsIconSVG} />
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Earnings
        </span>
      </div>
      <div className="w-10/12">
        {earnings.length > 0 &&
          earnings.map((earning, index) => (
            <div
              className="mb-6 flex w-full flex-row items-center justify-between"
              key={index}
            >
              <div className="flex w-full flex-row">
                <div className="flex w-1/2 flex-col px-2">
                  <CustomInputText
                    id={`earnings_type_${index}`}
                    label="Earning Type"
                    name="type"
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
                <div className="flex w-1/2 flex-col px-2">
                  <CustomInputText
                    id={`earnings_amount_${index}`}
                    label="Amount"
                    name="amount"
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
              <Button
                className="rounded p-1vh hover:bg-miru-dark-purple-100"
                style="ternary"
                onClick={() => handleDeleteEarning(earning)}
              >
                <DeleteIcon size={16} weight="bold" />
              </Button>
            </div>
          ))}
        <div className="flex items-center justify-between">
          <Button
            className="ml-2 w-full py-3"
            style="dashed"
            onClick={handleAddEarning}
          >
            + Add Earning
          </Button>
          <div className="w-11" />
        </div>
      </div>
    </div>
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="flex w-1/5 pr-4">
        <img className="mr-4 mt-1 h-4 w-4" src={DeductionIconSVG} />
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Deductions
        </span>
      </div>
      <div className="w-10/12">
        {deductions.length > 0 &&
          deductions.map((deduction, index) => (
            <div
              className="mb-6 flex w-full flex-row items-center justify-between"
              key={index}
            >
              <div className="flex w-full flex-row">
                <div className="flex w-1/2 flex-col px-2">
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
                <div className="flex w-1/2 flex-col px-2">
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
              <Button
                className="rounded p-1vh hover:bg-miru-dark-purple-100"
                style="ternary"
                onClick={() => handleDeleteDeduction(deduction)}
              >
                <DeleteIcon size={16} weight="bold" />
              </Button>
            </div>
          ))}
        <div className="flex items-center justify-between">
          <Button
            className="ml-2 w-full py-3"
            style="dashed"
            onClick={handleAddDeduction}
          >
            + Add Deduction
          </Button>
          <div className="w-11" />
        </div>
      </div>
    </div>
    <div className="flex py-10">
      <div className="flex w-1/2 py-5 lg:w-1/5 lg:py-0">
        <CoinsIcon
          className="mr-4 mt-1 text-miru-dark-purple-1000"
          size={16}
          weight="bold"
        />
        <span className="flex flex-wrap text-sm font-medium text-miru-dark-purple-1000">
          Total
        </span>
      </div>
      <div className="flex w-1/2 flex-col justify-center lg:w-full lg:items-end">
        <span className="w-full text-xl font-medium text-miru-dark-purple-1000 lg:w-1/2 lg:text-2xl">
          {currencyFormat(currency, total)}
        </span>
      </div>
    </div>
  </div>
);

export default EditPage;
