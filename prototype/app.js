import * as THREE from "three";
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.querySelector("#raceCanvas");
const ctx = canvas.getContext("2d");
const canvas3d = document.querySelector("#raceCanvas3d");
const startButton = document.querySelector("#startButton");
const resetButton = document.querySelector("#resetButton");
const modeButton = document.querySelector("#modeButton");
const launchAgentsButton = document.querySelector("#launchAgentsButton");
const apiNotice = document.querySelector("#apiNotice");
const countdown = document.querySelector("#countdown");
const eventLog = document.querySelector("#eventLog");

const roadsterSprite = new Image();
roadsterSprite.src = "./assets/roadster-top.webp";

const TAU = Math.PI * 2;
const LAPS_TO_WIN = 3;
const track = { cx: 800, cy: 470, rx: 570, ry: 275, width: 155 };
let running = false;
let externalMode = false;
let lastTime = performance.now();
let elapsed = 0;
let particles = [];
let threeView = null;

const agents = {
  a: makeAgent("a", "#59dcff", -22, 0.94, 0.000112, 0.00007),
  b: makeAgent("b", "#a985ff", 22, 0.91, 0.000108, 0.00009),
};

function makeAgent(id, color, lane, confidence, accel, handling) {
  return {
    id, color, lane, confidence, accel, handling,
    progress: -0.01, speed: 0, lap: 0, steering: 0, throttle: 0, brake: 0,
    decision: "observing", nextIntent: "assess the circuit", finished: false,
    finishTime: null, burst: 0, pendingNudge: null, activeNudge: null,
    nudgeExpiresAt: 0, humanSignal: "none", acknowledgement: `Agent ${id.toUpperCase()} is working autonomously.`,
    acknowledgementUntil: 0, challengeTriggered: false, challengeUntil: 0,
  };
}

function pointOnTrack(progress, lane = 0) {
  const angle = progress * TAU - Math.PI / 2;
  const x = track.cx + (track.rx + lane) * Math.cos(angle);
  const y = track.cy + (track.ry + lane * .55) * Math.sin(angle);
  const dx = -(track.rx + lane) * Math.sin(angle);
  const dy = (track.ry + lane * .55) * Math.cos(angle);
  return { x, y, angle: Math.atan2(dy, dx), curve: Math.abs(Math.sin(angle)) };
}

function ellipsePoints(rx, rz, y = 0, count = 160) {
  return Array.from({ length: count }, (_, index) => {
    const angle = index / count * TAU;
    return new THREE.Vector3(rx * Math.cos(angle), y, rz * Math.sin(angle));
  });
}

function makeTrackMesh() {
  const outer = ellipsePoints(11.55, 6.5).map(point => new THREE.Vector2(point.x, point.z));
  const inner = ellipsePoints(8.45, 3.55).reverse().map(point => new THREE.Vector2(point.x, point.z));
  const shape = new THREE.Shape(outer);
  shape.holes.push(new THREE.Path(inner));
  const geometry = new THREE.ShapeGeometry(shape, 160);
  geometry.rotateX(-Math.PI / 2);
  const road = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x252a32, roughness: .82, metalness: .12 }));
  road.receiveShadow = true;
  return road;
}

function makeCircuitLine(rx, rz, color, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(ellipsePoints(rx, rz, .055));
  return new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
}

function worldPoint(agent) {
  const angle = agent.progress * TAU - Math.PI / 2;
  const lane = agent.lane * .018;
  const x = (10 + lane) * Math.cos(angle);
  const z = (5 + lane * .55) * Math.sin(angle);
  const dx = -(10 + lane) * Math.sin(angle);
  const dz = (5 + lane * .55) * Math.cos(angle);
  return { x, z, heading: Math.atan2(dz, dx) };
}

async function init3D() {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030407);
    scene.fog = new THREE.FogExp2(0x030407, .026);
    const camera = new THREE.PerspectiveCamera(38, 16 / 9, .1, 100);
    camera.position.set(0, 17.5, 21.5);
    camera.lookAt(0, 0, 0);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 30),
      new THREE.MeshStandardMaterial({ color: 0x07090d, roughness: .95, metalness: .08 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -.035;
    ground.receiveShadow = true;
    scene.add(ground, makeTrackMesh());
    scene.add(makeCircuitLine(11.58, 6.53, 0xff2438), makeCircuitLine(8.42, 3.52, 0xff2438));
    scene.add(makeCircuitLine(10, 5, 0xffffff, .18));

    const hemi = new THREE.HemisphereLight(0xb8d8ff, 0x13070a, 2.4);
    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(-6, 16, 8); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    scene.add(hemi, key);
    for (const [x, color] of [[-9, 0x59dcff], [9, 0xa985ff]]) {
      const light = new THREE.PointLight(color, 34, 13, 2);
      light.position.set(x, 2.5, 0); scene.add(light);
    }

    const gltf = await new GLTFLoader().loadAsync("./assets/roadster.glb");
    const cars = {};
    for (const [id, color] of [["a", 0x59dcff], ["b", 0xa985ff]]) {
      const group = gltf.scene.clone(true);
      group.traverse(object => {
        if (!object.isMesh) return;
        object.material = object.material.clone();
        object.material.color.lerp(new THREE.Color(color), .13);
        object.castShadow = true; object.receiveShadow = true;
      });
      const box = new THREE.Box3().setFromObject(group);
      const size = box.getSize(new THREE.Vector3());
      const scale = 1.9 / Math.max(size.x, size.z);
      group.scale.setScalar(scale);
      const centered = new THREE.Box3().setFromObject(group);
      const center = centered.getCenter(new THREE.Vector3());
      group.position.sub(center);
      const carRoot = new THREE.Group();
      carRoot.add(group);
      const glow = new THREE.PointLight(color, 8, 3.6, 2); glow.position.y = .6; carRoot.add(glow);
      scene.add(carRoot); cars[id] = carRoot;
    }
    canvas.style.display = "none";
    threeView = { renderer, scene, camera, cars };
    log("Akari’s 3D roadster model loaded", "#75e8b1");
  } catch (error) {
    canvas3d.style.display = "none";
    canvas.style.display = "block";
    console.warn("3D view unavailable; using 2D fallback", error);
    log("3D unavailable — 2D fallback active", "#ffba75");
  }
}

function draw3D() {
  if (!threeView) return false;
  const { renderer, scene, camera, cars } = threeView;
  const width = canvas3d.clientWidth;
  const height = canvas3d.clientHeight;
  if (canvas3d.width !== Math.round(width * renderer.getPixelRatio()) || canvas3d.height !== Math.round(height * renderer.getPixelRatio())) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  for (const agent of Object.values(agents)) {
    const point = worldPoint(agent);
    cars[agent.id].position.set(point.x, .08, point.z);
    cars[agent.id].rotation.y = -point.heading;
  }
  renderer.render(scene, camera);
  return true;
}

function localDecision(agent, rival) {
  const p = pointOnTrack(agent.progress, agent.lane);
  const gap = (rival.progress + rival.lap) - (agent.progress + agent.lap);
  const corner = p.curve > .64;

  if (agent.id === "b" && !agent.challengeTriggered && agent.lap === 0 && agent.progress > .3) {
    agent.challengeTriggered = true;
    agent.challengeUntil = elapsed + 3200;
    log("Agent B encountered low grip — human guidance is available", agent.color);
  }

  if (agent.challengeUntil > elapsed) {
    agent.throttle = .35;
    agent.brake = .12;
    agent.decision = "recovering from low grip";
    agent.nextIntent = "stabilize, then regain pace";
    return;
  }

  agent.throttle = corner ? (agent.id === "a" ? .69 : .62) : 1;
  agent.brake = corner && agent.speed > (agent.id === "b" ? .00041 : .00045) ? .58 : 0;
  agent.steering = Math.sin(agent.progress * TAU) * agent.handling * 140;

  if (agent.activeNudge === "safer") {
    agent.throttle = Math.min(agent.throttle, corner ? .48 : .78);
    agent.brake = corner ? Math.max(agent.brake, .38) : agent.brake;
  }

  if (Math.abs(gap) < .025 && gap > 0) {
    agent.throttle = 1;
    agent.lane += agent.id === "a" ? -.12 : .12;
    agent.decision = "attack opening";
    agent.nextIntent = "complete the pass";
  } else if (corner) {
    agent.decision = agent.brake ? "brake + rotate" : "hold racing line";
    agent.nextIntent = agent.activeNudge === "safer" ? "exit corner under control" : "accelerate at corner exit";
  } else {
    agent.decision = "accelerate";
    agent.nextIntent = gap > 0 ? "close the gap" : "protect the lead";
  }
}

function applyPendingNudge(agent) {
  if (!agent.pendingNudge) return;
  const p = pointOnTrack(agent.progress, agent.lane);
  const waitedLongEnough = elapsed - agent.pendingNudge.queuedAt > 1200;
  if (p.curve > .5 && !waitedLongEnough) return;

  const { kind, label } = agent.pendingNudge;
  agent.pendingNudge = null;
  agent.activeNudge = kind;
  agent.nudgeExpiresAt = elapsed + 4200;
  agent.humanSignal = label;

  if (kind === "encourage") {
    agent.burst = Math.max(agent.burst, .00007);
    agent.confidence = Math.min(.98, agent.confidence + .015);
    agent.nextIntent = "use the next opening";
  } else if (kind === "safer") {
    agent.confidence = Math.min(.98, agent.confidence + .01);
    agent.nextIntent = "reduce risk through the next corners";
  } else if (kind === "alternative") {
    agent.lane = Math.max(-42, Math.min(42, -agent.lane));
    agent.challengeUntil = Math.min(agent.challengeUntil, elapsed + 500);
    agent.nextIntent = "switch line and rebuild speed";
  }

  agent.acknowledgement = `Received “${label}”. I’ll ${agent.nextIntent}.`;
  agent.acknowledgementUntil = elapsed + 5000;
  log(`Agent ${agent.id.toUpperCase()} acknowledged: ${label}`, agent.color);
}

function updateAgent(agent, rival, dt) {
  if (agent.finished) return;
  applyPendingNudge(agent);
  if (agent.activeNudge && elapsed >= agent.nudgeExpiresAt) {
    agent.activeNudge = null;
    agent.humanSignal = "incorporated";
  }
  if (!externalMode) localDecision(agent, rival);
  const drag = .000045 + agent.speed * .026;
  agent.speed += (agent.accel * agent.throttle - drag - agent.brake * .00016) * dt;
  agent.speed = Math.max(.000025, Math.min(.00057 + agent.burst, agent.speed));
  agent.burst *= .94;
  agent.progress += agent.speed * dt;
  if (agent.progress >= 1) {
    agent.progress -= 1;
    agent.lap += 1;
    log(`${agent.id.toUpperCase()} completed lap ${agent.lap}`, agent.color);
    if (agent.lap >= LAPS_TO_WIN) finish(agent);
  }
  if (Math.random() < .42) emitParticle(agent);
}

function finish(agent) {
  agent.finished = true;
  agent.finishTime = elapsed;
  agent.speed = 0;
  agent.decision = "finished";
  log(`Agent ${agent.id.toUpperCase()} finished in ${(elapsed / 1000).toFixed(2)}s`, agent.color);
  const other = agent.id === "a" ? agents.b : agents.a;
  if (!other.finished) countdown.textContent = `AGENT ${agent.id.toUpperCase()} WINS`;
}

function emitParticle(agent) {
  const p = pointOnTrack(agent.progress, agent.lane);
  particles.push({ x: p.x - Math.cos(p.angle) * 31, y: p.y - Math.sin(p.angle) * 31, vx: -Math.cos(p.angle) * (1 + Math.random() * 2), vy: -Math.sin(p.angle) * (1 + Math.random() * 2), life: 1, color: agent.color });
  if (particles.length > 260) particles.shift();
}

function draw() {
  if (draw3D()) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bg = ctx.createRadialGradient(800, 470, 40, 800, 470, 850);
  bg.addColorStop(0, "#11141a"); bg.addColorStop(.55, "#07090e"); bg.addColorStop(1, "#020305");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawStageLights();
  drawTrack();
  drawParticles();
  drawCar(agents.a);
  drawCar(agents.b);
}

function drawStageLights() {
  ctx.save(); ctx.globalAlpha = .17;
  for (let i = 0; i < 8; i++) {
    const x = 360 + i * 125;
    const g = ctx.createLinearGradient(x, 880, x + (i - 3.5) * 25, 360);
    g.addColorStop(0, "rgba(255,255,255,.7)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = g; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, 880); ctx.lineTo(x + (i - 3.5) * 25, 360); ctx.stroke();
  }
  ctx.restore();
}

function stadiumPath(rxOffset = 0, ryOffset = 0) {
  ctx.beginPath(); ctx.ellipse(track.cx, track.cy, track.rx + rxOffset, track.ry + ryOffset, 0, 0, TAU);
}

function drawTrack() {
  ctx.save();
  stadiumPath(track.width / 2 + 10, track.width / 2 * .6 + 10); ctx.strokeStyle = "rgba(255,30,52,.24)"; ctx.lineWidth = 28; ctx.shadowColor = "#ff2438"; ctx.shadowBlur = 35; ctx.stroke();
  stadiumPath(); ctx.strokeStyle = "#3a3d43"; ctx.lineWidth = track.width; ctx.shadowBlur = 0; ctx.stroke();
  stadiumPath(); ctx.strokeStyle = "rgba(255,255,255,.11)"; ctx.lineWidth = 2; ctx.setLineDash([30, 27]); ctx.stroke(); ctx.setLineDash([]);
  stadiumPath(track.width / 2 + 4, track.width / 2 * .6 + 4); ctx.strokeStyle = "#ff263d"; ctx.lineWidth = 6; ctx.shadowColor = "#ff263d"; ctx.shadowBlur = 18; ctx.stroke();
  stadiumPath(-track.width / 2 - 4, -track.width / 2 * .6 - 4); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fillRect(track.cx - 45, track.cy - track.ry - 82, 8, 164);
  ctx.fillStyle = "rgba(255,255,255,.19)"; ctx.font = "700 22px Inter, sans-serif"; ctx.textAlign = "center"; ctx.fillText("SHARED VISUAL ENVIRONMENT", track.cx, track.cy - 4);
  ctx.font = "15px Inter, sans-serif"; ctx.fillText("PERCEPTION  →  DECISION  →  ACTION  →  OBSERVATION", track.cx, track.cy + 24);
  ctx.restore();
}

function drawParticles() {
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy; p.life -= .025;
    ctx.globalAlpha = p.life * .5; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 3 + (1 - p.life) * 6, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCar(agent) {
  const p = pointOnTrack(agent.progress, agent.lane);
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
  ctx.shadowColor = agent.color; ctx.shadowBlur = 26;
  if (roadsterSprite.complete && roadsterSprite.naturalWidth) {
    const spriteSize = 128;
    ctx.drawImage(roadsterSprite, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);

    // Akari's source car is white, so a light team tint keeps both agents
    // distinguishable while preserving the model's materials and silhouette.
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = .2;
    ctx.fillStyle = agent.color;
    ctx.fillRect(-spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = agent.color;
    ctx.fillRect(-44, -18, 5, 36);
  } else {
    // Keep the race usable while the sprite is loading or if it is unavailable.
    ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(-34, -14, 74, 36);
    ctx.fillStyle = "#eef1f5";
    roundRect(ctx, -38, -18, 76, 36, 11); ctx.fill();
    ctx.fillStyle = "#101319"; roundRect(ctx, -8, -14, 27, 28, 7); ctx.fill();
    ctx.fillStyle = agent.color; ctx.fillRect(25, -13, 8, 26);
    ctx.fillRect(-32, -16, 13, 3); ctx.fillRect(-32, 13, 13, 3);
  }
  ctx.restore();
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
}

function updateHud() {
  for (const agent of Object.values(agents)) {
    const suffix = agent.id.toUpperCase();
    document.querySelector(`#lap${suffix}`).textContent = `${Math.min(agent.lap, LAPS_TO_WIN)} / ${LAPS_TO_WIN}`;
    document.querySelector(`#speed${suffix}`).textContent = `${Math.round(agent.speed * 470000)} km/h`;
    document.querySelector(`#decision${suffix}`).textContent = agent.decision;
    document.querySelector(`#intent${suffix}`).textContent = agent.nextIntent;
    document.querySelector(`#confidence${suffix}`).textContent = Math.min(.99, agent.confidence + agent.speed * 35).toFixed(2);
    document.querySelector(`#human${suffix}`).textContent = agent.pendingNudge ? `queued: ${agent.pendingNudge.label}` : agent.humanSignal;
    document.querySelector(`#status${suffix}`).textContent = agent.finished ? "FINISHED" : running ? (externalMode ? "EXTERNAL" : "AUTONOMOUS") : "READY";
    const acknowledgement = document.querySelector(`#ack${suffix}`);
    acknowledgement.textContent = elapsed < agent.acknowledgementUntil ? agent.acknowledgement : `Agent ${suffix} is working autonomously.`;
    acknowledgement.classList.toggle("received", elapsed < agent.acknowledgementUntil);
  }
}

function frame(now) {
  const dt = Math.min(32, now - lastTime); lastTime = now;
  if (running) {
    elapsed += dt;
    updateAgent(agents.a, agents.b, dt);
    updateAgent(agents.b, agents.a, dt);
    if (agents.a.finished && agents.b.finished) running = false;
  }
  draw(); updateHud(); requestAnimationFrame(frame);
}

async function startRace() {
  if (running) { running = false; startButton.textContent = "Resume race"; log("Race paused"); return; }
  if (agents.a.finished || agents.b.finished) resetRace();
  startButton.disabled = true;
  for (const value of ["3", "2", "1", "GO"]) {
    countdown.textContent = value; await new Promise(resolve => setTimeout(resolve, value === "GO" ? 550 : 650));
  }
  countdown.textContent = ""; running = true; startButton.disabled = false; startButton.textContent = "Pause race"; log(`Race started in ${externalMode ? "computer-use" : "local-agent"} mode`);
}

function resetRace() {
  Object.assign(agents.a, makeAgent("a", "#59dcff", -22, .94, .000112, .00007));
  Object.assign(agents.b, makeAgent("b", "#a985ff", 22, .91, .000108, .00009));
  particles = []; elapsed = 0; running = false; countdown.textContent = ""; startButton.textContent = "Start race"; log("Circuit reset");
}

function applyControl(agent, action) {
  if (!externalMode) return;
  agent.decision = action;
  if (action === "throttle") { agent.throttle = 1; agent.brake = 0; agent.burst = .00005; }
  if (action === "brake") { agent.brake = .9; agent.throttle = .15; }
  if (action === "left") agent.lane = Math.max(-45, agent.lane - 8);
  if (action === "right") agent.lane = Math.min(45, agent.lane + 8);
  log(`Agent ${agent.id.toUpperCase()}: ${action}`, agent.color);
}

function queueNudge(agent, kind) {
  const labels = { encourage: "Encourage", safer: "Drive safer", alternative: "Try another strategy" };
  const label = labels[kind];
  if (!label || agent.finished) return;
  agent.pendingNudge = { kind, label, queuedAt: elapsed };
  agent.humanSignal = `queued: ${label}`;
  agent.acknowledgement = `I heard “${label}”. I’ll apply it at the next safe moment.`;
  agent.acknowledgementUntil = elapsed + 5000;
  log(`Human → Agent ${agent.id.toUpperCase()}: ${label}`, agent.color);
}

function log(message, color = "#8994a5") {
  const item = document.createElement("li"); item.style.borderColor = color;
  item.innerHTML = `<time>${(elapsed / 1000).toFixed(1)}s</time>${message}`;
  eventLog.prepend(item); while (eventLog.children.length > 8) eventLog.lastChild.remove();
}

startButton.addEventListener("click", startRace);
resetButton.addEventListener("click", resetRace);
modeButton.addEventListener("click", () => {
  externalMode = !externalMode; modeButton.ariaPressed = String(externalMode);
  modeButton.textContent = `Mode: ${externalMode ? "computer use" : "local agents"}`;
  log(`Control mode changed to ${externalMode ? "computer use" : "local agents"}`);
});
launchAgentsButton.addEventListener("click", async () => {
  launchAgentsButton.disabled = true;
  apiNotice.className = "api-notice";
  apiNotice.textContent = "Creating two OpenAI-hosted computer-use sessions…";
  try {
    const response = await fetch("/api/agents/launch", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Launch failed (${response.status})`);
    externalMode = true;
    modeButton.textContent = "Mode: computer use";
    modeButton.ariaPressed = "true";
    apiNotice.className = "api-notice ready";
    apiNotice.textContent = `Created ${result.sessions.length} sessions. Waiting for origin approval.`;
    log(`OpenAI sessions: ${result.sessions.map(item => `${item.driver}:${item.id}`).join(" · ")}`);
  } catch (error) {
    apiNotice.className = "api-notice error";
    apiNotice.textContent = error.message;
  } finally {
    launchAgentsButton.disabled = false;
  }
});
document.querySelectorAll("[data-control]").forEach(button => button.addEventListener("click", () => {
  const [id, action] = button.dataset.control.split("-"); applyControl(agents[id], action);
}));
document.querySelectorAll("[data-nudge]").forEach(button => button.addEventListener("click", () => {
  const [id, kind] = button.dataset.nudge.split("-"); queueNudge(agents[id], kind);
}));

log("Prototype ready");
init3D();
fetch("/api/health")
  .then(response => response.json())
  .then(health => {
    if (!health.apiKeyConfigured) {
      apiNotice.className = "api-notice error";
      apiNotice.textContent = "OpenAI key is not configured on the server. Start with ./start-secure.sh.";
    } else if (!health.publicUrlConfigured) {
      apiNotice.className = "api-notice warn";
      apiNotice.textContent = "Secure key loaded. Set PUBLIC_PROTOTYPE_URL to enable hosted computer-use agents.";
    } else {
      apiNotice.className = "api-notice ready";
      apiNotice.textContent = `Agents API ready · ${health.model}`;
    }
  })
  .catch(() => {
    apiNotice.className = "api-notice error";
    apiNotice.textContent = "Use ./start-secure.sh instead of a static file server to enable Agents API.";
  });
requestAnimationFrame(frame);

