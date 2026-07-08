import express from "express";
import path from "path";

interface FallEvent {
  id: string;
  pedestrianId: string;
  name: string;
  age: number;
  status: "fall" | "impact_warning" | "normal";
  latitude: number;
  longitude: number;
  heartRate: number;
  battery: number;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  notes?: string;
}

interface Pedestrian {
  id: string;
  name: string;
  age: number;
  phone: string;
  notes: string;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory pedestrian data
let pedestrians: Pedestrian[] = [
  {
    id: "PED-1092",
    name: "정지원 (본인 기기 테스트)",
    age: 18,
    phone: "010-1234-5678",
    notes: "대구화원고 3학년 2반 - 실시간 송수신 단말 장치"
  }
];

// In-memory fall event storage
let fallEvents: FallEvent[] = [];

// List of connected Server-Sent Events clients
let clients: { id: string; res: express.Response }[] = [];

// API: Get all events
app.get("/api/falls", (req, res) => {
  res.json(fallEvents);
});

// API: Get registered pedestrians
app.get("/api/pedestrians", (req, res) => {
  res.json(pedestrians);
});

// API: Register a pedestrian
app.post("/api/pedestrians", (req, res) => {
  const { id, name, age, phone, notes } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: "기기 ID와 이름은 필수 항목입니다." });
  }

  // Prevents duplicates
  if (pedestrians.some(p => p.id === id)) {
    return res.status(400).json({ error: "이미 등록된 기기 고유 ID(PED-ID)입니다." });
  }

  const newPedestrian = {
    id,
    name,
    age: Number(age) || 18,
    phone: phone || "010-0000-0000",
    notes: notes || "실제 기기 테스트 사용자"
  };

  pedestrians.push(newPedestrian);
  return res.status(201).json(newPedestrian);
});

// API: Delete a pedestrian
app.delete("/api/pedestrians/:id", (req, res) => {
  const { id } = req.params;
  pedestrians = pedestrians.filter(p => p.id !== id);
  return res.json({ success: true, message: "사용자가 정상 삭제되었습니다." });
});

// API: Post a new fall event (Called by Arduino or Simulator)
app.post("/api/fall", (req, res) => {
  const { pedestrianId, name, age, status, latitude, longitude, heartRate, battery } = req.body;

  if (!pedestrianId || !name) {
    return res.status(400).json({ error: "pedestrianId and name are required." });
  }

  // Create fall event
  const newEvent: FallEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    pedestrianId,
    name,
    age: age || 18,
    status: status || "fall",
    latitude: Number(latitude) || 35.8118,
    longitude: Number(longitude) || 128.5034,
    heartRate: Number(heartRate) || 110,
    battery: Number(battery) || 80,
    timestamp: new Date().toISOString(),
    resolved: false
  };

  // Prepend to list
  fallEvents.unshift(newEvent);

  // Broadcast to all active clients
  broadcastToClients({
    type: "NEW_FALL",
    data: newEvent
  });

  return res.status(201).json({ message: "Fall alert received and broadcasted successfully", data: newEvent });
});

// API: Resolve/Acknowledge a fall event
app.post("/api/fall/resolve", (req, res) => {
  const { id, notes } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Event id is required." });
  }

  const index = fallEvents.findIndex((evt) => evt.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Event not found" });
  }

  fallEvents[index].resolved = true;
  fallEvents[index].resolvedAt = new Date().toISOString();
  fallEvents[index].notes = notes || "상황 확인 및 조치 완료";

  // Broadcast the update to SSE clients
  broadcastToClients({
    type: "FALL_RESOLVED",
    data: fallEvents[index]
  });

  return res.json({ message: "Event resolved successfully", data: fallEvents[index] });
});

// API: Reset event history to base State
app.post("/api/fall/reset", (req, res) => {
  fallEvents = [];
  pedestrians = [
    {
      id: "PED-1092",
      name: "정지원 (본인 기기 테스트)",
      age: 18,
      phone: "010-1234-5678",
      notes: "대구화원고 3학년 2반 - 실시간 송수신 단말 장치"
    }
  ];

  broadcastToClients({
    type: "HISTORY_RESET",
    data: fallEvents
  });

  return res.json({ message: "History reset successfully", data: fallEvents });
});

// Real-time: Server-Sent Events Endpoint
app.get("/api/events", (req, res) => {
  // Set headers for SSE (including no-transform and X-Accel-Buffering to prevent proxy buffering)
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  });

  const clientId = `client-${Date.now()}`;
  clients.push({ id: clientId, res });

  // Send initial event to confirm connection
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", clientId })}\n\n`);

  req.on("close", () => {
    clients = clients.filter((c) => c.id !== clientId);
  });
});

// Broadcast helper
function broadcastToClients(event: { type: string; data: any }) {
  clients.forEach((client) => {
    try {
      client.res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (err) {
      console.error("Failed to write to SSE client:", err);
    }
  });
}

// Periodic keep-alive ping (every 15 seconds) to prevent Cloud Run or Nginx from dropping the quiet connection
setInterval(() => {
  clients.forEach((client) => {
    try {
      client.res.write(":\n\n"); // SSE comment line acting as a heartbeat ping
    } catch (err) {
      // Failed client will be pruned on close event, but we catch potential errors
    }
  });
}, 15000);

// Vite integration: Development vs Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting... Listening on port ${PORT}`);
    console.log(`Arduino API target: POST http://localhost:${PORT}/api/fall`);
  });
}

startServer();
