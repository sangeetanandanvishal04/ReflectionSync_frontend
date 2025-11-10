// src/pages/auth/Login.tsx
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

type Form = { email: string; password: string };

export default function Login() {
  const { register, handleSubmit } = useForm<Form>();
  const auth = useAuth();
  const nav = useNavigate();

  async function onSubmit(values: Form) {
    try {
      await auth.login(values.email, values.password);
      nav("/");
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || "Login failed");
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Login</h3>
      <p className="hint" style={{ marginTop: 0 }}>Sign in to your account</p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 12 }}>
        <div className="field">
          <label>Email</label>
          <input {...register("email", { required: true })} type="email" placeholder="you@example.com" />
        </div>

        <div className="field">
          <label>Password</label>
          <input {...register("password", { required: true })} type="password" placeholder="Your password" />
        </div>

        <div className="row-between" style={{ marginTop: 14 }}>
          <button type="submit" className="btn btn-primary">Login</button>
          <Link to="/auth/forgot" className="link">Forgot?</Link>
        </div>

        <div style={{ marginTop: 12, fontSize: 14 }}>
          New here? <Link to="/signup" className="link">Create an account</Link>
        </div>
      </form>
    </div>
  );
}
