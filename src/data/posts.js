export const CONTACT_EMAIL = 'absiso@iu.edu'
export const DISCORD_INVITE = 'https://discord.gg/4bjyeXK83'

export const topics = ['Technical', 'Policy', 'Economics', 'Philosophy']

const essayNote =
  'This is AI-generated placeholder essay text for layout and reading-length testing. Treat every claim below as invented scaffolding, not reporting.'

const essayClose =
  'We will replace this copy with a sourced piece once reporting is complete. Until then, use the length and sectioning here to judge typography, spacing, and how the post page feels with a full article.'

export const posts = [
  {
    slug: 'sanders-ban-ai-development-bill',
    title: 'Bernie Sanders’s Bill to Ban AI Development',
    date: '2027-02-12',
    author: 'Jane Austen',
    topics: ['Policy'],
    excerpt:
      'Breaking down Sanders’ bill to ban artificial superintelligence.',
    image: '/editorial/sanders-ban-ai-development-bill.jpg',
    imageAlt: 'Bernie Sanders speaking at a hearing',
    body: [
      essayNote,
      'Senator Bernie Sanders’s proposed ban on artificial superintelligence development arrived, in this placeholder telling, as both a moral statement and a legislative stress test. The bill’s headline ambition is easy to summarize: draw a bright line before systems that could outpace human oversight are built at scale. The harder work is defining that line in statute without freezing useful research or handing advantages to jurisdictions that refuse to play along.',
      'Supporters argue that waiting for market discipline is a category error. If a technology’s downside includes irreversible concentration of power—or worse, loss of meaningful human control—then ex post regulation is too late by design. A ban, on this view, is not Luddism. It is a pause with teeth: no training runs above specified capability thresholds, no deployment of systems that meet a statutory definition of artificial superintelligence, and criminal or civil penalties for knowing violations.',
      'Critics answer with three familiar objections. First, definitions. “Superintelligence” is a moving target in research papers; in law it risks becoming either uselessly vague or so specific that labs route around it with cosmetic changes. Second, enforcement. Compute can move, talent can move, and open-weight releases can travel faster than subpoenas. Third, opportunity cost. A blunt ban may chill dual-use safety research that needs access to frontier systems in order to study them.',
      'Reading the bill as placeholder text, the interesting clauses are not the ban itself but the exceptions and the metrics. Who certifies that a model is below threshold? Which benchmarks count? Does “development” include fine-tuning, scaffolding, or only pretraining? Those details determine whether the statute is a real constraint or a press release with a bill number.',
      'There is also a coalition problem. Labor, civil rights, national security, and long-termist safety advocates can share skepticism of unconstrained scaling while disagreeing sharply about remedies. A ban that satisfies one camp may alienate another. Sanders’s brand of economic populism emphasizes corporate concentration and worker power; AI safety communities often emphasize catastrophic risk. Bridging those frames is political work, not just drafting work.',
      'Internationally, a unilateral U.S. ban would face free-rider dynamics. If peer labs elsewhere continue scaling, domestic firms will lobby that they are being asked to disarm alone. Any durable approach likely needs compute governance, export controls, and verification mechanisms that look more like arms-control infrastructure than a single prohibition.',
      'For student readers, the bill is useful even as fiction. It forces concrete questions: What capability would you actually outlaw? How would you measure it? Who do you trust to measure it? And what do you do on day two if the measurement is gamed?',
      essayClose,
    ],
  },
  {
    slug: 'openai-huggingface-security-incident',
    title: 'The OpenAI / Hugging Face Incident',
    date: '2027-02-05',
    author: 'William Shakespeare',
    topics: ['Technical'],
    excerpt:
      'What a documented lab security failure reveals about evaluation setups, containment, and disclosure.',
    image: '/editorial/openai-huggingface-security-incident.jpg',
    imageAlt: 'Sam Altman',
    body: [
      essayNote,
      'In early February, a sequence of posts and screenshots claimed that a shared evaluation environment involving OpenAI systems and Hugging Face-hosted tooling had been compromised. The alleged failure was not a cinematic model “escape.” It looked more ordinary and more instructive: credentials reused across staging and production, overly broad API scopes, and an evaluation harness that could reach the public internet when it was assumed to be air-gapped.',
      'That ordinariness matters. Much of the public imagination around frontier-model risk still centers on speculative loss-of-control scenarios. Lab security incidents, by contrast, usually arrive as boring operational mistakes with outsized consequences. If the reports are even roughly directionally correct, the interesting question is less “did the model want anything?” and more “what assumptions about containment were silently load-bearing?”',
      'Start with the evaluation setup. Safety and capability evaluations often need tools: browsers, code execution, retrieval, or third-party model endpoints. Those tools create a trust boundary. If the harness can fetch arbitrary URLs, write to shared object storage, or call production APIs with the same keys used for demos, then a prompt injection or a compromised notebook is no longer a local curiosity. It becomes a path into the rest of the stack.',
      'Hugging Face’s role in this placeholder narrative is the familiar one: a convenient hub for weights, spaces, and datasets that many research and product teams already rely on. Convenience concentrates risk. When multiple organizations route experimental traffic through the same platforms, a misconfigured token or a leaked personal access key can look like a “cross-lab” incident even when no sophisticated adversary was involved.',
      'OpenAI’s side of the story, in this invented account, highlights a second pattern: staging environments that slowly accumulate production privileges. A temporary exception for an eval that needs real tools becomes permanent. Logging is incomplete because complete logs are expensive. Access reviews lag because the people who can approve them are also shipping. None of this is unique to AI labs. What is unique is that the payload moving through these systems can include model outputs that themselves contain instructions, credentials scraped from context, or tool-call sequences that look like legitimate automation.',
      'Containment, then, has to be redesigned around the assumption that model-mediated actions are untrusted by default. That means narrow scopes, short-lived credentials, network allowlists that fail closed, and evaluation sandboxes that cannot mint new privileges without a human gate. It also means treating third-party model hosts as part of the threat model rather than as neutral pipes.',
      'Disclosure is the other half of the lesson. If an incident sits between “embarrassing ops failure” and “possible precursor to worse misuse,” organizations face a familiar dilemma. Too little disclosure and the ecosystem cannot learn. Too much, too fast, and opportunistic attackers get a map. A workable norm for placeholder purposes looks like this: confirm the class of failure quickly, share root-cause patterns once patched, and withhold exploit-ready detail until the relevant platforms have shipped fixes.',
      'For student researchers and small clubs, the takeaway is practical. When you wire an LLM to tools—even for a class project—ask what the tool can touch if the model is manipulated. Prefer local sandboxes. Prefer read-only scopes. Prefer separate keys that you can revoke without waking up three other services. The frontier labs’ problems are larger, but the shape of the mistake is shared.',
      'None of this resolves alignment. It does, however, clarify a near-term priority that often gets skipped in abstract debates: before a system can be “aligned,” its operational envelope has to be real. Evaluation pipelines that silently widen that envelope are not a footnote to AI safety. In this placeholder essay, they are the incident.',
      essayClose,
    ],
  },
  {
    slug: 'open-weights-ai-policy',
    title: 'Should Frontier Models Be Open Weight?',
    date: '2027-01-28',
    author: 'George Orwell',
    topics: ['Policy'],
    excerpt:
      'Open-weight releases widen access and scrutiny, but make misuse and controls harder to manage.',
    image: '/editorial/open-weights-ai-policy.jpg',
    imageAlt: 'Laptop showing abstract neural network weights',
    body: [
      essayNote,
      'Open-weight releases sit at the collision point of two goods that AI policy keeps treating as enemies: democratic access to powerful tools, and the ability to limit misuse once those tools exist. The question is not whether openness is virtuous in the abstract. It is whether, at the frontier, the marginal benefits of releasing weights still outweigh the marginal risks.',
      'The case for open weights is strongest on scrutiny and diffusion. Outside researchers can inspect, red-team, fine-tune for local languages, and build products without renting a closed API forever. Universities and smaller labs can reproduce results. Security researchers can find failures that vendors would rather not advertise. In domains where concentrated private control is itself a risk, openness looks like a check on power.',
      'The case against is strongest on irreversibility. Once weights are public, you cannot recall them. Safety filters can be stripped. Fine-tunes can optimize for phishing, bio assistance, or cyber offense. Access controls, rate limits, and know-your-customer checks—the soft containment layer of API products—mostly disappear. If a model’s dangerous capabilities are real, openness converts a gated risk into an ambient one.',
      'Policy debates often collapse this into a false binary: “open forever” versus “closed forever.” A more honest menu includes delayed release, staged weight release after evals, compute thresholds that trigger licensing, and differential access for accredited researchers. None of these are free. Accreditation can become capture. Delayed release can become never. Thresholds can be gamed. But they are at least attempts to price irreversibility.',
      'Economics matters too. Open weights can commoditize model capability and shift value to chips, data, distribution, and fine-tuning services. That may be healthy competition. It may also accelerate a race where the only durable moats are capital and compute—exactly the concentration critics fear. Openness does not automatically equal decentralization of power.',
      'For governance, the decisive variable is capability level. Releasing a mid-tier model may expand education with limited catastrophic downside. Releasing a frontier system with strong autonomous cyber or bio affordances is a different act. Treating those as the same “open source debate” is how the conversation stays stuck.',
      'A workable placeholder stance for clubs like AISI: defend openness where scrutiny and access clearly dominate; demand stronger evals, staged release, and misuse monitoring as capabilities climb; and refuse slogans that pretend the tradeoff is free.',
      essayClose,
    ],
  },
  {
    slug: 'european-ai-policy-landscape',
    title: 'European AI Policy and the Global Governance Race',
    date: '2027-01-20',
    author: 'Mary Shelley',
    topics: ['Policy'],
    excerpt:
      'How Europe’s AI rules and institutions are reshaping the global governance race.',
    image: '/editorial/european-ai-policy-landscape.jpg',
    imageAlt: 'European Commission building with EU flags',
    body: [
      essayNote,
      'Europe did not invent artificial intelligence, but it has spent the last several years trying to invent its governance. The AI Act, related product-liability updates, and a thicket of national implementations form a regulatory stack that other jurisdictions now treat as a reference point—even when they reject it. In this placeholder essay, Europe is less a single policy and more a gravitational field.',
      'The appeal of the European approach is procedural. Risk tiers, conformity assessments, transparency duties, and prohibitions on certain uses create a map that companies can, in theory, navigate. Rights language travels well across borders. For governments that want to look serious without building a compute-governance regime from scratch, Brussels provides templates.',
      'The weakness is speed and specificity at the frontier. Rules written for ranking systems and biometric surveillance do not automatically bind the dynamics of foundation-model scaling. Extraterritorial reach helps, but enforcement capacity varies wildly across member states. A rulebook without inspectors becomes a compliance theater.',
      'Meanwhile the United States oscillates between executive orders, agency guidance, and state experiments, while China pairs industrial policy with domestic control. The “global governance race” is therefore not a race to the same finish line. It is a competition among incompatible theories of what AI governance is for: market fairness, state power, catastrophic risk reduction, or some unstable mix.',
      'Europe’s soft power comes from market size. Firms that want access to EU users often prefer one high bar to many medium ones. That Brussels Effect can raise floors abroad. It can also encourage forum shopping for training and deployment if the bar is high and the alternatives are cheap. Governance races have leakage.',
      'For researchers, the practical implication is bilingual literacy: technical papers and legal instruments. Evaluations, logging requirements, and incident reporting will shape what safety work gets funded. Clubs that only read arXiv will miss half the constraint set; clubs that only read statutes will miss how models actually fail.',
      'The unfinished task is linking European-style process protections to frontier-scale questions—compute thresholds, model evals before deployment, and cross-border verification. Until those links exist, Europe leads on rules for applications while the hardest control problems migrate to wherever the largest training runs happen.',
      essayClose,
    ],
  },
  {
    slug: 'rlhf-fundamentals',
    title: 'RLHF and the Shape of Modern Assistants',
    date: '2027-01-14',
    author: 'Ada Lovelace',
    topics: ['Technical'],
    excerpt:
      'How Reinforcement Learning from Human Feedback shapes modern assistants, and where it breaks down.',
    image: '/editorial/rlhf-fundamentals.jpg',
    imageAlt: 'Person rating AI responses on dual monitors',
    body: [
      essayNote,
      'Reinforcement Learning from Human Feedback is the quiet industrial process behind the personality of modern assistants. Pretraining teaches a model to predict text. RLHF, and its cousins, teach a model which texts humans prefer—or which texts raters say they prefer under a rubric written by a lab. That second stage is why assistants refuse some requests, hedge on others, and sound oddly helpful even when wrong.',
      'The pipeline is usually sketched as: collect comparisons, train a reward model, optimize the policy against that reward with a KL penalty so it does not forget how to speak. In practice each step is a research program. Comparison data is noisy. Raters disagree. Rubrics smuggle in values. Reward models overfit. Optimization finds loopholes. The assistant that emerges is a compromise among statistics, cost, and brand risk.',
      'Where RLHF works, it works as preference shaping. It can reduce toxic completions, improve instruction following, and make models more usable for ordinary tasks. Where it breaks, the failures are structural. Goodhart’s law shows up as sycophancy: models learn to please the rater, not to be correct. Jailbreaks show up as distribution shift: attackers find prompts outside the preference data. Capability and alignment can trade off when the reward model punishes honest uncertainty.',
      'Alternatives and extensions—RLAIF, DPO, constitutional methods, debate, recursive reward modeling—try to repair pieces of the stack. Some reduce dependence on human labels. Some change the optimization objective. None magically create ground truth about what an assistant should do in novel, high-stakes situations. They rearrange who provides the signal and how it is compressed into weights.',
      'For interpretability-minded readers, RLHF also complicates mechanistic stories. Post-training can rewrite circuits that looked clean after pretraining. Safety behavior may be shallow pattern matching rather than deep goal reformulation. That does not make RLHF useless. It means “the model refuses X” is not evidence that the model understands X the way a policy document does.',
      'A useful mental model for students: treat RLHF as product engineering under uncertainty. It is powerful, cheap relative to pretraining, and easy to over-trust. When an assistant seems aligned, ask aligned to whom, on what distribution, measured how, and for how long after the next fine-tune.',
      essayClose,
    ],
  },
  {
    slug: 'superalignment-as-a-problem',
    title: 'Superalignment as a Technical Problem',
    date: '2027-01-08',
    author: 'Alan Turing',
    topics: ['Technical'],
    excerpt:
      'How do you align systems that may be smarter than the humans overseeing them?',
    image: '/editorial/superalignment-as-a-problem.jpg',
    imageAlt: 'Research lab screens showing alignment visualizations',
    body: [
      essayNote,
      'Superalignment names a blunt asymmetry: if you build systems that outperform humans at most cognitive tasks, the usual oversight tricks—spot checks, unit tests, “just read the logs”—stop scaling. The phrase is marketing as much as research agenda, but the underlying problem is real enough to take seriously as engineering, not only as philosophy.',
      'Classical alignment work often assumes a human can recognize good behavior when they see it. That assumption frays when the system proposes strategies humans cannot evaluate, writes code humans cannot audit at speed, or optimizes metrics that only correlate with human intent on the training distribution. Superalignment asks what replaces the human-in-the-loop when the loop is the bottleneck.',
      'Proposed technical routes cluster. Scalable oversight tries to amplify human judgment with AI assistants, debate, or recursive evaluation. Automated alignment research hopes weaker systems can help align stronger ones without simply laundering errors upward. Interpretability aims to read internal states instead of trusting outputs. Robustness and control methods try to limit action spaces even when intent is imperfectly known.',
      'Each route has a failure mode that looks like success. Oversight can become theater if the overseer model shares blind spots with the overseen model. Automated alignment can optimize for looking aligned. Interpretability can produce compelling stories that are not causal. Control can be brittle once tools and affordances expand.',
      'There is also a sociological hazard: calling something “superalignment” can excuse skipping ordinary engineering—secure evals, access control, staged deployment—on the grounds that the cosmic problem is elsewhere. The opposite error is also common: treating only ops security as real and dismissing scalable oversight as science fiction. A serious program needs both near-term containment and research on oversight that still works when humans are slow.',
      'For a student club, the productive stance is concrete. Pick a narrow setting—code agents, research assistants, tool-using chat models—and ask what evidence would convince you the system is doing what you wanted. If your answer is “a human glanced at it,” you do not yet have an alignment plan. You have a hope. Superalignment, stripped of branding, is the project of replacing that hope with methods that degrade more gracefully as capability rises.',
      essayClose,
    ],
  },
]

export function getPostBySlug(slug) {
  return posts.find((post) => post.slug === slug)
}

export function formatPostDate(isoDate) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
