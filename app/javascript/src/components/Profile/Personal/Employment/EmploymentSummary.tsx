import React from "react";

import { ProjectsIcon } from "miruIcons";
import { Briefcase } from "phosphor-react";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { i18n } from "../../../../i18n";

import { getLabelForEmployeeType } from "./helpers";

const EmploymentSummary = ({ employmentDetails }) => (
  <div className="mt-4 space-y-6 px-4 md:px-10 lg:px-0">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-foreground">
          <ProjectsIcon
            className="mr-2"
            color="currentColor"
            size={16}
            weight="bold"
          />
          {i18n.t("profile.currentEmployment")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-muted-foreground">
              {i18n.t("profile.employeeId")}
            </span>
            <p className="text-base font-medium text-foreground">
              {employmentDetails.current_employment.employee_id || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-muted-foreground">
              {i18n.t("profile.designation")}
            </span>
            <p className="text-base font-medium text-foreground">
              {employmentDetails.current_employment.designation || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-muted-foreground">
              {i18n.t("profile.officialEmail")}
            </span>
            <p className="text-base font-medium text-foreground">
              {employmentDetails.current_employment.email || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-muted-foreground">
              {i18n.t("profile.employmentType")}
            </span>
            <p className="text-base font-medium text-foreground">
              {getLabelForEmployeeType(
                employmentDetails.current_employment.employment_type
              )}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-muted-foreground">
              {i18n.t("profile.dateOfJoining")}
            </span>
            <p className="text-base font-medium text-foreground">
              {employmentDetails.current_employment.joined_at || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-muted-foreground">
              {i18n.t("profile.dateOfResignation")}
            </span>
            <p className="text-base font-medium text-foreground">
              {employmentDetails.current_employment.resigned_at || "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-foreground">
          <Briefcase
            className="mr-2"
            color="currentColor"
            size={16}
            weight="bold"
          />
          {i18n.t("profile.previousEmployment")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {employmentDetails?.previous_employments[0]?.company_name ? (
          <div className="space-y-4">
            {employmentDetails.previous_employments.map((previous, index) => (
              <div
                className="grid grid-cols-1 gap-4 border-b border-border pb-4 last:border-0 last:pb-0 md:grid-cols-2"
                key={index}
              >
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {i18n.t("profile.company")}
                  </span>
                  <p className="text-base font-medium text-foreground">
                    {previous.company_name}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {i18n.t("role")}
                  </span>
                  <p className="text-base font-medium text-foreground">
                    {previous.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {i18n.t("profile.noPreviousEmployments")}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);

export default EmploymentSummary;
