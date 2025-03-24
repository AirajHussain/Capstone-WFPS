#include <SPI.h>
#include <LoRa.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

#define NODE_ID 2
#define NSS 10
#define RST 9
#define DIO0 2
#define LORA_FREQUENCY 433E6

#define SOIL_MOISTURE_PIN A0
#define BME_ADDRESS 0x76
Adafruit_BME280 bme;

String lastNode1Data = "";  // Store Node 1 data

void setup() {
  Serial.begin(9600);

  // Initialize BME280
  if (!bme.begin(BME_ADDRESS)) {
    Serial.println("BME280 failed.");
    while (1);
  }

  // Initialize LoRa
  LoRa.setPins(NSS, RST, DIO0);
  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("LoRa failed.");
    while (1);
  }

  Serial.println("Node 2 Ready");
}

void loop() {
  // === Wait for Node 1 Data and Handshake ===
  bool gotNode1 = false;
  while (!gotNode1) {
    int packetSize = LoRa.parsePacket();
    if (packetSize) {
      String incoming = "";
      while (LoRa.available()) incoming += (char)LoRa.read();

      if (incoming.indexOf("\"node_id\":1") != -1) {
        lastNode1Data = incoming;
        Serial.println("Stored Node 1 Data:");
        Serial.println(lastNode1Data);
      } else if (incoming.indexOf("node_1_done") != -1) {
        gotNode1 = true;
        Serial.println("Received handshake: node_1_done");
      }
    }
  }

  delay(1000); // Small pause

  // === Send handshake to Node 3 BEFORE forwarding Node 1's data ===
DynamicJsonDocument hs1(64);
hs1["handshake"] = "node_1_forwarded";

String hs1Str;
serializeJson(hs1, hs1Str);

LoRa.beginPacket();
LoRa.print(hs1Str);
LoRa.endPacket();
Serial.println("Sent handshake: node_1_forwarded");

delay(1000); // Small delay to give Node 3 time to react

// === THEN send Node 1's data to Node 3 ===
LoRa.beginPacket();
LoRa.print(lastNode1Data);
LoRa.endPacket();
Serial.println("Forwarded Node 1 data to Node 3");


  delay(6000); // Wait before sending own data

  // === Read and Send Own Sensor Data ===
  float temperature = bme.readTemperature();
  float humidity = bme.readHumidity();
  float pressure = bme.readPressure() / 100.0F;
  int rawSoil = analogRead(SOIL_MOISTURE_PIN);
  int soilPercent = map(rawSoil, 0, 22, 0, 100);
  soilPercent = constrain(soilPercent, 0, 100);

  DynamicJsonDocument doc(256);
  doc["node_id"] = NODE_ID;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["pressure"] = pressure;
  doc["soil_moisture_percent"] = soilPercent;

  String jsonData;
  serializeJson(doc, jsonData);

  LoRa.beginPacket();
  LoRa.print(jsonData);
  LoRa.endPacket();

  Serial.println("Sent Node 2 sensor data:");
  Serial.println(jsonData);

  delay(1000); // Pause

  // === Final handshake to Node 3 ===
  DynamicJsonDocument hs2(64);
  hs2["handshake"] = "node_2_done";

  String hs2Str;
  serializeJson(hs2, hs2Str);

  LoRa.beginPacket();
  LoRa.print(hs2Str);
  LoRa.endPacket();
  Serial.println("Sent handshake: node_2_done");

  // End of sequence
  delay(10000); // Idle before next cycle
}