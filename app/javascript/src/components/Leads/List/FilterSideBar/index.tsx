import React, { useEffect, useState } from "react";

import { Multiselect } from 'multiselect-react-dropdown';
import { X } from "phosphor-react";

import leadAllowedUsersApi from "apis/lead-allowed-users";
import leadItemsApi from "apis/lead-items";
import leads from "apis/leads";

import { unmapLeadList } from "../../../../mapper/lead.mapper";

const FilterSideBar = ({ setLeadData, setFilterVisibilty, rememberFilter, setRememberFilter }) => {
  const [allowUserList, setAllowUserLIst] = useState<any>([{}]);
  const [qualityOptions, setQualityOptions] = useState<any>([{}]);
  const [statusOptions, setStatusOptions] = useState<any>([{}]);
  const [sourceOptions, setSourceOptions] = useState<any>([{}]);
  const [countryOptions, setCountryOptions] = useState<any>([{}]);
  const [industryOptions, setIndustryOptions] = useState<any>([{}]);

  const [queryParams, setQueryParams] = useState<any>({
    assignees: [],
    reporters: [],
    quality_codes: [],
    country_alphas: [],
    industry_codes: [],
    source_codes: [],
    status_codes: []
  });
  const [stringQueryParams, setStringQueryParams] = useState<any>(null);

  const [selectAssigneeRef, setSelectAssigneeRef] = useState<any>(React.createRef());
  const [selectReporterRef, setSelectReporterRef] = useState<any>(React.createRef());
  const [selectQualityRef, setSelectQualityRef] = useState<any>(React.createRef());
  const [selectCountryRef, setSelectCountryRef] = useState<any>(React.createRef());
  const [selectIndustryRef, setSelectIndustryRef] = useState<any>(React.createRef());
  const [selectSourceRef, setSelectSourceRef] = useState<any>(React.createRef());
  const [selectStatusRef, setSelectStatusRef] = useState<any>(React.createRef());

  const [isApplyFilter, setIsApplyFilter] = useState<boolean>(false);

  const [rememberAssignees, setRememberAssignees] = useState<any>(null);
  const [rememberReporters, setRememberReporters] = useState<any>(null);
  const [rememberQualities, setRememberQualities] = useState<any>(null);
  const [rememberStatus, setRememberStatus] = useState<any>(null);
  const [rememberSources, setRememberSources] = useState<any>(null);
  const [rememberCountries, setRememberCountries] = useState<any>(null);
  const [rememberIndustries, setRememberIndustries] = useState<any>(null);

  useEffect(() => {
    const getLeadItems = async () => {
      leadItemsApi.get()
        .then((data) => {
          setQualityOptions(data.data.quality_codes)
          setCountryOptions(data.data.countries)
          setIndustryOptions(data.data.industry_codes)
          setSourceOptions(data.data.source_codes)
          setStatusOptions(data.data.status_codes)
        }).catch(() => {
          setCountryOptions({})
          setIndustryOptions({})
          setSourceOptions({})
          setStatusOptions({})
        });
      leadAllowedUsersApi.get()
        .then((data) => {
          setAllowUserLIst(data.data.allowed_user_list);
        }).catch(() => {
          setAllowUserLIst({});
        });
    };

    getLeadItems();
  }, []);

  useEffect(() => {
    if (rememberFilter.leadsFilter){
      const filtered = rememberFilter.leadsFilter
      if (allowUserList){
        const fallowAssigneeList = allowUserList.filter(assignee =>
          (filtered.assignees || []).map(Number).includes(parseInt(assignee.id))
        );
        setRememberAssignees([...fallowAssigneeList])

        const fallowReporterList = allowUserList.filter(reporter =>
          (filtered.reporters || []).map(Number).includes(parseInt(reporter.id))
        );
        setRememberReporters([...fallowReporterList])
      }
      if (qualityOptions && filtered.quality_codes){
        const fqualityOptions = qualityOptions.filter(quality =>
          filtered.quality_codes.map(Number).includes(parseInt(quality.id))
        );
        setRememberQualities([...fqualityOptions])
      }
      if (countryOptions && filtered.country_alphas){
        const fcountryOptions = countryOptions.filter(country =>
          filtered.country_alphas.map(Number).includes(parseInt(country[0]))
        );
        setRememberCountries([...fcountryOptions])
      }
      if (industryOptions && filtered.industry_codes){
        const findustryOptions = industryOptions.filter(industry =>
          filtered.industry_codes.map(Number).includes(parseInt(industry.id))
        );
        setRememberIndustries([...findustryOptions])
      }
      if (sourceOptions && filtered.source_codes){
        const fsourceOptions = sourceOptions.filter(source =>
          filtered.source_codes.map(Number).includes(parseInt(source.id))
        );
        setRememberSources([...fsourceOptions])
      }
      if (statusOptions && filtered.status_codes){
        const fstatusOptions = statusOptions.filter(status =>
          filtered.status_codes.map(Number).includes(parseInt(status.id))
        );
        setRememberStatus([...fstatusOptions])
      }
    }
  }, [rememberFilter.leadsFilter, allowUserList, qualityOptions, countryOptions,
    industryOptions, sourceOptions, statusOptions]);

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
      setRememberFilter('leadsFilter', queryParams);
      const applyFilter = async () => {
        leads.get(stringQueryParams)
          .then((res) => {
            const sanitized = unmapLeadList(res);
            setLeadData(sanitized.leadList);
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
      assignees: [],
      reporters: [],
      quality_codes: [],
      country_alphas: [],
      industry_codes: [],
      source_codes: [],
      status_codes: []
    })

    selectAssigneeRef.resetSelectedValues();
    selectReporterRef.resetSelectedValues();
    selectQualityRef.resetSelectedValues();
    selectCountryRef.resetSelectedValues();
    selectIndustryRef.resetSelectedValues();
    selectSourceRef.resetSelectedValues();
    selectStatusRef.resetSelectedValues();
    setIsApplyFilter(true);
  };

  return (
    <div className="sidebar__container flex flex-col overflow-y-auto h-max">
      <div>
        <div className="flex px-5 pt-5 mb-7 justify-between items-center">
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
              <h5 className="text-xs font-normal">ASSIGNEES</h5>
              <Multiselect
                closeOnSelect={true}
                ref={ref => setSelectAssigneeRef(ref)}
                onSelect={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    assignees: selectedOptions.map((selectedOption) => selectedOption.id)
                  }))}
                onRemove={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    assignees: selectedOptions.map((selectedOption) => selectedOption.id)
                  }))}
                style={customStyles}
                options={allowUserList}
                selectedValues={rememberAssignees}
                displayValue="full_name"
              />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">REPORTERS</h5>
              <Multiselect
                closeOnSelect={true}
                ref={ref => setSelectReporterRef(ref)}
                onSelect={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    reporters: selectedOptions.map((selectedOption) => selectedOption.id)
                  }))}
                onRemove={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    reporters: selectedOptions.map((selectedOption) => selectedOption.id)
                  }))}
                style={customStyles}
                options={allowUserList}
                selectedValues={rememberReporters}
                displayValue="full_name"
              />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">QUALITIES</h5>
              <Multiselect
                closeOnSelect={true}
                ref={ref => setSelectQualityRef(ref)}
                onSelect={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    quality_codes: selectedOptions.map((selectedOption) => selectedOption.id)
                  }))}
                onRemove={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    quality_codes: selectedOptions.map((selectedOption) => selectedOption.id)
                  }))}
                style={customStyles}
                options={qualityOptions}
                selectedValues={rememberQualities}
                displayValue="name"
              />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">STATUS</h5>
              <Multiselect
                closeOnSelect={true}
                ref={ref => setSelectStatusRef(ref)}
                onSelect={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    status_codes: selectedOptions.map((selectedOption) => selectedOption.id )
                  }))}
                onRemove={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    status_codes: selectedOptions.map((selectedOption) => selectedOption.id )
                  }))}
                style={customStyles}
                options={statusOptions}
                selectedValues={rememberStatus}
                displayValue="name"
              />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">SOURCES</h5>
              <Multiselect
                closeOnSelect={true}
                ref={ref => setSelectSourceRef(ref)}
                onSelect={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    source_codes: selectedOptions.map((selectedOption) => selectedOption.id )
                  }))}
                onRemove={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    source_codes: selectedOptions.map((selectedOption) => selectedOption.id )
                  }))}
                style={customStyles}
                options={sourceOptions}
                selectedValues={rememberSources}
                displayValue="name"
              />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">COUNTRIES</h5>
              <Multiselect
                closeOnSelect={true}
                ref={ref => setSelectCountryRef(ref)}
                onSelect={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    country_alphas: selectedOptions.map((selectedOption) => selectedOption[0])
                  }))}
                onRemove={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    country_alphas: selectedOptions.map((selectedOption) => selectedOption[0])
                  }))}
                style={customStyles}
                options={countryOptions}
                selectedValues={rememberCountries}
                displayValue="name"
              />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">INDUSTRIES</h5>
              <Multiselect
                closeOnSelect={true}
                ref={ref => setSelectIndustryRef(ref)}
                onSelect={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    industry_codes: selectedOptions.map((selectedOption) => selectedOption.id )
                  }))}
                onRemove={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    industry_codes: selectedOptions.map((selectedOption) => selectedOption.id )
                  }))}
                style={customStyles}
                options={industryOptions}
                selectedValues={rememberIndustries}
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
