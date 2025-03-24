#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <HardwareSerial.h>

HardwareSerial mySerial(1);

#define RX_PIN 19
#define TX_PIN 18

// WiFi Credentials
const char* ssid = "CCCP";
const char* password = "capstone10086";

// API Endpoint
const char* serverUrl = "http://15.223.86.129:5000/add-sensor-reading";

void setup() {
  Serial.begin(115200);
  mySerial.begin(9600, SERIAL_8N1, RX_PIN, TX_PIN);

  // Connect to WiFi
  Serial.println("ESP32 Ready. Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi Connected!");
  Serial.println("ESP Ready. Waiting for JSON data...");
}

void loop() {
  // Check if there's incoming data on the serial line
  if (mySerial.available()) {
    String line = mySerial.readStringUntil('\n');
    line.trim();
    Serial.print("Received line: ");
    Serial.println(line);
    
    // Look for the start of a JSON block
    if (line == "BEGIN_JSON") {
      String jsonContent = "";
      // Continue capturing until the end marker is received
      while (true) {
        while (!mySerial.available()) { /* wait */ }
        String dataLine = mySerial.readStringUntil('\n');
        dataLine.trim();
        if (dataLine == "END_JSON") {
          break;  // End of JSON block
        }
        // Append the received line (preserve line breaks if needed)
        if (jsonContent.length() > 0) {
          jsonContent += "\n";
        }
        jsonContent += dataLine;
      }
      
      Serial.print("Captured JSON: ");
      Serial.println(jsonContent);

      // Parse the captured JSON content:
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, jsonContent);
      if (error) {
        Serial.print("JSON parse failed: ");
        Serial.println(error.c_str());
      } else {
        // Successfully parsed JSON—print all key-value pairs:
        Serial.println("Parsed JSON Content:");
        for (JsonPair kv : doc.as<JsonObject>()) {
          Serial.print("  ");
          Serial.print(kv.key().c_str());
          Serial.print(" : ");
          if (kv.value().is<int>()) {
            Serial.println(kv.value().as<int>());
          } else if (kv.value().is<double>()) {
            Serial.println(kv.value().as<double>());
          } else if (kv.value().is<bool>()) {
            Serial.println(kv.value().as<bool>() ? "true" : "false");
          } else if (kv.value().is<const char*>()) {
            Serial.println(kv.value().as<const char*>());
          } else {
            Serial.println("Unknown type");
          }
        }
        Serial.println("--------------------------");

        // New Feature: Upload JSON to the server
        if (WiFi.status() == WL_CONNECTED) {
          HTTPClient http;
          http.begin(serverUrl);
          http.addHeader("Content-Type", "application/json");
          int httpResponseCode = http.POST(jsonContent);

          if (httpResponseCode > 0) {
            Serial.print("HTTP Response code: ");
            Serial.println(httpResponseCode);
            String response = http.getString();
            Serial.print("Response: ");
            Serial.println(response);
          } else {
            Serial.print("Error code: ");
            Serial.println(httpResponseCode);
          }
          http.end();
        } else {
          Serial.println("WiFi Disconnected");
        }
      }
    }
  }
}
