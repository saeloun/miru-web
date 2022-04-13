import React, { useState } from "react";

import ManualEntry from "./ManualEntry";
import NewLineItemRow from "./NewLineItemRow";
import NewLineItemTable from "./NewLineItemTable";

const InvoiceTable = ({ newLineItems, setNewLineItems, setShowMultilineModal }) => {

  const [addNew, setAddNew] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [showItemInputs, setShowItemInputs] = useState<boolean>(false);

  return (
    <React.Fragment>
      <table className="w-full table-fixed">
        <thead className="my-2">
          <tr>
            <th className="text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest">
              NAME
            </th>
            <th className=" px-3 text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest">
              DATE
            </th>
            <th className="text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest w-2/5">
              DESCRIPTION
            </th>
            <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
              RATE
            </th>
            <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
              QTY
            </th>
            <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
              LINE TOTAL
            </th>
          </tr>
        </thead>

        <tbody className="w-full">
          {addNew ?
            <NewLineItemTable
              showItemInputs={showItemInputs}
              setShowItemInputs={setShowItemInputs}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              addNew={addNew}
              setAddNew={setAddNew}
              setShowMultilineModal={setShowMultilineModal}
            />
            : (
              <tr className="w-full ">
                <td colSpan={6} className="py-4">
                  <button
                    className=" py-1 tracking-widest w-full bg-white font-bold text-base text-center text-miru-dark-purple-200 rounded-md border-2 border-miru-dark-purple-200 border-dashed"
                    onClick={() => {
                      setAddNew(!addNew);
                    }}
                  >
                    + NEW LINE ITEM
                  </button>
                </td>
              </tr>
            )}

          {showItemInputs
            && <ManualEntry
              setShowItemInputs={setShowItemInputs}
              setNewLineItems={setNewLineItems}
              newLineItems={newLineItems}
            />
          }

          {newLineItems.length > 0
            && newLineItems.map(item => (
              <NewLineItemRow
                item={item}
              />
            ))}
        </tbody>
      </table>
    </React.Fragment>
  );
};

export default InvoiceTable;
