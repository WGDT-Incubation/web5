"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import "./Sidebar.css";
import { RiDashboard3Line } from "react-icons/ri";

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [selected, setSelected] = useState("Dashboard");

 useEffect(() => {
  if (pathname === "/verifyCertificate") {
    setSelected("Dashboard");
  } else if (pathname === "/verifierDIDsNotifications") {
    setSelected("All DIDs");
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
          onClick={() => handleNavigation("Dashboard", "/verifyCertificate")}
        >
          <RiDashboard3Line className="list-icon" />
          Verifier Dashboard
        </li>
        <li
            className={`list ${selected === "All DIDs" ? "active" : ""}`}
          onClick={() => handleNavigation("All DIDs", "/verifierDIDsNotifications")}
        >
          <RiDashboard3Line className="list-icon" />
          All DIDs
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;




