import { useState } from 'react'
import './index.css'
import { STEPS } from './data/steps'
import { RESONANCES } from './data/resonances'

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
  { id: 'inside', label: 'Climats' },
  { id: 'supports', label: 'Refuges' },
  { id: 'missing', label: 'Besoins' },
  { id: 'star', label: 'Astres' },
]

const GROUP_LABELS = [
  { id: 'star', label: 'Astre à explorer' },
  { id: 'world', label: 'Astres du quotidien' },
  { id: 'inside', label: 'Climats' },
  { id: 'supports', label: 'Satellites-refuges' },
  { id: 'missing', label: 'Besoins' },
]


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
          customCount={getCustomItemsForStep(customItems, customModalStep).length}
          onCancel={() => setCustomModalStep(null)}
          onSave={item => saveCustomItem(customModalStep, item)}
        />
      )}
    </main>
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
    return { size: 'clamp(72px, 18vw, 112px)', emojiSize: 'clamp(28px, 7.4vw, 42px)', labelSize: 'clamp(10px, 2.8vw, 12px)' }
  }

  if (total <= 8) {
    return { size: 'clamp(62px, 15.5vw, 96px)', emojiSize: 'clamp(24px, 6.4vw, 36px)', labelSize: 'clamp(9px, 2.4vw, 11px)' }
  }

  return { size: 'clamp(52px, 13vw, 82px)', emojiSize: 'clamp(21px, 5.6vw, 31px)', labelSize: 'clamp(8px, 2.1vw, 10px)' }
}

function getCenterBubblePosition() {
  return { left: '50%', top: '50%', delay: '.2s' }
}

function getBubblePosition(index, total) {
  if (total <= 1) return { left: '50%', top: '18%', delay: '0s' }

  const ringCount = Math.max(1, total)
  const angle = (-90 + (360 / ringCount) * index) * Math.PI / 180
  const radiusX = ringCount > 7 ? 39 : 34
  const radiusY = ringCount > 7 ? 36 : 32
  return {
    left: `${50 + Math.cos(angle) * radiusX}%`,
    top: `${50 + Math.sin(angle) * radiusY}%`,
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
  const [currentEntry, setCurrentEntry] = useState(() => createKosmojiEntry(nodes, links))
  const [feedback, setFeedback] = useState(() => getFeedbackMap(currentEntry))
  const [history, setHistory] = useState(() => saveKosmoji(currentEntry))

  const recurringItems = getRecurringItems(history)

  function chooseFeedback(key, value) {
    setFeedback(prev => ({ ...prev, [key]: value }))
    setCurrentEntry(prev => {
      const updated = {
        ...prev,
        links: (prev.links || []).map(link => link.key === key ? { ...link, feedback: value } : link),
      }
      setHistory(updateSavedKosmoji(updated))
      return updated
    })
  }

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

          {links.map(([a, b, question], i) => {
            const key = `${a}-${b}-${i}`
            return (
              <div className="question-card" key={key}>
                <strong>Résonance possible</strong>
                <div className="pair">{formatNodePair(a, b, customItems)}</div>
                <p>{getResonanceQuestion(a, b, customItems, question)}</p>
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

        <section className="collection-card">
          <p className="kicker">Collection de Kosmoji</p>
          <h2>Observatoire des résonances</h2>
          <p>Retrouve tes Kosmoji précédents, les résonances qui reviennent souvent et l'évolution de ton Kosmos intérieur.</p>
          <button className="primary" onClick={onOpenDashboard}>Ouvrir l’Observatoire</button>
        </section>

        <div className="final-actions">
          <button className="primary" onClick={onReset}>Terminer</button>
          <button className="secondary" onClick={onOpenDashboard}>Voir ma collection</button>
          <button className="secondary" onClick={() => exportKosmoji(currentEntry)}>Exporter ce Kosmos</button>
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

function RecurringLandscape({ items, title = 'Ce qui revient dans ton Kosmos intérieur' }) {
  return (
    <section className="recurring-card">
      <p className="kicker">Collection de Kosmoji</p>
      <h2>{title}</h2>
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
  const [history, setHistory] = useState(() => getSavedKosmoji())
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
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    setHistory([])
    setSelectedId(null)
  }

  return (
    <main className="app reveal-page">
      <section className="reveal-card observatory">
        <p className="kicker">Observatoire des résonances</p>
        <h1>Collection de Kosmoji</h1>
        <p className="soft">Tes Kosmoji restent dans ce navigateur. Tu peux les relire, repérer ce qui revient, ce qui change et les ressources qui t’accompagnent.</p>

        <section className="safety-card">
          <strong>Cadre d’utilisation</strong>
          <p>Kosmoji est un support de dialogue, pas un diagnostic ni un avis médical. Les données restent dans ce navigateur : rien n’est envoyé, tu peux exporter ou effacer à tout moment.</p>
        </section>

        <section className="observatory-grid">
          <article className="insight-card accent">
            <p className="kicker">Vue d’ensemble</p>
            <h2>{overview.count} Kosmoji</h2>
            <p>{overview.message}</p>
          </article>
          <article className="insight-card">
            <p className="kicker">Ce qui change</p>
            <h2>{changes.title}</h2>
            <p>{changes.message}</p>
          </article>
        </section>

        {recurringItems.length > 0 && <RecurringLandscape items={recurringItems} title="Ce qui revient souvent" />}

        <section className="insight-card resources-card">
          <p className="kicker">Carte des ressources</p>
          <h2>Ce qui semble t’aider</h2>
          {resourceItems.length === 0 && <p className="soft-left">Les satellites-refuges fréquents apparaîtront ici après plusieurs Kosmoji.</p>}
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
          {feedbackInsights.length === 0 && <p className="soft-left">Quand tu réponds “Ça résonne”, “Pas aujourd’hui” ou “Je ne sais pas”, l’Observatoire gardera ces pistes pour les relire.</p>}
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

          {filteredHistory.length === 0 && <p className="soft">Aucun Kosmoji enregistré pour ce filtre.</p>}

          {filteredHistory.map(entry => (
            <KosmojiHistoryCard
              entry={entry}
              expanded={selectedId === entry.id}
              key={entry.id}
              onToggle={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
            />
          ))}
        </section>


        <div className="final-actions">
          <button className="primary" onClick={onBack}>Revenir au Kosmos du jour</button>
          <button className="secondary" onClick={() => exportCollection(history)} disabled={history.length === 0}>Exporter la collection</button>
          <button className="secondary danger" onClick={clearHistory} disabled={history.length === 0}>Effacer</button>
        </div>
      </section>
    </main>
  )
}

function KosmojiHistoryCard({ entry, expanded, onToggle }) {
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
      {expanded && <KosmojiDetail entry={entry} compact />}
    </article>
  )
}

function KosmojiDetail({ entry, compact = false }) {
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

const STORAGE_KEY = 'kosmoji-collection'
const LEGACY_STORAGE_KEY = 'echomood-history'

function createKosmojiEntry(nodes, links) {
  return {
    id: `kosmoji-${Date.now()}`,
    createdAt: new Date().toISOString(),
    nodes: nodes.map(({ id, emoji, label, group, level }) => ({ id, emoji, label, group, level })),
    links: links.map(([a, b, question], index) => ({
      a,
      b,
      question: getResonanceQuestionFromNodes(a, b, nodes, question),
      key: `${a}-${b}-${index}`,
    })),
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


function updateSavedKosmoji(entry) {
  if (typeof window === 'undefined') return []

  const previous = getSavedKosmoji()
  const next = previous.map(item => item.id === entry.id ? entry : item)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

function getFeedbackMap(entry) {
  return Object.fromEntries((entry.links || []).filter(link => link.feedback).map(link => [link.key, link.feedback]))
}

function getCollectionOverview(history) {
  if (!history.length) {
    return { count: 0, message: 'Crée un premier Kosmoji pour commencer à voir une trace de ton Kosmos intérieur.' }
  }

  const first = history[history.length - 1]
  const latest = history[0]
  return {
    count: history.length,
    message: history.length === 1
      ? 'Une première fiche est gardée localement. Les tendances apparaîtront après quelques Kosmoji.'
      : `Du ${formatDate(first.createdAt)} au ${formatDate(latest.createdAt)}, l’Observatoire relie tes traces sans en faire une vérité sur toi.`,
  }
}

function getCollectionChanges(history) {
  if (history.length < 2) {
    return { title: 'Premières traces', message: 'Après deux Kosmoji, tu verras ici ce qui apparaît, revient ou se déplace.' }
  }

  const latest = history[0]
  const previous = history.slice(1)
  const previousIds = new Set(previous.flatMap(entry => (entry.nodes || []).map(node => node.id)))
  const newItems = (latest.nodes || []).filter(node => !previousIds.has(node.id) && node.group !== 'star')
  if (newItems.length > 0) {
    return { title: 'Nouveaux éclats', message: `${formatListWithEmoji(newItems.slice(0, 3))} apparaissent dans le dernier Kosmoji.` }
  }

  const latestSupports = getEntryGroup(latest, 'supports').length
  const averageSupports = previous.reduce((sum, entry) => sum + getEntryGroup(entry, 'supports').length, 0) / previous.length
  if (latestSupports > averageSupports) {
    return { title: 'Plus de refuges', message: 'Ton dernier Kosmoji montre davantage de satellites-refuges que les précédents.' }
  }

  return { title: 'Continuités douces', message: 'Le dernier Kosmoji semble surtout prolonger des éléments déjà présents dans ta collection.' }
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

function getResonanceQuestionFromNodes(a, b, nodes, question) {
  if (question) return question

  const first = nodes.find(node => node.id === a) || { emoji: '•', label: 'Résonance' }
  const second = nodes.find(node => node.id === b) || { emoji: '•', label: 'Résonance' }
  return `Est-ce qu’il pourrait y avoir un lien entre ${first.emoji} ${first.label} et ${second.emoji} ${second.label} aujourd’hui ?`
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

function getResonanceQuestion(a, b, customItems, question) {
  if (question) return question

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

function exportKosmoji(entry) {
  const blob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `kosmoji-${new Date().toISOString().slice(0, 10)}.json`
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
  anchor.download = `kosmoji-collection-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

