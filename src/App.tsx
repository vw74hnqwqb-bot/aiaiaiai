import { useState, useEffect } from "react";
import { FallEvent, Pedestrian } from "./types";
import SGPSMap from "./components/SGPSMap";
import ArduinoSimulator from "./components/ArduinoSimulator";
import PedestrianRegistry from "./components/PedestrianRegistry";
import ArduinoCodeGuide from "./components/ArduinoCodeGuide";
import ActiveEmergencyModal from "./components/ActiveEmergencyModal";
import { 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Trash2, 
  History, 
  AlertTriangle,
  Lightbulb,
  Bell,
  Heart,
  Battery,
  Calendar,
  Layers,
  MapPin,
  RefreshCw,
  Clock
} from "lucide-react";

export default function App() {
  const [events, setEvents] = useState<FallEvent[]>([]);
  const [pedestrians, setPedestrians] = useState<Pedestrian[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const [activeTab, setActiveTab] = useState<"control" | "guide">("control");
  const [loading, setLoading] = useState(true);

  // 1. Fetch initial events and pedestrians list on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch incidents
      const res = await fetch("/api/falls");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        const activeOne = data.find((e: FallEvent) => !e.resolved);
        if (activeOne) {
          setSelectedEventId(activeOne.id);
        } else if (data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      }

      // Fetch pedestrians
      const pedRes = await fetch("/api/pedestrians");
      if (pedRes.ok) {
        const pData = await pedRes.json();
        setPedestrians(pData);
      }
    } catch (err) {
      console.error("Error fetching initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  // SSE backup background sync helper
  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/falls");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Establish Server-Sent Events (SSE) connection on mount
  useEffect(() => {
    setConnectionStatus("connecting");
    const eventSource = new EventSource("/api/events");

    eventSource.onopen = () => {
      setConnectionStatus("connected");
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error", err);
      setConnectionStatus("disconnected");
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        switch (payload.type) {
          case "NEW_FALL": {
            const newEvt: FallEvent = payload.data;
            setEvents((prev) => {
              if (prev.some((e) => e.id === newEvt.id)) return prev;
              return [newEvt, ...prev];
            });
            setSelectedEventId(newEvt.id);

            // Trigger Vibration alert if supported in browser
            if ("vibrate" in navigator) {
              try {
                navigator.vibrate([500, 200, 500, 200, 500]);
              } catch (e) {
                console.warn("Vibration blocked in iframe environment", e);
              }
            }
            break;
          }
          case "FALL_RESOLVED": {
            const updatedEvt: FallEvent = payload.data;
            setEvents((prev) =>
              prev.map((e) => (e.id === updatedEvt.id ? updatedEvt : e))
            );
            break;
          }
          case "HISTORY_RESET": {
            setEvents(payload.data);
            setSelectedEventId(payload.data[0]?.id || null);
            break;
          }
          default:
            break;
        }
      } catch (err) {
        console.error("Failed parsing real-time event", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // 3. Resolve fall alert callback
  const handleResolveEvent = async (id: string, notes: string) => {
    try {
      const res = await fetch("/api/fall/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id, notes })
      });
      if (res.ok) {
        const updated = await res.json();
        setEvents((prev) =>
          prev.map((e) => (e.id === id ? updated.data : e))
        );
      } else {
        alert("경보 해제 통신 중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Register dynamic pedestrian
  const handleRegisterPedestrian = async (newP: Pedestrian) => {
    try {
      const res = await fetch("/api/pedestrians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newP)
      });
      if (res.ok) {
        const added = await res.json();
        setPedestrians(prev => [...prev, added]);
        return { success: true };
      } else {
        const data = await res.json();
        return { success: false, error: data.error };
      }
    } catch (e) {
      return { success: false, error: "서버와의 통신에 실패했습니다." };
    }
  };

  // Delete dynamic pedestrian
  const handleDeletePedestrian = async (id: string) => {
    try {
      const res = await fetch(`/api/pedestrians/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPedestrians(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete pedestrian:", err);
    }
  };

  // 4. Reset simulation history callback
  const handleResetHistory = async () => {
    if (confirm("모든 넘어짐 가상 로그를 초기화하고 정지원(대구화원고) 기기 설정으로 리셋하시겠습니까?")) {
      try {
        await fetch("/api/fall/reset", { method: "POST" });
        await fetchInitialData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Divide events into unresolved (critical active alarms) vs resolved histories
  const activeFalls = events.filter((e) => !e.resolved && (e.status === "fall" || e.status === "impact_warning"));
  const resolvedFalls = events.filter((e) => e.resolved);

  // Custom metadata metrics
  const activeCriticalCount = events.filter((e) => !e.resolved && e.status === "fall").length;
  const activeWarningCount = events.filter((e) => !e.resolved && e.status === "impact_warning").length;
  const totalProcessedCount = resolvedFalls.length;
  const avgHeartRate = events.length > 0 
    ? Math.round(events.reduce((acc, c) => acc + c.heartRate, 0) / events.length) 
    : 78;

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-sans text-white/80 border-8 border-[#1a1a1a]">
        <RefreshCw className="w-10 h-10 text-red-600 animate-spin mb-4" />
        <h3 className="text-xs font-black uppercase tracking-[0.3em]">SYNCHRONIZING SECURE NETWORK GRID...</h3>
        <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Checking Realtime SSE Connection</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-[#F5F5F5] selection:bg-red-600 selection:text-white border-8 border-[#1a1a1a]">
      
      {/* Real-time Flashing Active Emergency Overlay Modal Trigger */}
      <ActiveEmergencyModal activeFalls={activeFalls} onResolve={handleResolveEvent} />

      {/* Main Top Premium Header */}
      <header className="border-b border-white/10 bg-[#050505] sticky top-0 z-30 px-6 md:px-10 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo and core info */}
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shrink-0" />
            <div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#F5F5F5]">
                  보행자 넘어짐 감지 모니터링 시스템
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#050505] bg-white px-2 py-0.5">
                  SYSTEM ACTIVE
                </span>
              </div>
              <p className="text-[11px] font-medium text-white/50 tracking-wide mt-0.5 uppercase">
                IoT 센서 연동 실시간 낙상 및 충격 주시 관제 그리드
              </p>
            </div>
          </div>

          {/* Network Connection status indicators */}
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 text-[10px] font-black tracking-widest uppercase border ${
              connectionStatus === "connected" 
                ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400"
                : connectionStatus === "connecting"
                ? "bg-yellow-950/20 border-yellow-500/40 text-yellow-500"
                : "bg-red-950/20 border-red-500/40 text-red-500"
            }`}>
              <span className="font-mono">
                {connectionStatus === "connected" ? "실시간 연동 상태: 연결됨" : "실시간 연동 상태: 연결 끊김"}
              </span>
            </div>

            {/* Quick configuration reset broker button */}
            <button
              onClick={handleResetHistory}
              title="데이터 초기화"
              className="flex items-center justify-center p-2 rounded bg-[#151515] hover:bg-[#252525] border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8 space-y-8">
        
        {/* POLISHED METRIC DISPLAY BANNER */}
        <section className="py-6 border-b border-white/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-red-500 mb-1.5 block">
                Live Status // 실시간 상태 모니터
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                {activeFalls.length > 0 ? "🚨 실시간 보행 안전 경보 작동 중!" : "🟢 정상 보행 모니터링 상태 (새 신호 대기)"}
              </h1>
              <p className="max-w-2xl text-xs md:text-sm font-semibold tracking-wide text-white/50 leading-relaxed mt-2 uppercase">
                {activeFalls.length > 0 
                  ? "⚠️ 긴급상황: 등록 보행자 기기로부터 낙상 감지 신호가 수신되었습니다! 보호자 긴급 연락 및 해제 처리를 신속히 수행해주시기 바랍니다."
                  : "보행자 오동작이나 넘어짐 감지 시 3축 센서 입력 데이터 조합을 수신하여 실시간 무선 알림 및 소리/진동 경보를 송출하는 웹 기반 관제 시스템입니다."
                }
              </p>
            </div>
            
            <div className="flex gap-1.5 shrink-0 items-center justify-end">
              <span className={`w-3.5 h-3.5 rounded-full ${activeFalls.length > 0 ? "bg-red-500 animate-ping" : "bg-emerald-500 animate-pulse"}`}></span>
              <span className="text-[11px] font-black uppercase text-white/70 tracking-widest">
                {activeFalls.length > 0 ? "DANGER FEEDING" : "SCAN MONITOR STANDBY"}
              </span>
            </div>
          </div>
        </section>



        {/* Dynamic Nav-Tabs with sharp black-and-white flat button shapes */}
        <div className="flex space-x-2 border-b border-white/10 pb-0.5">
          <button
            onClick={() => setActiveTab("control")}
            className={`px-6 py-3.5 text-xs font-black uppercase tracking-[0.2em] transition-all cursor-pointer border-t-2 border-x-2 ${
              activeTab === "control" 
                ? "bg-white text-black border-white" 
                : "text-white/50 hover:text-white border-transparent"
            }`}
          >
            01 // 실시간 위기 관제 대시보드
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`px-6 py-3.5 text-xs font-black uppercase tracking-[0.2em] transition-all cursor-pointer border-t-2 border-x-2 ${
              activeTab === "guide" 
                ? "bg-white text-black border-white" 
                : "text-white/50 hover:text-white border-transparent"
            }`}
          >
            02 // 아두이노 연동 C++ 소스코드
          </button>
        </div>

        {/* Tab Selection Renders */}
        {activeTab === "control" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Section (8 columns) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Map block */}
              <SGPSMap 
                events={events}
                selectedEventId={selectedEventId}
                onSelectEvent={(id) => setSelectedEventId(id)}
              />

              {/* Pedestrian Registry (실제 대상 사용자 및 기기 고유 ID 정보 추가/삭제) */}
              <PedestrianRegistry 
                pedestrians={pedestrians}
                onRegister={handleRegisterPedestrian}
                onDelete={handleDeletePedestrian}
              />

              {/* Developer Testing Arduino Simulation Board & User Dropdown selector */}
              <ArduinoSimulator pedestrians={pedestrians} />

            </div>

            {/* Right Section (4 columns) */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Connected Active Pedestrians List Panel with flat container styles */}
              <div className="bg-[#050505] border-2 border-white/15 p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                    <h3 className="font-black text-xs uppercase tracking-widest text-[#F5F5F5]">Live Incident Feed</h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-white/40">
                    TOTAL: {events.length}
                  </span>
                </div>

                {events.length === 0 ? (
                  <div className="py-12 text-center text-xs text-white/40 uppercase tracking-wider">
                    NO PEDESTRIAN SIGNALS DETECTED.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {events.map((evt) => {
                      const isActiveDanger = !evt.resolved && (evt.status === "fall" || evt.status === "impact_warning");
                      const isSelected = evt.id === selectedEventId;
                      
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEventId(evt.id)}
                          className={`p-4 border-2 transition-all cursor-pointer ${
                            isActiveDanger
                              ? evt.status === "fall"
                                ? "bg-red-950/30 border-red-600"
                                : "bg-amber-950/20 border-amber-500"
                              : isSelected
                              ? "bg-white text-black border-white"
                              : "bg-[#0b0b0b] border-[#1f1f1f] hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs uppercase tracking-wide">
                              {evt.name}
                            </span>
                            <span className="text-[9px] font-mono opacity-60">
                              {new Date(evt.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <div className="mt-2 text-[11px] font-bold uppercase tracking-wide flex items-center justify-between">
                            <span className="opacity-60">{evt.pedestrianId} // {evt.age}세</span>
                            <span className={isActiveDanger ? (evt.status === "fall" ? "text-red-500" : "text-amber-500") : "opacity-40"}>
                              {evt.status === "fall" ? "🚨 FALL DETECTED" : evt.status === "impact_warning" ? "⚠️ IMPACT ALERT" : "🟢 STABLE WALK"}
                            </span>
                          </div>

                          <div className={`mt-3 pt-2 border-t flex items-center justify-between font-mono text-[9px] ${
                            isSelected && !isActiveDanger ? "border-black/10 text-black/60" : "border-white/5 text-white/50"
                          }`}>
                            <span className="flex items-center">HEART: {evt.heartRate} bpm</span>
                            <span className="flex items-center">BATT: {evt.battery}%</span>
                            <span className="flex items-center">COORD: {evt.latitude.toFixed(2)}, {evt.longitude.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Focus Target Detail Widget */}
              {selectedEventId && (
                <div className="bg-[#050505] border-2 border-white/15 p-6 space-y-5">
                  {(() => {
                    const evt = events.find(e => e.id === selectedEventId);
                    if (!evt) return null;
                    const isDanger = !evt.resolved && (evt.status === "fall" || evt.status === "impact_warning");
                    
                    return (
                      <>
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                          <h4 className="font-black text-xs uppercase tracking-widest text-white/40">Event Meta Node</h4>
                          <span className="text-[10px] font-mono text-white/50">INFO-STATION</span>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xl font-black uppercase tracking-tight text-white">{evt.name}</span>
                            <span className="text-xs font-mono font-bold text-white/40">{evt.pedestrianId}</span>
                          </div>

                          <div className="bg-[#0b0b0b] border border-[#1f1f1f] p-4 space-y-2.5 font-mono text-[11px]">
                            <div className="flex justify-between text-white/50">
                              <span>RECEIVED:</span>
                              <span className="text-white font-bold">{new Date(evt.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-white/50">
                              <span>SIGNAL HASH:</span>
                              <span className={isDanger ? "text-red-500 font-black" : "text-emerald-400 font-bold"}>
                                {evt.status === "fall" ? "COLLISION_CRITICAL_8.2G" : evt.status === "impact_warning" ? "IMPACT_IMPETUS_3.4G" : "NORMAL_BEAT"}
                              </span>
                            </div>
                            <div className="flex justify-between text-white/50">
                              <span>GEO-LOCATION:</span>
                              <span className="text-[#F5F5F5]">{evt.latitude.toFixed(6)}, {evt.longitude.toFixed(6)}</span>
                            </div>
                            <div className="flex justify-between text-white/50">
                              <span>DEVICE BATT:</span>
                              <span className={evt.battery < 30 ? "text-red-500 font-bold" : "text-[#F5F5F5]"}>{evt.battery}%</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#F5F5F5] block">
                              Recent Logs / 최근 조치
                            </span>
                            {evt.resolved ? (
                              <div className="bg-[#0b0b0b] border border-white/10 p-4 text-[#F5F5F5] leading-relaxed text-[11px]">
                                <div className="flex items-center space-x-1.5 text-white font-black text-xs mb-2">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>STATUS: RESOLVED // 조치 완료</span>
                                </div>
                                <p className="mb-2 font-medium opacity-80">{evt.notes}</p>
                                <span className="text-[9px] text-white/40 font-mono block border-t border-white/5 pt-2 mt-2 text-right">
                                  {new Date(evt.resolvedAt!).toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <div className="bg-red-950/20 border-2 border-red-600/40 p-4 text-red-100 leading-relaxed text-[11px]">
                                <div className="flex items-center space-x-1.5 text-red-500 font-black text-xs mb-2">
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  <span>⚠️ STATE: CRITICAL STANDBY // 해결 대기</span>
                                </div>
                                <p className="opacity-80 leading-relaxed">
                                  보행약자의 충격 충돌 신호가 서버에 유지되고 있습니다. 상단 비상 창을 동기화하여 실제 낙상 조치 처리 서명을 작성해주시기 바랍니다.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

            </div>

          </div>
        ) : (
          /* Guide Tab Renders */
          <ArduinoCodeGuide />
        )}

        {/* Footer info branding */}
        <footer className="border-t border-white/10 pt-8 pb-12 flex flex-col md:flex-row items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/40 gap-4">
          <p>© 2026 Pedestrian Fall Monitor // 보행자 넘어짐 실시간 안전망 구조대</p>
          <div className="flex space-x-4">
            <span>Hardware: ESP32 / MPU6050 API Pipeline</span>
            <span>•</span>
            <span>Platform: Cloud Run Sandbox</span>
          </div>
        </footer>

      </main>

    </div>
  );
}
