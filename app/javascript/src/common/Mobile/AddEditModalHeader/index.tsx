import React from "react";

import { X } from "phosphor-react";

const AddEditModalHeader = ({ title, handleOnClose }) => (
  <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 text-foreground">
    <span className="w-full pl-6 text-center text-base font-semibold leading-5 text-foreground">
      {title}
    </span>
    <button
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground"
      onClick={handleOnClose}
      type="button"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
);

export default AddEditModalHeader;
