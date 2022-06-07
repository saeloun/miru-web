import React, { useState } from "react";

const EditLineItems = ({
  item,
  setSelectedOption,
  selectedOption,
  setEdit
}) => {

  const [name, setName] = useState<any>(item.name);
  const [description, setDescription] = useState<any>(item.description);
  const [comment, setComment] = useState<any>(item.comment || null);
  const [numberOfResource, setNumberOfResource] = useState<any>(item.number_of_resource);
  const [resourceExpertiseLevel, setResourceExpertiseLevel] = useState<any>(item.resource_expertise_level);
  const [estimatedHours, setEstimatedHoures] = useState<any>(item.estimated_hours || null);

  const onEnter = e => {

    if (e.key == "Enter") {
      const sanitizedSelected = selectedOption.filter(option =>
        option.id !== item.id
      );

      setSelectedOption([...sanitizedSelected, {
        name: name,
        description: description,
        comment: comment,
        number_of_resource: numberOfResource,
        resource_expertise_level: resourceExpertiseLevel,
        estimated_hours: estimatedHours
      }]);
      setEdit(false);
    }
  };

  return (
    <tr className="w-full my-1">
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Name"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Description"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Comment"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className=" w-full">
        <input
          type="number"
          min= "0"
          placeholder="Number of resource"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={numberOfResource}
          onChange={e => setNumberOfResource(e.target.value)}
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className=" w-full">
        <input
          type="number"
          min= "0"
          placeholder="Resource Expertise Level"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={resourceExpertiseLevel}
          onChange={e => setResourceExpertiseLevel(e.target.value)}
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className=" w-full">
        <input
          type="number"
          min= "0"
          placeholder="Estimated Hours"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={estimatedHours}
          onChange={e => setEstimatedHoures(e.target.value)}
          onKeyDown={e => onEnter(e)}
        />
      </td>
    </tr>
  );
};

export default EditLineItems;
