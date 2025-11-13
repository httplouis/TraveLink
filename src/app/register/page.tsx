// app/(auth)/register/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import RegisterView, { DriverStep, RolePick } from "./RegisterView";

// basic email + pw checks
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters long.";
  if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(pw)) return "Password must contain at least one special character.";
  return null;
}

function normalizePhone(p: string) {
  const digits = p.replace(/\D/g, "");
  if (digits.startsWith("09") && digits.length === 11) return "+63" + digits.slice(1);
  if (digits.startsWith("9") && digits.length === 10) return "+63" + digits;
  if (digits.startsWith("63")) return "+" + digits;
  if (digits.startsWith("+")) return digits;
  return "+" + digits;
}

export default function RegisterPage() {
  const [role, setRole] = useState<RolePick>("faculty");

  // faculty state
  const [fFirst, setFFirst] = useState("");
  const [fMiddle, setFMiddle] = useState("");
  const [fLast, setFLast] = useState("");
  const [fSuffix, setFSuffix] = useState("");
  const [fDept, setFDept] = useState("");
  const [fBirthdate, setFBirthdate] = useState("");
  const [fAddress, setFAddress] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPw, setFPw] = useState("");
  const [fPwConfirm, setFPwConfirm] = useState("");
  // REMOVED: fWantsHead - violates RBAC Ground Truth (no self-declaration)
  const [emailDirectoryData, setEmailDirectoryData] = useState<any>(null);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);

  // driver state
  const [dStep, setDStep] = useState<DriverStep>("phone");
  const [dPhone, setDPhone] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [dOtp, setDOtp] = useState("");
  const [dFirst, setDFirst] = useState("");
  const [dMiddle, setDMiddle] = useState("");
  const [dLast, setDLast] = useState("");
  const [dSuffix, setDSuffix] = useState("");
  const [dAddress, setDAddress] = useState("");

  // ui
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [justSignedUpEmail, setJustSignedUpEmail] = useState<string | null>(null);

  // linis message pag palit tab
  useEffect(() => {
    setMsg(null);
    setErr(null);
  }, [role]);

  // Check email in directory on blur
  async function checkEmailDirectory() {
    if (!fEmail.trim() || !emailRegex.test(fEmail.trim())) return;
    
    setEmailCheckLoading(true);
    try {
      const res = await fetch(`/api/email-directory?email=${encodeURIComponent(fEmail.trim())}`);
      const data = await res.json();
      
      if (data.ok && data.data) {
        setEmailDirectoryData(data.data);
        // Auto-fill from directory
        const names = data.data.name.split(" ");
        if (names.length >= 2 && !fFirst) {
          setFFirst(names[0]);
          setFLast(names[names.length - 1]);
          if (names.length > 2) {
            setFMiddle(names.slice(1, -1).join(" "));
          }
        }
        if (data.data.department && !fDept) {
          setFDept(data.data.department);
        }
        // Directory data is PREFILL ONLY per RBAC Ground Truth
        setMsg(`✓ Email verified from directory (${data.data.position}). Note: Department and position data is for reference only. Actual roles are assigned via official roster.`);
      } else {
        setEmailDirectoryData(null);
        setMsg("Email not found in directory. You can still register with any institutional email.");
      }
    } catch {
      setEmailDirectoryData(null);
    } finally {
      setEmailCheckLoading(false);
    }
  }

  // ================== FACULTY REGISTER ==================
  async function registerFaculty(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    // Name should be auto-filled from directory check
    const fullName = [fFirst, fMiddle, fLast, fSuffix]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (!fullName) {
      setErr("Please enter a valid institutional email first to auto-fill your name.");
      return;
    }
    if (!fDept) {
      setErr("Please select your department / office.");
      return;
    }
    if (!fEmail.trim() || !emailRegex.test(fEmail.trim())) {
      setErr("Please use a valid email address.");
      return;
    }
    const pwErr = validatePassword(fPw);
    if (pwErr) {
      setErr(pwErr);
      return;
    }
    if (fPw !== fPwConfirm) {
      setErr("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Check if email is institutional
      const isInstitutional = fEmail.trim().toLowerCase().endsWith("@mseuf.edu.ph") || 
                              fEmail.trim().toLowerCase().endsWith("@student.mseuf.edu.ph");
      
      // ALL institutional emails default to "faculty" role
      // Only super admins can change roles later (head, admin, etc.)
      const defaultRole = isInstitutional ? "faculty" : "faculty";

      // 1) supabase sign up (RBAC Ground Truth: role assigned via admin only)
      const { error } = await supabase.auth.signUp({
        email: fEmail.trim(),
        password: fPw,
        options: {
          data: {
            full_name: fullName,
            department: fDept,
            role: defaultRole,  // Everyone starts as faculty/staff
            // NO role selection - roles are assigned by administrators only
          },
        },
      });

      if (error) {
        setErr(error.message);
        return;
      }

      setJustSignedUpEmail(fEmail.trim());

      // 2) app DB (best-effort lang)
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fEmail.trim(),
          full_name: fullName,
          department: fDept,
          birthdate: fBirthdate || null,
          address: fAddress || null,
          role: defaultRole, // Always faculty/staff by default
          // NO role selection - Ground Truth RBAC: roles assigned via admin only
        }),
      }).catch(() => {});

      setMsg(
        "Account created successfully! Please check your email to confirm. Your role is set to Faculty/Staff by default. If you need a different role (e.g., Department Head, Admin), please contact your administrator."
      );
    } catch (e: any) {
      setErr(e?.message ?? "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  // ================== DRIVER (DEV FLOW) ==================
  function driverSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const normalized = normalizePhone(dPhone);
    if (!/^\+63\d{10}$/.test(normalized)) {
      setErr("Please enter a valid PH mobile (e.g., 09XXXXXXXXX).");
      return;
    }
    // dev: code = 1234
    setMsg("Dev mode: use code 1234 to continue.");
    setDStep("otp");
  }

  function driverVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (dOtp.trim() !== "1234") {
      setErr("Invalid code. (Dev mode: the code is 1234)");
      return;
    }

    const normalized = normalizePhone(dPhone);
    setVerifiedPhone(normalized);
    setDStep("profile");
  }

  async function driverSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!verifiedPhone) {
      setErr("Missing verified phone. Please restart driver signup.");
      return;
    }
    if (!dFirst.trim() || !dLast.trim()) {
      setErr("Please enter your first and last name.");
      return;
    }
    if (!dAddress.trim()) {
      setErr("Please enter your address.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/dev/driver/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: verifiedPhone,
          first_name: dFirst,
          middle_name: dMiddle || null,
          last_name: dLast,
          suffix: dSuffix || null,
          address: dAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save driver profile.");

      setMsg("Driver profile saved. Please wait for admin approval.");
    } catch (e: any) {
      setErr(e.message ?? "Could not save driver profile.");
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    if (!justSignedUpEmail) return;
    setErr(null);
    setMsg(null);

    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: justSignedUpEmail,
      });
      if (error) throw error;
      setMsg("Confirmation email sent. Please check your inbox (and spam).");
    } catch (e: any) {
      setErr(e.message ?? "Could not resend confirmation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <RegisterView
      role={role}
      setRole={setRole}
      loading={loading}
      err={err}
      msg={msg}
      onResend={justSignedUpEmail ? resendConfirmation : undefined}
      /* faculty */
      fFirst={fFirst}
      setFFirst={setFFirst}
      fMiddle={fMiddle}
      setFMiddle={setFMiddle}
      fLast={fLast}
      setFLast={setFLast}
      fSuffix={fSuffix}
      setFSuffix={setFSuffix}
      fDept={fDept}
      setFDept={setFDept}
      fBirthdate={fBirthdate}
      setFBirthdate={setFBirthdate}
      fAddress={fAddress}
      setFAddress={setFAddress}
      fEmail={fEmail}
      setFEmail={setFEmail}
      fPw={fPw}
      setFPw={setFPw}
      fPwConfirm={fPwConfirm}
      setFPwConfirm={setFPwConfirm}
      onFacultySubmit={registerFaculty}
      onEmailBlur={checkEmailDirectory}
      emailCheckLoading={emailCheckLoading}
      /* driver */
      dStep={dStep}
      dPhone={dPhone}
      setDPhone={setDPhone}
      dOtp={dOtp}
      setDOtp={setDOtp}
      dFirst={dFirst}
      setDFirst={setDFirst}
      dMiddle={dMiddle}
      setDMiddle={setDMiddle}
      dLast={dLast}
      setDLast={setDLast}
      dSuffix={dSuffix}
      setDSuffix={setDSuffix}
      dAddress={dAddress}
      setDAddress={setDAddress}
      verifiedPhone={verifiedPhone}
      onDriverSendOtp={driverSendOtp}
      onDriverVerify={driverVerifyOtp}
      onDriverSave={driverSaveProfile}
    />
  );
}
