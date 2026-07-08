import React, { useState, useEffect } from "react";
import { FallEvent } from "../types";
import { ShieldAlert, AlertCircle, Phone, Heart, Battery, Milestone, Clock, Check, VolumeX } from "lucide-react";
import { startEmergencySiren, stopEmergencySiren, playSuccessBeep } from "./AudioAlarm";

interface ActiveEmergencyModalProps {
  activeFalls: FallEvent[];
  onResolve: (id: string, notes: string) => Promise<void>;
}

export default function ActiveEmergencyModal({ activeFalls, onResolve }: ActiveEmergencyModalProps) {
  const [resolveNotes, setResolveNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [silenced, setSilenced] = useState(false);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);

  // Focus on the first unresolved fall
  const currentEmergency = activeFalls[0];

  // Stopwatch for elapsed time since fall
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!currentEmergency) {
      stopEmergencySiren();
      return;
    }

    // Connect siren
    if (!silenced) {
      startEmergencySiren();
    } else {
      stopEmergencySiren();
    }

    // Set up elapsed counter
    const fallTime = new Date(currentEmergency.timestamp).getTime();
    setElapsedSeconds(Math.floor((Date.now() - fallTime) / 1000));

    const stopwatch = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - fallTime) / 1000));
    }, 1000);

    return () => {
      clearInterval(stopwatch);
      stopEmergencySiren();
    };
  }, [currentEmergency, silenced]);

  // Handle browser audio permission activation
  useEffect(() => {
    const handleInitialUserInteraction = () => {
      if (!audioPermissionGranted) {
        setAudioPermissionGranted(true);
        if (currentEmergency && !silenced) {
          startEmergencySiren();
        }
      }
    };
    window.addEventListener("click", handleInitialUserInteraction);
    return () => window.removeEventListener("click", handleInitialUserInteraction);
  }, [audioPermissionGranted, currentEmergency, silenced]);

  if (!currentEmergency) return null;

  const handleSilenceAlarm = () => {
    setSilenced(true);
    stopEmergencySiren();
  };

  const handleResolveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalNotes = resolveNotes.trim() || `${currentEmergency.name}님 보호자 유선 연락 및 안전 확인 완료.`;
      await onResolve(currentEmergency.id, finalNotes);
      setResolveNotes("");
      setSilenced(false); // Reset for next potential alarm
      playSuccessBeep();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Human readable duration format
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min > 0 ? `${min}분 ` : ""}${sec}초`;
  };

  const isCritical = currentEmergency.status === "fall";

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-fadeIn">
      {/* Dynamic Red/Yellow Alert Backdrop Flashing */}
      <div className={`absolute inset-0 -z-10 pointer-events-none opacity-30 ${
        isCritical ? "animate-pulseRed bg-red-600" : "animate-pulseYellow bg-amber-500"
      }`} />

      {/* Main Alert Card Chassis (Sharp corners, heavy solid border, bold accents) */}
      <div className="bg-black border-4 border-red-600 w-full max-w-xl overflow-hidden font-sans text-[#F5F5F5] animate-scaleUp">
        {/* Urgent Warning Header */}
        <div className={`px-6 py-5 flex items-center justify-between text-black font-black ${
          isCritical ? "bg-red-600" : "bg-amber-500"
        }`}>
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-7 h-7 animate-bounce" strokeWidth={2.5} />
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider leading-tight">
                {isCritical ? "🚨 보행자 넘어짐(낙상) 사고가 감지되었습니다" : "⚠️ 보행 장치 비정상 충격이 감지되었습니다"}
              </h2>
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-90 mt-0.5">실시간 보행자 위험 감보 시스템</p>
            </div>
          </div>
          
          <button
            onClick={handleSilenceAlarm}
            className="flex items-center space-x-1.5 px-3 py-1 bg-black text-[#F5F5F5] text-[10px] font-black uppercase tracking-widest border border-black hover:bg-white hover:text-black transition-colors duration-150 cursor-pointer"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>경보음 음소거 (MUTE)</span>
          </button>
        </div>

        {/* Diagnostic Grid Details */}
        <div className="p-6 space-y-6">
          {/* Audio Permission Alert Callout if sound blocked */}
          {!audioPermissionGranted && (
            <div className="bg-[#111] border border-red-600/30 px-4 py-2.5 text-center text-[10px] font-bold text-red-400 uppercase tracking-wider">
              📣 화면을 클릭하면 실제 가습 기기 경보 부저음 사운드가 활성화됩니다.
            </div>
          )}

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[#111] border border-white/15 p-4">
            <div>
              <span className="text-[9px] uppercase font-mono text-[#050505] bg-white px-2 py-0.5 font-black">
                단말 고유 아이디: {currentEmergency.pedestrianId}
              </span>
              <div className="flex items-baseline space-x-3 mt-2">
                <span className="text-2xl font-black uppercase tracking-tight text-white">{currentEmergency.name}</span>
                <span className="text-xs font-mono font-bold text-white/50">{currentEmergency.age}세 보행자</span>
              </div>
            </div>

            {/* Elapsed Time Stopwatch Indicator */}
            <div className="mt-3 md:mt-0 flex items-center bg-red-950/40 border border-red-500/50 px-4 py-2 text-red-500 space-x-3">
              <Clock className="w-4 h-4 shrink-0 animate-spin" />
              <div className="font-mono">
                <span className="text-[9px] block uppercase font-bold tracking-wider opacity-60">재해 후 경과 시간</span>
                <span className="text-lg font-black tracking-tight">{formatTime(elapsedSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Core Hardware Vitals */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#111] border border-white/10 p-4 text-center">
              <div className="flex items-center justify-center text-red-500 mb-1">
                <Heart className="w-4 h-4 animate-pulse mr-1 shrink-0" />
                <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">실시간 심박수</span>
              </div>
              <span className="text-2xl font-mono font-black text-red-500">
                {currentEmergency.heartRate} <span className="text-xs font-bold text-white/30">BPM</span>
              </span>
            </div>

            <div className="bg-[#111] border border-white/10 p-4 text-center">
              <div className="flex items-center justify-center text-emerald-500 mb-1">
                <Battery className="w-4 h-4 mr-1 shrink-0" />
                <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">배터리 기기잔량</span>
              </div>
              <span className="text-2xl font-mono font-black text-emerald-400">
                {currentEmergency.battery}%
              </span>
            </div>

            <div className="bg-[#111] border border-white/10 p-4 text-center">
              <div className="flex items-center justify-center text-blue-400 mb-1">
                <Milestone className="w-4 h-4 mr-1 shrink-0" />
                <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">경위도 좌표</span>
              </div>
              <span className="text-[10px] font-mono leading-none block text-blue-400 font-bold mt-1 uppercase">
                위도:{currentEmergency.latitude.toFixed(4)}<br />경도:{currentEmergency.longitude.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Quick Actions (Call templates) */}
          <div className="grid grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-widest">
            <button
              type="button"
              onClick={() => alert("🚨 [실시간 비상 접수 완료] 아두이노 기기에서 발신된 구조 신호와 GPS 위위도 정보가 119 종합상황실과 연계 구축망에 전달됩니다.")}
              className="flex items-center justify-center space-x-2 bg-red-950/40 border border-red-500/40 hover:bg-white hover:text-black transition-all py-3.5 text-red-300 cursor-pointer text-center"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>🚨 119 긴급 구조 요청</span>
            </button>
            
            <button
              type="button"
              onClick={() => alert(`📞 보호자에게 실시간 긴급 알림 문자메시지(SMS) 전송을 원격으로 연동합니다.`)}
              className="flex items-center justify-center space-x-2 bg-[#111] border border-white/10 hover:bg-white hover:text-black transition-all py-3.5 text-[#F5F5F5] cursor-pointer text-center"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>📞 보호자 비상 안부 연락</span>
            </button>
          </div>

          <hr className="border-white/10" />

          {/* Action form to resolve danger state */}
          <form onSubmit={handleResolveAction} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">
                ✍️ 보행자 안전 보호 조치 기록 작성
              </label>
              <textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="대상자의 상태(예: 보행자 안전 귀가, 단순 기기 오감지 등) 및 어떤 조치를 취했는지 해결 기록을 기재해 주세요."
                className="w-full text-xs font-bold bg-black focus:outline-none border-2 border-white/10 focus:border-red-600 transition p-3.5 h-20 text-[#F5F5F5] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4.5 bg-white text-black font-black text-xs uppercase tracking-[0.2em] transition-colors duration-150 flex items-center justify-center space-x-2 cursor-pointer ${
                isSubmitting ? "opacity-50" : "hover:bg-red-600 hover:text-white"
              }`}
            >
              <Check className="w-4.5 h-4.5" strokeWidth={4} />
              <span>상황 조치 해결 서명 작성 및 알람 복구하기</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
