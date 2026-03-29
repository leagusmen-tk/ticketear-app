import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { User, LogOut, Pencil } from "lucide-react";

type Role = "admin" | "technician" | string;

interface HeaderProps {
  userName: string;
  userEmail: string;
  role: Role;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export function Header({ userName, userEmail, role, onOpenProfile, onLogout }: HeaderProps) {
  const roleLabel = role === "admin" ? "Administrador" : "Técnico";

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">ADIDAS</h1>
            <div className="hidden sm:block w-px h-6 bg-gray-300" />
            <p className="hidden sm:block text-gray-600">Sistema de Gestión de Tickets</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Perfil */}
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600" />
              </div>

              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
                <div className="mt-1">
                  <Badge variant="secondary" className="text-[11px]">
                    {roleLabel}
                  </Badge>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={onOpenProfile}
                className="ml-2 flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Ajustes</span>
              </Button>
            </div>

            {/* Logout */}
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
