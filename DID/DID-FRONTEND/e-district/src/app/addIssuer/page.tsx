"use client";

import React, { useState, useEffect, useCallback } from "react";
import "./addIssuer.css";

interface Issuer {
  _id?: string;
  issuerEmail: string;
  isApprovedbySuperAdmin?: boolean;
  updatedAt: string;
  status: "pending" | "approved" | "rejected";
  department?: string | null;
}

function TableSkeleton() {
  const skeletonRows = Array.from({ length: 5 }, (_, i) => i);
  return (
    <table className="documents-table skeleton-table">
      <thead>
        <tr>
          <th>
            <div className="skeleton-col skeleton-col-sn"></div>
          </th>
          <th>
            <div className="skeleton-col skeleton-col-doc-holder"></div>
          </th>
          <th>
            <div className="skeleton-col skeleton-col-no-doc"></div>
          </th>
          <th>
            <div className="skeleton-col skeleton-col-mobile"></div>
          </th>
          <th>
            <div className="skeleton-col skeleton-col-did"></div>
          </th>
          <th>
            <div className="skeleton-col skeleton-col-action"></div>
          </th>
        </tr>
      </thead>
      <tbody>
        {skeletonRows.map((_, idx) => (
          <tr key={idx}>
            <td>
              <div className="skeleton-col skeleton-col-sn"></div>
            </td>
            <td>
              <div className="skeleton-col skeleton-col-doc-holder"></div>
            </td>
            <td>
              <div className="skeleton-col skeleton-col-no-doc"></div>
            </td>
            <td>
              <div className="skeleton-col skeleton-col-mobile"></div>
            </td>
            <td>
              <div className="skeleton-col skeleton-col-did"></div>
            </td>
            <td>
              <div className="skeleton-col skeleton-col-action"></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const AddIssuer = () => {
  const apiIp = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/";
  const [issuerList, setIssuerList] = useState<Issuer[]>([]);
  const [selectedIssuers, setSelectedIssuers] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  type ViewType = "pending" | "approved" | "rejected" | "all";
  const [viewType, setViewType] = useState<ViewType>("pending");

  // Memoize fetchIssuerList to prevent unnecessary re-creations
  const fetchIssuerList = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    setLoading(true);

    let endpoint = "";
    switch (viewType) {
      case "approved":
        endpoint = "superAdmin/getIssuerApprovedList";
        break;
      case "rejected":
        endpoint = "superAdmin/getIssuerRejectedList";
        break;
      case "all":
        endpoint = "superAdmin/getAllIssuerList";
        break;
      default:
        endpoint = "superAdmin/getPendingIssuerList";
    }

    try {
      const res = await fetch(`${apiIp}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const issuers =
          data.approvedIssuers ||
          data.rejectedIssuers ||
          data.pendingIssuers ||
          data.allIssuers ||
          data.data ||
          [];
        setIssuerList(issuers);
      } else {
        setMessage("Failed to fetch issuer list.");
        setIsSuccess(false);
      }
    } catch {
      setMessage("Error fetching issuer list.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  }, [viewType, apiIp]); // Depend on `viewType` and `apiIp`

  const handleCheckboxChange = (email: string) => {
    setSelectedIssuers((prev) => {
      const updated = new Set(prev);
      if (updated.has(email)) {
        updated.delete(email);
      } else {
        updated.add(email);
      }
      return updated;
    });
  };

  const handleBulkApprove = async () => {
    const token = localStorage.getItem("authToken");
    if (!selectedIssuers.size) return;

    setLoading(true);
    try {
      const issuerEmail = Array.from(selectedIssuers);
      const res = await fetch(`${apiIp}superAdmin/addissuer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ issuerEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve issuers.");
      setMessage(data.message || "Selected issuers approved successfully.");
      setIsSuccess(true);
      setSelectedIssuers(new Set());
      fetchIssuerList();
    } catch {
      setMessage("An unexpected error occurred.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    const token = localStorage.getItem("authToken");
    if (!selectedIssuers.size) return;

    setLoading(true);
    try {
      const issuerEmail = Array.from(selectedIssuers);
      const res = await fetch(`${apiIp}superAdmin/rejectIssuers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ issuerEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject issuers.");
      setMessage(data.message || "Selected issuers rejected successfully.");
      setIsSuccess(true);
      setSelectedIssuers(new Set());
      fetchIssuerList();
    } catch {
      setMessage("An unexpected error occurred.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReissue = async () => {
    const token = localStorage.getItem("authToken");
    if (!selectedIssuers.size) return;

    setLoading(true);
    try {
      const issuerEmail = Array.from(selectedIssuers);
      const res = await fetch(`${apiIp}superAdmin/addissuer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ issuerEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reissue issuers.");
      setMessage(data.message || "Selected issuers reissued successfully.");
      setIsSuccess(true);
      setSelectedIssuers(new Set());
      fetchIssuerList();
    } catch {
      setMessage("An unexpected error occurred.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setIsSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    fetchIssuerList(); // Fetch issuer list when `viewType` changes
  }, [viewType, fetchIssuerList]); // Correct dependency for the useEffect

  const renderTitle = () => {
    switch (viewType) {
      case "approved":
        return "Approved Issuer List";
      case "rejected":
        return "Rejected Issuer List";
      case "all":
        return "All Issuer List";
      default:
        return "Pending Issuer List";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "pending":
        return "orange";
      default:
        return "black";
    }
  };
  // New: Undo issuers back to pending
  const handleBulkUndo = async () => {
    const token = localStorage.getItem("authToken");
    if (!selectedIssuers.size) return;

    setLoading(true);
    try {
      const issuerEmail = Array.from(selectedIssuers);
      const res = await fetch(`${apiIp}superAdmin/undoIssuers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ issuerEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to undo issuers.");
      setMessage(
        data.message || "Selected issuers status reverted successfully."
      );
      setIsSuccess(true);
      setSelectedIssuers(new Set());
      fetchIssuerList();
    } catch {
      setMessage("An unexpected error occurred.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="addIssuerContainer">
      <h1 className="addIssuerTitle">{renderTitle()}</h1>

      <div className="view-toggle-group">
        {["pending", "approved", "rejected", "all"].map((type) => (
          <button
            key={type}
            onClick={() => setViewType(type as ViewType)}
            className={`view-toggle-btn ${viewType === type ? "active" : ""}`}
          >
            View {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {loading && <TableSkeleton />}
      {message && (
        <p
          className={`addIssuerMessage ${
            isSuccess ? "successMessage" : "errorMessage"
          }`}
        >
          {message}
        </p>
      )}

      {!loading && issuerList.length > 0 && (
        <table className="issuer-table">
          <thead>
            <tr>
              {(viewType === "pending" ||
                viewType === "approved" ||
                viewType === "rejected") && <th>Select</th>}
              <th>Email</th>
              <th>Department</th>
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
            {issuerList.map((issuer, index) => (
              <tr key={issuer._id || index}>
                {(viewType === "pending" ||
                  viewType === "approved" ||
                  viewType === "rejected") && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIssuers.has(issuer.issuerEmail)}
                      onChange={() => handleCheckboxChange(issuer.issuerEmail)}
                    />
                  </td>
                )}
                <td>{issuer.issuerEmail}</td>
                <td>{issuer.department || "—"}</td>
                <td
                  style={{
                    color: getStatusColor(issuer.status),
                    fontWeight: "bold",
                  }}
                >
                  {issuer.status.charAt(0).toUpperCase() +
                    issuer.status.slice(1)}
                </td>
                <td>{new Date(issuer.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(viewType === "pending" ||
        viewType === "approved" ||
        viewType === "rejected") &&
        issuerList.length > 0 && (
          <div className="app-rej-btn">
            {viewType === "pending" && (
              <button
                onClick={handleBulkApprove}
                className="approve-btn"
                disabled={loading || selectedIssuers.size === 0}
              >
                Approve
              </button>
            )}
            {(viewType === "pending" || viewType === "approved") && (
              <button
                onClick={handleBulkReject}
                className="reject-btn"
                disabled={loading || selectedIssuers.size === 0}
              >
                Reject
              </button>
            )}
            {viewType === "rejected" && (
              <button
                onClick={handleBulkReissue}
                className="approve-btn"
                disabled={loading || selectedIssuers.size === 0}
              >
                Reissue
              </button>
            )}
            {(viewType === "approved" || viewType === "rejected") && (
              <button
                onClick={handleBulkUndo}
                className="approve-btn"
                disabled={loading || !selectedIssuers.size}
              >
                Undo
              </button>
            )}
          </div>
        )}

      {!loading && issuerList.length === 0 && (
        <p style={{ marginTop: "20px", color: "gray" }}>
          {renderTitle().replace(" List", "")} not found.
        </p>
      )}
    </div>
  );
};

export default AddIssuer;
