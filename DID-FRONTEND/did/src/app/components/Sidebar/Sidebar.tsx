"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import "./Sidebar.css";
import { RiDashboard3Line } from "react-icons/ri";
import { MdOutlineDashboard } from "react-icons/md";

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [selected, setSelected] = useState("Dashboard");

useEffect(() => {
  // Automatically set selected menu based on pathname
  if (pathname === "/dashboard") {
    setSelected("Dashboard");
  } else if (pathname === "/issued") {
    setSelected("Issued");
  } else if (pathname === "/templates") {
    setSelected("Templates");
  } else if (pathname === "/uploadCertificates") {
    setSelected("Upload");
  } else if (pathname === "/cronPending") {
    setSelected("Pending");
  }
}, [pathname]);

  const handleNavigation = (page: string, path: string) => {
    setSelected(page);
    router.push(path);
  };

  return (
    <aside className="sidebar-container">
      <ul className="ul-list">
        <li
          className={`list ${selected === "Dashboard" ? "active" : ""}`}
          onClick={() => handleNavigation("Dashboard", "/dashboard")}
        >
          <RiDashboard3Line className="list-icon" />
          Dashboard
        </li>
        <li
          className={`list ${selected === "Templates" ? "active" : ""}`}
          onClick={() => handleNavigation("Templates", "/templates")}
        >
          <MdOutlineDashboard className="list-icon" />
          Templates
        </li>
        <li
          className={`list ${selected === "Issued" ? "active" : ""}`}
          onClick={() => handleNavigation("Issued", "/issued")}
        >
          <MdOutlineDashboard className="list-icon" />
          Issue Certificate
        </li>
        <li
          className={`list ${selected === "Upload" ? "active" : ""}`}
          onClick={() => handleNavigation("Upload", "/uploadCertificates")}
        >
          <MdOutlineDashboard className="list-icon" />
          Add Certificate
        </li>
         <li
          className={`list ${selected === "Pending" ? "active" : ""}`}
          onClick={() => handleNavigation("Pending", "/cronPending")}
        >
          <MdOutlineDashboard className="list-icon" />
        Pending Certificate
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
