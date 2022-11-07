import React, { useEffect, useState } from "react";

import { models } from 'powerbi-client';
import { PowerBIEmbed } from 'powerbi-client-react';
import 'powerbi-report-authoring';

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import engagements from "apis/engagements";

import Tab from "./../Tab";
import * as config from "./Config";
import './style.scss';

const Dashboard = ({ permissions }) => {
  const [embedUrl, setEmbedUrl] = useState<string>(null);
  const sampleReportConfig = {
    type: 'report',
    tokenType: models.TokenType.Aad,
    accessToken: undefined,
    embedUrl: embedUrl,
    id: config.reportId,
    settings: undefined,
  };

  const fetchDashboard = () => {
    engagements.dashboard()
      .then((res) => {
        setEmbedUrl(res.data.embed_url)
      });
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchDashboard();
  }, [])

  return (
    <>
      <Tab permissions={permissions} tabClassName={'dashboard'}/>
      <div className='engagement-dashboard'>
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            { embedUrl ? <PowerBIEmbed
              embedConfig = { { ...sampleReportConfig, embedUrl: embedUrl } }
              cssClassName = { "report-style-class" }
            /> : "" }
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
