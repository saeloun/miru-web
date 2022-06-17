import React, { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useList } from "context/TeamContext";
import { useUserContext } from "context/UserContext";
import { PencilSimple, Trash } from "phosphor-react";

const TableRow = ({ item }) => {
  const { isAdminUser } = useUserContext();
  const { setModalState } = useList();
  const navigate = useNavigate();

  return (
    <tr className="border-b last:border-0 border-miru-gray-200 hoverIcon" onClick={() => {
      navigate("1");
    }}>
      <td className="table__data p-6">
        <img src={item.profilePicture} className="table__avatar" />
      </td>
      <td className="table__data p-6">
        {item.name}
      </td>
      <td className="table__data table__text p-6">
        {item.email}
      </td>
      <td className="table__data table__text p-6">
        {item.role}
      </td>
      {isAdminUser &&
        <Fragment>
          <td className="pr-6 py-6 text-right w-48">
            {
              item.status && <span className="table__pending">
                Pending Invitation
              </span>
            }
          </td>
          <td className="pr-6 py-6 text-right w-44">
            <div className="invisible iconWrapper">
              <button className="ml-12" onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModalState("addEdit");
              }}>
                <PencilSimple size={16} color="#5b34ea" weight="bold" />
              </button>
              <button className="ml-12" onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModalState("delete");
              }}>
                <Trash size={16} color="#5b34ea" weight="bold" />
              </button>
            </div>
          </td>
        </Fragment>
      }
    </tr>
  );
};

export default TableRow;
