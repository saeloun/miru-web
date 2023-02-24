import React from "react";

import { components } from "react-select";

const { ValueContainer, Placeholder } = components;

export const CustomValueContainer = props => {
  const { children } = props;

  return (
    <ValueContainer {...props}>
      <Placeholder {...props}>{props.selectProps.placeholder}</Placeholder>
      {React.Children.map(children, child =>
        child && child.key !== "placeholder" ? child : null
      )}
    </ValueContainer>
  );
};
