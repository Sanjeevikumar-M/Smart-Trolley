#include "esp_camera.h"
#include <WiFi.h>

// WiFi credentials
const char* ssid = "zoro";
const char* password = "1234567890";

// Server details
const char* server = "172.16.47.167";
const int port = 8000;
const char* trolley_id = "TROLLEY_01";

void setup() {
  Serial.begin(115200);

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = 5;
  config.pin_d1 = 18;
  config.pin_d2 = 19;
  config.pin_d3 = 21;
  config.pin_d4 = 36;
  config.pin_d5 = 39;
  config.pin_d6 = 34;
  config.pin_d7 = 35;
  config.pin_xclk = 0;
  config.pin_pclk = 22;
  config.pin_vsync = 25;
  config.pin_href = 23;
  config.pin_sscb_sda = 26;
  config.pin_sscb_scl = 27;
  config.pin_pwdn = 32;
  config.pin_reset = -1;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_QVGA;
  config.jpeg_quality = 12;
  config.fb_count = 1;

  // Camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed");
      delay(3000);
      return;
    }

    WiFiClient client;
    if (client.connect(server, port)) {
      String boundary = "----SmartTrolleyBoundary";
      String head = "--" + boundary + "\r\n"
                    "Content-Disposition: form-data; name=\"trolley_id\"\r\n\r\n" +
                    String(trolley_id) + "\r\n" +
                    "--" + boundary + "\r\n"
                    "Content-Disposition: form-data; name=\"barcode_image\"; filename=\"capture.jpg\"\r\n"
                    "Content-Type: image/jpeg\r\n\r\n";
      String tail = "\r\n--" + boundary + "--\r\n";
      int contentLength = head.length() + fb->len + tail.length();

      client.print(String("POST /cart/scan HTTP/1.1\r\n") +
                   "Host: " + server + "\r\n" +
                   "Content-Type: multipart/form-data; boundary=" + boundary + "\r\n" +
                   "Content-Length: " + String(contentLength) + "\r\n\r\n");
      client.print(head);
      client.write(fb->buf, fb->len);
      client.print(tail);

      // Read response (optional)
      unsigned long timeout = millis();
      while (client.connected() && millis() - timeout < 5000) {
        while (client.available()) {
          String line = client.readStringUntil('\n');
          Serial.println(line);
          timeout = millis();
        }
      }
      client.stop();
    } else {
      Serial.println("Connection to server failed");
    }

    esp_camera_fb_return(fb);
  } else {
    Serial.println("WiFi not connected");
  }
  delay(3000); // Wait 3 seconds
}
