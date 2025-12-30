#define TF 5
#define EF 18

#define TL 17
#define EL 19

#define TR 16
#define ER 21

#define TB 4
#define EB 22

#define LED_FAST 25
#define LED_MED 26
#define LED_SLOW 27
#define LED_STOP 14

long getDistance(int trig, int echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long duration = pulseIn(echo, HIGH, 30000);
  return duration * 0.034 / 2;
}

void setup() {
  Serial.begin(9600);

  pinMode(TF, OUTPUT); pinMode(EF, INPUT);
  pinMode(TL, OUTPUT); pinMode(EL, INPUT);
  pinMode(TR, OUTPUT); pinMode(ER, INPUT);
  pinMode(TB, OUTPUT); pinMode(EB, INPUT);

  pinMode(LED_FAST, OUTPUT);
  pinMode(LED_MED, OUTPUT);
  pinMode(LED_SLOW, OUTPUT);
  pinMode(LED_STOP, OUTPUT);
}

void loop() {
  long front = getDistance(TF, EF);
  long left  = getDistance(TL, EL);
  long right = getDistance(TR, ER);
  long back  = getDistance(TB, EB);
  
  Serial.print("Front: "); Serial.print(front);
  Serial.print(" | Left: "); Serial.print(left);
  Serial.print(" | Right: "); Serial.print(right);
  Serial.print(" | Back: "); Serial.println(back);

  digitalWrite(LED_FAST, LOW);
  digitalWrite(LED_MED, LOW);
  digitalWrite(LED_SLOW, LOW);
  digitalWrite(LED_STOP, LOW);

  if (front > 80) {
    digitalWrite(LED_FAST, HIGH);
    Serial.println("MOVE_FORWARD_FAST");
  }
  else if (front > 50) {
    digitalWrite(LED_MED, HIGH);
    Serial.println("MOVE_FORWARD_MEDIUM");
  }
  else if (front > 30) {
    digitalWrite(LED_SLOW, HIGH);
    Serial.println("MOVE_FORWARD_SLOW");
  }
  else {
    digitalWrite(LED_STOP, HIGH);
    Serial.println("STOP");
  }

  delay(200);
}
