

"use client";
import React, { useState, useEffect } from "react";
import { IoEye } from "react-icons/io5";
import { LuSearch } from "react-icons/lu";
import "./templates.css";

interface Template {
  id: string;
  name: string;
  approvedStats: "pending" | "approved" | "rejected";
  fileName: string;
  params: string[];
}

type ViewType = "pending" | "approved" | "rejected";

const Page: React.FC = () => {
  const apiIp = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/";
  const [templates, setTemplates] = useState<Template[]>([]);
  const [viewType, setViewType] = useState<ViewType>("pending");
  const [search, setSearch] = useState("");
  const [templateIdMap, setTemplateIdMap] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [certificateHTML, setCertificateHTML] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  
  useEffect(() => {
    const fetchTemplates = async () => {
      const res = await fetch(`${apiIp}certificate/getAllCertificates`);
      const json = await res.json();
      if (json.success) setTemplates(json.data);
    };

    const fetchTemplateIds = async () => {
      const res = await fetch(`${apiIp}certificate/getAllCertificatesParams`);
      const json = await res.json();
      if (json.success) {
        const map: Record<string, string> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        json.data.forEach((t: any) => {
          const key = t.name.toLowerCase().replace(/\s/g, "");
          map[key] = t.id;
        });
        setTemplateIdMap(map);
      }
    };

    fetchTemplates();
    fetchTemplateIds();
  }, [apiIp]);

  const handlePreview = async (template: Template) => {
    const key = template.name.toLowerCase().replace(/\s/g, "");
    const id = templateIdMap[key];
    if (!id) return alert("Template ID not found.");

    const res = await fetch(`${apiIp}certificate/getCertificate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    const decoded = decodeHTML(json.data.html);
    setCertificateHTML(decoded);
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleCheckboxChange = (name: string) => {
    setSelectedTemplates((prev) => {
      const updated = new Set(prev);
      if (updated.has(name)) {
        updated.delete(name);
      } else {
        updated.add(name);
      }
      return updated;
    });
  };
  

  const handleBulkAction = async (action: "approve" | "reject") => {
    if (!selectedTemplates.size) return;
    const token = localStorage.getItem("authToken");
    const endpoint =
      action === "approve"
        ? "superAdmin/approveCertificateTemplate"
        : "superAdmin/rejectCertificateTemplate";
    const body = { names: Array.from(selectedTemplates) };
  
    try {
      const res = await fetch(`${apiIp}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
  
      // ✅ Show success message
      setMessage(json.message || `${action}d successfully`);
      setIsSuccess(true);
  
      // ✅ Update the templates locally
      setTemplates((prevTemplates) =>
        prevTemplates.map((template) =>
          selectedTemplates.has(template.name)
            ? { ...template, approvedStats: action === "approve" ? "approved" : "rejected" }
            : template
        )
      );
  
      setSelectedTemplates(new Set());
    } catch {
      setMessage("Action failed");
      setIsSuccess(false);
    } finally {
     
      setTimeout(() => {
        setMessage("");
        setIsSuccess(null);
      }, 3000);
    }
  };
  
  

  const decodeHTML = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  const filteredTemplates = templates.filter(
    (t) => t.approvedStats === viewType && t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="template-container">
      <h1 className="template-title">{viewType.charAt(0).toUpperCase() + viewType.slice(1)} Certificates</h1>

      <div className="toolbar">
        {(["pending", "approved", "rejected"] as ViewType[]).map((type) => (
          <button
            key={type}
            onClick={() => setViewType(type)}
            className={`view-toggle-btn ${viewType === type ? "active" : ""}`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}

        <div className="search-bar">
          <LuSearch className="search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Certificates..."
          />
        </div>
      </div>

      {showPreview && (
        <div className="preview-section">
          <button onClick={() => setShowPreview(false)}>Back</button>
          <h2>{selectedTemplate?.name}</h2>
          <iframe srcDoc={certificateHTML} style={{ width: "100%", height: "700px", border:'none' }} />
        </div>
      )}

      {!showPreview && (
        <>
          <table className="template-table">
            <thead>
              <tr>
                {(viewType === "pending" || viewType === "approved" || viewType === "rejected") && <th>Select</th>}
                <th>Title</th>
                <th>Status</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.length === 0 ? (
                <tr><td colSpan={4}>No templates available.</td></tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.id}>
                    {(viewType === "pending" || viewType === "approved" || viewType === "rejected") && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedTemplates.has(template.name)}
                          onChange={() => handleCheckboxChange(template.name)}
                        />
                      </td>
                    )}
                    <td>{template.name}</td>
                    <td>{template.approvedStats}</td>
                    <td>
                      <button onClick={() => handlePreview(template)}>
                        <IoEye /> 
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {selectedTemplates.size > 0 && (
            <div className="action-buttons">
              {viewType === "pending" && (
                <>
                  <button onClick={() => handleBulkAction("approve")}>Approve</button>
                  <button onClick={() => handleBulkAction("reject")}>Reject</button>
                </>
              )}
              {viewType === "approved" && (
                <button onClick={() => handleBulkAction("reject")}>Reject</button>
              )}
              {viewType === "rejected" && (
                <button onClick={() => handleBulkAction("approve")}>Re-Approve</button>
              )}
            </div>
          )}
        </>
      )}
      {message && (
  <p className={`action-message ${isSuccess ? "success" : "error"}`}>
    {message}
  </p>
)}

    </div>
  );
};

export default Page;
