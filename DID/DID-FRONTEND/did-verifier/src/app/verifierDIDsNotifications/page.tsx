"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./verifierDIDsNotifications.css";
import { useSelectedDID } from "../Context/SelectedDIDContext";

const Page: React.FC = () => {
  const [dids, setDids] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const apiIp = process.env.NEXT_PUBLIC_API_URL;
  const { setSelectedDID } = useSelectedDID();
  useEffect(() => {
    const email = localStorage.getItem("userInfo");
    const token = localStorage.getItem("authToken");
    console.log("VerifierDIDsNotifications mounted");

    if (!email) {
      setLoading(false);
      return;
    }

    const fetchDIDs = async () => {
      setLoading(true);
      console.log("API CALLED for verifier/getAllDIDs");
      try {
        const res = await fetch(
          `${apiIp}verifier/getAllDIDs`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ verifierEmail: email }),
          }
        );
console.log("API CALLED done");
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API error ${res.status}: ${text}`);
        }

        const data = await res.json();
        if (!Array.isArray(data.dids)) {
          throw new Error('Malformed response: missing "dids" array');
        }
        setDids(data.dids);
      } catch (error: unknown) {
             console.error(error);
              const msg = error instanceof Error ? error.message : String(error);
              setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchDIDs();
  },[]);

  if (loading) return <div className="vdn-status">Loading notifications…</div>;
  if (error) return <div className="vdn-status error">{error}</div>;
  if (!dids.length)
    return <div className="vdn-status">No DID access notifications.</div>;

  return (
    <div className="vdn-container">
      <h2>All DIDs</h2>
      {dids.map((did) => (
     
        <div key={did} className="vdn-card">
          <span>
            You got access for DID <strong>{did}</strong>
          </span>
          <button
            className="vdn-details-btn"
            onClick={() => {
              setSelectedDID(did);
              router.push("/verifyCertificate");
            }}
          >
            View Details
          </button>
        </div>
      ))}
    </div>
  );
};

export default Page;
