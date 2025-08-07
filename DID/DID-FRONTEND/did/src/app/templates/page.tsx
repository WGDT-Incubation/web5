"use client";
import React, { useState, useEffect, useRef } from "react";
import "./templates.css";
import { useRouter, useSearchParams } from "next/navigation";
import { RiArrowDropDownLine } from "react-icons/ri";
import { LuSearch } from "react-icons/lu";
import { IoEye } from "react-icons/io5";
import Image from "next/image";

interface Template {
  id: number;
  title: string;
  categories: string[];
  image: string;
}

interface Option {
  value: string;
  label: string;
}

const Page: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [certificateHTML, setCertificateHTML] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [templateIdMap, setTemplateIdMap] = useState<Record<string, string>>({});
  const [modalMessage, setModalMessage] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [issueMessage, setIssueMessage] = useState<string>("");
  const [allowedCertificateTypes, setAllowedCertificateTypes] = useState<string[]>([]);
  const apiIp = process.env.NEXT_PUBLIC_API_URL;

  const mapTitleToType = (title: string): string => {
    return title.replace(/\s/g, "").toLowerCase();
  };

  useEffect(() => {
    const fetchTemplateIds = async () => {
      try {
        const res = await fetch(`${apiIp}certificate/getAllCertificatesParams`);
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          const idMap: Record<string, string> = {};
          json.data.forEach((item: any) => {
            if (item.name && item.id) {
              const key = item.name.toLowerCase().replace(/\s/g, "");
              idMap[key] = item.id;
            }
          });
          setTemplateIdMap(idMap);
          console.log("Template ID Map:", idMap);
        }
      } catch (err) {
        console.error("Failed to fetch template ID map", err);
      }
    };

    fetchTemplateIds();
  }, []);

  const toTitleCase = (str: string) =>
    str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  

  useEffect(() => {
    const department = localStorage.getItem("issuerDepartment");
    const authToken = localStorage.getItem("authToken");
    if (!department || !authToken) return;

    fetch(`${apiIp}admin/getDepartmentCertificateTypes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ department }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.certificateTypes)) {
          setAllowedCertificateTypes(
            data.certificateTypes.map((type: string) =>
              type.replace(/\s/g, "").toLowerCase()
            )
          );
          console.log("Normalized allowed types:", data.certificateTypes.map((type: string) => type.toLowerCase()));
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`${apiIp}certificate/getAllCertificates`);
        const result = await res.json();
  
        if (result.success && Array.isArray(result.data)) {
          const allowedTitles = allowedCertificateTypes.map((type) =>
            type.toLowerCase().replace(/\s/g, "")
          );
  
          const approvedTemplates = result.data
            .filter((template: any) => {
              const normalizedTitle = template.name.toLowerCase().replace(/\s/g, "");
              return allowedTitles.includes(normalizedTitle) && template.approvedStats === "approved";
            })
            .map((template: any, idx: number) => ({
              id: idx + 1,
              title: template.name,
              categories: [],
              image: `/images/image copy.png`,
            }));
  
         
      
  
          setTemplates([...approvedTemplates]);
        } else {
          console.error("Invalid data format from getAllCertificates");
        }
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      }
    };
  
    if (allowedCertificateTypes.length > 0) {
      fetchTemplates();
    }
  }, [allowedCertificateTypes]);
  
  
  
  

  const handleViewTemplate = async (template: Template) => {
    const normalizedTitle = template.title.toLowerCase().replace(/\s/g, "");
  
    if (
      allowedCertificateTypes.length > 0 &&
      !allowedCertificateTypes.includes(normalizedTitle) &&
      normalizedTitle !== "familycertificate"
    ) {
      setModalMessage("You don’t have permission to view this template.");
      setShowModal(true);
      return;
    }
  
    setSelectedTemplate(template);
    setIsEditing(false);
  
   
  
    const templateId = templateIdMap[normalizedTitle];
    if (!templateId) {
      console.error("Template ID not found for:", normalizedTitle);
      return;
    }
  
    try {
      const res = await fetch(`${apiIp}certificate/getCertificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: templateId }),
      });
      const { data } = await res.json();
      const htmlContent = decodeHTML(data.html);
      setCertificateHTML(htmlContent);
      setShowPreview(true);
    } catch (err) {
      console.error("Error fetching certificate:", err);
      setCertificateHTML("<p>Error loading certificate</p>");
      setShowPreview(true);
    }
  };
  
  

  const decodeHTML = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };
  const filteredTemplates = templates.filter((template) => {
    const normalizedType = mapTitleToType(template.title);
    const matchesSearch = template.title
      .toLowerCase()
      .includes(search.toLowerCase());
  
    const hasPermission =
      allowedCertificateTypes.length === 0 ||
      allowedCertificateTypes.includes(normalizedType) ||
      normalizedType === "familycertificate"; // <-- explicitly allowed
  
    return matchesSearch && hasPermission;
  });
  
  

  const hasNoPermission =
    allowedCertificateTypes.length > 0 && filteredTemplates.length === 0;

  return (
    <div className="template-container">
      <div className="template-container-top">
         <h1 className="template-title">Template</h1>
        <button
          className="edit-btn"
          onClick={() => {
            localStorage.setItem("editableHTML", certificateHTML);
            router.push("/editTemplate");
          }}
        >
        + {" "}  Add Template
        </button>
      </div>

      {showPreview && (
        <div className="preview-section">
          <div className="preview-header-temp">
            <button className="back-btn" onClick={() => setShowPreview(false)}>
              Back
            </button>
          </div>
          <h2>Preview - {selectedTemplate?.title}</h2>
          <iframe
            title="Certificate Preview"
            style={{ width: "100%", height: "800px", border: "none" }}
            srcDoc={certificateHTML}
          />
          {issueMessage && <p className="issue-message">{issueMessage}</p>}
        </div>
      )}

      {!isEditing && !showPreview && (
        <div className="add-template-main">
          <div className="templete-toolbar">
            <div className="search-container-temp">
              <LuSearch className="search-icon-temp" />
              <input
                type="text"
                placeholder="Search"
                className="search-input-temp"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {templates.length === 0 ? (
            <p style={{ padding: "20px", fontSize: "1.1rem", color: "grey" }}>
              You don’t have permission to access any certificate templates.
            </p>
          ) : (
            <div className="template-grid">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="template-card">
                  <div className="templete-image-card">
                    <h2 className="template-card-title">{toTitleCase(template.title)}</h2>
                    <Image
                      className="template-image"
                      width={150}
                      height={150}
                      src={template.image}
                      alt={template.title}
                    />
                  </div>
                  <div className="templete-btn-div">
                    <button
                      className="template-view-button"
                      onClick={() => handleViewTemplate(template)}
                    >
                      <IoEye className="view-eye-icon" /> View Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Page;



