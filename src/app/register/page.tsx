// app/(auth)/register/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import RegisterView, { DriverStep, RolePick } from "./RegisterView";

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

<<<<<<< HEAD
  // Faculty
=======
  // Faculty state
>>>>>>> 8dd1516 (Working Registration (Minor tweaks needed))
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

<<<<<<< HEAD
  // Driver
=======
  // Driver state (dev OTP flow)
>>>>>>> 8dd1516 (Working Registration (Minor tweaks needed))
  const [dStep, setDStep] = useState<DriverStep>("phone");
  const [dPhone, setDPhone] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [dOtp, setDOtp] = useState("");
  const [dFirst, setDFirst] = useState("");
  const [dMiddle, setDMiddle] = useState("");
  const [dLast, setDLast] = useState("");
  const [dSuffix, setDSuffix] = useState("");
  const [dAddress, setDAddress] = useState("");

  // UI
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [justSignedUpEmail, setJustSignedUpEmail] = useState<string | null>(null);

  useEffect(() => {
    setMsg(null);
    setErr(null);
  }, [role]);

  async function registerFaculty(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const nameFull = [fFirst, fMiddle, fLast, fSuffix]
      .filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

    if (fFirst.trim().length < 1 || fLast.trim().length < 1) return setErr("Please enter your first and last name.");
    if (!emailRegex.test(fEmail)) return setErr("Please enter a valid email address.");
    if (!fBirthdate) return setErr("Please select your birthdate.");
    if (!fAddress.trim()) return setErr("Please enter your address.");
    const pwErr = validatePassword(fPw);
    if (pwErr) return setErr(pwErr);
    if (fPw !== fPwConfirm) return setErr("Passwords do not match.");

    try {
      setLoading(true);

<<<<<<< HEAD
      // quick duplicate check
      const dupRes = await supabase.auth.signInWithPassword({ email: fEmail, password: "__dummy__" });
      if (!dupRes.error) {
        setErr("This email is already registered. Please log in.");
        return;
      }

=======
      // sign up (no dummy precheck)
>>>>>>> 8dd1516 (Working Registration (Minor tweaks needed))
      const { error } = await supabase.auth.signUp({
        email: fEmail,
        password: fPw,
        options: {
          data: {
            role: "faculty",
            first_name: fFirst,
            middle_name: fMiddle || null,
            last_name: fLast,
            suffix: fSuffix || null,
            name_full: nameFull,         // goes to user_metadata (OK)
            department: fDept || null,
            birthdate: fBirthdate,
            address: fAddress,
          },
        },
      });

      if (error) {
        const m = (error.message || "").toLowerCase();
        if (m.includes("already")) {
          setErr("This email is already registered. Try logging in or resetting your password.");
          return;
        }
        if (m.includes("rate")) {
          setErr("Too many attempts. Please wait a few minutes and try again.");
          return;
        }
        setErr(error.message || "Sign up failed.");
        return;
      }

      setJustSignedUpEmail(fEmail);
      setMsg(
        "If this email is new, we sent a confirmation link. If it’s already registered, please check your inbox (and spam) or try logging in / resetting your password."
      );
    } catch (e: any) {
<<<<<<< HEAD
      setErr(e.message ?? "Registration failed.");
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
      const { error } = await supabase.auth.resend({ type: "signup", email: justSignedUpEmail });
      if (error) {
        const m = (error.message || "").toLowerCase();
        if (m.includes("already confirmed")) {
          setErr("This email is already confirmed. You can log in now.");
          return;
        }
        throw error;
      }
      setMsg("Confirmation email sent. Please check your inbox (and spam).");
    } catch (e: any) {
      setErr(e.message ?? "Could not resend confirmation.");
=======
      setErr(e?.message ?? "Registration failed.");
>>>>>>> 8dd1516 (Working Registration (Minor tweaks needed))
    } finally {
      setLoading(false);
    }
  }

  function driverSendOtp(e: React.FormEvent) {
    e.preventDefault();
<<<<<<< HEAD
    setErr(null);
    setMsg(null);
=======
    setErr(null); setMsg(null);
>>>>>>> 8dd1516 (Working Registration (Minor tweaks needed))
    const normalized = normalizePhone(dPhone);
    if (!/^\+63\d{10}$/.test(normalized)) {
      setErr("Please enter a valid PH mobile (e.g., 09XXXXXXXXX).");
      return;
    }
    setMsg("Dev mode: use code 1234 to continue.");
    setDStep("otp");
  }

  function driverVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
<<<<<<< HEAD
    setErr(null);
    setMsg(null);
=======
    setErr(null); setMsg(null);
>>>>>>> 8dd1516 (Working Registration (Minor tweaks needed))
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
    if (!verifiedPhone) return setErr("Missing verified phone. Please restart driver signup.");
    if (dFirst.trim().length < 1 || dLast.trim().length < 1) return setErr("Please enter your first and last name.");
    if (!dAddress.trim()) return setErr("Please enter your address.");

    try {
      setLoading(true);

      // NOTICE: we are NOT sending name_full or name_last_first here
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
      setMsg("Profile saved (dev). Your driver account is now pending admin approval.");
    } catch (e: any) {
      setErr(e.message ?? "Could not save profile.");
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
<<<<<<< HEAD
      onResend={justSignedUpEmail ? resendConfirmation : undefined}
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
=======
      onResend={justSignedUpEmail ? async () => {
        setErr(null); setMsg(null);
        try {
          setLoading(true);
          const { error } = await supabase.auth.resend({ type: "signup", email: justSignedUpEmail! });
          if (error) {
            const m = (error.message || "").toLowerCase();
            if (m.includes("already confirmed")) {
              setErr("This email is already confirmed. You can log in now.");
              return;
            }
            throw error;
          }
          setMsg("Confirmation email sent. Please check your inbox (and spam).");
        } catch (e: any) {
          setErr(e.message ?? "Could not resend confirmation.");
        } finally {
          setLoading(false);
        }
      } : undefined}

      /* faculty */
      fFirst={fFirst} setFFirst={setFFirst}
      fMiddle={fMiddle} setFMiddle={setFMiddle}
      fLast={fLast} setFLast={setFLast}
      fSuffix={fSuffix} setFSuffix={setFSuffix}
      fDept={fDept} setFDept={setFDept}
      fBirthdate={fBirthdate} setFBirthdate={setFBirthdate}
      fAddress={fAddress} setFAddress={setFAddress}
      fEmail={fEmail} setFEmail={setFEmail}
      fPw={fPw} setFPw={setFPw}
      fPwConfirm={fPwConfirm} setFPwConfirm={setFPwConfirm}
>>>>>>> 8dd1516 (Working Registration (Minor tweaks needed))
      onFacultySubmit={registerFaculty}
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
