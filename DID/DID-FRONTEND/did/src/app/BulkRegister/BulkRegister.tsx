"use client";
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import "./BulkUpload.css";

interface BulkUploadProps {
  onPreview?: (fields: Record<string, string>, certificateType: string) => void;
}

interface CertificateRow {
  certificateType: string;
  phoneNumber: string;
  fields: Record<string, any>;
}

interface CertificateParams {
  [type: string]: string[];
}
interface TemplateItem {
  name: string;
  id: string;
}

const BulkRegister: React.FC<BulkUploadProps> = ({ onPreview }) => {
  const [csvData, setCsvData] = useState<CertificateRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<CertificateRow | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [allowedCertificateTypes, setAllowedCertificateTypes] = useState<
    string[]
  >([]);
  const [filteredParams, setFilteredParams] = useState<CertificateParams>({});
  const [showNoAccessMessage, setShowNoAccessMessage] = useState(false);
  const [selectedCertificateType, setSelectedCertificateType] = useState<
    string | null
  >(null);
  const [certificateParams, setCertificateParams] = useState<CertificateParams>(
    {}
  );
  const [certificateTypes, setCertificateTypes] = useState<string[]>([]);
  const [templateMap, setTemplateMap] = useState<Record<string, string>>({});
  const apiIp = process.env.NEXT_PUBLIC_API_URL;
  const [tableParamsMap, setTableParamsMap] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const department = localStorage.getItem("issuerDepartment");

    fetch(`${apiIp}certificate/getAllCertificates`)
      .then((res) => res.json())
      .then((allParams: { data: any[] }) => {
        const paramMap: Record<string, string[]> = {};
        const tParamMap: Record<string, string[]> = {};

        allParams.data.forEach((item) => {
          paramMap[item.name] = item.params || [];
          tParamMap[item.name] = item.tableParams || [];
        });
        console.log("table Params", tParamMap);
        setCertificateParams(paramMap);
        setTableParamsMap(tParamMap);
        setCertificateTypes(Object.keys(paramMap));
      })
      .catch((err) => console.error("Error loading certificate params:", err));

    if (department && authToken) {
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
          if (data?.certificateTypes) {
            console.log("Fetched Allowed Types:", data.certificateTypes);
            const certs = data.certificateTypes.map((t: string) => t.trim());
           
            setAllowedCertificateTypes(certs);
          }
        })
        .catch(() => alert("Failed to fetch allowed certificate types."));
    }
  }, []);

  useEffect(() => {
    if (showNoAccessMessage) {
      const timer = setTimeout(() => {
        setShowNoAccessMessage(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showNoAccessMessage]);

  useEffect(() => {
    fetch(`${apiIp}certificate/getAllCertificatesParams`)
      .then((res) => res.json())
      .then((json) => {
        const map: Record<string, string> = {};
        json.data.forEach((tpl: TemplateItem) => {
          const normalized = tpl.name.toLowerCase().replace(/[^a-z0-9]/g, "");

          map[normalized] = tpl.id;
        });
        setTemplateMap(map);
      })
      .catch((err) => {
        console.error("Failed to fetch template IDs", err);
      });
  }, []);

  useEffect(() => {
    console.log("Filtered Params Set started:");
    const fp: CertificateParams = {};

    const normalizedAllowed = allowedCertificateTypes.map((t) =>
      t.toLowerCase().replace(/\s+/g, "").replace(/\+/g, "").trim()
    );

    Object.entries(certificateParams).forEach(([type, params]) => {
      const normalizedType = type.toLowerCase().replace(/\s+/g, "").trim();

      if (normalizedAllowed.includes(normalizedType)) {
        fp[type] = params;
      }
      
    });

    console.log("Filtered Params Set:", fp);
    setFilteredParams(fp);
  }, [certificateParams, allowedCertificateTypes]);

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCertificateType) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result: Papa.ParseResult<any>) => {
        const allFields = result.meta.fields || [];
        const phoneField = allFields.find((hdr) => /mobile|phone/i.test(hdr));
        if (!phoneField) {
          alert("Cannot find a mobile/phone column in your CSV.");
          return;
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        const rows: CertificateRow[] = (result.data as any[]).map((r) => {
          const f: Record<string, string> = {};
          allFields.forEach((hdr) => {
            if (hdr !== "certificateType") {
              f[hdr] = (r[hdr] || "").trim();
            }
          });
          return {
            certificateType: (r.certificateType || "").trim(),
            phoneNumber: (r[phoneField] || "").trim(),
            fields: f,
          };
        });

        const validPhoneRows = rows.filter((r) =>
          phoneRegex.test(r.phoneNumber)
        );
        const invalidCount = rows.length - validPhoneRows.length;
        if (invalidCount > 0) {
          alert(
            `Dropped ${invalidCount} row(s) with invalid mobile numbers. ` +
              `Please use a 10-digit number (e.g. 9123456789).`
          );
        }

        const normalize = (str: string) =>
          str.toLowerCase().replace(/[^a-z]/g, "");

        const selectedNorm = normalize(selectedCertificateType);
        const matched = validPhoneRows.filter(
          (row) => normalize(row.certificateType) === selectedNorm
        );

        setCsvData(matched);
        setShowNoAccessMessage(matched.length === 0);
        setIsUploaded(matched.length > 0);
        setHeaders(allFields.filter((h) => h !== "certificateType"));
      },
      error: () => alert("Failed to parse CSV file."),
    });
  };

  const handleDownloadTemplateCSV = () => {
    if (!selectedCertificateType) {
      alert("Please select a certificate type.");
      return;
    }

    const normalizedSelected = selectedCertificateType
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    
    const matchedKey = Object.keys(filteredParams).find((key) => {
      const nk = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      return nk === normalizedSelected;
    });

    if (!matchedKey) {
      alert("No matching certificate type found in parameters.");
      return;
    }

    const flatParams = (filteredParams[matchedKey] || []).filter(
      (p) => p !== "did"
    );

    const tableCols = tableParamsMap[matchedKey] || [];
    const tableHeaders = tableCols.map((col) => `row_0_${col}`);

    const csvHeaders = [
      "certificateType",
      "mobileNumber",
      ...flatParams,
      ...tableHeaders,
    ];

    const csv = Papa.unparse({ fields: csvHeaders, data: [] });
    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      `${selectedCertificateType}_template.csv`
    );
  };
  const handleUpload = async () => {
    if (csvData.length === 0 || !isUploaded) {
      alert("No data to upload.");
      return;
    }
  
    const token = localStorage.getItem("token") || "";
    const emailLogged = localStorage.getItem("userEmail") || "";
  
    const groupedData: Record<string, any[]> = {};
  
    for (const { phoneNumber, fields, certificateType } of csvData) {
      const certNorm = certificateType.toLowerCase().replace(/[^a-z0-9]/g, "");
      const templateId = templateMap[certNorm] || "";
      if (!templateId) continue;
  
      let transformedFields = { ...fields };
  
      const matchedTableKey = Object.keys(tableParamsMap).find(
        (key) =>
          key.toLowerCase().replace(/[^a-z0-9]/g, "") === certNorm
      );
      const tableCols = matchedTableKey
        ? tableParamsMap[matchedTableKey]
        : [];
  
      if (tableCols.length) {
        const tableMap: Record<string, any>[] = [];
        Object.entries(fields).forEach(([k, v]) => {
          const m = k.match(/^row_(\d+)_(.+)$/);
          if (m) {
            const idx = Number(m[1]);
            const col = m[2];
            tableMap[idx] = tableMap[idx] || {};
            tableMap[idx][col] = v;
            delete transformedFields[k];
          }
        });
        transformedFields.rows = tableMap;
      }
  
      const flatEntry = {
        templateId,
        data: transformedFields,
        phoneNumber,
        certificateType,
      };
  
      groupedData[phoneNumber] = groupedData[phoneNumber] || [];
      groupedData[phoneNumber].push(flatEntry);
    }
  
    const payload = {
      email: emailLogged,
      data: groupedData,
    };
  
    const maxRetries = 10;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
  
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(
          `${apiIp}admin/registerBulkDIDs`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );
        if (res.ok) {
          alert("✅ Bulk registration successful!");
          setCsvData([]);
          setIsUploaded(false);
          return;
        } else {
          const err = await res.json();
          console.warn(`Attempt ${attempt} failed:`, err?.message);
        }
      } catch (error) {
        console.error(`Attempt ${attempt} - Upload error:`, error);
      }
  
      if (attempt < maxRetries) await delay(1000);
      else alert("❌ All attempts failed. Please try again later.");
    }
  };
  

  const handlePreview = (row: CertificateRow) => {
    setPreviewData(row);
    onPreview?.(row.fields, row.certificateType);
  };

  const prettifyHeader = (h: string) =>
    h
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/^./, (s) => s.toUpperCase());

  return (
    <div className="bulk-upload-container">
      <div className="bulk-upload-actions flex-row">
        <input
          type="file"
          id="csv-upload"
          accept=".csv"
          onChange={handleCSVImport}
          style={{ display: "none" }}
        />
        <label
          htmlFor="csv-upload"
          className={`button-secondary ${
            !selectedCertificateType ? "disabled" : ""
          }`}
          style={{
            pointerEvents: !selectedCertificateType ? "none" : "auto",
            opacity: !selectedCertificateType ? 0.5 : 1,
          }}
        >
          Upload CSV
        </label>
        <button
          className="button-secondary"
          onClick={handleDownloadTemplateCSV}
          disabled={!selectedCertificateType}
        >
          Download Template CSV
        </button>
        <div className="dropdown-container">
          <select
            id="certificate-dropdown"
            value={selectedCertificateType || ""}
            onChange={(e) => setSelectedCertificateType(e.target.value)}
            className="certifiacte-type-class"
          >
            <option value=""> Select Certificate Type</option>
            {allowedCertificateTypes.map((type) => (
              <option key={type} value={type}>
                {prettifyHeader(type)}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={!isUploaded || csvData.length === 0}
        >
          Add Data
        </button>
      </div>

      {showNoAccessMessage && (
        <p style={{ color: "red" }}>
          No rows matched "{selectedCertificateType}"
        </p>
      )}

      {csvData.length > 0 && (
        <div className="bulk-upload-table-container">
          <table className="bulk-upload-table">
            <thead>
              <tr>
                <th>#</th>
                {headers.map((h) => (
                  <th key={h}>{prettifyHeader(h)}</th>
                ))}
                <th>Certificate Type</th>
              </tr>
            </thead>
            <tbody>
              {csvData.map((row, i) => (
                <tr key={i} onClick={() => handlePreview(row)}>
                  <td>{i + 1}</td>
                  {headers.map((h) => (
                    <td key={h}>{row.fields[h]}</td>
                  ))}
                  <td>{row.certificateType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default BulkRegister;
