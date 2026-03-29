import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { TicketsTable } from "./components/TicketsTable";
import { TechniciansDashboard } from "./components/TechniciansDashboard";
import { Login } from "./components/Login";
import { Header } from "./components/Header";
import { ProfileDialog } from "./components/ProfileDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

import { supabase } from "./services/supabaseClient";
import { useTickets } from "./services/useTickets";
import { useTechnicians } from "./services/useTechnicians";
import { useProfile } from "./services/useProfile";
import { useIsAdmin } from "./services/useIsAdmin";

import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [openProfile, setOpenProfile] = useState(false);

  // Derivado del estado (se puede usar en hooks sin problema)
  const isAuthenticated = !!session;

  const { isAdmin } = useIsAdmin(isAuthenticated);

  // --- DATA (hooks SIEMPRE arriba, nunca dentro de useEffect) ---
  const {
    technicians,
    loading: techniciansLoading,
    error: techniciansError,
  } = useTechnicians(isAuthenticated);

  const {
    tickets: ticketsState,
    setTickets,
    loading: ticketsLoading,
    error: ticketsError,
    updateTicket,
    appendComment,
    createTicket,
  } = useTickets(isAuthenticated, isAdmin);

  // --- PERFIL ---
  const { profile } = useProfile(session);

  const userEmail = useMemo(() => session?.user?.email ?? "", [session?.user?.email]);
  const userName = useMemo(() => profile?.full_name ?? "Usuario", [profile?.full_name]);
  const role = useMemo(() => profile?.role ?? "technician", [profile?.role]);
 const currentUserId = useMemo(() => session?.user?.id ?? "", [session?.user?.id]);


  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error("getSession error:", error);
      setSession(data.session ?? null);
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Intento normal (puede tirar 403 y está ok)
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("signOut error:", e);
    } finally {
      // Limpieza de tokens (te desloguea sí o sí)
      try {
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith("sb-") && k.endsWith("-auth-token")) localStorage.removeItem(k);
        }
        for (const k of Object.keys(sessionStorage)) {
          if (k.startsWith("sb-") && k.endsWith("-auth-token")) sessionStorage.removeItem(k);
        }
      } catch (e) {
        console.warn("storage cleanup error:", e);
      }

      // Baja sesión en UI y recarga para resetear todo
      setSession(null);
      window.location.reload();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        userName={userName}
        userEmail={userEmail}
        role={role}
        onOpenProfile={() => setOpenProfile(true)}
        onLogout={handleLogout}
      />

      {session && (
        <ProfileDialog open={openProfile} onOpenChange={setOpenProfile} session={session} />
      )}

      <main className="max-w-6xl mx-auto flex-grow p-4">
  <Tabs defaultValue="tickets" className="w-full">
  <TabsList className={`grid w-full ${isAdmin ? "grid-cols-2" : "grid-cols-1"} mb-6`}>
    <TabsTrigger value="tickets">Gestión de Tickets</TabsTrigger>

    {isAdmin && <TabsTrigger value="technicians">Dashboard Técnicos</TabsTrigger>}
  </TabsList>

  <TabsContent value="tickets" className="space-y-6">
    <p className="text-slate-600">Gestioná y buscá tickets de soporte</p>

    <TicketsTable
      tickets={ticketsState ?? []}
      setTickets={setTickets}
      technicians={technicians}
      isAdmin={isAdmin}
      currentUserId={session?.user?.id ?? ""}
      currentUserName={userName}
      techniciansLoading={techniciansLoading}
      techniciansError={techniciansError}
      updateTicket={updateTicket}
      appendComment={appendComment}
      createTicket={createTicket}
    />
  </TabsContent>

  {isAdmin && (
    <TabsContent value="technicians" className="space-y-6">
      <p className="text-slate-600">Visualizá la carga de trabajo y estadísticas de cada técnico</p>

      <TechniciansDashboard
        tickets={ticketsState ?? []}
        technicians={technicians}
        techniciansLoading={techniciansLoading}
        techniciansError={techniciansError}
      />
    </TabsContent>
  )}
</Tabs>

      </main>

      <footer className="text-center py-4 text-slate-600 text-sm">
        Software designed by Garin SRL
      </footer>

      <Toaster />
    </div>
  );
}
