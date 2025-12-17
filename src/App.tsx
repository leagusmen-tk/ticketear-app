import { useState } from "react";
import { TicketsTable } from "./components/TicketsTable";
import { TechniciansDashboard } from "./components/TechniciansDashboard";
import { Login } from "./components/Login";
import { Header } from "./components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { initialTickets, type Ticket } from "./data/tickets";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onLogout={handleLogout} />
      
      <main className="max-w-6xl mx-auto flex-grow p-4">
        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="tickets">Gestión de Tickets</TabsTrigger>
            <TabsTrigger value="technicians">Dashboard Técnicos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tickets" className="space-y-6">
            <div>
              <p className="text-slate-600">Gestioná y buscá tickets de soporte</p>
            </div>
            <TicketsTable tickets={tickets} setTickets={setTickets} />
          </TabsContent>
          
          <TabsContent value="technicians" className="space-y-6">
            <div>
              <p className="text-slate-600">Visualizá la carga de trabajo y estadísticas de cada técnico</p>
            </div>
            <TechniciansDashboard tickets={tickets} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="text-center py-4 text-slate-600 text-sm">
        Software designed by Garin SRL
      </footer>
    </div>
  );
}
