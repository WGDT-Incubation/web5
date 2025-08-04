"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import "./certificates.css";
import { FaEye } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { RiDeleteBinLine } from "react-icons/ri";
import deleteImage from "../../../public/images/Delete.gif";
import Image from "next/image";
import revokeImage from "../../../public/images/revoke.svg";
import { useRouter } from "next/navigation";

const toPascalCase = (str: string): string =>
  str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");

const normalizeKeys = (obj: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.toLowerCase().replace(/\s+/g, ""),
      v,
    ])
  );

const buildCertificatePayload = (
  didKey: string,
  certType: string,
  didData: any,
  fields: string[]
) => {
  const payload: Record<string, any> = {};

  fields.forEach((field) => {
    if (field.toLowerCase().includes("date") && !didData[field]) {
      payload[field] = new Date().toISOString().substring(0, 10);
    } else {
      payload[field] = didData[field] || "";
    }
  });

  payload["did"] = didKey;
  payload["certificateType"] = certType;

  return payload;
};

const CertificateSkeleton = () => {
  return (
    <div className="table-container">
      <table className="documents-table">
        <thead>
          <tr>
            <th />
            <th>Name</th>
            <th>DID</th>
            <th>Certi Name</th>
            <th>Date of Issue</th>
            <th>Preview</th>
            <th>Revoke</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, idx) => (
            <tr key={idx}>
              <td>
                <div className="skeleton-box small" />
              </td>
              <td>
                <div className="skeleton-box" />
              </td>
              <td>
                <div className="skeleton-box" />
              </td>
              <td>
                <div className="skeleton-box" />
              </td>
              <td>
                <div className="skeleton-box" />
              </td>
              <td>
                <div className="skeleton-box small" />
              </td>
              <td>
                <div className="skeleton-box small" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function CertificatesPage() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");
  const [selectedDIDs, setSelectedDIDs] = useState<string[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [certificateHTML, setCertificateHTML] = useState("");
  const [certParams, setCertParams] = useState<any>(null);
  const apiIp = process.env.NEXT_PUBLIC_API_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDidKey, setSelectedDidKey] = useState<string | null>(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [allowedCertificateTypes, setAllowedCertificateTypes] = useState<
    string[]
  >([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success"
  );

  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchAllTemplates = async () => {
      try {
        const res = await fetch(`${apiIp}certificate/getAllCertificatesParams`);
        if (!res.ok) throw new Error("Failed to fetch certificate templates");

        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setAllTemplates(result.data);
        }
      } catch (err) {
        console.error("Error fetching all certificate templates:", err);
      }
    };

    fetchAllTemplates();
  }, []);
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
          setAllowedCertificateTypes([
            ...new Set([
              ...data.certificateTypes.map((type: string) =>
                type.replace(/\s/g, "").toLowerCase()
              ),
              "familycertificate",
            ]),
          ]);
          console.log("Allowed types:", [
            ...data.certificateTypes.map((t: string) =>
              t.replace(/\s/g, "").toLowerCase()
            ),
            "familycertificate",
          ]);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!phone) return;
    const authToken = localStorage.getItem("authToken");
    console.log("authToken", authToken);
    const fetchData = async () => {
      try {
        const loginRes = await fetch(`${apiIp}admin/adminLogin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({}),
        });

        if (!loginRes.ok) throw new Error("Admin login failed");
        const loginData = await loginRes.json();
        const token = loginData.token;
        setToken(token);

        const certRes = await fetch(`${apiIp}admin/getIdentity`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ phoneNumber: phone }),
        });

        if (!certRes.ok) throw new Error("Certificate fetch failed");

        const certData = await certRes.json();
        console.log("certData inside useffect of fetch data ===>>", certData);
        setData(certData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [phone]);

  useEffect(() => {
    setUserEmail(localStorage.getItem("userEmail") || "");
  }, []);

  const handleOtpSubmit = async () => {
    if (!otpValue || selectedDIDs.length === 0) {
      alert("Please enter OTP and select at least one DID.");
      return;
    }

    try {
      const emailId = localStorage.getItem("userEmail");

      const res = await fetch(`${apiIp}admin/revokeMultipleDIDs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: emailId,
          dids: selectedDIDs,
          otp: otpValue,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const updatedDIDs = { ...data.response.dids };
      selectedDIDs.forEach((id) => delete updatedDIDs[id]);

      setData((prev: any) => ({
        ...prev,
        response: {
          ...prev.response,
          dids: updatedDIDs,
        },
      }));

      setSelectedDIDs([]);
      setOtpModalVisible(false);
      setOtpValue("");
      setNotificationType("success");
      setNotificationMessage("Selected DIDs revoked successfully.");
      setNotificationModalVisible(true);
    } catch (err) {
      console.error("Error revoking DIDs:", err);
      alert("Failed to revoke DIDs.");
    }
  };

  const handleDeleteClick = (didKey: string) => {
    if (!selectedDIDs.includes(didKey)) {
      setNotificationType("error");
      setNotificationMessage("Please select the certificate before revoking.");
      setNotificationModalVisible(true);
      return;
    }
    setSelectedDidKey(didKey);
    setShowDeleteModal(true);
  };
  const confirmDeleteCertificate = async () => {
    const authToken = localStorage.getItem("authToken");
    console.log("authToken", authToken);

    try {
      const otpRes = await fetch(`${apiIp}admin/getOTPforRemoveCertificate`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const otpData = await otpRes.json();
      console.log("OTP Response:", otpData);
      if (!otpRes.ok) throw new Error("Failed to generate OTP");
      setNotificationType("success");
      setNotificationMessage("OTP has been sent to your registered email.");
      setNotificationModalVisible(true);

      setOtpModalVisible(true);
      setShowDeleteModal(false);
    } catch (err) {
      console.error("OTP generation failed:", err);
      alert("Failed to send OTP.");
    }
  };

  const getTemplateFieldsById = (templateId: string) => {
    const template = allTemplates.find((tpl) => tpl.id === templateId);
    if (!template || !Array.isArray(template.keys)) return [];
    return template.keys.map((k: any) => k.param);
  };

  const handlePreview = async (
    didKey: string,
    certType: string,
    fallbackCertData?: any
  ) => {
    setPreviewLoading(true);
    try {
      const rawEntry = data?.response?.dids?.[didKey] || fallbackCertData;
      if (!rawEntry) throw new Error("certData not found for given DID");
      const fields = rawEntry.data ?? rawEntry;

      const normalized = certType.replace(/\s/g, "").toLowerCase();

      const templateId = rawEntry.templateId;
      if (!templateId) throw new Error("Missing templateId");
      const tpl = allTemplates.find((t) => t.id === templateId);
      if (!tpl || !Array.isArray(tpl.keys)) throw new Error("Invalid template");

      const payload: Record<string, any> = { id: templateId };

      tpl.keys.forEach((k: any) => {
        const p = k.param;
        payload[p] =
          p.toLowerCase().includes("date") && !fields[p]
            ? new Date().toISOString().slice(0, 10)
            : fields[p] ?? "";
      });

      const dyn = Array.isArray(tpl.dynamicKeys) ? tpl.dynamicKeys : [];
      if (Array.isArray(fields.rows) && fields.rows.length > 0) {
        payload.rows = fields.rows.map((r: any) => {
          const row: Record<string, string> = {};
          dyn.forEach((dk: any) => {
            row[dk.param] = r[dk.param] ?? "";
          });
          return row;
        });
      } else {
        const single: Record<string, string> = {};
        dyn.forEach((dk: any) => {
          single[dk.param] = fields[dk.param] ?? "";
        });
        payload.rows = [single];
      }

      // always include the DID
      payload.did = didKey;

      console.log("▶️ getCustomCertificate body:", payload);
      const res = await fetch(`${apiIp}certificate/getCustomCertificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      const result = await res.json();
      if (!result.data) throw new Error("No certificate data received");

      setCertificateHTML(result.data);
      setShowModal(true);
    } catch (err: any) {
      console.error("❗ Certificate preview error:", err);
      alert(`Failed to generate preview: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const humanizeCamelCase = (str: string): string =>
    str
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-text">Certificates for {phone}</h1>

      {loading ? (
        <CertificateSkeleton />
      ) : !data?.response?.dids ? (
        <p>No certificate data found.</p>
      ) : (
        <div className="table-container">
          <table className="documents-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      const allDIDs = Object.keys(data.response.dids);
                      setSelectedDIDs(e.target.checked ? allDIDs : []);
                    }}
                    checked={
                      Object.keys(data.response.dids).length > 0 &&
                      selectedDIDs.length ===
                        Object.keys(data.response.dids).length
                    }
                  />
                </th>

                <th>Name</th>
                <th>DID</th>
                <th>Certi Name</th>
                <th>Date of Issue</th>
                <th>Preview</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const didEntries = Object.entries(
                  data.response.dids as Record<string, any>
                );
                {
                  console.log("didEntries ==>>", didEntries);
                }

                const filtered = didEntries.filter(([_, cert]) => {
                  const normalizedType = (cert.certificateType || "")
                    .toLowerCase()
                    .replace(/\s/g, "");

                  const isNotRevoked = !cert.isRevoked;
                  const isTypeAllowed =
                    allowedCertificateTypes.includes(normalizedType);

                  return isNotRevoked && isTypeAllowed;
                });

                const sorted = filtered.sort(([_, a], [__, b]) => {
                  const ta = new Date(
                    a.createdAt || a.dateOfIssue || 0
                  ).getTime();
                  const tb = new Date(
                    b.createdAt || b.dateOfIssue || 0
                  ).getTime();
                  return tb - ta;
                });
                return sorted.map(([key, cert], index) => (
                  <tr key={key}>
                    {/* <td>{index + 1}</td> */}
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedDIDs.includes(key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDIDs((prev) => [...prev, key]);
                          } else {
                            setSelectedDIDs((prev) =>
                              prev.filter((did) => did !== key)
                            );
                          }
                        }}
                      />
                    </td>

                    <td>
                     
                      {cert.name ||
                        cert.studentName ||
                        cert.headName ||
                        cert.applicantName ||
                        cert.data.headName ||
                        cert?.data?.name ||
                        (Array.isArray(cert.members) &&
                          cert.members[0]?.name) ||
                        "—"}
                    </td>
                    <td>{key}</td>
                    <td>
                      {humanizeCamelCase(
                        cert.CertiNo ||
                          cert.certificateType ||
                          cert.fields?.certificateType ||
                          cert.type ||
                          "Unknown Certificate"
                      )}
                    </td>
                    <td>
                      {cert.createdAt
                        ? new Date(cert.createdAt).toLocaleDateString("en-GB")
                        : ""}
                    </td>
                    <td>
                      <FaEye
                        onClick={() =>
                          handlePreview(
                            cert.did || key,
                            cert.CertiNo || cert.certificateType,
                            cert
                          )
                        }
                        style={{ cursor: "pointer" }}
                      />
                    </td>

                    <td>
                      {/* <RiDeleteBinLine
                    
                      /> */}
                      {/* <Image
                        src={revokeImage}
                        alt="revoke"
                        onClick={() => handleDeleteClick(key)}
                        style={{
                          cursor: "pointer",
                          color: "#000",
                          width: "30%",
                          height: "14%",
                        }}
                        title="revoke"
                      /> */}
                      <span
                        onClick={() => handleDeleteClick(key)}
                        style={{
                          cursor: "pointer",
                          color: "#d9534f",
                        }}
                      >
                        {" "}
                        Revoke
                      </span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}
      {selectedDIDs.length > 1 && (
        <button
          className="revoke-btn-primary"
          onClick={() => {
            setShowDeleteModal(true);
          }}
        >
          Revoke Selected DIDs ({selectedDIDs.length})
        </button>
      )}
      {showModal && (
        <div className="modal-overlay-certi">
          <div className="modal-content-certi">
            <IoMdClose
              color={"#c1272c"}
              className="close-modal-certi"
              size={40}
              onClick={() => setShowModal(false)}
            />

            <h2>Certificate Preview</h2>
            <div
              className="certificate-preview-certi"
              dangerouslySetInnerHTML={{ __html: certificateHTML }}
            />
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="modal-overlay-certi">
          <div className="modal-content-certi">
            <p>Are you sure you want to revoke.</p>

            <div className="table-button-container">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="table-confirm-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCertificate}
                className="table-confirm-delete"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
      {otpModalVisible && (
        <div className="modal-overlay-certi">
          <div className="modal-content-certi">
            <h6 className="modal-content-certi-h3">Enter OTP</h6>
            <input
              type="text"
              placeholder="Enter the OTP"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value)}
              className="otp-input"
            />
            <div className="table-button-container">
              <button
                onClick={() => setOtpModalVisible(false)}
                className="table-confirm-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleOtpSubmit}
                className="table-confirm-delete"
              >
                Verify & Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {notificationModalVisible && (
        <div className="modal-overlay-certi">
          <div className="modal-content-certi">
            <h3
              style={{
                textAlign: "center",
                color: notificationType === "success" ? "#28a745" : "#dc3545",
              }}
            >
              {notificationType === "success" ? "Success" : "Error"}
            </h3>

            <p style={{ textAlign: "center", marginTop: "10px" }}>
              {notificationMessage}
            </p>
            <div className="table-button-container">
              <button
                onClick={() => setNotificationModalVisible(false)}
                className="table-confirm-delete"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
