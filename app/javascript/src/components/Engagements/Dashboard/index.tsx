import React from 'react';
import { models } from 'powerbi-client';
import { PowerBIEmbed } from 'powerbi-client-react';
import * as config from "./Config";
import 'powerbi-report-authoring';
import './style.scss';

const embedUrl = "https://app.powerbi.com/view?r=eyJrIjoiYzY2N2Q0OTMtNTY5Mi00NDliLTg5OGItOWU4NDg2NWRmZjZjIiwidCI6ImE5NDVmYWM4LTg3NTctNDdlYS05MmZhLWZmYjM5NzA2YmIxNCJ9";

const Dashboard = () => {
  const sampleReportConfig = {
    type: 'report',
    tokenType: models.TokenType.Aad,
    accessToken: undefined,
    embedUrl: embedUrl,
    id: config.reportId,
    settings: undefined,
  };

  return (
    <div className='engagement-dashboard'>
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <PowerBIEmbed
            embedConfig = { sampleReportConfig }
            cssClassName = { "report-style-class" }
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
