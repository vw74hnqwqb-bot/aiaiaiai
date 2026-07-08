import React, { useState, useEffect } from "react";
import { Send, CheckCircle, Flame, Heart, Battery, Navigation, RefreshCw } from "lucide-react";
import { playSuccessBeep } from "./AudioAlarm";
import { Pedestrian } from "../types";

// Clean location coordinates only (No fictitious grandma names attached)
const LOCATION_PRESETS = [
  {
    label: "대구 화원고 앞 교차로 📍",
    latitude: 35.8119,
    longitude: 128.5035,
    notes: "화원고 삼거리 횡단보차도 일원"
  },
  {
    label: "화원전통시장 진입로 📍",
    latitude: 35.8158,
    longitude: 128.5072,
    notes: "화원전통시장 입구 보차도"
  },
  {
    label: "설화명곡역 출구 보도 📍",
    latitude: 35.8085,
    longitude: 128.4988,
    notes: "설화명곡역 인근 인도 구역"
  }
];

interface SimulatorProps {
  pedestrians: Pedestrian[];
}

export default function ArduinoSimulator({ pedestrians }: SimulatorProps) {
  const [selectedPedestrianId, setSelectedPedestrianId] = useState("");
  const [name, setName] = useState("정지원 (임시)");
  const [age, setAge] = useState(18);
  const [pedestrianId, setPedestrianId] = useState("PED-1092");
  
  const [lat, setLat] = useState(35.8125);
  const [lng, setLng] = useState(128.5042);
  const [heartRate, setHeartRate] = useState(82);
  const [battery, setBattery] = useState(90);
  const [status, setStatus] = useState<"fall" | "impact_warning" | "normal">("fall");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Auto-sync form when a registered pedestrian is changed
  useEffect(() => {
    if (selectedPedestrianId) {
      const found = pedestrians.find((p) => p.id === selectedPedestrianId);
      if (found) {
        setName(found.name);
        setAge(found.age);
        setPedestrianId(found.id);
      }
    }
  }, [selectedPedestrianId, pedestrians]);

  // Set default form values from first pedestrian dynamic seed if available
  useEffect(() => {
    if (pedestrians.length > 0 && !selectedPedestrianId) {
      setSelectedPedestrianId(pedestrians[0].id);
      setName(pedestrians[0].name);
      setAge(pedestrians[0].age);
      setPedestrianId(pedestrians[0].id);
    }
  }, [pedestrians]);

  const applyLocationPreset = (preset: typeof LOCATION_PRESETS[0]) => {
    setLat(preset.latitude);
    setLng(preset.longitude);
    playSuccessBeep();
  };

  const handleSendPayload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const payload = {
      pedestrianId,
      name,
      age,
      status,
      latitude: lat,
      longitude: lng,
      heartRate,
      battery
    };

    try {
      const response = await fetch("/api/fall", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (response.ok) {
        setResult({
          success: true,
          message: `아두이노 패킷 데이터 전송 완료! [수신 등록: ${name} / ${status === "fall" ? "낙상 발생" : status === "impact_warning" ? "충격 경고" : "정상 상태"}]`
        });
        playSuccessBeep();
      } else {
        setResult({
          success: false,
          message: resData.error || "아두이노 전송 실패"
        });
      }
    } catch (err) {
      console.error(err);
      setResult({
        success: false,
        message: "네트워크 오류: 실시간 관제 서버에 접근할 수 없습니다."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0b0b0b] border-2 border-white/10 rounded-none overflow-hidden font-sans text-[#F5F5F5]">
      {/* Simulation Header */}
      <div className="bg-[#0f0f0f] border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 bg-red-600 shrink-0" />
          <div>
            <h3 className="font-extrabold text-white text-xs tracking-wider uppercase">
              실체 아두이노 기기 가상 송신기 (Arduino Simulator)
            </h3>
            <p className="text-[10px] text-white/50">등록한 사용자의 IoT 센서 장치에서 발생한 넘어짐 신호를 관제 서버 전송망에 송출합니다.</p>
          </div>
        </div>
        <span className="text-[9px] bg-white text-black font-mono font-black px-2 py-0.5 uppercase tracking-widest">
          STANDALONE SENSOR EMULATOR
        </span>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Step 1: Active User Selector */}
        <div className="bg-black p-4 border border-white/10 space-y-3">
          <label className="block text-[10px] font-black text-white/70 uppercase tracking-widest">
            👤 1. 신호 발생 실제 사용자 지정 (Pedestrian Target)
          </label>
          {pedestrians.length === 0 ? (
            <p className="text-xs text-red-400 font-bold">
              ⚠️ 등록된 사용자가 없습니다. 아래 사용자 등록 폼을 통해 실제 대상자를 한 명 이상 등록해주세요.
            </p>
          ) : (
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="w-full">
                <select
                  value={selectedPedestrianId}
                  onChange={(e) => setSelectedPedestrianId(e.target.value)}
                  className="w-full text-xs bg-[#111] border border-white/15 focus:border-white focus:outline-none p-3.5 text-white font-bold"
                >
                  {pedestrians.map((p) => (
                    <option key={p.id} value={p.id} className="text-white bg-black font-semibold">
                      {p.name} (ID: {p.id} / 나이: {p.age}세)
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  const found = pedestrians.find(p => p.id === selectedPedestrianId);
                  if (found) {
                    setName(found.name);
                    setAge(found.age);
                    setPedestrianId(found.id);
                    playSuccessBeep();
                  }
                }}
                className="shrink-0 px-4 py-3 border border-white/20 text-xs text-white uppercase font-bold hover:bg-white hover:text-black transition-colors"
              >
                파라미터 동기화
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Location Presets */}
        <div>
          <label className="block text-[10px] font-black text-white/60 uppercase tracking-widest mb-3">
            📍 2. 모의 발생 지리 좌표 설정 (Location Preset)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {LOCATION_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyLocationPreset(p)}
                className="text-left text-xs bg-black border border-white/10 hover:border-white hover:bg-[#111] transition-colors p-3.5 text-white/90 cursor-pointer flex flex-col justify-between"
              >
                <span className="font-extrabold text-xs mb-1 text-white">{p.label}</span>
                <span className="text-[10px] font-mono opacity-50">
                  위도:{p.latitude} / 경도:{p.longitude}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body with standard settings */}
        <form onSubmit={handleSendPayload} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#0b0b0b] p-5 border border-white/10 relative rounded-none">
            
            {/* Pedestrian Identification */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">
                기기 ID (PED-ID)
              </label>
              <input
                type="text"
                value={pedestrianId}
                onChange={(e) => setPedestrianId(e.target.value)}
                required
                className="w-full text-xs bg-black border border-white/15 focus:border-white focus:outline-none px-3 py-2 font-mono text-white"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">
                보행자 이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-xs bg-black border border-white/15 focus:border-white focus:outline-none px-3 py-2 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">
                나이 (세)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                min={1}
                max={150}
                required
                className="w-full text-xs bg-black border border-white/15 focus:border-white focus:outline-none px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">
                전송할 신호 상태
              </label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full text-xs bg-black border border-white/15 focus:border-white focus:outline-none rounded-none px-2 py-2 text-white font-black"
              >
                <option value="fall" className="text-red-500 bg-black">🚨 넘어짐 감지 (Fall)</option>
                <option value="impact_warning" className="text-yellow-500 bg-black">⚠️ 충격 감지 (Impact)</option>
                <option value="normal" className="text-emerald-500 bg-black">🟢 정상 보행 (Normal)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 flex items-center space-x-1">
                <Navigation className="w-3 h-3" />
                <span>위도 (Latitude)</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                required
                className="w-full text-xs bg-black border border-white/15 focus:border-white focus:outline-none rounded-none px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 flex items-center space-x-1">
                <Navigation className="w-3 h-3" />
                <span>경도 (Longitude)</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                required
                className="w-full text-xs bg-black border border-white/15 focus:border-white focus:outline-none rounded-none px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 flex items-center space-x-1">
                <Heart className="w-3 h-3 text-red-500" />
                <span>심박수 (BPM)</span>
              </label>
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                required
                className="w-full text-xs bg-black border border-white/15 focus:border-white focus:outline-none rounded-none px-3 py-2 font-mono text-red-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 flex items-center space-x-1">
                <Battery className="w-3 h-3 text-emerald-500" />
                <span>배터리 잔량 (%)</span>
              </label>
              <input
                type="number"
                value={battery}
                onChange={(e) => setBattery(Number(e.target.value))}
                min={0}
                max={100}
                required
                className="w-full text-xs bg-black border border-white/15 focus:border-white focus:outline-none rounded-none px-3 py-2 font-mono text-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || pedestrians.length === 0}
            className="w-full font-black bg-white text-black hover:bg-red-600 hover:text-white py-4 px-4 rounded-none transition-colors duration-150 flex items-center justify-center space-x-3 text-xs uppercase tracking-widest disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span>관제 전송망에 송출 중...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>📡 가상 아두이노 물리 감지 신호 전송하기 (POST /api/fall)</span>
              </>
            )}
          </button>
        </form>

        {/* Transmission Result Message logs */}
        {result && (
          <div
            className={`p-4 rounded-none border text-xs flex items-start space-x-3 ${
              result.success
                ? "bg-black border-emerald-500/40 text-emerald-400"
                : "bg-black border-red-500/40 text-red-400"
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <Flame className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <div className="font-mono">
              <p className="font-extrabold tracking-widest mb-1">{result.success ? "HTTP 201 CREATED // TRANSMISSION VERIFIED" : "HTTP ACTION FAILURE"}</p>
              <p className="font-sans leading-relaxed text-[11px] opacity-80">{result.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
