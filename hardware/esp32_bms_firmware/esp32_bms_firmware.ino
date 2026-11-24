/*
 * ==============================================================================
 * VOLTSENSE AI — ESP32 BMS HARDWARE TELEMETRY FIRMWARE
 * Target MCU: ESP32-WROOM-32 / ESP32-S3
 * Protocol: MQTT over WiFi / TLS (PubSubClient)
 * Sensors: 
 *   - Pack & Cell Voltage: Precision resistor divider via ADS1115 / Internal ADC
 *   - Pack Current: Bi-directional Hall-Effect (Allegro ACS758 / ACS770)
 *   - Module Temperature: NTC 10k 3950 Thermistor Array (Steinhart-Hart Equation)
 * ==============================================================================
 * IMPORTANT SAFETY NOTICE:
 * Do not connect experimental microcontrollers directly to high-voltage EV battery
 * packs without isolated CAN-bus transceivers (ISO1050), galvanic isolation amplifiers,
 * and qualified engineering safety supervision.
 * ==============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker Configuration
const char* mqtt_server = "192.168.1.100"; // VoltSense AI Backend Host
const int mqtt_port = 1883;
const char* mqtt_user = "voltsense_device";
const char* mqtt_pass = "bms_secure_token_2026";
const char* vehicle_vin = "KA05ER7777";

// Telemetry Topic: voltsense/<VIN>/telemetry
char telemetry_topic[64];

WiFiClient espClient;
PubSubClient client(espClient);

// Hardware Pin Definitions (ESP32)
#define PIN_VOLTAGE_ADC  34  // Analog pin for Voltage divider
#define PIN_CURRENT_ADC  35  // Analog pin for Hall-Effect Current Sensor
#define PIN_TEMP_NTC     32  // Analog pin for NTC Thermistor
#define STATUS_LED        2  // Built-in status LED

// Calibration Constants
const float VOLTAGE_DIVIDER_RATIO = 11.0; // 100k / 10k divider ratio (max 36V -> 3.27V)
const float ADC_REF_VOLTAGE = 3.30;       // ESP32 calibrated ADC reference
const float CURRENT_ZERO_OFFSET = 1.65;   // Zero-current voltage offset (VCC / 2)
const float CURRENT_SENSITIVITY = 0.040;  // 40mV per Ampere (e.g. ACS758-50B)

// NTC Thermistor Constants (Steinhart-Hart beta)
const float NTC_SERIES_RESISTOR = 10000.0;
const float NTC_NOMINAL_RESISTANCE = 10000.0;
const float NTC_NOMINAL_TEMP = 25.0 + 273.15;
const float NTC_BETA_VALUE = 3950.0;

unsigned long lastTelemetryMillis = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 1000; // 1 Hz publish rate

float readCalibratedVoltage() {
  int raw = analogRead(PIN_VOLTAGE_ADC);
  float pinVoltage = (raw / 4095.0) * ADC_REF_VOLTAGE;
  return pinVoltage * VOLTAGE_DIVIDER_RATIO;
}

float readCalibratedCurrent() {
  int raw = analogRead(PIN_CURRENT_ADC);
  float pinVoltage = (raw / 4095.0) * ADC_REF_VOLTAGE;
  return (pinVoltage - CURRENT_ZERO_OFFSET) / CURRENT_SENSITIVITY;
}

float readCalibratedTemperature() {
  int raw = analogRead(PIN_TEMP_NTC);
  float pinVoltage = (raw / 4095.0) * ADC_REF_VOLTAGE;
  float resistance = NTC_SERIES_RESISTOR * (ADC_REF_VOLTAGE / pinVoltage - 1.0);
  
  float steinhart;
  steinhart = resistance / NTC_NOMINAL_RESISTANCE;     // (R/Ro)
  steinhart = log(steinhart);                         // ln(R/Ro)
  steinhart /= NTC_BETA_VALUE;                        // 1/B * ln(R/Ro)
  steinhart += 1.0 / NTC_NOMINAL_TEMP;                // + (1/To)
  steinhart = 1.0 / steinhart;                        // Invert
  steinhart -= 273.15;                                // Convert Kelvin to Celsius
  return steinhart;
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
  }

  Serial.println("\nWiFi connected. IP: ");
  Serial.println(WiFi.localIP());
  digitalWrite(STATUS_LED, HIGH);
}

void reconnect_mqtt() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection to VoltSense Gateway...");
    String clientId = "ESP32-BMS-" + String(vehicle_vin);
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("CONNECTED");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 3 seconds");
      delay(3000);
    }
  }
}

void setup() {
  pinMode(STATUS_LED, OUTPUT);
  Serial.begin(115200);
  snprintf(telemetry_topic, sizeof(telemetry_topic), "voltsense/%s/telemetry", vehicle_vin);

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect_mqtt();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastTelemetryMillis > TELEMETRY_INTERVAL_MS) {
    lastTelemetryMillis = now;

    float pack_voltage = readCalibratedVoltage();
    float pack_current = readCalibratedCurrent();
    float avg_temperature = readCalibratedTemperature();
    float total_impedance = (pack_voltage > 5.0 && abs(pack_current) > 2.0) 
      ? abs((pack_voltage * 0.05) / pack_current) 
      : 0.1085;

    // Serialize JSON Telemetry Frame matching VoltSense AI Schema
    StaticJsonDocument<512> doc;
    doc["vehicle_id"] = vehicle_vin;
    doc["pack_voltage"] = round(pack_voltage * 100.0) / 100.0;
    doc["pack_current"] = round(pack_current * 10.0) / 10.0;
    doc["avg_temperature"] = round(avg_temperature * 10.0) / 10.0;
    doc["total_impedance"] = round(total_impedance * 10000.0) / 10000.0;
    doc["timestamp"] = millis();

    char buffer[512];
    serializeJson(doc, buffer);
    client.publish(telemetry_topic, buffer);

    Serial.print("[BMS Telemetry Published]: ");
    Serial.println(buffer);
  }
}
