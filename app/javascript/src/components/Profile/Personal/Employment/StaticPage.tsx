import React from "react";

import { ProjectsIcon } from "miruIcons";
import { Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";

import { getLabelForEmployeeType } from "./helpers";

const StaticPage = ({ employmentDetails }) => (
  <div className="mt-4 space-y-6 px-4 md:px-10 lg:px-0">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-miru-dark-purple-1000">
          <ProjectsIcon
            className="mr-2"
            color="#1D1A31"
            size={16}
            weight="bold"
          />
          Current Employment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-miru-dark-purple-600">
              Employee ID
            </span>
            <p className="text-base font-medium text-miru-dark-purple-1000">
              {employmentDetails.current_employment.employee_id || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-miru-dark-purple-600">
              Designation
            </span>
            <p className="text-base font-medium text-miru-dark-purple-1000">
              {employmentDetails.current_employment.designation || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-miru-dark-purple-600">
              Email ID (Official)
            </span>
            <p className="text-base font-medium text-miru-dark-purple-1000">
              {employmentDetails.current_employment.email || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-miru-dark-purple-600">
              Employee Type
            </span>
            <p className="text-base font-medium text-miru-dark-purple-1000">
              {getLabelForEmployeeType(
                employmentDetails.current_employment.employment_type
              )}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-miru-dark-purple-600">
              Date of Joining
            </span>
            <p className="text-base font-medium text-miru-dark-purple-1000">
              {employmentDetails.current_employment.joined_at || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-miru-dark-purple-600">
              Date of Resignation
            </span>
            <p className="text-base font-medium text-miru-dark-purple-1000">
              {employmentDetails.current_employment.resigned_at || "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-miru-dark-purple-1000">
          <Briefcase className="mr-2" color="#1D1A31" size={16} weight="bold" />
          Previous Employment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {employmentDetails?.previous_employments[0]?.company_name ? (
          <div className="space-y-4">
            {employmentDetails.previous_employments.map((previous, index) => (
              <div
                className="grid grid-cols-1 gap-4 md:grid-cols-2 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                key={index}
              >
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-miru-dark-purple-600">
                    Company
                  </span>
                  <p className="text-base font-medium text-miru-dark-purple-1000">
                    {previous.company_name}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-miru-dark-purple-600">
                    Role
                  </span>
                  <p className="text-base font-medium text-miru-dark-purple-1000">
                    {previous.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-miru-dark-purple-600">
            No previous employments found
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);
export default StaticPage;
