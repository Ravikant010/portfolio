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
    text: 'Search your own photo library in plain language, in any language. Runs fully on your machine with EmbeddingGemma 2.',
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
    video: '/memora-demo.mp4',
    poster: '/memora-poster.jpg',
    tags: ['Python', 'FastAPI', 'EmbeddingGemma 2', 'HTMX'],
    url: 'https://github.com/Ravikant010/memora',
    demo: 'https://drive.google.com/file/d/1_0xsjTRdx0fb3K1t4V2As_ESU6H-S3Qy/view?usp=sharing',
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
  {
    title: 'Zeeshop',
    kind: 'Full-stack e-commerce',
    text: 'A Next.js fashion store with 825 real products, hand-built auth, a Postgres order system and Stripe checkout.',
    pitch:
      'A full-stack fashion store on the Next.js App Router, with 825 real menswear products across 134 brands. It has hand-built authentication, a Postgres order system and Stripe checkout, and a layered architecture that keeps data access, business logic and UI apart.',
    stats: [
      ['825', 'real products'],
      ['134', 'brands · 34 categories'],
      ['12', 'Postgres tables'],
      ['23', 'pages + API routes'],
    ],
    highlights: [
      'Hand-built auth on Lucia v3: database-backed cookie sessions, PBKDF2-SHA512 salted password hashing, and Google OAuth with state + PKCE checks.',
      'Stripe Payment Element checkout: server-created PaymentIntent with zod-validated input, Stripe Customer reuse with billing address, signature-verified webhook.',
      '12-table Drizzle schema covering users, OAuth accounts, sessions, addresses, carts, orders with a status-lifecycle enum, order items and payments.',
      'Verification and password-reset emails built in React Email and sent through Resend; resets run in a DB transaction and are rate-limited per IP.',
      'Layered architecture (data-access → use-cases → server actions) keeps business logic out of components.',
      'Accessible, responsive UI with shadcn/ui + Radix, react-hook-form + zod, and a Framer Motion mega-menu.',
    ],
    flow: [
      'Server components render category, brand and product pages from JSON API routes',
      'Sign-in creates a Lucia session stored in Postgres and set as a secure cookie',
      'The cart is saved per user in Postgres',
      'Checkout validates the order with zod, writes the order rows and creates a Stripe PaymentIntent',
      'Stripe Payment Element confirms the payment; the success page verifies its status on the server',
    ],
    stack: [
      ['Framework', 'Next.js 14 App Router · TypeScript · server actions'],
      ['Auth', 'Lucia v3 · PBKDF2-SHA512 · Google OAuth (arctic, PKCE)'],
      ['Data', 'PostgreSQL on Supabase · Drizzle ORM'],
      ['Payments', 'Stripe PaymentIntents · Payment Element · webhooks'],
      ['Email', 'React Email · Resend'],
      ['UI', 'shadcn/ui · Radix · Tailwind · react-hook-form + zod'],
    ],
    run: ['npm install', '# .env: Supabase, Stripe, Resend and Google OAuth keys', 'npm run dev'],
    tags: ['Next.js', 'TypeScript', 'Stripe', 'PostgreSQL'],
    url: 'https://github.com/Ravikant010/zeeshop',
    demo: 'https://drive.google.com/file/d/1LRCJwFpwWr6fVPe_AnUQyACeJXoSPHcr/view',
  },
  {
    title: 'Myntra Scraper',
    kind: 'Data engineering · web crawling',
    text: 'A crawler that reads a JavaScript-heavy store like a person does and turns it into clean, structured product data.',
    pitch:
      'A crawler that reads a JavaScript-heavy storefront the way a person does. It discovers categories from the live navbar, opens every product in a real browser, and clicks through to hidden spec tables and reviews. Everything comes out as clean, structured JSON for pricing analysis.',
    stats: [
      ['839', 'products collected'],
      ['138', 'brands'],
      ['5,531', 'user reviews'],
      ['19', 'fields per product'],
    ],
    highlights: [
      'Hybrid crawler: Scrapy for discovery, Selenium driving Firefox for JavaScript-rendered pages, Beautiful Soup for parsing.',
      'Deep crawl per product: listing card → product page → click-revealed spec table → reviews page, merged into one record.',
      'Collected 839 products across 35 menswear categories: 138 brands, 5,531 reviews and 3,290 image URLs.',
      'Nested output: key/value spec tables (about 7 per product) and review objects with text, author, date and photos.',
      'Field-level fallbacks and explicit Selenium waits: 100% coverage on brand, ID, seller and images; 99%+ on price, specs and sizes.',
      'Respects robots.txt.',
    ],
    flow: [
      'Scrapy loads the homepage and extracts every category link from the navbar',
      'Selenium opens each category in Firefox and lets the JavaScript render',
      'Beautiful Soup reads the product cards, then each product page is opened',
      'The crawler clicks "more details" and the reviews link, waiting for each to load',
      'Everything is merged into a 19-field record and written to <category>.json',
    ],
    stack: [
      ['Crawl', 'Scrapy · XPath'],
      ['Browser', 'Selenium · Firefox WebDriver · explicit waits'],
      ['Parse', 'Beautiful Soup · regex for CSS background images'],
      ['Data', 'Nested JSON per category · Node.js merge helper'],
    ],
    run: ['pip install scrapy selenium beautifulsoup4', 'cd crawler/crawler/spiders', 'scrapy crawl myntra_navbar_spider'],
    tags: ['Python', 'Scrapy', 'Selenium'],
    url: 'https://github.com/Ravikant010/srcaping',
    demo: 'https://drive.google.com/file/d/1rGHyiJg4oWTzR00dDqXrBJ9P2rtl6w3O/view',
  },
  {
    title: 'PDF Merge Tool',
    kind: 'Web utility',
    text: 'Drop in any number of PDFs and get back one file, with a bookmark for every original that jumps to the right page.',
    pitch:
      'A focused web tool that does one job well. Drop in any number of PDFs and get back one file with a numbered bookmark for every original, each pointing at the right page. Bad input gets a clear error instead of a crash.',
    stats: [
      ['N → 1', 'PDFs per merge'],
      ['1 / file', 'auto bookmarks'],
      ['5', 'error paths, clean JSON'],
      ['0', 'front-end dependencies'],
    ],
    highlights: [
      'Merges any number of PDFs in one request. Tested live: 3 files in, one 6-page PDF out, page order kept.',
      'Builds a numbered bookmark per source file, each pointing at the correct start page.',
      'Streams uploads in chunks to temp files and cleans them up on success and failure; tested, none left behind.',
      'Clean JSON errors with proper status codes: too few files, non-PDF and corrupt PDF (400), wrong method (405), unexpected (500).',
      'Dependency-free vanilla-JS drag-and-drop UI: drop-zone highlight, file list with sizes and remove, spinner, Blob download.',
    ],
    flow: [
      'Files are dropped onto the page and filtered to PDFs in the browser',
      'fetch() posts them as multipart form data to /merge/',
      'Django checks for at least two PDFs and streams each to a temp file',
      'PyPDF2 appends them in order, adding a numbered bookmark per file',
      'The merged PDF comes back as merged_pdf_<timestamp>.pdf and downloads as a Blob',
    ],
    stack: [
      ['Backend', 'Python · Django'],
      ['PDF', 'PyPDF2 PdfMerger · outlines'],
      ['Files', 'Chunked uploads · tempfile cleanup'],
      ['Frontend', 'Vanilla JS · Drag and Drop API · fetch + Blob'],
    ],
    run: ['pip install django PyPDF2', 'python manage.py migrate', 'python manage.py runserver'],
    tags: ['Python', 'Django', 'PyPDF2'],
    url: 'https://github.com/Ravikant010/pdf-merger',
  },
]

export const skills = {
  Languages: ['TypeScript', 'JavaScript', 'Python', 'SQL'],
  Frontend: ['React', 'Next.js', 'Redux', 'Zustand', 'Tailwind CSS'],
  Backend: ['Node.js', 'Express', 'Django', 'Hono', 'Elysia'],
  Data: ['PostgreSQL', 'MongoDB', 'Redis', 'Prisma', 'Drizzle'],
  Cloud: ['Docker', 'AWS', 'DigitalOcean', 'GitHub Actions', 'Nginx'],
}
