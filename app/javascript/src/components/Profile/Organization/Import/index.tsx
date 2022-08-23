/* eslint-disable @typescript-eslint/no-var-requires */
import React, { Fragment, useState } from "react";

import Loader from "common/Loader/index";

import ImportCard from "./importCard";
import ImportModal from "./importModal";

import Header from "../../Header";

const importList = [{
  id: 1,
  title: "Invoices",
  description: "Import past invoice data from your previous invoicing tool or software",
  btnText: "START IMPORT",
  fields: ["Invoice number", "Client name", "Issue Date", "Due Date", "Amount", "Status"]
}, {
  id: 2,
  title: "Time Entries",
  description: "Import past time entries from your previous time tracking tool or software",
  btnText: "START IMPORT",
  fields: ["Employee Name", "Date", "Hours", "Status", "Client", "Project", "Description"]
}];

const columnNames = [];

const Import = () => {
  const [isLoading, setisLoading] = useState(false); //eslint-disable-line
  const [file, setFile] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedModal, setSelectedModal] = useState("");
  const [selectedField, setSelectedField] = useState([]);

  const handleOnShowModalClick = (id) => {
    const selectedImportList = importList.find(item => item.id == id);
    setSelectedModal(selectedImportList.title);
    setSelectedField(selectedImportList.fields);
    setShowImportModal(!showImportModal);
  };

  const handleSelectFile = (e) => {
    setFile(e.target.files[0]);
  };

  const handleContinueClick = () => {
    setStep(step + 1);
  };

  const handleToggleModal = () => {
    setShowImportModal(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  return (
    <div className="flex flex-col w-4/5">
      <Header
        title={"Import"}
        subTitle={"Import your data into Miru"}
        showButtons={false}
        cancelAction={() => { }} //eslint-disable-line
        saveAction={() => { }} //eslint-disable-line
        isDisableUpdateBtn={false}
      />
      {isLoading ? <Loader /> : (
        <div className="px-10 py-5 mt-4 bg-miru-gray-100 min-h-70v">
          {importList.map((item, index) => (
            <Fragment key={index}>
              <ImportCard id={item.id} title={item.title} description={item.description} btnText={item.btnText} handleOnShowModalClick={handleOnShowModalClick} />
            </Fragment>
          ))}
        </div>
      )}
      {showImportModal && <ImportModal
        handleSelectFile={handleSelectFile}
        handleContinueClick={handleContinueClick}
        file={file}
        step={step}
        data={selectedField}
        columnNames={columnNames}
        handleToggleModal={handleToggleModal}
        handleRemoveFile={handleRemoveFile}
        title={selectedModal}
      />}
    </div>
  );
};

export default Import;
