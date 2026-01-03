# Smart Autonomous Shopping Trolley

## Executive Summary

The Smart Autonomous Shopping Trolley is an innovative solution designed to enhance the shopping experience in supermarkets and large retail stores. This autonomous cart addresses the challenges faced by customers, particularly elderly individuals and those with disabilities, by providing a user-friendly, intelligent, and safe shopping assistant.

## Problem Statement

In traditional retail environments, customers often struggle with heavy trolleys, leading to discomfort and inefficiency. The lack of intelligent features in conventional shopping carts results in a physically demanding experience, particularly for vulnerable populations. There is a pressing need for a smart trolley that can autonomously follow users, navigate aisles, and avoid obstacles without manual intervention.

## Proposed Solution

The Smart Trolley utilizes Ultra-Wideband (UWB) technology to seamlessly follow users while ensuring safety through ultrasonic-based obstacle detection. The user carries a UWB-enabled card or tag, allowing the trolley to continuously track their position and direction. By employing real-time distance and angle calculations, the trolley intelligently adjusts its movement—moving forward, turning, or stopping as needed. Multiple ultrasonic sensors facilitate obstacle detection, enabling the trolley to navigate crowded environments safely.

The system is powered by an ESP32 microcontroller, which ensures rapid processing, wireless communication, and reliable real-time decision-making.

## Key Features

- **User-Following Technology**: Employs UWB localization for precise tracking.
- **Automatic Navigation**: Intelligent turning logic based on user movement across aisles.
- **Obstacle Detection**: Real-time avoidance using multiple ultrasonic sensors.
- **Safety Control**: Implements safety-first movement protocols (stop, slow down, reroute).
- **Wireless Communication**: Low-latency tracking for seamless operation.
- **Cost-Effective Design**: Low power consumption and economical components.

## Working Overview

1. The user carries a UWB card/tag.
2. The trolley receives distance and directional data from the UWB module.
3. Based on this data:
   - Moves forward if the user is directly ahead.
   - Turns left or right when the user changes aisles.
   - Stops if the user is too close or stationary.
4. Ultrasonic sensors continuously scan for obstacles.
5. If an obstacle is detected within a threshold distance:
   - The trolley slows down, stops, or changes direction accordingly.
6. The ESP32 microcontroller processes all sensor inputs and controls the motors effectively.

## Technical Stack & Components

- **Microcontroller**: ESP32
- **Tracking Technology**: Ultra-Wideband (UWB) module
- **Obstacle Detection**: Multiple Ultrasonic Sensors
- **Motor Control**: DC motors with motor driver
- **Power Supply**: Battery-based system

## Impact

The Smart Trolley significantly enhances the shopping experience by reducing physical strain, improving accessibility, and introducing automation into retail environments. This solution is particularly beneficial for elderly users and large retail stores aiming to modernize customer interactions and improve service efficiency.

## Backend API (Django REST + MySQL)

- **Stack**: Django 6, Django REST Framework, MySQL, UUID identifiers, JSON-only responses.
- **Core rules**: One active session per trolley, automatic timeout cleanup, billing signup separated from trolley access.

### Setup

1) Install deps: `pip install -r requirement.txt`
2) Configure `.env` (example):
```
DJANGO_SECRET_KEY=change-me
DB_NAME=smarttrolley
DB_USER=root
DB_PASSWORD=yourpassword
DB_HOST=127.0.0.1
DB_PORT=3306
ALLOWED_HOSTS=*
SESSION_TIMEOUT_SECONDS=30
```
3) Run migrations: `python manage.py migrate`
4) Start server: `python manage.py runserver 0.0.0.0:8000`

### API Overview (all under `/api/`)

- POST `/user/signup` → `{name, phone_number, email?}` → `{user_id}`
- POST `/session/start` → `{trolley_id, user_id?}`; rejects if trolley in use.
- POST `/session/heartbeat` → `{session_id}`; refreshes activity.
- POST `/session/end` → `{session_id}`; ends session, clears cart, unassigns trolley.
- POST `/cart/scan` → `{session_id, barcode}`; add/increment item.
- POST `/cart/remove` → `{session_id, barcode}`; remove item.
- GET `/cart/view?session_id=...` → cart items + total.
- POST `/payment/create` → `{session_id}`; returns mock UPI string (requires billing user on session).
- POST `/payment/confirm` → `{session_id}`; marks payment success and unassigns trolley.

### Notes

- ESP32 scanners call `/cart/scan` with trusted barcode payloads; backend remains source of truth.
- Idle sessions automatically expire after `SESSION_TIMEOUT_SECONDS`, clearing carts and freeing the trolley.
- Trolley reuse conflicts return `"Trolley already in use"` so a cart cannot be shared.