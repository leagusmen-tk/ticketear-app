import { useState } from "react";
import { supabase } from "../services/supabaseClient";

type Mode = "signin" | "signup";

export function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) setError(error.message);
  };

  const handleSignUp = async () => {
    setError(null);

    if (!fullName.trim()) {
      setError("Ingresá tu nombre completo.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      setError("Usuario creado, pero no pude obtener el ID.");
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName.trim(),
          role: "technician",
        },
        { onConflict: "id" }
      );

    setLoading(false);

    if (profileError) {
      console.error("profiles upsert error:", profileError);
      setError("Usuario creado, pero no pude guardar el perfil. Revisá policies/RLS.");
      return;
    }

    setError("Usuario creado. Ahora iniciá sesión.");
    setMode("signin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 py-2 text-sm font-semibold ${
              mode === "signin" ? "bg-indigo-600 text-white" : "bg-white text-slate-700"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 text-sm font-semibold ${
              mode === "signup" ? "bg-indigo-600 text-white" : "bg-white text-slate-700"
            }`}
          >
            Crear cuenta
          </button>
        </div>

        <h1 className="text-2xl font-semibold text-center mb-2">
          {mode === "signin" ? "Iniciar Sesión" : "Crear Cuenta"}
        </h1>
        <p className="text-slate-600 text-center mb-6">
          {mode === "signin"
            ? "Accedé con tu usuario"
            : "Registrate y empezá a usar el sistema"}
        </p>

        {mode === "signup" && (
          <>
            <label className="text-sm text-slate-700">Nombre completo</label>
            <input
              className="w-full mt-1 mb-4 rounded-xl border border-slate-300 px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </>
        )}

        <label className="text-sm text-slate-700">Email</label>
        <input
          className="w-full mt-1 mb-4 rounded-xl border border-slate-300 px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <label className="text-sm text-slate-700">Contraseña</label>
        <input
          className="w-full mt-1 mb-4 rounded-xl border border-slate-300 px-3 py-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        <button
          onClick={mode === "signin" ? handleSignIn : handleSignUp}
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 text-white py-2 font-semibold disabled:opacity-60"
        >
          {loading ? "Cargando..." : mode === "signin" ? "Iniciar Sesión" : "Crear cuenta"}
        </button>
      </div>
    </div>
  );
}
