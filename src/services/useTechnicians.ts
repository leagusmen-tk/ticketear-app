import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export type TechnicianOption = { id: string; label: string };

export function useTechnicians(enabled: boolean) {
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!enabled) {
        setTechnicians([]);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("role", "technician")
        .order("full_name", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("useTechnicians error:", error);
        setError(error.message);
        setTechnicians([]);
        setLoading(false);
        return;
      }


      const mapped: TechnicianOption[] = (data ?? []).map((p: any) => {
        const full = String(p.full_name ?? "").trim();
        const mail = String(p.email ?? "").trim();

        const label =
          full ||
          (mail ? `${mail.split("@")[0]} (${mail})` : `Técnico (${String(p.id).slice(0, 6)})`);

        return { id: String(p.id), label };
      });


      setTechnicians(mapped);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { technicians, loading, error };
}
