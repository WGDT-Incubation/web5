"use client";

import React, { useState } from "react";
import "./Navbar.css";
import { IoLogOutOutline } from "react-icons/io5";
import { useRouter } from 'next/navigation';
import logoMin from '../../../../public/images/WF-Logo.svg';
import Image from "next/image";

const Navbar = () => {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    setDropdownOpen(false);
    router.push('/');
  };

  return (
    <nav className="main-nav-container">
      <div className="nav-left">
        <Image src={logoMin} alt='logo' className='logo-image-nav'/>
        <h1 className="decentralized-heading">Praman Patra Mitra</h1>
      </div>

      <div className="nav-right">
        {/* <div className="icon-container">
          <MdNotifications size={24} className="notif-icon" />
          <span className="notif-badge">2</span>
        </div> */}

        {/* <div className="language-container">
          <Image src="https://flagcdn.com/w40/gb.png" alt="English" className="flag" width={200} height={200}/>
          <span>English</span>
          <FaChevronDown size={10} />
        </div> */}

        <div className="profile-container" onClick={() => setDropdownOpen(!dropdownOpen)}>
          {/* <Image
            src="https://randomuser.me/api/portraits/men/79.jpg"
            alt="Admin"
            className="avatar"
            width={200}
            height={200}
          /> */}
          <div className="profile-info">
            <p className="profile-name">Super Admin</p>
            <span className="profile-role">Admin</span>
          </div>
          <button className="dropdown-btn-nav" onClick={handleLogout}>
                  <IoLogOutOutline size={20} className="logout-nav-icon"/> Logout
                </button>
          {/* <FaChevronDown size={12} />
          {dropdownOpen && (
            <div className="dropdown-menu-nav">
         
               
           
            </div>
          )} */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
