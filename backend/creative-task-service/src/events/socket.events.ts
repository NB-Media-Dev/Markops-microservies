import { config } from "../config/env.config.js";



export async function emitRealtimeEvent(event: string, data: any, room?: string): Promise<void> {
  try {
    const url = `${config.realtimeServiceUrl}/api/broadcast`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, data, room })
    });

    if (res.ok) {
      console.log(`[Realtime Gateway] Dispatched '${event}' to realtime-service (port 4006)`);
    } else {
      console.warn(`[Realtime Gateway Notice] realtime-service returned status ${res.status}`);
    }
  } catch (err: any) {
  
    console.warn(`[Realtime Gateway Notice] realtime-service unavailable: ${err?.message || err}`);
  }
}
