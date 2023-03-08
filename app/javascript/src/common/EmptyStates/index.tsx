import React from "react";

import classNames from "classnames";
import { EmptyState, NoSearchResultsState } from "miruIcons";

type EmptyStateProps = {
  Message: string;
  children?: any;
  showNoSearchResultState: boolean;
  wrapperClassName?: string;
  messageClassName?: string;
  containerClassName?: string;
};

const EmptyStates = ({
  Message,
  showNoSearchResultState,
  children,
  wrapperClassName,
  messageClassName,
  containerClassName,
}: EmptyStateProps) => {
  const defaultContainerClassName = `mt-6 flex h-5/6 items-center justify-center ${
    showNoSearchResultState ? " bg-transparent" : "lg:bg-miru-gray-100"
  }`;

  const defaultMessageClass =
    "w-7/12 mt-10 mb-5 text-center text-base font-semibold leading-5 text-miru-dark-purple-200 lg:text-lg lg:leading-7";

  const defaultWrapperClassName = "flex flex-col items-center justify-between";

  return (
    <div className={classNames(defaultContainerClassName, containerClassName)}>
      <div className={classNames(defaultWrapperClassName, wrapperClassName)}>
        {showNoSearchResultState ? (
          <img src={NoSearchResultsState} />
        ) : (
          <img src={EmptyState} />
        )}
        <span className={classNames(defaultMessageClass, messageClassName)}>
          {Message}
        </span>
        {children}
      </div>
    </div>
  );
};

export default EmptyStates;
