import { useMemo, useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { useProfile } from "../services/useProfile";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session;
};

export function ProfileDialog({ open, onOpenChange, session }: Props) {
  const { profile, loading, error, updateFullName, changePassword } = useProfile(session);

  const email = useMemo(() => session.user.email ?? "", [session.user.email]);

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [localErr, setLocalErr] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setName(profile.full_name ?? "");
  }, [profile]);

  const onSaveName = async () => {
    setLocalErr(null);
    setOkMsg(null);

    if (!name.trim()) {
      setLocalErr("El nombre no puede estar vacío.");
      return;
    }

    setSavingName(true);
    const res = await updateFullName(name.trim());
    setSavingName(false);

    if (res.ok) setOkMsg(res.message);
    else setLocalErr(res.message);
  };

  const onChangePassword = async () => {
    setLocalErr(null);
    setOkMsg(null);

    if (newPass.length < 8) {
      setLocalErr("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPass !== newPass2) {
      setLocalErr("Las contraseñas no coinciden.");
      return;
    }

    setSavingPass(true);
    const res = await changePassword(newPass);
    setSavingPass(false);

    if (res.ok) {
      setOkMsg(res.message);
      setNewPass("");
      setNewPass2("");
    } else {
      setLocalErr(res.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Mi perfil</DialogTitle>
          <DialogDescription>Actualizá tu nombre y tu contraseña.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">Rol</div>
            <Badge variant="secondary">{profile?.role ?? "—"}</Badge>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-700">Email (no editable)</label>
            <Input value={email} readOnly className="bg-slate-50" />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-700">Nombre completo</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <Button onClick={onSaveName} disabled={savingName || loading} className="w-full">
              {savingName ? "Guardando..." : "Guardar nombre"}
            </Button>
          </div>

          <div className="border-t pt-4 space-y-2">
            <label className="text-sm text-slate-700">Nueva contraseña</label>
            <Input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
            />

            <label className="text-sm text-slate-700">Repetir nueva contraseña</label>
            <Input
              type="password"
              value={newPass2}
              onChange={(e) => setNewPass2(e.target.value)}
              autoComplete="new-password"
              placeholder="Repetí la contraseña"
            />

            <Button onClick={onChangePassword} disabled={savingPass || loading} variant="outline" className="w-full">
              {savingPass ? "Actualizando..." : "Cambiar contraseña"}
            </Button>
          </div>

          {(error || localErr) && <div className="text-sm text-red-600">{localErr ?? error}</div>}
          {okMsg && <div className="text-sm text-green-700">{okMsg}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
