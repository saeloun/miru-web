import React from "react";

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
}: MobileMoreOptionsProps) => (
  <Modal
    customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible"
    isOpen={visibilty}
    onClose={() => setVisibilty(false)}
  >
    <ul className={className}>{children}</ul>
  </Modal>
);

export default MobileMoreOptions;
