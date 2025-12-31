// =====================================================
// SMART SHOPPING TROLLEY - AUTONOMOUS FOLLOWING SYSTEM
// With Safe Turning Logic & Collision Prevention
// =====================================================
// 
// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        PIN CONNECTION GUIDE                                ║
// ╠═══════════════════════════════════════════════════════════════════════════╣
// ║                                                                           ║
// ║  ESP32 DevKit V1 / WROOM-32 Pin Configuration                             ║
// ║                                                                           ║
// ║  ┌─────────────────────────────────────────────────────────────────────┐  ║
// ║  │ ULTRASONIC SENSORS (HC-SR04) - 4 Units                              │  ║
// ║  ├─────────────────────────────────────────────────────────────────────┤  ║
// ║  │ FRONT SENSOR:                                                       │  ║
// ║  │   VCC  → 5V                                                         │  ║
// ║  │   GND  → GND                                                        │  ║
// ║  │   TRIG → GPIO 5                                                     │  ║
// ║  │   ECHO → GPIO 18 (via voltage divider: 1kΩ + 2kΩ to GND)           │  ║
// ║  │                                                                     │  ║
// ║  │ LEFT SENSOR:                                                        │  ║
// ║  │   VCC  → 5V                                                         │  ║
// ║  │   GND  → GND                                                        │  ║
// ║  │   TRIG → GPIO 17                                                    │  ║
// ║  │   ECHO → GPIO 19 (via voltage divider)                             │  ║
// ║  │                                                                     │  ║
// ║  │ RIGHT SENSOR:                                                       │  ║
// ║  │   VCC  → 5V                                                         │  ║
// ║  │   GND  → GND                                                        │  ║
// ║  │   TRIG → GPIO 16                                                    │  ║
// ║  │   ECHO → GPIO 36 (VP - Input only)                                  │  ║
// ║  │                                                                     │  ║
// ║  │ BACK SENSOR:                                                        │  ║
// ║  │   VCC  → 5V                                                         │  ║
// ║  │   GND  → GND                                                        │  ║
// ║  │   TRIG → GPIO 4                                                     │  ║
// ║  │   ECHO → GPIO 39 (VN - Input only)                                  │  ║
// ║  └─────────────────────────────────────────────────────────────────────┘  ║
// ║                                                                           ║
// ║  ┌─────────────────────────────────────────────────────────────────────┐  ║
// ║  │ L298N MOTOR DRIVER                                                  │  ║
// ║  ├─────────────────────────────────────────────────────────────────────┤  ║
// ║  │ LEFT MOTOR (Motor A):                                               │  ║
// ║  │   IN1 (Forward)  → GPIO 32                                          │  ║
// ║  │   IN2 (Backward) → GPIO 33                                          │  ║
// ║  │   ENA (PWM Speed)→ GPIO 23                                          │  ║
// ║  │   OUT1, OUT2     → Left Motor Terminals                             │  ║
// ║  │                                                                     │  ║
// ║  │ RIGHT MOTOR (Motor B):                                              │  ║
// ║  │   IN3 (Forward)  → GPIO 12                                          │  ║
// ║  │   IN4 (Backward) → GPIO 13                                          │  ║
// ║  │   ENB (PWM Speed)→ GPIO 15                                          │  ║
// ║  │   OUT3, OUT4     → Right Motor Terminals                            │  ║
// ║  │                                                                     │  ║
// ║  │ POWER:                                                              │  ║
// ║  │   +12V → Battery Positive (7-12V)                                   │  ║
// ║  │   GND  → Battery Negative + ESP32 GND (Common Ground!)              │  ║
// ║  │   +5V  → Can power ESP32 (if jumper enabled)                        │  ║
// ║  └─────────────────────────────────────────────────────────────────────┘  ║
// ║                                                                           ║
// ║  ┌─────────────────────────────────────────────────────────────────────┐  ║
// ║  │ UWB MODULE (DW1000 / DWM1000) - I2C Mode                            │  ║
// ║  ├─────────────────────────────────────────────────────────────────────┤  ║
// ║  │   VCC  → 3.3V (NOT 5V!)                                             │  ║
// ║  │   GND  → GND                                                        │  ║
// ║  │   SDA  → GPIO 21                                                    │  ║
// ║  │   SCL  → GPIO 22                                                    │  ║
// ║  │   IRQ  → GPIO 34 (Optional - Input only pin)                        │  ║
// ║  │   RST  → GPIO 27 (Optional - for reset control)                     │  ║
// ║  └─────────────────────────────────────────────────────────────────────┘  ║
// ║                                                                           ║
// ║  ┌─────────────────────────────────────────────────────────────────────┐  ║
// ║  │ ToF SENSOR (GY-53 / VL53L0X) - UART Mode                            │  ║
// ║  ├─────────────────────────────────────────────────────────────────────┤  ║
// ║  │   VCC  → 3.3V or 5V (check module)                                  │  ║
// ║  │   GND  → GND                                                        │  ║
// ║  │   TX   → GPIO 35 (RX2 - Input only)                                 │  ║
// ║  │   RX   → GPIO 25 (TX2) - if bidirectional needed                    │  ║
// ║  └─────────────────────────────────────────────────────────────────────┘  ║
// ║                                                                           ║
// ║  ┌─────────────────────────────────────────────────────────────────────┐  ║
// ║  │ LED INDICATORS                                                      │  ║
// ║  ├─────────────────────────────────────────────────────────────────────┤  ║
// ║  │   LED_FAST (Green)  → GPIO 26 → 220Ω → LED → GND                    │  ║
// ║  │   LED_MED  (Yellow) → GPIO 0  → 220Ω → LED → GND                    │  ║
// ║  │   LED_SLOW (Orange) → GPIO 2  → 220Ω → LED → GND                    │  ║
// ║  │   LED_STOP (Red)    → GPIO 14 → 220Ω → LED → GND                    │  ║
// ║  │                                                                     │  ║
// ║  │ NOTE: GPIO 0 and 2 affect boot - ensure LEDs don't pull low at boot │  ║
// ║  └─────────────────────────────────────────────────────────────────────┘  ║
// ║                                                                           ║
// ║  ┌─────────────────────────────────────────────────────────────────────┐  ║
// ║  │ IMPORTANT NOTES                                                     │  ║
// ║  ├─────────────────────────────────────────────────────────────────────┤  ║
// ║  │ • ESP32 GPIO is 3.3V tolerant - use voltage dividers for 5V Echo   │  ║
// ║  │ • GPIO 34, 35, 36, 39 are INPUT ONLY (no internal pullup)          │  ║
// ║  │ • GPIO 6-11 are used for flash - DO NOT USE                        │  ║
// ║  │ • Common GND between ESP32, motors, and all sensors is CRITICAL    │  ║
// ║  │ • Use decoupling capacitors (100µF) near motor driver              │  ║
// ║  │ • Keep motor wires away from sensor wires to reduce noise          │  ║
// ║  └─────────────────────────────────────────────────────────────────────┘  ║
// ║                                                                           ║
// ║  ┌─────────────────────────────────────────────────────────────────────┐  ║
// ║  │ VOLTAGE DIVIDER FOR HC-SR04 ECHO (5V → 3.3V)                        │  ║
// ║  ├─────────────────────────────────────────────────────────────────────┤  ║
// ║  │                                                                     │  ║
// ║  │   ECHO (5V) ──┬── 1kΩ ──┬── ESP32 GPIO                              │  ║
// ║  │               │         │                                           │  ║
// ║  │              GND       2kΩ                                          │  ║
// ║  │                         │                                           │  ║
// ║  │                        GND                                          │  ║
// ║  │                                                                     │  ║
// ║  │   Output = 5V × (2kΩ / 3kΩ) = 3.3V ✓                               │  ║
// ║  └─────────────────────────────────────────────────────────────────────┘  ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

// --- Ultrasonic Sensor Pins ---
#define TF 5    // Front Trigger
#define EF 18   // Front Echo

#define TL 17   // Left Trigger
#define EL 19   // Left Echo

#define TR 16   // Right Trigger
#define ER 36   // Right Echo (GPIO 36/VP - Input only, no conflict with I2C)

#define TB 4    // Back Trigger
#define EB 39   // Back Echo (GPIO 39/VN - Input only, no conflict with I2C)

// --- LED Indicators ---
#define LED_FAST 26   // Green - Fast speed
#define LED_MED 0     // Yellow - Medium speed (caution: boot pin)
#define LED_SLOW 2    // Orange - Slow speed (built-in LED on some boards)
#define LED_STOP 14   // Red - Stopped

// --- Motor Control Pins (L298N) ---
#define MOTOR_LEFT_FWD 32    // IN1
#define MOTOR_LEFT_BWD 33    // IN2
#define MOTOR_RIGHT_FWD 12   // IN3
#define MOTOR_RIGHT_BWD 13   // IN4
#define MOTOR_LEFT_EN 23     // ENA (PWM)
#define MOTOR_RIGHT_EN 15    // ENB (PWM) - Changed from GPIO 2 to avoid conflict

// --- UWB Module Pins (DW1000 - I2C) ---
#define UWB_SDA 21    // I2C Data
#define UWB_SCL 22    // I2C Clock
#define UWB_IRQ 34    // Interrupt (optional)
#define UWB_RST 27    // Reset (optional)

// --- ToF Sensor Pin (GY-53 - UART) ---
#define TOF_RX 35     // UART RX (receive from sensor)
#define TOF_TX 25     // UART TX (send to sensor, if needed)

// =====================================================
// SAFETY THRESHOLDS (in cm)
// =====================================================
#define SHELF_THRESHOLD 25        // Too close to shelf - danger zone
#define SAFE_TURN_DISTANCE 45     // Minimum clearance to initiate turn
#define FRONT_STOP_DISTANCE 30    // Emergency stop distance
#define FRONT_SLOW_DISTANCE 50    // Slow down distance
#define FRONT_MED_DISTANCE 80     // Medium speed distance
#define REAR_DANGER_DISTANCE 20   // Rear collision warning
#define USER_TOO_CLOSE 40         // ToF: too close to user
#define USER_TOO_FAR 150          // ToF: user too far
#define USER_LOST_DISTANCE 300    // User no longer detected

// --- UWB Angle Thresholds ---
#define TURN_ANGLE_THRESHOLD 30   // Degrees to trigger turn intent
#define HYSTERESIS_ANGLE 5        // Prevent flickering at threshold

// =====================================================
// MOTOR SPEED SETTINGS (PWM 0-255)
// =====================================================
#define SPEED_FAST 200
#define SPEED_MEDIUM 150
#define SPEED_SLOW 100
#define SPEED_CREEP 70            // For waiting to turn
#define SPEED_TURN 120            // During turns

// =====================================================
// STATE MACHINE
// =====================================================
enum TrolleyState {
  STATE_IDLE,
  STATE_FOLLOWING,
  STATE_WAITING_TO_TURN_LEFT,
  STATE_WAITING_TO_TURN_RIGHT,
  STATE_TURNING_LEFT,
  STATE_TURNING_RIGHT,
  STATE_EMERGENCY_STOP,
  STATE_BLOCKED,
  STATE_USER_LOST,        // Added: User not detected
  STATE_REAR_DANGER       // Added: Something approaching from behind
};

enum DesiredDirection {
  DIR_NONE,
  DIR_FORWARD,
  DIR_LEFT,
  DIR_RIGHT
};

// =====================================================
// GLOBAL VARIABLES
// =====================================================
TrolleyState currentState = STATE_IDLE;
TrolleyState previousState = STATE_IDLE;  // Added: For state transition tracking
DesiredDirection userDirection = DIR_NONE;
DesiredDirection lastValidDirection = DIR_FORWARD;  // Added: Remember last direction
float uwbAngle = 0.0;
float uwbDistance = 0.0;
long tofDistance = 0;
unsigned long turnWaitStartTime = 0;
unsigned long lastStateChangeTime = 0;    // Added: Debounce state changes
unsigned long userLostTime = 0;           // Added: Track when user was lost
const unsigned long MAX_TURN_WAIT = 5000;  // Max 5 sec waiting
const unsigned long STATE_DEBOUNCE = 100;  // Added: 100ms debounce
const unsigned long USER_LOST_TIMEOUT = 3000;  // Added: 3 sec before stopping

// Sensor readings
long distFront, distLeft, distRight, distBack;

// Sensor validity flags (for error detection)
bool sensorFrontValid = true;
bool sensorLeftValid = true;
bool sensorRightValid = true;
bool sensorBackValid = true;
bool uwbValid = false;    // Added: Track if UWB is connected

// =====================================================
// SENSOR FUNCTIONS
// =====================================================
long getDistance(int trig, int echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  
  long duration = pulseIn(echo, HIGH, 30000);  // 30ms timeout
  
  if (duration == 0) {
    return 999;  // No echo = far away or sensor error
  }
  
  long distance = duration * 0.034 / 2;
  
  // Sanity check - HC-SR04 max range is ~400cm
  if (distance > 400) {
    return 400;
  }
  
  return distance;
}

void readAllSensors() {
  // Read with small delays between to avoid interference
  distFront = getDistance(TF, EF);
  delayMicroseconds(50);
  distLeft  = getDistance(TL, EL);
  delayMicroseconds(50);
  distRight = getDistance(TR, ER);
  delayMicroseconds(50);
  distBack  = getDistance(TB, EB);
  
  // Validate sensor readings (detect disconnected sensors)
  sensorFrontValid = (distFront < 998);
  sensorLeftValid = (distLeft < 998);
  sensorRightValid = (distRight < 998);
  sensorBackValid = (distBack < 998);
  
  // If sensor invalid, assume danger (fail-safe)
  if (!sensorFrontValid) distFront = 0;
  if (!sensorLeftValid) distLeft = 0;
  if (!sensorRightValid) distRight = 0;
  if (!sensorBackValid) distBack = 0;
}

// Simulated UWB reading - Replace with actual DW1000 library
void readUWB() {
  // ─────────────────────────────────────────────────────────
  // REAL IMPLEMENTATION EXAMPLE (uncomment and modify):
  // ─────────────────────────────────────────────────────────
  // #include <DW1000.h>
  // DW1000Ranging.loop();
  // if (DW1000Ranging.getDistantDevice()) {
  //   uwbDistance = DW1000Ranging.getDistantDevice()->getRange();
  //   uwbAngle = DW1000Ranging.getDistantDevice()->getAngle();
  //   uwbValid = true;
  // } else {
  //   uwbValid = false;
  // }
  // ─────────────────────────────────────────────────────────
  
  // SIMULATION MODE: Read angle from Serial for testing
  // Send values like "L45" (left 45°) or "R30" (right 30°) or "F" (forward)
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    if (cmd == 'L' || cmd == 'l') {
      int angle = Serial.parseInt();
      uwbAngle = -abs(angle);  // Negative = left
      uwbValid = true;
    } else if (cmd == 'R' || cmd == 'r') {
      int angle = Serial.parseInt();
      uwbAngle = abs(angle);   // Positive = right
      uwbValid = true;
    } else if (cmd == 'F' || cmd == 'f') {
      uwbAngle = 0;
      uwbValid = true;
    } else if (cmd == 'X' || cmd == 'x') {
      uwbValid = false;  // Simulate user lost
    }
  }
  
  // Default simulation values (remove in production)
  if (!uwbValid) {
    uwbAngle = 0;
    uwbDistance = 100;
  }
}

// Simulated ToF reading - Replace with GY-53 library
void readToF() {
  // ─────────────────────────────────────────────────────────
  // REAL IMPLEMENTATION EXAMPLE for GY-53 (UART mode):
  // ─────────────────────────────────────────────────────────
  // HardwareSerial ToFSerial(2);  // Use UART2
  // ToFSerial.begin(9600, SERIAL_8N1, TOF_RX, TOF_TX);
  // 
  // if (ToFSerial.available() >= 4) {
  //   if (ToFSerial.read() == 0x5A) {  // Frame header
  //     byte high = ToFSerial.read();
  //     byte low = ToFSerial.read();
  //     tofDistance = (high << 8) | low;
  //   }
  // }
  // ─────────────────────────────────────────────────────────
  
  // Use front ultrasonic as fallback when ToF not implemented
  tofDistance = distFront;
}

// =====================================================
// MOTOR CONTROL FUNCTIONS
// =====================================================
void setupMotors() {
  pinMode(MOTOR_LEFT_FWD, OUTPUT);
  pinMode(MOTOR_LEFT_BWD, OUTPUT);
  pinMode(MOTOR_RIGHT_FWD, OUTPUT);
  pinMode(MOTOR_RIGHT_BWD, OUTPUT);
  pinMode(MOTOR_LEFT_EN, OUTPUT);
  pinMode(MOTOR_RIGHT_EN, OUTPUT);
  stopMotors();
}

void stopMotors() {
  digitalWrite(MOTOR_LEFT_FWD, LOW);
  digitalWrite(MOTOR_LEFT_BWD, LOW);
  digitalWrite(MOTOR_RIGHT_FWD, LOW);
  digitalWrite(MOTOR_RIGHT_BWD, LOW);
  analogWrite(MOTOR_LEFT_EN, 0);
  analogWrite(MOTOR_RIGHT_EN, 0);
}

void moveForward(int speed) {
  digitalWrite(MOTOR_LEFT_FWD, HIGH);
  digitalWrite(MOTOR_LEFT_BWD, LOW);
  digitalWrite(MOTOR_RIGHT_FWD, HIGH);
  digitalWrite(MOTOR_RIGHT_BWD, LOW);
  analogWrite(MOTOR_LEFT_EN, speed);
  analogWrite(MOTOR_RIGHT_EN, speed);
}

void moveBackward(int speed) {
  digitalWrite(MOTOR_LEFT_FWD, LOW);
  digitalWrite(MOTOR_LEFT_BWD, HIGH);
  digitalWrite(MOTOR_RIGHT_FWD, LOW);
  digitalWrite(MOTOR_RIGHT_BWD, HIGH);
  analogWrite(MOTOR_LEFT_EN, speed);
  analogWrite(MOTOR_RIGHT_EN, speed);
}

// Smooth turn - differential speed (no pivot turns near shelves)
void turnLeft(int baseSpeed) {
  digitalWrite(MOTOR_LEFT_FWD, HIGH);
  digitalWrite(MOTOR_LEFT_BWD, LOW);
  digitalWrite(MOTOR_RIGHT_FWD, HIGH);
  digitalWrite(MOTOR_RIGHT_BWD, LOW);
  analogWrite(MOTOR_LEFT_EN, (int)(baseSpeed * 0.4));   // Inner wheel slower (cast to int)
  analogWrite(MOTOR_RIGHT_EN, baseSpeed);               // Outer wheel faster
}

void turnRight(int baseSpeed) {
  digitalWrite(MOTOR_LEFT_FWD, HIGH);
  digitalWrite(MOTOR_LEFT_BWD, LOW);
  digitalWrite(MOTOR_RIGHT_FWD, HIGH);
  digitalWrite(MOTOR_RIGHT_BWD, LOW);
  analogWrite(MOTOR_LEFT_EN, baseSpeed);                // Outer wheel faster
  analogWrite(MOTOR_RIGHT_EN, (int)(baseSpeed * 0.4));  // Inner wheel slower (cast to int)
}

// Slow creep forward while waiting to turn
void creepForward() {
  moveForward(SPEED_CREEP);
}

// =====================================================
// LED INDICATOR FUNCTIONS
// =====================================================
void updateLEDs(TrolleyState state) {
  digitalWrite(LED_FAST, LOW);
  digitalWrite(LED_MED, LOW);
  digitalWrite(LED_SLOW, LOW);
  digitalWrite(LED_STOP, LOW);
  
  switch(state) {
    case STATE_FOLLOWING:
      if (distFront > FRONT_MED_DISTANCE) {
        digitalWrite(LED_FAST, HIGH);
      } else if (distFront > FRONT_SLOW_DISTANCE) {
        digitalWrite(LED_MED, HIGH);
      } else {
        digitalWrite(LED_SLOW, HIGH);
      }
      break;
    case STATE_WAITING_TO_TURN_LEFT:
    case STATE_WAITING_TO_TURN_RIGHT:
      // Blink slow LED while waiting
      digitalWrite(LED_SLOW, (millis() / 250) % 2);
      break;
    case STATE_TURNING_LEFT:
    case STATE_TURNING_RIGHT:
      digitalWrite(LED_MED, HIGH);
      break;
    case STATE_USER_LOST:
      // Blink all LEDs when user lost
      if ((millis() / 500) % 2) {
        digitalWrite(LED_SLOW, HIGH);
        digitalWrite(LED_MED, HIGH);
      }
      break;
    case STATE_REAR_DANGER:
      // Fast blink stop LED
      digitalWrite(LED_STOP, (millis() / 100) % 2);
      break;
    case STATE_EMERGENCY_STOP:
    case STATE_BLOCKED:
    case STATE_IDLE:
    default:
      digitalWrite(LED_STOP, HIGH);
      break;
  }
}

// =====================================================
// DIRECTION DETECTION (from UWB) - with hysteresis
// =====================================================
DesiredDirection detectUserDirection() {
  readUWB();
  
  // If UWB not valid, maintain last known direction briefly
  if (!uwbValid) {
    return lastValidDirection;
  }
  
  // Apply hysteresis to prevent flickering at thresholds
  DesiredDirection newDirection;
  
  if (uwbAngle < -(TURN_ANGLE_THRESHOLD + HYSTERESIS_ANGLE)) {
    newDirection = DIR_LEFT;
  } else if (uwbAngle > (TURN_ANGLE_THRESHOLD + HYSTERESIS_ANGLE)) {
    newDirection = DIR_RIGHT;
  } else if (abs(uwbAngle) < (TURN_ANGLE_THRESHOLD - HYSTERESIS_ANGLE)) {
    newDirection = DIR_FORWARD;
  } else {
    // In hysteresis band - keep previous direction
    newDirection = lastValidDirection;
  }
  
  lastValidDirection = newDirection;
  return newDirection;
}

// =====================================================
// SAFETY CHECK FUNCTIONS
// =====================================================
bool isLeftSideSafe() {
  return sensorLeftValid && (distLeft >= SAFE_TURN_DISTANCE);
}

bool isRightSideSafe() {
  return sensorRightValid && (distRight >= SAFE_TURN_DISTANCE);
}

bool isFrontClear() {
  return sensorFrontValid && (distFront > FRONT_STOP_DISTANCE);
}

bool isRearDanger() {
  // Something approaching from behind - might need to move forward
  return sensorBackValid && (distBack < REAR_DANGER_DISTANCE);
}

bool isEmergencyStop() {
  // Stop if: front obstacle too close OR sensor failure
  if (!sensorFrontValid) return true;  // Fail-safe: stop if sensor dead
  if (distFront <= FRONT_STOP_DISTANCE) return true;
  return false;
}

bool isBothSidesBlocked() {
  return (distLeft < SAFE_TURN_DISTANCE && distRight < SAFE_TURN_DISTANCE);
}

bool isUserPresent() {
  // Check if user is detected via UWB
  return uwbValid && (uwbDistance < USER_LOST_DISTANCE);
}

// =====================================================
// STATE CHANGE HELPER (with debouncing)
// =====================================================
void changeState(TrolleyState newState) {
  if (newState != currentState) {
    // Debounce rapid state changes (except emergency)
    if (newState != STATE_EMERGENCY_STOP && 
        (millis() - lastStateChangeTime) < STATE_DEBOUNCE) {
      return;
    }
    previousState = currentState;
    currentState = newState;
    lastStateChangeTime = millis();
  }
}

// =====================================================
// SAFE TURNING DECISION LOGIC
// =====================================================
void handleTurningLogic() {
  userDirection = detectUserDirection();
  
  // Priority 0: Check if user is still present
  if (!isUserPresent()) {
    if (currentState != STATE_USER_LOST) {
      userLostTime = millis();
      changeState(STATE_USER_LOST);
    }
    return;
  }
  
  // Priority 1: Emergency collision prevention
  if (isEmergencyStop()) {
    changeState(STATE_EMERGENCY_STOP);
    stopMotors();
    return;
  }
  
  // Priority 1.5: Rear danger detection
  if (isRearDanger() && isFrontClear()) {
    changeState(STATE_REAR_DANGER);
    return;
  }
  
  // Priority 2: Handle current turning states (don't interrupt mid-turn)
  switch(currentState) {
    case STATE_WAITING_TO_TURN_LEFT:
      handleWaitingToTurnLeft();
      return;
      
    case STATE_WAITING_TO_TURN_RIGHT:
      handleWaitingToTurnRight();
      return;
      
    case STATE_TURNING_LEFT:
      handleActiveTurnLeft();
      return;
      
    case STATE_TURNING_RIGHT:
      handleActiveTurnRight();
      return;
      
    case STATE_USER_LOST:
      // User found again - resume following
      changeState(STATE_FOLLOWING);
      return;
      
    case STATE_REAR_DANGER:
      // If rear is clear now, go back to following
      if (!isRearDanger()) {
        changeState(STATE_FOLLOWING);
      }
      return;
      
    default:
      break;
  }
  
  // Priority 3: Check for new turn requests
  if (userDirection == DIR_LEFT) {
    if (isLeftSideSafe()) {
      // Case 1: User turns left, left side clear → Immediate turn
      changeState(STATE_TURNING_LEFT);
      Serial.println("TURN_LEFT_SAFE - Executing turn");
    } else {
      // Case 2: User turns left, left side blocked → Wait
      changeState(STATE_WAITING_TO_TURN_LEFT);
      turnWaitStartTime = millis();
      Serial.println("TURN_LEFT_BLOCKED - Waiting for clearance");
    }
  }
  else if (userDirection == DIR_RIGHT) {
    if (isRightSideSafe()) {
      // Case 1: User turns right, right side clear → Immediate turn
      changeState(STATE_TURNING_RIGHT);
      Serial.println("TURN_RIGHT_SAFE - Executing turn");
    } else {
      // Case 3: User turns right, right side blocked → Wait
      changeState(STATE_WAITING_TO_TURN_RIGHT);
      turnWaitStartTime = millis();
      Serial.println("TURN_RIGHT_BLOCKED - Waiting for clearance");
    }
  }
  else {
    // Forward following mode
    changeState(STATE_FOLLOWING);
  }
}

// Handle waiting to turn left (creep forward until clear)
void handleWaitingToTurnLeft() {
  // Re-read UWB to check if user changed mind
  readUWB();
  
  // If user changed direction, abort waiting
  if (uwbAngle > TURN_ANGLE_THRESHOLD) {
    Serial.println("USER_CHANGED_DIRECTION - Aborting left wait");
    changeState(STATE_FOLLOWING);
    return;
  }
  
  // Check timeout
  if (millis() - turnWaitStartTime > MAX_TURN_WAIT) {
    Serial.println("TURN_WAIT_TIMEOUT - Resuming forward");
    changeState(STATE_FOLLOWING);
    return;
  }
  
  // Case 5: Obstacle in front while waiting → Stop
  if (!isFrontClear()) {
    stopMotors();
    Serial.println("FRONT_BLOCKED_WHILE_WAITING - Stopped");
    return;
  }
  
  // Check if left is now clear
  if (isLeftSideSafe()) {
    changeState(STATE_TURNING_LEFT);
    Serial.println("LEFT_CLEARED - Initiating turn");
    return;
  }
  
  // Continue creeping forward
  creepForward();
  Serial.println("CREEP_FORWARD - Waiting for left clearance");
}

// Handle waiting to turn right
void handleWaitingToTurnRight() {
  // Re-read UWB to check if user changed mind
  readUWB();
  
  // If user changed direction, abort waiting
  if (uwbAngle < -TURN_ANGLE_THRESHOLD) {
    Serial.println("USER_CHANGED_DIRECTION - Aborting right wait");
    changeState(STATE_FOLLOWING);
    return;
  }
  
  if (millis() - turnWaitStartTime > MAX_TURN_WAIT) {
    Serial.println("TURN_WAIT_TIMEOUT - Resuming forward");
    changeState(STATE_FOLLOWING);
    return;
  }
  
  if (!isFrontClear()) {
    stopMotors();
    Serial.println("FRONT_BLOCKED_WHILE_WAITING - Stopped");
    return;
  }
  
  if (isRightSideSafe()) {
    changeState(STATE_TURNING_RIGHT);
    Serial.println("RIGHT_CLEARED - Initiating turn");
    return;
  }
  
  creepForward();
  Serial.println("CREEP_FORWARD - Waiting for right clearance");
}

// Active left turn with continuous safety monitoring
void handleActiveTurnLeft() {
  // Re-read sensors for real-time safety
  readUWB();
  
  // Continuous safety check during turn
  if (distLeft < SHELF_THRESHOLD || distFront < FRONT_STOP_DISTANCE) {
    stopMotors();
    changeState(STATE_EMERGENCY_STOP);
    Serial.println("TURN_ABORTED - Obstacle detected");
    return;
  }
  
  // Check if turn complete (user now in front) - with hysteresis
  if (abs(uwbAngle) < (TURN_ANGLE_THRESHOLD / 2)) {
    changeState(STATE_FOLLOWING);
    Serial.println("TURN_COMPLETE - Resuming follow");
    return;
  }
  
  turnLeft(SPEED_TURN);
}

// Active right turn with continuous safety monitoring
void handleActiveTurnRight() {
  // Re-read sensors for real-time safety
  readUWB();
  
  if (distRight < SHELF_THRESHOLD || distFront < FRONT_STOP_DISTANCE) {
    stopMotors();
    changeState(STATE_EMERGENCY_STOP);
    Serial.println("TURN_ABORTED - Obstacle detected");
    return;
  }
  
  if (abs(uwbAngle) < (TURN_ANGLE_THRESHOLD / 2)) {
    changeState(STATE_FOLLOWING);
    Serial.println("TURN_COMPLETE - Resuming follow");
    return;
  }
  
  turnRight(SPEED_TURN);
}

// =====================================================
// FOLLOWING MODE WITH SPEED CONTROL
// =====================================================
void handleFollowingMode() {
  readToF();
  
  // Use ToF for fine distance control when close
  long effectiveDistance = (tofDistance > 0 && tofDistance < 100) ? tofDistance : distFront;
  
  // FIXED LOGIC ORDER: Check closest distances first (most restrictive first)
  
  // Priority 1: Too close to user - STOP
  if (effectiveDistance <= USER_TOO_CLOSE && effectiveDistance > 0) {
    stopMotors();
    Serial.println("TOO_CLOSE - Maintaining distance");
    return;
  }
  
  // Priority 2: Obstacle very close - STOP
  if (effectiveDistance <= FRONT_STOP_DISTANCE) {
    stopMotors();
    Serial.println("STOP - Obstacle ahead");
    return;
  }
  
  // Priority 3: Getting close - SLOW
  if (effectiveDistance <= FRONT_SLOW_DISTANCE) {
    moveForward(SPEED_SLOW);
    Serial.println("FOLLOW_SLOW");
    return;
  }
  
  // Priority 4: Medium distance - MEDIUM speed
  if (effectiveDistance <= FRONT_MED_DISTANCE) {
    moveForward(SPEED_MEDIUM);
    Serial.println("FOLLOW_MEDIUM");
    return;
  }
  
  // Priority 5: User far - FAST
  if (effectiveDistance <= USER_TOO_FAR) {
    moveForward(SPEED_FAST);
    Serial.println("FOLLOW_FAST");
    return;
  }
  
  // User too far - move at max speed to catch up
  moveForward(SPEED_FAST);
  Serial.println("CATCHING_UP - User far ahead");
}

// =====================================================
// MAIN STATE EXECUTION
// =====================================================
void executeState() {
  switch(currentState) {
    case STATE_FOLLOWING:
      handleFollowingMode();
      break;
      
    case STATE_WAITING_TO_TURN_LEFT:
    case STATE_WAITING_TO_TURN_RIGHT:
      // Handled in turning logic - but ensure motors running
      break;
      
    case STATE_TURNING_LEFT:
    case STATE_TURNING_RIGHT:
      // Handled in turning logic
      break;
      
    case STATE_EMERGENCY_STOP:
      stopMotors();
      Serial.println("EMERGENCY_STOP");
      // Recovery: check if safe to resume after brief pause
      if (millis() - lastStateChangeTime > 500) {  // 500ms pause
        if (isFrontClear()) {
          changeState(STATE_FOLLOWING);
          Serial.println("EMERGENCY_CLEARED - Resuming");
        }
      }
      break;
      
    case STATE_BLOCKED:
      stopMotors();
      Serial.println("BLOCKED - Both sides obstructed");
      if (!isBothSidesBlocked() && isFrontClear()) {
        changeState(STATE_FOLLOWING);
      }
      break;
      
    case STATE_USER_LOST:
      // Gradually slow down then stop
      if (millis() - userLostTime < 1000) {
        moveForward(SPEED_SLOW);  // Continue slowly for 1 sec
        Serial.println("USER_LOST - Slowing down");
      } else if (millis() - userLostTime < USER_LOST_TIMEOUT) {
        moveForward(SPEED_CREEP);  // Creep for another 2 sec
        Serial.println("USER_LOST - Searching");
      } else {
        stopMotors();
        Serial.println("USER_LOST - Stopped, waiting for user");
      }
      break;
      
    case STATE_REAR_DANGER:
      // Move forward slowly to escape rear danger
      if (isFrontClear()) {
        moveForward(SPEED_SLOW);
        Serial.println("REAR_DANGER - Moving forward");
      } else {
        stopMotors();
        Serial.println("REAR_DANGER - Front blocked, can't escape");
      }
      break;
      
    case STATE_IDLE:
    default:
      stopMotors();
      break;
  }
}

// =====================================================
// DEBUG OUTPUT
// =====================================================
void printDebugInfo() {
  static unsigned long lastPrintTime = 0;
  
  // Only print every 500ms to avoid serial flooding
  if (millis() - lastPrintTime < 500) return;
  lastPrintTime = millis();
  
  Serial.print("F:"); Serial.print(distFront);
  Serial.print(sensorFrontValid ? "" : "!");  // ! = sensor error
  Serial.print(" L:"); Serial.print(distLeft);
  Serial.print(sensorLeftValid ? "" : "!");
  Serial.print(" R:"); Serial.print(distRight);
  Serial.print(sensorRightValid ? "" : "!");
  Serial.print(" B:"); Serial.print(distBack);
  Serial.print(sensorBackValid ? "" : "!");
  Serial.print(" | UWB:"); Serial.print(uwbAngle);
  Serial.print("°"); Serial.print(uwbValid ? "" : "(N/A)");
  Serial.print(" | State:");
  
  switch(currentState) {
    case STATE_IDLE: Serial.println("IDLE"); break;
    case STATE_FOLLOWING: Serial.println("FOLLOWING"); break;
    case STATE_WAITING_TO_TURN_LEFT: Serial.println("WAIT_LEFT"); break;
    case STATE_WAITING_TO_TURN_RIGHT: Serial.println("WAIT_RIGHT"); break;
    case STATE_TURNING_LEFT: Serial.println("TURN_LEFT"); break;
    case STATE_TURNING_RIGHT: Serial.println("TURN_RIGHT"); break;
    case STATE_EMERGENCY_STOP: Serial.println("E_STOP"); break;
    case STATE_BLOCKED: Serial.println("BLOCKED"); break;
    case STATE_USER_LOST: Serial.println("USER_LOST"); break;
    case STATE_REAR_DANGER: Serial.println("REAR_DANGER"); break;
    default: Serial.println("UNKNOWN"); break;
  }
}

// =====================================================
// SETUP
// =====================================================
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println();
  Serial.println("╔═══════════════════════════════════════════════╗");
  Serial.println("║   SMART SHOPPING TROLLEY - Initializing...    ║");
  Serial.println("╚═══════════════════════════════════════════════╝");

  // Ultrasonic sensors
  pinMode(TF, OUTPUT); pinMode(EF, INPUT);
  pinMode(TL, OUTPUT); pinMode(EL, INPUT);
  pinMode(TR, OUTPUT); pinMode(ER, INPUT);  // ER = GPIO 36 (input only)
  pinMode(TB, OUTPUT); pinMode(EB, INPUT);  // EB = GPIO 39 (input only)
  Serial.println("[OK] Ultrasonic sensors configured");

  // LED indicators
  pinMode(LED_FAST, OUTPUT);
  pinMode(LED_MED, OUTPUT);
  pinMode(LED_SLOW, OUTPUT);
  pinMode(LED_STOP, OUTPUT);
  
  // Test LEDs
  digitalWrite(LED_FAST, HIGH); delay(100);
  digitalWrite(LED_MED, HIGH); delay(100);
  digitalWrite(LED_SLOW, HIGH); delay(100);
  digitalWrite(LED_STOP, HIGH); delay(100);
  digitalWrite(LED_FAST, LOW);
  digitalWrite(LED_MED, LOW);
  digitalWrite(LED_SLOW, LOW);
  digitalWrite(LED_STOP, LOW);
  Serial.println("[OK] LED indicators configured");

  // Motors
  setupMotors();
  Serial.println("[OK] Motor driver configured");
  
  // Initialize I2C for UWB (if using I2C mode)
  // Wire.begin(UWB_SDA, UWB_SCL);
  // initUWB();
  Serial.println("[--] UWB module - using simulation mode");
  Serial.println("     Send: L45 (left 45°), R30 (right 30°), F (forward), X (lost)");
  
  // Initialize UART for ToF (if using GY-53)
  // Serial2.begin(9600, SERIAL_8N1, TOF_RX, TOF_TX);
  // initToF();
  Serial.println("[--] ToF sensor - using ultrasonic fallback");
  
  // Initial state
  currentState = STATE_IDLE;
  uwbValid = true;  // Assume valid for simulation
  
  // Startup sensor check
  Serial.println();
  Serial.println("Running sensor self-test...");
  readAllSensors();
  Serial.print("  Front: "); Serial.print(distFront); Serial.println(sensorFrontValid ? " cm [OK]" : " cm [FAIL]");
  Serial.print("  Left:  "); Serial.print(distLeft);  Serial.println(sensorLeftValid ? " cm [OK]" : " cm [FAIL]");
  Serial.print("  Right: "); Serial.print(distRight); Serial.println(sensorRightValid ? " cm [OK]" : " cm [FAIL]");
  Serial.print("  Back:  "); Serial.print(distBack);  Serial.println(sensorBackValid ? " cm [OK]" : " cm [FAIL]");
  
  Serial.println();
  Serial.println("╔═══════════════════════════════════════════════╗");
  Serial.println("║   System Ready - Starting in 2 seconds...     ║");
  Serial.println("╚═══════════════════════════════════════════════╝");
  
  digitalWrite(LED_STOP, HIGH);
  delay(2000);
  digitalWrite(LED_STOP, LOW);
  
  changeState(STATE_FOLLOWING);
  Serial.println("Mode: FOLLOWING");
}

// =====================================================
// MAIN LOOP
// =====================================================
void loop() {
  // Step 1: Read all sensors
  readAllSensors();
  
  // Step 2: Process turning decision logic
  handleTurningLogic();
  
  // Step 3: Execute current state
  executeState();
  
  // Step 4: Update LED indicators
  updateLEDs(currentState);
  
  // Step 5: Debug output (rate-limited internally)
  printDebugInfo();
  
  delay(50);  // 20Hz control loop (faster for better response)
}
