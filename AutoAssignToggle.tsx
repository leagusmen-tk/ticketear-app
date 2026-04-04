import { useEffect, useState } from "react";
import { supabase } from "c:/Users/leagu/OneDrive/Escritorio/Ticketear/src/services/supabaseClient";
import { toast } from "sonner";
import { Bot, Loader2 } from "lucide-react";

interface AutoAssignToggleProps {
  isAdmin: boolean;
}

export function AutoAssignToggle({ isAdmin }: AutoAssignToggleProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Buscar el estado inicial al cargar
  useEffect(() => {
    if (!isAdmin) return;

    const fetchFlag = async () => {
      try {
        const { data, error } = await supabase
          .from("feature_flags")
          .select("is_enabled")
          .eq("name", "balanceo_automatico")
          .single();

        if (error) throw error;
        setIsEnabled(data.is_enabled);
      } catch (error) {
        console.error("Error al cargar el flag:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlag();
  }, [isAdmin]);

  // 2. Función para actualizar la base de datos
  const toggleFlag = async () => {
    try {
      setIsUpdating(true);
      const newValue = !isEnabled;

      const { error } = await supabase
        .from("feature_flags")
        .update({ is_enabled: newValue })
        .eq("name", "balanceo_automatico");

      if (error) throw error;

      setIsEnabled(newValue);
      toast.success(
        newValue 
          ? "Balanceo automático ACTIVADO" 
          : "Balanceo automático DESACTIVADO"
      );
    } catch (error) {
      toast.error("No se pudo actualizar la configuración");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Si no es admin, ni siquiera renderizamos el componente
  if (!isAdmin) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Balanceo de carga inteligente
          </h3>
          <p className="text-xs text-slate-500">
            Asigna automáticamente los tickets nuevos al técnico con menos trabajo.
          </p>
        </div>
      </div>

      <button
        onClick={toggleFlag}
        disabled={isLoading || isUpdating}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          isEnabled ? "bg-indigo-600" : "bg-slate-200"
        } ${isLoading || isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isEnabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
        {(isLoading || isUpdating) && (
          <span className="absolute -left-6">
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          </span>
        )}
      </button>
    </div>
  );
}