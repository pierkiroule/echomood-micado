import { useState } from 'react'
import './index.css'

const STEPS = [
  {
    id: 'world',
    label: 'Astres',
    color: '#60a5fa',
    title: "Qu'est-ce qui occupe ton Kosmos intérieur aujourd'hui ?",
    items: [
      ['home', '🏠', 'Famille'],
      ['school', '🏫', 'École'],
      ['friends', '👥', 'Amis'],
      ['phone', '📱', 'Réseaux'],
    ],
  },
  {
    id: 'inside',
    label: 'Climats',
    color: '#fb7185',
    title: "Quel climat traverse ton Kosmos intérieur ?",
    items: [
      ['anger', '😡', 'Orage'],
      ['fear', '😰', 'Vent fort'],
      ['sad', '😔', 'Pluie'],
      ['empty', '😶', 'Brume'],
    ],
  },
  {
    id: 'supports',
    label: 'Satellites-refuges',
    color: '#4ade80',
    title: "Quels refuges gravitent dans ton Kosmos intérieur ?",
    items: [
      ['support', '🤝', 'Soutien'],
      ['music', '🎵', 'Musique'],
      ['nature', '🌳', 'Nature'],
      ['talk', '🗣️', 'Parler'],
    ],
  },
  {
    id: 'missing',
    label: 'Besoins',
    color: '#c084fc',
    title: "De quoi ton Kosmos intérieur aurait-il besoin aujourd'hui ?",
    items: [
      ['calm', '🕊️', 'Calme'],
      ['hope', '🌈', 'Espoir'],
      ['direction', '🧭', 'Cap'],
      ['comfort', '🤗', 'Réconfort'],
    ],
  },
  {
    id: 'star',
    label: 'Astre à explorer',
    color: '#facc15',
    title: "Quelle résonance aimerais-tu explorer ensemble ?",
    single: true,
    items: [
      ['spark', '✨', 'Lueur'],
      ['change', '🌱', 'Changement'],
      ['challenge', '🚀', 'Défi'],
      ['link', '❤️', 'Lien'],
    ],
  },
]

const RULES = [
  ['home', 'anger', 'Y a-t-il quelque chose dans la famille qui pourrait avoir un lien avec cette colère ?'],
  ['school', 'fear', 'Qu’est-ce qui pourrait relier l’école au stress ?'],
  ['phone', 'fear', 'Le téléphone apaise-t-il le stress, ou est-ce qu’il l’augmente parfois ?'],
  ['friends', 'empty', 'Quand le groupe est là, est-ce que le vide change de forme ?'],
  ['music', 'sad', 'La musique accompagne-t-elle ou transforme-t-elle la tristesse ?'],
  ['support', 'sad', 'Qui reste présent quand la tristesse arrive ?'],
  ['calm', 'fear', 'Qu’est-ce qui pourrait aider le calme à rencontrer la peur ?'],
  ['talk', 'anger', 'Qu’est-ce qui pourrait aider la colère à devenir des mots ?'],
  ['nature', 'sad', 'Dehors, est-ce que la tristesse change de forme ?'],
  ['hope', 'empty', 'Qu’est-ce qui pourrait remettre une petite lueur quand le vide est là ?'],
]

const POSITIONS = [
  { left: '25%', top: '26%', delay: '0s' },
  { left: '73%', top: '28%', delay: '.8s' },
  { left: '28%', top: '70%', delay: '1.4s' },
  { left: '72%', top: '70%', delay: '.3s' },
  { left: '50%', top: '50%', delay: '.6s' },
]

const EMPTY_CUSTOM_ITEMS = {
  world: null,
  inside: null,
  supports: null,
  missing: null,
  star: null,
}

export default function App() {
  const [screen, setScreen] = useState('flow')
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [customItems, setCustomItems] = useState(EMPTY_CUSTOM_ITEMS)
  const [customModalStep, setCustomModalStep] = useState(null)
  const current = STEPS[stepIndex]

  function toggle(id) {
    if (current.single) {
      setAnswers(prev => ({ ...prev, star: id }))
      return
    }

    setAnswers(prev => {
      const next = ((prev[id] || 0) + 1) % 4
      return { ...prev, [id]: next }
    })
  }

  function reset() {
    setStepIndex(0)
    setAnswers({})
    setCustomItems(EMPTY_CUSTOM_ITEMS)
    setCustomModalStep(null)
    setScreen('flow')
  }

  function openCustomModal() {
    setCustomModalStep(current.id)
  }

  function saveCustomItem(stepId, item) {
    const customId = `custom-${stepId}`

    setCustomItems(prev => ({
      ...prev,
      [stepId]: {
        id: customId,
        emoji: item.emoji,
        label: item.label,
      },
    }))

    setAnswers(prev => ({
      ...prev,
      [customId]: 1,
      ...(stepId === 'star' ? { star: customId } : {}),
    }))

    setCustomModalStep(null)
  }

  function getCurrentStepHasAnswer() {
    if (current.single) {
      return Boolean(answers.star)
    }

    return currentItems.some(([id]) => (answers[id] || 0) > 0)
  }

  function canGoNext() {
    return getCurrentStepHasAnswer()
  }

  if (screen === 'dashboard') {
    return <DashboardPlaceholder onBack={() => setScreen('flow')} />
  }

  if (stepIndex >= STEPS.length) {
    return (
      <Reveal
        answers={answers}
        customItems={customItems}
        onReset={reset}
        onOpenDashboard={() => setScreen('dashboard')}
      />
    )
  }

  const currentItems = getStepItems(current, customItems)

  return (
    <main className="app">
      <section className="top">
        <div className="brand-title">
          <span className="brand-echo">Kosmoji</span>
          <span className="brand-tag">MICADO</span>
        </div>

        <div className="progress">
          {STEPS.map((s, i) => (
            <span key={s.id} className={i <= stepIndex ? 'on' : ''} />
          ))}
        </div>

        {stepIndex === 0 && (
          <p className="home-subtitle">Explorer son Kosmos intérieur</p>
        )}
        <p className="kicker">{current.label}</p>
        <h1>{current.title}</h1>
        <p className="soft">Ce n’est pas un test. Il n’y a pas de bonne ou de mauvaise réponse. Choisis ce qui résonne aujourd’hui, puis découvre ton Kosmos du jour.</p>
      </section>

      <FloatingBubbles
        step={current}
        items={currentItems}
        answers={answers}
        onCustomTap={openCustomModal}
        onTap={toggle}
      />

      <section className="nav">
        <button className="secondary" onClick={() => setStepIndex(v => Math.max(0, v - 1))} disabled={stepIndex === 0}>
          Retour
        </button>
        <button
          className="primary"
          onClick={() => setStepIndex(v => v + 1)}
          disabled={!canGoNext()}
        >
          {stepIndex === 4 ? 'Révéler' : 'Suivant'}
        </button>
      </section>

      {customModalStep && (
        <CustomItemModal
          initialItem={customItems[customModalStep]}
          onCancel={() => setCustomModalStep(null)}
          onSave={item => saveCustomItem(customModalStep, item)}
        />
      )}
    </main>
  )
}

function FloatingBubbles({ step, items, answers, onTap, onCustomTap }) {
  return (
    <div className="bubble-stage">
      {items.map(([id, emoji, label, type], index) => {
        const level = step.single ? (answers.star === id ? 3 : 0) : answers[id] || 0
        const pos = POSITIONS[index]
        const isAddCustom = type === 'add-custom'

        return (
          <button
            key={id}
            className={`bubble ${isAddCustom ? 'bubble-add' : ''} level-${level}`}
            onClick={() => isAddCustom ? onCustomTap() : onTap(id)}
            style={{
              '--x': pos.left,
              '--y': pos.top,
              '--delay': pos.delay,
              '--color': step.color,
            }}
          >
            <span className="halo h1" />
            <span className="halo h2" />
            <span className="halo h3" />
            <span className="micro m1" />
            <span className="micro m2" />
            <span className="micro m3" />
            <span className="bubble-emoji">{emoji}</span>
            <span className="bubble-label">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

function CustomItemModal({ initialItem, onCancel, onSave }) {
  const [emoji, setEmoji] = useState(initialItem?.emoji || '')
  const [label, setLabel] = useState(initialItem?.label || '')
  const cleanLabel = label.trim().slice(0, 20)
  const cleanEmoji = emoji.trim().slice(0, 4)
  const canSave = cleanEmoji.length > 0 && cleanLabel.length > 0

  function handleSubmit(event) {
    event.preventDefault()
    if (!canSave) return
    onSave({ emoji: cleanEmoji, label: cleanLabel })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="custom-modal" onSubmit={handleSubmit} aria-label="Ajouter une bulle personnalisée">
        <p className="kicker">Autre bulle</p>
        <h2>Ajouter ce qui manque</h2>
        <label>
          Emoji
          <input
            value={emoji}
            onChange={event => setEmoji(event.target.value)}
            placeholder="🌙"
            maxLength={4}
            autoFocus
          />
        </label>
        <label>
          Mot court
          <input
            value={label}
            onChange={event => setLabel(event.target.value.slice(0, 20))}
            placeholder="Ton mot"
            maxLength={20}
          />
        </label>
        <p className="modal-hint">{cleanLabel.length}/20 caractères · local uniquement</p>
        <div className="modal-actions">
          <button className="secondary" type="button" onClick={onCancel}>Annuler</button>
          <button className="primary" type="submit" disabled={!canSave}>Valider</button>
        </div>
      </form>
    </div>
  )
}

function Reveal({ answers, customItems, onReset, onOpenDashboard }) {
  const nodes = getActiveNodes(answers, customItems)
  const links = getLinks(answers).slice(0, 3)
  const [history] = useState(() => saveKosmoji(createKosmojiEntry(nodes, links)))

  const recurringItems = getRecurringItems(history)

  return (
    <main className="app reveal-page">
      <section className="reveal-card">
        <div className="brand-title" style={{ marginBottom: '16px' }}>
          <span className="brand-echo" style={{ fontSize: '24px' }}>Kosmoji</span>
          <span className="brand-tag" style={{ fontSize: '8px' }}>MICADO</span>
        </div>
        <section className="reveal-hero">
          <p className="kicker">Révélation</p>
          <h1>Ton Kosmos du jour</h1>
          <p className="reveal-subtitle">Une représentation des résonances qui traversent ton Kosmos intérieur aujourd’hui.</p>
          <p className="soft">Ce Kosmos ne dit pas la vérité sur toi.</p>
          <p className="soft">Il propose des pistes pour parler de ce qui résonne.</p>
        </section>

        <section className="landscape-card">
          <div className="section-heading">
            <p className="kicker">Carte visuelle</p>
            <h2>Kosmos du jour</h2>
          </div>
          <Constellation nodes={nodes} links={links} />
          <EchoIdentity nodes={nodes} />
        </section>

        <EchoSummary nodes={nodes} links={links} />

        <div className="questions">
          <div className="section-heading">
            <p className="kicker">Résonances possibles</p>
            <h2>Des pistes à explorer</h2>
          </div>
          {links.length === 0 && (
            <div className="question-card">
              <strong>Résonance possible</strong>
              <p>Y a-t-il un lien que l’application ne voit pas, mais que toi tu ressens ?</p>
            </div>
          )}

          {links.map(([a, b], i) => (
            <div className="question-card" key={i}>
              <strong>Résonance possible</strong>
              <div className="pair">{formatNodePair(a, b, customItems)}</div>
              <p>{getResonanceQuestion(a, b, customItems)}</p>
              <div className="mini-actions">
                <span>Ça résonne</span>
                <span>Pas aujourd’hui</span>
                <span>Je ne sais pas</span>
              </div>
            </div>
          ))}
        </div>

        {recurringItems.length > 0 && (
          <RecurringLandscape items={recurringItems} />
        )}

        <section className="collection-card">
          <p className="kicker">Collection de Kosmoji</p>
          <h2>Observatoire des résonances</h2>
          <p>Retrouve tes Kosmoji précédents, les résonances qui reviennent souvent et l'évolution de ton Kosmos intérieur.</p>
          <button className="primary" onClick={onOpenDashboard}>Ouvrir l’Observatoire</button>
        </section>

        <div className="final-actions">
          <button className="primary" onClick={onReset}>Terminer</button>
          <button className="secondary" onClick={onOpenDashboard}>Voir ma collection</button>
          <button className="secondary" onClick={() => exportKosmoji(nodes, links)}>Exporter ce Kosmos</button>
        </div>
      </section>
    </main>
  )
}


function EchoIdentity({ nodes }) {
  const groups = [
    ['star', '✨ Astre à explorer'],
    ['world', '🌌 Astres'],
    ['inside', '🌀 Climats'],
    ['supports', '🛰️ Satellites-refuges'],
    ['missing', '🧭 Besoins']
  ]

  return (
    <div className="identity-card">
      <h3>Ton Kosmos intérieur</h3>
      {groups.map(([group, title]) => {
        const items = nodes.filter(n => n.group === group)
        if (!items.length) return null

        return (
          <div className="identity-row" key={group}>
            <strong>{title}</strong>
            <div>
              {items.map(item => (
                <span className="identity-pill" key={item.id}>
                  {item.emoji} {item.label}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EchoSummary({ nodes, links = [] }) {
  const world = nodes.filter(n => n.group === 'world')
  const inside = nodes.filter(n => n.group === 'inside')
  const supports = nodes.filter(n => n.group === 'supports')
  const missing = nodes.filter(n => n.group === 'missing')
  const star = nodes.find(n => n.group === 'star')

  return (
    <section className="summary-card">
      <p className="kicker">Résumé automatique</p>
      <h2>Aujourd'hui :</h2>

      {world.length > 0 && (
        <p>{formatListWithEmoji(world)} semblent occuper ton Kosmos intérieur.</p>
      )}

      {inside.length > 0 && (
        <p>Un climat particulier traverse ce Kosmos avec {formatListWithEmoji(inside)}.</p>
      )}

      {supports.length > 0 && (
        <p>{formatListWithEmoji(supports)} apparaissent comme des satellites-refuges.</p>
      )}

      {missing.length > 0 && (
        <p>{formatListWithEmoji(missing)} dessinent certains besoins.</p>
      )}

      {star && (
        <p>✨ Une résonance, {star.emoji} {star.label}, peut être explorée ensemble.</p>
      )}

      {links.length === 0 && (
        <p>✨ Une résonance peut être explorée ensemble.</p>
      )}

      <p className="summary-soft">Cette synthèse reste une représentation locale du jour, à discuter librement.</p>
    </section>
  )
}

function RecurringLandscape({ items }) {
  return (
    <section className="recurring-card">
      <p className="kicker">Collection de Kosmoji</p>
      <h2>Ce qui revient dans ton Kosmos intérieur</h2>
      <div className="recurring-list">
        {items.map(item => (
          <div className="recurring-item" key={item.id}>
            <span>{item.emoji}</span>
            <strong>{item.label}</strong>
            <small>présent dans {item.count} Kosmoji</small>
          </div>
        ))}
      </div>
    </section>
  )
}

function DashboardPlaceholder({ onBack }) {
  return (
    <main className="app reveal-page">
      <section className="reveal-card dashboard-placeholder">
        <p className="kicker">Observatoire des résonances</p>
        <h1>Collection de Kosmoji</h1>
        <p className="soft">La navigation vers l’Observatoire est prête. Les astres, climats, satellites-refuges, besoins et constellations récurrentes pourront être branchés ici.</p>
        <button className="primary" onClick={onBack}>Revenir au Kosmos du jour</button>
      </section>
    </main>
  )
}

function Constellation({ nodes, links }) {
  const positioned = positionNodes(nodes)
  const posMap = Object.fromEntries(positioned.map(n => [n.id, n]))

  return (
    <div className="constellation">
      <div className="orbit orbit-1" />
      <div className="orbit orbit-2" />

      {links.map(([a, b], i) => {
        const p1 = posMap[a]
        const p2 = posMap[b]
        if (!p1 || !p2) return null

        return (
          <Line
            key={`${a}-${b}-${i}`}
            from={p1}
            to={p2}
          />
        )
      })}

      {positioned.map(n => (
        <div
          key={n.uid}
          className={`c-node ${n.group === 'star' ? 'central' : ''}`}
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            '--node-color': n.color,
            '--scale': n.scale || 1,
            '--opacity': n.opacity || 1,
          }}
        >
          <span>{n.emoji}</span>
          <small>{n.label}</small>
        </div>
      ))}
    </div>
  )
}

function Line({ from, to }) {
  const x1 = from.x
  const y1 = from.y
  const x2 = to.x
  const y2 = to.y

  const dx = x2 - x1
  const dy = y2 - y1

  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * 180 / Math.PI

  return (
    <div
      className="c-line"
      style={{
        left: `${x1}%`,
        top: `${y1}%`,
        width: `${length}%`,
        transform: `rotate(${angle}deg)`,
      }}
    />
  )
}

function positionNodes(nodes) {
  const result = []

  const star = nodes.find(n => n.group === 'star')
  if (star) {
    result.push({
      ...star,
      uid: 'star-center',
      x: 50,
      y: 50
    })
  }

  const others = nodes.filter(n => n.group !== 'star')

  const slots = [
    [50, 15],
    [78, 25],
    [82, 50],
    [74, 74],
    [50, 84],
    [26, 74],
    [18, 50],
    [22, 25],
    [36, 32],
    [64, 32],
    [64, 68],
    [36, 68]
  ]

  others.slice(0, 12).forEach((n, i) => {
    result.push({
      ...n,
      uid: `${n.id}-${i}`,
      x: slots[i][0],
      y: slots[i][1]
    })
  })

  return result
}

const STORAGE_KEY = 'kosmoji-collection'
const LEGACY_STORAGE_KEY = 'echomood-history'

function createKosmojiEntry(nodes, links) {
  return {
    id: `kosmoji-${Date.now()}`,
    createdAt: new Date().toISOString(),
    nodes: nodes.map(({ id, emoji, label, group }) => ({ id, emoji, label, group })),
    links: links.map(([a, b, question]) => ({ a, b, question })),
  }
}

function getSavedKosmoji() {
  if (typeof window === 'undefined') return []

  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function saveKosmoji(entry) {
  if (typeof window === 'undefined') return []

  const previous = getSavedKosmoji()
  const signature = getEntrySignature(entry)
  const withoutDuplicate = previous.filter(item => getEntrySignature(item) !== signature)
  const next = [entry, ...withoutDuplicate].slice(0, 50)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

function getEntrySignature(entry) {
  return (entry.nodes || []).map(node => `${node.group}:${node.id}`).sort().join('|')
}

function getRecurringItems(history) {
  if (!Array.isArray(history) || history.length < 2) return []

  const counts = new Map()
  history.forEach(entry => {
    const seen = new Set()
    ;(entry.nodes || []).forEach(node => {
      if (node.group === 'star' || seen.has(node.id)) return
      seen.add(node.id)
      const current = counts.get(node.id) || { ...node, count: 0 }
      counts.set(node.id, { ...current, count: current.count + 1 })
    })
  })

  return [...counts.values()]
    .filter(item => item.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
}

function formatListWithEmoji(items) {
  return items.map(item => `${item.emoji} ${item.label}`).join(' et ')
}

function formatNodePair(a, b, customItems) {
  const first = findNodeLabel(a, customItems)
  const second = findNodeLabel(b, customItems)
  return (
    <>
      <span>{first.emoji} {first.label}</span>
      <span aria-hidden="true">↔</span>
      <span>{second.emoji} {second.label}</span>
    </>
  )
}

function getResonanceQuestion(a, b, customItems) {
  const first = findNodeLabel(a, customItems)
  const second = findNodeLabel(b, customItems)
  return `Est-ce qu’il pourrait y avoir un lien entre ${first.emoji} ${first.label} et ${second.emoji} ${second.label} aujourd’hui ?`
}

function findNodeLabel(id, customItems = {}) {
  for (const step of STEPS) {
    const found = getStepItems(step, customItems).find(item => item[0] === id)
    if (found) return { emoji: found[1], label: found[2] }
  }
  return { emoji: '•', label: 'Résonance' }
}

function exportKosmoji(nodes, links) {
  const entry = createKosmojiEntry(nodes, links)
  const blob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `kosmoji-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function getStepItems(step, customItems = EMPTY_CUSTOM_ITEMS) {
  if (!step) return []

  const customItem = customItems?.[step.id]
  const addCustomItem = [`add-${step.id}`, '➕', 'Autre', 'add-custom']

  if (!customItem) {
    return [...step.items, addCustomItem]
  }

  return [
    ...step.items,
    [customItem.id, customItem.emoji, customItem.label, 'custom'],
  ]
}

function getActiveNodes(answers, customItems = {}) {
  const nodes = []

  for (const step of STEPS) {
    const items = getStepItems(step, customItems).filter(([, , , type]) => type !== 'add-custom')

    if (step.id === 'star') {
      if (answers.star) {
        const item = items.find(i => i[0] === answers.star)
        if (!item) continue

        nodes.push({
          id: answers.star,
          emoji: item[1],
          label: item[2],
          group: 'star',
          color: step.color,
          level: 4,
          scale: 1.2,
          opacity: 1
        })
      }
      continue
    }

    for (const [id, emoji, label] of items) {
      const level = answers[id] || 0
      if (level > 0) {
        nodes.push({
          id,
          emoji,
          label,
          group: step.id,
          color: step.color,
          level,
          scale: level === 1 ? 0.82 : level === 2 ? 1 : 1.28,
          opacity: level === 1 ? 0.55 : level === 2 ? 0.78 : 1
        })
      }
    }
  }

  return nodes
}

function getLinks(answers) {
  const activeIds = Object.keys(answers).filter(k => answers[k] > 0)
  return RULES.filter(([a, b]) => activeIds.includes(a) && activeIds.includes(b))
}

