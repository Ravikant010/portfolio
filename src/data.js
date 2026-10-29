export const profile = {
  name: 'Ravikant Yadav',
  firstName: 'Ravikant',
  location: 'Based in India',
  role: 'Full-Stack Developer',
  tagline: 'Code · AI · Systems',
  about:
    'I build web products with Python and JavaScript, from the API through to the screen.',
  links: {
    github: 'https://github.com/Ravikant010',
    linkedin: 'https://linkedin.com/in/ravikantyadav435',
    site: 'https://ravikant.live',
  },
}

export const experience = [
  {
    role: 'Python Full-Stack Developer',
    company: 'Ethara AI',
    period: 'Mar 2026 — Present',
    text: 'Python products, model work, and the evaluations that check them.',
  },
  {
    role: 'Full-Stack Developer',
    company: 'Ekarth Ventures Pvt Ltd, Delhi',
    period: 'Mar 2024 — Mar 2026',
    text: 'Features, APIs, and deploys for the product.',
  },
  {
    role: 'Full-Stack Developer & MERN Stack Trainer',
    company: 'TGC Animation, Badatya Pvt. Ltd, CETPA Infotech',
    period: 'Feb 2022 — Sep 2024',
    text: 'Taught React, Node, and MongoDB, and sat with students while they shipped projects.',
  },
]

// Every claim below was checked against the project's code (and run where safe), Oct 2026.
// Don't add README-only features: Ringer's Elasticsearch/Redis/Prometheus/Nginx and Zeeshop's
// "personalised recommendations" are provisioned or described but not implemented.
export const projects = [
  {
    title: 'Memora',
    kind: 'Private AI photo search',
    text: 'Find any photo by describing it, in English, Hindi or any other language. Runs entirely on your machine with EmbeddingGemma 2.',
    pitch:
      'Google-Photos-style search for your own library, without the cloud. Type "dog on a beach at sunset", or the same thing in Hindi, and Memora finds the matching photos without tags or captions, because text and images share one embedding space. Every photo stays on your machine.',
    stats: [
      ['5,000', 'photos indexed in demo'],
      ['256-d', 'Matryoshka vectors'],
      ['< 1 s', 'test suite, no model'],
      ['0', 'photos uploaded'],
    ],
    highlights: [
      'Text and images go into one EmbeddingGemma 2 vector space, so plain-language and multilingual queries (Hindi, French) match photos directly.',
      'Loads only the text + vision encoders (audio tower skipped), picks CUDA → Apple MPS → CPU automatically, and uses bf16/fp32 to avoid a known fp16 NaN issue.',
      'Matryoshka embeddings truncated to 256 dims and L2-normalised, so cosine search is one NumPy matrix-vector product over a cached in-memory index.',
      'Incremental indexer re-embeds only new or modified files and prunes deleted ones, upserting float32 vectors into SQLite.',
      'Search-as-you-type with FastAPI + HTMX (400 ms debounce): one route serves an HTMX partial or a full, shareable page.',
      'Built to be tested: a Protocol-based embedder and FastAPI dependency overrides run the suite in under a second without the 1.5 GB model.',
    ],
    flow: [
      'The indexer walks the library and spots new, changed and deleted photos',
      'EmbeddingGemma 2 turns each image into a normalised 256-d vector, in batches',
      'Vectors are upserted into SQLite and cached as a single NumPy matrix',
      'Your query is embedded into the same space with the SearchQuery prompt',
      'One matrix-vector product scores every photo; the top 24 stream back via HTMX',
    ],
    stack: [
      ['Model', 'EmbeddingGemma 2 · sentence-transformers · PyTorch (CUDA / MPS / CPU)'],
      ['API', 'FastAPI · dependency injection · pydantic-settings'],
      ['Search', 'NumPy cosine over a cached matrix · SQLite vector store'],
      ['UI', 'Jinja2 server rendering · HTMX · vanilla-JS lightbox'],
      ['Tests', 'pytest · fake embedder via Protocol'],
    ],
    run: ['uv sync', 'cp .env.example .env   # set GG_PHOTOS_DIR', 'uv run python -m app.indexer', 'uv run uvicorn app.main:app'],
    video: '/memora-explainer.mp4', // narrated explainer, also on Drive (linked from the repo README)
    poster: '/memora-explainer-poster.jpg',
    tags: ['Python', 'FastAPI', 'EmbeddingGemma 2', 'HTMX'],
    url: 'https://github.com/Ravikant010/memora',
  },
  {
    title: 'Ringer',
    kind: 'Event-driven social platform',
    text: 'A social network built like a production backend: 10 TypeScript microservices, a database per service, and Kafka events between them.',
    pitch:
      'A social network built the way large platforms build their backends. Ten separately deployable TypeScript services each own their own Postgres database and coordinate through Kafka events instead of calling each other. Real-time chat, full-text search and retention analytics sit on top.',
    stats: [
      ['10', 'microservices'],
      ['65', 'REST endpoints'],
      ['22', 'tables across 10 DBs'],
      ['27', 'containers, one command'],
    ],
    highlights: [
      'Database per service: 22 Drizzle tables split across 10 isolated Postgres instances, so services scale and fail independently.',
      'Event-driven core on Kafka (Redpanda): comments, likes and follows publish 10 event types, consumed by notification and post services in their own consumer groups.',
      'Eventually consistent counters: comment-service emits count deltas and post-service applies them with a clamped, atomic SQL update.',
      'Production-style auth: bcrypt, access + refresh JWTs with separate secrets, per-session refresh rotation, revocation on logout and password change, rate-limited login.',
      'Real-time chat on Socket.IO with presence, delivery and read receipts, and typing indicators.',
      'Postgres full-text search ranked with ts_rank_cd, and analytics SQL with window-function retention (7-day DAU moving average).',
      'CI/CD: GitHub Actions deploys to AWS EC2 and health-checks every service; container startup is gated by 13 healthchecks.',
    ],
    flow: [
      'A request reaches the service that owns it; zod validates it and the JWT is verified locally',
      'The service writes only to its own Postgres; likes stay idempotent via a unique constraint',
      'It publishes an event such as comment.created or post.liked to Kafka',
      'notification-service consumes it and notifies the right user',
      'post-service consumes count deltas and updates counters, so no service waits on another',
    ],
    stack: [
      ['Services', 'TypeScript · Node / Bun · Express 5 · zod · helmet · winston'],
      ['Events', 'Kafka (Redpanda) · kafkajs · consumer groups · backoff retries'],
      ['Data', 'PostgreSQL 15 × 10 · Drizzle ORM + migrations'],
      ['Real-time', 'Socket.IO · presence · receipts'],
      ['Auth', 'JWT access / refresh · bcrypt · express-rate-limit'],
      ['Ops', 'Docker Compose (27 containers) · healthchecks · GitHub Actions → EC2'],
    ],
    run: ['cp .env.example .env', 'docker-compose up --build'],
    tags: ['TypeScript', 'Kafka', 'PostgreSQL', 'Docker'],
    url: 'https://github.com/Ravikant010/ringer_backend_microservice',
  },
]

export const skills = {
  Languages: ['TypeScript', 'JavaScript', 'Python', 'SQL'],
  Frontend: ['React', 'Next.js', 'Redux', 'Zustand', 'Tailwind CSS'],
  Backend: ['Node.js', 'Express', 'Django', 'Hono', 'Elysia'],
  Data: ['PostgreSQL', 'MongoDB', 'Redis', 'Prisma', 'Drizzle'],
  Cloud: ['Docker', 'AWS', 'DigitalOcean', 'GitHub Actions', 'Nginx'],
}
