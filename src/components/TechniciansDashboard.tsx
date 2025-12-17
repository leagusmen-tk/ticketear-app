import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { User, Users, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { type Ticket, TECNICOS } from "../data/tickets";

const TECNICOS_ACTIVOS = TECNICOS.filter(tecnico => tecnico !== "Sin asignar");

type SortType = "alphabetical" | "tickets";
type SortOrder = "asc" | "desc";

interface TechnicianStats {
  name: string;
  ticketsCount: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
}

interface TechniciansDashboardProps {
  tickets: Ticket[];
}

export function TechniciansDashboard({ tickets }: TechniciansDashboardProps) {
  const [sortType, setSortType] = useState<SortType>("tickets");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Calcular estadísticas de cada técnico
  const technicianStats = useMemo((): TechnicianStats[] => {
    return TECNICOS_ACTIVOS.map(tecnico => {
      const assignedTickets = tickets.filter(ticket => ticket.asignado === tecnico);
      
      return {
        name: tecnico,
        ticketsCount: assignedTickets.length,
        openTickets: assignedTickets.filter(t => t.estado === "Abierto").length,
        inProgressTickets: assignedTickets.filter(t => t.estado === "En Progreso").length,
        closedTickets: assignedTickets.filter(t => t.estado === "Cerrado" || t.estado === "Resuelto").length,
        highPriorityTickets: assignedTickets.filter(t => t.prioridad === "Alta").length,
      };
    });
  }, [tickets]);

  // Ordenar los técnicos según los filtros seleccionados
  const sortedTechnicians = useMemo(() => {
    const sorted = [...technicianStats].sort((a, b) => {
      if (sortType === "alphabetical") {
        return sortOrder === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return sortOrder === "asc"
          ? a.ticketsCount - b.ticketsCount
          : b.ticketsCount - a.ticketsCount;
      }
    });
    return sorted;
  }, [technicianStats, sortType, sortOrder]);

  const totalTickets = technicianStats.reduce((sum, tech) => sum + tech.ticketsCount, 0);
  const averageTicketsPerTechnician = Math.round(totalTickets / TECNICOS_ACTIVOS.length * 10) / 10;

  return (
    <div className="space-y-6">
      {/* Header con estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Técnicos</CardTitle>
            <Users className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{TECNICOS_ACTIVOS.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Asignados</CardTitle>
            <FileText className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Técnico</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageTicketsPerTechnician}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de filtrado */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Ordenamiento</CardTitle>
          <CardDescription>
            Organizá la lista de técnicos según tus preferencias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Ordenar por:</label>
              <Select value={sortType} onValueChange={(value: SortType) => setSortType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Orden Alfabético</SelectItem>
                  <SelectItem value="tickets">Cantidad de Tickets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Dirección:</label>
              <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
                <SelectTrigger>
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
          </div>
        </CardContent>
      </Card>

      {/* Lista de técnicos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sortedTechnicians.map((tech, index) => (
          <Card key={tech.name} className="relative">
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
                
                {/* Ranking badge */}
                <div className="flex items-center gap-2">
                  {sortType === "tickets" && (
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  )}
                  {sortOrder === "asc" && sortType === "tickets" ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : sortType === "tickets" ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : null}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Estadísticas de tickets por estado */}
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

                {/* Barra de progreso visual */}
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: totalTickets > 0 ? `${(tech.ticketsCount / Math.max(...technicianStats.map(t => t.ticketsCount))) * 100}%` : '0%' 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mensaje si no hay técnicos con tickets */}
      {sortedTechnicians.every(tech => tech.ticketsCount === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No hay tickets asignados a técnicos en este momento.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}