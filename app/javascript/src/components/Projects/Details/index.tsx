import * as React from "react";
import { ArrowLeft, DotsThreeVertical } from "phosphor-react";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import projectAPI from "apis/projects";
import Table from "../../../common/Table";
import ChartBar from "../../../common/ChartBar";
import { unmapper } from "../../../mapper/project.mapper";

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
  if (project) {
    return project.members.map((member) => {
      const hours = member.minutes/60;
      const cost = hours * parseInt(member.hourlyRate);

      return {
        col1: <div className="text-base text-miru-dark-purple-1000">{member.name}</div>,
        col2: <div className="text-base text-miru-dark-purple-1000 text-right">${member.hourlyRate}</div>,
        col3: <div className="text-base text-miru-dark-purple-1000 text-right">{member.minutes}</div>,
        col4: <div className="text-lg font-bold text-miru-dark-purple-1000 text-right">${cost}</div>
      };
    });
  }
};

const ProjectDetails = ({ id }) => {

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

  const tableHeader = getTableHeader(project);

  const column = [
    {
      Header: "TEAM MEMBER",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: 'abc'
    },
    {
      Header: "HOURLY RATE",
      accessor: "col2",
      cssClass: 'text-right'
    },
    {
      Header: "HOURS LOGGED",
      accessor: "col3",
      cssClass: 'text-right' // accessor is the "key" in the data
    },
    {
      Header: "COST",
      accessor: "col4",
      cssClass: 'text-right' // accessor is the "key" in the data
    }
  ];

  return (
    <>
      <div className="mt-6 mb-3">
        <div className="flex min-w-0 justify-between">
          <div className="flex align-center">
            <button className="mr-3">
              <ArrowLeft size={20} color="#5b34ea" weight="bold" />
            </button>
            <h2 className="text-3xl mr-1 font-extrabold leading-7 text-gray-900 sm:text-4xl sm:truncate py-1">
              {project?.name}
            </h2>
              <span className="rounded-xl text-xs self-center  tracking-widest font-semibold px-1 bg-miru-han-purple-100 text-miru-han-purple-1000">
                BILLABLE
              </span>
          </div>
          <div>
            <DotsThreeVertical size={20} color="#000000" />
          </div>
        </div>
      </div>
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
