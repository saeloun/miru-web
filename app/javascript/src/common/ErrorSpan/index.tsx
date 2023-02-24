import React from "react";

export const ErrorSpan = ({ message, className = "text-sm text-red-600" }) => (
  <span className={className}>{message}</span>
);
