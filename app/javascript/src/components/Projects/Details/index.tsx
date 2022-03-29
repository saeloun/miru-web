import * as React from "react";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import projectAPI from "apis/projects";
import { Member } from "../member";
import ChartBar from "../../../common/ChartBar";
import { unmapper } from '../project.mapper';
import Table from './Table';

export interface IProjectDetails {
  id: number;
  name: string;
  client: any;
  is_billable: boolean;
  total_minutes_logged: number;
  members: any;
  editIcon: string;
  deleteIcon: string;
  isAdminUser: boolean;
  setShowEditDialog: any;
  setProjectToEdit: any;
  setProjectToDelete: any;
  setShowDeleteDialog: any;
  projectClickHandler: any;
}

const BannerBox = ({ title, value }) => (
  <li className="page-display__box">
    <p className="font-normal text-sm tracking-widest">{title}</p>
    <p className="text-5xl font-normal mt-3 tracking-widest">{value}</p>
  </li>
);

const getTableHeader = (project) => {
  if(project) {
    return project.members.map((member, index) => {
      const hours = member.minutes/60;
      const cost = hours * parseInt(member.hourlyRate);

      return {
        col2 : <div>${member.hourlyRate}</div>,
        col4 : <div>${cost}</div>,
        col3 : <div>{member.minutes}</div>,
        col1 : <div>{member.name}</div>
      }
    })
  }
}

const ProjectDetails = ({ id, editIcon, deleteIcon, isAdminUser }) => {

  const [project, setProject] = React.useState<any>();
  const fetchProject = async () => {
    try {
      const resp = await projectAPI.show(id);
      setProject(unmapper(resp.data.project_details));
    } catch (err) {
      // Add error handling
    }
  };

  React.useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchProject();
  }, []);


  const tableHeader = getTableHeader(project)

  const column = [
    {
      Header: 'TEAM MEMBER',
      accessor: 'col1', // accessor is the "key" in the data
    },
    {
      Header: 'HOURLY RATE',
      accessor: 'col2',
    },
    {
      Header: 'HOURS LOGGED',
      accessor: 'col3', // accessor is the "key" in the data
    },
    {
      Header: 'COST',
      accessor: 'col4', // accessor is the "key" in the data
    },
  ];

  return (
    <>
      <div className="bg-miru-gray-100 py-10 px-10">
        <div className="flex justify-end">
          <select className="px-3
              py-1.5
              text-base
              font-normal
              bg-transparent bg-clip-padding bg-no-repeat
              border-none
              transition
              ease-in-out
              m-0
              focus:outline-none
              text-miru-han-purple-1000">
            <option className="text-miru-dark-purple-600" value="week">
                THIS WEEK
            </option>
            <option className="text-miru-dark-purple-600" value="month">
                This MONTH
            </option>
            <option className="text-miru-dark-purple-600" value="year">
                THIS YEAR
            </option>
          </select>
        </div>
        {project && <ChartBar data={project.members} totalMinutes={project.totalMinutes} /> }
        <ul className="page-display__wrap">
          <BannerBox title="OVERDUE" value="$35.5k" />
          <BannerBox title="OUTSTANDING" value="$24.3k" />
        </ul>
      </div>
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden">
              { project && <Table tableHeader={column} tableRowArray={tableHeader} /> }
            </div>
          </div>
        </div>
      </div>
    </>
  );

};
export default ProjectDetails;





// <div>Showing details for project {id}</div>
//       <div>Project name: {project?.name}</div>
//       <div>Client name: {project?.client.name}</div>
//       <div>Billable: {project?.is_billable}</div>
//       <div>Minutes spent(week): {project?.total_minutes_logged}</div>
