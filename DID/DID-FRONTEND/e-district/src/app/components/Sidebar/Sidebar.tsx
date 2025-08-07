"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import "./Sidebar.css";
import { RiDashboard3Line } from "react-icons/ri";

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (pathname.includes("addIssuer")) setSelected("AddIssuer");
    else if (pathname.includes("verifyCertificate")) setSelected("Verifier");
    else if (pathname.includes("department")) setSelected("Department");
    else if (pathname.includes("templates")) setSelected("Templates");
    else setSelected("");
  }, [pathname]);

  const handleNavigation = (page: string, path: string) => {
    setSelected(page);
    router.push(path);
  };

  return (
    <aside className="sidebar-container">
      <ul className="ul-list">
        <li
          className={`list ${selected === "AddIssuer" ? "active" : ""}`}
          onClick={() => handleNavigation("AddIssuer", "/addIssuer")}
        >
          <RiDashboard3Line className="list-icon" />
          Issuer
        </li>
        <li
          className={`list ${selected === "Verifier" ? "active" : ""}`}
          onClick={() => handleNavigation("Verifier", "/verifyCertificate")}
        >
          <RiDashboard3Line className="list-icon" />
          Verifier
        </li>
        <li
          className={`list ${selected === "Department" ? "active" : ""}`}
          onClick={() => handleNavigation("Department", "/department")}
        >
          <RiDashboard3Line className="list-icon" />
          Department
        </li>
        <li
          className={`list ${selected === "Templates" ? "active" : ""}`}
          onClick={() => handleNavigation("Templates", "/templates")}
        >
          <RiDashboard3Line className="list-icon" />
          Templates
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
