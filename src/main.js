// Main logic for the bike simulator
import './style.css';

// DOM Elements
const setupOverlay = document.getElementById('setup-overlay');
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const loadApiBtn = document.getElementById('load-api-btn');
const startBtn = document.getElementById('start-btn');
const apiKeyInput = document.getElementById('api-key');
const locationSearchInput = document.getElementById('location-search');
const hud = document.getElementById('hud');
const speedDisplay = document.getElementById('speed-display');

// Google Maps Objects
let map;
let panorama;
let streetViewService;

// Game State
const state = {
  speed: 0, // km/h
  heading: 0, // degrees
  maxSpeed: 60,
  acceleration: 20, // km/h per second
  braking: 40,
  friction: 5,
  turnRate: 60, // degrees per second
  distanceAccumulated: 0, // meters
  lastTime: 0,
  isRunning: false,
  links: [],
  currentPano: null
};

// Controls
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  ArrowUp: false,
  ArrowLeft: false,
  ArrowDown: false,
  ArrowRight: false
};

// Listeners - Use capture phase to intercept keys before Maps API swallows them
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const k = e.key;
  if (k === 'w' || k === 'W') keys.w = true;
  if (k === 'a' || k === 'A') keys.a = true;
  if (k === 's' || k === 'S') keys.s = true;
  if (k === 'd' || k === 'D') keys.d = true;
  if (k === 'ArrowUp') keys.ArrowUp = true;
  if (k === 'ArrowDown') keys.ArrowDown = true;
  if (k === 'ArrowLeft') keys.ArrowLeft = true;
  if (k === 'ArrowRight') keys.ArrowRight = true;
}, true);

window.addEventListener('keyup', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const k = e.key;
  if (k === 'w' || k === 'W') keys.w = false;
  if (k === 'a' || k === 'A') keys.a = false;
  if (k === 's' || k === 'S') keys.s = false;
  if (k === 'd' || k === 'D') keys.d = false;
  if (k === 'ArrowUp') keys.ArrowUp = false;
  if (k === 'ArrowDown') keys.ArrowDown = false;
  if (k === 'ArrowLeft') keys.ArrowLeft = false;
  if (k === 'ArrowRight') keys.ArrowRight = false;
}, true);

// Setup Initializer
const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (envApiKey) {
  step1.classList.add('hidden');
  loadGoogleMaps(envApiKey);
}

loadApiBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (key) {
    loadApiBtn.innerText = 'Loading...';
    loadApiBtn.disabled = true;
    loadGoogleMaps(key);
  } else {
    alert("Please enter an API Key.");
  }
});

function loadGoogleMaps(apiKey) {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=onMapApiLoaded`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    alert("Failed to load Google Maps. Check your API key and network.");
    loadApiBtn.innerText = 'Next';
    loadApiBtn.disabled = false;
  };
  
  window.onMapApiLoaded = () => {
    step1.classList.add('hidden');
    step2.classList.remove('hidden');
  };

  document.head.appendChild(script);
}

startBtn.addEventListener('click', () => {
  const query = locationSearchInput.value.trim();
  startBtn.innerText = 'Loading...';
  startBtn.disabled = true;
  
  const geocoder = new google.maps.Geocoder();
  
  if (query) {
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === 'OK') {
        launchSimulator(results[0].geometry.location);
      } else {
        alert("Could not find location: " + status);
        startBtn.innerText = 'Start Riding';
        startBtn.disabled = false;
      }
    });
  } else {
    // Default to Golden Gate
    launchSimulator({ lat: 37.8199, lng: -122.4783 });
  }
});

function launchSimulator(startLocation) {
  const loader = document.createElement('div');
  loader.className = 'loader-overlay active';
  loader.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(loader);

  setupOverlay.classList.remove('active');
  setupOverlay.style.display = 'none';

  setTimeout(() => {
    initSimulator(startLocation);
    loader.classList.remove('active');
    hud.classList.remove('hidden');
  }, 500);
}

function initSimulator(startLocation) {
  streetViewService = new google.maps.StreetViewService();
  
  // Initialize Minimap
  map = new google.maps.Map(document.getElementById('minimap'), {
    center: startLocation,
    zoom: 16,
    disableDefaultUI: true,
    mapTypeId: 'roadmap',
    styles: [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
    ]
  });

  // Initialize Street View
  panorama = new google.maps.StreetViewPanorama(
    document.getElementById('street-view'), {
      position: startLocation,
      pov: { heading: 180, pitch: 0 },
      zoom: 1,
      disableDefaultUI: true,
      clickToGo: false,
      scrollwheel: false,
      linksControl: false,
      panControl: false,
      enableCloseButton: false,
      motionTracking: false
    }
  );

  map.setStreetView(panorama);

  // Listen for panorama changes to update links and map
  panorama.addListener('links_changed', () => {
    state.links = panorama.getLinks() || [];
  });
  
  panorama.addListener('position_changed', () => {
    const pos = panorama.getPosition();
    if (pos) {
      map.setCenter(pos);
      state.currentPano = panorama.getPano();
    }
  });

  panorama.addListener('pov_changed', () => {
    // Only update internal heading if the user isn't overriding it heavily
    // Actually, we want our state.heading to control the camera, not the other way around.
  });

  // Initial setup with a large radius to find nearest street view
  streetViewService.getPanorama({ location: startLocation, radius: 5000 }, (data, status) => {
    if (status === 'OK') {
      panorama.setPano(data.location.pano);
      state.heading = data.tiles.centerHeading || 180;
      panorama.setPov({ heading: state.heading, pitch: 0 });
      state.isRunning = true;
      state.lastTime = performance.now();
      requestAnimationFrame(gameLoop);
    } else {
      alert('Street View not available anywhere near this location.');
    }
  });
}

function getBestLink(heading) {
  if (!state.links || state.links.length === 0) return null;
  
  let bestLink = null;
  let minDiff = Infinity;
  
  state.links.forEach(link => {
    let diff = Math.abs(link.heading - heading);
    // Handle wrap around 360
    if (diff > 180) diff = 360 - diff;
    
    if (diff < minDiff) {
      minDiff = diff;
      bestLink = link;
    }
  });
  
  // Only return link if it's within a reasonable angle (e.g. 60 degrees)
  if (minDiff < 60) {
    return bestLink;
  }
  return null;
}

function gameLoop(time) {
  if (!state.isRunning) return;
  
  const dt = (time - state.lastTime) / 1000; // Delta time in seconds
  state.lastTime = time;
  
  updatePhysics(dt);
  updateCamera(dt);
  updateUI();
  
  requestAnimationFrame(gameLoop);
}

function updatePhysics(dt) {
  const isAccelerating = keys.w || keys.ArrowUp;
  const isBraking = keys.s || keys.ArrowDown;
  const isTurningLeft = keys.a || keys.ArrowLeft;
  const isTurningRight = keys.d || keys.ArrowRight;

  // Steering
  // Only allow turning if moving, or turn slower if stopped? Let's allow turning always so they can look around.
  if (isTurningLeft) {
    state.heading -= state.turnRate * dt;
  }
  if (isTurningRight) {
    state.heading += state.turnRate * dt;
  }
  
  // Normalize heading 0-360
  state.heading = (state.heading + 360) % 360;

  // Speed
  if (isAccelerating) {
    state.speed += state.acceleration * dt;
  } else if (isBraking) {
    state.speed -= state.braking * dt;
  } else {
    // Apply friction
    state.speed -= state.friction * dt;
  }

  // Clamp speed
  if (state.speed < 0) state.speed = 0;
  if (state.speed > state.maxSpeed) state.speed = state.maxSpeed;
  
  // Handle movement logic
  if (state.speed > 0) {
    // Speed is km/h. Distance in meters per second = speed / 3.6
    const distanceThisFrame = (state.speed / 3.6) * dt;
    state.distanceAccumulated += distanceThisFrame;
    
    // Check if we hit a wall (no road ahead)
    const bestLink = getBestLink(state.heading);
    
    if (!bestLink) {
      // "Hit a wall" effect - drastically reduce speed
      state.speed *= 0.8;
      // Shake effect could be added here
      document.getElementById('street-view').style.transform = `translate(${(Math.random()-0.5)*10}px, ${(Math.random()-0.5)*10}px)`;
    } else {
      document.getElementById('street-view').style.transform = 'none';
      
      // If we've traveled enough, jump to the next node
      // Average distance between nodes is about 5-10 meters
      const nodeDistance = 8; 
      
      if (state.distanceAccumulated >= nodeDistance) {
        panorama.setPano(bestLink.pano);
        state.distanceAccumulated = 0;
      }
    }
  } else {
    document.getElementById('street-view').style.transform = 'none';
  }
}

function updateCamera(dt) {
  // Smoothly update POV to match steering
  const currentPov = panorama.getPov();
  
  // Calculate dynamic zoom based on speed for warp effect (1 is default, max zoom out is 0)
  // Actually, decreasing zoom widens the FOV. 
  // Let's use a subtle change: base zoom = 1.0, max speed zoom = 0.5
  const targetZoom = 1.0 - (state.speed / state.maxSpeed) * 0.5;
  
  // Interpolate zoom smoothly
  const currentZoom = currentPov.zoom || 1;
  const smoothZoom = currentZoom + (targetZoom - currentZoom) * 5 * dt;

  panorama.setPov({
    heading: state.heading,
    pitch: currentPov.pitch, // Keep current pitch or could simulate bumps
    zoom: smoothZoom
  });
}

function updateUI() {
  speedDisplay.innerText = Math.round(state.speed);
  
  // Map rotation
  const minimapElem = document.getElementById('minimap-container');
  minimapElem.style.transform = `rotate(${-state.heading}deg)`;
  
  // Also rotate the map div inside opposite to keep it upright if needed,
  // but standard minimaps rotate the view. 
  // Actually, setting Map heading is better for Vector maps, but this is a raster roadmap.
  // So rotating the container works as a cheap trick!
}
