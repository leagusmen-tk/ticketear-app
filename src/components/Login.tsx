import { useState } from "react";
import { supabase } from "../services/supabaseClient";

type Mode = "signin" | "signup";

function traducirErrorSupabase(mensajeError: string): string {
  const errorLimpio = mensajeError.toLowerCase();

  if (errorLimpio.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos. Revisá tus datos.";
  }
  if (errorLimpio.includes("user already registered")) {
    return "Este correo ya se encuentra registrado en el sistema.";
  }
  if (errorLimpio.includes("password should be at least")) {
    return "La contraseña es muy débil. Debe tener al menos 6 caracteres.";
  }
  
  return "Ocurrió un error inesperado. Contactá al soporte.";
}

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
  if (error) {
    setError(traducirErrorSupabase(error.message));
  }
};

const handleRecuperarPassword = async () => {
    // 1. Verificamos que el usuario haya escrito su mail antes de hacer clic
    if (!email) {
      setError("Por favor, escribí tu correo arriba para enviarte el enlace de recuperación.");
      return;
    }

    setLoading(true);
    // 2. Le pedimos a Supabase que mande el correo mágico
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Como no tenés router, lo mandamos simplemente a la raíz de tu proyecto
      redirectTo: window.location.origin, 
    });
    console.log("Error original de Supabase:", error);
    setLoading(false);

    // 3. Manejamos la respuesta
    if (error) {
      setError(traducirErrorSupabase(error.message)); // Reutilizamos tu traductor
    } else {
      // Borramos cualquier error previo y le avisamos que revise la casilla
      setError("");
      alert("¡Revisá tu casilla! Te enviamos un enlace para recuperar tu contraseña."); 
      // Nota: Si tenés importado 'toast' de Sonner en este archivo, podés cambiar el alert por:
      // toast.success("¡Revisá tu casilla! Te enviamos un enlace.");
    }
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
      // ACÁ ESTÁ EL CAMBIO:
      setError(traducirErrorSupabase(error.message));
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      setError("Usuario creado, pero no pude obtener el ID.");
      return;
    }

    setLoading(false);

    setError("Usuario creado. Ahora iniciá sesión.");
    setMode("signin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        
        {/* Pestañas superiores: LIMPIAS (sacamos el botón de acá) */}
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
          className="w-full mt-1 mb-2 rounded-xl border border-slate-300 px-3 py-2" // Bajamos el margin-bottom
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />

        {/* UBICACIÓN NUEVA: Debajo de contraseña, solo en Sign In */}
        {mode === "signin" && (
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={handleRecuperarPassword}
              disabled={loading}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors bg-transparent border-none cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

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