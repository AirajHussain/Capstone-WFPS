#include <SPI.h>
#include <LoRa.h>
#include <SoftwareSerial.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

// LoRa Pin Configuration (if used)
#define NSS 10
#define RST 9
#define DIO0 2
#define LED_PIN 13
#define LORA_FREQUENCY 433E6

#define TX_PIN 4  // TX to ESP32 RX (GPIO19)
#define RX_PIN 5  // RX (not used in this case)
SoftwareSerial espSerial(RX_PIN, TX_PIN);

#define NODE_ID 3

// Sensor Pins & Addresses
#define SOIL_MOISTURE_PIN A0
#define BME_ADDRESS 0x76
Adafruit_BME280 bme;

void setup() {
  // Hardware Serial for debugging to your PC:
  Serial.begin(9600);
  delay(1000);
  Serial.println("Starting Arduino Pro Mini...");

  // Begin serial communication with ESP:
  espSerial.begin(9600);
  Serial.println("SoftwareSerial for ESP started at 9600 baud.");

  // Initialize sensor(s)
  if (!bme.begin(BME_ADDRESS)) {
    Serial.println("Could not find a valid BME280 sensor, check wiring!");
    while (1);
  } else {
    Serial.println("BME280 sensor initialized.");
  }

  // Initialize LoRa (if used)
  LoRa.setPins(NSS, RST, DIO0);
  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("LoRa init failed. Check your wiring/config.");
    while (1);
  } else {
    Serial.println("LoRa initialized.");
  }

  // Optional: LED blink to indicate startup complete
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
}
void loop() {
  // ====== Step 1: Wait for and forward Node 1 and Node 2 data ======
  bool gotNode1 = false;
  bool gotNode2 = false;

  while (!(gotNode1 && gotNode2)) {
    int packetSize = LoRa.parsePacket();
    if (packetSize) {
      String incoming = "";
      while (LoRa.available()) incoming += (char)LoRa.read();

      Serial.println("Received via LoRa:");
      Serial.println(incoming);

      if (incoming.indexOf("\"node_id\":1") != -1 && !gotNode1) {
        // Forward Node 1 data to ESP
        espSerial.println("BEGIN_JSON");
        espSerial.println(incoming);
        espSerial.println("END_JSON");
        Serial.println("Forwarded Node 1 data to ESP");
        gotNode1 = true;
      } else if (incoming.indexOf("\"node_id\":2") != -1 && !gotNode2) {
        // Forward Node 2 data to ESP
        espSerial.println("BEGIN_JSON");
        espSerial.println(incoming);
        espSerial.println("END_JSON");
        Serial.println("Forwarded Node 2 data to ESP");
        gotNode2 = true;
      }
    }
  }

  delay(1000); // Small pause before sending Node 3's own data

  // ====== Step 2: Read and send Node 3's own data ======
  float temperature = bme.readTemperature();
  float humidity    = bme.readHumidity();
  float pressure    = bme.readPressure() / 100.0F;
  int soilValue     = analogRead(SOIL_MOISTURE_PIN);
  int soilMoisturePercent = map(soilValue, 1023, 300, 0, 100);
  soilMoisturePercent = constrain(soilMoisturePercent, 0, 100);

  {
    DynamicJsonDocument doc(256);
    doc["node_id"] = NODE_ID;  // 3
    doc["temperature"] = temperature;
    doc["humidity"]    = humidity;
    doc["pressure"]    = pressure;
    doc["soil_moisture_percent"] = soilMoisturePercent;

    String jsonString;
    serializeJson(doc, jsonString);

    Serial.println("Node 3 JSON:");
    Serial.println(jsonString);
    Serial.println("----------------------------------------");

    // Send to ESP
    espSerial.println("BEGIN_JSON");
    espSerial.println(jsonString);
    espSerial.println("END_JSON");

    // Optional: Also send via LoRa (debug or mesh forward)
    LoRa.beginPacket();
    LoRa.print(jsonString);
    LoRa.endPacket();
  }

  delay(1000); // Optional delay before handshake

  // ====== Step 3: Send final handshake to Node 1 ======
  {
    DynamicJsonDocument hs(64);
    hs["handshake"] = "cycle_complete";

    String hsStr;
    serializeJson(hs, hsStr);

    LoRa.beginPacket();
    LoRa.print(hsStr);
    LoRa.endPacket();
    delay(60000); // Wait 1 minute before next cycle
    Serial.println("Sent handshake: cycle_complete");
  }
  
}
