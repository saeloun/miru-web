import React, { Fragment, useState } from "react";

import Loader from "common/Loader/index";

import ImportCard from "./importCard";
import ImportModal from "./importModal";

import EditHeader from "../../Common/EditHeader";

const importList = [
  {
    id: 1,
    title: "Invoices",
    description:
      "Import past invoice data from your previous invoicing tool or software",
    btnText: "START IMPORT",
    fields: [
      "Invoice number",
      "Client name",
      "Issue Date",
      "Due Date",
      "Amount",
      "Status",
    ],
  },
  {
    id: 2,
    title: "Time Entries",
    description:
      "Import past time entries from your previous time tracking tool or software",
    btnText: "START IMPORT",
    fields: [
      "Employee Name",
      "Date",
      "Hours",
      "Status",
      "Client",
      "Project",
      "Description",
    ],
  },
];

const columnNames = [];

const Import = () => {
  const [isLoading, setisLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedModal, setSelectedModal] = useState("");
  const [selectedField, setSelectedField] = useState([]);

  const handleOnShowModalClick = id => {
    const selectedImportList = importList.find(item => item.id == id);
    setSelectedModal(selectedImportList.title);
    setSelectedField(selectedImportList.fields);
    setShowImportModal(!showImportModal);
  };

  const handleSelectFile = e => {
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
    <div className="flex w-4/5 flex-col">
      <EditHeader
        isDisableUpdateBtn={false}
        showButtons={false}
        subTitle="Import your data into Miru"
        title="Import"
      />
      {isLoading ? (
        <Loader className="min-h-70v" />
      ) : (
        <div className="mt-4 min-h-70v bg-miru-gray-100 px-10 py-5">
          {importList.map((item, index) => (
            <Fragment key={index}>
              <ImportCard
                btnText={item.btnText}
                description={item.description}
                handleOnShowModalClick={handleOnShowModalClick}
                id={item.id}
                title={item.title}
              />
            </Fragment>
          ))}
        </div>
      )}
      {showImportModal && (
        <ImportModal
          columnNames={columnNames}
          data={selectedField}
          file={file}
          handleContinueClick={handleContinueClick}
          handleRemoveFile={handleRemoveFile}
          handleSelectFile={handleSelectFile}
          handleToggleModal={handleToggleModal}
          step={step}
          title={selectedModal}
        />
      )}
    </div>
  );
};

export default Import;
