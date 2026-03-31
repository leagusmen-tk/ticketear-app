import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Estos son los datos falsos basados en tu captura. 
// Después los vamos a reemplazar por tus variables reales.
const datosGrafico = [
  {
    nombre: 'Leandro',
    Abiertos: 1,
    EnProgreso: 0,
    Cerrados: 0,
  },
  {
    nombre: 'Milagros',
    Abiertos: 2,
    EnProgreso: 0,
    Cerrados: 0,
  }
];

export default function GraficoTecnicos() {
  return (
    <div style={{ width: '100%', height: 300, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
      <h3 style={{ marginTop: 0, color: '#333', fontSize: '16px' }}>Carga de Trabajo por Técnico</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datosGrafico}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="nombre" />
          <YAxis allowDecimals={false} />
          <Tooltip cursor={{fill: '#f4f4f5'}} />
          <Legend />
          {/* Los colores de las barras (Rojo para abiertos, Amarillo para progreso, Verde para cerrados) */}
          <Bar dataKey="Abiertos" stackId="a" fill="#EF4444" radius={[0, 0, 4, 4]} />
          <Bar dataKey="EnProgreso" stackId="a" fill="#FBBF24" />
          <Bar dataKey="Cerrados" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}