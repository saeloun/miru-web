import React, { Fragment } from "react";
import { useUserContext } from "context/UserContext";
import { PencilSimple, Trash } from "phosphor-react";
const avatar = require("../../../../../../assets/images/avatar_payments.svg"); // eslint-disable-line

const TableRow = () => {
  const { isAdminUser } = useUserContext();
  return (
    <tbody>
      <tr className="border-b last:border-0 border-miru-gray-200">
        <td className="table__data p-6">
          <img src={avatar} className="table__avatar" />
        </td>
        <td className="table__data p-6">
          Supriya Agrawal
        </td>
        <td className="table__data table__text p-6">
          supriya@saeloun.com
        </td>
        <td className="table__data table__text p-6">
          Admin
        </td>
        {isAdminUser &&
          <Fragment>
            <td className="p-6 text-right">
              <span className="table__pending">
                Pending Invitation
              </span>
            </td>
            <td className="p-6 text-right">
              <div>
                {/* <button>
                  <ArrowCounterClockwise size={16} color="#5b34ea" weight="bold" />
                </button> */}
                <button className="ml-12">
                  <PencilSimple size={16} color="#5b34ea" weight="bold" />
                </button>
                <button className="ml-12">
                  <Trash size={16} color="#5b34ea" weight="bold" />
                </button>
              </div>
            </td>
          </Fragment>
        }
      </tr>
    </tbody>
  );
};

export default TableRow;
