const BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  status?: number;
  expectedStatus: string;
  detail: string;
}

const results: TestResult[] = [];

function record(name: string, category: string, passed: boolean, status: number | undefined, expectedStatus: string, detail: string) {
  results.push({ name, category, passed, status, expectedStatus, detail });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} [${category}] ${name} -> ${status || "N/A"} (Expected: ${expectedStatus}) - ${detail}`);
}

async function api(path: string, options: RequestInit = {}): Promise<{ status: number; headers: Headers; data: any; text: string }> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, options);
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, headers: res.headers, data, text };
  } catch (err: any) {
    return { status: 0, headers: new Headers(), data: null, text: err.message };
  }
}

async function runAudit() {
  console.log("================================================================================");
  console.log("             DECENTRACERT API SECURITY AUDIT & PENETRATION SUITE                ");
  console.log(` Target Server: ${BASE_URL}`);
  console.log("================================================================================\n");

  // -------------------------------------------------------------------------
  // 1. UNPROTECTED ENDPOINTS / AUTHENTICATION ENFORCEMENT
  // -------------------------------------------------------------------------
  console.log("--- 1. Testing Unauthenticated Route Protection ---");

  const protectedRoutes: Array<{ method: string; url: string }> = [
    { method: "GET", url: "/api/dashboard/stats" },
    { method: "GET", url: "/api/dashboard/recent-certificates" },
    { method: "GET", url: "/api/dashboard/recent-verifications" },
    { method: "GET", url: "/api/certificates" },
    { method: "GET", url: "/api/certificates/DC-2026-STU001-01" },
    { method: "GET", url: "/api/certificates/DC-2026-STU001-01/pdf" },
    { method: "GET", url: "/api/certificates/DC-2026-STU001-01/qr" },
    { method: "POST", url: "/api/certificates" },
    { method: "POST", url: "/api/certificates/DC-2026-STU001-01/revoke" },
    { method: "POST", url: "/api/certificates/DC-2026-STU001-01/reconcile" },
    { method: "GET", url: "/api/blockchain/transactions" },
    { method: "GET", url: "/api/audit-logs" },
    { method: "POST", url: "/api/integrity-test/execute" },
  ];

  for (const r of protectedRoutes) {
    const res = await api(r.url, { method: r.method });
    const passed = res.status === 401;
    record(
      `${r.method} ${r.url}`,
      "Auth Boundary",
      passed,
      res.status,
      "401",
      passed ? "Correctly blocked unauthenticated request" : "FAILED: Unauthenticated access permitted"
    );
  }

  // -------------------------------------------------------------------------
  // 2. PUBLIC REGISTRATION ROLE ESCALATION DEFENSE
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Testing Public Registration Role Escalation Defense ---");
  for (const forbiddenRole of ["admin", "issuer", "verifier"]) {
    const res = await api("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Hacker ${forbiddenRole}`,
        email: `hacker_${forbiddenRole}_${Date.now()}@attack.com`,
        password: "Password123!",
        role: forbiddenRole,
      }),
    });
    const passed = res.status === 403;
    record(
      `Self-register as ${forbiddenRole}`,
      "Role Escalation",
      passed,
      res.status,
      "403",
      passed ? `Blocked forbidden role '${forbiddenRole}' assignment` : "FAILED: Role escalation permitted!"
    );
  }

  // -------------------------------------------------------------------------
  // 3. HORIZONTAL PRIVILEGE ESCALATION (STUDENT A -> STUDENT B)
  // -------------------------------------------------------------------------
  console.log("\n--- 3. Testing Horizontal Privilege Isolation (Student A vs B) ---");

  // Login as Student 001 (James Smith, DC-STU-2022-001)
  const loginRes1 = await api("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "student001@decentracert.edu",
      password: "Student@123",
    }),
  });

  const student1Token = loginRes1.data?.data?.token || loginRes1.data?.token;
  if (!student1Token) {
    console.error("❌ Failed to login as student001@decentracert.edu. Response:", loginRes1.text);
  } else {
    const student1Headers = {
      Authorization: `Bearer ${student1Token}`,
      "Content-Type": "application/json",
    };

    // Test: Access own certificate
    const ownCertRes = await api("/api/certificates/DC-2026-STU001-01", {
      method: "GET",
      headers: student1Headers,
    });
    const ownPassed = ownCertRes.status === 200;
    record(
      "Student 1 reading own certificate (DC-2026-STU001-01)",
      "Horizontal RBAC",
      ownPassed,
      ownCertRes.status,
      "200",
      ownPassed ? "Allowed legitimate access to own certificate" : "FAILED to access own certificate"
    );

    // Test: Access Student 2's certificate by ID
    const peerCertRes = await api("/api/certificates/DC-2026-STU002-01", {
      method: "GET",
      headers: student1Headers,
    });
    const peerPassed = peerCertRes.status === 403;
    record(
      "Student 1 accessing Student 2 cert (DC-2026-STU002-01)",
      "Horizontal RBAC",
      peerPassed,
      peerCertRes.status,
      "403",
      peerPassed ? "Forbidden: Blocked peer certificate metadata access" : "FAILED: Peer certificate metadata leaked!"
    );

    // Test: Access Student 2's PDF
    const peerPdfRes = await api("/api/certificates/DC-2026-STU002-01/pdf", {
      method: "GET",
      headers: student1Headers,
    });
    const peerPdfPassed = peerPdfRes.status === 403;
    record(
      "Student 1 downloading Student 2 PDF (DC-2026-STU002-01)",
      "Horizontal RBAC",
      peerPdfPassed,
      peerPdfRes.status,
      "403",
      peerPdfPassed ? "Forbidden: Blocked peer certificate PDF download" : "FAILED: Peer PDF download leaked!"
    );

    // Test: Access Student 2's QR
    const peerQrRes = await api("/api/certificates/DC-2026-STU002-01/qr", {
      method: "GET",
      headers: student1Headers,
    });
    const peerQrPassed = peerQrRes.status === 403;
    record(
      "Student 1 reading Student 2 QR (DC-2026-STU002-01)",
      "Horizontal RBAC",
      peerQrPassed,
      peerQrRes.status,
      "403",
      peerQrPassed ? "Forbidden: Blocked peer QR code access" : "FAILED: Peer QR code leaked!"
    );

    // Test: Certificate list isolation
    const certListRes = await api("/api/certificates", {
      method: "GET",
      headers: student1Headers,
    });
    const certList = certListRes.data?.data?.certificates || certListRes.data?.data || [];
    const leakedPeers = Array.isArray(certList) ? certList.filter((c: any) => c.studentEmail && c.studentEmail !== "student001@decentracert.edu") : [];
    const listPassed = certListRes.status === 200 && leakedPeers.length === 0;
    record(
      "Student 1 listing certificates (Filter to own email only)",
      "Horizontal RBAC",
      listPassed,
      certListRes.status,
      "200 (filtered)",
      listPassed ? `Strictly returned ${certList.length} owned certificates, 0 peer certificates` : `FAILED: Leaked ${leakedPeers.length} peer certificates in list!`
    );
  }

  // -------------------------------------------------------------------------
  // 4. VERTICAL PRIVILEGE ESCALATION (STUDENT -> ADMIN/ISSUER)
  // -------------------------------------------------------------------------
  console.log("\n--- 4. Testing Vertical Privilege Escalation Defense ---");
  if (student1Token) {
    const student1Headers = {
      Authorization: `Bearer ${student1Token}`,
      "Content-Type": "application/json",
    };

    const verticalTests = [
      { method: "GET", url: "/api/dashboard/stats" },
      { method: "GET", url: "/api/dashboard/recent-certificates" },
      { method: "GET", url: "/api/dashboard/recent-verifications" },
      { method: "POST", url: "/api/certificates", body: JSON.stringify({ studentName: "Fake" }) },
      { method: "POST", url: "/api/certificates/DC-2026-STU001-01/revoke", body: JSON.stringify({ reason: "Hack" }) },
      { method: "POST", url: "/api/certificates/DC-2026-STU001-01/reconcile", body: JSON.stringify({}) },
      { method: "GET", url: "/api/blockchain/transactions" },
      { method: "GET", url: "/api/audit-logs" },
      { method: "POST", url: "/api/integrity-test/execute", body: JSON.stringify({ certificateId: "DC-2026-STU001-01" }) },
    ];

    for (const vt of verticalTests) {
      const res = await api(vt.url, {
        method: vt.method,
        headers: student1Headers,
        ...(vt.body ? { body: vt.body } : {}),
      });
      const passed = res.status === 403;
      record(
        `Student requesting ${vt.method} ${vt.url}`,
        "Vertical RBAC",
        passed,
        res.status,
        "403",
        passed ? "Forbidden: Non-privileged student rejected" : "FAILED: Privilege escalation permitted!"
      );
    }
  }

  // -------------------------------------------------------------------------
  // 5. ISSUER PRIVILEGE BOUNDARY (ISSUER CANNOT REVOKE OR AUDIT LOGS)
  // -------------------------------------------------------------------------
  console.log("\n--- 5. Testing Issuer Role Boundary (Issuer vs Admin) ---");
  const loginIssuerRes = await api("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "issuer@decentracert.edu",
      password: "Issuer@123",
    }),
  });

  const issuerToken = loginIssuerRes.data?.data?.token || loginIssuerRes.data?.token;
  if (!issuerToken) {
    console.error("❌ Failed to login as issuer@decentracert.edu. Response:", loginIssuerRes.text);
  } else {
    const issuerHeaders = {
      Authorization: `Bearer ${issuerToken}`,
      "Content-Type": "application/json",
    };

    // Issuer CAN access dashboard stats
    const iDashRes = await api("/api/dashboard/stats", { method: "GET", headers: issuerHeaders });
    record(
      "Issuer accessing Dashboard Stats",
      "Issuer RBAC",
      iDashRes.status === 200,
      iDashRes.status,
      "200",
      iDashRes.status === 200 ? "Authorized: Issuer has view permission for dashboard" : "FAILED to access stats"
    );

    // Issuer CANNOT revoke certificates (Admin only)
    const iRevokeRes = await api("/api/certificates/DC-2026-STU001-01/revoke", {
      method: "POST",
      headers: issuerHeaders,
      body: JSON.stringify({ reason: "Unauthorized attempt" }),
    });
    record(
      "Issuer attempting to Revoke Certificate",
      "Issuer RBAC",
      iRevokeRes.status === 403,
      iRevokeRes.status,
      "403",
      iRevokeRes.status === 403 ? "Forbidden: Issuer cannot revoke certificates" : "FAILED: Issuer allowed to revoke!"
    );

    // Issuer CANNOT view Audit Logs (Admin only)
    const iAuditRes = await api("/api/audit-logs", { method: "GET", headers: issuerHeaders });
    record(
      "Issuer attempting to read Audit Logs",
      "Issuer RBAC",
      iAuditRes.status === 403,
      iAuditRes.status,
      "403",
      iAuditRes.status === 403 ? "Forbidden: Issuer cannot inspect institutional audit logs" : "FAILED: Audit logs exposed to issuer!"
    );
  }

  // -------------------------------------------------------------------------
  // 6. PUBLIC VERIFICATION PII LEAKAGE CHECKS
  // -------------------------------------------------------------------------
  console.log("\n--- 6. Testing Public Verification PII Zero-Leakage ---");

  // Verify by ID
  const verifyIdRes = await api("/api/verify/id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ certificateId: "DC-2026-STU001-01" }),
  });

  const certData = verifyIdRes.data?.data?.certificate;
  let piiLeaked = false;
  const leaks: string[] = [];

  if (certData) {
    if (certData.studentEmail) { piiLeaked = true; leaks.push(`studentEmail: ${certData.studentEmail}`); }
    if (certData.studentId) { piiLeaked = true; leaks.push(`studentId: ${certData.studentId}`); }
    if (certData._id) { piiLeaked = true; leaks.push(`_id: ${certData._id}`); }
    if (certData.storagePath) { piiLeaked = true; leaks.push(`storagePath: ${certData.storagePath}`); }
    if (certData.filePath) { piiLeaked = true; leaks.push(`filePath: ${certData.filePath}`); }
  }

  const piiPassed = verifyIdRes.status === 200 && !piiLeaked;
  record(
    "Public Verify by ID (/api/verify/id) PII Leakage Check",
    "PII Defense",
    piiPassed,
    verifyIdRes.status,
    "200 (No PII)",
    piiPassed
      ? "Zero PII leaked: studentEmail, studentId, internal DB ID & file storage paths are absent"
      : `FAILED: Leaked private fields: ${leaks.join(", ")}`
  );

  // Verify by Hash
  const hashToTest = certData?.sha256Hash || "0000000000000000000000000000000000000000000000000000000000000000";
  const verifyHashRes = await api("/api/verify/hash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash: hashToTest }),
  });

  const hashCert = verifyHashRes.data?.data?.certificate;
  let hashPiiLeaked = false;
  if (hashCert) {
    if (hashCert.studentEmail || hashCert.studentId || hashCert._id || hashCert.storagePath || hashCert.filePath) {
      hashPiiLeaked = true;
    }
  }
  const hashPiiPassed = !hashPiiLeaked;
  record(
    "Public Verify by Hash (/api/verify/hash) PII Leakage Check",
    "PII Defense",
    hashPiiPassed,
    verifyHashRes.status,
    "Clean Payload",
    hashPiiPassed ? "Zero PII leaked on hash-based verification" : "FAILED: PII exposed on hash lookup!"
  );

  // -------------------------------------------------------------------------
  // 7. PATH TRAVERSAL / ARBITRARY FILE ACCESS
  // -------------------------------------------------------------------------
  console.log("\n--- 7. Testing Path Traversal Defenses ---");

  const traversalPayloads = [
    "../../package.json",
    "..%2F..%2Fpackage.json",
    "..%252F..%252Fpackage.json",
    "../../../../windows/win.ini",
    "..\\..\\storage\\users.json",
  ];

  for (const payload of traversalPayloads) {
    const res = await api(`/api/verify/pdf/${payload}`);
    const passed = res.status === 400 || res.status === 404;
    const content = res.text;
    const leakedPackage = content.includes('"name": "decentracert-backend"') || content.includes("[fonts]");
    const safe = passed && !leakedPackage;
    record(
      `Path Traversal: GET /api/verify/pdf/${payload}`,
      "Path Traversal",
      safe,
      res.status,
      "400 or 404",
      safe ? "Securely rejected traversal attempt" : "FAILED: Arbitrary file data leaked!"
    );
  }

  // -------------------------------------------------------------------------
  // 8. ERROR INFORMATION LEAKAGE & FINGERPRINTING
  // -------------------------------------------------------------------------
  console.log("\n--- 8. Testing Information Leakage in Error Responses ---");

  // Send malformed JSON to trigger body-parser syntax error
  const malformedRes = await api("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"email": "broken_json',
  });

  const malformedBody = malformedRes.text;
  const hasStackTrace = malformedBody.includes("SyntaxError") && malformedBody.includes("at ");
  const hasDrivePath = /([a-zA-Z]:\\[^"]+)/i.test(malformedBody) || /(\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)/i.test(malformedBody);
  const stackLeakPassed = malformedRes.status === 400 && !hasStackTrace && !hasDrivePath;
  record(
    "Malformed JSON Payload Error Leak Check",
    "Info Leakage",
    stackLeakPassed,
    malformedRes.status,
    "400 (Clean message)",
    stackLeakPassed ? "Clean 400 returned with zero stack traces or file paths" : "FAILED: Stack trace or file path leaked in error response!"
  );

  // Check X-Powered-By Header
  const healthRes = await api("/api/health");
  const xPoweredBy = healthRes.headers.get("x-powered-by");
  const headerPassed = !xPoweredBy;
  record(
    "Express Fingerprint (X-Powered-By Header)",
    "Server Hardening",
    headerPassed,
    healthRes.status,
    "No Header",
    headerPassed ? "X-Powered-By header is cleanly stripped" : `FAILED: X-Powered-By header present: ${xPoweredBy}`
  );

  // Check RPC status sanitization
  const bStatusRes = await api("/api/blockchain/status");
  const bStatusBody = bStatusRes.text;
  const leakedRpcPort = bStatusBody.includes("127.0.0.1:8545") || bStatusBody.includes("ECONNREFUSED");
  const rpcPassed = !leakedRpcPort;
  record(
    "Blockchain Status RPC Topology Sanitization",
    "Info Leakage",
    rpcPassed,
    bStatusRes.status,
    "Sanitized",
    rpcPassed ? "Internal RPC socket/port details are masked from public responses" : "FAILED: Internal RPC socket details leaked!"
  );

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("                           SECURITY AUDIT SUMMARY                               ");
  console.log("================================================================================");
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  console.log(`Total Security Checks Executed : ${total}`);
  console.log(`Checks Passed                  : ${passedCount}`);
  console.log(`Checks Failed                  : ${failedCount}`);
  console.log(`Security Compliance Score      : ${((passedCount / total) * 100).toFixed(1)}%`);
  console.log("================================================================================\n");

  if (failedCount > 0) {
    console.error("⚠️ SOME CHECKS FAILED. Please review the failed items above.");
    process.exit(1);
  } else {
    console.log("🎉 ALL ENDPOINTS PROPERLY HARDENED, CLOSED, AND ZERO LEAKS DETECTED!");
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error("FATAL: Security audit suite encountered an unexpected error:", err);
  process.exit(1);
});
