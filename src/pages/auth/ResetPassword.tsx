// src/pages/auth/ResetPassword.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

type Form = { email: string; new_password: string; confirm_password: string };

export default function ResetPassword() {
  const { register, handleSubmit, setValue } = useForm<Form>();
  const auth = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  React.useEffect(() => {
    const emailFromState = (loc.state as any)?.email;
    if (emailFromState) setValue("email", emailFromState);
  }, [loc.state, setValue]);

  async function onSubmit(values: Form) {
    if (values.new_password !== values.confirm_password) {
      alert("Passwords do not match");
      return;
    }
    try {
      await auth.resetPassword(values.email, values.new_password, values.confirm_password);
      alert("Password reset successful — please log in with your new password.");
      nav("/login");
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || "Password reset failed");
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Reset Password</h3>
      <p className="hint" style={{ marginTop: 0 }}>Set a new password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 12 }}>
        <div className="field">
          <label>Email</label>
          <input {...register("email", { required: true })} type="email" placeholder="you@example.com" />
        </div>

        <div className="field">
          <label>New password</label>
          <input {...register("new_password", { required: true })} type="password" />
        </div>

        <div className="field">
          <label>Confirm new password</label>
          <input {...register("confirm_password", { required: true })} type="password" />
        </div>

        <div style={{ marginTop: 10 }}>
          <button className="btn btn-primary" type="submit">Reset password</button>
          <Link to="/login" style={{ marginLeft: 12 }} className="link">Back to login</Link>
        </div>
      </form>
    </div>
  );
}