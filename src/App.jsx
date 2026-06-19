import { useEffect, useState } from 'react'
import './index.css'
import { STEPS } from './data/steps'
import { RESONANCES } from './data/resonances'
import {
  disposeSound,
  initAudio,
  startSound,
  stopSound,
  triggerEmojiPulse,
  updateSoundFromAnswers,
} from './audio/echoSoundEngine'

const MAX_VISIBLE_ITEMS = 6
const MAX_VISIBLE_STAR_ITEMS = 5

const MAX_CUSTOM_ITEMS_PER_STEP = 5

const EMPTY_CUSTOM_ITEMS = {
  world: [],
  inside: [],
  supports: [],
  missing: [],
  star: [],
}


const FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'inside', label: 'Humeur' },
  { id: 'supports', label: 'Aides' },
  { id: 'missing', label: 'Besoins' },
  { id: 'star', label: 'Sujets' },
]

const GROUP_LABELS = [
  { id: 'star', label: 'Sujet à explorer' },
  { id: 'world', label: 'Vie actuelle' },
  { id: 'inside', label: 'Humeur' },
  { id: 'supports', label: 'Aides' },
  { id: 'missing', label: 'Besoins' },
]


export default function App() {
  const [screen, setScreen] = useState('home')
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [customItems, setCustomItems] = useState(EMPTY_CUSTOM_ITEMS)
  const [customModalStep, setCustomModalStep] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const current = STEPS[stepIndex]

  useEffect(() => {
    updateSoundFromAnswers(answers, current)
  }, [answers, current])

  useEffect(() => () => disposeSound(), [])

  async function handleSoundToggle() {
    const nextSoundEnabled = !soundEnabled

    await initAudio()

    if (nextSoundEnabled) {
      await startSound()
    } else {
      stopSound()
    }

    setSoundEnabled(nextSoundEnabled)
  }

  function toggle(id) {
    if (current.single) {
      setAnswers(prev => ({ ...prev, star: id }))
      if (soundEnabled) {
        triggerEmojiPulse(id, 3)
      }
      return
    }

    setAnswers(prev => {
      const next = ((prev[id] || 0) + 1) % 4
      const shouldTriggerPulse = soundEnabled && next > 0

      if (shouldTriggerPulse) {
        triggerEmojiPulse(id, next)
      }

      return { ...prev, [id]: next }
    })
  }

  function reset() {
    setStepIndex(0)
    setAnswers({})
    setCustomItems(EMPTY_CUSTOM_ITEMS)
    setCustomModalStep(null)
    setSoundEnabled(false)
    stopSound()
    setScreen('home')
  }

  function openCustomModal() {
    setCustomModalStep(current.id)
  }

  function saveCustomItem(stepId, item) {
    const customId = `custom-${stepId}-${Date.now()}`
    const customItem = {
      id: customId,
      emoji: item.emoji,
      label: item.label,
    }

    setCustomItems(prev => {
      const existingItems = getCustomItemsForStep(prev, stepId)
      if (existingItems.length >= MAX_CUSTOM_ITEMS_PER_STEP) return prev

      return {
        ...prev,
        [stepId]: [...existingItems, customItem],
      }
    })

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


  if (screen === 'home') {
    return <HomeScreen onStart={() => setScreen('flow')} />
  }

  if (screen === 'dashboard') {
    return <EchoCollection onBack={() => setScreen('flow')} />
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
      <section className="top flow-top">
        <div className="progress">
          {STEPS.map((s, i) => (
            <span key={s.id} className={i <= stepIndex ? 'on' : ''} />
          ))}
        </div>

        <p className="kicker">{current.label}</p>
        <h1>{current.title}</h1>
        <p className="soft">Ce n’est pas un test. Avance avec Suivant : une étape après l’autre, puis révèle ton ÉchoMood avant de l’ajouter à ton Échollection.</p>
        <button className="sound-toggle" onClick={handleSoundToggle} type="button">
          {soundEnabled ? 'Son on' : 'Son off'}
        </button>
        <FlowScrollbar steps={STEPS} currentIndex={stepIndex} />
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
          {stepIndex === STEPS.length - 1 ? 'Révéler l’ÉchoMood' : 'Suivant'}
        </button>
      </section>

      {customModalStep && (
        <CustomItemModal
          customCount={getCustomItemsForStep(customItems, customModalStep).length}
          onCancel={() => setCustomModalStep(null)}
          onSave={item => saveCustomItem(customModalStep, item)}
        />
      )}
    </main>
  )
}


function HomeScreen({ onStart }) {
  return (
    <main className="app home-page">
      <div className="home-aurora" aria-hidden="true" />
      <div className="home-orbit home-orbit-one" aria-hidden="true">💫</div>
      <div className="home-orbit home-orbit-two" aria-hidden="true">🌈</div>
      <div className="home-orbit home-orbit-three" aria-hidden="true">🫧</div>

      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-eyebrow">
          <span className="home-eyebrow-dot" />
          Espace d’écoute émotionnelle
        </div>

        <div className="brand-title home-brand" id="home-title">
          <span className="brand-echo home-brand-word">ÉchoMood</span>
          <span className="home-brand-spark" aria-hidden="true">✨</span>
        </div>

        <p className="home-subtitle">Transforme ton ressenti du moment en constellation claire, douce et actionnable.</p>

        <div className="home-intro">
          <p>
            ÉchoMood t’aide à faire le point sans jugement : tu sélectionnes les émojis qui résonnent avec ta vie actuelle, ton humeur, tes appuis et tes besoins.
          </p>
          <p>
            En quelques étapes, l’accueil de tes émotions devient plus simple : tu nommes ce qui se passe, tu repères ce qui t’aide, puis tu obtiens une synthèse visuelle pour mieux te comprendre ou en parler.
          </p>
        </div>

        <div className="home-steps" aria-label="Déroulé de l’expérience ÉchoMood">
          <article>
            <span aria-hidden="true">🧭</span>
            <strong>Explorer</strong>
            <p>Choisis ce qui fait écho à ton vécu aujourd’hui.</p>
          </article>
          <article>
            <span aria-hidden="true">🎧</span>
            <strong>Écouter</strong>
            <p>Observe les intensités et les nuances qui émergent.</p>
          </article>
          <article>
            <span aria-hidden="true">🌟</span>
            <strong>Révéler</strong>
            <p>Découvre ton ÉchoMood et des pistes concrètes.</p>
          </article>
        </div>

        <button className="primary home-start" onClick={onStart} type="button">
          Commencer mon ÉchoMood
          <span aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  )
}

function FlowScrollbar({ steps, currentIndex }) {
  const progress = ((currentIndex + 1) / steps.length) * 100

  return (
    <div className="flow-scrollbar" aria-label={`Progression du flow : étape ${currentIndex + 1} sur ${steps.length}`}>
      <div className="flow-scrollbar-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="flow-scrollbar-labels">
        <span>Suivant</span>
        <span>Révéler l’ÉchoMood</span>
        <span>Échollection</span>
      </div>
    </div>
  )
}

function FloatingBubbles({ step, items, answers, onTap, onCustomTap }) {
  const ringItemsCount = items.filter(([, , , type]) => type !== 'add-custom').length
  const layout = getBubbleLayout(ringItemsCount)

  return (
    <div
      className="bubble-stage"
      style={{
        '--bubble-size': layout.size,
        '--bubble-emoji-size': layout.emojiSize,
        '--bubble-label-size': layout.labelSize,
      }}
    >
      {items.map(([id, emoji, label, type], index) => {
        const level = step.single ? (answers.star === id ? 3 : 0) : answers[id] || 0
        const isAddCustom = type === 'add-custom'
        const ringIndex = items.slice(0, index).filter(([, , , itemType]) => itemType !== 'add-custom').length
        const pos = isAddCustom ? getCenterBubblePosition() : getBubblePosition(ringIndex, ringItemsCount)

        return (
          <button
            key={id}
            className={`bubble ${isAddCustom ? 'bubble-add' : ''} level-${level}`}
            onClick={() => isAddCustom ? onCustomTap() : onTap(id)}
            aria-label={`${isAddCustom ? 'Ajouter une autre bulle' : label} · intensité ${level} sur 3`}
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


function getBubbleLayout(total) {
  if (total <= 6) {
    return { size: 'clamp(64px, 16vw, 98px)', emojiSize: 'clamp(23px, 6.2vw, 34px)', labelSize: 'clamp(9px, 2.4vw, 11px)' }
  }

  if (total <= 8) {
    return { size: 'clamp(56px, 14vw, 84px)', emojiSize: 'clamp(21px, 5.5vw, 30px)', labelSize: 'clamp(8px, 2.2vw, 10px)' }
  }

  return { size: 'clamp(48px, 12vw, 72px)', emojiSize: 'clamp(19px, 5vw, 27px)', labelSize: 'clamp(7px, 2vw, 9px)' }
}

function getCenterBubblePosition() {
  return { left: '50%', top: '50%', delay: '.2s' }
}

function getBubblePosition(index, total) {
  if (total <= 1) return { left: '50%', top: '22%', delay: '0s' }

  const ringCount = Math.max(1, total)
  const angle = (-90 + (360 / ringCount) * index) * Math.PI / 180
  const radiusX = ringCount > 7 ? 37 : 32
  const radiusY = ringCount > 7 ? 30 : 27
  return {
    left: `${50 + Math.cos(angle) * radiusX}%`,
    top: `${48 + Math.sin(angle) * radiusY}%`,
    delay: `${(index % 6) * 0.18}s`,
  }
}

function CustomItemModal({ customCount, onCancel, onSave }) {
  const [emoji, setEmoji] = useState('')
  const [label, setLabel] = useState('')
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
        <p className="modal-hint">{cleanLabel.length}/20 caractères · {customCount}/{MAX_CUSTOM_ITEMS_PER_STEP} ajouts · local uniquement</p>
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
  const [currentEntry, setCurrentEntry] = useState(() => createEchoMoodEntry(nodes, links))
  const [feedback, setFeedback] = useState(() => getFeedbackMap(currentEntry))
  const [history, setHistory] = useState(() => saveEchoMood(currentEntry))

  const recurringItems = getRecurringItems(history)

  function chooseFeedback(key, value) {
    setFeedback(prev => ({ ...prev, [key]: value }))
    setCurrentEntry(prev => {
      const updated = {
        ...prev,
        links: (prev.links || []).map(link => link.key === key ? { ...link, feedback: value } : link),
      }
      setHistory(updateSavedEchoMood(updated))
      return updated
    })
  }

  return (
    <main className="app reveal-page">
      <section className="reveal-card">
        <div className="brand-title" style={{ marginBottom: '16px' }}>
          <span className="brand-echo" style={{ fontSize: '24px' }}>ÉchoMood</span>
        </div>
        <section className="reveal-hero">
          <p className="kicker">ÉchoMood révélé</p>
          <h1>Ton ÉchoMood du jour</h1>
          <p className="reveal-subtitle">Une étape de révélation courte avant de ranger cet ÉchoMood dans ton Échollection.</p>
          <p className="soft">Cet ÉchoMood ne dit pas la vérité sur toi.</p>
          <p className="soft">Il propose des pistes pour parler de ce que tu vis.</p>
        </section>

        <section className="landscape-card">
          <div className="section-heading">
            <p className="kicker">Carte visuelle</p>
            <h2>ÉchoMood du jour</h2>
          </div>
          <Constellation nodes={nodes} links={links} />
          <EchoIdentity nodes={nodes} />
        </section>

        <EchoSummary nodes={nodes} links={links} />

        <div className="questions">
          <div className="section-heading">
            <p className="kicker">Questions guidées</p>
            <h2>Des liens plus simples à explorer</h2>
          </div>
          {links.length === 0 && (
            <div className="question-card">
              <strong>Question pour en parler</strong>
              <p className="question-main">Qu’est-ce qui est central dans ta vie actuellement ?</p>
              <p className="question-hint">Tu peux partir d’un choix, d’un lien, ou simplement d’un mot important pour toi.</p>
            </div>
          )}

          {links.map(([a, b], i) => {
            const key = `${a}-${b}-${i}`
            return (
              <div className="question-card" key={key}>
                <strong>Question pour en parler</strong>
                <div className="pair">{formatNodePair(a, b, customItems)}</div>
                <p className="question-main">{getClearResonanceQuestion(a, b, customItems)}</p>
                <div className="mini-actions" aria-label="Répondre à cette piste">
                  {['Ça résonne', 'Pas aujourd’hui', 'Je ne sais pas'].map(label => (
                    <button
                      className={feedback[key] === label ? 'selected' : ''}
                      key={label}
                      onClick={() => chooseFeedback(key, label)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {recurringItems.length > 0 && (
          <RecurringLandscape items={recurringItems} />
        )}

        <section className="collection-card" aria-labelledby="collection-next-title">
          <p className="kicker">Prochaine étape</p>
          <h2 id="collection-next-title">Échollection</h2>
          <p>Ton ÉchoMood du jour est enregistré localement. L’étape suivante est unique : ouvrir l’Échollection pour relire tes fiches, repérer les retours et garder une trace exportable.</p>
          <div className="collection-flow" aria-label="Flow vers l’Échollection">
            <span>1 · ÉchoMood révélé</span>
            <span aria-hidden="true">→</span>
            <strong>2 · Échollection</strong>
          </div>
        </section>

        <div className="final-actions reveal-actions">
          <button className="primary" onClick={onOpenDashboard}>Ouvrir mon Échollection</button>
          <button className="secondary" onClick={() => exportEchoMood(currentEntry)}>Exporter cet ÉchoMood</button>
          <button className="secondary" onClick={onReset}>Recommencer plus tard</button>
        </div>
      </section>
    </main>
  )
}


function EchoIdentity({ nodes }) {
  const groups = [
    ['star', '✨ Sujet à explorer'],
    ['world', '🌌 Vie actuelle'],
    ['inside', '🌀 Humeur'],
    ['supports', '🛰️ Aides'],
    ['missing', '🧭 Besoins']
  ]

  return (
    <div className="identity-card">
      <h3>Ton vécu du moment</h3>
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
        <p>{formatListWithEmoji(world)} semblent prendre de la place en ce moment.</p>
      )}

      {inside.length > 0 && (
        <p>Ton humeur du moment inclut {formatListWithEmoji(inside)}.</p>
      )}

      {supports.length > 0 && (
        <p>{formatListWithEmoji(supports)} apparaissent comme des aides possibles.</p>
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

function RecurringLandscape({ items, title = 'Ce qui revient souvent' }) {
  return (
    <section className="recurring-card">
      <p className="kicker">Collection d’ÉchoMood</p>
      <h2>{title}</h2>
      <div className="recurring-list">
        {items.map(item => (
          <div className="recurring-item" key={item.id}>
            <span>{item.emoji}</span>
            <strong>{item.label}</strong>
            <small>présent dans {item.count} ÉchoMood</small>
          </div>
        ))}
      </div>
    </section>
  )
}

function EchoCollection({ onBack }) {
  const [history, setHistory] = useState(() => getSavedEchoMood())
  const [activeGroup, setActiveGroup] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const filteredHistory = filterHistoryByGroup(history, activeGroup)
  const overview = getCollectionOverview(history)
  const recurringItems = getRecurringItems(history, 6)
  const resourceItems = getGroupTrends(history, 'supports').slice(0, 4)
  const needsItems = getGroupTrends(history, 'missing').slice(0, 4)
  const changes = getCollectionChanges(history)
  const feedbackInsights = getFeedbackInsights(history)

  function clearHistory() {
    window.localStorage.removeItem(STORAGE_KEY)
    LEGACY_STORAGE_KEYS.forEach(key => window.localStorage.removeItem(key))
    setHistory([])
    setSelectedId(null)
  }

  return (
    <main className="app reveal-page">
      <section className="reveal-card observatory">
        <p className="kicker">Étape 2 · Échollection</p>
        <h1>Mon Échollection du mois</h1>
        <p className="soft">Le flow est maintenant clarifié : après la révélation, un seul accès mène ici. Tes ÉchoMood restent dans ce navigateur pour relire le mois, repérer les échos qui reviennent et préparer une trace exportable.</p>

        <nav className="collection-flow collection-flow-large" aria-label="Repères du flow ÉchoMood">
          <span>Accueil</span>
          <span aria-hidden="true">→</span>
          <span>ÉchoMood</span>
          <span aria-hidden="true">→</span>
          <span>Révélation</span>
          <span aria-hidden="true">→</span>
          <strong>Échollection</strong>
        </nav>

        <section className="safety-card">
          <strong>Cadre d’utilisation</strong>
          <p>ÉchoMood est un support de dialogue, pas un diagnostic ni un avis médical. Les données restent dans ce navigateur : rien n’est envoyé, tu peux exporter ou effacer à tout moment.</p>
        </section>

        <div className="collection-section-title">
          <p className="kicker">1 · Comprendre</p>
          <h2>Vue globale</h2>
        </div>

        <section className="observatory-grid">
          <article className="insight-card accent">
            <p className="kicker">Vue d’ensemble</p>
            <h2>{overview.count} ÉchoMood</h2>
            <p>{overview.message}</p>
          </article>
          <article className="insight-card">
            <p className="kicker">Ce qui change</p>
            <h2>{changes.title}</h2>
            <p>{changes.message}</p>
          </article>
        </section>

        <div className="collection-section-title">
          <p className="kicker">2 · Repérer</p>
          <h2>Tendances et ressources</h2>
        </div>

        {recurringItems.length > 0 && <RecurringLandscape items={recurringItems} title="Ce qui revient souvent" />}

        <section className="insight-card resources-card">
          <p className="kicker">Carte des ressources</p>
          <h2>Ce qui semble t’aider</h2>
          {resourceItems.length === 0 && <p className="soft-left">Les aides fréquentes apparaîtront ici après plusieurs ÉchoMood.</p>}
          <div className="pill-cloud">
            {resourceItems.map(item => <span key={item.id}>{item.emoji} {item.label} · {item.count}</span>)}
          </div>
          {needsItems.length > 0 && (
            <p className="support-note">À garder en douceur : {formatListWithEmoji(needsItems.slice(0, 2))} semblent aussi demander de l’attention.</p>
          )}
        </section>

        <section className="insight-card">
          <p className="kicker">Questions à reprendre</p>
          <h2>Résonances marquées</h2>
          {feedbackInsights.length === 0 && <p className="soft-left">Quand tu réponds “Ça résonne”, “Pas aujourd’hui” ou “Je ne sais pas”, l’Échollection gardera ces pistes pour les relire.</p>}
          <div className="feedback-list">
            {feedbackInsights.map(item => (
              <div className="feedback-item" key={item.key}>
                <strong>{item.feedback}</strong>
                <p>{item.question}</p>
                <small>{item.count} fois dans la collection</small>
              </div>
            ))}
          </div>
        </section>

        <div className="collection-section-title">
          <p className="kicker">3 · Relire</p>
          <h2>Journal filtrable</h2>
        </div>

        <section className="history-list">
          <div className="section-heading">
            <p className="kicker">Journal vivant</p>
            <h2>{filteredHistory.length} fiche{filteredHistory.length > 1 ? 's' : ''} affichée{filteredHistory.length > 1 ? 's' : ''}</h2>
          </div>

          <div className="filter-bar" aria-label="Filtrer la collection">
            {FILTERS.map(filter => (
              <button
                className={activeGroup === filter.id ? 'selected' : ''}
                key={filter.id}
                onClick={() => setActiveGroup(filter.id)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>

          {filteredHistory.length === 0 && <p className="soft">Aucun ÉchoMood enregistré pour ce filtre.</p>}

          {filteredHistory.map(entry => (
            <EchoMoodHistoryCard
              entry={entry}
              expanded={selectedId === entry.id}
              key={entry.id}
              onToggle={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
            />
          ))}
        </section>


        <div className="final-actions">
          <button className="primary" onClick={onBack}>Créer un nouvel ÉchoMood</button>
          <button className="secondary" onClick={() => exportCollection(history)} disabled={history.length === 0}>Exporter la collection</button>
          <button className="secondary danger" onClick={clearHistory} disabled={history.length === 0}>Effacer</button>
        </div>
      </section>
    </main>
  )
}

function EchoMoodHistoryCard({ entry, expanded, onToggle }) {
  const star = getEntryGroup(entry, 'star')[0]
  const topNodes = (entry.nodes || []).filter(node => node.group !== 'star').slice(0, 8)
  const resonantCount = (entry.links || []).filter(link => link.feedback === 'Ça résonne').length

  return (
    <article className={`history-item ${expanded ? 'expanded' : ''}`}>
      <button className="history-button" onClick={onToggle} type="button">
        <span>
          <time>{formatDate(entry.createdAt)}</time>
          {star && <strong>{star.emoji} {star.label}</strong>}
        </span>
        <span className="history-emojis">
          {topNodes.map(node => <span key={`${entry.id}-${node.group}-${node.id}`}>{node.emoji}</span>)}
        </span>
        <small>{(entry.links || []).length} pistes · {resonantCount} qui résonnent</small>
      </button>
      {expanded && <EchoMoodDetail entry={entry} compact />}
    </article>
  )
}

function EchoMoodDetail({ entry, compact = false }) {
  const groups = GROUP_LABELS.map(group => [group, getEntryGroup(entry, group.id)]).filter(([, items]) => items.length > 0)

  return (
    <section className={compact ? 'entry-detail compact' : 'entry-detail'}>
      {!compact && <p className="kicker">Fiche détaillée</p>}
      {!compact && <h2>{formatDate(entry.createdAt)}</h2>}
      <div className="entry-groups">
        {groups.map(([group, items]) => (
          <div className="entry-group" key={group.id}>
            <strong>{group.label}</strong>
            <div className="pill-cloud">
              {items.map(item => <span key={`${entry.id}-${group.id}-${item.id}`}>{item.emoji} {item.label}{item.level ? ` · ${item.level}/3` : ''}</span>)}
            </div>
          </div>
        ))}
      </div>
      {(entry.links || []).length > 0 && (
        <div className="entry-resonances">
          <strong>Résonances proposées</strong>
          {(entry.links || []).map(link => (
            <p key={link.key || `${link.a}-${link.b}`}>{link.question}{link.feedback ? ` — ${link.feedback}` : ''}</p>
          ))}
        </div>
      )}
    </section>
  )
}

function Constellation({ nodes, links }) {
  const layout = getConstellationLayout(nodes.length)
  const positioned = positionNodes(nodes)
  const posMap = Object.fromEntries(positioned.map(n => [n.id, n]))

  return (
    <div
      className="constellation"
      style={{
        '--network-node-size': layout.nodeSize,
        '--network-star-size': layout.starSize,
        '--network-font-size': layout.fontSize,
        '--network-label-size': layout.labelSize,
        '--network-label-offset': layout.labelOffset,
      }}
    >
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

function getConstellationLayout(total) {
  if (total <= 7) {
    return { nodeSize: '66px', starSize: '88px', fontSize: '29px', labelSize: '10px', labelOffset: '22px' }
  }

  if (total <= 11) {
    return { nodeSize: '56px', starSize: '76px', fontSize: '25px', labelSize: '9px', labelOffset: '18px' }
  }

  return { nodeSize: '46px', starSize: '66px', fontSize: '21px', labelSize: '8px', labelOffset: '15px' }
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
  const total = others.length

  others.forEach((n, i) => {
    const innerRing = total > 10 && i >= 8
    const itemsInRing = innerRing ? total - 8 : Math.min(total, 8)
    const indexInRing = innerRing ? i - 8 : i
    const radiusX = innerRing ? 25 : total > 8 ? 38 : 34
    const radiusY = innerRing ? 24 : total > 8 ? 36 : 33
    const angle = (-90 + (360 / itemsInRing) * indexInRing) * Math.PI / 180

    result.push({
      ...n,
      uid: `${n.id}-${i}`,
      x: 50 + Math.cos(angle) * radiusX,
      y: 50 + Math.sin(angle) * radiusY
    })
  })

  return result
}

const STORAGE_KEY = 'echomood-collection'
const LEGACY_STORAGE_KEYS = ['kosmoji-collection', 'echomood-history']

function createEchoMoodEntry(nodes, links) {
  return {
    id: `echomood-${Date.now()}`,
    createdAt: new Date().toISOString(),
    nodes: nodes.map(({ id, emoji, label, group, level }) => ({ id, emoji, label, group, level })),
    links: links.map(([a, b], index) => ({
      a,
      b,
      question: getClearResonanceQuestionFromNodes(a, b, nodes),
      key: `${a}-${b}-${index}`,
    })),
  }
}

function getSavedEchoMood() {
  if (typeof window === 'undefined') return []

  try {
    const rawSaved = window.localStorage.getItem(STORAGE_KEY) || LEGACY_STORAGE_KEYS.map(key => window.localStorage.getItem(key)).find(Boolean) || '[]'
    const saved = JSON.parse(rawSaved)
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function saveEchoMood(entry) {
  if (typeof window === 'undefined') return []

  const previous = getSavedEchoMood()
  const signature = getEntrySignature(entry)
  const withoutDuplicate = previous.filter(item => getEntrySignature(item) !== signature)
  const next = [entry, ...withoutDuplicate].slice(0, 50)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

function getEntrySignature(entry) {
  return (entry.nodes || []).map(node => `${node.group}:${node.id}`).sort().join('|')
}


function updateSavedEchoMood(entry) {
  if (typeof window === 'undefined') return []

  const previous = getSavedEchoMood()
  const next = previous.map(item => item.id === entry.id ? entry : item)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

function getFeedbackMap(entry) {
  return Object.fromEntries((entry.links || []).filter(link => link.feedback).map(link => [link.key, link.feedback]))
}

function getCollectionOverview(history) {
  if (!history.length) {
    return { count: 0, message: 'Crée un premier ÉchoMood pour commencer à entendre une trace de ton vécu du moment.' }
  }

  const first = history[history.length - 1]
  const latest = history[0]
  return {
    count: history.length,
    message: history.length === 1
      ? 'Une première fiche est gardée localement. Les tendances apparaîtront après quelques ÉchoMood.'
      : `Du ${formatDate(first.createdAt)} au ${formatDate(latest.createdAt)}, l’Échollection relie tes traces sans en faire une vérité sur toi.`,
  }
}

function getCollectionChanges(history) {
  if (history.length < 2) {
    return { title: 'Premières traces', message: 'Après deux ÉchoMood, tu verras ici ce qui fait écho, revient ou se déplace.' }
  }

  const latest = history[0]
  const previous = history.slice(1)
  const previousIds = new Set(previous.flatMap(entry => (entry.nodes || []).map(node => node.id)))
  const newItems = (latest.nodes || []).filter(node => !previousIds.has(node.id) && node.group !== 'star')
  if (newItems.length > 0) {
    return { title: 'Nouveaux éclats', message: `${formatListWithEmoji(newItems.slice(0, 3))} résonnent dans le dernier ÉchoMood.` }
  }

  const latestSupports = getEntryGroup(latest, 'supports').length
  const averageSupports = previous.reduce((sum, entry) => sum + getEntryGroup(entry, 'supports').length, 0) / previous.length
  if (latestSupports > averageSupports) {
    return { title: 'Plus d’aides', message: 'Ton dernier ÉchoMood fait entendre davantage d’aides que les précédents.' }
  }

  return { title: 'Continuités douces', message: 'Le dernier ÉchoMood semble surtout faire écho à des éléments déjà présents dans ta collection.' }
}

function getGroupTrends(history, group) {
  const counts = new Map()
  history.forEach(entry => {
    const seen = new Set()
    getEntryGroup(entry, group).forEach(node => {
      if (seen.has(node.id)) return
      seen.add(node.id)
      const current = counts.get(node.id) || { ...node, count: 0 }
      counts.set(node.id, { ...current, count: current.count + 1 })
    })
  })

  return [...counts.values()].sort((a, b) => b.count - a.count)
}

function getFeedbackInsights(history) {
  const counts = new Map()
  history.forEach(entry => {
    ;(entry.links || []).forEach(link => {
      if (!link.feedback) return
      const key = `${link.feedback}-${link.question}`
      const current = counts.get(key) || { ...link, count: 0 }
      counts.set(key, { ...current, count: current.count + 1 })
    })
  })

  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
}

function filterHistoryByGroup(history, group) {
  if (group === 'all') return history
  return history.filter(entry => getEntryGroup(entry, group).length > 0)
}

function getEntryGroup(entry, group) {
  return (entry.nodes || []).filter(node => node.group === group)
}

function getClearResonanceQuestionFromNodes(a, b, nodes) {
  const first = nodes.find(node => node.id === a) || { emoji: '•', label: 'Résonance' }
  const second = nodes.find(node => node.id === b) || { emoji: '•', label: 'Résonance' }
  return `Quel lien fais-tu entre ${first.emoji} ${first.label} et ${second.emoji} ${second.label} en ce moment ?`
}


function getRecurringItems(history, limit = 3) {
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
    .slice(0, limit)
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

function getClearResonanceQuestion(a, b, customItems) {
  const first = findNodeLabel(a, customItems)
  const second = findNodeLabel(b, customItems)
  return `Quel lien fais-tu entre ${first.emoji} ${first.label} et ${second.emoji} ${second.label} en ce moment ?`
}


function findNodeLabel(id, customItems = {}) {
  for (const step of STEPS) {
    const found = getStepItems(step, customItems).find(item => item[0] === id)
    if (found) return { emoji: found[1], label: found[2] }
  }
  return { emoji: '•', label: 'Résonance' }
}

function exportEchoMood(entry) {
  const blob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `echomood-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function getCustomItemsForStep(customItems = EMPTY_CUSTOM_ITEMS, stepId) {
  const rawItems = customItems?.[stepId]
  if (!rawItems) return []
  return Array.isArray(rawItems) ? rawItems : [rawItems]
}

function getStepItems(step, customItems = EMPTY_CUSTOM_ITEMS) {
  if (!step) return []

  const customItemsForStep = getCustomItemsForStep(customItems, step.id).slice(0, MAX_CUSTOM_ITEMS_PER_STEP)
  const addCustomItem = [`add-${step.id}`, '➕', 'Autre', 'add-custom']
  const maxItems = step.single ? MAX_VISIBLE_STAR_ITEMS : MAX_VISIBLE_ITEMS
  const suggestedItems = step.items.slice(0, maxItems)
  const customBubbles = customItemsForStep.map(item => [item.id, item.emoji, item.label, 'custom'])
  const canAddMore = customItemsForStep.length < MAX_CUSTOM_ITEMS_PER_STEP

  return [
    ...suggestedItems,
    ...customBubbles,
    ...(canAddMore ? [addCustomItem] : []),
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
  const activeSet = new Set(activeIds)
  return RESONANCES
    .filter(([a, b]) => activeSet.has(a) && activeSet.has(b))
    .sort((left, right) => getLinkScore(right, answers) - getLinkScore(left, answers))
}

function getLinkScore([a, b], answers) {
  return (answers[a] || 1) + (answers[b] || 1)
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function exportCollection(history) {
  const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `echomood-collection-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
