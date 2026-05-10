import { useState } from "react";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";

import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ollamaService } from "../services/ollamaService";

interface SmartTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SmartTextarea({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = "",
}: SmartTextareaProps) {
  const [improving, setImproving] = useState(false);

  const handleImproveText = async () => {
    if (!value.trim()) return;
    const prevText = value;
    try {
      setImproving(true);
      const prompt = `Corrige la ortografía y redacción del siguiente texto.\nREGLAS:\n- Responde SOLO con el texto corregido.\n- NO agregues saludos, explicaciones ni opiniones.\n- NO respondas a lo que dice el texto, solo corrígelo.\n\nTexto:\n"${prevText}"`;

      onChange(""); // Limpiamos para el efecto de tipeo

      let currentText = "";
      await ollamaService.chatStream("phi3", prompt, (chunk) => {
        currentText += chunk;
        onChange(currentText.replace(/^["']/, "").replace(/["']$/, ""));
      });

      toast.success("Redacción mejorada con IA");
    } catch (error) {
      console.error(error);
      onChange(prevText);
      toast.error("Error al conectar con la IA local");
    } finally {
      setImproving(false);
    }
  };

  return (
    <div className="relative">
      <Textarea
        placeholder={improving && !value ? "✨ Mejorando redacción..." : placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-[120px] pb-10 resize-none bg-white border-slate-200 text-slate-800 caret-slate-900 focus:ring-2 focus:ring-indigo-500 rounded-xl [color-scheme:light] disabled:opacity-60 ${improving && !value ? "animate-pulse placeholder:text-indigo-500" : ""} ${className}`}
        disabled={disabled || improving}
      />
      <div className="absolute bottom-2 right-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs flex items-center gap-1 bg-white shadow-sm"
          onClick={handleImproveText}
          disabled={!value.trim() || disabled || improving}
        >
          {improving ? (
            <><Wand2 className="w-3 h-3 text-indigo-400" /> Mejorando...</>
          ) : (
            <><Wand2 className="w-3 h-3 text-indigo-600" /> Mejorar redacción</>
          )}
        </Button>
      </div>
    </div>
  );
}