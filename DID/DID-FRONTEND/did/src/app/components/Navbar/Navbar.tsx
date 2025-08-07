"use client";

import React, { useState, useEffect } from "react";
import "./Navbar.css";
import { MdNotifications } from "react-icons/md";
import { FaChevronDown } from "react-icons/fa";
import { IoLogInOutline, IoLogOutOutline } from "react-icons/io5";
import { useRouter } from 'next/navigation';
import profileLogo from '../../../../public/images/profileLogo.png'
import Image from "next/image";
import logoMin from '../../../../public/images/WF-Logo.svg'
const Navbar = () => {
  const router = useRouter();
  const [jwt, setJwt] = useState("fake-jwt-token"); 
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [issuerDepartment, setIssuerDepartment] = useState<string | null>(null);
  const handleLogin = () => {
    setJwt("fake-jwt-token");
    setDropdownOpen(false);
  };
  useEffect(() => {
    
    setIssuerDepartment(localStorage.getItem("issuerDepartment"));
  }, []);
  const handleLogout = () => {
    setJwt("");
    setDropdownOpen(false);
    router.push('/');
    localStorage.removeItem('authToken')
    localStorage.removeItem('userEmail')

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
          <img src="https://flagcdn.com/w40/gb.png" alt="English" className="flag" />
          <span>English</span>
          <FaChevronDown size={10} />
        </div> */}

        <div className="profile-container" onClick={() => setDropdownOpen(!dropdownOpen)}>
          {/* <img
            src="https://randomuser.me/api/portraits/men/79.jpg"
            alt="Admin"
            className="avatar"
          /> */}
          <div className="profile-info">
            <p className="profile-name">Issuer Dashboard</p>
            <span className="profile-role">{issuerDepartment}</span>
          
          </div>
          <button className="dropdown-btn-nav" onClick={handleLogout}>
                  <IoLogOutOutline size={20} className="logout-nav-icon"/> Logout
                </button>
          {/* <FaChevronDown size={12} /> */}
          {/* {dropdownOpen && (
            <div className="dropdown-menu-nav">
              {!jwt ? (
                <button className="dropdown-btn-nav" onClick={handleLogin}>
                  <IoLogInOutline size={20} className="login-nav-icon"/> Login
                </button>
              ) : (
                
              )}
            </div>
          )} */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
