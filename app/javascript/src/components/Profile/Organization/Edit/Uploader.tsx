import React from "react";

export const Uploader = ({ isDragActive, getInputProps, getRootProps }) => (
  <section className="dashed-border flex h-20 w-20 cursor-pointer flex-col items-center justify-center border-miru-dark-purple-100 text-center text-xs md:h-120 md:w-30 md:rounded">
    <div {...getRootProps({ isDragActive, className: "" })}>
      <input {...getInputProps()} />
      {/* <div className="font-semibold text-miru-dark-purple-400">Drop logo</div>
      <div className="font-semibold text-miru-dark-purple-400">or</div>
      <div className="underline-offset-1 font-semibold text-miru-han-purple-1000 underline">
        Select File
      </div> */}
      <p className="font-manrope text-xs font-bold not-italic text-miru-han-purple-1000 underline">
        Add Logo
      </p>
    </div>
  </section>
);
