import React from "react";
import { useMediaQuery } from "../../hooks/use-media-query";

interface ResponsiveTeamProps {
  children?: React.ReactNode;
  [key: string]: any;
}

// Responsive team member card
export const ResponsiveTeamMemberCard: React.FC<any> = (props) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  if (isDesktop) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-xl font-semibold">
            {props.avatar ? (
              <img src={props.avatar} alt={props.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span>{props.initials}</span>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{props.name}</h3>
            <p className="text-sm text-gray-600">{props.role}</p>
            <p className="text-sm text-gray-500 mt-1">{props.email}</p>
            
            <div className="flex gap-4 mt-3">
              <div>
                <p className="text-xs text-gray-500 uppercase">Department</p>
                <p className="text-sm font-medium">{props.department}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Status</p>
                <p className="text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    props.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {props.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {props.onEdit && (
              <button 
                onClick={props.onEdit}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {props.onDelete && (
              <button 
                onClick={props.onDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {props.projects && props.projects.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase mb-2">Current Projects</p>
            <div className="flex flex-wrap gap-2">
              {props.projects.map((project, index) => (
                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  {project}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Mobile view
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center font-semibold">
          {props.avatar ? (
            <img src={props.avatar} alt={props.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span>{props.initials}</span>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold">{props.name}</h3>
          <p className="text-sm text-gray-600">{props.role}</p>
          <p className="text-xs text-gray-500">{props.email}</p>
        </div>
        
        <span className={`px-2 py-1 rounded-full text-xs ${
          props.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {props.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      {props.projects && props.projects.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex gap-1 flex-wrap">
            {props.projects.slice(0, 3).map((project, index) => (
              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                {project}
              </span>
            ))}
            {props.projects.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                +{props.projects.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Responsive team stats card
export const ResponsiveTeamStats: React.FC<any> = (props) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  if (isDesktop) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Team Overview</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-2xl font-bold">{props.totalMembers}</p>
            <p className="text-sm text-gray-600">Total Members</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{props.activeMembers}</p>
            <p className="text-sm text-gray-600">Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{props.totalProjects}</p>
            <p className="text-sm text-gray-600">Projects</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{props.totalHours}h</p>
            <p className="text-sm text-gray-600">This Month</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <h3 className="font-semibold mb-3">Team Overview</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-xl font-bold">{props.totalMembers}</p>
          <p className="text-xs text-gray-600">Total Members</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-600">{props.activeMembers}</p>
          <p className="text-xs text-gray-600">Active</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-600">{props.totalProjects}</p>
          <p className="text-xs text-gray-600">Projects</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-purple-600">{props.totalHours}h</p>
          <p className="text-xs text-gray-600">This Month</p>
        </div>
      </div>
    </div>
  );
};

// Main responsive team component
export const ResponsiveTeam: React.FC<ResponsiveTeamProps> = ({ children, ...props }) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  return (
    <div className={isDesktop ? "container mx-auto px-4 py-6" : "pb-16"}>
      {children}
    </div>
  );
};

export default ResponsiveTeam;