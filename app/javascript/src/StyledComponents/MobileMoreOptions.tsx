import React, { useRef } from "react";

import { useOutsideClick } from "helpers";

import Modal from "./Modal";

type MobileMoreOptionsProps = {
  children?: any;
  className?: string;
  setVisibilty;
  visibilty: boolean;
};

const MobileMoreOptions = ({
  children,
  className = "",
  setVisibilty,
  visibilty,
}: MobileMoreOptionsProps) => {
  const wrapperRef = useRef(null);
  useOutsideClick(wrapperRef, () => setVisibilty(false));

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible"
      isOpen={visibilty}
      onClose={() => setVisibilty(false)}
    >
      <ul className={className} ref={wrapperRef}>
        {children}
      </ul>
    </Modal>
  );
};

export default MobileMoreOptions;
