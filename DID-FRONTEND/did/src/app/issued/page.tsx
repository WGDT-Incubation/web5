"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import "./issued.css";
import { LuSearch } from "react-icons/lu";
import { RiArrowDropDownLine } from "react-icons/ri";
import { IoArrowDown, IoEye } from "react-icons/io5";
import { useSearchParams } from "next/navigation";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import Image from "next/image";
import successIcon from "../../../public/images/Success Mark.gif";
import loadIcon from "../../../public/images/Document files.gif";
import BulkRegister from "../BulkRegister/BulkRegister";
import { IoMdAdd } from "react-icons/io";

interface DIDMember {
  name: string;
}

interface DID {
  name: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  timeOfBirth: string;
  state: string;
  dateOfIssue: string;
  did: string;
  certificateType: string;
  phoneNumber: string;
  members: DIDMember[];
  CertiNo?: string;
  studentName?: string;
  applicantName?: string;
  createdAt?: string;
  headName?: string;
  issuedBy?: string;
  isRevoked?: string;
  data?: {
    headName?: string;
    [key: string]: any;
  };
}

interface AllDIDItem {
  phoneNumber: string;
  dids: { [key: string]: DID };
  owners: string[];
  createdAt: string;
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
  selectedCertificates: string[];
  didNumbers: string[];
  certificateOptions: { name: string; did: string; date: string }[];
  showDropdown: boolean;
}

interface StoredTemplateData {
  templateName: string;
  options: { value: string; label: string }[];
}
interface TabularSpec {
  fields: string[];
  members: string[];
}

type CertificateSpec = string[] | TabularSpec;

interface CertificateParams {
  [key: string]: CertificateSpec;
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

export default function IssuedPage() {
  const [certificateHTML, setCertificateHTML] = useState<string>("");

  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jwt, setJwt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState(false);
  const [previewHTML, setPreviewHTML] = useState<string>("");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [issueMessage, setIssueMessage] = useState<string>("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalType, setModalType] = useState<
    "confirm" | "success" | "error" | "none"
  >("none");
  const [modalMessage, setModalMessage] = useState<string>("");

  const [issueLoading, setIssueLoading] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>("");

  const [phoneInput, setPhoneInput] = useState<string>("");
  const [phoneNumberExist, setPhoneNumberExist] = useState<boolean>(false);
  const [showCertificateDropdown, setShowCertificateDropdown] = useState(false);

  const filterContainerRef = useRef<HTMLDivElement>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState<boolean>(false);
  const apiIp = process.env.NEXT_PUBLIC_API_URL;
  const searchParams = useSearchParams();
  const isReadonly = searchParams.get("readonly") === "true";
  const issueId = searchParams.get("id");
  const incomingCertificateType = searchParams.get("certificateType");
  const incomingPhone = searchParams.get("phoneNumber");
  const isFromPending = searchParams.get("source") === "pending";
  const [allStoredTemplates, setAllStoredTemplates] = useState<
    StoredTemplateData[]
  >([]);
  const [csvMismatchModalVisible, setCsvMismatchModalVisible] = useState(false);
  const [csvMismatchFields, setCsvMismatchFields] = useState<string[]>([]);

  const [templateSearch, setTemplateSearch] = useState<string>("");
  const [filteredTemplates, setFilteredTemplates] = useState<
    StoredTemplateData[]
  >([]);
  const [showTemplateDropdown, setShowTemplateDropdown] =
    useState<boolean>(false);
  const [templateDropdownExpanded, setTemplateDropdownExpanded] =
    useState<boolean>(false);
  const templateDropdownRef = useRef<HTMLDivElement>(null);

  const [rawDIDs, setRawDIDs] = useState<AllDIDItem[]>([]);

  const [filteredCertificateParams, setFilteredCertificateParams] =
    useState<CertificateParams>({});
  const [incomingCertFromQuery, setIncomingCertFromQuery] = useState<
    string | null
  >(null);

  const fields = searchParams.get("fields")?.split(",") || [];
  const [certificateParams, setCertificateParams] = useState<CertificateParams>(
    {}
  );
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(
    null
  );
  const [allowedCertificateTypes, setAllowedCertificateTypes] = useState<
    string[]
  >([]);

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
  const datePattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
  const [dateFieldErrors, setDateFieldErrors] = useState<
    Record<string, boolean>
  >({});
  const [userEmail, setUserEmail] = useState<string>("");
  useEffect(() => {
    setUserEmail(localStorage.getItem("userEmail") || "");
  }, []);

  const [tableRows, setTableRows] = useState<Record<string, string>[]>([]);
  useEffect(() => {
    const raw = localStorage.getItem("allowedCertificateTypes");
    if (raw) {
      try {
        setAllowedCertificateTypes(JSON.parse(raw));
      } catch {
        console.warn("Couldn't parse allowedCertificateTypes, clearing it.");
        localStorage.removeItem("allowedCertificateTypes");
      }
    }
  }, []);
  const allowedNorm = useMemo(() => {
    return new Set(
      allowedCertificateTypes.map((t) => t.toLowerCase().replace(/[\s-_]/g, ""))
    );
  }, [allowedCertificateTypes]);
  useEffect(() => {
    console.log("🔥 Incoming query parameters:");
    for (const [key, value] of Array.from(searchParams.entries())) {
      console.log(`  ${key} =`, value);
    }
  }, [searchParams]);
  useEffect(() => {
    const raw = searchParams.get("rows") ?? searchParams.get("members");
    if (!raw) return;

    try {
      const parsed: Record<string, string>[] = JSON.parse(raw);
      setTableRows(parsed);
    } catch (e) {
      console.warn("Invalid JSON for rows/members:", raw);
    }
  }, [searchParams]);
  const toISODate = (ddmmyy: string): string => {
    const [dd, mm, yyyy] = ddmmyy.split("-");
    return dd && mm && yyyy ? `${yyyy}-${mm}-${dd}` : "";
  };
  const fromISODate = (iso: string): string => {
    const [yyyy, mm, dd] = iso.split("-");
    return yyyy && mm && dd ? `${dd}-${mm}-${yyyy}` : "";
  };

  const addTableRow = () => {
    if (!selectedCertificate) return;
    const spec = certificateParams[selectedCertificate];
    if (typeof spec !== "object" || !("members" in spec)) return;
    const blank: Record<string, string> = spec.members.reduce(
      (acc, col) => ({ ...acc, [col]: "" }),
      {}
    );
    setTableRows((rs) => [...rs, blank]);
  };
  const removeTableRow = (idx: number) =>
    setTableRows((rs) => rs.filter((_, i) => i !== idx));
  const handleTableInputChange = (
    rowIdx: number,
    col: string,
    value: string
  ) => {
    setTableRows((rs) =>
      rs.map((r, i) => (i === rowIdx ? { ...r, [col]: value } : r))
    );
  };
  useEffect(() => {
    if (
      selectedCertificate &&
      certificateParams[selectedCertificate] &&
      typeof certificateParams[selectedCertificate] === "object" &&
      "members" in certificateParams[selectedCertificate]
    ) {
      // only seed if empty
      if (tableRows.length === 0) addTableRow();
    }
  }, [selectedCertificate]);

  useEffect(() => {
    if (!Object.keys(certificateParams).length || !incomingCertificateType)
      return;

    const raw = incomingCertificateType;
    const normalized = raw.toLowerCase().replace(/[\s-_]/g, "");
    const certKey = Object.keys(certificateParams).find(
      (k) => k.toLowerCase().replace(/[\s-_]/g, "") === normalized
    );
    if (!certKey) return;

    setSelectedCertificate(certKey);

    const initialData: Record<string, string> = {};
    for (const [k, v] of Array.from(searchParams.entries())) {
      if (
        [
          "source",
          "certificateType",
          "phoneNumber",
          "did",
          "date",
          "id",
        ].includes(k)
      )
        continue;
      initialData[k] = v;
    }
    setFormData(initialData);
    setPhoneInput(incomingPhone || "");

    const spec = certificateParams[certKey];
    if (typeof spec === "object" && "members" in spec) {
      const members: Record<string, string>[] = [];
      for (const [k, v] of Array.from(searchParams.entries())) {
        const m = k.match(/^member_(\d+)_(.+)$/);
        if (!m) continue;
        const idx = Number(m[1]),
          field = m[2];
        members[idx] ??= {};
        members[idx][field] = v;
      }
    }
  }, [searchParams, certificateParams, incomingCertificateType]);

  const isDateField = (field: string) =>
    ["date", "dateOfBirth", "dateOfIssue"].some((f) =>
      field.toLowerCase().includes(f.toLowerCase())
    );

  useEffect(() => {
    const department = localStorage.getItem("issuerDepartment");
    const authToken = localStorage.getItem("authToken");

    if (!department || !authToken) return;

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}admin/getDepartmentCertificateTypes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ department }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.certificateTypes)) {
          setAllowedCertificateTypes(
            data.certificateTypes.map((type: string) => type.toLowerCase())
          );
        }
      })
      .catch((err) => console.error("Failed to fetch allowed types:", err));
  }, []);
  const mapTitleToType = (title: string): string => {
    return title.replace(/\s+/g, "").replace(/^./, (c) => c.toLowerCase());
    // "Birth certificate" => "birthCertificate"
  };

  const defaultMember: Record<string, string> =
    certificateParams.familyCertificate
      ? (
          certificateParams.familyCertificate as {
            fields: string[];
            members: string[];
          }
        ).members.reduce((acc, m) => ({ ...acc, [m]: "" }), {})
      : {};

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };
  const validateDate = (date: string): boolean => {
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    return dateRegex.test(date);
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhoneInput(value);
  };
  const formatDateToDDMMYYYY = (dateStr: string): string => {
    const date = new Date(dateStr);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  async function fetchPendingFromApi() {
    const loginToken = localStorage.getItem("authToken");
    const res = await fetch(`${apiIp}superAdmin/getEDistrictData`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${loginToken}`,
      },
    });
    if (!res.ok) throw new Error("Failed to load pending data");
    const payload = await res.json();
    return payload.data as Array<{
      fields: Record<string, string>;
      phoneNumber: string;
      certificateType: string;
      did: string;
      dateOfIssue: string;
      members?: DIDMember[];
    }>;
  }

  useEffect(() => {
    async function loadParams() {
      try {
        const res = await fetch(`${apiIp}certificate/getAllCertificates`);
        const json = await res.json();

        console.log("getAllCertificates response:", json);
        console.log("certificate param", json.data);
        const certParamMap: CertificateParams = {};
        json.data.forEach((item: any) => {
          if (item.tableParams?.length) {
            certParamMap[item.name] = {
              fields: item.params,
              members: item.tableParams,
            };
          } else {
            certParamMap[item.name] = item.params;
          }
        });

        setCertificateParams(certParamMap);
      } catch (e) {
        console.error("Error fetching cert params:", e);
      }
    }

    async function loadAllowedTypes() {
      const department = localStorage.getItem("issuerDepartment");
      const authToken = localStorage.getItem("authToken");
      if (!department || !authToken) return;

      try {
        const res = await fetch(`${apiIp}admin/getDepartmentCertificateTypes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ department }),
        });
        const data = await res.json();
        if (Array.isArray(data.certificateTypes)) {
          const allowed = data.certificateTypes.map((type: string) =>
            type.toLowerCase()
          );
          setAllowedCertificateTypes(allowed);
        }
      } catch (err) {
        console.error("Failed to fetch allowed types:", err);
      }
    }

    loadParams();
    loadAllowedTypes();
  }, []);

  useEffect(() => {
    if (
      Object.keys(certificateParams).length > 0 &&
      allowedCertificateTypes.length > 0
    ) {
      const normalize = (str: string) =>
        str.toLowerCase().replace(/[\s-_]/g, "");

      const allowedSet = new Set(
        allowedCertificateTypes.map((type) => normalize(type))
      );

      const filtered: CertificateParams = {};

      for (const certKey of Object.keys(certificateParams)) {
        if (allowedSet.has(normalize(certKey))) {
          filtered[certKey] = certificateParams[certKey];
        }
      }

      if (certificateParams["familyCertificate"]) {
        filtered["familyCertificate"] = certificateParams["familyCertificate"];
      }

      console.log("Filtered certs →", filtered);
      setFilteredCertificateParams(filtered);
    }
  }, [certificateParams, allowedCertificateTypes]);

  useEffect(() => {
    if (incomingCertificateType) {
      setIncomingCertFromQuery(incomingCertificateType);
      console.log("Set incomingCertFromQuery:", incomingCertificateType);
    }
  }, [incomingCertificateType]);

  useEffect(() => {
    if (!incomingCertFromQuery || !Object.keys(certificateParams).length) {
      return;
    }

    const normalize = (s: string) => s.toLowerCase().replace(/[\s-_]/g, "");
    const matchedKey = Object.keys(certificateParams).find(
      (key) => normalize(key) === normalize(incomingCertFromQuery!)
    );
    if (!matchedKey) return;

    setSelectedCertificate(matchedKey);

    // --- FAMILY CERTIFICATES: we already handle members there ---
    if (matchedKey === "familyCertificate") {
      // …existing familyCertificate code…
      return;
    }

    const spec = certificateParams[matchedKey];
    let fieldList: string[] = [];
    if (Array.isArray(spec)) {
      fieldList = spec;
    } else if (spec && Array.isArray((spec as any).fields)) {
      fieldList = (spec as any).fields;
    }

    // build formData off any scalar fields
    const initialFormData = fieldList.reduce(
      (acc, field) => ({
        ...acc,
        [field]: searchParams.get(field) || "",
      }),
      {} as Record<string, string>
    );
    setFormData(initialFormData);

    const rawRows = searchParams.get("rows");
    if (rawRows) {
      try {
        const parsed: Record<string, string>[] = JSON.parse(rawRows);
        setTableRows(parsed);
      } catch (err) {
        console.warn("Invalid JSON in rows param:", rawRows);
      }
    }
  }, [incomingCertFromQuery, certificateParams, searchParams]);

  useEffect(() => {
    if (!incomingPhone || !selectedCertificate) return;

    (async () => {
      try {
        const pending = await fetchPendingFromApi();

        const wantedType = incomingCertificateType!
          .toLowerCase()
          .replace(/[\s-_]/g, "");

        const entry = pending.find(
          (item) =>
            item.phoneNumber === incomingPhone &&
            item.certificateType.toLowerCase().replace(/[\s-_]/g, "") ===
              wantedType
        );

        if (!entry) return;

        const rawParam = certificateParams[selectedCertificate]!;
        const fieldsList: string[] = Array.isArray(rawParam)
          ? rawParam
          : rawParam.fields;

        const filledData = fieldsList.reduce((acc, field) => {
          acc[field] =
            (entry as any).fields?.[field] ?? (entry as any)[field] ?? "";
          return acc;
        }, {} as Record<string, string>);

        setFormData(filledData);
        setPhoneInput(entry.phoneNumber);
      } catch (err) {
        console.error("Error loading pending entry:", err);
      }
    })();
  }, [incomingPhone, selectedCertificate, certificateParams]);

  useEffect(() => {
    const exists = rawDIDs.some((item) => item.phoneNumber === phoneInput);
    setPhoneNumberExist(exists);
  }, [phoneInput, rawDIDs]);
  const fetchData = async () => {
    setIsLoading(true);
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
      if (!loginRes.ok) throw new Error("Admin login failed");
      const loginData = await loginRes.json();
      const token = loginData.token;
      setJwt(token);

      const didRes = await fetch(`${apiIp}admin/getAllDIDs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!didRes.ok) throw new Error("Failed to fetch DIDs");
      const allDIDs: AllDIDItem[] = (await didRes.json()).response.allDIDs;
      const filteredAllDIDs = allDIDs
        .map((item) => {
          const filteredDIDs = Object.entries(item.dids).filter(([_, did]) => {
            // 1) not revoked
            if (did.isRevoked) return false;
            // 2) type is in our allowed list:
            const key = did.certificateType
              .toLowerCase()
              .replace(/[\s-_]/g, "");
            return allowedNorm.has(key);
          });
          return {
            ...item,
            dids: Object.fromEntries(filteredDIDs),
          };
        })
        // only keep phones that still have some DIDs left
        .filter((item) => Object.keys(item.dids).length > 0);

      setRawDIDs(filteredAllDIDs);

      const phoneMap: Record<string, DocumentData> = {};
      let rowId = 1;

      for (const item of filteredAllDIDs) {
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
            didNumbers: [],
            certificateOptions: [],
            showDropdown: false,
          };
        }
        const row = phoneMap[item.phoneNumber];
        const nameSet = new Set(row.name.split("\n").filter(Boolean));

        didKeys.forEach((didKey, idx) => {
          const didObj = item.dids[didKey];

          const fullName = `${
            didObj.name ||
            didObj.studentName ||
            didObj.applicantName ||
            didObj.data?.name ||
            didObj.data?.headName ||
            didObj.headName ||
            ""
          } `.trim();

          nameSet.add(fullName);
          if (!row.didNumbers.includes(didKey)) {
            row.didNumbers.push(didKey);
          }
          const certName =
            didObj.CertiNo ||
            didObj.certificateType ||
            `Certificate-${idx + 1}`;
          if (!row.selectedCertificates.includes(certName)) {
            row.selectedCertificates.push(certName);
          }

          const certDate = didObj.createdAt ?? "";

          if (
            !row.certificateOptions.some(
              (opt) => opt.name === certName && opt.did === didKey
            )
          ) {
            row.certificateOptions.push({
              name: certName,
              did: didKey,
              date: certDate,
            });
          }
        });

        row.name = Array.from(nameSet).join("\n");
      }

      const transformedDocs = Object.values(phoneMap);
      transformedDocs.sort((a, b) => {
        const dateA = new Date(a.certificateOptions[0].date).getTime();
        const dateB = new Date(b.certificateOptions[0].date).getTime();
        return dateB - dateA;
      });
      setDocuments(transformedDocs);
    } catch (error) {
      console.error("Error in fetchData:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userEmail) return;
    fetchData();
  }, [userEmail]);

  useEffect(() => {
    setFilteredTemplates(
      templateSearch
        ? allStoredTemplates.filter((t) =>
            t.templateName.toLowerCase().includes(templateSearch.toLowerCase())
          )
        : allStoredTemplates
    );
  }, [templateSearch, allStoredTemplates]);

  const q = searchQuery.toLowerCase();
  const filteredDocs = documents.filter((doc) => {
    if (doc.name.toLowerCase().includes(q)) return true;
    if (doc.mobileNumber.includes(q)) return true;
    if (doc.didNumbers.some((did) => did.toLowerCase().includes(q)))
      return true;

    return doc.certificateOptions.some((opt) =>
      opt.name.toLowerCase().includes(q)
    );
  });

  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(filteredDocs.length / PAGE_SIZE);
  const startIndexVal = (currentPage - 1) * PAGE_SIZE;
  const paginatedDocs = filteredDocs.slice(
    startIndexVal,
    startIndexVal + PAGE_SIZE
  );
  formData["did"] = "1234567";
  const handlePreview = async () => {
    if (!validatePhoneNumber(phoneInput)) {
      setPhoneNumberError("Phone number must be exactly 10 digits");
      return;
    }
    if (!selectedCertificate) {
      console.error("No certificate selected for preview");
      return;
    }

    const endpoint = `${apiIp}certificate/getCustomCertificate`;

    try {
      const response = await fetch(
        `${apiIp}certificate/getAllCertificatesParams`
      );
      const certTemplates = await response.json();
      console.log("certTemplates===>>>", certTemplates);

      if (!certTemplates.data || !Array.isArray(certTemplates.data)) {
        console.error("Invalid templates data");
        return;
      }

      const matchedTemplate = certTemplates.data.find(
        (tpl: any) =>
          tpl.name.toLowerCase().replace(/\s+/g, "") ===
          selectedCertificate.toLowerCase().replace(/\s+/g, "")
      );
      console.log("tableRows===>>>", tableRows);
      console.log("matchedTemplate===>>>", matchedTemplate);
      setTemplateId(matchedTemplate?.id);

      if (!matchedTemplate) {
        console.error("No matching certificate template found");
        return;
      }
      const dynamicRow: Record<string, string> = {};
      matchedTemplate.dynamicKeys.forEach((key: { param: string }) => {
        const val = formData[key.param] || "";
        dynamicRow[key.param] = val;
      });

      const payload = {
        id: matchedTemplate.id,
        ...formData,
        rows: tableRows,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Failed to fetch certificate preview");
        return;
      }

      const result = await res.json();
      if (result.data) {
        setPreviewHTML(result.data);
        setShowPreview(true);
      } else {
        console.error("No HTML data returned in response");
      }
    } catch (error) {
      console.error("Error in handlePreview:", error);
    }
  };

  const issueCertificateAction = async () => {
    setIssueLoading(true);
    try {
      const authToken = localStorage.getItem("authToken");
      const loginRes = await fetch(`${apiIp}admin/adminLogin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });
      if (!loginRes.ok) throw new Error("Admin login failed");
      const { token } = await loginRes.json();
      setJwt(token);

      const didRes = await fetch(`${apiIp}admin/getAllDIDs`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const allDIDs = (await didRes.json()).response.allDIDs;
      const phoneExists = allDIDs.some(
        (i: any) => i.phoneNumber === phoneInput
      );

      // if (!phoneExists) {
      //   const regRes = await fetch(`${apiIp}admin/registerUser`, {
      //     method: "POST",
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({ id: phoneInput }),
      //   });
      //   if (!regRes.ok) throw new Error("Register user failed");
      // }

      const { did, ...sanitizedFormData } = formData;
      const expiredAt = new Date();
      expiredAt.setFullYear(expiredAt.getFullYear() + 1);

      const dataObj: Record<string, any> = {
        certificateType: selectedCertificate,
        templateId: templateId,
        ...sanitizedFormData,
        // did: formData.did,
        rows: tableRows,
        expiredAt: expiredAt.toISOString(),
      };

      const endpoint = phoneExists
        ? `${apiIp}admin/addDID`
        : `${apiIp}admin/registerSingleDID`;

      let success = false;
      const loggedEmail = localStorage.getItem("userEmail");
      for (let attempt = 0; attempt < 10 && !success; attempt++) {
        try {
          const issueRes = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phoneNumber: phoneInput,
              data: dataObj,
              email: loggedEmail,
            }),
          });

          if (!issueRes.ok) {
            const errorText = await issueRes.text();

            if (
              errorText.includes("An active certificate of type") &&
              errorText.includes("already exists")
            ) {
              // alert(
              //   "A certificate of this type already exists for this user. Please revoke it before issuing a new one."
              // );
              setIssueLoading(false);
              setModalType("error");
              setModalMessage(
                "A certificate of this type already exists for this user. Please revoke it before issuing a new one."
              );
              setModalVisible(true);
              break;
            }

            throw new Error(errorText);
          }

          success = true;
          if (isFromPending) {
            await fetch(`${apiIp}admin/updateEDistrictData`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                phoneNumber: phoneInput,
                issueID: issueId,
              }),
            });
            await fetch(`${apiIp}admin/updateEDistrictCronData`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                mobileNumber: phoneInput,
                certificateName: selectedCertificate,
              }),
            });
          }

          setModalType("success");
          setModalMessage("Certificate issued successfully!");
          setShowPreview(false);
          setFormData({});
          setSelectedCertificate(null);

          setPhoneInput("");
          await fetchData();
        } catch (err: any) {
          console.error(`Attempt ${attempt + 1} failed:`, err);
          if (attempt === 9) {
            setModalType("error");
            setModalMessage("Server error—please try again later.");
          }
        } finally {
          if (success || attempt === 9) {
            setIssueLoading(false);
            setModalVisible(true);
          }
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setModalType("error");
      setModalMessage("Unexpected error—please try again.");
      setIssueLoading(false);
      setModalVisible(true);
    }
  };

  const handleModalYes = async () => {
    setModalVisible(false);
    await issueCertificateAction();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        templateDropdownRef.current &&
        !templateDropdownRef.current.contains(event.target as Node)
      ) {
        setTemplateDropdownExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleModalCancel = () => {
    setModalVisible(false);
    setModalType("none");
  };
  const formatCertificateLabel = (value: string) => {
    return value
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterContainerRef.current &&
        !filterContainerRef.current.contains(event.target as Node)
      ) {
        setFilterDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isDateField = name.toLowerCase().includes("date");

    if (isDateField && /[^0-9-]/.test(value)) return;

    if (isDateField) {
      const datePattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
      setDateFieldErrors((prev) => ({
        ...prev,
        [name]: value === "" ? false : !datePattern.test(value),
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowCertificateDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (
      !file ||
      !selectedCertificate ||
      !certificateParams[selectedCertificate]
    )
      return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result: Papa.ParseResult<any>) => {
        const rows = result.data;
        const param = certificateParams[selectedCertificate];
        const currentFields = Array.isArray(param) ? param : param.fields || [];
        const memberFields =
          !Array.isArray(param) && param.members ? param.members : [];

        const normalizedCurrentFields = currentFields.map((f) =>
          f.toLowerCase()
        );
        const normalizedMemberFields = memberFields.map((f) => f.toLowerCase());

        const fieldAliases: Record<string, string> = {
          mobileNumber: "phoneNumber",
          mobile: "phoneNumber",
          surname: "surname",
          name: "name",
          dob: "dateOfBirth",
          date: "dateOfBirth",
        };

        const firstRow = rows[0];
        const updatedFormData: Record<string, string> = {};
        const updatedMembersData: Record<string, string>[] = [];

        const unknownFields: string[] = [];

        for (const key in firstRow) {
          const val = String(firstRow[key] ?? "").trim();

          const normalize = (str: string) =>
            str.toLowerCase().replace(/[^a-z]/g, "");

          const normalizedKey = normalize(key);
          console.log("Parsed fields:", Object.keys(firstRow));
          console.log("Expected fields:", normalizedCurrentFields);

          const isMainField = normalizedCurrentFields.includes(normalizedKey);
          const isMemberField = normalizedMemberFields.includes(normalizedKey);
          if (
            !isMainField &&
            !isMemberField &&
            !["phonenumber", "mobilenumber", "certificatetype"].includes(
              normalizedKey
            )
          ) {
            unknownFields.push(key);
          }

          const finalKey =
            currentFields.find((f) => f.toLowerCase() === normalizedKey) ||
            fieldAliases[normalizedKey] ||
            key;

          if (memberFields.includes(finalKey)) {
            if (!updatedMembersData[0]) updatedMembersData[0] = {};
            updatedMembersData[0][finalKey] = val;
          } else {
            updatedFormData[finalKey] = val;
          }
        }

        if (unknownFields.length > 0) {
          setCsvMismatchFields(unknownFields);
          setCsvMismatchModalVisible(true);
          return;
        }

        setFormData((prev) => ({ ...prev, ...updatedFormData }));
        setPhoneInput(
          updatedFormData["phoneNumber"] ||
            updatedFormData["mobileNumber"] ||
            updatedFormData["mobile"] ||
            ""
        );
      },
      error: (err: Error) => {
        alert("Failed to parse CSV file.");
      },
    });
  };

  function humanizeCamelCase(str: string): string {
    return str

      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (match) => match.toUpperCase());
  }

  const handleDownloadTemplateCSV = () => {
    if (!selectedCertificate) {
      alert("Please select a certificate type.");
      return;
    }

    const raw = filteredCertificateParams[selectedCertificate];
    if (!raw) {
      alert("No template parameters available for that certificate.");
      return;
    }

    const isFamily = selectedCertificate === "familyCertificate";
    const fieldsList = Array.isArray(raw) ? raw : raw.fields;
    const memberFields = !Array.isArray(raw) && raw.members ? raw.members : [];

    const mainFields = fieldsList.filter((f: string) => f !== "did");
    const csvHeaders = ["certificateType", "mobileNumber", ...mainFields];

    if (isFamily && memberFields.length > 0) {
      memberFields.forEach((mf) => {
        csvHeaders.push(`member_0_${mf}`);
      });
    }

    const csv = Papa.unparse({ fields: csvHeaders, data: [] });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${selectedCertificate}_template.csv`);
  };

  return (
    <div className="issued-container">
      <div className="bulk-container-top">
        <h1 className="issued-text">Issue Certificate</h1>
        <button
          onClick={() => {
            setSelectedCertificate(null);
            setFormData({});

            setShowModal(true);
          }}
          className="bulk-uplod-btn"
        >
          <IoMdAdd /> Bulk Upload
        </button>
      </div>

      <div className="template-dropdown-wrapper" ref={dropdownRef}>
        <div
          className="dropdown-toggle"
          onClick={() => setShowCertificateDropdown((prev) => !prev)}
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            background: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
            userSelect: "none",
          }}
        >
          {selectedCertificate
            ? formatCertificateLabel(selectedCertificate)
            : "Choose Certificate"}
          <RiArrowDropDownLine className="line-svg" size={22} />
        </div>

        {showCertificateDropdown && (
          <div className="checkbox-group">
            {Object.keys(filteredCertificateParams).map((certName) => (
              <label key={certName}>
                <input
                  type="checkbox"
                  value={certName}
                  checked={selectedCertificate === certName}
                  onChange={() => {
                    setSelectedCertificate(certName);
                    setShowCertificateDropdown(false);

                    const selectedParam = certificateParams[certName];

                    if (Array.isArray(selectedParam)) {
                      const initialFormData = selectedParam.reduce(
                        (acc: Record<string, string>, field) => ({
                          ...acc,
                          [field]: "",
                        }),
                        {}
                      );
                      setFormData(initialFormData);
                    }

                    if (
                      selectedParam &&
                      typeof selectedParam === "object" &&
                      "fields" in selectedParam
                    ) {
                      const initialFormData = selectedParam.fields.reduce(
                        (acc: Record<string, string>, field) => ({
                          ...acc,
                          [field]: "",
                        }),
                        {}
                      );
                      setFormData(initialFormData);

                      if (certName === "familyCertificate") {
                        const initialFormData = selectedParam.fields.reduce(
                          (acc: Record<string, string>, field) => ({
                            ...acc,
                            [field]: "",
                          }),
                          {}
                        );
                        setFormData(initialFormData);

                        const blankMember = selectedParam.members.reduce(
                          (mAcc: Record<string, string>, mField) => ({
                            ...mAcc,
                            [mField]: "",
                          }),
                          {}
                        );
                      }
                    }
                  }}
                  disabled={isReadonly}
                />
                {formatCertificateLabel(certName)}
              </label>
            ))}
          </div>
        )}
      </div>

      <div
        className="issued-credential-main-container"
        style={{ display: "flex", gap: "20px", alignItems: "end" }}
      >
        <div className="issued-credential-container  mobile-number">
          <label>Mobile Number</label>
          <input
            type="text"
            placeholder="Enter your mobile number"
            value={phoneInput}
            onChange={handlePhoneInputChange}
            required
            className={`search-input-credential ${
              !validatePhoneNumber(phoneInput) && phoneInput.length > 0
                ? "invalid-phone"
                : ""
            }`}
            disabled={isReadonly}
            readOnly={isReadonly}
          />
        </div>

        {selectedCertificate && certificateParams[selectedCertificate] ? (
          Array.isArray(certificateParams[selectedCertificate]) ? (
            (certificateParams[selectedCertificate] as string[])
              .filter((f) => f !== "did")
              .map((fld) => {
                const val = formData[fld] || "";
                const isDate = fld.toLowerCase().includes("date");
                return (
                  <div key={fld} className="issued-credential-container">
                    <label>{formatCertificateLabel(fld)}</label>
                    {isDate ? (
                      <input
                        type="date"
                        name={fld}
                        className={`search-input-credential ${
                          dateFieldErrors[fld] ? "invalid-border" : ""
                        }`}
                        value={toISODate(val)}
                        onChange={(e) =>
                          handleInputChange({
                            ...e,
                            target: {
                              name: fld,
                              value: fromISODate(e.target.value),
                            },
                          } as any)
                        }
                        disabled={isReadonly}
                      />
                    ) : (
                      <input
                        type="text"
                        name={fld}
                        placeholder={`Enter ${formatCertificateLabel(fld)}`}
                        className="search-input-credential"
                        value={val}
                        onChange={handleInputChange}
                        readOnly={isReadonly}
                      />
                    )}
                  </div>
                );
              })
          ) : (
            // Tabular spec (fields + members columns)
            <>
              {(certificateParams[selectedCertificate] as TabularSpec).fields
                .filter((f) => f !== "did")
                .map((field) => {
                  const val = formData[field] || "";
                  const isDate = field.toLowerCase().includes("date");
                  return (
                    <div key={field} className="issued-credential-container">
                      <label>{formatCertificateLabel(field)}</label>
                      {isDate ? (
                        <input
                          type="date"
                          name={field}
                          value={toISODate(val)}
                          onChange={(e) =>
                            handleInputChange({
                              target: {
                                name: field,
                                value: fromISODate(e.target.value),
                              },
                            } as any)
                          }
                          className="search-input-credential"
                          disabled={isReadonly}
                        />
                      ) : (
                        <input
                          type="text"
                          name={field}
                          value={val}
                          onChange={handleInputChange}
                          className="search-input-credential"
                          readOnly={isReadonly}
                        />
                      )}
                    </div>
                  );
                })}

              <div className="table-params-section">
                <h3>Additional Details</h3>
                {tableRows.map((row, rowIdx) => (
                  <div key={rowIdx} className="table-row1">
                    {(
                      certificateParams[selectedCertificate] as TabularSpec
                    ).members.map((col) => {
                      const rawVal = row[col] ?? "";
                      const isDateCol = col.toLowerCase().includes("date");
                      const isMobileCol = col.toLowerCase().includes("mobile");
                      const isBoolCol = col.toLowerCase().includes("disable");

                      const toInputDate = (ddmmyyyy: string) => {
                        const [dd, mm, yyyy] = ddmmyyyy.split("-");
                        return dd && mm && yyyy ? `${yyyy}-${mm}-${dd}` : "";
                      };

                      const handleChange = (value: string) => {
                        let v = value;
                        if (isDateCol) {
                          const [yyyy, mm, dd] = v.split("-");
                          v = dd && mm && yyyy ? `${dd}-${mm}-${yyyy}` : "";
                        }
                        if (isMobileCol) {
                          v = v.replace(/\D/g, "").slice(0, 10);
                        }
                        handleTableInputChange(rowIdx, col, v);
                      };

                      return (
                        <div key={col} className="issued-credential-container">
                          <label>{formatCertificateLabel(col)}</label>

                          {isBoolCol ? (
                            <select
                              value={rawVal}
                              onChange={(e) => handleChange(e.target.value)}
                              disabled={isReadonly}
                              className="search-input-credential"
                            >
                              <option value="Y">Yes</option>
                              <option value="N">No</option>
                            </select>
                          ) : isDateCol ? (
                            <input
                              type="date"
                              value={toInputDate(rawVal)}
                              onChange={(e) => handleChange(e.target.value)}
                              className={
                                !datePattern.test(rawVal) && rawVal
                                  ? "invalid-border"
                                  : ""
                              }
                              disabled={isReadonly}
                            />
                          ) : (
                            <input
                              type={isMobileCol ? "tel" : "text"}
                              pattern={isMobileCol ? "[0-9]{10}" : undefined}
                              maxLength={isMobileCol ? 10 : undefined}
                              value={rawVal}
                              onChange={(e) => handleChange(e.target.value)}
                              className={
                                isMobileCol && rawVal.length < 10
                                  ? "invalid-phone"
                                  : ""
                              }
                              disabled={isReadonly}
                            />
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      className="csv-upload-label"
                      onClick={() => removeTableRow(rowIdx)}
                    >
                      Remove Row
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="csv-upload-label"
                  onClick={addTableRow}
                >
                  Add Row
                </button>
              </div>
            </>
          )
        ) : null}

        <button className="preview-btn" onClick={handlePreview}>
          <IoEye className="eye-icon" />
          Preview Your Template
        </button>

        {selectedCertificate && (
          <>
            <label htmlFor="csv-upload" className="csv-upload-label">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              id="csv-upload"
              onChange={handleCSVImport}
              className="csv-upload-btn"
            />
            <button
              className="button-secondary"
              onClick={handleDownloadTemplateCSV}
              // disabled={!selectedCertificate}
            >
              Export Template CSV
            </button>
          </>
        )}
      </div>

      {showPreview ? (
        <div className="preview-section">
          <div className="preview-header">
            <button className="back-btn" onClick={() => setShowPreview(false)}>
              Back
            </button>
            <button
              className="issue-certificate-btn"
              onClick={() => {
                setModalType("confirm");
                setModalMessage("Do you want to issue this certificate?");
                setModalVisible(true);
              }}
            >
              Issue Certificate
            </button>
          </div>
          <h2>Preview</h2>
          {showPreview && (
            <div
              className="certificate-preview-wrapper"
              style={{ marginTop: "2rem" }}
            >
              {/* If previewHTML exists, render as inner HTML */}
              {previewHTML ? (
                <div
                  className="certificate-preview-container"
                  dangerouslySetInnerHTML={{ __html: previewHTML }}
                  style={{
                    padding: "1rem",
                    border: "1px solid #ccc",
                    background: "#f9f9f9",
                    borderRadius: "6px",
                  }}
                />
              ) : certificateHTML ? (
                // If certificateHTML exists, render as iframe
                <iframe
                  srcDoc={certificateHTML}
                  style={{
                    width: "100%",
                    height: "90vh",
                    border: "2px solid #000",
                    borderRadius: "6px",
                  }}
                  sandbox=""
                />
              ) : (
                // Optional: fallback UI
                <p style={{ color: "#555" }}>No preview available.</p>
              )}
            </div>
          )}

          {issueMessage && <p className="issue-message">{issueMessage}</p>}
          {issueLoading && (
            <div className="loading-overlay">
              {/* <div className="loading-spinner"></div> */}
              <Image
                src={loadIcon}
                alt="Success"
                width={180}
                height={180}
                color={"#c1272c"}
                className="success-icon-image"
              />
              <div className="loading-message">
                <p>Please wait...</p>
                <p>Issuing your certificate</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="top-toolbar">
            <div
              className="filter-container"
              ref={filterContainerRef}
              onClick={(e) => e.stopPropagation()}
            >
              {/* <div className="left-buttons">
                <button
                  className="filter-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterDropdownOpen((prev) => !prev);
                  }}
                >
                  <HiOutlineBars3BottomLeft className="filter-bar-icon" />{" "}
                  Filters
                </button>
              </div>
              {filterDropdownOpen && (
                <div className="filter-dropdown">
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
              )} */}
            </div>

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
          </div>

          <div className="table-main-container">
            <div className="table-container">
              {isLoading ? (
                <TableSkeleton />
              ) : (
                <table className="documents-table">
                  <thead>
                    <tr>
                      <th>
                        S/N <IoArrowDown className="down-icon" />
                      </th>
                      <th>
                        Doc Holder <IoArrowDown />
                      </th>
                      <th>
                        Name of document <IoArrowDown />
                      </th>
                      <th>
                        Mobile Number <IoArrowDown />
                      </th>
                      <th>
                        DID No <IoArrowDown />
                      </th>
                      <th>
                        Date of issue <IoArrowDown />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDocs.length > 0 ? (
                      paginatedDocs.map((doc, index) => (
                        <tr key={doc.id} className="selected-row">
                          <td>{startIndexVal + index + 1}</td>
                          <td style={{ whiteSpace: "pre-line" }}>
                            {(() => {
                              const topNames = Array.from(
                                new Set(
                                  (doc.name || "")
                                    .split("\n")
                                    .map((n) => n.trim())
                                    .filter(Boolean)
                                )
                              );
                              if (topNames.length > 0) {
                                return topNames.map((nm, idx) => (
                                  <div key={`name-${idx}`}>{nm}</div>
                                ));
                              }

                              const entry = rawDIDs.find(
                                (it) => it.phoneNumber === doc.mobileNumber
                              );
                              if (entry && doc.didNumbers.length > 0) {
                                const didObj = entry.dids[doc.didNumbers[0]];
                                if (didObj?.members?.length > 0) {
                                  return (
                                    <div>{didObj.members[0].name || "—"}</div>
                                  );
                                }
                              }
                              return <div>—</div>;
                            })()}
                          </td>

                          <td>
                            {doc.certificateOptions.map(
                              ({ name, did }, idx) => {
                                // find the certificate number or fall back to the raw `name`
                                const rawLabel =
                                  rawDIDs.find(
                                    (p) => p.phoneNumber === doc.mobileNumber
                                  )?.dids?.[did]?.CertiNo || name;

                                const displayLabel =
                                  humanizeCamelCase(rawLabel);

                                return <div key={idx}>{displayLabel}</div>;
                              }
                            )}
                          </td>

                          <td>{doc.mobileNumber}</td>
                          <td>
                            {doc.didNumbers.map((did, idx) => (
                              <div key={idx}>{did}</div>
                            ))}
                          </td>
                          <td>
                            {doc.certificateOptions.map((option, idx) => (
                              <div key={idx}>
                                {formatDateToDDMMYYYY(option.date)}
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="no-data-cell">
                          No data
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
        </>
      )}

      {modalVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            {modalType === "confirm" && (
              <>
                <p>{modalMessage}</p>
                <div className="modal-actions">
                  <button className="modal-btn yes" onClick={handleModalYes}>
                    Yes
                  </button>
                  <button
                    className="modal-btn cancel"
                    onClick={handleModalCancel}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            {modalType === "success" && (
              <div className="modal-success">
                <div className="success-icon">
                  <Image
                    src={successIcon}
                    alt="Success"
                    width={180}
                    height={180}
                    color={"#c1272c"}
                    className="success-icon-image"
                  />
                </div>
                <p>{modalMessage}</p>
                <button
                  className="modal-btn ok"
                  onClick={() => setModalVisible(false)}
                  style={{ marginTop: 20 }}
                >
                  OK
                </button>
              </div>
            )}
            {modalType === "error" && (
              <div className="modal-error">
                <p>{modalMessage}</p>
                <button
                  className="modal-btn ok"
                  onClick={() => setModalVisible(false)}
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {csvMismatchModalVisible && (
        <div className="modal-overlay-not">
          <div className="modal-content-not">
            <h3>Data Mismatch</h3>
            <p>The fields in the uploaded CSV are not recognized.</p>

            <button
              className="modal-btn-ok-not"
              onClick={() => setCsvMismatchModalVisible(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content13">
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 18,
                fontSize: 30,
                color: "black",
                border: "none",
                background: "none",

                cursor: "pointer",
              }}
            >
              &times;
            </button>
            <BulkRegister
              onPreview={(
                fields: Record<string, string>,
                certificateType: string
              ) => {
                setFormData(fields);
                setSelectedCertificate(certificateType);
                setPhoneInput(fields?.mobileNumber || "");
                handlePreview();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
