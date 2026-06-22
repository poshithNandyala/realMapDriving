# Real World Bike Simulator (GTA Edition) 🚲🌍

Welcome to the **Real World Bike Simulator**, an interactive web application that turns the entire globe into your personal riding playground. Ever wanted to experience the freedom of exploring like in GTA, but in the actual, real world? Now you can.

## 🌟 What is this?

This app transforms Google Street View into a real-time driving simulator. By leveraging the Google Maps API and a custom physics engine, it allows you to hop on a virtual bike and explore anywhere on Earth. 

* **Drive past your own house.**
* **Cruise down the Las Vegas Strip.**
* **Explore the bustling streets of Tokyo.**
* **Go anywhere that Google Street View cars have been!**

It combines the vastness of the real world with the interactive fun of a video game. 

## ✨ Features

* **Real-World Exploration:** Search for any city, landmark, or address and instantly spawn there.
* **Game-Like Physics:** Accelerate, brake, and drift through streets with a custom physics loop that simulates momentum and friction.
* **Smart Path Navigation:** As you steer your bike, the engine calculates the nearest roads and seamlessly snaps you to the next Street View node, giving the illusion of smooth forward travel.
* **Premium HUD:** Features a real-time glassmorphism speedometer, interactive minimap tracking, and dynamic "warp" visual effects when you hit high speeds.
* **Full 360° Vision:** Look around seamlessly in all directions as you ride.

## 🎮 How to Play

### Controls
The simulator uses standard PC gaming controls:
* **`W`** or **`Up Arrow`** - Accelerate 
* **`S`** or **`Down Arrow`** - Brake
* **`A`** or **`Left Arrow`** - Steer Left
* **`D`** or **`Right Arrow`** - Steer Right

### Getting Started (Local Setup)

Because this app renders the real world, it requires a Google Maps API Key to fetch the map data.

1. **Clone or Download** this repository.
2. Ensure you have **Node.js** installed on your machine.
3. Open a terminal in the project folder and run:
   ```bash
   npm install
   npm run dev
   ```
4. Open your browser to the local server address (usually `http://localhost:5173`).
5. **Enter your Google Maps API Key** when prompted. *(Note: Make sure the "Maps JavaScript API" is enabled in your Google Cloud Console).*
6. **Search for a location** (e.g., "Kurnool", "Times Square", "Eiffel Tower").
7. Hit **Start Riding** and enjoy the trip!

---
*Built with Vanilla JS, Vite, and the Google Maps API.*
