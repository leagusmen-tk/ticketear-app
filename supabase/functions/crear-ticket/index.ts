import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS para que tu frontend de React pueda comunicarse sin problemas
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Usamos el SERVICE_ROLE_KEY porque esta función actúa como "Dios" en tu base de datos,
    // necesita poder leer todos los tickets y perfiles para hacer el cálculo matemático.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Recibimos los datos (Puede venir de React o de Make.com)
    const body = await req.json()
    const { cliente, email, telefono, asunto, descripcion, categoria, assignedToId, user_id } = body

    // 2. Generamos la ÚNICA FUENTE DE VERDAD para el ID
    const idUnico = `TCK-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

    // Variables para definir el ganador
    let idTecnicoFinal = assignedToId || null;
    let nombreTecnicoFinal = null;

    // ==========================================
    // 3. LÓGICA DE BALANCEO DE CARGA
    // ==========================================
    if (!idTecnicoFinal) {
      // Si entra acá, significa que el Admin eligió "Sin asignar" o el ticket entró automático por email.
      // Buscamos si la palanca maestra de auto-asignación está encendida
      const { data: flag } = await supabaseAdmin
        .from('feature_flags')
        .select('is_enabled')
        .eq('name', 'balanceo_automatico')
        .single();

      if (flag?.is_enabled) {
        // A. Traemos TODOS los perfiles que sean técnicos
        const { data: tecnicos } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'technician');

        if (tecnicos && tecnicos.length > 0) {
          // B. Traemos la columna de asignación de los tickets ACTIVOS
          const { data: ticketsActivos } = await supabaseAdmin
            .from('tickets')
            .select('assigned_to_id')
            .in('estado', ['Abierto', 'En Progreso']);

          // C. Buscamos al técnico con el menor número de carga
          let minimoTickets = Infinity;
          let idGanador = null;
          let nombreGanador = null;

          for (const tecnico of tecnicos) {
            const cargaActual = ticketsActivos?.filter(t => t.assigned_to_id === tecnico.id).length || 0;
            
            if (cargaActual < minimoTickets) {
              minimoTickets = cargaActual;
              idGanador = tecnico.id;
              nombreGanador = tecnico.full_name;
            }
          }

          // Asignamos el premio
          idTecnicoFinal = idGanador;
          nombreTecnicoFinal = nombreGanador;
        }
      }
    } else {
      // Si el Admin YA HABÍA elegido a alguien a dedo, solo buscamos su nombre para el label visual
      const { data: tec } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', idTecnicoFinal)
        .single();
      
      if (tec) nombreTecnicoFinal = tec.full_name;
    }

    const nuevoTicket = {
      id: idUnico,
      user_id: user_id || null, 
      cliente: cliente || 'Cliente Anónimo',
      email: email || '',
      telefono: telefono || null,
      asunto: asunto || 'Sin asunto',
      descripcion: descripcion || '',
      categoria: categoria || 'General',
      estado: 'Abierto',
      prioridad: 'Media', 
      assigned_to_id: idTecnicoFinal,
      asignado: nombreTecnicoFinal || 'Sin asignar',
      fecha: new Date().toISOString()
    };

    const { data: ticketCreado, error: insertError } = await supabaseAdmin
      .from('tickets')
      .insert(nuevoTicket)
      .select('*')
      .single();

    if (insertError) throw insertError;

    // Le devolvemos el ticket ya armado y con ID oficial al frontend
    return new Response(JSON.stringify(ticketCreado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("Error en Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})