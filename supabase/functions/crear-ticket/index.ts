import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Solo peticiones POST' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      })
    }

    const body = await req.json()
    const { cliente, email, telefono, asunto, descripcion, categoria } = body

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const idUnico = `TCK-${crypto.randomUUID().split('-')[0].toUpperCase()}`

    const nuevoTicket = {
      id: idUnico,
      cliente: cliente || 'Cliente Anónimo',
      email: email || '',
      telefono: telefono || '',
      asunto: asunto || 'Sin asunto',
      descripcion: descripcion || '',
      categoria: categoria || 'General',
      estado: 'Abierto',
      prioridad: 'Media',
      fecha: new Date().toISOString()
    }

    // 1. Guardamos el ticket en la base de datos
    const { data, error } = await supabase
      .from('tickets')
      .insert(nuevoTicket)
      .select()
      .single()

    if (error) throw error

    // ==========================================
    // 2. NUEVO: ¡Disparamos el mail con Resend!
    // ==========================================
    const resendKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`
          },
          body: JSON.stringify({
            from: 'Ticketear <onboarding@resend.dev>', 
            to: ['leagusmen@gmail.com'],     
            subject: `Nuevo Ticket: ${asunto} [${idUnico}]`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4F46E5;">¡Nuevo ticket registrado!</h2>
                <p>Ha ingresado un nuevo ticket al sistema desde el formulario web.</p>
                <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin-top: 20px;">
                  <p><strong>ID:</strong> ${idUnico}</p>
                  <p><strong>Cliente:</strong> ${cliente || 'Anónimo'}</p>
                  <p><strong>Email de contacto:</strong> ${email}</p>
                  <p><strong>Asunto:</strong> ${asunto}</p>
                  <p><strong>Descripción:</strong></p>
                  <p style="white-space: pre-wrap;">${descripcion}</p>
                </div>
                <br>
                <p><small style="color: #6b7280;">Este es un correo automático de prueba generado por Ticketear.</small></p>
              </div>
            `
          })
        })
      } catch (emailError) {
        // Atrapamos el error del mail pero NO cortamos la función, 
        // así el ticket se crea igual aunque falle el envío del correo.
        console.error("No se pudo enviar el correo:", emailError)
      }
    }

    // 3. Devolvemos el éxito al frontend
    return new Response(JSON.stringify({ mensaje: 'Ticket creado con éxito', ticket: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201
    })

  } catch (error: any) {
    console.error("Error capturado:", error)
    return new Response(JSON.stringify({ 
      error: 'Error al procesar la solicitud', 
      detalles: error.message || error 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})