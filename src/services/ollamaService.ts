import { Ollama } from 'ollama/browser';

// Inicializamos el cliente. 
// Por defecto se conecta a http://localhost:11434 (nuestro contenedor de Docker)
const ollama = new Ollama({ host: 'http://localhost:11434' });

export const ollamaService = {
  /**
   * Genera una respuesta simple
   */
  async chat(model: string, message: string) {
    try {
      const response = await ollama.chat({
        model: model,
        messages: [{ role: 'user', content: message }],
      });
      return response.message.content;
    } catch (error) {
      console.error("Error al conectar con Ollama:", error);
      throw error;
    }
  },

  /**
   * Genera una respuesta con streaming (para interfaces tipo ChatGPT)
   */
  async chatStream(model: string, message: string, onChunk: (chunk: string) => void) {
    try {
      const response = await ollama.chat({
        model: model,
        messages: [{ role: 'user', content: message }],
        stream: true,
      });

      for await (const part of response) {
        onChunk(part.message.content);
      }
    } catch (error) {
      console.error("Error en streaming con Ollama:", error);
      throw error;
    }
  }
};