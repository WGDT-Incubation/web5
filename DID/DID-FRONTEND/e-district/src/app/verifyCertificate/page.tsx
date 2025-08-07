"use client";

import React, { useState, useEffect, useCallback } from "react";
import "./VerifyCertificate.css";

interface Verifier {
  _id?: string;
  verifierEmail: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt?: string;
}

function TableSkeleton() {
  const skeletonRows = Array.from({ length: 5 }, (_, i) => i);
  return (
    <table className="documents-table skeleton-table">
      <thead>
        <tr>
          {[...Array(6)].map((_, i) => (
            <th key={i}><div className={`skeleton-col skeleton-col-${i}`} /></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {skeletonRows.map((_, idx) => (
          <tr key={idx}>
            {[...Array(6)].map((_, i) => (
              <td key={i}><div className={`skeleton-col skeleton-col-${i}`} /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type ViewType = "pending" | "approved" | "rejected" | "all";

const Pages = () => {
  const apiIp = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/";
  const [verifierList, setVerifierList] = useState<Verifier[]>([]);
  const [selectedVerifiers, setSelectedVerifiers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [viewType, setViewType] = useState<ViewType>("pending");

  const fetchVerifierList = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    setLoading(true);

    let endpoint = "";
    switch (viewType) {
      case "approved":
        endpoint = "superAdmin/getVerifierApprovedList";
        break;
      case "rejected":
        endpoint = "superAdmin/getVerifierRejectedList";
        break;
      case "all":
        endpoint = "superAdmin/getAllVerifierList";
        break;
      default:
        endpoint = "superAdmin/getPendingVerifierList";
    }

    try {
      const res = await fetch(`${apiIp}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list =
        data.pendingVerifiers ||
        data.approvedVerifiers ||
        data.rejectedVerifiers ||
        data.allVerifiers ||
        data.data ||
        [];
      setVerifierList(list);
    } catch {
      setMessage("Error fetching verifier list.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  }, [viewType, apiIp]); 

  const handleCheckboxChange = (email: string) => {
    setSelectedVerifiers((prev) => {
      const updated = new Set(prev);
      if (updated.has(email)) updated.delete(email);
      else updated.add(email);
      return updated;
    });
  };

  const handleBulkApprove = async () => {
    const token = localStorage.getItem("authToken");
    if (!selectedVerifiers.size) return;
    setLoading(true);
    try {
      const verifierEmail = Array.from(selectedVerifiers);
      const res = await fetch(`${apiIp}superAdmin/addverifier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ verifierEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve selected verifiers.");
      setMessage(data.message || "Selected verifiers approved successfully.");
      setIsSuccess(true);
      setSelectedVerifiers(new Set());
      fetchVerifierList(); 
    } catch {
      setMessage("An unexpected error occurred.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    const token = localStorage.getItem("authToken");
    if (!selectedVerifiers.size) return;
    setLoading(true);
    try {
      const verifierEmail = Array.from(selectedVerifiers);
      const res = await fetch(`${apiIp}superAdmin/rejectVerifiers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ verifierEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject selected verifiers.");
      setMessage(data.message || "Selected verifiers rejected successfully.");
      setIsSuccess(true);
      setSelectedVerifiers(new Set());
      fetchVerifierList(); // Re-fetch list after rejecting
    } catch {
      setMessage("An unexpected error occurred.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReissue = async () => {
    const token = localStorage.getItem("authToken");
    if (!selectedVerifiers.size) return;
    setLoading(true);
    try {
      const verifierEmail = Array.from(selectedVerifiers);
      const res = await fetch(`${apiIp}superAdmin/addverifier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ verifierEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue selected verifiers.");
      setMessage(data.message || "Selected verifiers issued successfully.");
      setIsSuccess(true);
      setSelectedVerifiers(new Set());
      fetchVerifierList(); // Re-fetch list after re-issue
    } catch {
      setMessage("An unexpected error occurred.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifierList(); // Fetch verifier list when `viewType` changes
  }, [viewType, fetchVerifierList]); // Proper dependency on `viewType` and `fetchVerifierList`

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setIsSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, isSuccess]);
  // New: Undo verifiers back to pending
  const handleBulkUndo = async () => {
    const token = localStorage.getItem("authToken");
    if (!selectedVerifiers.size) return;

    setLoading(true);
    try {
      const verifierEmail = Array.from(selectedVerifiers);              // <-- array of emails
      const res = await fetch(`${apiIp}superAdmin/undoVerifiers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ verifierEmail }),                         // <-- send as array
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to undo verifiers.");
      setMessage(data.message || "Selected verifiers status reverted successfully.");
      setIsSuccess(true);
      setSelectedVerifiers(new Set());
      fetchVerifierList();
    } catch {
      setMessage("An unexpected error occurred.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="addIssuerContainer">
      <h1 className="addIssuerTitle">
        {viewType.charAt(0).toUpperCase() + viewType.slice(1)} Verifier List
      </h1>

      <div style={{ marginBottom: "20px" }}>
        {(["pending", "approved", "rejected", "all"] as ViewType[]).map((type) => (
          <button
            key={type}
            onClick={() => setViewType(type)}
            className={`view-toggle-btn ${viewType === type ? "active" : ""}`}
          >
            View {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {loading && <TableSkeleton />}
      {message && (
        <p className={`addIssuerMessage ${isSuccess ? "successMessage" : "errorMessage"}`}>
          {message}
        </p>
      )}

      {!loading && verifierList.length > 0 && (
        <table className="issuer-table">
          <thead>
            <tr>
              {(viewType === "pending" || viewType === "approved" || viewType === "rejected") && <th>Select</th>}
              <th>Email</th>
              <th>Status</th>
              <th>
                {viewType === "approved"
                  ? "Approved At"
                  : viewType === "rejected"
                  ? "Rejected At"
                  : "Requested At"}
              </th>
            </tr>
          </thead>
          <tbody>
            {verifierList.map((verifier, index) => (
              <tr key={verifier._id || index}>
                {(viewType === "pending" || viewType === "approved" || viewType === "rejected") && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedVerifiers.has(verifier.verifierEmail)}
                      onChange={() => handleCheckboxChange(verifier.verifierEmail)}
                    />
                  </td>
                )}
                <td>{verifier.verifierEmail}</td>
                <td style={{
                  color:
                    (viewType === "all" ? verifier.status : viewType) === "approved"
                      ? "green"
                      : (viewType === "all" ? verifier.status : viewType) === "rejected"
                      ? "red"
                      : "orange",
                  fontWeight: "bold",
                }}>
                  {(viewType === "all" ? verifier.status : viewType).charAt(0).toUpperCase() +
                    (viewType === "all" ? verifier.status : viewType).slice(1)}
                </td>
                <td>{new Date(verifier.updatedAt || verifier.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(viewType === "pending" || viewType === "approved" || viewType === "rejected") && verifierList.length > 0 && (
        <div className="app-rej-btn">
          {viewType === "pending" && (
            <button
              onClick={handleBulkApprove}
              className="approve-btn"
              disabled={loading || selectedVerifiers.size === 0}
            >
              Approve
            </button>
          )}
          {(viewType === "pending" || viewType === "approved") && (
            <button
              onClick={handleBulkReject}
              className="reject-btn"
              disabled={loading || selectedVerifiers.size === 0}
            >
              Reject
            </button>
          )}
          {viewType === "rejected" && (
            <button
              onClick={handleBulkReissue}
              className="approve-btn"
              disabled={loading || selectedVerifiers.size === 0}
            >
              Reissue
            </button>
          )}
           {(viewType === "approved" || viewType === "rejected") && (
           <button
             onClick={handleBulkUndo}
             className="approve-btn"
             disabled={loading || selectedVerifiers.size === 0}
           >
             Undo
           </button>
         )}
        </div>
      )}

      {!loading && verifierList.length === 0 && (
        <p style={{ marginTop: "20px", color: "gray" }}>
          {viewType === "approved"
            ? "No approved verifiers found."
            : viewType === "rejected"
            ? "No rejected verifiers found."
            : viewType === "all"
            ? "No verifiers found."
            : "No pending verifier requests."}
        </p>
      )}
    </div>
  );
};

export default Pages;
