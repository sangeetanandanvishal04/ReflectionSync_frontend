// src/pages/auth/OTPVerification.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

type Form = { email: string; otp: string };

export default function OTPVerification() {
  const { register, handleSubmit, setValue } = useForm<Form>();
  const auth = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  // If user came from ForgotPassword, email may be in state
  React.useEffect(() => {
    const emailFromState = (loc.state as any)?.email;
    if (emailFromState) setValue("email", emailFromState);
  }, [loc.state, setValue]);

  async function onSubmit(values: Form) {
    try {
      await auth.verifyOtp(values.email, values.otp);
      alert("OTP verified. Now set your new password.");
      nav("/auth/reset", { state: { email: values.email } });
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || "Invalid OTP");
    }
  }

  async function handleResend() {
    try {
      const email = (loc.state as any)?.email;
      if (!email) {
        alert("Please enter your email above before resending.");
        return;
      }
      await auth.resendOtp(email);
      alert("A new OTP has been sent if the email is registered.");
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || "Failed to resend OTP");
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>OTP Verification</h3>
      <p className="hint" style={{ marginTop: 0 }}>Enter the code we sent to your email.</p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 12 }}>
        <div className="field">
          <label>Email</label>
          <input {...register("email", { required: true })} type="email" placeholder="you@example.com" />
        </div>

        <div className="field">
          <label>OTP</label>
          <input {...register("otp", { required: true })} type="text" placeholder="e.g. 5294" />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
          <button className="btn btn-primary" type="submit">Verify OTP</button>
          <button type="button" onClick={handleResend} className="btn btn-ghost">Resend OTP</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <Link to="/login" className="link">Back to Login</Link>
        </div>
      </form>
    </div>
  );
}