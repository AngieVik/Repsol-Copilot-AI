
import { GoogleGenAI } from "@google/genai";
import { GeoCoordinates, ScanResult, SearchPreferences } from "../types";

const MODEL_NAME = "gemini-2.5-flash";

// Helper to clean and parse JSON from Markdown text response
const parseJsonFromText = (text: string): any => {
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // 2. Try extracting from code block
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        console.error("Failed to parse JSON from code block", e2);
      }
    }
    // 3. Last ditch: find first { and last }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(text.substring(start, end + 1));
      } catch (e3) {
        console.error("Failed to parse JSON from brackets", e3);
      }
    }
    throw new Error("No valid JSON found in response");
  }
};

export const analyzeRouteContext = async (
  apiKey: string,
  location: GeoCoordinates,
  prefs: SearchPreferences,
  isSearchBeyond: boolean,
  shouldScanTraffic: boolean,
  shouldScanWeather: boolean,
  isEmergency: boolean = false
): Promise<ScanResult> => {
  try {
    if (!apiKey) throw new Error("API Key missing");
    
    const ai = new GoogleGenAI({ apiKey });

    // EMERGENCY OVERRIDE
    if (isEmergency) {
       const prompt = `
        URGENTE: EMERGENCIA. El conductor ha solicitado ayuda inmediata.
        Ubicación: Lat ${location.latitude}, Lng ${location.longitude}.
        
        OBJETIVO:
        Busca el HOSPITAL, CENTRO DE SALUD o COMISARÍA DE POLICÍA más cercano en la ruta o ubicación actual.
        Ignora gasolineras o clima. Prioridad absoluta a servicios de emergencia.
        
        Responde en JSON:
        {
          "alertTriggered": true,
          "nearestStation": { "name": "NOMBRE HOSPITAL/POLICIA", "distance": "DISTANCIA", "isOpen": true, "locationDetails": "Dirección completa de emergencia" },
          "nextStation": { "name": "---", "distance": "---" },
          "traffic": { "status": "EMERGENCIA", "summary": "Buscando ayuda médica/policial más cercana.", "delayMinutes": 0 },
          "weather": { "condition": "N/A", "summary": "N/A" },
          "poi": { "restAreas": "N/A" }
        }
       `;
       const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: { tools: [{ googleMaps: {} }] }
       });
       const textResponse = response.text || "{}";
       const data = parseJsonFromText(textResponse);
       return {
          alertTriggered: true,
          nearestStation: { 
            name: data.nearestStation?.name || "BUSCANDO AYUDA", 
            distance: data.nearestStation?.distance || "...", 
            isOpen: true,
            locationDetails: data.nearestStation?.locationDetails || "Ubicación de emergencia"
          },
          nextStation: { name: "---", distance: "---" },
          traffic: { status: "URGENTE", summary: data.traffic?.summary || "Modo emergencia activo", delayMinutes: 0 },
          weather: { condition: "N/A", summary: "" },
          poi: { restAreas: "" },
          groundingUrls: []
       };
    }

    const brand = prefs.gasStationBrand;
    const gasScope = brand === 'all' 
      ? "Cualquier gasolinera conocida (Repsol, BP, Shell, Cepsa/Moeve, Galp)" 
      : `Solo gasolineras de la marca ${brand.toUpperCase()}`;

    const destinationContext = prefs.destination 
      ? `Estoy viajando hacia ${prefs.destination}. Busca resultados EN RUTA hacia ese destino. Identifica carreteras (A-1, AP-7, etc) y salidas.`
      : `Estoy viajando por la autovía/carretera actual (detectala por coordenadas). Estima mi dirección según mi rumbo.`;
      
    const searchMode = isSearchBeyond 
      ? "MODO 'BUSCAR MÁS ALLÁ' ACTIVADO: Amplía el radio de búsqueda a 50km. Incluye pueblos y desvíos cercanos." 
      : "MODO ESTRICTO EN RUTA: Busca establecimientos estrictamente en la trayectoria de la ruta.";

    // Combined prompt leveraging both Maps (for location/places) and Search (for live conditions)
    const prompt = `
      Actúa como un copiloto de IA avanzado.
      Mi Ubicación: Lat ${location.latitude}, Lng ${location.longitude}.
      ${destinationContext}
      ${searchMode}
      
      HERRAMIENTAS DISPONIBLES:
      1. 'googleMaps': Úsala OBLIGATORIAMENTE para encontrar Gasolineras y obtener ubicación exacta.
      2. 'googleSearch': Úsala OBLIGATORIAMENTE para buscar noticias recientes de tráfico y el clima actual.

      OBJETIVOS:
      1. GASOLINERAS (Usa googleMaps): Encuentra la SIGUIENTE gasolinera ${gasScope} (abierta) en mi ruta.
         - NO filtres por cercanía inmediata. Necesito la siguiente en la ruta, aunque esté a 80km.
         - IMPORTANTE: Debes identificar la VÍA (Carretera) y el PUNTO KILOMÉTRICO (Pk) o Salida exacta.
         - Rellena 'locationDetails' con esta información (Ej: "A-6, Km 35.5, Salida Guadarrama").
         - NO busques servicios de cafetería ni tipos de combustible. Solo ubicación.

      2. POI (Usa googleMaps): Si ${prefs.filterRest} es true, busca áreas de descanso en la ruta.

      3. TRÁFICO (Usa googleSearch):
         ${shouldScanTraffic ? "Busca incidentes de tráfico, retenciones o accidentes reportados recientemente en mi ruta/carretera actual." : "Ignora tráfico."}

      4. CLIMA (Usa googleSearch):
         ${shouldScanWeather ? "Busca el estado actual del clima (lluvia, viento, nieve) en mi ubicación y destino." : "Ignora clima."}

      Responde ÚNICAMENTE con un JSON válido:
      {
        "alertTriggered": boolean, // True si encontraste una gasolinera en ruta
        "nearestStation": { 
            "name": string, 
            "distance": string, 
            "isOpen": boolean,
            "locationDetails": string // Ej: "A-5, Km 23 (Sentido Badajoz)"
        },
        "nextStation": { "name": string, "distance": string },
        "traffic": { "status": string, "summary": string, "delayMinutes": number }, // status: "Fluido", "Denso", "Atasco"
        "weather": { "condition": string, "summary": string },
        "poi": { "restAreas": string }
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        // Enable BOTH Maps and Search
        tools: [
          { googleMaps: {} },
          { googleSearch: {} }
        ],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude,
            }
          }
        }
      },
    });

    const textResponse = response.text || "{}";
    const data = parseJsonFromText(textResponse);
    
    // Extract Grounding URLs from both Maps and Search
    const groundingUrls: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) groundingUrls.push(chunk.web.uri);
        if (chunk.maps?.uri) groundingUrls.push(chunk.maps.uri);
      });
    }

    return {
      alertTriggered: !!data.alertTriggered,
      nearestStation: {
        name: data.nearestStation?.name || "Buscando...",
        distance: data.nearestStation?.distance || "--",
        isOpen: !!data.nearestStation?.isOpen,
        locationDetails: data.nearestStation?.locationDetails || "Ubicación desconocida"
      },
      nextStation: {
        name: data.nextStation?.name || "---",
        distance: data.nextStation?.distance || "--"
      },
      traffic: {
        status: data.traffic?.status || "N/A",
        summary: data.traffic?.summary || "Sin incidencias reportadas",
        delayMinutes: data.traffic?.delayMinutes || 0
      },
      weather: {
        condition: data.weather?.condition || "N/A",
        summary: data.weather?.summary || "Sin datos recientes"
      },
      poi: {
        restAreas: data.poi?.restAreas || "Sin resultados"
      },
      groundingUrls: Array.from(new Set(groundingUrls))
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      alertTriggered: false,
      nearestStation: { name: "Error Conexión", distance: "--", isOpen: false, locationDetails: "---" },
      nextStation: { name: "---", distance: "--" },
      traffic: { status: "Error", summary: "Verifique su API Key o conexión.", delayMinutes: 0 },
      weather: { condition: "Error", summary: "Reintentando..." },
      poi: { restAreas: "" },
      groundingUrls: []
    };
  }
};
