import { Component, lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { experience, profile, projects, skills } from './data'

const Scene = lazy(() => import('./Scene'))
const SECTIONS = ['Home', 'Work', 'History', 'Tools']
const pad = (i) => String(i + 1).padStart(2, '0')

// The copy is plain HTML, so the page still works if WebGL doesn't.
class NoWebGL extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

// Children rise in one after another; `i` is their order.
const rise = (i) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
})

function Home({ go }) {
  return (
    <section className="home">
      <motion.p className="label" {...rise(0)}>
        {profile.role} — {profile.location}
      </motion.p>
      <motion.h1 {...rise(1)}>
        {profile.firstName}
        <br />
        {profile.name.replace(profile.firstName, '').trim()}
        <span className="dot">.</span>
      </motion.h1>
      <motion.div className="home-foot" {...rise(2)}>
        <p>{profile.about}</p>
        <button className="cta" onClick={() => go(1)}>
          See work <span aria-hidden>→</span>
        </button>
      </motion.div>
    </section>
  )
}

const MORPH = { layout: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }
const reveal = {
  hide: { opacity: 0, y: 32, transition: { duration: 0.2 } },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const run = (cmds) => cmds.map((c) => (c.startsWith('#') ? c : `$ ${c}`)).join('\n')

// One project's case study. Keyed by project, so its tab resets when you switch projects.
function CaseStudy({ p }) {
  const tabs = [
    ['Highlights', () => (
      <ul className="highlights">
        {p.highlights.map((h) => <li key={h}>{h}</li>)}
      </ul>
    )],
    ['How it works', () => (
      <ol className="steps">
        {p.flow.map((s, i) => (
          <li key={s}><span className="idx">{pad(i)}</span>{s}</li>
        ))}
      </ol>
    )],
    ['Tech stack', () => (
      <dl className="stack">
        {p.stack.map(([layer, tech]) => (
          <div key={layer}><dt>{layer}</dt><dd>{tech}</dd></div>
        ))}
      </dl>
    )],
    p.run && ['Run it', () => <pre className="run">{run(p.run)}</pre>],
    // narrated, so no muted autoplay: the viewer presses play with sound on
    p.video && ['Demo', () => (
      <video className="demo" src={p.video} poster={p.poster} controls preload="metadata" playsInline />
    )],
  ].filter(Boolean)
  const [tab, setTab] = useState(0)

  return (
    <motion.div
      className="view-body"
      initial="hide"
      animate="show"
      exit="hide"
      variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } } }}
    >
      <motion.p className="label" variants={reveal}>{p.kind}</motion.p>
      <motion.h2 variants={reveal}>{p.title}</motion.h2>
      <motion.p className="lead" variants={reveal}>{p.pitch}</motion.p>

      <motion.dl className="stats" variants={reveal}>
        {p.stats.map(([value, label]) => (
          <div key={label}><dt>{value}</dt><dd>{label}</dd></div>
        ))}
      </motion.dl>

      <motion.div className="tabbar" variants={reveal}>
        <div role="tablist" aria-label={`${p.title} details`}>
          {tabs.map(([name], i) => (
            <button key={name} role="tab" aria-selected={i === tab} onClick={() => setTab(i)}>
              {name}
              {i === tab && <motion.span layoutId="tab-underline" className="underline" />}
            </button>
          ))}
        </div>
        <div className="actions">
          {p.demo && <a className="link" href={p.demo} target="_blank" rel="noreferrer">Watch demo ↗</a>}
          {p.url ? (
            <a className="cta" href={p.url} target="_blank" rel="noreferrer">
              View on GitHub <span aria-hidden>↗</span>
            </a>
          ) : (
            <span className="meta">Private repo</span>
          )}
        </div>
      </motion.div>

      <motion.div variants={reveal} className="panel" role="tabpanel">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {tabs[tab][1]()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// Full-screen project view; the card morphs into it through the shared layoutId.
function ProjectView({ index, setIndex, onClose }) {
  const p = projects[index]
  const n = projects.length
  const at = (d) => (index + d + n) % n

  useEffect(() => {
    const opener = document.activeElement
    // Capture phase, so App's section keys and wheel never see these while the view is open.
    const onKey = (e) => {
      e.stopPropagation()
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % n)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + n) % n)
    }
    const onWheel = (e) => e.stopPropagation()
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('wheel', onWheel, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('wheel', onWheel, true)
      opener?.focus?.()
    }
  }, [n, onClose, setIndex])

  return (
    <motion.div
      layoutId="project"
      className="view"
      style={{ borderRadius: 0 }}
      transition={MORPH}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
    >
      <div className="view-top">
        <span className="label">Project {pad(index)} / {pad(n - 1)}</span>
        <button className="link" onClick={onClose} autoFocus>Close ✕</button>
      </div>

      <AnimatePresence mode="wait">
        <CaseStudy key={index} p={p} />
      </AnimatePresence>

      <div className="view-foot">
        <button className="link" onClick={() => setIndex(at(-1))}>← {projects[at(-1)].title}</button>
        <button className="link" onClick={() => setIndex(at(1))}>{projects[at(1)].title} →</button>
      </div>
    </motion.div>
  )
}

function Work() {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const [opened, setOpened] = useState(false)
  const p = projects[active]
  const show = (i) => {
    setActive(i)
    setOpened(true)
    setOpen(true)
  }
  const close = useCallback(() => setOpen(false), [])

  return (
    <section className="work">
      <div className="list">
        <motion.p className="label" {...rise(0)}>Selected work</motion.p>
        <ol>
          {projects.map((project, i) => (
            <motion.li key={project.title} {...rise(i + 1)} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}>
              <button className={i === active ? 'item on' : 'item'} onClick={() => show(i)}>
                <span className="idx">{pad(i)}</span>
                <span>
                  <span className="title">{project.title}</span>
                  <span className="meta">{project.kind}</span>
                </span>
              </button>
            </motion.li>
          ))}
        </ol>
      </div>

      {createPortal(
        <AnimatePresence>
          {open && <ProjectView key="view" index={active} setIndex={setActive} onClose={close} />}
        </AnimatePresence>,
        document.body,
      )}

      {!open && (
      <motion.aside
        layoutId="project"
        className="detail"
        style={{ borderRadius: 20 }}
        transition={MORPH}
        // After the first open, skip the entrance so the card only morphs back.
        initial={opened ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0, transition: { delay: opened ? 0 : 0.33, duration: 0.6 } }}
        onClick={() => show(active)}
        aria-live="polite"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="label">
              {pad(active)} / {pad(projects.length - 1)} — {p.kind}
            </p>
            <h2>{p.title}</h2>
            <p className="lead">{p.text}</p>
            <ul className="chips">
              {p.tags.map((t) => <li key={t}>{t}</li>)}
            </ul>
            <button className="cta">
              Open project <span aria-hidden>→</span>
            </button>
          </motion.div>
        </AnimatePresence>
      </motion.aside>
      )}
    </section>
  )
}

// Total time since the earliest start date ("Feb 2022 — ..."), so it stays current without edits.
function totalExperience() {
  const start = Math.min(...experience.map((j) => new Date(`1 ${j.period.split(' — ')[0]}`).getTime()))
  const months = Math.floor((Date.now() - start) / (30.44 * 24 * 3600 * 1000))
  const y = Math.floor(months / 12)
  const m = months % 12
  return `${y} yr${y === 1 ? '' : 's'}${m ? ` ${m} mo${m === 1 ? '' : 's'}` : ''}`
}

function History() {
  return (
    <section className="list right">
      <motion.p className="label" {...rise(0)}>Experience</motion.p>
      <motion.p className="total" {...rise(0)}>
        <strong>{totalExperience()}</strong> building for the web
      </motion.p>
      <ol>
        {experience.map((job, i) => (
          <motion.li key={job.period} {...rise(i + 1)}>
            <div className="item">
              <span className="idx">{pad(i)}</span>
              <span>
                <span className="meta">{job.period}</span>
                <span className="title">{job.role}</span>
                <span className="meta">{job.company}</span>
                <span className="desc show">{job.text}</span>
              </span>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  )
}

function Tools() {
  return (
    <section className="tools">
      <motion.p className="label" {...rise(0)}>Toolbox</motion.p>
      <div className="grid">
        {Object.entries(skills).map(([group, list], i) => (
          <motion.div key={group} {...rise(i + 1)}>
            <p className="meta">{pad(i)} — {group}</p>
            <ul>
              {list.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default function App() {
  const [section, setSection] = useState(0)
  const n = SECTIONS.length
  const go = (i) => setSection(((i % n) + n) % n)

  useEffect(() => {
    let last = 0
    const step = (d) => setSection((s) => ((s + d) % n + n) % n)
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') step(1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') step(-1)
    }
    // The page never scrolls, so a wheel flick moves one section instead.
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) < 30 || e.timeStamp - last < 900) return
      last = e.timeStamp
      step(Math.sign(e.deltaY))
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
    }
  }, [n])

  const pages = [<Home go={go} key="0" />, <Work key="1" />, <History key="2" />, <Tools key="3" />]

  return (
    <>
      <div className="stage" aria-hidden>
        <NoWebGL>
          <Suspense fallback={null}>
            <Scene section={section} />
          </Suspense>
        </NoWebGL>
      </div>

      <header>
        <button className="mark" onClick={() => go(0)} aria-label="Home">RY</button>
        <nav>
          {SECTIONS.slice(1).map((s, i) => (
            <button key={s} onClick={() => go(i + 1)} aria-current={section === i + 1 ? 'page' : undefined}>
              {s}
            </button>
          ))}
        </nav>
      </header>

      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            className="page"
            exit={{ opacity: 0, y: -16, transition: { duration: 0.3 } }}
          >
            {pages[section]}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer>
        <div className="social">
          <a href={profile.links.github} target="_blank" rel="noreferrer">GitHub</a>
          <a href={profile.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          {/* CC BY 4.0 requires the credit */}
          <a href="https://sketchfab.com/3d-models/tesla-roadster-2020-wwwvecarzcom-fac3d813620f4c4a95da1933c2592069" target="_blank" rel="noreferrer">Roadster model: vecarz, CC BY</a>
        </div>
        <div className="pager">
          <button onClick={() => go(section - 1)} aria-label="Previous section">←</button>
          <span>{pad(section)}</span>
          <span className="track"><span style={{ width: `${((section + 1) / n) * 100}%` }} /></span>
          <span>{pad(n - 1)}</span>
          <button onClick={() => go(section + 1)} aria-label="Next section">→</button>
        </div>
      </footer>
    </>
  )
}
