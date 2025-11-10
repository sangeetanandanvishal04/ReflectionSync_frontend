// src/pages/auth/ForgotPassword.tsx
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

type Form = { email: string };

export default function ForgotPassword() {
  const { register, handleSubmit } = useForm<Form>();
  const auth = useAuth();
  const nav = useNavigate();

  async function onSubmit(values: Form) {
    try {
      await auth.forgotPassword(values.email);
      alert("If the email is registered, an OTP has been sent. Proceed to OTP verification.");
      // navigate to OTP page and pass email in state
      nav("/auth/otp", { state: { email: values.email } });
    } catch (err: any) {
      // backend returns useful messages in err.response.data.detail sometimes
      alert(err?.response?.data?.detail || err?.message || "Error sending OTP");
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Forgot password</h3>
      <p className="hint" style={{ marginTop: 0 }}>
        Enter your registered email — we'll send a One-Time Password (OTP).
      </p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 12 }}>
        <div className="field">
          <label>Email</label>
          <input {...register("email", { required: true })} type="email" placeholder="you@example.com" />
        </div>

        <div className="row-between" style={{ marginTop: 10 }}>
          <button type="submit" className="btn btn-primary">Send OTP</button>
        </div>
      </form>
    </div>
  );
}