import React, { useEffect, useState } from "react";
import engagements from "apis/engagements";
import engagementsItemsApi from 'apis/engagements-items';
import { Multiselect } from 'multiselect-react-dropdown';
import { X } from "phosphor-react";
import { unmapEngagementList } from "../../../../mapper/engagement.mapper";

const FilterSideBar = ({ setEngagementData, setFilterVisibilty, rememberFilter, setRememberFilter, setPagy, params, setParams }) => {
  const [departmentOptions, setDepartmentOptions] = useState<any>([{}]);
  const [engagementOptions, setEngagementOptions] = useState<any>([{}]);

  const [queryParams, setQueryParams] = useState<any>({
    engagements: [],
    departments: []
  });
  const [stringQueryParams, setStringQueryParams] = useState<any>(null);

  const [selectEngagementRef, setSelectEngagementRef] = useState<any>(React.createRef());
  const [selectDepartmentRef, setSelectDepartmentRef] = useState<any>(React.createRef());

  const [isApplyFilter, setIsApplyFilter] = useState<boolean>(false);

  const [rememberDepartments, setRememberDepartments] = useState<any>(null);
  const [rememberEngagements, setRememberEngagements] = useState<any>(null);

  useEffect(() => {
    const getItems = async () => {
      engagementsItemsApi.get()
        .then((data) => {
          setEngagementOptions(data.data.engagements)
          setDepartmentOptions(data.data.departments)
        }).catch(() => {
          setEngagementOptions({})
          setDepartmentOptions({})
        });
    };

    getItems();
  }, []);

  useEffect(() => {
    if (rememberFilter.engagementsFilter){
      const filtered = rememberFilter.engagementsFilter
      if (engagementOptions && filtered.engagements){
        const fengagementOptions = engagementOptions.filter(i =>
          filtered.engagements.map(Number).includes(parseInt(i.id))
        );
        setRememberEngagements([...fengagementOptions])
      }
      if (departmentOptions && filtered.departments){
        const fdepartmentOptions = departmentOptions.filter(i =>
          filtered.departments.map(Number).includes(parseInt(i.id))
        );
        setRememberDepartments([...fdepartmentOptions])
      }
    }
  }, [rememberFilter.engagementsFilter, engagementOptions, departmentOptions]);

  const customStyles = {
    control: (provided) => ({
      ...provided,
      marginTop: "8px",
      backgroundColor: "#F5F7F9",
      color: "#1D1A31",
      minHeight: 32,
      padding: "0"
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: "12px",
      letterSpacing: "2px"
    })
  };

  useEffect(() => {
    if (isApplyFilter){
      setRememberFilter('engagementsFilter', queryParams);
      const updatedParams = { ...params };
      delete updatedParams.engagements;
      delete updatedParams.departments;
      const queryString = {
        page: 1,
        ...(queryParams.engagements && { engagements: queryParams.engagements }),
        ...(queryParams.departments && { departments: queryParams.departments })
      };
      const filterQueryParams = { ...updatedParams, ...queryString };
      setParams(filterQueryParams);
      const applyFilter = async () => {
        engagements.get(new URLSearchParams(filterQueryParams).toString())
          .then((res) => {
            const sanitized = unmapEngagementList(res);
            setEngagementData(sanitized.list);
            setPagy(res.data.pagy);
            setIsApplyFilter(false);
          });
      };

      applyFilter();
    }
  }, [stringQueryParams, isApplyFilter]);

  useEffect(() => {
    setStringQueryParams(new URLSearchParams(queryParams).toString())
  }, [queryParams, isApplyFilter]);

  const resetFilter = async () => {
    setQueryParams({
      departments: [],
      engagements: [],
    })

    selectDepartmentRef.resetSelectedValues();
    selectEngagementRef.resetSelectedValues();
    setIsApplyFilter(true);
  };

  return (
    <div className="flex flex-col overflow-y-auto sidebar__container h-max">
      <div>
        <div className="flex items-center justify-between px-5 pt-5 mb-7">
          <h4 className="text-base font-bold">
            Filter
          </h4>
          <button onClick = {() => setFilterVisibilty(false)}>
            <X size={12} />
          </button>
        </div>
        <div className="sidebar__filters">
          <ul>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Engagement</h5>
              <Multiselect
                closeOnSelect={true}
                avoidHighlightFirstOption={true}
                ref={ref => setSelectEngagementRef(ref)}
                onSelect={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    engagements: selectedOptions.map((selectedOption) => selectedOption.id )
                  }))}
                onRemove={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    engagements: selectedOptions.map((selectedOption) => selectedOption.id )
                  }))}
                style={customStyles}
                options={engagementOptions}
                selectedValues={rememberEngagements}
                displayValue="name"
              />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Department</h5>
              <Multiselect
                closeOnSelect={true}
                avoidHighlightFirstOption={true}
                ref={ref => setSelectDepartmentRef(ref)}
                onSelect={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    departments: selectedOptions.map((selectedOption) => selectedOption.id )
                  }))}
                onRemove={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    departments: selectedOptions.map((selectedOption) => selectedOption.id )
                  }))}
                style={customStyles}
                options={departmentOptions}
                selectedValues={rememberDepartments}
                displayValue="name"
              />
            </li>
          </ul>
        </div>
      </div>
      <div className="sidebar__footer">
        <button
          className="sidebar__reset"
          onClick={() => resetFilter()} >
            RESET
        </button>
        <button className="sidebar__apply" onClick={() => setIsApplyFilter(true)}>APPLY</button>
      </div>
    </div>
  );
};

export default FilterSideBar;
