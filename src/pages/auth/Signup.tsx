// src/pages/auth/Signup.tsx
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate, Link } from "react-router-dom";

type Form = { email: string; password: string; confirm_password: string };

export default function Signup() {
  const { register, handleSubmit } = useForm<Form>();
  const auth = useAuth();
  const nav = useNavigate();

  async function onSubmit(values: Form) {
    if (values.password !== values.confirm_password) {
      alert("Passwords do not match");
      return;
    }
    try {
      await auth.signup(values.email, values.password);
      alert("Signup successful. Please log in.");
      nav("/login");
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || "Signup failed");
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Create account</h3>
      <p className="hint" style={{ marginTop: 0 }}>Register to manage floor plans</p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 12 }}>
        <div className="field">
          <label>Email</label>
          <input {...register("email", { required: true })} type="email" placeholder="you@example.com" />
        </div>

        <div className="field">
          <label>Password</label>
          <input {...register("password", { required: true })} type="password" />
        </div>

        <div className="field">
          <label>Confirm password</label>
          <input {...register("confirm_password", { required: true })} type="password" />
        </div>

        <div style={{ marginTop: 10 }}>
          <button className="btn btn-primary" type="submit">Sign up</button>
          <Link to="/login" style={{ marginLeft: 12 }} className="link">Already have account</Link>
        </div>
      </form>
    </div>
  );
}
