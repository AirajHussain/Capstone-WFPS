import React from 'react';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io';


export const SidebarData = [
  {
    title: 'Home',
    path: '/',
    icon: <AiIcons.AiFillHome />,
    cName: 'nav-text'
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: <IoIcons.IoIosPaper />,
    cName: 'nav-text'
  },
  {
    title: 'Tables',
    path: '/tables',
    icon: <FaIcons.FaThList />,
    cName: 'nav-text'
  },
  {
    title: 'MapView',
    path: '/mapview',
    icon: <FaIcons.FaMapMarkedAlt/>,
    cName: 'nav-text'
  },
  {
    title: 'About',
    path: '/about',
    icon: <FaIcons.FaUserAlt/>,
    cName: 'nav-text'
  },

 
];