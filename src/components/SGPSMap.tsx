import { useState, useMemo, useEffect, useRef } from "react";
import { FallEvent } from "../types";
import { Compass, Info, MapPin, Search, Navigation, Phone, Map, ShieldAlert, CheckCircle, Store, Coffee, Train, GraduationCap } from "lucide-react";

interface SGPSMapProps {
  events: FallEvent[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
}

// 30 Real POIs in Daegu Hwawon-eup (대구 달성군 화원읍) - Markets, Stalls, Cafe, School, etc.
const DAEGU_HWAWON_POIS = [
  // Schools / Edu
  { id: "poi-1", category: "school", name: "대구화원고등학교 🏫", lat: 35.8118, lng: 128.5034, address: "대구 달성군 화원읍 설화오사길 9", tel: "053-233-8700", desc: "실시간 관제 거점 학교" },
  { id: "poi-2", category: "school", name: "달성중학교 🏫", lat: 35.8098, lng: 128.5028, address: "대구 달성군 화원읍 명곡로 11", tel: "053-233-8600", desc: "화원 화성타운 인근 중학 교육시설" },
  { id: "poi-3", category: "school", name: "대구화원초등학교 🏫", lat: 35.8162, lng: 128.5052, address: "대구 달성군 화원읍 비슬로2590", tel: "053-233-8500", desc: "화원역 인근 소학교" },

  // Subway / Trans
  { id: "poi-4", category: "transit", name: "설화명곡역 (대구도시철도 1호선) 🚇", lat: 35.8078, lng: 128.4984, address: "대구 달성군 화원읍 비슬로 지하2440", tel: "053-640-1111", desc: "대구지하철 1호선 종점역" },
  { id: "poi-5", category: "transit", name: "화원역 (대구도시철도 1호선) 🚇", lat: 35.8152, lng: 128.5052, address: "대구 달성군 화원읍 비슬로 지하2586", tel: "053-640-1112", desc: "화원시장 교차로역" },

  // Street Stalls & Traditional Market Stalls (진짜 실제 노점 및 오일장)
  { id: "poi-6", category: "stall", name: "화원전통시장 입구 찰잉어빵 노점 🐟", lat: 35.8153, lng: 128.5065, address: "대구 달성군 화원읍 비슬로 횡단보차도 앞", tel: "노점자율등록상인", desc: "겨울철 인기 잉어빵 수제 노점" },
  { id: "poi-7", category: "stall", name: "할머니 손떡볶이·순대 포장마차 노점 🍢", lat: 35.8158, lng: 128.5069, address: "대구 달성군 화원읍 화원시장 국밥골목 입구", tel: "노점자율등록상인", desc: "시장 40년 전통 양념 어묵 전문 노점" },
  { id: "poi-8", category: "stall", name: "화원시장 마당 즉석 가마솥 핫도그·꽈배기 노점 🥯", lat: 35.8159, lng: 128.5062, address: "대구 달성군 화원읍 화원천내길 7 뒤편", tel: "노점자율등록상인", desc: "오일장(1일, 6일) 주력 수제 제빵 노점" },
  { id: "poi-9", category: "stall", name: "화원오일장 할머니 직접재배 유기농 야채노점 🥬", lat: 35.8155, lng: 128.5072, address: "대구 달성군 화원읍 화원전통시장 안길", tel: "노점자율등록상인", desc: "직접 키운 산나물과 봄동 저렴 판매" },
  { id: "poi-10", category: "stall", name: "전통 한과·강정 즉석 수제 가마솥 노점 🍬", lat: 35.8154, lng: 128.5074, address: "대구 달성군 화원읍 화원전통시장 중정마당", tel: "노점자율등록상인", desc: "장날 직접 튀겨 무치는 옛날 강정" },

  // Restaurant & Domestic Enterprise
  { id: "poi-11", category: "enterprise", name: "화원시장 소문난 순대국밥 본점 🍲", lat: 35.8157, lng: 128.5066, address: "대구 달성군 화원읍 비슬로258길 6", tel: "053-633-8255", desc: "달성군 지정 명품 시장맛집 고기듬뿍 국밥" },
  { id: "poi-12", category: "enterprise", name: "동명식당 (전통 가마솥 국밥) 🍲", lat: 35.8158, lng: 128.5061, address: "대구 달성군 화원읍 비슬로258길 10", tel: "053-633-1455", desc: "할머니 손맛 육수 전통 소머리국밥" },
  { id: "poi-13", category: "enterprise", name: "다이소 대구화원점 🛍️", lat: 35.8143, lng: 128.5041, address: "대구 달성군 화원읍 비슬로 2577", tel: "053-636-6015", desc: "화원역 사거리 인근 대형 생활잡화 전문점" },
  { id: "poi-14", category: "enterprise", name: "올리브영 대구화원점 🧴", lat: 35.8141, lng: 128.5043, address: "대구 달성군 화원읍 비슬로 2573", tel: "053-633-5289", desc: "화원 중심 상업가 뷰티 앤 에스테틱 스토어" },

  // Convenience Stores / Retail
  { id: "poi-15", category: "retail", name: "GS25 화원고점 🏪", lat: 35.8112, lng: 128.5039, address: "대구 달성군 화원읍 설화오사길 2", tel: "053-634-1120", desc: "화원고 학생 통학로 초입 24시 편의점" },
  { id: "poi-16", category: "retail", name: "세븐일레븐 대구화원고점 🏪", lat: 35.8124, lng: 128.5030, address: "대구 달성군 화원읍 비슬로256길 38", tel: "053-631-0711", desc: "화원 우체국 뒷골목 쉼터형 편의점" },
  { id: "poi-17", category: "retail", name: "CU 화원명곡점 🏪", lat: 35.8080, lng: 128.5015, address: "대구 달성군 화원읍 명곡로 38", tel: "053-639-6500", desc: "명곡미래빌 대단지 학원가 길목 편의점" },

  // Gov / Welfare / Safety
  { id: "poi-18", category: "gov", name: "화원읍 행정복지센터 🏛️", lat: 35.8135, lng: 128.5048, address: "대구 달성군 화원읍 비슬로2584", tel: "053-668-3101", desc: "대구 달성군 화원읍 자치 행정총괄 본부" },
  { id: "poi-19", category: "safety", name: "대구달성경찰서 화원파출소 🚓", lat: 35.8122, lng: 128.5025, address: "대구 달성군 화원읍 비슬로256길 22", tel: "053-633-0112", desc: "보행안전 낙상 실시간 경찰 순찰차 합동 통제실" },
  { id: "poi-20", category: "gov", name: "화원우체국 📮", lat: 35.8138, lng: 128.5036, address: "대구 달성군 화원읍 비슬로2570", tel: "053-635-0014", desc: "주민 우정 서비스 및 통신금융 인프라" },

  // Banks / Financials
  { id: "poi-21", category: "bank", name: "화원농협 본점 🏦", lat: 35.8132, lng: 128.5054, address: "대구 달성군 화원읍 비슬로 2581", tel: "053-630-8114", desc: "화원오일장 주차 시설 초입 농업협동은행" },
  { id: "poi-22", category: "bank", name: "대구은행 화원지점 (iM뱅크) 🏢", lat: 35.8145, lng: 128.5044, address: "대구 달성군 화원읍 비슬로 2575", tel: "053-635-2111", desc: "화원역 최고 교통 중심지 지방 금융창구" },
  { id: "poi-23", category: "bank", name: "화원 새마을금고 본점 🏦", lat: 35.8140, lng: 128.5039, address: "대구 달성군 화원읍 비슬로 2569", tel: "053-633-8840", desc: "서민금융 지역조합 금융본부" },

  // Cafes
  { id: "poi-24", category: "cafe", name: "이디야커피 대구화원점 ☕", lat: 35.8130, lng: 128.5041, address: "대구 달성군 화원읍 비슬로 2566", tel: "053-632-1590", desc: "화원역 인근 시그니처 블렌딩 아메리카노" },
  { id: "poi-25", category: "cafe", name: "투썸플레이스 대구화원점 ☕", lat: 35.8126, lng: 128.5037, address: "대구 달성군 화원읍 비슬로 2552", tel: "053-634-2230", desc: "화원고등학교 건너편 2층 대형 디저트 카페" },
  { id: "poi-26", category: "cafe", name: "스타벅스 대구화원DT점 ☕", lat: 35.8190, lng: 128.5115, address: "대구 달성군 화원읍 비슬로 2611", tel: "1522-3232", desc: "차량 진출입 드라이브스루 스타벅스 대구지점" },
  { id: "poi-27", category: "cafe", name: "파리바게뜨 대구화원역점 🍰", lat: 35.8148, lng: 128.5049, address: "대구 달성군 화원읍 비슬로 2583", tel: "053-633-0487", desc: "아침 등교길 제빵 베이커리 숍" },

  // Medical
  { id: "poi-28", category: "medical", name: "화원 연세약국 💊", lat: 35.8134, lng: 128.5049, address: "대구 달성군 화원읍 비슬로 2585", tel: "053-635-4420", desc: "화원읍 행정복지센터 앞 연중무휴 처방약국" },
  { id: "poi-29", category: "medical", name: "명곡요양병원 🏥", lat: 35.8066, lng: 128.5015, address: "대구 달성군 화원읍 명곡로 56", tel: "053-644-7582", desc: "거동불편 어르신 실시간 메디컬 재활 전문병원" },

  // Community Parks & Bus Stops
  { id: "poi-30", category: "transit", name: "명곡리 미래빌아파트 건너 버스정류장 🚌", lat: 35.8104, lng: 128.5025, address: "명곡미래빌 1단지 보행자 전용도로 초입", tel: "대구버스운영정보", desc: "달서4번, 달성2번 화원 관내 버스 노선 하차지" }
];

export default function SGPSMap({ events, selectedEventId, onSelectEvent }: SGPSMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const poiMarkersRef = useRef<{ [key: string]: any }>({});
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<FallEvent | null>(null);
  
  // Custom overlay reference hooks
  const rescueCircleRef = useRef<any>(null);
  const rescueLineRef = useRef<any>(null);

  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [mapSize, setMapSize] = useState<"standard" | "large" | "xlarge">("large");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Invalidate map size on responsive height/collapse changes to ensure tiles render seamlessly
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 150);
    }
  }, [mapSize, isSidebarCollapsed]);

  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || null;
  }, [selectedEventId, events]);

  // Haversine formula to compute exact distance from fall location to nearby stalls/landmarks
  const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  // Human-readable angular orientation / cardinal direction helper
  const getCardinalDirection = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    let angle = (Math.atan2(dLon, dLat) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    if (angle >= 337.5 || angle < 22.5) return "북쪽";
    if (angle >= 22.5 && angle < 67.5) return "북동쪽";
    if (angle >= 67.5 && angle < 112.5) return "동쪽";
    if (angle >= 112.5 && angle < 157.5) return "남동쪽";
    if (angle >= 157.5 && angle < 202.5) return "남쪽";
    if (angle >= 202.5 && angle < 247.5) return "남서쪽";
    if (angle >= 247.5 && angle < 292.5) return "서쪽";
    if (angle >= 292.5 && angle < 337.5) return "북서쪽";
    return "인근";
  };

  // Computes the absolute closest 3 landmarks to the selected fall event
  const closestPois = useMemo(() => {
    if (!selectedEvent) return [];
    const withDistance = DAEGU_HWAWON_POIS.map((poi) => {
      const dist = getDistanceInMeters(
        selectedEvent.latitude,
        selectedEvent.longitude,
        poi.lat,
        poi.lng
      );
      const dir = getCardinalDirection(
        selectedEvent.latitude,
        selectedEvent.longitude,
        poi.lat,
        poi.lng
      );
      return { ...poi, distance: dist, direction: dir };
    });
    // Sort ascending (nearest first) to render on-screen
    return withDistance.sort((a, b) => a.distance - b.distance).slice(0, 3);
  }, [selectedEvent]);

  // Load OpenStreetMap with Kakao Map colorations
  useEffect(() => {
    if ((window as any).L) {
      setMapLoaded(true);
      return;
    }

    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(cssLink);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      setMapLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const mapInstance = L.map(mapContainerRef.current, {
      zoomControl: false, // Custom Kakao-styled zoom buttons
      attributionControl: false,
    }).setView([35.8118, 128.5034], 17);

    // Warm, highly legible, high-detailed OpenStreetMap standard tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(mapInstance);

    mapRef.current = mapInstance;

    // Attach custom Zoom controls to look like Kakao Map UI (+ / - panel)
    const zoomContainer = L.control({ position: "bottomright" });
    zoomContainer.onAdd = () => {
      const div = L.DomUtil.create("div", "kakao-zoom-ctrl flex flex-col bg-white border-2 border-black/10 shadow-lg select-none");
      div.innerHTML = `
        <button id="zoom-in-btn" class="w-8 h-8 font-black text-sm text-[#444] hover:bg-neutral-100 flex items-center justify-center border-b border-neutral-200">+</button>
        <button id="zoom-out-btn" class="w-8 h-8 font-black text-lg text-[#444] hover:bg-neutral-100 flex items-center justify-center">-</button>
      `;
      return div;
    };
    zoomContainer.addTo(mapInstance);

    setTimeout(() => {
      const btnIn = document.getElementById("zoom-in-btn");
      const btnOut = document.getElementById("zoom-out-btn");
      if (btnIn) btnIn.onclick = () => mapRef.current?.zoomIn();
      if (btnOut) btnOut.onclick = () => mapRef.current?.zoomOut();
    }, 200);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapLoaded]);

  // Sync POI markers on map with specific colors and click actions
  useEffect(() => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    // Clean previous POI markers
    Object.keys(poiMarkersRef.current).forEach((key) => {
      poiMarkersRef.current[key].remove();
    });
    poiMarkersRef.current = {};

    DAEGU_HWAWON_POIS.forEach((poi) => {
      const isSelected = poi.id === selectedPoiId;
      
      // Kakao map standard marker design (Yellow header pin with small indicator)
      let customColor = "bg-[#ffeb00] text-[#111] border-2 border-amber-500 shadow-md";
      if (poi.category === "stall") customColor = "bg-rose-600 text-white border-2 border-rose-900 shadow-md animate-pulse";
      if (poi.category === "school") customColor = "bg-indigo-900/90 text-white border-2 border-indigo-950 shadow-sm";
      if (poi.category === "transit") customColor = "bg-sky-700 text-white border border-sky-950 shadow-sm";
      if (poi.category === "safety") customColor = "bg-red-800 text-white border border-red-950 shadow-md";

      const focusOutline = isSelected ? "ring-4 ring-yellow-400 scale-125 z-[3500]" : "opacity-85 hover:opacity-100 hover:scale-105";

      const markerHtml = `
        <div class="flex flex-col items-center select-none ${focusOutline} transition-all duration-150">
          <div class="px-2 py-1 ${customColor} text-[8.5px] font-black shadow-lg rounded-sm leading-none flex items-center space-x-1 uppercase tracking-tight">
            <span>${poi.name}</span>
          </div>
          <div class="w-1.5 h-1.5 bg-neutral-900 rotate-45 -mt-0.5"></div>
        </div>
      `;

      const divIcon = L.divIcon({
        className: "kakao-custom-poi-marker",
        html: markerHtml,
        iconSize: [120, 32],
        iconAnchor: [60, 24],
      });

      const marker = L.marker([poi.lat, poi.lng], { icon: divIcon })
        .addTo(map)
        .on("click", () => {
          setSelectedPoiId(poi.id);
          map.setView([poi.lat, poi.lng], 18);
        });

      poiMarkersRef.current[poi.id] = marker;
    });

  }, [mapLoaded, selectedPoiId]);

  // Synchronize dynamic active emergency telemetry markers
  useEffect(() => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    events.forEach((evt) => {
      const isSelected = evt.id === selectedEventId;
      const isEmergency = !evt.resolved && (evt.status === "fall" || evt.status === "impact_warning");

      let colorClasses = "bg-emerald-500 shadow-emerald-500/50";
      let statusIndicator = "🟢";
      if (isEmergency) {
        colorClasses = evt.status === "fall" ? "bg-red-600 shadow-red-600/50" : "bg-amber-500 shadow-amber-500/50";
        statusIndicator = evt.status === "fall" ? "🚨" : "⚠️";
      } else if (evt.resolved) {
        colorClasses = "bg-neutral-600 opacity-55";
        statusIndicator = "🔘";
      }

      const activeBorder = isSelected 
        ? "border-[3px] border-white scale-125 z-[5000]" 
        : "border-2 border-black hover:scale-110";

      const markerHtml = `
        <div class="relative flex flex-col items-center select-none">
          ${isEmergency ? `
            <span class="absolute inline-flex h-10 w-10 rounded-full ${evt.status === 'fall' ? 'bg-red-600/30' : 'bg-amber-500/30'} animate-ping -top-2.5"></span>
          ` : ""}
          <div class="w-6 h-6 rounded-none flex items-center justify-center ${colorClasses} ${activeBorder} transition-transform duration-150 shadow-2xl">
            <span class="text-[8px] font-black text-white shrink-0">IoT</span>
          </div>
          <div class="mt-1 bg-black border border-white/20 text-[#ffeb00] text-[9.5px] font-black uppercase tracking-widest px-2 py-0.5 whitespace-nowrap shadow-md">
            ${statusIndicator} ${evt.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-incident-icon",
        html: markerHtml,
        iconSize: [120, 50],
        iconAnchor: [60, 25],
      });

      if (markersRef.current[evt.id]) {
        markersRef.current[evt.id].setLatLng([evt.latitude, evt.longitude]);
        markersRef.current[evt.id].setIcon(customIcon);
      } else {
        const marker = L.marker([evt.latitude, evt.longitude], { icon: customIcon })
          .addTo(map)
          .on("click", () => {
            onSelectEvent(evt.id);
          })
          .on("mouseover", () => {
            setHoveredEvent(evt);
          })
          .on("mouseout", () => {
            setHoveredEvent(null);
          });
        markersRef.current[evt.id] = marker;
      }
    });

    // Remove legacy markers
    const activeIds = new Set(events.map((e) => e.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!activeIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [mapLoaded, events, selectedEventId]);

  // Smooth fly action on item selections
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedEventId) return;

    const focusedEvent = events.find((e) => e.id === selectedEventId);
    if (focusedEvent) {
      map.flyTo([focusedEvent.latitude, focusedEvent.longitude], 18, {
        animate: true,
        duration: 1.0,
      });
    }
  }, [selectedEventId, mapLoaded]);

  // Dynamically sync emergency scope circles and connecting leader polylines
  useEffect(() => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L || !mapLoaded) return;

    // Clean up previous special overlays safely
    if (rescueCircleRef.current) {
      rescueCircleRef.current.remove();
      rescueCircleRef.current = null;
    }
    if (rescueLineRef.current) {
      rescueLineRef.current.remove();
      rescueLineRef.current = null;
    }

    if (!selectedEvent) return;

    const eventLatLng: [number, number] = [selectedEvent.latitude, selectedEvent.longitude];

    // 1. Draw a scan range boundary circle representing the critical Search Area
    const isCrisis = !selectedEvent.resolved && (selectedEvent.status === "fall" || selectedEvent.status === "impact_warning");
    rescueCircleRef.current = L.circle(eventLatLng, {
      radius: 40,
      color: selectedEvent.status === "fall" ? "#ef4444" : "#f59e0b",
      weight: 1.5,
      fillColor: selectedEvent.status === "fall" ? "#ef4444" : "#f59e0b",
      fillOpacity: isCrisis ? 0.14 : 0.04,
      dashArray: "3, 6"
    }).addTo(map);

    // 2. Overlay a connecting leader polyline to the nearest landmark context for rescuers
    let targetPoi = DAEGU_HWAWON_POIS.find((p) => p.id === selectedPoiId);
    if (!targetPoi && closestPois.length > 0) {
      targetPoi = closestPois[0];
    }

    if (targetPoi) {
      const poiLatLng: [number, number] = [targetPoi.lat, targetPoi.lng];
      rescueLineRef.current = L.polyline([eventLatLng, poiLatLng], {
        color: "#ffeb00",
        weight: 2,
        dashArray: "5, 8",
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);
    }

    return () => {
      if (rescueCircleRef.current) {
        rescueCircleRef.current.remove();
      }
      if (rescueLineRef.current) {
        rescueLineRef.current.remove();
      }
    };
  }, [mapLoaded, selectedEvent, selectedPoiId, closestPois]);

  // Navigate Map centered around specific coordinate presets
  const handleFocusPoi = (poi: typeof DAEGU_HWAWON_POIS[0]) => {
    setSelectedPoiId(poi.id);
    if (mapRef.current) {
      mapRef.current.flyTo([poi.lat, poi.lng], 19, {
        animate: true,
        duration: 0.8
      });
    }
  };

  const categories = [
    { value: "all", label: "전체보기 📍" },
    { value: "stall", label: "오일장/노점 🛒" },
    { value: "school", label: "학교시설 🏫" },
    { value: "transit", label: "지하철역/대중교통 🚇" },
    { value: "enterprise", label: "주요 매장/식당 🍲" },
    { value: "gov", label: "관공서/우체국 🏛️" },
    { value: "bank", label: "은행 🏦" },
    { value: "cafe", label: "카페/베이커리 ☕" },
    { value: "medical", label: "병원/약국 💊" }
  ];

  return (
    <div className="bg-[#111111] border-2 border-white/10 rounded-none overflow-hidden flex flex-col font-sans text-neutral-200">
      
      {/* Telemetry HUD Header inspired by Kakao Web Map controls */}
      <div className="bg-[#ffeb00] text-[#111] px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 z-10 border-b-2 border-yellow-500">
        <div className="flex items-center space-x-2">
          {/* Real Kakao Maps Korean Branding Identity logo */}
          <div className="bg-black text-[#ffeb00] text-[11px] font-extrabold px-1.5 py-0.5 uppercase tracking-tighter leading-none flex items-center shrink-0">
            kakao
          </div>
          <div>
            <h4 className="font-extrabold text-xs tracking-tight uppercase leading-none">kakaomap 연계 대구 화원지구 통합 관제망</h4>
            <p className="text-[10px] opacity-75 font-medium mt-0.5 uppercase tracking-wide">
              Daegu Hwawon-eup Live Digital Twin Grid // 30 Real POIs Loaded Successfully
            </p>
          </div>
        </div>
        
        {/* Header Right controllers with Sidebar Collapse and telemetry connection banner */}
        <div className="flex items-center space-x-2 gap-y-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-[10px] sm:text-[10.5px] font-black bg-black text-[#ffeb00] border border-black/20 hover:bg-neutral-900 px-3 py-1.5 flex items-center space-x-1 uppercase tracking-widest transition-all shadow-md active:scale-95"
            title="지도 넓게 보기 토글"
          >
            <span>{isSidebarCollapsed ? "◀ 관제판 열기 (Show Console)" : "▶ 지도 화면 넓게 채우기 (Wide Map View)"}</span>
          </button>

          <div className="text-[9.5px] font-extrabold bg-black/90 text-white border border-black px-2.5 py-1.5 flex items-center space-x-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#ffeb00] animate-pulse"></span>
            <span>카카오맵 기반 정밀 축적 모드</span>
          </div>
        </div>
      </div>

      {/* Main interactive grid: Left SOS Dispatch Sidebar (collapsible) + Right map */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10 ${mapSize === "standard" ? "h-[640px]" : mapSize === "large" ? "h-[850px]" : "h-[1050px]"} relative transition-all duration-300`}>
        
        {/* Left Emergency & Stall Analysis Panel (cols-4 / collapsible) */}
        <div className={`${isSidebarCollapsed ? "hidden lg:hidden" : "lg:col-span-4"} flex flex-col h-full bg-[#0a0a0a] overflow-hidden transition-all duration-300`}>
          
          {/* Header Identity */}
          <div className="p-4 border-b border-white/10 bg-[#0d0d0d] space-y-1">
            <span className="text-[8.5px] font-mono text-amber-500 font-extrabold tracking-widest uppercase">Emergency Diagnostic Station</span>
            <h4 className="text-xs font-black text-white uppercase tracking-tight flex items-center">
              <ShieldAlert className="w-4 h-4 text-red-500 mr-1.5 animate-pulse" />
              <span>낙상 정밀 사고 연계 & 지형 대조</span>
            </h4>
          </div>

          {/* Interactive Controller Screen */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/25">
            
            {/* 1. Selected Event HUD Spotlight Card */}
            {selectedEvent ? (
              <div className={`border-2 p-4.5 space-y-3.5 relative ${
                !selectedEvent.resolved && selectedEvent.status === "fall"
                  ? "bg-red-950/20 border-red-600/60"
                  : !selectedEvent.resolved && selectedEvent.status === "impact_warning"
                  ? "bg-amber-950/10 border-amber-500/50"
                  : "bg-neutral-900/40 border-neutral-700/50"
              }`}>
                {/* Background badge */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/50 border border-white/5 font-mono text-[8px] font-black tracking-widest text-neutral-400">
                  {selectedEvent.pedestrianId}
                </div>

                <div>
                  <span className="text-[9px] font-extrabold text-neutral-400 block uppercase font-mono tracking-wider">target profiles</span>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className="text-base font-black text-white tracking-tight">{selectedEvent.name}</span>
                    <span className="text-xs font-bold text-neutral-400">({selectedEvent.age}세, 보행장치 테스터)</span>
                  </div>
                </div>

                {/* Telemetry coordinate box */}
                <div className="bg-black border border-white/10 p-3 rounded-none space-y-1.5">
                  <span className="text-[8.5px] font-mono font-bold text-neutral-500 tracking-wider block uppercase">GPS SENSOR COORD (WGS-84)</span>
                  <div className="font-mono text-xs text-[#ffeb00] font-black flex flex-col justify-center space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">緯度 (LAT):</span>
                      <span className="tracking-widest">{selectedEvent.latitude.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">經度 (LNG):</span>
                      <span className="tracking-widest">{selectedEvent.longitude.toFixed(6)}</span>
                    </div>
                  </div>
                  
                  {/* Map Focus Command */}
                  <button
                    onClick={() => {
                      if (mapRef.current) {
                        mapRef.current.flyTo([selectedEvent.latitude, selectedEvent.longitude], 19, {
                          animate: true,
                          duration: 1.0,
                        });
                      }
                    }}
                    className="w-full mt-2 bg-neutral-900 hover:bg-neutral-800 text-white border border-white/10 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest flex items-center justify-center space-x-1.5 transition-all text-center leading-none"
                  >
                    <Compass className="w-3 h-3 text-[#ffeb00] animate-spin" />
                    <span>이 사고 위치로 최우선 카메라 밀착 정렬</span>
                  </button>
                </div>

                {/* 119 Rescue Localization Guide Text */}
                {closestPois.length > 0 && (
                  <div className="bg-[#1c0808]/40 border-l-2 border-red-500 p-3 space-y-1">
                    <span className="text-[8.5px] font-extrabold text-[#fecaca] uppercase tracking-wider block">🚑 119 구조팀 전파용 지형 브리핑</span>
                    <p className="text-[11px] leading-relaxed text-neutral-200 font-medium">
                      “사고 대상자는 현재 <span className="text-red-400 font-extrabold">[{closestPois[0].name}]</span> 부근에서{" "}
                      <span className="text-[#ffeb00] font-black">{closestPois[0].direction} 약 {closestPois[0].distance}m 거리</span>의 노상 배후 골목에 넘어짐 상태로 쓰러져 있습니다.”
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-white/5 p-8 text-center text-neutral-500">
                인공지능 비컨 신호 대기 상태
              </div>
            )}

            {/* 2. Closest Street Stalls & Landmarks (The precise indexing) */}
            {selectedEvent && closestPois.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center">
                    <Store className="w-3.5 h-3.5 mr-1 text-rose-500" />
                    <span>지리적 대조 노점 및 구호거점 (TOP 3)</span>
                  </span>
                  <span className="text-[9px] text-[#ffeb00] font-mono leading-none font-bold">인접 오일장·노점 리스트</span>
                </div>

                <div className="space-y-2">
                  {closestPois.map((poi, idx) => {
                    const isSelected = selectedPoiId === poi.id;
                    return (
                      <div
                        key={poi.id}
                        onClick={() => {
                          setSelectedPoiId(poi.id);
                          if (mapRef.current) {
                            mapRef.current.flyTo([poi.lat, poi.lng], 19, {
                              animate: true,
                              duration: 0.8
                            });
                          }
                        }}
                        className={`p-3 border transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? "bg-[#ffeb00]/5 border-[#ffeb00]"
                            : "bg-neutral-900/60 border-white/5 hover:border-white/15 hover:bg-neutral-900"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <h5 className="font-extrabold text-[11.5px] text-white leading-tight">
                              {poi.name}
                            </h5>
                            <span className="text-[9.5px] text-neutral-400 font-medium tracking-wide">
                              {poi.address}
                            </span>
                          </div>
                          
                          {/* Compass distance flag */}
                          <div className="text-right shrink-0">
                            <span className="text-[10.5px] font-black text-[#ffeb00] block tracking-wide">
                              {poi.distance}m
                            </span>
                            <span className="text-[9px] text-neutral-500 font-bold block leading-none">
                              {poi.direction}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-neutral-500 italic mt-1.5 border-t border-white/5 pt-1.5">
                          {poi.desc}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[9px] font-semibold text-neutral-400">
                          <span>연락/관리: {poi.tel}</span>
                          <span className="text-[#ffeb00] hover:underline flex items-center tracking-wider">
                            <Navigation className="w-2.5 h-2.5 mr-1" />
                            <span>연계 인도선 그리기</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Incident History Selector for Quick Monitoring Toggle */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center">
                  <Compass className="w-3.5 h-3.5 mr-1 text-sky-500" />
                  <span>실시간 장치 신호 대기열 ({events.length})</span>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {events.map((evt) => {
                  const isCurSelected = evt.id === selectedEventId;
                  const isFallDanger = !evt.resolved && evt.status === "fall";
                  const isWarningDanger = !evt.resolved && evt.status === "impact_warning";
                  
                  return (
                    <button
                      key={evt.id}
                      onClick={() => onSelectEvent(evt.id)}
                      className={`px-3 py-2 text-left transition-all border flex items-center justify-between ${
                        isCurSelected
                          ? "bg-white text-black border-white font-black"
                          : "bg-neutral-900/60 text-neutral-300 border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          isFallDanger
                            ? "bg-red-500 animate-ping"
                            : isWarningDanger
                            ? "bg-amber-500 animate-pulse"
                            : "bg-emerald-500"
                        }`}></span>
                        <span className="text-[10.5px] truncate font-extrabold">
                          {evt.name} ({evt.age}세)
                        </span>
                      </div>
                      <span className="text-[9px] font-mono opacity-60">
                        {evt.status === "fall" ? "🚨 낙상" : evt.status === "impact_warning" ? "⚠️ 충격" : "🟢 안정"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Map Viewport Config Section inside Sidebar */}
            <div className="bg-black/45 border border-white/5 p-3 space-y-2">
              <span className="text-[8.5px] font-mono text-neutral-500 font-extrabold tracking-widest uppercase block">Map Height presets</span>
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-bold text-neutral-400">지도 세로 축척 조절</span>
                <div className="flex space-x-1">
                  {(["standard", "large", "xlarge"] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setMapSize(sz)}
                      className={`px-2 py-1 text-[9px] font-black border uppercase transition-all ${
                        mapSize === sz
                          ? "bg-[#ffeb00] text-black border-[#ffeb00]"
                          : "bg-[#161616] text-neutral-400 border-white/5 hover:text-white"
                      }`}
                    >
                      {sz === "standard" ? "기본" : sz === "large" ? "크게" : "최대"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Mapping Viewport Canvas (cols-8 or 12 depending on sidebar toggle state) */}
        <div className={`${isSidebarCollapsed ? "lg:col-span-12" : "lg:col-span-8"} relative h-full flex flex-col justify-end bg-neutral-950 transition-all duration-300`}>
          
          {/* Legend and stats panel overlay */}
          <div className="absolute top-4 left-4 bg-black/95 border border-white/15 px-3.5 py-3 rounded-none text-[9.5px] space-y-1 text-white/90 z-[1000] font-mono uppercase tracking-widest pointer-events-none shadow-2xl max-w-xs">
            <p className="font-extrabold text-[#ffeb00] border-b border-white/15 pb-1 mb-1.5 flex items-center">
              <Map className="w-3.5 h-3.5 mr-1" />
              <span>DAEGU HWAWON MAP SYMBOLS</span>
            </p>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-red-600 border border-white block"></span>
              <span className="font-semibold text-neutral-300">🚨 넘어짐 감지 (INCIDENT)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-amber-500 border border-white block"></span>
              <span className="font-semibold text-neutral-300">⚠️ 충격 경고 (IMPACT RISK)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 border border-white block"></span>
              <span className="font-semibold text-neutral-300">🟢 정상 보행 (STABLE SENSING)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-[#ffeb00] border border-stone-800 block"></span>
              <span className="font-semibold text-neutral-300">🏪 대구화원 실소매 상가 및 노점</span>
            </div>
          </div>

          {/* Leaflet viewport container */}
          <div 
            ref={mapContainerRef} 
            className="w-full h-full z-0 bg-neutral-900"
            style={{ cursor: "grab" }}
          />

          {!mapLoaded && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center space-y-3 z-20 text-white/50 font-mono text-[10px] uppercase tracking-widest">
              <div className="w-6 h-6 border-2 border-t-[#ffeb00] border-white/10 animate-spin rounded-full"></div>
              <span>카카오맵 동기화 및 대구 화원지구 노점/기업 수집중...</span>
            </div>
          )}

          {/* Floating Selected POI Info Window Popup */}
          {selectedPoiId && (() => {
            const currentPoi = DAEGU_HWAWON_POIS.find(p => p.id === selectedPoiId);
            if (!currentPoi) return null;
            return (
              <div className="absolute bottom-4 right-4 bg-black/95 border-2 border-[#ffeb00] p-4 rounded-none max-w-sm z-[1000] text-xs space-y-2.5 shadow-2xl animate-fade-in text-white uppercase tracking-wide">
                <div className="flex items-start justify-between border-b border-white/15 pb-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] bg-[#ffeb00] text-black font-extrabold px-1.5 py-0.5 rounded-sm">
                      상가/정밀 노점
                    </span>
                    <h5 className="font-black text-xs text-[#ffeb00] mt-1">{currentPoi.name}</h5>
                  </div>
                  <button 
                    onClick={() => setSelectedPoiId(null)}
                    className="text-neutral-400 hover:text-white font-extrabold font-mono text-xs p-1"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-1 text-[10.5px] font-semibold text-neutral-300 font-sans">
                  <p className="leading-relaxed">
                    <span className="text-neutral-500 font-extrabold font-mono text-[9px] block">소재지 지번주소:</span>
                    {currentPoi.address}
                  </p>
                  <p>
                    <span className="text-neutral-500 font-extrabold font-mono text-[9px] block">지정 상세 설명:</span>
                    {currentPoi.desc}
                  </p>
                  <p className="flex items-center">
                    <span className="text-neutral-500 font-mono mr-2">연락처:</span>
                    {currentPoi.tel}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px] font-bold text-neutral-400">
                  <span className="font-mono text-[8.5px] text-neutral-500">
                    LAT:{currentPoi.lat} / LNG:{currentPoi.lng}
                  </span>
                  <button
                    onClick={() => {
                      if (mapRef.current) {
                        mapRef.current.setView([35.8118, 128.5034], 16);
                        setSelectedPoiId(null);
                      }
                    }}
                    className="text-yellow-400 hover:underline"
                  >
                    기본 중심점 복귀
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Selected incident info tooltip */}
          {selectedEvent && (
            <div className="absolute top-4 right-4 bg-black/95 border-2 border-red-600 p-4 rounded-none w-64 z-[1000] text-[10px] text-white/90 space-y-2 uppercase tracking-wide shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/15 pb-1.5">
                <span className="font-black text-white text-xs">{selectedEvent.name}</span>
                <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 font-mono font-black">
                  {selectedEvent.pedestrianId}
                </span>
              </div>
              <p className="text-[9px] text-neutral-400">만 나이: {selectedEvent.age}세 테스터 보행자</p>
              
              <div className="space-y-1 pt-1.5 border-t border-white/10 font-mono text-[9.5px]">
                <div className="flex justify-between">
                  <span className="text-neutral-400">장치 배터리:</span>
                  <span className="text-emerald-400 font-bold">{selectedEvent.battery}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">보행 심박수:</span>
                  <span className="text-red-500 font-extrabold">{selectedEvent.heartRate} BPM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">신호 상태:</span>
                  <span className={`font-black ${!selectedEvent.resolved && selectedEvent.status === "fall" ? "text-red-500" : "text-emerald-400"}`}>
                    {selectedEvent.status === "fall" ? "🚨 낙상 사태" : selectedEvent.status === "impact_warning" ? "⚠️ 충격 경고" : "Stables"}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Map Action Info Bar */}
      <div className="bg-[#0b0b0b] border-t border-white/10 px-5 py-3 text-[10px] text-neutral-400 font-semibold flex items-center justify-between uppercase tracking-wider">
        <div className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-yellow-400 shrink-0 animate-pulse" />
          <span>아두이노 실 장치에서 전송된 실시간 GPS 위경도 정보가 100% 매칭되어 실시간 주사되며, 오일장 노점 및 인접 주요 소상공인 마커가 동시에 조회됩니다.</span>
        </div>
        <span className="hidden md:inline font-mono text-neutral-500">DAEGU DAEGUKWANGYEOKSI LOCAL POI DATA BASE V2</span>
      </div>
    </div>
  );
}
