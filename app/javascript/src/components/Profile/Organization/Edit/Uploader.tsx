import React from "react";

export const Uploader = ({ isDragActive, getInputProps, getRootProps }) => (
  <section className="dashed-border flex h-120 w-30 cursor-pointer flex-col items-center justify-center rounded border-miru-dark-purple-100 text-center text-xs">
    <div {...getRootProps({ isDragActive, className: "" })}>
      <input {...getInputProps()} />
      <div className="font-semibold text-miru-dark-purple-400">Drop logo</div>
      <div className="font-semibold text-miru-dark-purple-400">or</div>
      <div className="underline-offset-1 font-semibold text-miru-han-purple-1000 underline">
        Select File
      </div>
    </div>
  </section>
);
