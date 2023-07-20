import React from "react";

export const Uploader = ({ isDragActive, getInputProps, getRootProps }) => (
  <div className="dashed-border flex h-20 w-20 cursor-pointer flex-col items-center justify-center border-miru-dark-purple-100 text-center text-xs md:h-120 md:w-30 md:rounded">
    <div {...getRootProps({ isDragActive, className: "" })}>
      <input {...getInputProps()} />
      <p className="font-manrope text-xs font-bold not-italic text-miru-han-purple-1000 underline">
        Add Logo
      </p>
    </div>
  </div>
);
