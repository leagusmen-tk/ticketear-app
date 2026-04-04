import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { User, Users, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Ticket } from "../types/ticket";

type TechnicianOption = { id: string; label: string };

type SortType = "alphabetical" | "tickets";
type SortOrder = "asc" | "desc";

interface TechnicianStats {
  id: string;
  name: string;
  ticketsCount: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
}

interface TechniciansDashboardProps {
  tickets: Ticket[];
  technicians: TechnicianOption[];
  techniciansLoading?: boolean;
  techniciansError?: string | null;
}

export function TechniciansDashboard({
  tickets,
  technicians,
  techniciansLoading = false,
  techniciansError = null,
}: TechniciansDashboardProps) {
  const [sortType, setSortType] = useState<SortType>("tickets");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // ✅ Handlers SIN (v: Type) que rompe TS/shadcn
  const handleSortTypeChange = (value: string) => {
    setSortType(value as SortType);
  };

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value as SortOrder);
  };

  const unassignedTicketsCount = useMemo(() => {
    return tickets.filter((t) => !t.assignedToId).length;
  }, [tickets]);

  const technicianStats = useMemo((): TechnicianStats[] => {
    return (technicians ?? []).map((tech) => {
      const assignedTickets = tickets.filter((t) => t.assignedToId === tech.id);

      return {
        id: tech.id,
        name: tech.label,
        ticketsCount: assignedTickets.length,
        openTickets: assignedTickets.filter((t) => t.estado === "Abierto").length,
        inProgressTickets: assignedTickets.filter((t) => t.estado === "En Progreso").length,
        closedTickets: assignedTickets.filter((t) => t.estado === "Cerrado" || t.estado === "Resuelto").length,
        highPriorityTickets: assignedTickets.filter((t) => t.prioridad === "Alta").length,
      };
    });
  }, [tickets, technicians]);

  const totalAssignedTickets = useMemo(() => {
    return technicianStats.reduce((sum, t) => sum + t.ticketsCount, 0);
  }, [technicianStats]);

  const averageTicketsPerTechnician = useMemo(() => {
    if (!technicianStats.length) return 0;
    return Math.round((totalAssignedTickets / technicianStats.length) * 10) / 10;
  }, [technicianStats.length, totalAssignedTickets]);

  const maxTickets = useMemo(() => {
    const m = Math.max(0, ...technicianStats.map((t) => t.ticketsCount));
    return Math.max(1, m);
  }, [technicianStats]);

  const sortedTechnicians = useMemo(() => {
    const sorted = [...technicianStats].sort((a, b) => {
      if (sortType === "alphabetical") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      return sortOrder === "asc" ? a.ticketsCount - b.ticketsCount : b.ticketsCount - a.ticketsCount;
    });
    return sorted;
  }, [technicianStats, sortType, sortOrder]);

  return (
    <div className="space-y-6">
      {techniciansLoading && (
        <Card>
          <CardContent className="py-6 text-slate-600">Cargando técnicos…</CardContent>
        </Card>
      )}

      {!!techniciansError && (
        <Card>
          <CardContent className="py-6 text-red-600">
            No se pudieron cargar los técnicos: {techniciansError}
          </CardContent>
        </Card>
      )}

    {/* ===== SECCIÓN MEDIA REMODELADA: Gráfico y Controles Lado a Lado ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Columna 1 y 2 (lg:col-span-2): EL GRÁFICO (lo mantenemos pro y grande) */}
        <Card className="lg:col-span-2 h-full flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle>Carga de Trabajo por Técnico</CardTitle>
            <CardDescription>Distribución de tickets según su estado</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow pt-0">
            {/* Reducimos un poquito la altura (height: 300) para compactar el dashboard general */}
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={technicianStats}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}} 
                    contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '15px'}} />
                  <Bar name="Abiertos" dataKey="openTickets" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
                  <Bar name="En Progreso" dataKey="inProgressTickets" stackId="a" fill="#fbbf24" />
                  <Bar name="Cerrados" dataKey="closedTickets" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Columna 3: NUEVOS CONTROLES COMPACTOS Y RESUMEN DE PRIORIDAD */}
        <div className="space-y-6">
          {/* Card de Controles super compacta (Sidebar style) */}
          <Card>
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Ajustes de Vista
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 block">Ordenar por:</label>
                <Select value={sortType} onValueChange={handleSortTypeChange}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alphabetical">Orden Alfabético</SelectItem>
                    <SelectItem value="tickets">Cantidad de Tickets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 block">Dirección:</label>
                <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">
                      {sortType === "alphabetical" ? "A → Z" : "Menor → Mayor"}
                    </SelectItem>
                    <SelectItem value="desc">
                      {sortType === "alphabetical" ? "Z → A" : "Mayor → Menor"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sumamos una mini-card extra para aprovechar el espacio lateral: Tickets Críticos */}
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-600" />
                Total Tickets Alta Prioridad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">
                {technicianStats.reduce((sum, t) => sum + t.highPriorityTickets, 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lista de técnicos */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sortedTechnicians.map((tech, index) => (
          <Card key={tech.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tech.name}</CardTitle>
                    <CardDescription>
                      {tech.ticketsCount === 1 ? "1 ticket asignado" : `${tech.ticketsCount} tickets asignados`}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {sortType === "tickets" && (
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  )}
                  {sortType === "tickets" ? (
                    sortOrder === "asc" ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )
                  ) : null}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Abiertos:</span>
                    <Badge variant="destructive" className="text-xs">
                      {tech.openTickets}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-600">En Progreso:</span>
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                      {tech.inProgressTickets}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-600">Cerrados:</span>
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                      {tech.closedTickets}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-600">Alta Prioridad:</span>
                    <Badge variant="destructive" className="text-xs">
                      {tech.highPriorityTickets}
                    </Badge>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(tech.ticketsCount / maxTickets) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!techniciansLoading && !techniciansError && technicianStats.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No hay técnicos para mostrar.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
