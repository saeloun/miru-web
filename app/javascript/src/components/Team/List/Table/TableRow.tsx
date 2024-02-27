import React, { useState } from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";
import { DotsThreeVerticalIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge, Button } from "StyledComponents";

import { useUserContext } from "context/UserContext";
import getStatusCssClass from "utils/getBadgeStatus";

import MoreOptions from "./MoreOptions";

const TableRow = ({ item }) => {
  const { isDesktop } = useUserContext();

  const navigate = useNavigate();

  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);
  const {
    id,
    name,
    email,
    role,
    status,
    profilePicture,
    joinedAtDate,
    employmentType,
  } = item;

  const calculateWorkDuration = joinedAt => {
    if (!joinedAt) {
      return null;
    }

    const start = dayjs(joinedAt);
    const today = dayjs();

    const daysDifference = today.diff(start, "day");
    const years = Math.floor(daysDifference / 365);
    const months = Math.floor((daysDifference % 365) / 30);
    const days = Math.floor(months % 30);

    const duration =
      (years ? `${years} y` : "") +
      (months ? ` ${months} m` : "") +
      (days ? ` ${days} d` : "");

    return duration;
  };

  const handleRowClick = () => {
    if (status) return;

    if (isDesktop) {
      navigate(`/team/${id}`, { replace: true });
    } else {
      navigate(`/team/${id}/options`, { replace: true });
    }
  };

  return (
    <tr
      className="hoverIcon group grid cursor-pointer grid-cols-4 gap-4 border-b border-miru-gray-200 last:border-0 lg:grid-cols-12"
      onClick={handleRowClick}
    >
      <td className="col-span-2 flex py-2 text-left text-xs font-medium capitalize leading-4 tracking-widest text-miru-dark-purple-600 lg:col-span-4 lg:py-3">
        <div className="my-auto">
          <Avatar url={profilePicture} />
        </div>
        <div className="ml-1 truncate lg:ml-4">
          <dt className="lg:flex">
            <p className="mr-2 text-sm font-bold leading-5 text-miru-dark-purple-1000 lg:text-base">
              {name}
            </p>
            {status && (
              <Badge
                text={status}
                className={`${getStatusCssClass(
                  status
                )} hidden uppercase lg:block`}
              />
            )}
          </dt>
          <dt className="mt-2 truncate text-xs font-medium leading-4 text-miru-dark-purple-400">
            {email}
          </dt>
        </div>
      </td>
      <td className="col-span-2 hidden self-start text-left text-sm font-medium capitalize leading-5 tracking-widest text-miru-dark-purple-1000 lg:table-cell lg:py-3">
        {currencyFormat("USD", "100000")}
      </td>
      <td className="col-span-1 flex self-start py-2  text-left text-sm font-medium capitalize leading-4 tracking-widest text-miru-dark-purple-600 lg:col-span-2 lg:py-3">
        <p className="truncate text-xs lg:text-sm">{role.replace(/_/g, " ")}</p>
        {status && (
          <Badge
            text={status}
            className={`${getStatusCssClass(
              status
            )} mt-2 uppercase xsm:text-xxs lg:hidden lg:text-sm`}
          />
        )}
      </td>
      {!isDesktop && (
        <td className="col-span-1 mx-auto self-center lg:hidden">
          <Button
            style="ternary"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setShowMoreOptions(true);
            }}
          >
            <DotsThreeVerticalIcon
              className="text-miru-dark-purple-1000"
              size={20}
              weight="bold"
            />
          </Button>
        </td>
      )}
      <td className="col-span-2 hidden py-2 text-left text-sm font-medium capitalize leading-4 tracking-widest text-miru-dark-purple-1000 lg:table-cell lg:py-3">
        <div>Client</div>
        <div className="mt-2 text-xs font-medium leading-4 text-miru-dark-purple-400">
          Project
        </div>
      </td>
      <td className="relative col-span-2 hidden py-2 text-left text-xs font-medium capitalize leading-4 tracking-widest text-miru-dark-purple-1000 lg:table-cell lg:py-3">
        <div>{employmentType || "-"}</div>
        <div className="mt-2 text-xs font-medium lowercase leading-4 text-miru-dark-purple-400">
          {calculateWorkDuration(joinedAtDate) || "-"}
        </div>
        {isDesktop && <MoreOptions item={item} />}
      </td>
      {showMoreOptions && (
        <MoreOptions
          item={item}
          setShowMoreOptions={setShowMoreOptions}
          showMoreOptions={showMoreOptions}
        />
      )}
    </tr>
  );
};

export default TableRow;
