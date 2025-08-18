import React from "react";
import { useMediaQuery } from "../../hooks/use-media-query";

// Desktop Components
import ProjectsList from "./List";
import ProjectDetails from "./Details";

// Mobile Components
import MobileProjectsList from "./List/Mobile";
import MobileProjectDetails from "./Details/Mobile";

interface ResponsiveProjectsProps {
  view?: "list" | "details";
  [key: string]: any;
}

export const ResponsiveProjects: React.FC<ResponsiveProjectsProps> = ({ 
  view = "list", 
  ...props 
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (view === "details") {
    return isDesktop ? (
      <ProjectDetails {...props} />
    ) : (
      <MobileProjectDetails {...props} />
    );
  }

  return isDesktop ? (
    <ProjectsList {...props} />
  ) : (
    <MobileProjectsList {...props} />
  );
};

// Responsive project card component
export const ResponsiveProjectCard: React.FC<any> = (props) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  if (isDesktop) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{props.name}</h3>
            <p className="text-sm text-gray-600">{props.client}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            props.status === 'active' ? 'bg-green-100 text-green-800' :
            props.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            props.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {props.status}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Hours</p>
            <p className="font-semibold">{props.totalHours}h</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Budget</p>
            <p className="font-semibold">{props.budget}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Team</p>
            <p className="font-semibold">{props.teamSize}</p>
          </div>
        </div>
        
        {props.progress !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{props.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${props.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-white border-b border-gray-200 p-4 active:bg-gray-50">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-base">{props.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{props.client}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          props.status === 'active' ? 'bg-green-100 text-green-800' :
          props.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          props.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {props.status}
        </span>
      </div>
      
      <div className="flex justify-between text-sm mb-3">
        <div>
          <span className="text-gray-500">Hours: </span>
          <span className="font-medium">{props.totalHours}h</span>
        </div>
        <div>
          <span className="text-gray-500">Budget: </span>
          <span className="font-medium">{props.budget}</span>
        </div>
      </div>
      
      {props.progress !== undefined && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{props.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${props.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Responsive project member avatar group
export const ResponsiveProjectMembers: React.FC<{ members: any[] }> = ({ members }) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const displayLimit = isDesktop ? 5 : 3;
  const displayMembers = members.slice(0, displayLimit);
  const remainingCount = members.length - displayLimit;
  
  return (
    <div className="flex -space-x-2">
      {displayMembers.map((member, index) => (
        <div
          key={member.id || index}
          className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium"
          title={member.name}
        >
          {member.avatar ? (
            <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full" />
          ) : (
            <span>{member.initials || member.name?.charAt(0)}</span>
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs font-medium text-white">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default ResponsiveProjects;