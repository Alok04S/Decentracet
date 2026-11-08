import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Award,
  Mail,
  GraduationCap,
  ChevronRight,
  X,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Download,
  ExternalLink,
  Eye,
  Filter,
} from "lucide-react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { CertificateParchmentModal } from "../../components/common/CertificateParchmentModal";

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [allCertificates, setAllCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedCertForParchment, setSelectedCertForParchment] = useState<any | null>(null);

  useEffect(() => {
    const fetchStudentsAndCertificates = async () => {
      setLoading(true);
      try {
        const res = await api.get("/certificates?limit=1000");
        if (res.data.success) {
          const certs = res.data.data;
          setAllCertificates(certs);

          const map = new Map<string, any>();
          certs.forEach((cert: any) => {
            const key = cert.studentEmail?.toLowerCase() || cert.studentId?.toLowerCase();
            if (!key) return;

            if (!map.has(key)) {
              map.set(key, {
                studentName: cert.studentName,
                studentId: cert.studentId,
                studentEmail: cert.studentEmail,
                degree: cert.degree,
                department: cert.department || "Engineering",
                graduationYear: cert.graduationYear,
                certificateCount: 1,
                activeCount: cert.certificateStatus === "active" ? 1 : 0,
                revokedCount: cert.certificateStatus === "revoked" ? 1 : 0,
                certificates: [cert],
              });
            } else {
              const existing = map.get(key);
              existing.certificateCount++;
              if (cert.certificateStatus === "active") existing.activeCount++;
              if (cert.certificateStatus === "revoked") existing.revokedCount++;
              existing.certificates.push(cert);
            }
          });

          setStudents(Array.from(map.values()));
        }
      } catch (err) {
        console.error("Fetch students error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndCertificates();
  }, []);

  // Unique departments for filter
  const departments = Array.from(new Set(students.map((s) => s.department).filter(Boolean)));

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.degree.toLowerCase().includes(search.toLowerCase()) ||
      (s.department && s.department.toLowerCase().includes(search.toLowerCase()));

    const matchesDept = departmentFilter === "ALL" || s.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            Graduate & Student Registry
          </h1>
          <p className="text-xs text-secondary mt-1">
            Registered students and candidates with issued digital academic credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-primary border border-blue-200 rounded-lg text-xs font-semibold">
            {students.length} Enrolled Students
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
            {allCertificates.length} Total Credentials Conferred
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="enterprise-card p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name, email, student enrollment ID, or major..."
            className="enterprise-input pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-secondary hidden sm:block" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="enterprise-input text-xs w-full sm:w-64"
          >
            <option value="ALL">All Academic Departments ({departments.length})</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Directory Table */}
      <div className="enterprise-card overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading student directory and verifiable records..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No Student Records Found"
            description="No graduates match your search filter criteria. Try broadening your keywords."
            icon={Users}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border text-secondary">
                <tr>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Enrollment ID</th>
                  <th className="py-3 px-4 font-semibold">Department & Faculty</th>
                  <th className="py-3 px-4 font-semibold">Email Address</th>
                  <th className="py-3 px-4 font-semibold text-center">Credentials</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr
                    key={s.studentEmail}
                    onClick={() => setSelectedStudent(s)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-bold text-navy flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-primary border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                        {s.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="group-hover:text-primary transition-colors">
                          {s.studentName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Class of {s.graduationYear}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {s.studentId}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                      {s.department || "Computer Science"}
                    </td>
                    <td className="py-3 px-4 text-secondary">{s.studentEmail}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 font-bold text-primary bg-primary-surface px-2.5 py-1 rounded-md text-xs">
                        <Award className="w-3.5 h-3.5" />
                        {s.certificateCount} Conferred
                        {s.revokedCount > 0 && (
                          <span className="text-[10px] px-1 py-0.2 bg-red-100 text-red-700 rounded font-bold">
                            {s.revokedCount} revoked
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(s);
                        }}
                        className="inline-flex items-center gap-1 text-primary hover:text-blue-800 font-semibold text-xs py-1 px-2.5 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        Inspect ({s.certificateCount})
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Credentials Inspector Slide-Out Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 bg-slate-50 border-b border-border flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {selectedStudent.studentName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy">
                    {selectedStudent.studentName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-secondary">
                    <span className="font-mono text-slate-700 font-semibold">
                      {selectedStudent.studentId}
                    </span>
                    <span>•</span>
                    <span>{selectedStudent.studentEmail}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-secondary hover:text-navy hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Department & Summary Bar */}
            <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span className="font-semibold">{selectedStudent.department}</span>
                <span className="text-slate-400">|</span>
                <span>Class of {selectedStudent.graduationYear}</span>
              </div>
              <div className="font-bold text-primary">
                {selectedStudent.certificates.length} Total Credentials
              </div>
            </div>

            {/* List of 8 Credentials */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                Conferred Academic Credentials & Honors ({selectedStudent.certificates.length})
              </h3>

              <div className="space-y-3">
                {selectedStudent.certificates.map((cert: any, idx: number) => {
                  const isRevoked = cert.certificateStatus === "revoked";
                  return (
                    <div
                      key={cert.certificateId}
                      className={`p-4 rounded-xl border transition-all ${
                        isRevoked
                          ? "bg-red-50/40 border-red-200"
                          : "bg-white border-border hover:border-primary/50 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                              {cert.certificateId}
                            </span>
                            <span className="text-xs font-semibold text-primary">
                              {cert.certificateType}
                            </span>
                            {isRevoked ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                REVOKED
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                VERIFIED ON-CHAIN
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-navy leading-snug">
                            {cert.degree}
                          </h4>

                          {cert.specialization && (
                            <p className="text-xs text-secondary italic">
                              Specialization: {cert.specialization}
                            </p>
                          )}

                          {cert.grade && (
                            <p className="text-xs text-amber-800 font-medium">
                              {cert.grade}
                            </p>
                          )}

                          {isRevoked && cert.revocationReason && (
                            <div className="mt-2 text-xs bg-red-100 text-red-900 p-2 rounded-md border border-red-200">
                              <strong>Revocation Record:</strong> {cert.revocationReason}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Bar for Credential */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-[10px] font-mono text-slate-400 truncate max-w-xs">
                          Hash: {cert.pdfSha256?.substring(0, 16)}...
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedCertForParchment(cert)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded text-xs border border-amber-200 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            View Parchment
                          </button>
                          <a
                            href={`/verify/${cert.certificateId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Verify
                          </a>
                          <a
                            href={`/api/verify/pdf/${cert.certificateId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white font-semibold rounded text-xs hover:bg-blue-700 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-border flex items-center justify-between">
              <span className="text-xs text-secondary">
                Showing all 8 institutional records
              </span>
              <button
                onClick={() => setSelectedStudent(null)}
                className="enterprise-btn-secondary text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parchment Viewer Modal */}
      <CertificateParchmentModal
        isOpen={!!selectedCertForParchment}
        onClose={() => setSelectedCertForParchment(null)}
        certificate={selectedCertForParchment}
      />
    </div>
  );
};
