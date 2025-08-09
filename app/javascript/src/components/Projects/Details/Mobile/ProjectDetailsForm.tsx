import React from "react";

import EmptyStates from "common/EmptyStates";
import { minToHHMM, currencyFormat } from "helpers";
import { ArrowLeftIcon, DotsThreeVerticalIcon, PlusIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  MobileMoreOptions,
  SummaryDashboard,
} from "StyledComponents";

import HeaderMenuList from "../HeadermenuList";

const ProjectDetailsForm = ({
  project,
  isHeaderMenuVisible,
  setIsHeaderMenuVisible,
  handleAddRemoveMembers,
  handleEditProject,
  handleGenerateInvoice,
  setShowDeleteDialog,
}) => {
  const navigate = useNavigate();
  const summaryList = project
    ? [
        {
          label: "TOTAL HOURS",
          value: parseInt(minToHHMM(project.totalMinutes)),
          hideCurrencySymbol: true,
        },
        {
          label: "OVERDUE",
          value: parseInt(project.overdueOutstandingAmount.overdue_amount),
        },
        {
          label: "OUTSTANDING",
          value: parseInt(project.overdueOutstandingAmount.outstanding_amount),
        },
      ]
    : [];

  return (
    <div className="flex w-full flex-col lg:hidden">
      <div className="flex h-12 w-full items-center bg-white shadow-c1">
        <Button
          className="p-3"
          style="primary_disabled"
          onClick={() => {
            navigate("/projects");
          }}
        >
          <ArrowLeftIcon
            className="text-miru-dark-purple-1000"
            size={16}
            weight="bold"
          />
        </Button>
        <div className="flex w-full py-3">
          <h2 className="mr-3 text-base font-medium text-miru-dark-purple-1000">
            {project?.name}
          </h2>
          {project?.is_billable && (
            <Badge
              bgColor="bg-miru-han-purple-100"
              className="uppercase"
              color="text-miru-han-purple-1000"
              text="billable"
            />
          )}
        </div>
        <Button
          className="p-3"
          style="primary_disabled"
          onClick={() => setIsHeaderMenuVisible(true)}
        >
          <DotsThreeVerticalIcon
            className="text-miru-dark-purple-1000"
            size={16}
            weight="bold"
          />
        </Button>
      </div>
      {isHeaderMenuVisible && (
        <MobileMoreOptions
          className="p-0"
          setVisibilty={setIsHeaderMenuVisible}
          visibilty={isHeaderMenuVisible}
        >
          <HeaderMenuList
            handleAddRemoveMembers={handleAddRemoveMembers}
            handleEditProject={handleEditProject}
            handleGenerateInvoice={handleGenerateInvoice}
            setIsHeaderMenuVisible={setIsHeaderMenuVisible}
            setShowDeleteDialog={setShowDeleteDialog}
          />
        </MobileMoreOptions>
      )}
      <div className="flex flex-1 flex-col p-4">
        {project?.members.length > 0 ? (
          <div>
            {project && (
              <SummaryDashboard
                bgColor="bg-miru-gray-100"
                borderColor="border-miru-gray-200"
                currency={project.overdueOutstandingAmount.currency}
                summaryList={summaryList}
                textColor="text-miru-dark-purple-1000"
              />
            )}
            {project && (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="w-1/4 py-3 text-left text-xs font-medium leading-4 tracking-widest text-miru-dark-purple-600">
                      TEAM <br />
                      MEMBER
                    </th>
                    <th className="py-3 text-right text-xs font-medium leading-4 tracking-widest text-miru-dark-purple-600">
                      HOURLY <br /> RATE
                    </th>
                    <th className="py-3 text-right text-xs font-medium leading-4 tracking-widest text-miru-dark-purple-600">
                      HOURS <br /> LOGGED
                    </th>
                    <th className="self-end py-3 text-right text-xs font-medium leading-4 tracking-widest text-miru-dark-purple-600">
                      COST
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {project.members &&
                    project.members.map(member => (
                      <tr key={member.id}>
                        <td className="py-3 text-left text-sm font-medium leading-5 text-miru-dark-purple-1000">
                          {member.name}
                        </td>
                        <td className="py-3 text-right text-sm font-medium leading-5 text-miru-dark-purple-1000">
                          {currencyFormat(project.currency, member.hourlyRate)}
                        </td>
                        <td className="py-3 text-right text-sm font-medium leading-5 text-miru-dark-purple-1000">
                          {minToHHMM(member.minutes)}
                        </td>
                        <td className="py-3 text-right text-sm font-medium leading-5 text-miru-dark-purple-1000">
                          {currencyFormat(project.currency, member.cost)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="h-full">
            <EmptyStates
              Message="No team member has been added to this project yet."
              showNoSearchResultState={false}
            >
              <Button
                className="flex w-full items-center justify-center p-2 "
                style="primary"
                onClick={handleAddRemoveMembers}
              >
                <PlusIcon className="mr-4 text-white" weight="bold" />
                <span className="text-center text-base font-bold">
                  Add Team Members
                </span>
              </Button>
            </EmptyStates>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsForm;
