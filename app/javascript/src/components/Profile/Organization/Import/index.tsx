import React, { Fragment, useState } from "react";

import Loader from "common/Loader/index";
import { i18n } from "../../../i18n";

import ImportCard from "./importCard";
import ImportModal from "./importModal";

import EditHeader from "../../Common/EditHeader";

const columnNames = [];

const Import = () => {
  const importList = [
    {
      id: 1,
      title: i18n.t("importCatalog.invoices.title"),
      description: i18n.t("importCatalog.invoices.description"),
      btnText: i18n.t("importModal.startImport").toUpperCase(),
      fields: [
        i18n.t("importCatalog.invoices.fields.invoiceNumber"),
        i18n.t("importCatalog.invoices.fields.clientName"),
        i18n.t("importCatalog.invoices.fields.issueDate"),
        i18n.t("importCatalog.invoices.fields.dueDate"),
        i18n.t("importCatalog.invoices.fields.amount"),
        i18n.t("importCatalog.invoices.fields.status"),
      ],
    },
    {
      id: 2,
      title: i18n.t("importCatalog.timeEntries.title"),
      description: i18n.t("importCatalog.timeEntries.description"),
      btnText: i18n.t("importModal.startImport").toUpperCase(),
      fields: [
        i18n.t("importCatalog.timeEntries.fields.employeeName"),
        i18n.t("importCatalog.timeEntries.fields.date"),
        i18n.t("importCatalog.timeEntries.fields.hours"),
        i18n.t("importCatalog.timeEntries.fields.status"),
        i18n.t("importCatalog.timeEntries.fields.client"),
        i18n.t("importCatalog.timeEntries.fields.project"),
        i18n.t("importCatalog.timeEntries.fields.description"),
      ],
    },
  ];
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
        subTitle={i18n.t("importCatalog.subtitle")}
        title={i18n.t("importModal.import")}
      />
      {isLoading ? (
        <Loader className="min-h-70v" />
      ) : (
        <div className="mt-4 min-h-70v bg-muted px-10 py-5">
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
