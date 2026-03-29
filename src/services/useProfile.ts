import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "technician" | string;
};

type ActionResult = { ok: true; message: string } | { ok: false; message: string };

export function useProfile(session: Session | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.id ?? null;
  const email = session?.user?.email ?? null;

  // CARGA PERFIL
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);

      if (!userId) {
        setProfile(null);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,full_name,role")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("useProfile load error:", error);
        setError(error.message);
        setProfile(null);
      } else {
        setProfile((data as Profile) ?? null);
      }

      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ACTUALIZAR NOMBRE
  const updateFullName = async (fullName: string): Promise<ActionResult> => {
    setError(null);

    if (!userId) return { ok: false, message: "No hay sesión activa." };
    if (!fullName.trim()) return { ok: false, message: "El nombre no puede estar vacío." };

    // 1) Guardar en profiles
    // Si profile existe => update
    // Si NO existe => insert (con role default technician)
    if (profile) {
      const { error: e1 } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", userId);

      if (e1) {
        console.error("profiles update error:", e1);
        setError(e1.message);
        return { ok: false, message: e1.message };
      }
    } else {
      const { error: e2 } = await supabase.from("profiles").insert({
        id: userId,
        email,
        full_name: fullName.trim(),
        role: "technician",
      });

      if (e2) {
        console.error("profiles insert error:", e2);
        setError(e2.message);
        return { ok: false, message: e2.message };
      }
    }

    // 2) (Opcional) guardar también en metadata de auth.users
    // (sirve para tenerlo disponible en session.user.user_metadata)
    const { error: e3 } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });

    if (e3) {
      // No lo consideramos fatal: el perfil ya se guardó.
      console.warn("auth updateUser metadata warning:", e3.message);
    }

    // Refrescar estado local
    setProfile((prev) => ({
      id: userId,
      email: email ?? prev?.email ?? null,
      full_name: fullName.trim(),
      role: prev?.role ?? "technician",
    }));

    return { ok: true, message: "Nombre actualizado." };
  };

  // CAMBIAR CONTRASEÑA
  const changePassword = async (newPassword: string): Promise<ActionResult> => {
    setError(null);

    if (!userId) return { ok: false, message: "No hay sesión activa." };
    if (!newPassword || newPassword.length < 8) {
      return { ok: false, message: "La contraseña debe tener al menos 8 caracteres." };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      console.error("changePassword error:", error);
      setError(error.message);
      return { ok: false, message: error.message };
    }

    return { ok: true, message: "Contraseña actualizada." };
  };

  return { profile, loading, error, updateFullName, changePassword };
}
