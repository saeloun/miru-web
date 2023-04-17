import React, { useEffect } from "react";

import MultipleEntriesModal from "components/Invoices/MultipleEntriesModal";

import { sections } from "../../utils";

const MultiLineContainer = ({
  dateFormat,
  selectedClient,
  selectedLineItems,
  setSelectedLineItems,
  multiLineItemModal,
  setMultiLineItemModal,
  setActiveSection,
}) => {
  useEffect(() => {
    if (!multiLineItemModal) {
      setActiveSection(sections.generateInvoice);
    }
  }, [multiLineItemModal]);

  return (
    <div>
      {multiLineItemModal && (
        <MultipleEntriesModal
          dateFormat={dateFormat}
          selectedClient={selectedClient}
          selectedOption={selectedLineItems}
          setMultiLineItemModal={setMultiLineItemModal}
          setSelectedOption={setSelectedLineItems}
        />
      )}
    </div>
  );
};

export default MultiLineContainer;
