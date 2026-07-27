const TASKS_VISION_PATH = './vendor/tasks-vision';
const BUILD_ID = 'syllable-hands-v16';
const TARGET_WORD_BANK = [
  { word: 'BALA', parts: ['BA', 'LA'] },
  { word: 'BOLA', parts: ['BO', 'LA'] },
  { word: 'LOBO', parts: ['LO', 'BO'] },
  { word: 'BULO', parts: ['BU', 'LO'] },
  { word: 'BELA', parts: ['BE', 'LA'] },
  { word: 'BELO', parts: ['BE', 'LO'] },
  { word: 'BALO', parts: ['BA', 'LO'] },
  { word: 'BOLU', parts: ['BO', 'LU'] },
  { word: 'BULE', parts: ['BU', 'LE'] },
  { word: 'LUBA', parts: ['LU', 'BA'] },
  { word: 'LOBA', parts: ['LO', 'BA'] },
  { word: 'LOLA', parts: ['LO', 'LA'] },
  { word: 'LALO', parts: ['LA', 'LO'] },
  { word: 'LEBO', parts: ['LE', 'BO'] },
];
const FINGER_STABLE_MS = 260;
const SYLLABLE_FIX_MS = 950;
const FINGER_LOST_GRACE_MS = 320;
const CENTER_CAPTURE_SCALE = .68;
const TARGET_COLORS = ['#fde68a', '#bfdbfe', '#fecdd3', '#bbf7d0', '#ddd6fe'];

const HAND_CONNECTIONS_SIMPLE = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

const FINGERS = [
  { id: 'thumb', tip: 4, vowel: 'U' },
  { id: 'index', tip: 8, vowel: 'A' },
  { id: 'middle', tip: 12, vowel: 'E' },
  { id: 'ring', tip: 16, vowel: 'I' },
  { id: 'pinky', tip: 20, vowel: 'O' },
];
const FINGER_TIPS = FINGERS.map((finger) => finger.tip);
const FINGER_MCPS = {
  thumb: 2,
  index: 5,
  middle: 9,
  ring: 13,
  pinky: 17,
};

const stage = document.querySelector('#stage');
const video = document.querySelector('#camera');
const targetsLayer = document.querySelector('#syllableTargets');
const handsCanvas = document.querySelector('#handsLayer');
const handsCtx = handsCanvas.getContext('2d');
const cameraButton = document.querySelector('#cameraButton');
const joinCircle = document.querySelector('#joinCircle');
const joinText = document.querySelector('#joinText');
const targetWord = document.querySelector('#targetWord');

const state = {
  handLandmarker: null,
  sendingFrame: false,
  handEngine: 'none',
  framesSent: 0,
  handsSeen: 0,
  liveKeys: [],
  liveParts: [],
  visibleKeys: [],
  sideCandidateKeys: { left: '', right: '' },
  sideCandidateSince: { left: 0, right: 0 },
  stableSideKeys: { left: '', right: '' },
  lastSpokenVisible: '',
  lastSpokenWord: '',
  pendingWordTimer: 0,
  targetIndex: 0,
  targetQueue: [],
  speechQueue: [],
  speaking: false,
  speechWatchdog: 0,
  audioCtx: null,
  audioUnlocked: false,
  targets: [],
  targetState: new Map(),
  mappingMode: 'mirror',
};

function init() {
  state.targetQueue = shuffledTargets();
  targetWord.textContent = currentTarget().word;
  renderTargets();
  resizeStage();
  layoutFallbackTargets();
  bindEvents();
  window.addEventListener('resize', () => {
    resizeStage();
    layoutFallbackTargets();
  });
}

function bindEvents() {
  cameraButton.addEventListener('pointerdown', unlockAudio);
  cameraButton.addEventListener('click', startCamera);
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
  joinCircle.addEventListener('click', () => {
    const word = builtWord();
    if (word) speakWord(word, true);
  });
}

function renderTargets() {
  targetsLayer.innerHTML = '';
  state.targets = [];
  for (const side of ['left', 'right']) {
    const letter = side === 'left' ? 'B' : 'L';
    FINGERS.forEach((finger, index) => {
      const syllable = `${letter}${finger.vowel}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'syllable-card';
      button.dataset.side = side;
      button.dataset.finger = finger.id;
      button.dataset.key = `${side}:${finger.id}`;
      button.dataset.syllable = syllable;
      button.style.setProperty('--target-color', TARGET_COLORS[index]);
      button.innerHTML = `<strong>${syllable}</strong>`;
      button.addEventListener('pointerdown', () => toggleTouchTarget(button.dataset.key));
      targetsLayer.appendChild(button);
      state.targets.push({
        side,
        finger: finger.id,
        tip: finger.tip,
        key: button.dataset.key,
        syllable,
        element: button,
        x: 0,
        y: 0,
        rx: 78,
        ry: 66,
      });
      state.targetState.set(button.dataset.key, {
        candidate: false,
        candidateSince: 0,
        active: false,
        lostSince: 0,
        holdSince: 0,
        fixed: false,
        inCenterSince: 0,
      });
    });
  }
}

function resizeStage() {
  const rect = stage.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  handsCanvas.width = Math.max(1, Math.round(rect.width * dpr));
  handsCanvas.height = Math.max(1, Math.round(rect.height * dpr));
  handsCanvas.style.width = `${rect.width}px`;
  handsCanvas.style.height = `${rect.height}px`;
  handsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function layoutFallbackTargets() {
  if (stage.classList.contains('real-hand-active')) return;
  const rect = stage.getBoundingClientRect();
  const size = Math.round(clamp(rect.width * .07, 62, 96));
  const xSide = { left: rect.width * .32, right: rect.width * .68 };
  const positions = {
    thumb: { x: -size * 1.35, y: rect.height * .47 },
    index: { x: -size * .55, y: rect.height * .26 },
    middle: { x: 0, y: rect.height * .2 },
    ring: { x: size * .55, y: rect.height * .26 },
    pinky: { x: size * 1.2, y: rect.height * .38 },
  };
  for (const target of state.targets) {
    const p = positions[target.finger];
    target.x = xSide[target.side] + p.x;
    target.y = p.y;
    target.rx = size * .85;
    target.ry = size * .72;
    placeTarget(target, size);
  }
}

async function startCamera() {
  cameraButton.disabled = true;
  unlockAudio();
  try {
    await startRawCamera();
    stage.classList.add('camera-on');
    await tryStartTasksHandLandmarker();
  } catch (error) {
    cameraButton.disabled = false;
    stage.classList.remove('camera-on');
    console.error(error);
  }
}

async function startRawCamera() {
  if (video.srcObject) {
    await video.play();
    return;
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
  });
  video.srcObject = stream;
  await video.play();
}

async function tryStartTasksHandLandmarker() {
  const { FilesetResolver, HandLandmarker } = await import(`${TASKS_VISION_PATH}/vision_bundle.mjs`);
  const vision = await FilesetResolver.forVisionTasks(TASKS_VISION_PATH);
  state.handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `${TASKS_VISION_PATH}/hand_landmarker.task`,
      delegate: 'CPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: .35,
    minHandPresenceConfidence: .35,
    minTrackingConfidence: .35,
  });
  state.handEngine = 'tasks';
  pumpTasksFrames();
}

function pumpTasksFrames() {
  if (state.sendingFrame) return;
  state.sendingFrame = true;
  const send = () => {
    if (!state.handLandmarker || !video.srcObject) {
      state.sendingFrame = false;
      return;
    }
    if (video.readyState >= 2) {
      const results = state.handLandmarker.detectForVideo(video, performance.now());
      state.framesSent += 1;
      handleTaskResults(results);
    }
    requestAnimationFrame(send);
  };
  requestAnimationFrame(send);
}

function handleTaskResults(results) {
  const hands = results.landmarks || [];
  if (!hands.length) {
    clearHandLayer();
    stage.classList.remove('real-hand-active');
    resetStableFingers();
    clearDetectedTargets();
    return;
  }
  state.handsSeen += hands.length;
  const candidates = hands.map((landmarks) => {
    const mapped = landmarks.map((point) => landmarkToStagePoint(point));
    return { landmarks, mapped, side: getScreenSide(mapped), palm: getPalmCenter(mapped) };
  });
  const handsBySide = chooseHandsBySide(candidates);
  stage.classList.add('real-hand-active');
  updateTargetsFromHands(handsBySide);
  drawAllHands(Object.values(handsBySide));
  processLiveFingers(handsBySide);
}

function chooseHandsBySide(candidates) {
  const result = {};
  for (const hand of candidates) {
    const current = result[hand.side];
    if (!current || handBoxArea(hand.mapped) > handBoxArea(current.mapped)) result[hand.side] = hand;
  }
  return result;
}

function updateTargetsFromHands(handsBySide) {
  const rect = stage.getBoundingClientRect();
  const size = Math.round(clamp(rect.width * .07, 62, 102));
  for (const target of state.targets) {
    const hand = handsBySide[target.side];
    if (!hand) {
      target.element.classList.remove('finger-up');
      continue;
    }
    const tip = hand.mapped[target.tip];
    const outX = tip.x - hand.palm.x;
    const outY = tip.y - hand.palm.y;
    const len = Math.max(1, Math.hypot(outX, outY));
    target.x = clamp(tip.x + (outX / len) * size * .22, size * .55, rect.width - size * .55);
    target.y = clamp(tip.y + (outY / len) * size * .22, size * .55, rect.height - size * .55);
    target.rx = size * .85;
    target.ry = size * .72;
    placeTarget(target, size);
  }
}

function processLiveFingers(handsBySide) {
  const now = performance.now();
  const visibleTargets = [];
  for (const side of ['left', 'right']) {
    const hand = handsBySide[side];
    const raised = hand ? new Set(getRaisedFingerScores(hand.landmarks).map((finger) => finger.id)) : new Set();
    for (const target of state.targets.filter((item) => item.side === side)) {
      const detected = raised.has(target.finger) && fingerOutsidePalm(hand, target);
      const active = updateStableTarget(target, detected, now);
      target.element.classList.toggle('finger-up', active);
      if (active) visibleTargets.push(target);
    }
  }
  updateFixedSyllables(visibleTargets, now);
  updateJoinCircle();
}

function updateJoinCircle() {
  const word = builtWord();
  const target = currentTarget();
  const ready = word === target.word;
  joinCircle.classList.toggle('ready', ready);
  joinCircle.classList.toggle('partial', Boolean(word) && !ready);
  joinText.textContent = word || '+';
  if (ready && state.lastSpokenWord !== word && !state.pendingWordTimer) {
    state.pendingWordTimer = window.setTimeout(() => {
      state.pendingWordTimer = 0;
      if (builtWord() !== currentTarget().word || state.lastSpokenWord === currentTarget().word) return;
      state.lastSpokenWord = currentTarget().word;
      triggerFusionEffect();
      speakWord(currentTarget().word, true);
      window.setTimeout(advanceTargetWord, 1050);
    }, 430);
  }
  if (!ready && state.pendingWordTimer) {
    clearTimeout(state.pendingWordTimer);
    state.pendingWordTimer = 0;
  }
}

function announceVisible(visibleTargets) {
  state.visibleKeys = visibleTargets.map((target) => target.key);
  const signature = state.visibleKeys.join('|');
  if (signature === state.lastSpokenVisible) return;
  state.lastSpokenVisible = signature;
}

function toggleTouchTarget(key) {
  const target = state.targets.find((item) => item.key === key);
  if (!target) return;
  const wasActive = target.element.classList.contains('finger-up');
  target.element.classList.toggle('finger-up', !wasActive);
  const visibleTargets = state.targets.filter((item) => item.element.classList.contains('finger-up'));
  if (!wasActive && target.syllable === nextNeededPart()) lockTarget(target);
  updateFixedSyllables(visibleTargets, performance.now());
  updateJoinCircle();
}

function setLiveTargets(liveTargets) {
  state.liveKeys = liveTargets.map((target) => target.key);
  state.liveParts = liveTargets.map((target) => target.syllable);
  if (builtWord() !== currentTarget().word) state.lastSpokenWord = '';
  if (builtWord() !== currentTarget().word && state.pendingWordTimer) {
    clearTimeout(state.pendingWordTimer);
    state.pendingWordTimer = 0;
  }
}

function clearDetectedTargets() {
  state.visibleKeys = [];
  state.lastSpokenVisible = '';
  for (const target of state.targets) {
    const targetState = state.targetState.get(target.key);
    if (targetState) {
      targetState.candidate = false;
      targetState.active = false;
      targetState.candidateSince = 0;
      targetState.lostSince = 0;
      targetState.holdSince = 0;
    }
    target.element.classList.remove('finger-up');
  }
}

function clearAllTargets() {
  clearDetectedTargets();
  for (const targetState of state.targetState.values()) targetState.fixed = false;
  setLiveTargets([]);
}

function builtWord() {
  return state.liveParts.join('');
}

function currentTarget() {
  if (!state.targetQueue.length) state.targetQueue = shuffledTargets();
  return state.targetQueue[state.targetIndex % state.targetQueue.length];
}

function chooseWordTargets(visibleTargets) {
  const result = [];
  const usedKeys = new Set();
  for (const part of currentTarget().parts) {
    const target = visibleTargets.find((item) => item.syllable === part && !usedKeys.has(item.key));
    if (!target) continue;
    result.push(target);
    usedKeys.add(target.key);
  }
  return result;
}

function nextNeededPart() {
  return currentTarget().parts[state.liveParts.length] || '';
}

function updateFixedSyllables(visibleTargets, now) {
  const visibleKeys = new Set(visibleTargets.map((target) => target.key));
  const nextPart = nextNeededPart();
  for (const target of state.targets) {
    const targetState = state.targetState.get(target.key);
    if (!targetState || targetState.fixed) continue;
    const canHold = visibleKeys.has(target.key) && target.syllable === nextPart && targetInJoinCircle(target);
    if (!canHold) {
      targetState.holdSince = 0;
      targetState.inCenterSince = 0;
      continue;
    }
    if (!targetState.holdSince) targetState.holdSince = now;
    if (!targetState.inCenterSince) targetState.inCenterSince = now;
    if (now - targetState.holdSince >= SYLLABLE_FIX_MS) lockTarget(target);
  }
}

function lockTarget(target) {
  if (!target || state.liveKeys.includes(target.key) || target.syllable !== nextNeededPart()) return;
  const targetState = state.targetState.get(target.key);
  if (targetState) {
    targetState.fixed = true;
    targetState.holdSince = 0;
    targetState.inCenterSince = 0;
  }
  setLiveTargets([...state.liveKeys.map((key) => state.targets.find((item) => item.key === key)).filter(Boolean), target]);
  speakSyllable(target.syllable);
}

function updateStableTarget(target, detected, now) {
  const targetState = state.targetState.get(target.key);
  if (!targetState) return detected;
  if (detected) {
    if (!targetState.candidate) {
      targetState.candidate = true;
      targetState.candidateSince = now;
    }
    targetState.lostSince = 0;
    if (!targetState.active && now - targetState.candidateSince >= FINGER_STABLE_MS) {
      targetState.active = true;
    }
    return targetState.active;
  }
  targetState.candidate = false;
  targetState.candidateSince = 0;
  if (targetState.active) {
    if (!targetState.lostSince) targetState.lostSince = now;
    if (now - targetState.lostSince >= FINGER_LOST_GRACE_MS) {
      targetState.active = false;
      targetState.lostSince = 0;
    }
  }
  return targetState.active;
}

function targetInJoinCircle(target) {
  const rect = joinCircle.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  const centerX = rect.left - stageRect.left + rect.width / 2;
  const centerY = rect.top - stageRect.top + rect.height / 2;
  const radius = Math.min(rect.width, rect.height) * CENTER_CAPTURE_SCALE;
  return Math.hypot(target.x - centerX, target.y - centerY) <= radius;
}

function fingerOutsidePalm(hand, target) {
  if (!hand) return false;
  const tip = hand.mapped[target.tip];
  const mcp = hand.mapped[FINGER_MCPS[target.finger]];
  if (!tip || !mcp || !hand.palm) return false;
  const tipFromPalm = Math.hypot(tip.x - hand.palm.x, tip.y - hand.palm.y);
  const mcpFromPalm = Math.hypot(mcp.x - hand.palm.x, mcp.y - hand.palm.y);
  if (target.finger === 'thumb') return tipFromPalm > Math.max(30, mcpFromPalm * 1.04);
  return tipFromPalm > Math.max(46, mcpFromPalm * 1.22);
}

function advanceTargetWord() {
  if (builtWord() !== currentTarget().word) return;
  state.targetIndex += 1;
  if (state.targetIndex >= state.targetQueue.length) {
    state.targetQueue = shuffledTargets();
    state.targetIndex = 0;
  }
  state.lastSpokenWord = '';
  targetWord.textContent = currentTarget().word;
  clearAllTargets();
  updateJoinCircle();
}

function shuffledTargets() {
  const list = [...TARGET_WORD_BANK];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function findTarget(side, finger) {
  return state.targets.find((target) => target.side === side && target.finger === finger);
}

function resetStableFingers() {
  state.sideCandidateKeys = { left: '', right: '' };
  state.sideCandidateSince = { left: 0, right: 0 };
  state.stableSideKeys = { left: '', right: '' };
}

function placeTarget(target, size) {
  target.element.style.left = `${target.x}px`;
  target.element.style.top = `${target.y}px`;
  target.element.style.setProperty('--target-size', `${size}px`);
}

function getScreenSide(mapped) {
  return getPalmCenter(mapped).x < stage.clientWidth / 2 ? 'left' : 'right';
}

function getRaisedFingerScores(landmarks) {
  const palm = averagePoint([landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]]);
  const wrist = landmarks[0];
  const raised = [];
  const specs = {
    thumb: { mcp: 2, pip: 3, dip: 3, tip: 4, ratio: 1, angle: 104, palm: 1.04, bias: .08 },
    index: { mcp: 5, pip: 6, dip: 7, tip: 8, ratio: 1.04, angle: 132, palm: 1.34, bias: .02 },
    middle: { mcp: 9, pip: 10, dip: 11, tip: 12, ratio: 1.04, angle: 132, palm: 1.34, bias: 0 },
    ring: { mcp: 13, pip: 14, dip: 15, tip: 16, ratio: 1.05, angle: 132, palm: 1.38, bias: -.08 },
    pinky: { mcp: 17, pip: 18, dip: 19, tip: 20, ratio: 1.05, angle: 128, palm: 1.28, bias: -.04 },
  };
  for (const finger of FINGERS) {
    const spec = specs[finger.id];
    const mcp = landmarks[spec.mcp];
    const pip = landmarks[spec.pip];
    const dip = landmarks[spec.dip];
    const tip = landmarks[spec.tip];
    const tipFromWrist = distance2d(tip, wrist);
    const pipFromWrist = distance2d(pip, wrist);
    const mcpFromWrist = distance2d(mcp, wrist);
    const tipFromPalm = distance2d(tip, palm);
    const pipFromPalm = distance2d(pip, palm);
    const dipFromPalm = distance2d(dip, palm);
    const mcpFromPalm = distance2d(mcp, palm);
    const pipAngle = angleDegrees(mcp, pip, tip);
    const dipAngle = finger.id === 'thumb' ? pipAngle : angleDegrees(pip, dip, tip);
    if (finger.id === 'thumb') {
      const indexMcp = landmarks[5];
      const thumbSpread = distance2d(tip, indexMcp) / Math.max(.0001, distance2d(mcp, indexMcp));
      const thumbAway = tipFromPalm > mcpFromPalm * 1.04 && tipFromWrist > mcpFromWrist * .88;
      const thumbOpen = thumbSpread > 1.12 || pipAngle >= spec.angle;
      const score = clamp(thumbSpread - .95, 0, .8) * 1.6
        + clamp(tipFromPalm / Math.max(.0001, mcpFromPalm) - 1, 0, .7)
        + clamp((pipAngle - 82) / 64, 0, 1)
        + spec.bias;
      if (thumbAway && thumbOpen && score >= .92) raised.push({ id: finger.id, score });
      continue;
    }
    const extension = tipFromWrist / Math.max(.0001, pipFromWrist * spec.ratio);
    const palmExtension = tipFromPalm / Math.max(.0001, mcpFromPalm * 1.02);
    const fartherThanJoint = extension > 1.05 && palmExtension > spec.palm;
    const awayFromWrist = tipFromWrist > mcpFromWrist * .98;
    const awayFromPalm = tipFromPalm > pipFromPalm * 1.08 && tipFromPalm > dipFromPalm * 1.04;
    const straightEnough = pipAngle >= spec.angle && dipAngle >= 132;
    const score = (
      clamp(extension - .98, 0, .45) * 2.4
      + clamp(palmExtension - .98, 0, .5) * 1.7
      + clamp((pipAngle - 95) / 75, 0, 1)
      + clamp((dipAngle - 108) / 62, 0, 1) * .7
      + spec.bias
    );
    if (fartherThanJoint && awayFromWrist && awayFromPalm && straightEnough && score >= 1.5) {
      raised.push({ id: finger.id, score });
    }
  }
  return raised;
}

function drawAllHands(hands) {
  clearHandLayer();
  handsCtx.save();
  handsCtx.lineCap = 'round';
  handsCtx.lineJoin = 'round';
  for (const hand of hands) drawHandLandmarks(hand.mapped);
  handsCtx.restore();
}

function drawHandLandmarks(mapped) {
  handsCtx.lineWidth = 7;
  handsCtx.strokeStyle = 'rgba(255, 255, 255, .86)';
  for (const [from, to] of HAND_CONNECTIONS_SIMPLE) drawConnection(mapped[from], mapped[to]);
  handsCtx.lineWidth = 3.5;
  handsCtx.strokeStyle = 'rgba(37, 99, 235, .92)';
  for (const [from, to] of HAND_CONNECTIONS_SIMPLE) drawConnection(mapped[from], mapped[to]);
  for (const [index, point] of mapped.entries()) {
    const isTip = FINGER_TIPS.includes(index);
    const isPalm = [0, 5, 9, 13, 17].includes(index);
    handsCtx.fillStyle = isPalm ? '#facc15' : '#ffffff';
    handsCtx.strokeStyle = isTip ? '#fb7185' : '#2563eb';
    handsCtx.lineWidth = isPalm ? 4 : 3;
    handsCtx.beginPath();
    handsCtx.arc(point.x, point.y, isTip ? 7 : (isPalm ? 8 : 5), 0, Math.PI * 2);
    handsCtx.fill();
    handsCtx.stroke();
  }
}

function drawConnection(a, b) {
  if (!a || !b) return;
  handsCtx.beginPath();
  handsCtx.moveTo(a.x, a.y);
  handsCtx.lineTo(b.x, b.y);
  handsCtx.stroke();
}

function clearHandLayer() {
  const rect = stage.getBoundingClientRect();
  handsCtx.clearRect(0, 0, rect.width, rect.height);
}

function landmarkToStagePoint(point) {
  const rect = stage.getBoundingClientRect();
  const x = state.mappingMode === 'mirror' ? 1 - point.x : point.x;
  return { x: clamp(x * rect.width, 0, rect.width), y: clamp(point.y * rect.height, 0, rect.height), z: point.z || 0 };
}

function getPalmCenter(mapped) {
  const points = [0, 5, 9, 13, 17].map((index) => mapped[index]).filter(Boolean);
  return { x: average(points.map((p) => p.x)), y: average(points.map((p) => p.y)) };
}

function averagePoint(points) {
  return {
    x: average(points.map((p) => p.x)),
    y: average(points.map((p) => p.y)),
    z: average(points.map((p) => p.z || 0)),
  };
}

function handBoxArea(mapped) {
  const xs = mapped.map((p) => p.x);
  const ys = mapped.map((p) => p.y);
  return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
}

function speakSyllable(text) {
  speak(pronounceable(text), 'syllable', false);
}

function speakWord(text, withJoinSound = false) {
  speak(pronounceable(text), 'word', withJoinSound);
}

function pronounceable(text) {
  return String(text || '').toLocaleLowerCase('es-ES');
}

function unlockAudio() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && !state.audioCtx) state.audioCtx = new AudioContext();
    state.audioCtx?.resume?.();
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const warmup = new SpeechSynthesisUtterance(' ');
      warmup.lang = 'es-ES';
      warmup.volume = 0;
      window.speechSynthesis.speak(warmup);
      window.setTimeout(() => window.speechSynthesis.resume?.(), 120);
    }
    state.audioUnlocked = true;
  } catch {
    state.audioUnlocked = false;
  }
}

function speak(text, kind, withJoinSound) {
  try {
    if (!text) return;
    state.audioCtx?.resume?.();
    if (withJoinSound) {
      playJoinSound();
    } else if (kind === 'syllable') {
      playBeep(480, .055);
    }
    if (!window.speechSynthesis) return;
    window.speechSynthesis.resume?.();
    if (kind === 'word') {
      state.speechQueue = [];
      clearTimeout(state.speechWatchdog);
      window.speechSynthesis.cancel();
      state.speaking = false;
    }
    state.speechQueue.push({ text, kind });
    drainSpeechQueue();
  } catch {
    playBeep(kind === 'word' ? 660 : 480, .08);
  }
}

function drainSpeechQueue() {
  if (state.speaking || !state.speechQueue.length || !window.speechSynthesis) return;
  window.speechSynthesis.resume?.();
  state.speaking = true;
  const item = state.speechQueue.shift();
  const utterance = new SpeechSynthesisUtterance(item.text);
  utterance.lang = 'es-ES';
  utterance.rate = item.kind === 'word' ? .82 : .76;
  utterance.pitch = item.kind === 'word' ? 1.34 : 1.42;
  utterance.volume = 1;
  const voice = preferredChildVoice();
  if (voice) utterance.voice = voice;
  utterance.onend = () => {
    clearTimeout(state.speechWatchdog);
    state.speaking = false;
    window.setTimeout(drainSpeechQueue, 45);
  };
  utterance.onerror = () => {
    clearTimeout(state.speechWatchdog);
    state.speaking = false;
    window.setTimeout(drainSpeechQueue, 45);
  };
  window.speechSynthesis.speak(utterance);
  state.speechWatchdog = window.setTimeout(() => {
    state.speaking = false;
    window.speechSynthesis.cancel();
    drainSpeechQueue();
  }, item.kind === 'word' ? 1600 : 950);
}

function preferredChildVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const spanish = voices.filter((voice) => voice.lang?.toLowerCase().startsWith('es'));
  const preferredNames = ['monica', 'mónica', 'paulina', 'lucia', 'lucía', 'marisol', 'google español', 'google español de españa'];
  return spanish.find((voice) => preferredNames.some((name) => voice.name.toLowerCase().includes(name)))
    || spanish.find((voice) => voice.lang?.toLowerCase() === 'es-es')
    || spanish[0]
    || null;
}

function playJoinSound() {
  playBeep(740, .075);
  window.setTimeout(() => playBeep(980, .105), 82);
}

function triggerFusionEffect() {
  joinCircle.classList.remove('fuse-effect');
  void joinCircle.offsetWidth;
  joinCircle.classList.add('fuse-effect');
}

function playBeep(freq, duration) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!state.audioCtx) state.audioCtx = new AudioContext();
    state.audioCtx.resume?.();
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(.0001, state.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.08, state.audioCtx.currentTime + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, state.audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc.start();
    osc.stop(state.audioCtx.currentTime + duration + .02);
  } catch {
    // Audio is optional.
  }
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function distance2d(a, b) {
  return Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));
}

function angleDegrees(a, b, c) {
  const abx = (a?.x || 0) - (b?.x || 0);
  const aby = (a?.y || 0) - (b?.y || 0);
  const cbx = (c?.x || 0) - (b?.x || 0);
  const cby = (c?.y || 0) - (b?.y || 0);
  const dot = abx * cbx + aby * cby;
  const len = Math.max(.0001, Math.hypot(abx, aby) * Math.hypot(cbx, cby));
  return Math.acos(clamp(dot / len, -1, 1)) * 180 / Math.PI;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

init();
