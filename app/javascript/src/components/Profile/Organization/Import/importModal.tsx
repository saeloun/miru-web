/* eslint-disable no-constant-condition */
import React, { Fragment } from "react";

import { bytesToSize } from "helpers";
import { X } from "phosphor-react";

import ProgressBar from "common/ProgressBar";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const fileIcon = require("../../../../../images/fileIcon.svg"); //eslint-disable-line
const Step = require("../../../../../images/Step.svg"); //eslint-disable-line
const xls = require("../../../../../images/xls.svg"); //eslint-disable-line

const ImportModal = ({
  handleToggleModal,
  handleSelectFile,
  file,
  handleContinueClick,
  step,
  data,
  columnNames,
  handleRemoveFile,
  title
}) => {
  const firstStep = () => (
    <Fragment>
      {!file ? (
        <div className="w-352 h-512 mt-5">
          <label htmlFor="file-input" className="">
            <div className="min-w-full min-h-full dashed-border cursor-pointer rounded border-miru-dark-purple-200 flex flex-col justify-center items-center">
              <div className="flex flex-row ">
                <img src={fileIcon} className="" />
                <p className="text-miru-dark-purple-200 text-base	font-bold tracking-widest ml-4">UPLOAD FILE</p>
              </div>
              <p className="text-miru-dark-purple-200 text-xs font-medium">
                Supported file formats: .xls, .xlsx, .csv
              </p>
            </div>
          </label>
          <input id="file-input" type="file" name="file" className='hidden' onChange={handleSelectFile} accept=".csv, .xls, .xlsx">
          </input>
        </div>
      ) : (
        <div className=" w-352 h-512 mt-5">
          <div className="h-16 bg-miru-gray-100 rounded flex items-center justify-between p-2">
            <div className="w-12 h-12 flex justify-center items-center bg-miru-han-purple-100 rounded">
              <img src={xls} />
            </div>
            <div className="w-228">
              <p className="text-sm	font-medium  truncate">{file.name}</p>
              <p className="text-xs	font-medium text-miru-dark-purple-200"> XLS • {bytesToSize(file.size)}</p>
            </div>
            <button onClick={handleRemoveFile}>
              <X size={15} color="#5B34EA" className="mr-2" />
            </button>
          </div>
        </div>
      )}
      <button
        className="mt-5 w-352 bg-miru-han-purple-1000 text-white rounded py-2 text-base tracking-widest font-bold "
        onClick={handleContinueClick}
      >
        CONTINUE
      </button>
    </Fragment>
  );

  const secondStep = () => (
    <Fragment>
      <div className=" w-352 mt-5">
        <p className="text-xs	font-medium	">We have identified following columns from the file and mapped with the required fields. Please review and confirm.</p>
        <table className="min-w-full mt-5 divide-y divide-gray-200">
          <thead>
            <TableHeader />
          </thead>
          <tbody className="min-w-full divide-y divide-gray-200">
            {data.map((data, id) => (
              <Fragment key={id}>
                <TableRow
                  id={id}
                  field={data}
                  column={columnNames}
                  handleColumnChange={() => { }} //eslint-disable-line
                />
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className="mt-5 w-352 bg-miru-han-purple-1000 text-white rounded py-2 text-base tracking-widest font-bold "
        onClick={handleContinueClick}
      >
        START IMPORT
      </button>
    </Fragment>
  );

  const thirdStep = () => (
    <Fragment>
      <div className=" w-352 mt-5 ">
        {true ? <Fragment>
          <div className=" w-full h-304 bg-miru-gray-100 rounded-lg flex justify-around items-center flex-col">
            <p className="text-base	font-bold	tracking-wide	">Importing 172 time entries</p>
            <div className="h-87 flex justify-center items-baseline text-miru-han-purple-1000">
              <p className="text-6xl font-normal">37</p>
              <p className="text-base font-normal">%</p>
            </div>
            <div className="w-72 h-4 relative bg-miru-gray-200 rounded-2xl">
              <ProgressBar width="37%" />
            </div>
          </div>
          <div className="text-base font-normal text-justify	mt-11">
            This might take some time to complete. We will continue importing in the background even if you close this window and send an email to you when it is completed.
          </div>
          <button
            className="mt-22 w-352 bg-miru-han-purple-1000 text-white rounded py-2 text-base tracking-widest font-bold"
            onClick={handleToggleModal}
          >
            CLOSE WINDOW
          </button>
        </Fragment> :
          <Fragment>
            <div className="w-full h-512 bg-miru-gray-100 rounded-lg flex justify-around items-center flex-col p-4">
              <p className="text-base	font-bold	tracking-wide	">Import complete!</p>
              <div className="h-87 flex justify-center items-baseline text-miru-han-purple-1000">
                <p className="text-6xl font-normal">100</p>
                <p className="text-base font-normal">%</p>
              </div>
              <div className="w-full border-t-2 border-miru-gray-200 ">
                <div className="py-5 text-base font-bold">Import Summary</div>
                <div className="flex justify-between border-b-2 border-miru-gray-200 py-2">
                  <p className="font-normal	text-sm">Total time entries</p>
                  <p className="text-base font-bold">172</p>
                </div>
                <div className="flex justify-between border-b-2 border-miru-gray-200 py-2">
                  <p className="font-normal	text-sm">Successfully imported</p>
                  <p className="text-base font-bold">165</p>
                </div>
                <div className="flex justify-between py-2">
                  <p className="font-normal	text-sm">Failed to import</p>
                  <p className="text-base font-bold">7</p>
                </div>
              </div>
              <div className="font-normal text-base	">
                We have sent a detailed log to your email.
              </div>
            </div>
            <button
              className="mt-10 w-352 bg-miru-han-purple-1000 text-white rounded py-2 text-base tracking-widest font-bold "
              onClick={handleContinueClick}
            >
              IMPORT ANOTHER FILE
            </button>
          </Fragment>
        }
      </div>
    </Fragment>
  );

  return (
    <div className="modal__modal main-modal" style={{ background: "rgba(29, 26, 49,0.6)" }}>
      <div className="modal__container__import__modal modal-container">
        <div className="modal__content modal-content mt-2">
          <div className="modal__position w-352">
            <h6 className="modal__title"> Import {title} </h6>
            <div className="modal__close">
              <button
                className="modal__button"
                onClick={handleToggleModal}
              >
                <X size={15} color="#CDD6DF" />
              </button>
            </div>
          </div>
          <div className="modal__form flex-col justify-center items-center mt-4">
            <div className="w-352 flex flex-row justify-between items-center">
              {step === 1 ? (<div className="import-modal__header-number">
                1
              </div>) : (
                <img src={Step} alt={"step"} height="20px" width="20px"></img>
              )}
              <div className={step === 1 ? "text-miru-han-purple-1000" : "text-miru-chart-green-400"}>
                Upload File
              </div>
              <div className="min-w-24 border border-miru-gray-200 bg-miru-gray-200 h-px">
              </div>
              {step <= 2 ? (<div className="mport-modal__header-number">
                2
              </div>) : (
                <img src={Step} alt={"step"} height="20px" width="20px"></img>
              )
              }
              <div className={step <= 2 ? "text-miru-han-purple-1000 " : "text-miru-chart-green-400"}>
                Map fields
              </div>
              <div className="min-w-24 border border-miru-gray-200 bg-miru-gray-200 h-px">

              </div>
              {step <= 3 ? (<div className="mport-modal__header-number">
                3
              </div>) : (
                <img src={Step} alt={"step"} height="20px" width="20px"></img>
              )
              }
              <div className={step <= 3 ? "text-miru-han-purple-1000 " : "text-miru-chart-green-400"}>
                Import
              </div>
            </div>
            {step === 1 && firstStep()}
            {step === 2 && secondStep()}
            {step === 3 && thirdStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
