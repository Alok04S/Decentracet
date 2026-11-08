import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  QrCode,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { QrModal } from "../../components/common/QrModal";

const issueSchema = z.object({
  studentName: z.string().min(2, "Student full name is required"),
  studentId: z.string().min(2, "Student ID / Enrollment number is required"),
  studentEmail: z.string().email("Valid student email is required"),
  degree: z.string().min(2, "Degree name is required"),
  department: z.string().min(2, "Department is required"),
  specialization: z.string().optional(),
  academicYear: z.string().min(4, "Academic year is required (e.g. 2022-2026)"),
  graduationYear: z.coerce.number().min(1950).max(2100),
  issueDate: z.string().min(1, "Issue date is required"),
  certificateType: z.string().default("Bachelor of Science"),
  grade: z.string().optional(),
  remarks: z.string().optional(),
});

type IssueFormValues = z.infer<typeof issueSchema>;

export const IssueCertificatePage: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const [issuedCert, setIssuedCert] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      studentName: "",
      studentId: "",
      studentEmail: "",
      degree: "Bachelor of Science in Computer Science & Engineering",
      department: "Computer Science and Engineering",
      specialization: "Distributed Systems & Cryptography",
      academicYear: "2022-2026",
      graduationYear: 2026,
      issueDate: new Date().toISOString().split("T")[0],
      certificateType: "Bachelor of Science",
      grade: "First Class with Distinction (3.95 CGPA)",
      remarks: "Awarded with High Honors",
    },
  });

  const formValues = watch();

  const onSubmit = async (values: IssueFormValues) => {
    setSubmitting(true);
    setErrorMsg("");
    setIssuedCert(null);

    // Generate client-side idempotency key for network resilience
    const idempotencyKey = `ISSUE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await api.post("/certificates", {
        ...values,
        idempotencyKey,
      });

      if (res.data.success) {
        setIssuedCert(res.data.certificate);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Certificate issuance failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const fillSampleData = () => {
    setValue("studentName", "Charlotte Morgan");
    setValue("studentId", "ENR-2022-9412");
    setValue("studentEmail", "charlotte.morgan@student.edu");
    setValue("degree", "Bachelor of Science in Cybersecurity & Blockchain");
    setValue("department", "Information Technology & Security");
    setValue("specialization", "Cryptographic Protocols");
    setValue("academicYear", "2022-2026");
    setValue("graduationYear", 2026);
    setValue("grade", "First Class with Honors (3.88 CGPA)");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Issue Academic Credential</h1>
          <p className="text-xs text-secondary mt-1">
            Generates high-resolution PDF diploma, calculates exact SHA-256 binary hash, and anchors hash to Ethereum.
          </p>
        </div>

        <button
          type="button"
          onClick={fillSampleData}
          className="enterprise-btn-secondary text-xs flex items-center gap-1.5 self-start"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Fill Sample Graduate
        </button>
      </div>

      {/* Success Confirmation Modal / Receipt Banner */}
      {issuedCert && (
        <div className="enterprise-card p-6 border-l-4 border-l-success bg-green-50/40">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-success flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy">
                  Academic Credential Successfully Issued & Anchored!
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  The PDF was generated, hashed, and recorded with certificate ID{" "}
                  <strong className="text-navy font-mono">{issuedCert.certificateId}</strong>.
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <a
                    href={`/api/certificates/${encodeURIComponent(issuedCert.certificateId)}/pdf`}
                    download
                    className="enterprise-btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Official PDF
                  </a>

                  <button
                    onClick={() => setQrModalOpen(true)}
                    className="enterprise-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    View & Download QR Code
                  </button>

                  <Link
                    to={`/verify/${issuedCert.certificateId}`}
                    target="_blank"
                    className="enterprise-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Public Verification
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Issuance Form & Live Diploma Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form (7 Cols) */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-7 space-y-6">
          {/* Section 1: Student Information */}
          <div className="enterprise-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy pb-2 border-b border-border flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-primary flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              Student & Candidate Identification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-navy mb-1">
                  Full Candidate Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  {...register("studentName")}
                  placeholder="e.g. Charlotte Morgan"
                  className="enterprise-input"
                />
                {errors.studentName && (
                  <p className="text-[11px] text-error mt-1">{errors.studentName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1">
                  Student ID / Enrollment Number <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  {...register("studentId")}
                  placeholder="e.g. ENR-2022-9412"
                  className="enterprise-input font-mono uppercase"
                />
                {errors.studentId && (
                  <p className="text-[11px] text-error mt-1">{errors.studentId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1">
                  Student Email Address <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  {...register("studentEmail")}
                  placeholder="student@institution.edu"
                  className="enterprise-input"
                />
                {errors.studentEmail && (
                  <p className="text-[11px] text-error mt-1">{errors.studentEmail.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Academic Program Information */}
          <div className="enterprise-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy pb-2 border-b border-border flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-primary flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              Academic Credential & Curriculum
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-navy mb-1">
                  Degree Title Conferred <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  {...register("degree")}
                  placeholder="e.g. Bachelor of Science in Computer Science"
                  className="enterprise-input"
                />
                {errors.degree && (
                  <p className="text-[11px] text-error mt-1">{errors.degree.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1">
                  Academic Department <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  {...register("department")}
                  placeholder="e.g. Computer Science and Engineering"
                  className="enterprise-input"
                />
                {errors.department && (
                  <p className="text-[11px] text-error mt-1">{errors.department.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1">Specialization</label>
                <input
                  type="text"
                  {...register("specialization")}
                  placeholder="e.g. Cryptography & Distributed Systems"
                  className="enterprise-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1">
                  Academic Year <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  {...register("academicYear")}
                  placeholder="2022-2026"
                  className="enterprise-input"
                />
                {errors.academicYear && (
                  <p className="text-[11px] text-error mt-1">{errors.academicYear.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1">
                  Graduation Year <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  {...register("graduationYear")}
                  placeholder="2026"
                  className="enterprise-input"
                />
                {errors.graduationYear && (
                  <p className="text-[11px] text-error mt-1">{errors.graduationYear.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1">
                  Conferral / Issue Date <span className="text-error">*</span>
                </label>
                <input type="date" {...register("issueDate")} className="enterprise-input" />
                {errors.issueDate && (
                  <p className="text-[11px] text-error mt-1">{errors.issueDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1">Credential Type</label>
                <input
                  type="text"
                  {...register("certificateType")}
                  placeholder="Bachelor of Science"
                  className="enterprise-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1">Grade / CGPA</label>
                <input
                  type="text"
                  {...register("grade")}
                  placeholder="e.g. First Class with Distinction (3.92 CGPA)"
                  className="enterprise-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1">Additional Remarks</label>
                <input
                  type="text"
                  {...register("remarks")}
                  placeholder="e.g. Awarded Dean's Medal"
                  className="enterprise-input"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="enterprise-btn-primary w-full py-3 text-xs font-bold gap-2"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating PDF & Anchoring to Ethereum Sepolia...
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                Issue & Anchor Credential on Blockchain
              </>
            )}
          </button>
        </form>

        {/* Live Visual Diploma Preview Card (5 Cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                Live Certificate Rendering Preview
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-primary">
                A4 Printable
              </span>
            </div>

            {/* Certificate Canvas Preview Card */}
            <div className="enterprise-card p-6 bg-white border-2 border-primary/30 shadow-card text-center relative overflow-hidden">
              <div className="absolute inset-1 border border-border pointer-events-none" />

              {/* Header */}
              <div className="mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-1">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider">
                  DecentraCert University of Technology
                </h4>
                <p className="text-[9px] uppercase tracking-widest text-primary font-bold mt-0.5">
                  Official Academic Credential
                </p>
                <div className="w-16 h-0.5 bg-border mx-auto my-1.5" />
              </div>

              {/* Body */}
              <div className="space-y-2 py-2">
                <p className="text-[10px] italic text-secondary">This is to certify that</p>
                <h3 className="text-base font-bold text-navy tracking-tight underline decoration-primary decoration-1 underline-offset-4">
                  {formValues.studentName || "Candidate Full Name"}
                </h3>
                <p className="text-[10px] text-secondary">
                  has satisfactorily fulfilled all prescribed requirements and is hereby conferred the degree of
                </p>
                <h4 className="text-xs font-bold text-navy">
                  {formValues.degree || "Degree Title"}
                </h4>
                {formValues.specialization && (
                  <p className="text-[10px] text-secondary">with Specialization in {formValues.specialization}</p>
                )}
                <p className="text-[10px] text-secondary">
                  Department of {formValues.department || "Academic Department"}
                </p>
                <p className="text-[9px] text-slate-400">
                  Class of {formValues.graduationYear || 2026} • Conferred on{" "}
                  {formValues.issueDate ? new Date(formValues.issueDate).toLocaleDateString() : "Date"}
                </p>
              </div>

              {/* Bottom Footer & QR placeholder */}
              <div className="pt-4 mt-2 border-t border-border flex items-end justify-between text-left">
                <div>
                  <div className="text-[8px] font-mono font-bold text-navy">
                    Certificate ID: DC-2026-XXXXXXXX
                  </div>
                  <div className="text-[7.5px] text-secondary">
                    Cryptographically anchored to Ethereum blockchain
                  </div>
                </div>
                <div className="w-10 h-10 border border-dashed border-border rounded bg-slate-50 flex items-center justify-center text-secondary">
                  <QrCode className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {issuedCert && (
        <QrModal
          isOpen={qrModalOpen}
          certificateId={issuedCert.certificateId}
          studentName={issuedCert.studentName}
          onClose={() => setQrModalOpen(false)}
        />
      )}
    </div>
  );
};
