import * as Tone from 'tone'

const STEP_ROOTS = {
  world: ['C3', 'G3', 'D4', 'A4'],
  inside: ['A2', 'E3', 'C4', 'G4'],
  supports: ['F3', 'C4', 'G4', 'A4'],
  missing: ['D3', 'A3', 'E4', 'B4'],
  star: ['G3', 'D4', 'A4', 'E5'],
}

const EMOJI_SONIC_SIGNATURES = {
  anger: { degree: 1, color: 'ember', texture: 0.9 },
  fear: { degree: 5, color: 'mist', texture: 0.75 },
  sad: { degree: 3, color: 'rain', texture: 0.45 },
  empty: { degree: 0, color: 'air', texture: 0.25 },
  joy: { degree: 7, color: 'glow', texture: 0.35 },
  tension: { degree: 6, color: 'storm', texture: 0.85 },
  worry: { degree: 2, color: 'mist', texture: 0.65 },
  peace: { degree: 4, color: 'water', texture: 0.2 },
  shame: { degree: 8, color: 'shadow', texture: 0.55 },
  guilt: { degree: 10, color: 'metal', texture: 0.6 },
  tired: { degree: -5, color: 'haze', texture: 0.3 },
  excited: { degree: 12, color: 'spark', texture: 0.7 },
  music: { degree: 7, color: 'glow', texture: 0.15 },
  nature: { degree: 4, color: 'water', texture: 0.1 },
  meditation: { degree: 0, color: 'air', texture: 0.08 },
  support: { degree: 5, color: 'warm', texture: 0.18 },
  talk: { degree: 9, color: 'warm', texture: 0.35 },
  write: { degree: 2, color: 'paper', texture: 0.32 },
  game: { degree: 11, color: 'spark', texture: 0.45 },
  creativity: { degree: 9, color: 'glow', texture: 0.28 },
  pet: { degree: 4, color: 'warm', texture: 0.12 },
  sport: { degree: 12, color: 'ember', texture: 0.4 },
  dream: { degree: 14, color: 'mist', texture: 0.22 },
  calm: { degree: 0, color: 'air', texture: 0.08 },
  hope: { degree: 7, color: 'glow', texture: 0.15 },
  comfort: { degree: 5, color: 'warm', texture: 0.1 },
  safety: { degree: -5, color: 'warm', texture: 0.12 },
  love: { degree: 12, color: 'warm', texture: 0.18 },
}

const LANDSCAPE_COLORS = {
  air: { filter: 2500, reverb: 0.42, chorus: 0.16 },
  ember: { filter: 3600, reverb: 0.34, chorus: 0.22 },
  glow: { filter: 4200, reverb: 0.48, chorus: 0.28 },
  haze: { filter: 1700, reverb: 0.55, chorus: 0.2 },
  metal: { filter: 3000, reverb: 0.38, chorus: 0.14 },
  mist: { filter: 2200, reverb: 0.58, chorus: 0.3 },
  paper: { filter: 2700, reverb: 0.36, chorus: 0.18 },
  rain: { filter: 1900, reverb: 0.62, chorus: 0.24 },
  shadow: { filter: 1500, reverb: 0.5, chorus: 0.12 },
  spark: { filter: 4600, reverb: 0.44, chorus: 0.32 },
  storm: { filter: 3300, reverb: 0.46, chorus: 0.26 },
  warm: { filter: 2800, reverb: 0.4, chorus: 0.2 },
  water: { filter: 2400, reverb: 0.66, chorus: 0.34 },
}

const BELL_NOTES = ['C5', 'D5', 'E5', 'G5', 'A5', 'B5', 'D6', 'E6']
const LEVEL_GAIN = [0, -32, -27, -23]

let initialized = false
let playing = false
let currentDroneNotes = []
let currentPulseNotes = BELL_NOTES
let masterVolume
let globalFilter
let chorus
let delay
let reverb
let shimmer
let drone
let bells
let pad
let climate
let climateFilter
let bass
let droneLoop
let bellLoop
let shimmerLoop
let climateLoop
let bassLoop
let activeAnswers = {}
let activeStep = null

function getSafeNow(offset = 0) {
  if (!initialized) return 0
  return Tone.now() + offset
}

function disposePart(part) {
  if (!part) return null
  part.stop()
  part.dispose()
  return null
}

function getSelectedIds(answers = {}) {
  const selected = Object.entries(answers)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .map(([id]) => id)

  if (typeof answers.star === 'string') selected.push(answers.star)
  return [...new Set(selected)]
}

function getLevelForId(answers, id) {
  if (answers.star === id) return 3
  return Math.max(1, Math.min(3, answers[id] || 1))
}

function getSignature(id) {
  if (EMOJI_SONIC_SIGNATURES[id]) return EMOJI_SONIC_SIGNATURES[id]
  const hash = String(id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return { degree: hash % 15, color: ['air', 'warm', 'mist', 'glow'][hash % 4], texture: 0.22 + (hash % 5) * 0.1 }
}

function getDroneNotes(answers = {}, currentStep) {
  const baseNotes = STEP_ROOTS[currentStep?.id || currentStep] || STEP_ROOTS.world
  const selectedIds = getSelectedIds(answers)
  const noteCount = Math.max(2, Math.min(5, 2 + Math.floor(selectedIds.length / 3)))
  const emotionalNotes = selectedIds.slice(0, 4).map(id => Tone.Frequency(baseNotes[0]).transpose(getSignature(id).degree).toNote())

  return [...new Set(baseNotes.concat(emotionalNotes))].slice(0, noteCount)
}

function getPulseNotes(answers = {}, currentStep) {
  const root = (STEP_ROOTS[currentStep?.id || currentStep] || STEP_ROOTS.world)[0]
  const selectedIds = getSelectedIds(answers)
  const notes = selectedIds.map(id => Tone.Frequency(root).transpose(24 + getSignature(id).degree).toNote())
  return notes.length ? notes : BELL_NOTES
}

function getDominantColor(selectedIds) {
  if (!selectedIds.length) return LANDSCAPE_COLORS.air
  const colorScores = selectedIds.reduce((scores, id) => {
    const { color, texture } = getSignature(id)
    scores[color] = (scores[color] || 0) + 1 + texture
    return scores
  }, {})
  const color = Object.entries(colorScores).sort((a, b) => b[1] - a[1])[0][0]
  return LANDSCAPE_COLORS[color]
}

function rampVolume(node, value, duration = 1.8) {
  if (!node?.volume) return
  node.volume.rampTo(value, duration)
}

function createEffectsChain() {
  masterVolume = new Tone.Volume(-18).toDestination()
  globalFilter = new Tone.Filter({ frequency: 2800, type: 'lowpass', rolloff: -12, Q: 0.55 })
  chorus = new Tone.Chorus({ frequency: 0.028, delayTime: 6, depth: 0.45, feedback: 0.05, wet: 0.22 }).start()
  delay = new Tone.PingPongDelay({ delayTime: '4n.', feedback: 0.22, wet: 0.16 })
  reverb = new Tone.Reverb({ decay: 14, preDelay: 0.12, wet: 0.42 })

  globalFilter.chain(chorus, delay, reverb, masterVolume)
}

function createInstruments() {
  drone = new Tone.PolySynth(Tone.DuoSynth, {
    volume: -32,
    voice0: { oscillator: { type: 'sine' }, envelope: { attack: 4.8, decay: 1.8, sustain: 0.74, release: 7.5 } },
    voice1: { oscillator: { type: 'triangle' }, envelope: { attack: 5.2, decay: 2, sustain: 0.5, release: 8 } },
    harmonicity: 1.005,
    vibratoAmount: 0.035,
    vibratoRate: 0.09,
  }).connect(globalFilter)

  pad = new Tone.PolySynth(Tone.AMSynth, {
    volume: -38,
    harmonicity: 1.5,
    oscillator: { type: 'sine' },
    envelope: { attack: 3, decay: 1.5, sustain: 0.36, release: 5.5 },
    modulation: { type: 'sine' },
    modulationEnvelope: { attack: 2, decay: 1, sustain: 0.2, release: 4 },
  }).connect(globalFilter)

  bells = new Tone.FMSynth({
    volume: -29,
    harmonicity: 2.8,
    modulationIndex: 5.5,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.08, decay: 1.7, sustain: 0.03, release: 3.2 },
    modulation: { type: 'sine' },
    modulationEnvelope: { attack: 0.12, decay: 1.1, sustain: 0.02, release: 2.2 },
  }).connect(globalFilter)

  shimmer = new Tone.MetalSynth({ volume: -43, frequency: 180, envelope: { attack: 0.8, decay: 2.4, release: 3.5 }, harmonicity: 5.1, modulationIndex: 8, resonance: 2400, octaves: 1.4 }).connect(globalFilter)

  climate = new Tone.NoiseSynth({ volume: -44, noise: { type: 'pink' }, envelope: { attack: 3.5, decay: 2.2, sustain: 0.28, release: 5.5 } })
  climateFilter = new Tone.Filter({ frequency: 900, type: 'bandpass', Q: 0.42 })
  climate.chain(climateFilter, globalFilter)

  bass = new Tone.MonoSynth({
    volume: -36,
    oscillator: { type: 'sine' },
    filter: { frequency: 260, type: 'lowpass', rolloff: -24 },
    envelope: { attack: 1.4, decay: 1.2, sustain: 0.34, release: 4.5 },
    filterEnvelope: { attack: 1.4, decay: 1, sustain: 0.2, release: 3, baseFrequency: 62, octaves: 1.2 },
  }).connect(globalFilter)
}

function createLoops() {
  droneLoop = new Tone.Loop(time => {
    if (!playing || currentDroneNotes.length === 0) return
    drone.triggerAttackRelease(currentDroneNotes, '2m', time, 0.2)
    pad.triggerAttackRelease(currentDroneNotes.slice(-3), '1m', time + 0.35, 0.08)
  }, '2m')

  bellLoop = new Tone.Loop(time => {
    if (!playing) return
    const selectedIds = getSelectedIds(activeAnswers)
    if (selectedIds.length === 0) return
    const id = selectedIds[Math.floor(Math.random() * selectedIds.length)]
    const level = getLevelForId(activeAnswers, id)
    const note = currentPulseNotes[(id.length + level + selectedIds.length) % currentPulseNotes.length]
    bells.triggerAttackRelease(note, '8n', time, 0.07 + level * 0.035)
  }, '1m')

  shimmerLoop = new Tone.Loop(time => {
    if (!playing || getSelectedIds(activeAnswers).length < 2) return
    shimmer.triggerAttackRelease('2n', time, 0.025)
  }, '2m')

  climateLoop = new Tone.Loop(time => {
    if (!playing) return
    climate.triggerAttackRelease('2m', time, 0.075)
  }, '3m')

  bassLoop = new Tone.Loop(time => {
    if (!playing) return
    const note = activeStep === 'inside' ? 'A1' : activeStep === 'missing' ? 'D2' : activeStep === 'supports' ? 'F1' : 'C2'
    bass.triggerAttackRelease(note, '1m', time, 0.13)
  }, '4m')
}

export async function initAudio() {
  if (initialized) return true
  await Tone.start()
  Tone.Transport.bpm.value = 50
  Tone.Transport.swing = 0.12
  createEffectsChain()
  createInstruments()
  createLoops()
  initialized = true
  return true
}

export async function startSound() {
  await initAudio()
  if (playing) return
  playing = true
  rampVolume(masterVolume, -18, 2.8)
  rampVolume(drone, -31, 3.2)
  rampVolume(pad, -39, 3)
  rampVolume(bells, -30, 2)
  rampVolume(shimmer, -44, 3)
  rampVolume(climate, -44, 3)
  rampVolume(bass, -36, 3)
  droneLoop.start(0)
  bellLoop.start('0:2:0')
  shimmerLoop.start('1m')
  climateLoop.start('0:1:0')
  bassLoop.start('1m')
  if (Tone.Transport.state !== 'started') Tone.Transport.start('+0.15')
}

export function stopSound() {
  if (!initialized || !playing) return
  playing = false
  rampVolume(masterVolume, -48, 2.4)
  drone.releaseAll(getSafeNow(0.05))
  pad.releaseAll(getSafeNow(0.05))
  setTimeout(() => {
    if (playing) return
    droneLoop?.stop()
    bellLoop?.stop()
    shimmerLoop?.stop()
    climateLoop?.stop()
    bassLoop?.stop()
  }, 2500)
}

export function updateSoundFromAnswers(answers = {}, currentStep = null) {
  activeAnswers = { ...answers }
  activeStep = currentStep?.id || currentStep || null
  currentDroneNotes = getDroneNotes(activeAnswers, currentStep)
  currentPulseNotes = getPulseNotes(activeAnswers, currentStep)
  if (!initialized) return

  const selectedIds = getSelectedIds(activeAnswers)
  const intensity = selectedIds.reduce((total, id) => total + getLevelForId(activeAnswers, id), 0)
  const averageLevel = selectedIds.length ? intensity / selectedIds.length : 0
  const texture = selectedIds.reduce((total, id) => total + getSignature(id).texture, 0) / Math.max(1, selectedIds.length)
  const landscape = getDominantColor(selectedIds)

  globalFilter.frequency.rampTo(landscape.filter + Math.min(1400, intensity * 90), 3)
  reverb.wet.rampTo(Math.min(0.72, landscape.reverb + selectedIds.length * 0.012), 3.5)
  chorus.wet.rampTo(Math.min(0.42, landscape.chorus + texture * 0.08), 3)
  delay.feedback.rampTo(Math.min(0.34, 0.16 + selectedIds.length * 0.015), 3)
  climateFilter.frequency.rampTo(650 + texture * 1450 + averageLevel * 120, 3)

  rampVolume(drone, -34 + Math.min(7, selectedIds.length * 0.55), 2.8)
  rampVolume(pad, -42 + Math.min(8, selectedIds.length * 0.55 + averageLevel), 2.8)
  rampVolume(climate, -47 + Math.min(8, averageLevel * 1.8 + texture * 2), 2.8)
  rampVolume(shimmer, -47 + Math.min(8, selectedIds.length * 0.55), 2.8)
  rampVolume(bass, -38 + Math.min(5, averageLevel * 1.4), 2.8)
}

export function triggerEmojiPulse(id, level = 1) {
  if (!initialized || !playing) return
  const safeLevel = Math.max(1, Math.min(3, Number(level) || 1))
  const signature = getSignature(id)
  const root = (STEP_ROOTS[activeStep] || STEP_ROOTS.world)[0]
  const note = Tone.Frequency(root).transpose(24 + signature.degree).toNote()
  const harmony = Tone.Frequency(note).transpose(safeLevel === 3 ? 12 : 7).toNote()
  const now = getSafeNow(0.03)

  rampVolume(bells, LEVEL_GAIN[safeLevel], 0.35)
  bells.triggerAttackRelease(note, '8n', now, 0.08 + safeLevel * 0.04)
  bells.triggerAttackRelease(harmony, '16n', now + 0.18, 0.05 + safeLevel * 0.025)
  pad.triggerAttackRelease([Tone.Frequency(root).transpose(signature.degree).toNote(), harmony], '2n', now + 0.05, 0.035 + safeLevel * 0.012)
}

export function disposeSound() {
  if (!initialized) return
  stopSound()
  Tone.Transport.stop()
  droneLoop = disposePart(droneLoop)
  bellLoop = disposePart(bellLoop)
  shimmerLoop = disposePart(shimmerLoop)
  climateLoop = disposePart(climateLoop)
  bassLoop = disposePart(bassLoop)

  const disposableNodes = [drone, bells, pad, shimmer, climate, climateFilter, bass, globalFilter, chorus, delay, reverb, masterVolume]
  disposableNodes.forEach(node => node?.dispose())

  initialized = false
  playing = false
  currentDroneNotes = []
  currentPulseNotes = BELL_NOTES
  activeAnswers = {}
  activeStep = null
  masterVolume = null
  globalFilter = null
  chorus = null
  delay = null
  reverb = null
  shimmer = null
  drone = null
  bells = null
  pad = null
  climate = null
  climateFilter = null
  bass = null
}
