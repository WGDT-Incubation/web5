"use client";

import React, { useState, useEffect } from "react";
import { useSelectedDID } from "../Context/SelectedDIDContext";
import "./VerifyCertificate.css";
import loaderImage from "../../../public/images/Loader.gif";
import Image from "next/image";
import gif from "../../../public/images/Wrong Password Folder.gif";

interface Member {
  name: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  relation: string;
  mobile: string;
  memberId: string;
  occupation: string;
  caste: string;
  disabled: boolean | string;
}

interface CertificateParams {
  [key: string]: { fields: string[]; members?: string[] };
}

interface DynamicCertificateData {
  did: string;
  type: string;
  id: string;
  previewHTML?: string;
  imageUrl?: string;
  members?: Member[];
  [key: string]: string | number | boolean | Member[] | undefined;
}

const formatFieldLabel = (field: string) => {
  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (str) => str.toUpperCase());
};

export default function VerifyCertificate() {
  const { selectedDID } = useSelectedDID();
  const [searchDID, setSearchDID] = useState<string>(selectedDID || "");
  const [selectedCertificates, setSelectedCertificates] = useState<DynamicCertificateData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<DynamicCertificateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const apiIp = process.env.NEXT_PUBLIC_API_URL;
  const [loggedUser, setLoggedUser] = useState<string | null>(null);
  const [certificateParams, setCertificateParams] = useState<CertificateParams>({});
  const [certificateData, setCertificateData] = useState<DynamicCertificateData | null>(null);

  useEffect(() => {
    if (selectedDID) {
      setSearchDID(selectedDID);
    }
  }, [selectedDID]);

  useEffect(() => {
    const fetchParams = async () => {
      try {
        const res = await fetch(`${apiIp}certificate/getAllCertificates`);
        const { data } = await res.json();
        const paramMap: CertificateParams = {};
        for (const item of data) {
          const key =
            item.name
              .toLowerCase()
              .replace(/certificate/g, "")
              .trim()
              .replace(/\s+/g, "") +
            "Certificate";
          paramMap[key] = {
            fields: item.params?.filter((p: string) => p !== "members") || [],
            members: item.params?.includes("members") ? [] : undefined,
          };
        }
        setCertificateParams(paramMap);
      } catch (err) {
        console.error("Error fetching certificate params:", err);
      }
    };
    fetchParams();
  }, [apiIp]);


  useEffect(() => {
    if (certificateData) console.log("CertificateData:", certificateData);
  }, [certificateData]);


  const fetchPreview = async (cert: DynamicCertificateData): Promise<string> => {
    try {
      const res = await fetch(`${apiIp}certificate/getCustomCertificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cert),
      });
      const json = await res.json();
      if (!res.ok || !json.data) {
        console.error("Preview fetch error:", json.message || res.statusText);
        return "<p>Unable to generate preview.</p>";
      }
      return json.data;
    } catch (err) {
      console.error("Error fetching preview:", err);
      return "<p>Error generating preview.</p>";
    }
  };

  // Handle clicking "Preview Certificate"
  const handlePreview = async (cer: DynamicCertificateData) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPreviewLoading(true);
    const html = await fetchPreview(cer);
    setPreviewData({ ...cer, previewHTML: html });
    setShowPreview(true);
    setPreviewLoading(false);
  };

  // Search for DID details
  const handleSearch = async () => {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("userInfo");
    let email: string | null = null;
    if (rawUser) {
      // Attempt to parse JSON, fallback to raw string
      try {
        const parsed = JSON.parse(rawUser);
        email = parsed.email || null;
      } catch {
        email = rawUser;
      }
    }
    setLoggedUser(email);
    if (!token) {
      alert("Token missing. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiIp}verifier/getAccessedDIDDetails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ did: searchDID, verifierEmail: email }),
      });

      if (!res.ok) {
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000);
        return;
      }

      const { response } = await res.json();
      setCertificateData(response);
      if (!response.certificateType) throw new Error("No certificateType");

      const { certificateType, ...rest } = response;
      const normalized = Object.keys(certificateParams).find(
        (key) =>
          key.toLowerCase().replace(/certificate/g, "").trim() ===
          certificateType.toLowerCase().replace(/certificate/g, "").trim()
      );
      if (!normalized) throw new Error("Unknown certificate type");

      const transformed: DynamicCertificateData = {
        did: searchDID,
        type: normalized,
        certificateType: normalized,
        id: response.templateId,
        ...rest,
      };

      if (!selectedCertificates.find((c) => c.did === transformed.did)) {
        const html = await fetchPreview(transformed);
        setSelectedCertificates((prev) => [...prev, { ...transformed, previewHTML: html }]);
      } else {
        alert("Certificate already added.");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching details.");
    } finally {
      setLoading(false);
      setSearchDID("");
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewData(null);
  };
  return (
    <div className="verify-certificate-container">
      <h1>Verify Certificate</h1>
      <div className="search-section">
        <div className="search-section-inner">
          <div className="chips-container">
            {selectedCertificates.map((cert) => (
              <div key={cert.did} className="chip">
                {cert.did}
                <button
                  className="remove-btn"
                  onClick={() => setSelectedCertificates((prev) => prev.filter((c) => c.did !== cert.did))}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="search-container">
            <input
              type="text"
              placeholder="Enter DID (e.g. 4567890)"
              value={searchDID}
              onChange={(e) => setSearchDID(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              maxLength={7}
            />
          </div>
        </div>
        <button onClick={handleSearch} disabled={loading}>
          Search DID
        </button>
      </div>

      {loading && (
        <div className="loader">
          <Image src={loaderImage} alt="loader" className="loader-class" />
        </div>
      )}

      <div className="results-container">
        {selectedCertificates.map((cert) => (
          <div key={cert.did} className="certificate-card">
            <div>
              <div className="certificate-details">
                <div className="result-item">
                  <label>DID No.</label>
                  <div
                    className="value-box"
                    style={{ color: "#c1272c", fontWeight: "800" }}
                  >
                    {cert.did}
                  </div>
                </div>
                <div className="result-item">
                  <label>Certificate Type</label>
                  <div className="value-box">{formatFieldLabel(cert.type)}</div>
                </div>
                {(() => {
                  const param = certificateParams[cert.type];
                  const fields: string[] = param?.fields || [];

                  return fields
                    .filter((f) => f !== "did")
                    .map((field) => (
                      <div className="result-item" key={field}>
                        <label>{formatFieldLabel(field)}</label>
                        <div className="value-box">  {Array.isArray(cert[field])
    ? "[Array]" 
    : String(cert[field])}</div>
                      </div>
                    ));
                })()}
              </div>

              {cert.type === "familyCertificate" &&
                Array.isArray(cert.members) && (
                  <div className="members-section">
                    <div className="member-heading-row">
                      <label className="members-heading">Members</label>
                    </div>
                    {cert.members.map((member: Member, idx: number) => (
                      <div key={idx} className="member-box">
                        <h4 className="member-title">Member {idx + 1}</h4>
                        <div className="member-fields-row">
                          {(certificateParams[cert.type]?.members || []).map(
                            (key) => (
                              <div className="result-item" key={key}>
                                <label>{formatFieldLabel(key)}</label>
                                <div className="value-box">
                                  {String(member[key as keyof Member])}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <button
              onClick={() => handlePreview(cert)}
              className="verify-preview"
            >
              {previewLoading ? "Loading..." : "Preview Certificate"}
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-error">
          <div className="modal-error-content">
            <p>
              Verifier <span className="span-error">{loggedUser}</span> is not
              permitted to view DID ‘{searchDID}’.
            </p>
            <Image src={gif} alt="gif" width={100} height={100} />
          </div>
        </div>
      )}

      {showPreview && previewData && (
        <div className="preview-modal">
          <div className="modal-content">
            <span className="close-btn-pre" onClick={closePreview}>
              &times;
            </span>
            {/* <div
              className="certificate-preview-container"
              dangerouslySetInnerHTML={{
                __html: previewData.previewHTML || "",
              }}
            /> */}
            <div
              className="certificate-preview-container"
              dangerouslySetInnerHTML={{
                __html:
                  typeof previewData.previewHTML === "string"
                    ? previewData.previewHTML
                    : "",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
