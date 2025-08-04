"use client";
import React, { useEffect, useState } from "react";
import "./CronPending.css";

interface CronDoc {
  _id: string;
  id: string;
  credentialSubject: Record<string, any>;
  type: string[];
  status: string;
  insertedAt: string;
}

const CertificateSkeleton = () => (
  <div className="skeleton-container">
    <table className="skeleton-table">
      <thead>
        <tr>
          <th />
          <th />
          <th />
          <th />
          <th />
          <th />
          <th />
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 10 }).map((_, idx) => (
          <tr key={idx} className="skeleton-row">
            <td>
              <span className="skeleton-col skeleton-col-sn" />
            </td>
            <td>
              <span className="skeleton-col skeleton-col-doc-holder" />
            </td>
            <td>
              <span className="skeleton-col skeleton-col-did" />
            </td>
            <td>
              <span className="skeleton-col skeleton-col-no-doc" />
            </td>
            <td>
              <span className="skeleton-col skeleton-col-mobile" />
            </td>
            <td>
              <span className="skeleton-col skeleton-col-action" />
            </td>
            <td>
              <span className="skeleton-col skeleton-col-action" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function CronPendingPage() {
  const [data, setData] = useState<CronDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  const apiIp = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken") || "";
        const res = await fetch(`${apiIp}admin/getEDistrictCronData`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        const pendingData = json.data?.filter(
          (d: CronDoc) => d.status === "pending"
        );
        setData(pendingData || []);
      } catch (err) {
        console.error("Error fetching cron data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const indexOfFirst = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(indexOfFirst, indexOfFirst + itemsPerPage);

  return (
    <div className="cron-dashboard-container">
      <h1 className="dashboard-text">Pending Documents</h1>
      <div className="crone-table-container">
        {isLoading ? (
          <CertificateSkeleton />
        ) : data.length === 0 ? (
          <p className="no-records">No pending records found.</p>
        ) : (
          <>
            <table className="crone-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Name</th>
                  <th>Certificate Type</th>
                  <th>Mobile Number</th>
                  <th>Issue</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, idx) => {
                  const certData =
                    item.credentialSubject?.["income certificate"] ||
                    item.credentialSubject?.["caste certificate"] ||
                    {};
                  return (
                    <tr key={item._id}>
                      <td>{indexOfFirst + idx + 1}</td>
                      <td>{certData.name || certData.headName || "—"}</td>
                      <td>
                        {item.type?.[1]?.replace("Credential", "") || "—"}
                      </td>
                      <td>{certData["Mobile Number"] || "—"}</td>
                      <td>
                        <button
                          className="issue-btn-cron"
                          onClick={() => {
                            const query = new URLSearchParams({
                              certificateType:
                                item.type?.[1]?.replace("Credential", "") || "",
                              phoneNumber: certData["Mobile Number"] || "",
                              name: certData.name || certData.headName || "",
                              fatherName: certData.fatherName || "",
                              fullAddress:
                                certData.fullAddress || certData.address || "",
                              income: certData.income || "",
                              incomeInWords: certData.incomeInWords || "",
                              issueDate:
                                certData.issueDate ||
                                certData.dateOfIssue ||
                                "",
                              source: "pending",
                              id: item.id,
                              // ← Add this:
                              readonly: "true",
                            }).toString();
                            window.location.href = `/issued?${query}`;
                          }}
                        >
                          Issue
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="pagination-container">
              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
