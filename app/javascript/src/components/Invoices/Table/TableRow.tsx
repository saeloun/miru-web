import * as React from "react";
import CustomCheckbox from "common/CustomCheckbox";
import { Pen, Trash } from "phosphor-react";
import getStatusCssClass from "../../../utils/getStatusTag";

const TableRow = ({ invoice, handleSelectCheckbox }) => {
  const [grayColor, setGrayColor] = React.useState<string>("");
  const [isHover, setHover] = React.useState<boolean>(false);

  const handleMouseEnter = () => {
    setGrayColor("bg-miru-gray-100");
    setHover(true);
  };

  const handleMouseLeave = () => {
    setGrayColor("");
    setHover(false);
  };

  const handleCheckboxChange = (event) => {
    handleSelectCheckbox(invoice.id, event.target.checked);
  };

  return (
    <tr className={`last:border-b-0 ${grayColor}`} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <td className="px-6 py-5">
        <CustomCheckbox text='' handleCheck={handleCheckboxChange} isChecked={invoice.isChecked} checkboxValue='' id={invoice.id} />
      </td>
      <td className="px-6 py-5 font-medium w-2/4 ftracking-wider">
        <h1 className="font-semibold text-miru-dark-purple-1000">{invoice.invoiceName}</h1>
        <h3 className="font-normal text-sm miru-dark-purple-400">{invoice.invoiceId}</h3>
      </td>
      <td className="px-6 py-5 font-medium w-1/4 tracking-wider">
        <h1 className="font-semibold text-miru-dark-purple-1000">{invoice.invoicedate}</h1>
        <h3 className="font-normal text-sm miru-dark-purple-400">{invoice.invoiceduedate}</h3>
      </td>
      <td className="px-6 py-5 font-bold text-xl text-miru-dark-purple-1000 tracking-wider">
        {invoice.amount}
      </td>
      <td className="px-6 py-5 font-medium">
        <span className={getStatusCssClass(invoice.status)}>
          {invoice.status}
        </span>
      </td>
      <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center h-full">
          { isHover && <button>
            <Pen size={16} color="#5B34EA" />
          </button>
          }
        </div>
      </td>
      <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center h-full">
          { isHover && <button>
            <Trash size={16} color="#5B34EA" />
          </button>
          }
        </div>
      </td>
    </tr>
  );
};

export default TableRow;
