"use client";
import React, { useState, useEffect, useRef } from "react";
import "./dashboard.css";
import Image from "next/image";
import { RiDeleteBinLine } from "react-icons/ri";
import { LuSearch } from "react-icons/lu";
import { HiOutlineBars3BottomLeft } from "react-icons/hi2";
import icon from "../../../public/images/Icon.svg";
import icon1 from "../../../public/images/Icon (1).svg";
import icon2 from "../../../public/images/pending.svg";
import icon3 from "../../../public/images/Icon (3).svg";
import Link from "next/link";
import data from "../../app/data/pending.json";
import { useRouter } from "next/navigation";
import revokeImage from "../../../public/images/revoke.svg";
import expiredImage from "../../../public/images/expired.svg";
import revokedImage from "../../../public/images/revoked.svg";
import rejectImage from "../../../public/images/reject-document.svg";
import { IoMdClose } from "react-icons/io";

interface DID {
  name: string;
  surname?: string;
  Email?: string;
  CertiNo?: string;
  createdAt?: string;
  expiredAt?: string;
  studentName: string;
  headName: string;
  applicantName: string;
  certificateType: string;
  isRevoked?: boolean;
  members?: Member[];
  issuedBy?: string;
  fields?: Record<string, string>;
  data?: {
    headName?: string;
    [key: string]: any;
  };
}
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
interface AllDIDItem {
  phoneNumber: string;
  dids: { [key: string]: DID };
  owners: string[];
  createdAt?: string;
}

interface DIDResponse {
  response: {
    allDIDs: AllDIDItem[];
  };
}

interface DocumentData {
  id: number;
  name: string;
  mobileNumber: string;
  selectedCertificates: { name: string; did: string; date?: string }[];
  certificateOptions: { name: string; did: string; date?: string }[];
  showDropdown: boolean;
  fields?: Record<string, string>;
  members?: Member[];
  issueID?: string;
}
const CERT_TYPE_MAP: Record<string, string> = {
  "birth certificate": "birth",
  "income certificate": "income",
  "bonafide certificate": "bonafide",
  "caste certificate": "caste",
  "character certificate": "character",
  "domicile certificate": "domicile",
  "medical certificate": "medical",
  "migration certificate": "migration",
  "family certificate": "family",
};

const PAGE_SIZE = 5;

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

export default function Dashboard() {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jwt, setJwt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [rawDIDs, setRawDIDs] = useState<AllDIDItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const apiIp = process.env.NEXT_PUBLIC_API_URL;
  const [activeTab, setActiveTab] = useState<
    "issued" | "pending" | "rejected" | "revoked" | "expired" | "all"
  >("issued");

  const [pendingDocuments, setPendingDocuments] = useState<DocumentData[]>([]);
  const [rejectedDocuments, setRejectedDocuments] = useState<DocumentData[]>(
    []
  );
  const [expiredDocuments, setExpiredDocuments] = useState<DocumentData[]>([]);

  const [revokedDIDs, setRevokedDIDs] = useState<AllDIDItem[]>([]);

  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number>(0);

  console.log("apiip", apiIp);
  const [certificateStats, setCertificateStats] = useState({
    total: 0,
    issued: 0,
    pending: 0,
  });
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string | null>(
    null
  );
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [allowedCertificateTypes, setAllowedCertificateTypes] = useState<
    string[]
  >([]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHTML, setPreviewHTML] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [certificateParams, setCertificateParams] = useState<any>({});
  function filterByAllowedCerts(docs: DocumentData[]): DocumentData[] {
    return docs.filter((d) =>
      allowedCertificateTypes.includes(
      normalizeCertType(d.selectedCertificates[0].name)
    )
    );
  }
function normalizeCertType(type: string): string {
  return type
    .replace(/([a-z])([A-Z])/g, "$1 $2") 
    .toLowerCase()
    .trim();
}

const downloadReport = () => {
  let headers: string[] = [];
  let rows: string[][] = [];

  const quote = (v: any) => `"${v ?? ""}"`;

  switch (activeTab) {
    case "issued":
      headers = ["Name","Mobile Number","Certificate Type","Date of Issue"];
      rows = documents.map(doc => {
        const cert = doc.selectedCertificates[0];
        return [
          quote(doc.name),
          quote(doc.mobileNumber),
          quote(cert.name),
          quote(cert.date ? formatDateToDDMMYYYY(cert.date) : "")
        ];
      });
      break;

    case "pending":
      headers = ["Name","Mobile Number","Certificate Name"];
      rows = pendingDocuments.map(doc => {
        const cert = doc.selectedCertificates[0];
        return [
          quote(doc.name),
          quote(doc.mobileNumber),
          quote(cert.name)
        ];
      });
      break;

    case "rejected":
      headers = ["Name","Mobile Number","Certificate Name","Status"];
      rows = rejectedDocuments.map(doc => {
        const cert = doc.selectedCertificates[0];
        return [
          quote(doc.name),
          quote(doc.mobileNumber),
          quote(cert.name),
          quote("Rejected")
        ];
      });
      break;

    case "expired":
      headers = ["Name","Mobile Number","Certificate Name","Expiry Date"];
      rows = expiredDocuments.map(doc => {
        const cert = doc.selectedCertificates[0];
        return [
          quote(doc.name),
          quote(doc.mobileNumber),
          quote(cert.name),
          quote(cert.date ? formatDateToDDMMYYYY(cert.date) : "")
        ];
      });
      break;

    case "revoked":
      headers = ["Name","Mobile Number","Certificate Name","Date of Revoke"];
      // flatten revokedDIDs
      rows = revokedDIDs.flatMap(item =>
        Object.values(item.dids).map(didValue => [
          quote(
            didValue.name ||
            didValue.studentName ||
            didValue.headName ||
            didValue.applicantName ||
            (Array.isArray(didValue.members) && didValue.members[0]?.name) ||
            "N/A"
          ),
          quote(item.phoneNumber),
          quote(didValue.certificateType),
          quote(didValue.expiredAt ? formatDateToDDMMYYYY(didValue.expiredAt) : "")
        ])
      );
      break;

    case "all":
      headers = ["Name","Mobile Number","Certificate Name","Date","Status"];
      rows = sortedDocs.map(doc => {
        const cert = doc.selectedCertificates[0];
        const issued = documents.some(d => d.mobileNumber === doc.mobileNumber && d.selectedCertificates[0].did === cert.did);
        return [
          quote(doc.name),
          quote(doc.mobileNumber),
          quote(cert.name),
          quote(cert.date ? formatDateToDDMMYYYY(cert.date) : ""),
          quote(issued ? "Issued" : "Pending")
        ];
      });
      break;

    default:
      alert("Nothing to download for this tab.");
      return;
  }

  // assemble and trigger download
  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${activeTab}_certificates_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

  const getCertiNoForOption = (
    option: { name: string; did: string },
    mobileNumber: string
  ) => {
    return (
      rawDIDs.find((p: AllDIDItem) => p.phoneNumber === mobileNumber)?.dids?.[
        option.did
      ]?.CertiNo || option.name
    );
  };

  const toggleDropdown = (docId: number) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) =>
        doc.id === docId ? { ...doc, showDropdown: !doc.showDropdown } : doc
      )
    );
  };

  useEffect(() => {
    const fetchParams = async () => {
      try {
        const res = await fetch(`${apiIp}certificate/getCertificateParams`);
        const data = await res.json();
        const normalized: Record<string, any> = {};

        Object.entries(data).forEach(([key, value]) => {
          const normKey = key
            .toLowerCase()
            .replace(/certificate/g, "")
            .trim();
          normalized[normKey] = value;
        });

        setCertificateParams(normalized);
      } catch (err) {
        console.error("Failed to load certificate params:", err);
      }
    };
    fetchParams();
  }, [apiIp]);

  const formatDateToDDMMYYYY = (dateStr: string): string => {
    const date = new Date(dateStr);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !(
          event.target instanceof Element &&
          event.target.closest(".dropdown-button")
        )
      ) {
        setDocuments((prevDocs) =>
          prevDocs.map((doc) => ({ ...doc, showDropdown: false }))
        );
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  const activeDocuments =
    activeTab === "issued"
      ? documents
      : activeTab === "pending"
      ? pendingDocuments
      : activeTab === "rejected"
      ? rejectedDocuments
      : activeTab === "revoked"
      ? revokedDIDs.flatMap((doc, docIdx) =>
          Object.entries(doc.dids).map(([didKey, didValue], idx) => ({
            id: docIdx * 100 + idx,
            name:
              didValue.name ||
              didValue.studentName ||
              didValue.data?.headName ||
              didValue.data?.name ||
              didValue.headName ||
              didValue.applicantName ||
              (Array.isArray(didValue.members) && didValue.members[0]?.name) ||
              "User Name",
            mobileNumber: doc.phoneNumber,
            selectedCertificates: [
              {
                name: didValue.certificateType,
                did: didKey,
                date: didValue.createdAt,
              },
            ],
            certificateOptions: [
              {
                name: didValue.certificateType,
                did: didKey,
                date: didValue.createdAt,
              },
            ],
            showDropdown: false,
            fields: {},
            members: [],
            issueID: "",
          }))
        )
      : activeTab === "expired"
      ? expiredDocuments
      : [
          ...documents.flatMap((doc) =>
            doc.certificateOptions
              .filter((cert) => cert.did)
              .map((cert, idx) => {
                const didEntry = rawDIDs.find(
                  (p) => p.phoneNumber === doc.mobileNumber
                );
                const didObj = didEntry?.dids?.[cert.did];
                const fullName =
                  didObj?.name ||
                  didObj?.studentName ||
                  didObj?.headName ||
                  didObj?.applicantName ||
                  didObj?.data?.headName ||
                  didObj?.data?.name ||
                  (Array.isArray(didObj?.members) && didObj.members[0]?.name) ||
                  "User Name";

                return {
                  id: doc.id * 100 + idx,
                  name: fullName,
                  mobileNumber: doc.mobileNumber,
                  selectedCertificates: [cert],
                  certificateOptions: [cert],
                  showDropdown: false,
                  fields: {},
                  members: [],
                  issueID: "",
                };
              })
          ),
          ...pendingDocuments,
        ];

  const filteredDocs = activeDocuments.filter((doc) => {
    const q = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.mobileNumber.includes(q) ||
      doc.selectedCertificates.some((cert) => {
        const name = cert.name ?? "";
        const did = cert.did ?? "";
        return name.toLowerCase().includes(q) || did.toLowerCase().includes(q);
      })
    );
  });

  const sortedDocs = React.useMemo(() => {
    const docs = [...filteredDocs];

    docs.sort((a, b) => {
      const aDateTime = new Date(
        a.selectedCertificates[0]?.date || ""
      ).getTime();
      const bDateTime = new Date(
        b.selectedCertificates[0]?.date || ""
      ).getTime();
      return bDateTime - aDateTime;
    });

    if (sortOrder === "asc") {
      docs.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === "desc") {
      docs.sort((a, b) => b.name.localeCompare(a.name));
    }

    return docs;
  }, [filteredDocs, sortOrder]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setFilterDropdownOpen(false);
      }
    };
    if (filterDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterDropdownOpen]);
function normalizeCertificateType(type: string) {
  return type
    .replace(/([a-z])([A-Z])/g, "$1 $2") 
    .toLowerCase()
    .trim();
}
  function filterByAllowed(
    list: AllDIDItem[],
    allowed: string[]
  ): AllDIDItem[] {
    return list
      .map((item) => ({
        ...item,
        dids: Object.fromEntries(
          Object.entries(item.dids).filter(([, did]) =>
            allowed.includes(normalizeCertificateType(did.certificateType))
          )
        ),
      }))
      .filter((item) => Object.keys(item.dids).length > 0);
  }
  useEffect(() => {
    async function fetchData() {
      const authToken = localStorage.getItem("authToken");

      try {
        const loginRes = await fetch(`${apiIp}admin/adminLogin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({}),
        });
        if (!loginRes.ok) {
          const errorText = await loginRes.text();
          console.error("Admin login failed:", errorText);
          throw new Error("Failed to login");
        }
        const loginData = await loginRes.json();
        console.log("loginData", loginData);
        const token = loginData.token;
        console.log("token", token);
        setJwt(token);
        localStorage.setItem("token", token);
        const deptName = localStorage.getItem("issuerDepartment");
        const deptRes = await fetch(
          `${apiIp}admin/getDepartmentCertificateTypes`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ department: deptName }),
          }
        );
        if (!deptRes.ok)
          throw new Error("Failed to load department cert types");
        const deptJson = await deptRes.json();
        console.log("department json======", deptJson);
        const allowedList = deptJson.certificateTypes.map((c: string) =>
          c.toLowerCase()
        );
        localStorage.setItem(
          "allowedCertificateTypes",
          JSON.stringify(allowedList)
        );
        setAllowedCertificateTypes(allowedList);

        // setAllowedCertificateTypes(
        //   deptJson.certificateTypes.map((c: string) => c.toLowerCase())
        // );
        const didRes = await fetch(`${apiIp}admin/getAllDIDs`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!didRes.ok) {
          const errorText = await didRes.text();
          console.error("Failed to fetch DIDs:", errorText);
          throw new Error("Failed to fetch DIDs: " + errorText);
        }
        const didData: DIDResponse = await didRes.json();
        let allDIDs = didData.response.allDIDs;
        console.log("allDids", allDIDs);

        const issuedOnly: AllDIDItem[] = [];
        const revokedOnly: AllDIDItem[] = [];

        for (const item of allDIDs) {
          const issuedDIDs: Record<string, DID> = {};
          const revokedDIDs: Record<string, DID> = {};

          for (const [didKey, didValue] of Object.entries(item.dids)) {
            if (didValue.isRevoked) {
              revokedDIDs[didKey] = didValue;
            } else {
              issuedDIDs[didKey] = didValue;
            }
          }

          if (Object.keys(issuedDIDs).length > 0) {
            issuedOnly.push({ ...item, dids: issuedDIDs });
          }
          if (Object.keys(revokedDIDs).length > 0) {
            revokedOnly.push({ ...item, dids: revokedDIDs });
          }
        }

        const filteredIssued = filterByAllowed(issuedOnly, allowedList);
        const filteredRevoked = filterByAllowed(revokedOnly, allowedList);
        setRawDIDs(filteredIssued);
        setRevokedDIDs(filteredRevoked);
        const issuedCount = filteredIssued.reduce(
          (sum, entry) => sum + Object.keys(entry.dids).length,
          0
        );
        const today = new Date();
        const expiredDocs: DocumentData[] = [];

        filteredIssued.forEach((entry, idx) => {
          const dids = entry.dids;

          if (
            !dids ||
            typeof dids !== "object" ||
            Array.isArray(dids) ||
            Object.keys(dids).length === 0
          ) {
            return;
          }

          Object.entries(dids).forEach(([didKey, didValue], i) => {
            const value = didValue as DID;
            const createdAt = value.createdAt
              ? new Date(value.createdAt)
              : null;
            const expiredAt = createdAt
              ? new Date(
                  createdAt.getFullYear(),
                  createdAt.getMonth(),
                  createdAt.getDate() + 1,
                  0,
                  0,
                  0,
                  0
                )
              : null;

            if (expiredAt && expiredAt <= today) {
              expiredDocs.push({
                id: idx * 100 + i,
                name:
                  value.name ||
                  value.studentName ||
                  value.data?.headName ||
                  value.data?.name ||
                  value.headName ||
                  value.applicantName ||
                  (Array.isArray(value.members) && value.members[0]?.name) ||
                  "User Name",
                mobileNumber: entry.phoneNumber,
                selectedCertificates: [
                  {
                    name: value.certificateType || "Unknown Certificate",
                    did: didKey,
                    date: expiredAt.toISOString(),
                  },
                ],
                certificateOptions: [
                  {
                    name: value.certificateType || "Unknown Certificate",
                    did: didKey,
                    date: expiredAt.toISOString(),
                  },
                ],
                showDropdown: false,
                fields: value.fields || {},
                members: value.members || [],
                issueID: "",
              });
            }
          });
        });

        setExpiredDocuments(expiredDocs);

        // const [pendingList, rejectedList] = await Promise.all([
        //   fetchPendingDocuments(),
        //   fetchRejectedDocuments(),
        // ]);

        // let filteredPending = pendingList;
        // let filteredRejected = rejectedList;

        // setPendingDocuments(filteredPending);
        // setRejectedDocuments(filteredRejected);

        // const pendingCount = filteredPending.length;
        // const rejectedCount = filteredRejected.length;

        // setCertificateStats({
        //   total: issuedCount + pendingCount,
        //   issued: issuedCount,
        //   pending: pendingCount,
        // });

        const [pendingListRaw, rejectedListRaw] = await Promise.all([
          fetchPendingDocuments(),
          fetchRejectedDocuments(),
        ]);


        const filteredPending = pendingListRaw.filter((doc) =>
       allowedList.includes(normalizeCertType(doc.selectedCertificates[0].name))
        );
        const filteredRejected = rejectedListRaw.filter((doc) =>
          allowedList.includes(normalizeCertType(doc.selectedCertificates[0].name))
        );

        setPendingDocuments(filteredPending);
        setRejectedDocuments(filteredRejected);

        const pendingCount = filteredPending.length;
        const rejectedCount = filteredRejected.length;

        setCertificateStats({
          total: issuedCount + pendingCount,
          issued: issuedCount,
          pending: pendingCount,
        });

        const phoneMap: Record<string, DocumentData> = {};
        let rowId = 1;
        for (const item of filteredIssued) {
          if (!item.dids || Object.keys(item.dids).length === 0) continue;
          const didKeys = Object.keys(item.dids).sort((a, b) => {
            const certA = item.dids[a].CertiNo || "";
            const certB = item.dids[b].CertiNo || "";
            const numA = parseInt(certA.split("-")[1]) || 0;
            const numB = parseInt(certB.split("-")[1]) || 0;
            return numA - numB;
          });
          if (!phoneMap[item.phoneNumber]) {
            phoneMap[item.phoneNumber] = {
              id: rowId++,
              name: "",
              mobileNumber: item.phoneNumber,
              selectedCertificates: [],
              certificateOptions: [],
              showDropdown: false,
            };
          }
          const rowRef = phoneMap[item.phoneNumber];
          const nameSet = new Set(rowRef.name.split("\n").filter(Boolean));
          didKeys.forEach((didKey, idx) => {
            const didObj = item.dids[didKey];
            console.log("didObject", didObj);
            const fullName = `${
              didObj.name ||
              didObj.studentName ||
              didObj.data?.headName ||
              didObj.data?.name ||
              didObj.headName ||
              didObj.applicantName ||
              (Array.isArray(didObj.members) && didObj.members[0]?.name) ||
              "User Name"
            }`.trim();

            nameSet.add(fullName);
            const rawCertType =
              didObj.certificateType || `Certificate-${idx + 1}`;
            const certName = rawCertType
              .replace(/([a-z])([A-Z])/g, "$1 $2")
              .replace(/^./, (s) => s.toUpperCase());
            const alreadyInOptions = rowRef.certificateOptions.some(
              (opt) => opt.name === certName && opt.did === didKey
            );
            if (allowedList.includes(certName.toLowerCase())) {
              rowRef.certificateOptions.push({
                name: certName,
                did: didKey,
                date: didObj.createdAt,
              });
            }
          });
          rowRef.name = Array.from(nameSet).join("\n");
          if (rowRef.certificateOptions.length > 0) {
            rowRef.selectedCertificates = [rowRef.certificateOptions[0]];
          }
        }
        const transformedDocs = Object.values(phoneMap);
        // 2) now _also_ filter out any doc that doesn’t match the issuer:
        const issuer = localStorage.getItem("userEmail") || "";
        let finalDocs = transformedDocs;

        // Do this:
        const issuedDocs = finalDocs.filter((doc) =>
          allowedList.includes(doc.selectedCertificates[0].name.toLowerCase())
        );
        setDocuments(issuedDocs);

        // And now update your card:
        // replace certificateStats.issued.toString() with:
        issuedDocs.length.toString();
      } catch (error) {
        console.error("Error in fetchData:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleEDistrictDelete = async () => {
    if (!selectedPhoneNumber) return;

    try {
      const authToken = localStorage.getItem("authToken");
      const res = await fetch(`${apiIp}admin/rejectEDistrictData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          phoneNumber: selectedPhoneNumber,
          issueID: selectedIssueId,
        }),
      });

      if (!res.ok) throw new Error("Failed to delete certificate");

      const rejectedDoc = pendingDocuments.find(
        (doc) => doc.mobileNumber === selectedPhoneNumber
      );

      setPendingDocuments((prev) =>
        prev.filter((doc) => doc.mobileNumber !== selectedPhoneNumber)
      );

      if (rejectedDoc) {
        setRejectedDocuments((prev) => [...prev, rejectedDoc]);
      }

      setCertificateStats((prev) => ({
        ...prev,
        pending: prev.pending - 1,
      }));

      setDeleteModalVisible(false);
      setSelectedPhoneNumber(null);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete certificate");
    }
  };

  async function fetchRejectedDocuments(): Promise<DocumentData[]> {
    const loginToken = localStorage.getItem("authToken");
    const res = await fetch(`${apiIp}superAdmin/getEDistrictData`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${loginToken}`,
      },
    });

    const payload = await res.json();
    const prettify = (str: string | undefined | null) =>
      typeof str === "string"
        ? str
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/^./, (s) => s.toUpperCase())
        : "";

    return payload.data
      .filter((item: any) => item.status === "rejected")
      .map((item: any, idx: number) => {
        const certType = (item.certificateType || "").toLowerCase();

        const holderName =
          item.applicantName ||
          item.studentName ||
          item.name ||
          item.headName ||
          item.data?.headName ||
          item.data?.name ||
          "User Name";

        return {
          id: idx + 1,
          name: holderName,
          mobileNumber: item.phoneNumber || "",
          selectedCertificates: [
            {
              name: prettify(item.certificateType),
              did: item.did,
              date: item.dateOfIssue || item.createdAt,
            },
          ],
          certificateOptions: [
            {
              name: item.certificateType,
              did: item.did,
              date: item.dateOfIssue || item.createdAt,
            },
          ],
          showDropdown: false,
          fields: item.fields || {},
          members:
            Array.isArray(item.rows) && item.rows.length
              ? item.rows
              : item.members || [],
          issueID: item.issueID || "",
        };
      });
  }

  async function fetchPendingDocuments(): Promise<DocumentData[]> {
    const loginToken = localStorage.getItem("authToken");
    const res = await fetch(`${apiIp}superAdmin/getEDistrictData`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${loginToken}`,
      },
    });
    const payload = await res.json();

    return payload.data
      .filter((item: any) => item.status === "pending")
      .map((item: any, idx: number) => {
        const membersData =
          (Array.isArray(item.rows) && item.rows.length && item.rows) ||
          (Array.isArray(item.fields?.rows) &&
            item.fields.rows.length &&
            item.fields.rows) ||
          (Array.isArray(item.members) && item.members) ||
          [];

        const holderName =
          item.name ||
          item.studentName ||
          item.applicantName ||
          item.data?.headName ||
          item.data?.name ||
          membersData[0]?.name ||
          "User Name";

        return {
          id: idx + 1,
          name: holderName,
          mobileNumber: item.phoneNumber || "",
          selectedCertificates: [
            {
              name: item.certificateType,
              did: item.did,
              date: item.dateOfIssue || item.createdAt,
            },
          ],
          certificateOptions: [
            {
              name: item.certificateType,
              did: item.did,
              date: item.dateOfIssue || item.createdAt,
            },
          ],
          showDropdown: false,
          fields: item.fields || {},
          members: membersData,
          issueID: item.issueID || "",
        };
      });
  }

  useEffect(() => {
    if (rawDIDs.length === 0) return;

    // const pendingList = fetchPendingDocuments();
    // const pendingCount = pendingList.length;

    // setCertificateStats((prev) => ({
    //   ...prev,
    //   pending: pendingCount,
    //   total: prev.issued + pendingCount,
    // }));
  }, [rawDIDs]);

  const totalPages = Math.ceil(sortedDocs.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedDocs = sortedDocs.slice(startIndex, startIndex + PAGE_SIZE);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);
  }, []);
  const arr = [
    {
      heading: "Issued Documents",
      point: certificateStats.issued.toString(),
      icon: icon1,
      onClick: () => setActiveTab("issued"),
    },

    {
      heading: "Pending Documents",
      // point: certificateStats.pending.toString(),
      point: pendingDocuments.length.toString(),
      icon: icon2,
      onClick: async () => {
        setActiveTab("pending");
        const pendingList = await fetchPendingDocuments();
        setPendingDocuments(filterByAllowedCerts(pendingList));
      },
    },
    {
      heading: "Rejected Documents",
      point: rejectedDocuments.length.toString(),
      icon: rejectImage,
      onClick: async () => {
        setActiveTab("rejected");
        const rejectedList = await fetchRejectedDocuments();
        setRejectedDocuments(filterByAllowedCerts(rejectedList));
      },
    },
    {
      heading: "Expired Documents",
      point: expiredDocuments.length.toString(),
      icon: expiredImage,
      onClick: () => {
        setActiveTab("expired");
      },
    },
    {
      heading: "Revoked Documents",
      point: revokedDIDs.reduce(
        (sum, item) => sum + Object.keys(item.dids).length,
        0
      ),
      icon: revokedImage,
      onClick: () => {
        setActiveTab("revoked");
      },
    },

    {
      heading: "Total Documents",
      point: (documents.length + pendingDocuments.length).toString(),
      icon: icon,
      onClick: () => {
        setActiveTab("all");
        fetchPendingDocuments();
      },
    },
  ];

  const issuedCount = documents.length;
  const pendingCount = pendingDocuments.length;
  const rejectedCount = rejectedDocuments.length;
  const expiredCount = expiredDocuments.length;
  const revokedCount = revokedDIDs.reduce(
    (sum, item) => sum + Object.keys(item.dids).length,
    0
  );
  const totalCount = issuedCount + pendingCount;

  const prettify = (str: string): string =>
    str
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (s) => s.toUpperCase());

  const handleExpiredPreview = async (
    cert: DocumentData["selectedCertificates"][0],
    doc: DocumentData
  ) => {
    try {
      setPreviewLoading(true);

      const rawCertName = cert.name?.trim().toLowerCase() || "";
      const certTypeKey = CERT_TYPE_MAP[rawCertName];

      console.log("cert.name:", cert.name);
      console.log("normalizedCertName:", rawCertName);
      console.log("mapped certTypeKey:", certTypeKey);
      console.log("certificateParams keys:", Object.keys(certificateParams));

      if (!certTypeKey || !certificateParams[certTypeKey]) {
        console.warn(`⚠️ Missing certificateParams for type: ${rawCertName}`);
        alert(`Certificate configuration not found for: ${rawCertName}`);
        return;
      }

      const did = cert.did;
      const body: Record<string, any> = { did };
      const params = certificateParams[certTypeKey];
      console.log("params from certificateParams:", params);

      if (Array.isArray(params)) {
        params.forEach((field: string) => {
          if (doc.fields?.[field]) {
            body[field] = doc.fields[field];
          }
        });
      } else if (typeof params === "object") {
        if (Array.isArray(params.fields)) {
          params.fields.forEach((field: string) => {
            if (doc.fields?.[field]) {
              body[field] = doc.fields[field];
            }
          });
        }

        if (params.members && Array.isArray(doc.members)) {
          body.members = doc.members;
        }
      }

      console.log("🔧 Preview API Body:", body);

      const res = await fetch(
        `${apiIp}certificate/custom${certTypeKey}Certificate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to fetch preview");
      }

      const html = await res.text();
      setPreviewHTML(html);
      setShowPreviewModal(true);
    } catch (err) {
      console.error("❌ Preview error:", err);
      alert("Preview failed. Please check logs.");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-text">Dashboard</h1>
      <div className="card-wrapper">
        <div className="card-wrapper-inner">
          {arr.map((item, index) => (
            <div
              className={`document-container ${
                activeIndex === index ? "active-border" : ""
              }`}
              key={index}
              onClick={() => {
                setActiveIndex(index);
                setCurrentPage(1);
                if (item.onClick) item.onClick();
              }}
              // style={{ cursor: item.onClick ? "pointer" : "default" }}
            >
              <div className="text-content">
                <p className="text-heading">{item.heading}</p>
                <p className="text-point">{item.point}</p>
              </div>
              <Image src={item.icon} alt="icon" />
            </div>
          ))}
        </div>
        <div className="top-toolbar">
          <div className="left-buttons">
            <button
              className="filter-btn"
              onClick={(e) => {
                e.stopPropagation();
                setFilterDropdownOpen((prev) => !prev);
              }}
            >
              <HiOutlineBars3BottomLeft className="filter-bar-icon" /> Sort
            </button>
          </div>
          <div  className="search-container-dashboard">
          <div className="search-container">
            <LuSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <button
            className="download-report-btn"
            onClick={downloadReport}
            style={{ marginLeft: 16 }}
          >
            Download Report
          </button>
          </div>
         
          {filterDropdownOpen && (
            <div
              className="filter-dropdown"
              ref={filterDropdownRef}
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={sortOrder === "asc"}
                    onChange={() =>
                      setSortOrder(sortOrder === "asc" ? null : "asc")
                    }
                  />
                  Sort A–Z
                </label>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={sortOrder === "desc"}
                    onChange={() =>
                      setSortOrder(sortOrder === "desc" ? null : "desc")
                    }
                  />
                  Sort Z–A
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="table-main-container">
          <div className="table-container">
            {isLoading ? (
              <TableSkeleton />
            ) : (
              <table className="documents-table">
                <thead>
                  {activeTab === "rejected" ? (
                    <tr>
                      <th>S/N</th>
                      <th>Name of Holder</th>
                      <th>Mobile Number</th>
                      <th>Certificate Name</th>
                      <th>Status</th>
                    </tr>
                  ) : activeTab === "revoked" ? (
                    <tr>
                      <th>S/N</th>
                      <th>Doc Holder</th>
                      <th>Name of document</th>
                      <th>Mobile Number</th>
                      <th>Date of Revoke</th>
                    </tr>
                  ) : activeTab === "pending" ? (
                    <tr>
                      <th>S/N</th>
                      <th>Name of Holder</th>
                      <th>Mobile Number</th>

                      <th>Certificate Name</th>
                      <th>Action</th>
                      <th>Reject</th>
                    </tr>
                  ) : activeTab === "expired" ? (
                    <tr>
                      <th>S/N</th>
                      <th>Doc Holder</th>
                      <th>Name of document</th>
                      <th>Mobile Number</th>
                      <th>Expiry Date</th>
                      {/* <th>Action</th> */}
                    </tr>
                  ) : activeTab === "all" ? (
                    <tr>
                      <th>S/N</th>
                      <th>Name</th>
                      <th>Document Name</th>
                      <th>Mobile Number</th>
                      <th>DID</th>
                      <th>Status</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>S/N</th>
                      <th>Doc Holder</th>
                      <th>Name of document</th>
                      <th>Mobile Number</th>
                      {/* <th>DID No</th> */}
                      <th>Date of Issue</th>
                      <th>Action</th>
                    </tr>
                  )}
                </thead>

                <tbody>
                  {paginatedDocs.length > 0 ? (
                    paginatedDocs.map((doc, index) => {
                      const isIssued = documents.some(
                        (d) => d.mobileNumber === doc.mobileNumber
                      );
                      const status = documents.some(
                        (d) => d.mobileNumber === doc.mobileNumber
                      )
                        ? "Issued"
                        : "Pending";
                      const cert = doc.selectedCertificates[0];

                      return (
                        <tr key={doc.id} className="selected-row">
                          <td>{startIndex + index + 1}</td>

                          {activeTab === "rejected" ? (
                            <>
                              <td>{doc.name}</td>
                              <td>{doc.mobileNumber}</td>
                              <td>
                                {doc.selectedCertificates[0]?.name || "—"}
                              </td>
                              <td>
                                <span
                                  style={{
                                    color: "red",
                                    background: "#ffc7bf",
                                    fontWeight: "bold",
                                    padding: 5,
                                    borderRadius: 5,
                                  }}
                                >
                                  Rejected
                                </span>
                              </td>
                            </>
                          ) : activeTab === "revoked" ? (
                            <>
                              <td>{doc.name}</td>
                              <td>
                                {prettify(
                                  doc.selectedCertificates[0]?.name || "—"
                                )}
                              </td>
                              <td>{doc.mobileNumber}</td>
                              <td>
                                {doc.selectedCertificates[0]?.date
                                  ? formatDateToDDMMYYYY(
                                      doc.selectedCertificates[0].date
                                    )
                                  : "—"}
                              </td>
                            </>
                          ) : activeTab === "expired" ? (
                            <>
                              <td>{doc.name}</td>
                              <td>{prettify(cert?.name || "—")}</td>
                              <td>{doc.mobileNumber}</td>
                              <td>
                                {cert?.date
                                  ? formatDateToDDMMYYYY(cert.date)
                                  : "—"}
                              </td>
                              {/* <td>
                                <button
                                  onClick={() =>
                                    handleExpiredPreview(cert, doc)
                                  }
                                  className="preview-btn"
                                  style={{
                                    padding: "4px 10px",
                                    background: "#007bff",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                  }}
                                >
                                  {previewLoading ? "Loading..." : "Preview"}
                                </button>
                              </td> */}
                            </>
                          ) : activeTab === "pending" ? (
                            <>
                              <td>{doc.name}</td>
                              <td>{doc.mobileNumber}</td>
                              <td>{cert?.name || "—"}</td>
                              <td
                                style={{ color: "blue", cursor: "pointer" }}
                                onClick={() => {
                                  const params = new URLSearchParams();

                                  params.append(
                                    "phoneNumber",
                                    doc.mobileNumber
                                  );
                                  params.append("certificateType", cert.name);
                                  params.append(
                                    "members",
                                    JSON.stringify(doc.members)
                                  );
                                  params.append("source", "pending");

                                  if (
                                    !doc.issueID ||
                                    doc.issueID.trim() === ""
                                  ) {
                                    alert(
                                      "issueID is missing or empty. Cannot proceed."
                                    );
                                    return;
                                  }

                                  params.append("id", doc.issueID);
                                  params.append("readonly", "true");
                                  for (const [k, v] of Object.entries(
                                    doc.fields!
                                  )) {
                                    params.append(k, v);
                                  }

                                  doc.members?.forEach(
                                    (m: Member, i: number) => {
                                      Object.entries(m).forEach(
                                        ([key, val]) => {
                                          params.append(
                                            `member_${i}_${key}`,
                                            val !== undefined ? String(val) : ""
                                          );
                                        }
                                      );
                                    }
                                  );

                                  router.push(`/issued?${params.toString()}`);
                                }}
                              >
                                Issue
                              </td>
                              <td>
                                <Image
                                  src={revokeImage}
                                  alt="revoke"
                                  onClick={() => {
                                    setSelectedPhoneNumber(doc.mobileNumber);
                                    setSelectedIssueId(doc.issueID ?? null);

                                    setDeleteModalVisible(true);
                                  }}
                                  style={{
                                    cursor: "pointer",
                                    width: "30%",
                                    height: "14%",
                                  }}
                                />
                              </td>
                            </>
                          ) : activeTab === "all" ? (
                            <>
                              <td>{doc.name}</td>
                              <td>{cert?.name || "—"}</td>
                              <td>{doc.mobileNumber}</td>
                              <td>
                                {rawDIDs.find(
                                  (entry) =>
                                    entry.phoneNumber === doc.mobileNumber &&
                                    entry.dids?.hasOwnProperty(cert?.did || "")
                                )
                                  ? cert?.did
                                  : "—"}
                              </td>

                              <td>
                                <span
                                  style={{
                                    color: rawDIDs.find(
                                      (entry) =>
                                        entry.phoneNumber ===
                                          doc.mobileNumber &&
                                        entry.dids?.hasOwnProperty(
                                          cert?.did || ""
                                        )
                                    )
                                      ? "green"
                                      : "red",
                                    background: rawDIDs.find(
                                      (entry) =>
                                        entry.phoneNumber ===
                                          doc.mobileNumber &&
                                        entry.dids?.hasOwnProperty(
                                          cert?.did || ""
                                        )
                                    )
                                      ? "#c0ffbf"
                                      : "#ffc7bf",
                                    fontWeight: "bold",
                                    padding: 5,
                                    borderRadius: 5,
                                  }}
                                >
                                  {rawDIDs.find(
                                    (entry) =>
                                      entry.phoneNumber === doc.mobileNumber &&
                                      entry.dids?.hasOwnProperty(
                                        cert?.did || ""
                                      )
                                  )
                                    ? "Issued"
                                    : "Pending"}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td>
                                {Array.from(
                                  new Set(
                                    doc.selectedCertificates.map((cert) => {
                                      const selectedDID = rawDIDs.find(
                                        (p) =>
                                          p.phoneNumber === doc.mobileNumber
                                      )?.dids?.[cert.did];

                                      return selectedDID
                                        ? selectedDID.name ||
                                            selectedDID.studentName ||
                                            selectedDID.applicantName ||
                                            selectedDID.data?.headName ||
                                            selectedDID.data?.name ||
                                            selectedDID.headName ||
                                            (Array.isArray(
                                              selectedDID.members
                                            ) &&
                                              selectedDID.members[0]?.name) ||
                                            " User Name"
                                        : "";
                                    })
                                  )
                                ).map((uniqueName, idx) => (
                                  <div key={idx}>{uniqueName}</div>
                                ))}
                              </td>
                              <td>
                                <Link
                                  href={`/certificates?phone=${doc.mobileNumber}`}
                                  style={{
                                    textDecoration: "none",
                                    color: "#1E90FF",
                                  }}
                                  onClick={() => window.scrollTo(0, 0)}
                                >
                                  View Certificates
                                </Link>
                              </td>
                              <td>{doc.mobileNumber}</td>
                              <td>
                                {doc.selectedCertificates.map((cert, idx) => (
                                  <div key={idx}>
                                    {cert.date
                                      ? formatDateToDDMMYYYY(cert.date)
                                      : ""}
                                  </div>
                                ))}
                              </td>
                              <td>
                                {doc.selectedCertificates.map((cert, idx) => (
                                  <div key={idx} className="certificate-row">
                                    <button className="delete-btn">
                                      <Link
                                        href={`/certificates?phone=${doc.mobileNumber}`}
                                        className="delete-btn"
                                        style={{ textDecoration: "none" }}
                                        onClick={() => window.scrollTo(0, 0)}
                                      >
                                        {/* <RiDeleteBinLine /> */}
                                        {/* <Image
                                          src={revokeImage}
                                          alt="revoke"
                                          style={{
                                            cursor: "pointer",
                                            width: "80%",
                                            height: "80%",
                                          }}
                                        /> */}
                                        Revoke
                                      </Link>
                                    </button>
                                  </div>
                                ))}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <p className="no-data-cell">No data Available</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {!isLoading && paginatedDocs.length > 0 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
        {deleteModalVisible && (
          <div className="modal-overlay">
            <div className="modal-content">
              <p>Do you want to Reject?</p>
              <div className="modal-actions">
                <button
                  className="modal-btn cancel"
                  onClick={() => setDeleteModalVisible(false)}
                >
                  Cancel
                </button>
                <button
                  className="modal-btn yes"
                  onClick={handleEDistrictDelete}
                >
                  Yes
                </button>
              </div>
              {deleteLoading && (
                <div className="delete-loading-overlay">
                  <div className="loading-spinner"></div>
                </div>
              )}
            </div>
          </div>
        )}
        {showSuccessModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <p>Certificate Rejected successfully!</p>
              <div className="modal-actions">
                <button
                  className="modal-btn yes"
                  onClick={() => setShowSuccessModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        {showPreviewModal && (
          <div className="preview-modal">
            <div className="modal-content12">
              <span
                className="close-btn-pre"
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewHTML("");
                }}
              >
                &times;
              </span>
              <div
                className="certificate-preview-container"
                dangerouslySetInnerHTML={{ __html: previewHTML }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
