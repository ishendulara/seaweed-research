#include <WiFi.h>
#include <HTTPClient.h>

// =========================
// USER CONFIG
// =========================
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Backend endpoint (use your PC IP on the same network, NOT localhost)
// Example: "http://192.168.1.50:4000/api/sensor-data"
const char* BACKEND_URL = "http://YOUR_PC_IP:4000/api/sensor-data";

// Tank ID must match backend allowed enum: TankA, TankB, TankC
const char* TANK_ID = "TankA";

// Send interval
const unsigned long POST_INTERVAL_MS = 5000;

// =========================
// SENSOR PINS (PLACEHOLDER)
// =========================
// Replace these with your real wiring and conversion formulas.
// Many pH/TDS probes use analog interface modules.
const int PIN_TEMP_ANALOG = 34;   // optional placeholder
const int PIN_PH_ANALOG = 35;     // pH module analog out
const int PIN_TDS_ANALOG = 32;    // TDS module analog out
const int PIN_LIGHT_ANALOG = 33;  // LDR/photodiode analog out

unsigned long lastPostMs = 0;

static float readAnalogVoltage(int pin) {
  int raw = analogRead(pin); // 0..4095 on ESP32 (default)
  return (raw / 4095.0f) * 3.3f;
}

// The functions below are *example conversions*.
// You must calibrate with your exact sensors to get accurate readings.

static float readTemperatureC() {
  // Placeholder: simulate ~26–30°C based on analog voltage.
  float v = readAnalogVoltage(PIN_TEMP_ANALOG);
  return 24.0f + (v / 3.3f) * 8.0f;
}

static float readPh() {
  // Placeholder: map voltage to ~6.5–9.5 pH (NOT calibrated).
  float v = readAnalogVoltage(PIN_PH_ANALOG);
  return 6.5f + (v / 3.3f) * 3.0f;
}

static float readTdsPpm() {
  // Placeholder: map voltage to 0–1200 ppm (NOT calibrated).
  float v = readAnalogVoltage(PIN_TDS_ANALOG);
  return (v / 3.3f) * 1200.0f;
}

static float readLightLux() {
  // Placeholder: map voltage to 0–9000 lux (NOT calibrated).
  float v = readAnalogVoltage(PIN_LIGHT_ANALOG);
  return (v / 3.3f) * 9000.0f;
}

static String buildJson(const char* tankId, float temperature, float ph, float tds, float light) {
  // Build JSON without ArduinoJson dependency
  String payload = "{";
  payload += "\"tankId\":\""; payload += tankId; payload += "\",";
  payload += "\"temperature\":"; payload += String(temperature, 2); payload += ",";
  payload += "\"ph\":"; payload += String(ph, 2); payload += ",";
  payload += "\"tds\":"; payload += String(tds, 0); payload += ",";
  payload += "\"light\":"; payload += String(light, 0);
  payload += "}";
  return payload;
}

static void ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return;

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(250);
  }
}

static bool postSensorData(const String& json) {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");

  int code = http.POST((uint8_t*)json.c_str(), json.length());
  http.end();

  return (code >= 200 && code < 300);
}

void setup() {
  Serial.begin(115200);
  delay(200);

  // ESP32 ADC setup (optional)
  analogReadResolution(12); // 0..4095

  ensureWifi();
  Serial.print("WiFi: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "connected" : "not connected");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  }
}

void loop() {
  ensureWifi();

  unsigned long now = millis();
  if (now - lastPostMs < POST_INTERVAL_MS) {
    delay(50);
    return;
  }
  lastPostMs = now;

  float temperature = readTemperatureC();
  float ph = readPh();
  float tds = readTdsPpm();
  float light = readLightLux();

  String json = buildJson(TANK_ID, temperature, ph, tds, light);
  bool ok = postSensorData(json);

  Serial.print("POST ");
  Serial.print(ok ? "OK" : "FAIL");
  Serial.print(" -> ");
  Serial.println(json);
}

