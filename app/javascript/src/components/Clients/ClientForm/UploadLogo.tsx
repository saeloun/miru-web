import React from "react";

import { EditImageButtonSVG, deleteImageIcon } from "miruIcons";
import { Avatar } from "StyledComponents";

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
    const isValid = isValidFileUploaded(file);

    if (isValid.fileExtension && isValid.fileSizeValid) {
      setClientLogoUrl(URL.createObjectURL(file));
      setClientLogo(file);
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
    <div className="mt-2 flex flex-row">
      <div className="mt-2 h-30 w-30 border border-dashed border-miru-dark-purple-400 ">
        <label
          className="flex h-full w-full cursor-pointer justify-center"
          htmlFor="file-input"
        >
          <div className="m-auto cursor-pointer text-center text-xs font-semibold">
            <p className="text-miru-han-purple-1000">Select File</p>
          </div>
        </label>
        <input
          className="hidden"
          id="file-input"
          name="logo"
          type="file"
          onChange={onLogoChange}
        />
      </div>
      <div className="my-auto ml-6 text-xs font-normal text-miru-dark-purple-400">
        <p>Accepted file formats: PNG and JPG.</p>
        <p>File size should be &#8826; 30 KB.</p>
        <p>Image resolution should be 1:1.</p>
      </div>
    </div>
  );

  const EditLogo = () => (
    <div className="my-4 flex flex-row">
      <div className="mt-2 h-30 w-30 border border-dashed border-miru-dark-purple-400">
        <div className="profile-img relative m-auto h-full w-full cursor-pointer text-center text-xs font-semibold">
          <Avatar
            classNameImg="h-full w-full md:h-full md:w-full"
            url={clientLogoUrl}
          />
          <div className="hover-edit absolute top-0 left-0 h-full w-full bg-miru-white-1000 p-4 opacity-80">
            <button
              className="flex flex-row text-miru-han-purple-1000"
              type="button"
            >
              <label className="flex cursor-pointer" htmlFor="file_input">
                <img
                  alt="edit"
                  className="cursor-pointer rounded-full"
                  src={EditImageButtonSVG}
                  style={{ minWidth: "40px" }}
                />
                <p className="my-auto">Edit</p>
              </label>
              <input
                className="hidden"
                id="file_input"
                name="logo"
                type="file"
                onChange={onLogoChange}
              />
            </button>
            {clientLogoUrl && (
              <button
                className="flex flex-row pl-2 text-miru-red-400"
                type="button"
                onClick={handleDeleteLogo}
              >
                <img
                  alt="delete"
                  src={deleteImageIcon}
                  style={{ minWidth: "20px" }}
                />
                <p className="pl-3">Delete</p>
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="my-auto ml-6 text-xs font-normal text-miru-dark-purple-400">
        <p>Accepted file formats: PNG and JPG.</p>
        <p>File size should be &#8826; 30 KB.</p>
        <p>Image resolution should be 1:1.</p>
      </div>
      <input
        className="hidden"
        id="file_input"
        name="logo"
        type="file"
        onClick={onLogoChange}
      />
    </div>
  );

  if (formType == "edit" || clientLogoUrl) {
    return <EditLogo />;
  }

  return <SelectLogo />;
};

export default UploadLogo;
