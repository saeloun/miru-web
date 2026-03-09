import React from "react";

import { i18n } from "../../../i18n";

const UploadLogo = ({
  formType,
  clientLogoUrl,
  setClientLogoUrl,
  setClientLogo,
  setFileUploadError,
  handleDeleteLogo,
}) => {
  const onLogoChange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const isValid = isValidFileUploaded(file);

    if (isValid.fileExtension && isValid.fileSizeValid) {
      setClientLogoUrl(URL.createObjectURL(file));
      setClientLogo(file);
      setFileUploadError("");
    } else {
      if (!isValid.fileExtension && !isValid.fileSizeValid) {
        setFileUploadError(
          i18n.t("invalidImageFormatSize", { fileSize: "30" })
        );
      } else if (isValid.fileExtension && !isValid.fileSizeValid) {
        setFileUploadError(i18n.t("invalidImageSize", { fileSize: "30" }));
      } else {
        setFileUploadError(i18n.t("invalidImageFormat"));
      }
    }
  };

  const isValidFileUploaded = file => {
    const validExtensions = ["png", "jpeg", "jpg"];
    const fileExtensions = file.type.split("/")[1];
    const validFileByteSize = "30000";
    const fileSize = file.size;

    return {
      fileExtension: validExtensions.includes(fileExtensions),
      fileSizeValid: fileSize <= validFileByteSize,
    };
  };

  const SelectLogo = () => (
    <div className="flex flex-row items-start gap-4">
      <div className="h-20 w-20 flex-shrink-0 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <label
          className="flex h-full w-full cursor-pointer justify-center items-center"
          htmlFor="file-input"
        >
          <span className="text-xs font-medium text-gray-900 hover:text-gray-700">
            Select File
          </span>
        </label>
        <input
          className="hidden"
          id="file-input"
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={onLogoChange}
        />
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        <p>Accepted file formats: PNG and JPG.</p>
        <p>File size should be ≤ 30 KB.</p>
        <p>Image resolution should be 1:1.</p>
      </div>
    </div>
  );

  const EditLogo = () => (
    <div className="flex flex-row items-start gap-4">
      <div className="h-20 w-20 flex-shrink-0 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden relative group">
        <img
          src={clientLogoUrl}
          alt="Client logo"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
          <label
            className="text-xs font-medium text-gray-900 cursor-pointer hover:text-gray-700"
            htmlFor="file_input_edit"
          >
            Edit
          </label>
          <input
            className="hidden"
            id="file_input_edit"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={onLogoChange}
          />
          {clientLogoUrl && (
            <button
              className="text-xs font-medium text-red-600 hover:text-red-700"
              type="button"
              onClick={handleDeleteLogo}
            >
              Delete
            </button>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        <p>Accepted file formats: PNG and JPG.</p>
        <p>File size should be ≤ 30 KB.</p>
        <p>Image resolution should be 1:1.</p>
      </div>
    </div>
  );

  if (formType == "edit" || clientLogoUrl) {
    return <EditLogo />;
  }

  return <SelectLogo />;
};

export default UploadLogo;
