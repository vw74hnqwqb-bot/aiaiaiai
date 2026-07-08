import React, { useState } from "react";
import { UserPlus, Trash2, Heart, Shield, Phone, Tag, Smartphone } from "lucide-react";
import { Pedestrian } from "../types";
import { playSuccessBeep } from "./AudioAlarm";

interface PedestrianRegistryProps {
  pedestrians: Pedestrian[];
  onRegister: (pedestrian: Pedestrian) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => void;
}

export default function PedestrianRegistry({ pedestrians, onRegister, onDelete }: PedestrianRegistryProps) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name || !age) {
      setError("기기 고유 ID, 성명, 연령은 필수 입력값입니다.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await onRegister({
      id: id.trim().toUpperCase(),
      name: name.trim(),
      age: Number(age),
      phone: phone.trim() || "해당없음",
      notes: notes.trim() || "실제 기기 테스터"
    });

    setLoading(false);

    if (result.success) {
      // Clear inputs
      setId("");
      setName("");
      setAge("");
      setPhone("");
      setNotes("");
      playSuccessBeep();
    } else {
      setError(result.error || "사용자 등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-[#0b0b0b] border-2 border-white/10 rounded-none overflow-hidden text-[#F5F5F5] font-sans">
      <div className="bg-[#0f0f0f] border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserPlus className="w-4.5 h-4.5 text-white" />
          <h3 className="font-extrabold text-white text-xs tracking-wider uppercase">
            실제 사용자 기기 등록 및 관리 (Registry)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-white/40">REGISTERED: {pedestrians.length}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        
        {/* Registration Form (Left col-5) */}
        <div className="lg:col-span-5 p-6 space-y-4">
          <h4 className="text-[10px] uppercase font-black tracking-widest text-white/50 mb-2">실제 대상자 기기 신규 추가</h4>
          
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            
            {/* Device Portable ID */}
            <div>
              <label className="block text-[9px] font-black uppercase text-white/40 mb-1 flex items-center">
                <Smartphone className="w-3 h-3 mr-1 text-white/50" />
                <span>아두이노 기기 고유 ID (예: PED-1092) *</span>
              </label>
              <input
                type="text"
                placeholder="PED-XXXX"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                className="w-full text-xs bg-black border border-white/15 focus:border-white focus:outline-none px-3 py-2 font-mono text-white"
              />
            </div>

            {/* Name / Age */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-black uppercase text-white/40 mb-1">
                  보행자 성명 *
                </label>
                <input
                  type="text"
                  placeholder="실제 이름 입력"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full text-xs bg-black border border-white/15 focus:border-white focus:outline-none px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-white/40 mb-1">
                  만 연령 *
                </label>
                <input
                  type="number"
                  placeholder="예: 18"
                  value={age}
                  onChange={(e) => setAge(e.target.value !== "" ? Number(e.target.value) : "")}
                  min={1}
                  required
                  className="w-full text-xs bg-black border border-white/15 focus:border-white focus:outline-none px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            {/* Guardian emergency contact */}
            <div>
              <label className="block text-[9px] font-black uppercase text-white/40 mb-1 flex items-center">
                <Phone className="w-3 h-3 mr-1 text-white/50" />
                <span>보호자 긴급 연락처</span>
              </label>
              <input
                type="text"
                placeholder="예: 010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs bg-black border border-white/15 focus:border-white focus:outline-none px-3 py-2 font-mono"
              />
            </div>

            {/* Special Notes (e.g. Device description) */}
            <div>
              <label className="block text-[9px] font-black uppercase text-white/40 mb-1 flex items-center">
                <Tag className="w-3 h-3 mr-1 text-white/50" />
                <span>기기 위치 / 특이사항</span>
              </label>
              <input
                type="text"
                placeholder="예: 3학년 2반 김영수 단말장치"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs bg-black border border-white/15 focus:border-white focus:outline-none px-3 py-2"
              />
            </div>

            {error && (
              <p className="text-[10px] text-red-500 font-bold bg-red-950/20 p-2 border border-red-500/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-black bg-white hover:bg-neutral-200 text-black py-2.5 text-xs uppercase cursor-pointer transition-all duration-150 active:scale-95"
            >
              {loading ? "기기 및 사용자 등록 중..." : "사용자 기기 등록하기"}
            </button>
          </form>
        </div>

        {/* Registered list (Right col-7) */}
        <div className="lg:col-span-7 p-6 space-y-4">
          <h4 className="text-[10px] uppercase font-black tracking-widest text-white/50 mb-2">등록된 실제 기기 대상자 목록 ({pedestrians.length})</h4>
          
          {pedestrians.length === 0 ? (
            <div className="py-12 text-center text-xs text-white/40 uppercase tracking-widest border border-dashed border-white/10 rounded-none bg-black/40">
              현재 관제망에 등록된 실제 사용자가 없습니다.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {pedestrians.map((p) => (
                <div
                  key={p.id}
                  className="bg-black border border-white/10 p-3 flex items-center justify-between hover:border-white/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-xs text-white uppercase">{p.name}</span>
                      <span className="text-[10px] font-mono text-white/50 bg-[#111] px-1.5 py-0.5 border border-white/5">{p.id}</span>
                      <span className="text-[10px] text-white/40 font-mono">({p.age}세)</span>
                    </div>
                    <p className="text-[10px] text-white/60 font-medium">연락처: {p.phone}</p>
                    <p className="text-[10px] text-white/40 italic">{p.notes}</p>
                  </div>

                  <button
                    onClick={() => onDelete(p.id)}
                    className="p-2 border border-white/10 hover:bg-red-950/30 hover:border-red-600 hover:text-red-500 transition-colors cursor-pointer text-white/50"
                    title="기기 데이터 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
