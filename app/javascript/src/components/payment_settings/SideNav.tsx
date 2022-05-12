/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";
const profile = require("../../../../assets/images/Avatar.svg");

const SideNav = () =>(
  <div className='flex flex-col'>
    <div className='mr-2 w-60 h-16 p-2 bg-miru-han-purple-1000 flex text-white'>
      <img src={profile} className='mr-2'/>
      <div className='flex flex-col'>
        <span className='font-bold text-base leading-5 pt-1'>John Smith</span>
        <span className='font-normal text-xs leading-4'>john.smith@saeloun.com</span>
      </div>
    </div>

    <div className='mr-2 mt-4 w-60 bg-miru-gray-100 h-screen'>
      <ul className='list-none text-sm font-medium leading-5 tracking-wider'>
        <li className='pl-6 py-5 border-b-2 border-miru-gray-400'>PROFILE SETTINGS</li>
        <li className='pl-6 py-5 border-b-2 border-miru-gray-400'>ORGANIZATION SETTINGS</li>
        <li className='pl-6 py-5 border-l-8 border-miru-han-purple-600 bg-miru-gray-200 text-miru-han-purple-600'>PAYMENT SETTINGS</li>
        <li className='pl-6 py-5 border-b-2 border-miru-gray-400'>BILLING</li>
      </ul>
    </div>
  </div>
);

export default SideNav;
