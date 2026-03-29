import React from "react";

export const Uploader = ({ isDragActive, getInputProps, getRootProps }) => (
  <div className="dashed-border flex h-20 w-20 cursor-pointer flex-col items-center justify-center border-border text-center text-xs md:h-120 md:w-30 md:rounded">
    <div {...getRootProps({ isDragActive, className: "" })}>
      <input {...getInputProps()} />
      <p className="font-sans text-xs font-bold not-italic text-primary underline">
        Add Logo
      </p>
    </div>
  </div>
);
