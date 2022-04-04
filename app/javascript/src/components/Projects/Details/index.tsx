import * as React from "react";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import projectAPI from "apis/projects";
import AmountBoxContainer from "common/AmountBox";
import ChartBar from "common/ChartBar";
import Table from "common/Table";
import { ArrowLeft, DotsThreeVertical, Receipt, Pencil, UsersThree, Trash } from "phosphor-react";
import { unmapper } from "../../../mapper/project.mapper";

const getTableData = (project) => {
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
  const [isHeaderMenuVisible, setHeaderMenuVisibility] = React.useState<boolean>(false);
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

  const tableData = getTableData(project);

  const tableHeader = [
    {
      Header: "TEAM MEMBER",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: "abc"
    },
    {
      Header: "HOURLY RATE",
      accessor: "col2",
      cssClass: "text-right"
    },
    {
      Header: "HOURS LOGGED",
      accessor: "col3",
      cssClass: "text-right" // accessor is the "key" in the data
    },
    {
      Header: "COST",
      accessor: "col4",
      cssClass: "text-right" // accessor is the "key" in the data
    }
  ];

  const amountBox = [{
    title: "OVERDUE",
    amount: "$35.5k"
  },
  {
    title: "OUTSTANDING",
    amount: "$24.3k"
  }];

  const handleMenuVisibility = () => {
    setHeaderMenuVisibility(!isHeaderMenuVisible);
  };

  const menuBackground = isHeaderMenuVisible ? "bg-miru-gray-1000" : "";

  return (
    <>
      <div className="my-6">
        <div className="flex min-w-0 justify-between">
          <div className="flex align-center">
            <button className="mr-3 hover:bg-miru-gray-1000">
              <ArrowLeft size={20} color="#5b34ea" weight="bold" />
            </button>
            <h2 className="text-3xl mr-2 font-extrabold text-gray-900 sm:text-4xl sm:truncate py-1">
              {project?.name}
            </h2>
            <span className="rounded-xl text-xs self-center  tracking-widest font-semibold px-1 bg-miru-han-purple-100 text-miru-han-purple-1000">
                BILLABLE
            </span>
          </div>
          <div className="relative">
            <button onClick = {handleMenuVisibility} className={`rounded px-2 h-full hover:bg-miru-gray-1000 ${menuBackground}`}>
              <DotsThreeVertical size={20} color="#000000" />
            </button>
            { isHeaderMenuVisible && <ul className="menuButton__wrapper">
              <li>
                <button className="menuButton__list-item">
                  <Receipt size={16} color="#5B34EA" weight="bold" />
                  <span className="ml-3">Generate Invoice</span>
                </button>
              </li>
              <li>
                <button className="menuButton__list-item">
                  <Pencil size={16} color="#5b34ea" weight="bold" />
                  <span className="ml-3">Edit Project Details</span>
                </button>
              </li>
              <li>
                <button className="menuButton__list-item">
                  <UsersThree size={16} color="#5b34ea" weight="bold" />
                  <span className="ml-3">Add/Remove Team Members</span>
                </button>
              </li>
              <li>
                <button className="menuButton__list-item">
                  <Trash size={16} color="#E04646" weight="bold" />
                  <span className="ml-3">Delete Project</span>
                </button>
              </li>
            </ul> }
          </div>
        </div>
        <p className="text-xs ml-8 mt-1 text-miru-dark-purple-400">{project && project.client.name}</p>
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
        <AmountBoxContainer amountBox = {amountBox} />
      </div>
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden">
              { project && <Table tableHeader={tableHeader} tableRowArray={tableData} /> }
            </div>
          </div>
        </div>
      </div>
    </>
  );

};
export default ProjectDetails;
