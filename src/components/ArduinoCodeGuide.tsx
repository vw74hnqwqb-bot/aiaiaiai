import { useState, useEffect } from "react";
import { Check, Copy, Cpu, Wifi, Code2, AlertTriangle } from "lucide-react";

export default function ArduinoCodeGuide() {
  const [copied, setCopied] = useState(false);
  const [appUrl, setAppUrl] = useState("https://your-app-domain.run.app");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(window.location.origin);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(arduinoScript(appUrl));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-black border-2 border-white/10 rounded-none overflow-hidden text-[#F5F5F5]">
      {/* Tab bar header */}
      <div className="bg-[#0b0b0b] px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Code2 className="w-5 h-5 text-white shrink-0" />
          <div>
            <h4 className="font-black text-xs text-white uppercase tracking-[0.2em]">PHYSICAL ARDUINO ESP32 CLIENT CODE GUIDE</h4>
            <p className="text-[10px] uppercase tracking-wider text-white/50 mt-0.5">MPU6050 Accelerometer + ESP32 Web Interface Firmware</p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-2 px-4 py-2 bg-white text-black hover:bg-black hover:text-white transition-colors duration-150 text-[10px] font-black uppercase tracking-widest border border-white cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
              <span>COPIED SUCCESSFULLY</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>COPY C++ CODE</span>
            </>
          )}
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Connection Architecture Callout */}
        <div className="bg-[#0b0b0b] p-5 border border-white/10 rounded-none space-y-3 text-xs">
          <h5 className="font-extrabold text-white uppercase tracking-wider flex items-center mb-1">
            <Cpu className="w-4 h-4 mr-2 text-white shrink-0" />
            ESP32 Wi-Fi Transmission Pipeline Interface
          </h5>
          <p className="text-white/70 leading-relaxed text-[11px] uppercase tracking-wide">
            아래 제공되는 소스코드는 <strong>ESP32 개발 보드</strong>와 <strong>MPU-6050 6축 자이로/가속도 센서</strong>를 기준으로 작성되었습니다. 
            해당 소스코드는 자이로 센서의 가속도 벡터 합성값(Total Acceleration Vector)이 설정 한계치를 초과(낙상 감지)할 시, 
            사용자가 지정한 와이파이를 통해 본 웹사이트 API 서버로 즉시 HTTP POST 패킷을 전송하여 관제망에 경고를 띄웁니다.
          </p>
          <div className="bg-black border border-white/10 p-3 font-mono text-[11px] break-all select-all text-white font-black">
            <span className="text-red-500 mr-2 font-bold">[YOUR ENDPOINT URL] :</span>
            {appUrl}/api/fall
          </div>
        </div>

        {/* Arduino C++ code window */}
        <div className="bg-[#0a0a0a] rounded-none border-2 border-white/10 overflow-hidden text-white">
          <div className="bg-[#0f0f0f] px-4 py-2.5 flex items-center text-xs border-b border-white/10 justify-between uppercase font-mono tracking-widest font-black text-white/50">
            <span>pedestrian_fall_detector_esp32.cpp</span>
            <div className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 bg-white/20" />
              <span className="w-2.5 h-2.5 bg-white/20" />
              <span className="w-2.5 h-2.5 bg-white" />
            </div>
          </div>
          <pre className="p-4 overflow-x-auto text-[11px] font-mono leading-relaxed bg-black text-white/90 max-h-96">
            <code>{arduinoScript(appUrl)}</code>
          </pre>
        </div>

        {/* Helpful connection tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] uppercase tracking-wider font-extrabold pb-2">
          <div className="bg-[#0b0b0b] border border-white/10 p-4 rounded-none">
            <div className="flex items-center space-x-2 text-white font-black mb-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>CIRCUIT BOARD PIN CONNECTIONS (MPU6050 - ESP32)</span>
            </div>
            <ul className="space-y-1.5 text-white/60 font-mono">
              <li><strong className="text-white">VCC</strong> ➡️ ESP32 3.3V PIN</li>
              <li><strong className="text-white">GND</strong> ➡️ ESP32 GND PIN</li>
              <li><strong className="text-white">SCL</strong> ➡️ ESP32 GPIO 22 (I2C SCL)</li>
              <li><strong className="text-white">SDA</strong> ➡️ ESP32 GPIO 21 (I2C SDA)</li>
            </ul>
          </div>

          <div className="bg-[#0b0b0b] border border-white/10 p-4 rounded-none">
            <div className="flex items-center space-x-2 text-white font-black mb-2.5">
              <Wifi className="w-4 h-4 shrink-0 text-white" />
              <span>DEPENDENT LIBRARIES INSTALLATION</span>
            </div>
            <ul className="space-y-1.5 text-white/60 font-mono">
              <li>CLIENT BOARD: <span className="text-white font-bold">ARDUINO IDE ➡️ BOARDS MANAGER ➡️ ESP32</span></li>
              <li>SENSOR DEPS: <span className="text-white font-bold">ADAFRUIT MPU6050 & ADAFRUIT SENSOR</span></li>
              <li>JSON PARSER: <span className="text-white font-bold">ARDUINOJSON BY BENOIT BLANCHON</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const arduinoScript = (originUrl: string) => `/**
 * 보행자 낙상 감지용 아두이노 (ESP32) 소스코드
 * 자이로센서 MPU6050 및 WiFi 연결을 포함한 실시간 HTTP POST 경보 송신 코드입니다.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>

// 1. 와이파이 연결 설정
const char* ssid = "YOUR_WIFI_SSID";          // 와이파이 이름 입력
const char* password = "YOUR_WIFI_PASSWORD";  // 와이파이 비밀번호 입력

// 2. 본 어플리케이션 실시간 관제 서버 엔드포인트 URL
const char* serverUrl = "${originUrl}/api/fall";

Adafruit_MPU6050 mpu;

// 기기 사용자 정보 세팅 (기기별 식별자 분리용)
const char* pedestrianId = "PED-AR-3001";
const char* pedestrianName = "임베디드 어르신";
const int pedestrianAge = 74;

// 낙상 판단용 역치 변수 설정
const float FALL_THRESHOLD = 2.5; // (G단위 임계치 - 약 2.5G 이상의 순간 가속도 충격)
const float LOW_TRIGGER_A = 0.4;  // 낙상 전 무중력 낙하 감지 역치 (약 0.4G 이하)

void setup() {
  Serial.begin(115200);
  delay(10);

  // WiFi 연결 시도
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // MPU6050 자이로 센서 초기화
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip!");
    while (1) {
      delay(10);
    }
  }
  Serial.println("MPU6050 Found and Ready!");

  // 센서 동작 파라미터 셋업
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  delay(100);
}

void loop() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // 1. 가속도 합성값 계산 (X, Y, Z 벡터 크기 계산)
  // m/s^2 단위를 G(중력가속도 = 9.8m/s^2) 단위로 변환해 충격 판단
  float ax_g = a.acceleration.x / 9.80665;
  float ay_g = a.acceleration.y / 9.80665;
  float az_g = a.acceleration.z / 9.80665;

  float total_acc = sqrt(ax_g * ax_g + ay_g * ay_g + az_g * az_g);

  // 충격 변화가 있을 시 로그 촬영
  if (total_acc > 1.4 || total_acc < 0.6) {
    Serial.print("Sensor Vector Pulse Detected - Acc: ");
    Serial.print(total_acc);
    Serial.println(" G");
  }

  // 2. 낙상 감지 핵심 알고리즘 (충격 가속도 역치 초과 여부 확인)
  if (total_acc >= FALL_THRESHOLD) {
    Serial.println("⚠️ EMERGENCY: FALL DETECTED! Sending alert to Sever.");
    sendFallAlertToServer(total_acc, 105);
    delay(5000); // 연속 전송 방지를 위해 5초 세이프티 대기
  }

  delay(100); // 10Hz 주기로 모니터링 수행
}

// 3. 서버 전송 HTTP POST JSON 핸들러
void sendFallAlertToServer(float forceG, int dummyHr) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // JSON 다큐먼트 직렬화 처리
    StaticJsonDocument<256> doc;
    doc["pedestrianId"] = pedestrianId;
    doc["name"] = pedestrianName;
    doc["age"] = pedestrianAge;
    
    // 만약 충격가속도가 너무 세면 fall, 적당하면 impact_warning
    if (forceG > 3.2) {
      doc["status"] = "fall";
    } else {
      doc["status"] = "impact_warning";
    }
    
    // 임시 위치 대구 화원 인근 (동적 전송 가능하도록 아두이노 GPS 연동 시 활용 가능)
    doc["latitude"] = 35.811800; 
    doc["longitude"] = 128.503400;
    doc["heartRate"] = dummyHr + random(-5, 15); // 불규칙한 심박수
    doc["battery"] = 94; // 고정된 테스팅 모드용 배터리 값

    String requestBody;
    serializeJson(doc, requestBody);

    Serial.print("HTTP POST Body: ");
    Serial.println(requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("HTTP Response Code: ");
      Serial.println(httpResponseCode);
      Serial.print("Server Reply: ");
      Serial.println(response);
    } else {
      Serial.print("Error sending POST: ");
      Serial.println(httpResponseCode);
    }
    
    http.end(); // 세션 종료
  } else {
    Serial.println("Error: Wifi Disconnected");
  }
}
`;
