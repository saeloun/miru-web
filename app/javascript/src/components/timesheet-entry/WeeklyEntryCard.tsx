import * as React from "react";
const { useState, useEffect } = React;
interface Props {
  clients: object;
  projects: object;
  newRowView: boolean;
  setNewRowView: React.Dispatch<React.SetStateAction<boolean>>;
}

const WeeklyEntryCard: React.FC<Props> = ({
  clients,
  projects,
  newRowView,
  setNewRowView
}) => {
  const [selectedInputBox, setSelectedInputBox] = useState(-1);
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [projectId, setProjectId] = useState(0);
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState(0);
  const [projectSelected, setProjectSelected] = useState(true);
  const [showNote, setShowNote] = useState(false);
  const [weeklyTotalHours, setWeeklyTotalHours] = useState(0);

  const handleEditProject: React.ChangeEventHandler<HTMLSelectElement> = e => {
    setProject(e.target.value);
    setProjectSelected(true);
  };

  return projectSelected ? (
    <div className="p-6 max-h-50 w-full mt-4 shadow-2xl rounded-lg">
      <div className="flex items-center">
        <div className="flex mr-10 w-44">
          <p className="text-lg">Client</p>
          <p className="text-lg mx-2">•</p>
          <p className="text-lg">Project</p>
        </div>
        <div className="w-138 flex justify-between items-center mr-7">
          {[1, 2, 3, 4, 5, 6, 7].map((entryInfo, index: number) =>
            index === selectedInputBox ? (
              <input
                value={"08:00"}
                className="focus:outline-none focus:border-miru-han-purple-400 bold text-xl content-center px-1 py-4 w-18 h-15 border-2 rounded bg-miru-gray-100"
              />
            ) : (
              <div
                onClick={() => {
                  setSelectedInputBox(index);
                  setShowNote(true);
                }}
                className="bold text-xl content-center px-1 py-4 w-18 h-15 border-2 rounded bg-miru-gray-100"
              >
                {"08:00"}
              </div>
            )
          )}
        </div>
        <div className="text-xl font-bold">40:00</div>
        <div className="flex justify-around">
          <img
            onClick={() => setProjectSelected(false)}
            src="/edit.svg"
            alt="edit"
            className="ml-8"
          />
          <img src="/delete.svg" alt="delete" className="ml-8" />
        </div>
      </div>
      {showNote && (
        <div className="mt-4 mx-54 flex justify-between bg-miru-gray-100 w-138 rounded">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note"
            className="rounded w-full p-2 bg-miru-gray-100 outline-none resize-none"
          ></textarea>
          <div className="h-18 w-34">
            <button
              className={
                "m-2 mb-1 inline-block h-6 w-30 text-xs py-1 px-6 rounded border text-white font-bold tracking-widest " +
                // eslint-disable-next-line no-constant-condition
                ("note" && "client" && "project"
                  ? "bg-miru-han-purple-1000 hover:border-transparent"
                  : "bg-miru-gray-1000")
              }
            >
              SAVE
            </button>
            <button
              onClick={() => {
                setNote("");
                setShowNote(false);
              }}
              className="m-2 mt-1  inline-block h-6 w-30 text-xs py-1 px-6 rounded border border-miru-han-purple-1000 bg-transparent hover:bg-miru-han-purple-1000 text-miru-han-purple-600 font-bold hover:text-white hover:border-transparent tracking-widest"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="flex justify-between p-4 rounded-md shadow-2xl content-center">
      <select
        onChange={e => {
          setClient(e.target.value);
          setProject(projects[e.target.value][0].name);
        }}
        value={client || "Client"}
        name="client"
        id="client"
        className="w-80 bg-miru-gray-100 rounded-sm h-8"
      >
        {!client && (
          <option disabled selected className="text-miru-gray-100">
            Client
          </option>
        )}
        {clients.map((c, i) => (
          <option key={i.toString()}>{c.name}</option>
        ))}
      </select>
      <select
        onChange={e => {
          setProject(e.target.value);
        }}
        value={project}
        name="project"
        id="project"
        className="w-80 bg-miru-gray-100 rounded-sm h-8"
      >
        {!project && (
          <option disabled selected className="text-miru-gray-100">
            Project
          </option>
        )}
        {client &&
          projects[client].map((p, i) => (
            <option data-project-id={p.id} key={i.toString()}>
              {p.name}
            </option>
          ))}
      </select>

      <button
        onClick={() => setProjectSelected(true)}
        className={
          "mb-1 h-8 w-38 text-xs py-1 px-6 rounded border text-white font-bold tracking-widest " +
          (client && project
            ? "bg-miru-han-purple-1000 hover:border-transparent"
            : "bg-miru-gray-1000")
        }
      >
        SAVE
      </button>
      <button
        onClick={() => {
          if (newRowView) setNewRowView(false);
          setClient("");
          setProject("");
        }}
        className="h-8 w-38 text-xs py-1 px-6 rounded border border-miru-han-purple-1000 bg-transparent hover:bg-miru-han-purple-1000 text-miru-han-purple-600 font-bold hover:text-white hover:border-transparent tracking-widest"
      >
        CANCEL
      </button>
    </div>
  );
};

export default WeeklyEntryCard;
