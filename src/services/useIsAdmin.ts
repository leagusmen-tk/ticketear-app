import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export function useIsAdmin(enabled: boolean) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enabled) {
        setIsAdmin(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase.rpc("is_admin");
      if (cancelled) return;

      if (error) {
        console.error("useIsAdmin error:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { isAdmin, loading };
}
