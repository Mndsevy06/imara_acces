#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>

// ---------------------------------------------------------
// PARAMÈTRES RÉSEAU (WIFI & BACKEND)
// ---------------------------------------------------------
const char* ssid = "STARLINK2";
const char* password = "DOOT1KAYs";
// L'URL du backend (Fixée définitivement grâce à votre configuration réseau)
const String backendBaseUrl = "http://192.168.1.151:8012";

String readerId = ""; // Sera initialisé avec l'adresse MAC

// ---------------------------------------------------------
// DÉFINITION DES PINS
// ---------------------------------------------------------
#define SS_PIN        5   
#define RST_PIN       22  
#define GREEN_LED_PIN 14
#define RED_LED_PIN   12
#define SERVO_PIN     13 // Mis à jour selon votre modification

MFRC522 rfid(SS_PIN, RST_PIN);
Servo barrierServo;

const int ANGLE_CLOSED = 0;   
const int ANGLE_OPEN = 90;    
const int OPEN_DURATION = 3000; 

enum class AccessResult {
  AUTHORIZED,
  UNKNOWN_CARD,
  SERVER_ERROR,
  NETWORK_ERROR,
};

String buildFallbackReaderId() {
  // Uses the ESP32 eFuse MAC as a stable fallback when WiFi MAC is unavailable.
  uint64_t chipId = ESP.getEfuseMac();
  char idBuffer[13];
  snprintf(
    idBuffer,
    sizeof(idBuffer),
    "%02X%02X%02X%02X%02X%02X",
    (uint8_t)(chipId >> 40),
    (uint8_t)(chipId >> 32),
    (uint8_t)(chipId >> 24),
    (uint8_t)(chipId >> 16),
    (uint8_t)(chipId >> 8),
    (uint8_t)chipId
  );
  return String(idBuffer);
}

String resolveReaderId() {
  String id = WiFi.macAddress();
  id.replace(":", "");
  id.toUpperCase();

  if (id.length() == 12 && id != "000000000000") {
    return id;
  }

  String fallback = buildFallbackReaderId();
  Serial.println("ReaderId WiFi invalide, fallback eFuse : " + fallback);
  return fallback;
}

// Timer for polling
unsigned long lastPollTime = 0;
const unsigned long pollInterval = 1500; // Poll every 1.5 seconds

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);

  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  barrierServo.setPeriodHertz(50);
  barrierServo.attach(SERVO_PIN, 500, 2400); 
  barrierServo.write(ANGLE_CLOSED); 

  SPI.begin(); 
  rfid.PCD_Init();

  WiFi.mode(WIFI_STA);

  // Connexion au WiFi
  connectWiFi();

  // Initialisation de l'ID unique lecteur après init WiFi
  readerId = resolveReaderId();
  Serial.println("Reader ID : " + readerId);

  // L'IP du PC est maintenant fixe (192.168.1.151), pas besoin de recherche dynamique mDNS.
  Serial.println("URL du serveur Backend : " + backendBaseUrl);

  Serial.println("SYSTÈME OPÉRATIONNEL : Prêt pour les scans et le polling HTTP...");
}

// Déclaration anticipée pour grantAccess utilisée dans pollBackend
void grantAccess();

void pollBackend() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  // URL dynamique
  String url = backendBaseUrl + "/api/readers/command?readerId=" + readerId;
  HTTPClient http;
  http.begin(url);
  http.setTimeout(2000); // Court timeout pour ne pas bloquer

  int code = http.GET();
  if (code == 200) {
    String response = http.getString();
    // La réponse JSON est {"command":"OPEN"} ou {"command":"NONE"}
    if (response.indexOf("\"command\":\"OPEN\"") >= 0) {
      Serial.println("\n[Polling] Commande d'ouverture reçue du serveur !");
      grantAccess();
    }
  }
  http.end();
}

unsigned long barrierCloseTime = 0;
unsigned long greenLedOffTime = 0;
unsigned long redLedOffTime = 0;

String lastCardUid = "";
unsigned long lastCardTime = 0;
const unsigned long COOLDOWN_SAME_CARD = 3000;

void loop() {
  unsigned long currentMillis = millis();

  // Reconnexion WiFi si nécessaire
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Polling HTTP périodique
  if (currentMillis - lastPollTime >= pollInterval) {
    lastPollTime = currentMillis;
    pollBackend();
  }

  // Gestion asynchrone de la fermeture de barrière
  if (barrierCloseTime > 0 && currentMillis >= barrierCloseTime) {
    barrierServo.write(ANGLE_CLOSED);
    Serial.println("Barrière refermée.");
    barrierCloseTime = 0;
  }
  
  // Gestion asynchrone des LEDs
  if (greenLedOffTime > 0 && currentMillis >= greenLedOffTime) {
    digitalWrite(GREEN_LED_PIN, LOW);
    greenLedOffTime = 0;
  }

  if (redLedOffTime > 0 && currentMillis >= redLedOffTime) {
    digitalWrite(RED_LED_PIN, LOW);
    redLedOffTime = 0;
  }

  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  String cardUid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    cardUid += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    cardUid += String(rfid.uid.uidByte[i], HEX);
  }
  cardUid.toUpperCase();

  // Vérification Anti-spam (même carte ignorée pendant le cooldown)
  if (cardUid == lastCardUid && (currentMillis - lastCardTime) < COOLDOWN_SAME_CARD) {
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  lastCardUid = cardUid;
  lastCardTime = currentMillis;

  Serial.println("\n--- Nouveau Scan ---");
  Serial.println("UID : " + cardUid);

  // Envoi au Backend et attente de la réponse
  AccessResult result = sendScanToBackend(cardUid);

  if (result == AccessResult::AUTHORIZED) {
    grantAccess();
  } else if (result == AccessResult::UNKNOWN_CARD) {
    denyAccess("ACCÈS REFUSÉ (Carte inconnue)");
  } else if (result == AccessResult::SERVER_ERROR) {
    denyAccess("ACCÈS REFUSÉ (Erreur serveur)");
  } else {
    denyAccess("ACCÈS REFUSÉ (Réseau/timeout)");
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  
  Serial.print("Connexion au WiFi : ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnecté ! IP : " + WiFi.localIP().toString());
  } else {
    Serial.println("\nÉchec de connexion WiFi (mode hors-ligne)");
  }
}

AccessResult sendScanToBackend(String cardUid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Erreur : WiFi non connecté. Impossible de vérifier.");
    return AccessResult::NETWORK_ERROR;
  }

  HTTPClient http;
  String verifyUrl = backendBaseUrl + "/api/scans/verify";
  http.begin(verifyUrl);
  http.addHeader("Content-Type", "application/json");
  http.setConnectTimeout(5000);
  http.setTimeout(15000);

  // Construction du JSON avec source BOITIER
  String jsonPayload = "{\"cardId\":\"" + cardUid + "\",\"readerId\":\"" + readerId + "\",\"source\":\"BOITIER\"}";
  
  Serial.println("Envoi au serveur : " + jsonPayload);
  int httpResponseCode = http.POST(jsonPayload);

  AccessResult result = AccessResult::SERVER_ERROR;

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Code HTTP : " + String(httpResponseCode));
    Serial.println("Réponse : " + response);

    // Si 200 ou 201, le conducteur est connu et autorisé
    if (httpResponseCode == 200 || httpResponseCode == 201) {
      result = AccessResult::AUTHORIZED;
    } else if (httpResponseCode == 403) {
      result = AccessResult::UNKNOWN_CARD;
    } else {
      result = AccessResult::SERVER_ERROR;
    }
  } else {
    Serial.print("Erreur HTTP : ");
    Serial.println(httpResponseCode);
    Serial.println("Détail : " + http.errorToString(httpResponseCode));
    result = AccessResult::NETWORK_ERROR;
  }
  
  http.end();
  return result;
}

void grantAccess() {
  Serial.println("ACCÈS AUTORISÉ (Conducteur reconnu)");
  digitalWrite(GREEN_LED_PIN, HIGH);
  barrierServo.write(ANGLE_OPEN);
  
  unsigned long now = millis();
  barrierCloseTime = now + OPEN_DURATION;
  greenLedOffTime = now + 1000;
}

void denyAccess(const String &reason) {
  Serial.println(reason);
  digitalWrite(RED_LED_PIN, HIGH);
  
  unsigned long now = millis();
  redLedOffTime = now + 1000;
}
