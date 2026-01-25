// ESP32-CAM barcode -> Django Smart-Trolley (decode on server, then cart/scan)
// Board: select your camera model below and ensure matching camera_pins.h
// Requires: ArduinoJson library

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "camera_pins.h" // uses Yx/VSYNC/HREF/XCLK/etc. from Espressif examples

// ===================
// Select camera model
// ===================
//#define CAMERA_MODEL_ESP_EYE // Has PSRAM
//#define CAMERA_MODEL_AI_THINKER // Has PSRAM
// ... or keep whatever your board needs in camera_pins.h

// ===========================
// WiFi + Backend configuration
// ===========================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Include protocol + host + port and /api prefix, e.g. http://192.168.1.50:8000/api
const char* BACKEND_BASE  = "http://<SERVER_IP>:8000/api";
const char* TROLLEY_ID    = "TROLLEY-001";
const uint32_t CAPTURE_INTERVAL_MS = 3000;

// Optional: LED flash pin from camera_pins.h if defined
#if defined(LED_GPIO_NUM)
static void setupLedFlash(int pin) {
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
}
static void flashOn() { digitalWrite(LED_GPIO_NUM, HIGH); }
static void flashOff() { digitalWrite(LED_GPIO_NUM, LOW); }
#else
static void setupLedFlash(int) {}
static void flashOn() {}
static void flashOff() {}
#endif

static bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0  = Y2_GPIO_NUM;
  config.pin_d1  = Y3_GPIO_NUM;
  config.pin_d2  = Y4_GPIO_NUM;
  config.pin_d3  = Y5_GPIO_NUM;
  config.pin_d4  = Y6_GPIO_NUM;
  config.pin_d5  = Y7_GPIO_NUM;
  config.pin_d6  = Y8_GPIO_NUM;
  config.pin_d7  = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;

  config.pixel_format = PIXFORMAT_JPEG; // for server decode
  config.frame_size   = FRAMESIZE_QVGA; // 320x240 (lighter upload, good enough)
  config.grab_mode    = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location  = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 12;
  config.fb_count     = 1;

  if (config.pixel_format == PIXFORMAT_JPEG) {
    if (psramFound()) {
      config.jpeg_quality = 10;
      config.fb_count = 2;
      config.grab_mode = CAMERA_GRAB_LATEST;
    } else {
      config.frame_size = FRAMESIZE_SVGA;
      config.fb_location = CAMERA_FB_IN_DRAM;
    }
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed 0x%x\n", err);
    return false;
  }

  sensor_t* s = esp_camera_sensor_get();
  if (s->id.PID == OV3660_PID) {
    s->set_vflip(s, 1);
    s->set_brightness(s, 1);
    s->set_saturation(s, -2);
  }
  if (config.pixel_format == PIXFORMAT_JPEG) {
    s->set_framesize(s, FRAMESIZE_QVGA);
  }
  return true;
}

static bool connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("WiFi OK. IP: %s\n", WiFi.localIP().toString().c_str());
    return true;
  }
  Serial.println("WiFi failed");
  return false;
}

static bool decodeBarcodeOnServer(const uint8_t* imgBuf, size_t imgLen, String& outBarcode) {
  HTTPClient http;
  String url = String(BACKEND_BASE) + "/barcode/scan";
  http.begin(url);
  http.addHeader("Content-Type", "image/jpeg");

  int code = http.POST(imgBuf, imgLen);
  if (code <= 0) {
    Serial.printf("POST /barcode/scan error: %d\n", code);
    http.end();
    return false;
  }

  String payload = http.getString();
  http.end();

  Serial.printf("Decode response (%d): %s\n", code, payload.c_str());
  if (code != 200) return false;

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    Serial.printf("JSON parse error: %s\n", err.c_str());
    return false;
  }

  bool found = doc["found"] | false;
  if (!found) return false;

  const char* barcode = doc["barcode"];
  if (!barcode) return false;

  outBarcode = String(barcode);
  return true;
}

static bool sendToCartScan(const String& barcode) {
  HTTPClient http;
  String url = String(BACKEND_BASE) + "/cart/scan";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<128> doc;
  doc["trolley_id"] = TROLLEY_ID; // ESP32 path supported by backend
  doc["barcode"]    = barcode;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  String payload = http.getString();
  http.end();

  Serial.printf("POST /cart/scan (%d): %s\n", code, payload.c_str());
  return code == 200 || code == 201;
}

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();

  if (!initCamera()) {
    Serial.println("Camera init failed");
    delay(2000);
    ESP.restart();
  }
  setupLedFlash(
#if defined(LED_GPIO_NUM)
    LED_GPIO_NUM
#else
    -1
#endif
  );

  if (!connectWiFi()) {
    Serial.println("WiFi connect failed; restarting");
    delay(3000);
    ESP.restart();
  }
  Serial.println("Ready to capture & send");
}

void loop() {
  flashOn();
  delay(50);
  camera_fb_t* fb = esp_camera_fb_get();
  flashOff();
  if (!fb) {
    Serial.println("Capture failed");
    delay(CAPTURE_INTERVAL_MS);
    return;
  }

  String decoded;
  bool ok = decodeBarcodeOnServer(fb->buf, fb->len, decoded);
  esp_camera_fb_return(fb);

  if (ok) {
    Serial.printf("Decoded barcode: %s\n", decoded.c_str());
    bool sent = sendToCartScan(decoded);
    Serial.printf("Cart scan sent: %s\n", sent ? "OK" : "FAIL");
  } else {
    Serial.println("No barcode decoded");
  }

  delay(CAPTURE_INTERVAL_MS);
}