"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import "./Department.css";
import { FaAngleDown } from "react-icons/fa";

interface DepartmentTableData {
  department: string;
  certificateCount: number;
  certificateTypes: string[];
}

const Page = () => {
  const apiIp =
    process.env.NEXT_PUBLIC_API_URL || "http://135.235.169.22:9000/";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const [dropdownDepartments, setDropdownDepartments] = useState<string[]>([]);
  const certificateRef = useRef<HTMLDivElement | null>(null);

  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [currentDeptTypes, setCurrentDeptTypes] = useState<string[]>([]);
  const [isCertificateListOpen, setIsCertificateListOpen] =
    useState<boolean>(false);

  const [departmentTableData, setDepartmentTableData] = useState<
    DepartmentTableData[]
  >([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const departmentDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const certOutside =
        certificateRef.current &&
        !certificateRef.current.contains(event.target as Node);

      const deptOutside =
        departmentDropdownRef.current &&
        !departmentDropdownRef.current.contains(event.target as Node);

      const isCertToggle = (event.target as HTMLElement).closest(
        ".button-drop"
      );
      const isDeptToggle = (event.target as HTMLElement).closest(
        ".dropdown-toggle"
      );

      if (certOutside && !isCertToggle) {
        setIsCertificateListOpen(false);
      }

      if (deptOutside && !isDeptToggle) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchCertificateParams = async () => {
      try {
        const res = await fetch(`${apiIp}superAdmin/getAllCertificates`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const resJson = await res.json();

        const approvedCerts = Array.isArray(resJson.data)
          ? resJson.data.filter(
              (cert: { approvedStats: string }) =>
                cert.approvedStats === "approved"
            )
          : [];

        const names = approvedCerts.map((cert: { name: string }) => cert.name);
        setAvailableTypes(names);
      } catch (err) {
        console.error("Error fetching certificates:", err);
        setMessage("Failed to load certificate types");
      }
    };

    fetchCertificateParams();
  },  [apiIp, token]);

  const loadDepartmentTable = useCallback(async () => {
    try {
      const res = await fetch(`${apiIp}superAdmin/getAllDepartments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setDepartmentTableData(data.departments || []);
      const allDeptNames = (data.departments || []).map(
        (d: DepartmentTableData) => d.department
      );
      setDropdownDepartments(allDeptNames);
    } catch {
      setMessage("Failed to load department data");
    }
  }, [apiIp, token]);

  useEffect(() => {
    if (token) {
      loadDepartmentTable();
    }
  }, [token, apiIp, loadDepartmentTable]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const updated = new Set(prev);
      if (updated.has(type)) {
        updated.delete(type);
      } else {
        updated.add(type);
      }
      return updated;
    });
  };

  const assignCertificates = async () => {
    if (!selectedDepartment || selectedTypes.size === 0) {
      setMessage("Select a department and at least one certificate type.");
      setError(true);
      return;
    }

    try {
      const res = await fetch(
        `${apiIp}superAdmin/addCertificateTypesToDepartment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            department: selectedDepartment,
            certificateTypes: Array.from(selectedTypes),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || data.error)
        throw new Error(data.message || "Assignment failed");

      setMessage("Certificates assigned successfully!");
      setError(false);
      setSelectedTypes(new Set());
      const updatedDept = {
        ...departmentTableData.find((d) => d.department === selectedDepartment),
      };
      if (updatedDept && Array.isArray(updatedDept.certificateTypes)) {
        updatedDept.certificateTypes = [
          ...new Set([
            ...updatedDept.certificateTypes,
            ...Array.from(selectedTypes),
          ]),
        ];

        setCurrentDeptTypes(updatedDept.certificateTypes);
        setDepartmentTableData((prev) =>
          prev.map((d) => {
            if (d.department === selectedDepartment) {
              return {
                department: d.department,
                certificateCount: updatedDept.certificateTypes!.length,
                certificateTypes: updatedDept.certificateTypes!,
              };
            }
            return d;
          })
        );
      }

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch {
      setMessage("Error Occurred");
      setError(true);
    }
  };

  const removeCertificates = async () => {
    if (!selectedDepartment || selectedTypes.size === 0) {
      setMessage(
        "Select a department and at least one certificate type to remove."
      );
      setError(true);
      return;
    }

    try {
      const res = await fetch(
        `${apiIp}superAdmin/removeCertificateTypesFromDepartment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            department: selectedDepartment,
            certificateTypes: Array.from(selectedTypes),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || data.error)
        throw new Error(data.message || "Removal failed");

      setMessage("Certificates removed successfully!");
      setError(false);
      setSelectedTypes(new Set());
      await loadDepartmentTable();
      updateCurrentDeptTypes(selectedDepartment);
    } catch {
      setMessage("Error Occurred: Network Error");
      setError(true);
    }
  };

  const updateCurrentDeptTypes = (dept: string) => {
    const deptData = departmentTableData.find((d) => d.department === dept);
    setCurrentDeptTypes(deptData?.certificateTypes || []);
  };

  // const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const dept = e.target.value;
  //   setSelectedDepartment(dept);
  //   setSelectedTypes(new Set());
  //   const deptData = departmentTableData.find((d) => d.department === dept);
  //   setCurrentDeptTypes(deptData?.certificateTypes || []);
  // };

  const selectedAlreadyAssigned = Array.from(selectedTypes).filter((type) =>
    currentDeptTypes.includes(type)
  );
  const selectedNotAssigned = Array.from(selectedTypes).filter(
    (type) => !currentDeptTypes.includes(type)
  );
  const isAssignDisabled = selectedNotAssigned.length === 0;
  const isRemoveDisabled = selectedAlreadyAssigned.length === 0;

  useEffect(() => {
    if (selectedDepartment) {
      setIsCertificateListOpen(true);
    } else {
      setIsCertificateListOpen(false);
    }
  }, [selectedDepartment]);
  const handleAddDepartment = async () => {
    if (!department.trim()) {
      alert("Department name is required.");
      return;
    }
  
    try {
      setLoading(true);
      const res = await fetch(
        `${apiIp}superAdmin/addCertificateTypesToDepartment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            department: department.trim(),
            certificateTypes: [], // empty array
          }),
        }
      );
  
      const data = await res.json();
  
      if (res.ok) {
        alert("Department added successfully.");
        const newDept = {
          department: department.trim(),
          certificateCount: 0,
          certificateTypes: [],
        };
  
        // Update dropdown and table data
        setDropdownDepartments((prev) => [...prev, department.trim()]);
        setDepartmentTableData((prev) => [...prev, newDept]);
  
        setDepartment(""); // Clear input
      } else {
        alert(data.message || "Failed to add department.");
      }
    } catch (err) {
      console.error("Error adding department:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const certClickOutside =
        certificateRef.current &&
        !certificateRef.current.contains(event.target as Node);

      const isToggleBtn = (event.target as HTMLElement).closest(".button-drop");

      if (certClickOutside && !isToggleBtn) {
        setIsCertificateListOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="department-container">
      <h1 className="department-title">Manage Department Certificate Types</h1>
      <div className="add-department-container">
        <input
          type="text"
          placeholder="Enter department name"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
        <button onClick={handleAddDepartment} disabled={loading}>
          {loading ? "Adding..." : "Add Department"}
        </button>
      </div>

      <div className="custom-dropdown-container" ref={departmentDropdownRef}>
        <div className="custom-dropdown">
          <button
            className="dropdown-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen((prev) => !prev);
            }}
          >
            {selectedDepartment || "Select Department"}
            <FaAngleDown />
          </button>

          {dropdownOpen && (
            <ul className="dropdown-menu">
              {dropdownDepartments.map((dept) => (
                <li
                  key={dept}
                  onClick={() => {
                    setSelectedDepartment(dept);
                    setDropdownOpen(false);
                    updateCurrentDeptTypes(dept);
                  }}
                >
                  {dept}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsCertificateListOpen((prev) => !prev);
        }}
        className="button-drop"
      >
        <>
          {Array.from(selectedTypes).length === 0
            ? "Select Certificate"
            : Array.from(selectedTypes).slice(0, 2).join(", ") +
              (Array.from(selectedTypes).length > 2 ? "..." : "")}
          <FaAngleDown />
        </>
      </button>

      {isCertificateListOpen && (
        <div className="certificate-checkbox-group" ref={certificateRef}>
          {availableTypes.length === 0 ? (
            <p className="no-certificates-message">
              No certificates approved yet.
            </p>
          ) : (
            availableTypes.map((type) => (
              <label key={type} className="certificate-checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedTypes.has(type)}
                  onChange={() => toggleType(type)}
                />
                {type}
                {currentDeptTypes.includes(type) && (
                  <span style={{ color: "green", fontSize: "12px" }}>
                    {" "}
                    (Already Assigned)
                  </span>
                )}
              </label>
            ))
          )}
        </div>
      )}

      <div className="department-action-buttons">
        <button onClick={assignCertificates} disabled={isAssignDisabled}>
          Assign
        </button>
        <button
          onClick={removeCertificates}
          className="danger"
          disabled={isRemoveDisabled}
        >
          Remove
        </button>
      </div>

      {message && (
        <p className={`department-message ${error ? "error" : "success"}`}>
          {message}
        </p>
      )}

      <hr className="department-divider" />

      <h3 className="department-subtitle">Department - Certificate Mapping</h3>
      <table className="department-table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Certificate Count</th>
            <th>Certificate Types</th>
          </tr>
        </thead>
        <tbody>
          {departmentTableData.map((dept) => (
            <tr key={dept.department}>
              <td>{dept.department}</td>
              <td>{dept.certificateCount}</td>
              <td>{dept.certificateTypes.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Page;
