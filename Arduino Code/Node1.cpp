#include <SPI.h>
#include <LoRa.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

#define NODE_ID 1
#define NSS 10
#define RST 9
#define DIO0 2
#define LORA_FREQUENCY 433E6

#define SOIL_MOISTURE_PIN A0
#define BME_ADDRESS 0x76
Adafruit_BME280 bme;

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

  Serial.println("Node 1 Ready");
}

void loop() {
  // === Read Sensors ===
  float temperature = bme.readTemperature();
  float humidity = bme.readHumidity();
  float pressure = bme.readPressure() / 100.0F;
  int rawSoil = analogRead(SOIL_MOISTURE_PIN);
  int soilPercent = map(rawSoil, 0, 22, 0, 100);
  soilPercent = constrain(soilPercent, 0, 100);

  // === Send Sensor Data ===
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

  Serial.println("Sent Node 1 sensor data:");
  Serial.println(jsonData);

  delay(500); // Let it breathe

  // === Send Handshake to Node 2 ===
  DynamicJsonDocument hs(64);
  hs["handshake"] = "node_1_done";

  String hsString;
  serializeJson(hs, hsString);

  LoRa.beginPacket();
  LoRa.print(hsString);
  LoRa.endPacket();

  Serial.println("Sent handshake: node_1_done");

  // === Wait for end-of-cycle handshake from Node 3 ===
  while (true) {
    int packetSize = LoRa.parsePacket();
    if (packetSize) {
      String incoming = "";
      while (LoRa.available()) incoming += (char)LoRa.read();

      if (incoming.indexOf("cycle_complete") != -1) {
        Serial.println("Received: cycle_complete");
        break;  // Restart loop
      }
    }
  }

  delay(1000); // Delay before next cycle
}
