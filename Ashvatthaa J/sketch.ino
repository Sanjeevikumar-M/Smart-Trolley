#define L_RED   25
#define L_GREEN 26

#define R_RED   32
#define R_GREEN 33

float d = 1.5;
float angle = 0;

void setup() {
  Serial.begin(115200);

  pinMode(L_RED, OUTPUT);
  pinMode(L_GREEN, OUTPUT);
  pinMode(R_RED, OUTPUT);
  pinMode(R_GREEN, OUTPUT);

  Serial.println("Enter: distance,angle");
}

void setLeft(int r, int g) {
  analogWrite(L_RED, r);
  analogWrite(L_GREEN, g);
}

void setRight(int r, int g) {
  analogWrite(R_RED, r);
  analogWrite(R_GREEN, g);
}

void loop() {
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    int comma = input.indexOf(',');

    if (comma > 0) {
      d = input.substring(0, comma).toFloat();
      angle = input.substring(comma + 1).toFloat();
    }
  }

  if (d < 0.5 || d > 3.0) {
    setLeft(0, 0);
    setRight(0, 0);
  }
  else if (angle > 10) {        // Turn Right
    setLeft(0, 255);            // Left motor fast
    setRight(255, 0);           // Right motor slow
  }
  else if (angle < -10) {       // Turn Left
    setLeft(255, 0);
    setRight(0, 255);
  }
  else {                        // Straight
    setLeft(0, 255);
    setRight(0, 255);
  }

  delay(50);
}
