import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { User, LogOut } from "lucide-react";

interface HeaderProps {
  onLogout: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">ADIDAS</h1>
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
            <p className="hidden sm:block text-gray-600">Sistema de Gestión de Tickets</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">Matías Gómez</p>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      Administrador
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

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