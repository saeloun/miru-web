/* eslint-disable no-constant-condition */
import React, { Fragment } from "react";

import ProgressBar from "common/ProgressBar";
import { bytesToSize } from "helpers";
import { XIcon } from "miruIcons";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

import fileIcon from "../../../../../images/fileIcon.svg";
import Step from "../../../../../images/Step.svg";
import xls from "../../../../../images/xls.svg";

const ImportModal = ({
  handleToggleModal,
  handleSelectFile,
  file,
  handleContinueClick,
  step,
  data,
  columnNames,
  handleRemoveFile,
  title,
  importProgress = 0,
  totalEntries = 0,
  importedEntries = 0,
  failedEntries = 0,
}) => {
  const firstStep = () => (
    <Fragment>
      {!file ? (
        <div className="mt-5 h-512 w-352">
          <label className="" htmlFor="file-input">
            <div className="dashed-border flex min-h-full min-w-full cursor-pointer flex-col items-center justify-center rounded border-miru-dark-purple-200">
              <div className="flex flex-row ">
                <img className="" src={fileIcon} />
                <p className="ml-4 text-base	font-bold tracking-widest text-miru-dark-purple-200">
                  UPLOAD FILE
                </p>
              </div>
              <p className="text-xs font-medium text-miru-dark-purple-200">
                Supported file formats: .xls, .xlsx, .csv
              </p>
            </div>
          </label>
          <input
            accept=".csv, .xls, .xlsx"
            className="hidden"
            id="file-input"
            name="file"
            type="file"
            onChange={handleSelectFile}
          />
        </div>
      ) : (
        <div className=" mt-5 h-512 w-352">
          <div className="flex h-16 items-center justify-between rounded bg-miru-gray-100 p-2">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-miru-han-purple-100">
              <img src={xls} />
            </div>
            <div className="w-228">
              <p className="truncate	text-sm  font-medium">{file.name}</p>
              <p className="text-xs	font-medium text-miru-dark-purple-200">
                {" "}
                XLS • {bytesToSize(file.size)}
              </p>
            </div>
            <button onClick={handleRemoveFile}>
              <XIcon className="mr-2" color="#5B34EA" size={15} />
            </button>
          </div>
        </div>
      )}
      <button
        className="mt-5 w-352 rounded bg-miru-han-purple-1000 py-2 text-base font-bold tracking-widest text-white "
        onClick={handleContinueClick}
      >
        CONTINUE
      </button>
    </Fragment>
  );

  const secondStep = () => (
    <Fragment>
      <div className=" mt-5 w-352">
        <p className="text-xs	font-medium	">
          We have identified following columns from the file and mapped with the
          required fields. Please review and confirm.
        </p>
        <table className="mt-5 min-w-full divide-y divide-gray-200">
          <thead>
            <TableHeader />
          </thead>
          <tbody className="min-w-full divide-y divide-gray-200">
            {data.map((data, id) => (
              <Fragment key={id}>
                <TableRow column={columnNames} field={data} id={id} />
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className="mt-5 w-352 rounded bg-miru-han-purple-1000 py-2 text-base font-bold tracking-widest text-white "
        onClick={handleContinueClick}
      >
        START IMPORT
      </button>
    </Fragment>
  );

  const thirdStep = () => (
    <div className=" mt-5 w-352 ">
      {true ? (
        <Fragment>
          <div className=" flex h-304 w-full flex-col items-center justify-around rounded-lg bg-miru-gray-100">
            <p className="tracking-wide	text-base	font-bold	">
              Importing {totalEntries || 0} time entries
            </p>
            <div className="flex h-87 items-baseline justify-center text-miru-han-purple-1000">
              <p className="text-6xl font-normal">{Math.round(importProgress)}</p>
              <p className="text-base font-normal">%</p>
            </div>
            <div className="relative h-4 w-72 rounded-2xl bg-miru-gray-200">
              <ProgressBar width={`${importProgress}%`} />
            </div>
          </div>
          <div className="mt-11 text-justify text-base	font-normal">
            This might take some time to complete. We will continue importing in
            the background even if you close this window and send an email to
            you when it is completed.
          </div>
          <button
            className="mt-22 w-352 rounded bg-miru-han-purple-1000 py-2 text-base font-bold tracking-widest text-white"
            onClick={handleToggleModal}
          >
            CLOSE WINDOW
          </button>
        </Fragment>
      ) : (
        <Fragment>
          <div className="flex h-512 w-full flex-col items-center justify-around rounded-lg bg-miru-gray-100 p-4">
            <p className="tracking-wide	text-base	font-bold	">Import complete!</p>
            <div className="flex h-87 items-baseline justify-center text-miru-han-purple-1000">
              <p className="text-6xl font-normal">100</p>
              <p className="text-base font-normal">%</p>
            </div>
            <div className="w-full border-t-2 border-miru-gray-200 ">
              <div className="py-5 text-base font-bold">Import Summary</div>
              <div className="flex justify-between border-b-2 border-miru-gray-200 py-2">
                <p className="text-sm	font-normal">Total time entries</p>
                <p className="text-base font-bold">{totalEntries || 0}</p>
              </div>
              <div className="flex justify-between border-b-2 border-miru-gray-200 py-2">
                <p className="text-sm	font-normal">Successfully imported</p>
                <p className="text-base font-bold">{importedEntries || 0}</p>
              </div>
              <div className="flex justify-between py-2">
                <p className="text-sm	font-normal">Failed to import</p>
                <p className="text-base font-bold">{failedEntries || 0}</p>
              </div>
            </div>
            <div className="text-base font-normal	">
              We have sent a detailed log to your email.
            </div>
          </div>
          <button
            className="mt-10 w-352 rounded bg-miru-han-purple-1000 py-2 text-base font-bold tracking-widest text-white "
            onClick={handleContinueClick}
          >
            IMPORT ANOTHER FILE
          </button>
        </Fragment>
      )}
    </div>
  );

  return (
    <div
      className="modal__modal main-modal"
      style={{ background: "rgba(29, 26, 49,0.6)" }}
    >
      <div className="modal__container__import__modal modal-container">
        <div className="modal__content modal-content mt-2">
          <div className="modal__position w-352">
            <h6 className="modal__title"> Import {title} </h6>
            <div className="modal__close">
              <button className="modal__button" onClick={handleToggleModal}>
                <XIcon color="#CDD6DF" size={15} />
              </button>
            </div>
          </div>
          <div className="modal__form mt-4 flex-col items-center justify-center">
            <div className="flex w-352 flex-row items-center justify-between">
              {step === 1 ? (
                <div className="import-modal__header-number">1</div>
              ) : (
                <img alt="step" height="20px" src={Step} width="20px" />
              )}
              <div
                className={
                  step === 1
                    ? "text-miru-han-purple-1000"
                    : "text-miru-chart-green-400"
                }
              >
                Upload File
              </div>
              <div className="h-px min-w-24 border border-miru-gray-200 bg-miru-gray-200" />
              {step <= 2 ? (
                <div className="import-modal__header-number">2</div>
              ) : (
                <img alt="step" height="20px" src={Step} width="20px" />
              )}
              <div
                className={
                  step <= 2
                    ? "text-miru-han-purple-1000 "
                    : "text-miru-chart-green-400"
                }
              >
                Map fields
              </div>
              <div className="h-px min-w-24 border border-miru-gray-200 bg-miru-gray-200" />
              {step <= 3 ? (
                <div className="import-modal__header-number">3</div>
              ) : (
                <img alt="step" height="20px" src={Step} width="20px" />
              )}
              <div
                className={
                  step <= 3
                    ? "text-miru-han-purple-1000 "
                    : "text-miru-chart-green-400"
                }
              >
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
