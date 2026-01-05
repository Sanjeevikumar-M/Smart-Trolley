#include <ESP32Servo.h>

#define TRIG_F 5
#define ECHO_F 18

#define TRIG_L 17
#define ECHO_L 16

#define TRIG_R 4
#define ECHO_R 2

#define SERVO_PIN 13

#define SAFE_DISTANCE 35
#define WARNING_DISTANCE 20
#define CRITICAL_DISTANCE 12

Servo steering;

enum RobotState {
  GO_STRAIGHT,
  TURN_LEFT,
  TURN_RIGHT,
  STOPPED
};

RobotState currentState = GO_STRAIGHT;
int currentAngle = 90;

// ---------- Distance Reading with Filter ----------
long readDistance(int trigPin, int echoPin) {
  long sum = 0;

  for (int i = 0; i < 3; i++) {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    long duration = pulseIn(echoPin, HIGH, 25000);
    if (duration == 0) duration = 25000;

    sum += duration * 0.034 / 2;
    delay(5);
  }

  return sum / 3;
}

// ---------- Smooth Servo Movement ----------
void moveServoSmooth(int targetAngle) {
  if (currentAngle < targetAngle) {
    for (int a = currentAngle; a <= targetAngle; a++) {
      steering.write(a);
      delay(8);
    }
  } else {
    for (int a = currentAngle; a >= targetAngle; a--) {
      steering.write(a);
      delay(8);
    }
  }
  currentAngle = targetAngle;
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_F, OUTPUT);
  pinMode(ECHO_F, INPUT);

  pinMode(TRIG_L, OUTPUT);
  pinMode(ECHO_L, INPUT);

  pinMode(TRIG_R, OUTPUT);
  pinMode(ECHO_R, INPUT);

  steering.setPeriodHertz(50);
  steering.attach(SERVO_PIN, 500, 2400);
  steering.write(90);
}

void loop() {
  int front = readDistance(TRIG_F, ECHO_F);
  int left  = readDistance(TRIG_L, ECHO_L);
  int right = readDistance(TRIG_R, ECHO_R);

  Serial.print("F:");
  Serial.print(front);
  Serial.print("  L:");
  Serial.print(left);
  Serial.print("  R:");
  Serial.println(right);

  // ---------- Decision Logic ----------
  if (front > SAFE_DISTANCE) {
    currentState = GO_STRAIGHT;
  } 
  else if (front <= CRITICAL_DISTANCE) {
    if (left > right && left > WARNING_DISTANCE) {
      currentState = TURN_LEFT;
    } else if (right > left && right > WARNING_DISTANCE) {
      currentState = TURN_RIGHT;
    } else {
      currentState = STOPPED;
    }
  } 
  else {
    if (left > right) {
      currentState = TURN_LEFT;
    } else {
      currentState = TURN_RIGHT;
    }
  }

  // ---------- Actuation ----------
  switch (currentState) {
    case GO_STRAIGHT:
      moveServoSmooth(90);
      Serial.println("STATE: STRAIGHT");
      break;

    case TURN_LEFT:
      moveServoSmooth(140);
      Serial.println("STATE: LEFT");
      break;

    case TURN_RIGHT:
      moveServoSmooth(40);
      Serial.println("STATE: RIGHT");
      break;

    case STOPPED:
      moveServoSmooth(90);
      Serial.println("STATE: STOP");
      break;
  }

  delay(300);
}
