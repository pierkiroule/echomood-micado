import { useState } from 'react'
import './index.css'

const STEPS = [
  {
    id: 'world',
    label: 'Reliefs',
    color: '#60a5fa',
    title: "Qu'est-ce qui occupe ton paysage intérieur aujourd'hui ?",
    items: [
      ['home', '🏠', 'Famille'],
      ['school', '🏫', 'École'],
      ['friends', '👥', 'Amis'],
      ['phone', '📱', 'Réseaux'],
    ],
  },
  {
    id: 'inside',
    label: 'Météo',
    color: '#fb7185',
    title: "Quelle météo traverse ton paysage intérieur ?",
    items: [
      ['anger', '😡', 'Orage'],
      ['fear', '😰', 'Vent fort'],
      ['sad', '😔', 'Pluie'],
      ['empty', '😶', 'Brume'],
    ],
  },
  {
    id: 'supports',
    label: 'Refuges',
    color: '#4ade80',
    title: "Quels sont les refuges de ton paysage intérieur ?",
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
    title: "De quoi ton paysage intérieur aurait-il besoin aujourd'hui ?",
    items: [
      ['calm', '🕊️', 'Calme'],
      ['hope', '🌈', 'Espoir'],
      ['direction', '🧭', 'Cap'],
      ['comfort', '🤗', 'Réconfort'],
    ],
  },
  {
    id: 'star',
    label: 'Étoile',
    color: '#facc15',
    title: "Où aimerais-tu que nous regardions ensemble dans ce paysage ?",
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
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [customItems, setCustomItems] = useState(EMPTY_CUSTOM_ITEMS)
  const [customModalStep, setCustomModalStep] = useState(null)
  const current = STEPS[stepIndex]
  const currentItems = getStepItems(current, customItems)

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

  if (stepIndex >= STEPS.length) {
    return <Reveal answers={answers} customItems={customItems} onReset={reset} />
  }

  return (
    <main className="app">
      <section className="top">
        <div className="brand-title">
          <span className="brand-echo">ECHO</span>
          <span className="brand-mood">MOOD</span>
          <span className="brand-tag">MICADO</span>
        </div>

        <div className="progress">
          {STEPS.map((s, i) => (
            <span key={s.id} className={i <= stepIndex ? 'on' : ''} />
          ))}
        </div>

        <p className="kicker">{current.label}</p>
        <h1>{current.title}</h1>
        <p className="soft">Tapote une bulle. Plus le halo grandit, plus ça résonne.</p>
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

function Reveal({ answers, customItems, onReset }) {
  const nodes = getActiveNodes(answers, customItems)
  const links = getLinks(answers).slice(0, 3)

  return (
    <main className="app reveal-page">
      <section className="reveal-card">
        <div className="brand-title" style={{ marginBottom: '16px' }}>
          <span className="brand-echo" style={{ fontSize: '20px' }}>ECHO</span>
          <span className="brand-mood" style={{ fontSize: '20px' }}>MOOD</span>
          <span className="brand-tag" style={{ fontSize: '8px' }}>MICADO</span>
        </div>
        <p className="kicker">Révélation</p>
        <h1>Ton paysage intérieur aujourd'hui</h1>
        <p className="soft">Ce ne sont pas des vérités. Ce sont des pistes pour discuter.</p>

        <Constellation nodes={nodes} links={links} />

        <EchoIdentity nodes={nodes} />

        <EchoSummary nodes={nodes} />

        <div className="questions">
          {links.length === 0 && (
            <div className="question-card">
              <strong>Résonance possible</strong>
              <p>Y a-t-il un lien que l’application ne voit pas, mais que toi tu ressens ?</p>
            </div>
          )}

          {links.map(([a, b, question], i) => (
            <div className="question-card" key={i}>
              <div className="pair">{findEmoji(a)} ↔ {findEmoji(b)}</div>
              <p>{question}</p>
              <div className="mini-actions">
                <span>Ça résonne</span>
                <span>Pas aujourd’hui</span>
                <span>Je ne sais pas</span>
              </div>
            </div>
          ))}
        </div>

        <button className="primary" onClick={onReset}>Recommencer</button>
      </section>
    </main>
  )
}


function EchoIdentity({ nodes }) {
  const groups = [
    ['star', '📍 Lieu à explorer'],
    ['world', '🌍 Reliefs'],
    ['inside', '💓 Météo'],
    ['supports', '🌱 Refuges'],
    ['missing', '🧭 Besoins']
  ]

  return (
    <div className="identity-card">
      <h3>Ton paysage intérieur</h3>
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

function EchoSummary({ nodes }) {
  const world = nodes.filter(n => n.group === 'world').map(n => n.label)
  const inside = nodes.filter(n => n.group === 'inside').map(n => n.label)
  const supports = nodes.filter(n => n.group === 'supports').map(n => n.label)
  const missing = nodes.filter(n => n.group === 'missing').map(n => n.label)
  const star = nodes.find(n => n.group === 'star')

  return (
    <div className="summary-card">
      <h3>Lecture du paysage</h3>
      <p>
        Aujourd'hui, ton paysage intérieur semble s'organiser autour de
        {star ? <b> {star.emoji} {star.label}</b> : ' quelque chose encore à préciser'}.
      </p>

      {world.length > 0 && (
        <p>Dans le monde autour de toi, <b>{world.join(', ')}</b> prend de la place.</p>
      )}

      {inside.length > 0 && (
        <p>Météo, ça résonne avec <b>{inside.join(', ')}</b>.</p>
      )}

      {supports.length > 0 && (
        <p>Des appuis apparaissent : <b>{supports.join(', ')}</b>.</p>
      )}

      {missing.length > 0 && (
        <p>Ce qui serait précieux aujourd’hui : <b>{missing.join(', ')}</b>.</p>
      )}

      <p className="summary-soft">
        Ce résumé ne dit pas la vérité. Il sert seulement à ouvrir la discussion.
      </p>
    </div>
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

function getStepItems(step, customItems = EMPTY_CUSTOM_ITEMS) {
  const customItem = customItems[step.id]
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

function findEmoji(id) {
  for (const step of STEPS) {
    const found = step.items.find(i => i[0] === id)
    if (found) return found[1]
  }
  return '•'
}
