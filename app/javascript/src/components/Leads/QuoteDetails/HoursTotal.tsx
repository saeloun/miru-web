import React, { useState, useEffect } from "react";

const HoursTotal = ({
  newLineItems
}) => {

  const [subTotal, setSubTotal] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const newLineItemsSubTotal = newLineItems.reduce((sum, { estimated_hours }) => (sum + Number(estimated_hours)), 0);

    const newTotal = Number(newLineItemsSubTotal);
    setSubTotal(newLineItemsSubTotal);
    setTotal(newTotal);
  }, [newLineItems]);

  return (
    <div className="pt-3 pb-10 px-10 mb-5 w-full flex justify-end">
      <table className="w-1/3">
        <tbody>
          <tr>
            <td className="font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Sub total
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right ">
              {subTotal}
            </td>
          </tr>
          <tr>
            <td className="pt-1 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Total
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right">
              {total}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default HoursTotal;
