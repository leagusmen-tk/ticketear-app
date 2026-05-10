
  # Ticket Table Component

  This is a code bundle for Ticket Table Component. The original project is available at https://www.figma.com/design/b7jvRNM4gsHxHTP4PzNn2L/Ticket-Table-Component.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
  ## Configuración de Inteligencia Artificial (Local)
El proyecto utiliza Ollama corriendo en Docker para procesar la IA de forma local.

**Pasos para iniciar el motor:**
1. Levantar el contenedor en segundo plano:
   ```bash
   docker compose up -d
2. Descargar e iniciar el modelo Phi-3 (solo es necesario la primera vez):
    docker exec -it ollama_ticketear ollama run phi3
    *(Una vez que aparezca el símbolo `>>>`, escribir `/bye` para salir).*
  
  