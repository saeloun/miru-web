import React, { useState } from "react";

import ManualEntry from "./ManualEntry";
import NewLineItemRow from "./NewLineItemRow";
import NewLineItemTable from "./NewLineItemTable";

const InvoiceTable = () => {

  //States
  const [Addnew, setAddnew] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [ShowItemInputs, setShowItemInputs] = useState<boolean>(false);
  const [NewLineItems, setNewLineItems] = useState<Array<any>>([]);

  return (
    <React.Fragment>
      <table className="w-full table-fixed">
        <thead className="my-2">
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
        </thead>

        <tbody className="w-full">
          {Addnew ?
            <NewLineItemTable
              ShowItemInputs={ShowItemInputs}
              setShowItemInputs={setShowItemInputs}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              Addnew={Addnew}
              setAddnew={setAddnew}
            />
            : (
              <tr className="w-full ">
                <td colSpan={6} className="py-4">
                  <button
                    className=" py-1 tracking-widest w-full bg-white font-bold text-base text-center text-miru-dark-purple-200 rounded-md border-2 border-miru-dark-purple-200 border-dashed"
                    onClick={() => {
                      setAddnew(!Addnew);
                    }}
                  >
                    + NEW LINE ITEM
                  </button>
                </td>
              </tr>
            )}

          {ShowItemInputs
            && <ManualEntry
              setShowItemInputs={setShowItemInputs}
              setNewLineItems={setNewLineItems}
              NewLineItems={NewLineItems}
            />
          }

          {NewLineItems.length > 0
            && NewLineItems.map(item => (
              <NewLineItemRow
                item={item}
              />
            ))
          }
        </tbody>
      </table>
    </React.Fragment>
  );
};

export default InvoiceTable;
