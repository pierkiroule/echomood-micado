import * as Tone from 'tone'

const DRONE_NOTES = ['C3', 'G3', 'D4', 'A4']
const BELL_NOTES = ['C5', 'E5', 'G5', 'B5', 'D6', 'A5']
const STEP_ROOTS = {
  world: ['C3', 'G3', 'D4'],
  inside: ['A2', 'E3', 'C4'],
  supports: ['F3', 'C4', 'G4'],
  missing: ['D3', 'A3', 'E4'],
  star: ['G3', 'D4', 'A4'],
}

const LEVEL_GAIN = [0, -32, -27, -23]

let initialized = false
let playing = false
let currentDroneNotes = []
let masterVolume
let globalFilter
let chorus
let delay
let reverb
let drone
let bells
let climate
let climateFilter
let bass
let droneLoop
let bellLoop
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

function createEffectsChain() {
  masterVolume = new Tone.Volume(-18).toDestination()
  globalFilter = new Tone.Filter({ frequency: 3200, type: 'lowpass', rolloff: -12, Q: 0.6 })
  chorus = new Tone.Chorus({ frequency: 0.035, delayTime: 4.5, depth: 0.32, feedback: 0.04, wet: 0.18 }).start()
  delay = new Tone.PingPongDelay({ delayTime: '4n.', feedback: 0.16, wet: 0.12 })
  reverb = new Tone.Reverb({ decay: 10, preDelay: 0.08, wet: 0.28 })

  globalFilter.chain(chorus, delay, reverb, masterVolume)
}

function createInstruments() {
  drone = new Tone.PolySynth(Tone.DuoSynth, {
    volume: -30,
    voice0: {
      oscillator: { type: 'sine' },
      envelope: { attack: 3.2, decay: 1.4, sustain: 0.68, release: 5.5 },
    },
    voice1: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 3.6, decay: 1.6, sustain: 0.52, release: 6 },
    },
    harmonicity: 1.01,
    vibratoAmount: 0.04,
    vibratoRate: 0.12,
  }).connect(globalFilter)

  bells = new Tone.FMSynth({
    volume: -28,
    harmonicity: 2.6,
    modulationIndex: 6,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.08, decay: 1.4, sustain: 0.04, release: 2.6 },
    modulation: { type: 'sine' },
    modulationEnvelope: { attack: 0.12, decay: 0.9, sustain: 0.02, release: 1.8 },
  }).connect(globalFilter)

  climate = new Tone.NoiseSynth({
    volume: -42,
    noise: { type: 'pink' },
    envelope: { attack: 2.8, decay: 1.8, sustain: 0.25, release: 4.5 },
  })
  climateFilter = new Tone.Filter({ frequency: 950, type: 'bandpass', Q: 0.45 })
  climate.chain(climateFilter, globalFilter)

  bass = new Tone.MonoSynth({
    volume: -34,
    oscillator: { type: 'sine' },
    filter: { frequency: 260, type: 'lowpass', rolloff: -24 },
    envelope: { attack: 1.1, decay: 1.2, sustain: 0.36, release: 3.5 },
    filterEnvelope: { attack: 1.2, decay: 1, sustain: 0.2, release: 2.4, baseFrequency: 70, octaves: 1.2 },
  }).connect(globalFilter)
}

function createLoops() {
  droneLoop = new Tone.Loop(time => {
    if (!playing || currentDroneNotes.length === 0) return
    drone.triggerAttackRelease(currentDroneNotes, '2m', time, 0.22)
  }, '2m')

  bellLoop = new Tone.Loop(time => {
    if (!playing) return
    const selectedIds = getSelectedIds(activeAnswers)
    if (selectedIds.length === 0) return

    const id = selectedIds[Math.floor(Math.random() * selectedIds.length)]
    const level = Math.max(1, Math.min(3, activeAnswers[id] || 1))
    const note = BELL_NOTES[(id.length + level + selectedIds.length) % BELL_NOTES.length]
    bells.triggerAttackRelease(note, '8n', time, 0.08 + level * 0.035)
  }, '1m')

  climateLoop = new Tone.Loop(time => {
    if (!playing) return
    climate.triggerAttackRelease('2m', time, 0.08)
  }, '3m')

  bassLoop = new Tone.Loop(time => {
    if (!playing) return
    const note = activeStep === 'inside' ? 'A1' : activeStep === 'missing' ? 'D2' : 'C2'
    bass.triggerAttackRelease(note, '1m', time, 0.15)
  }, '4m')
}

function getSelectedIds(answers = {}) {
  return Object.entries(answers)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .map(([id]) => id)
}

function getDroneNotes(answers = {}, currentStep) {
  const baseNotes = STEP_ROOTS[currentStep?.id || currentStep] || DRONE_NOTES
  const selectedCount = getSelectedIds(answers).length
  const noteCount = Math.max(2, Math.min(4, 2 + Math.floor(selectedCount / 4)))

  return baseNotes.concat(DRONE_NOTES).slice(0, noteCount)
}

function rampVolume(node, value, duration = 1.8) {
  if (!node?.volume) return
  node.volume.rampTo(value, duration)
}

export async function initAudio() {
  if (initialized) return true

  await Tone.start()
  Tone.Transport.bpm.value = 54
  Tone.Transport.swing = 0.08

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
  rampVolume(masterVolume, -18, 2.5)
  rampVolume(drone, -31, 3)
  rampVolume(bells, -29, 2)
  rampVolume(climate, -43, 3)
  rampVolume(bass, -35, 3)

  droneLoop.start(0)
  bellLoop.start('0:2:0')
  climateLoop.start('0:1:0')
  bassLoop.start('1m')

  if (Tone.Transport.state !== 'started') {
    Tone.Transport.start('+0.15')
  }
}

export function stopSound() {
  if (!initialized || !playing) return

  playing = false
  rampVolume(masterVolume, -48, 2.2)
  drone.releaseAll(getSafeNow(0.05))

  setTimeout(() => {
    if (playing) return
    droneLoop?.stop()
    bellLoop?.stop()
    climateLoop?.stop()
    bassLoop?.stop()
  }, 2300)
}

export function updateSoundFromAnswers(answers = {}, currentStep = null) {
  activeAnswers = { ...answers }
  activeStep = currentStep?.id || currentStep || null
  currentDroneNotes = getDroneNotes(activeAnswers, currentStep)

  if (!initialized) return

  const selectedIds = getSelectedIds(activeAnswers)
  const intensity = selectedIds.reduce((total, id) => total + Math.min(3, activeAnswers[id] || 0), 0)
  const averageLevel = selectedIds.length ? intensity / selectedIds.length : 0
  const filterFrequency = 1800 + Math.min(1800, intensity * 120)

  globalFilter.frequency.rampTo(filterFrequency, 2.5)
  rampVolume(drone, -33 + Math.min(5, selectedIds.length * 0.5), 2.5)
  rampVolume(climate, -45 + Math.min(6, averageLevel * 1.8), 2.5)
  rampVolume(bass, -37 + Math.min(5, averageLevel * 1.5), 2.5)

  if (playing && currentDroneNotes.length > 0) {
    drone.triggerAttackRelease(currentDroneNotes, '1m', getSafeNow(0.2), 0.16)
  }
}

export function triggerEmojiPulse(id, level = 1) {
  if (!initialized || !playing) return

  const safeLevel = Math.max(1, Math.min(3, Number(level) || 1))
  const noteIndex = Math.abs(String(id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % BELL_NOTES.length
  const note = BELL_NOTES[(noteIndex + safeLevel) % BELL_NOTES.length]
  const now = getSafeNow(0.03)

  rampVolume(bells, LEVEL_GAIN[safeLevel], 0.35)
  bells.triggerAttackRelease(note, '8n', now, 0.08 + safeLevel * 0.04)
  bells.triggerAttackRelease(Tone.Frequency(note).transpose(7), '16n', now + 0.18, 0.05 + safeLevel * 0.025)
}

export function disposeSound() {
  if (!initialized) return

  stopSound()
  Tone.Transport.stop()

  droneLoop = disposePart(droneLoop)
  bellLoop = disposePart(bellLoop)
  climateLoop = disposePart(climateLoop)
  bassLoop = disposePart(bassLoop)

  const disposableNodes = [drone, bells, climate, climateFilter, bass, globalFilter, chorus, delay, reverb, masterVolume]
  disposableNodes.forEach(node => node?.dispose())

  initialized = false
  playing = false
  currentDroneNotes = []
  activeAnswers = {}
  activeStep = null
  masterVolume = null
  globalFilter = null
  chorus = null
  delay = null
  reverb = null
  drone = null
  bells = null
  climate = null
  climateFilter = null
  bass = null
}
