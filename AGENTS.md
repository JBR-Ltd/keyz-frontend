<!-- BEGIN:nextjs-agent-rules -->

---
name: coding-style
description: Enforces Jason's personal coding style, interaction mode, and workflow rules. Activates plan mode by default, requires explicit approval before any file changes, and applies comment/markdown and TypeScript type-safety conventions across React, Vue, Nuxt, Next.js, Cairo, Rust, and associated state managers (Pinia, Zustand, Redux).
---

# Coding Style

You are operating under a strict set of personal coding style and workflow rules. Follow every rule below for the entire session.

---

## Step 0: Study the Repo First

Before writing a single line of code, read the existing codebase to learn its conventions. Do not invent patterns - follow what is already there.

### What to study

- **Types and interfaces:** Find where types live (e.g. `types.ts`, `types/index.ts`, a `lib/` dir). Note whether the project uses `interface` or `type` aliases, how they are named, and where they are exported from.
- **File and folder structure:** Note how files are grouped (by feature, by layer, by role). New files must follow the same structure.
- **Import style:** Note whether imports use path aliases, relative paths, or package names. Match that exactly.
- **Naming conventions:** Note casing for files (kebab, camel, PascalCase), functions, components, and constants.
- **Component patterns:** Note whether components use named exports or default exports, how props are typed, and whether prop types are co-located or in a separate file.
- **Hook patterns:** Note where custom hooks live and how they are named.
- **Shared vs app-local code:** Note where shared/reusable code lives (a `packages/`, `libs/`, or `shared/` directory) vs app-specific code. New shared code goes to the shared location; app-specific code stays local.

### New repo / template creation

If no meaningful existing code is present (new project, blank template), establish the conventions yourself - but document them in a comment at the top of the first types file created so subsequent files can follow it.

---

## Interaction Mode: Plan First, Always

**Default behavior is analysis and planning. Never modify a file unless explicitly approved.**

### For questions
Answer directly and clearly. No plan needed.

### For any modification request (code change, file edit, refactor, command execution, implementation)

1. Present a concise plan:
   - What will change
   - Which files will be affected
   - Any risks or assumptions

2. **STOP.** Do not proceed.

3. Wait for the user to say one of: **"approve"**, **"go ahead"**, **"implement"**, or a clear equivalent.

4. Only then, implement exactly the approved plan. No additions, no omissions.

5. After implementing:
   - Summarize what changed and why
   - Note any follow-up steps (tests, checks, next actions)

**Never self-approve. Never say "I'll go ahead and..." and then do it. Always wait.**

---

## Comment Style

Applies to Cairo, TypeScript, and JavaScript.

### Section separators

Top-level section dividers use this exact format:

```ts
// === Helpers
// === Types
// === Events
// === Tests
```

Never use decorative separators:

```ts
// --- Helpers ---       // NEVER
// === Helpers ===       // NEVER
// ========================  // NEVER
```

### Inline and function comments

Regular `//` comments are fine inside functions or for quick inline explanations. No multi-line block comments for things that can be said in one line.

---

## Markdown and Prose Style

- Do NOT use the em dash character anywhere: markdown files, commit messages, PR descriptions, or documentation.
- Do NOT substitute a hyphen in place of an em dash. Rewrite the sentence so neither is needed.
- Hyphens are only for their correct grammatical purpose: compound words (`up-to-date`, `self-hosted`), prefixes, and ranges.
- Prefer bullet points over long paragraphs.
- Be concise and specific. No filler.

---

## General Code Behavior

- Do not add features, refactors, or abstractions beyond what was asked.
- Do not add error handling for scenarios that cannot happen.
- Do not write comments that describe what the code does. Only comment on non-obvious WHY.
- Do not create new files when editing an existing one will do.

---

## TypeScript Typing Rules

### Read the project's type conventions first

Before writing types, find the project's existing types files and read them. Match the style: naming, location, export shape, and whether the project prefers `interface` or `type`. Do not introduce a new pattern when an existing one fits.

### Interfaces vs types

- Use `interface` for object shapes that describe a contract or could be extended.
- Use `type` for unions, intersections, mapped types, conditional types, and simple aliases.
- When in doubt, check how the existing codebase handles the same kind of shape and mirror it.

### Exports

- Export every `interface` and `type` that is used by more than one file.
- If the project has a shared package or lib, types shared across multiple apps or modules belong there - not duplicated in each consumer.
- Export shared types from the package's public index file (the same entry point other code imports from), not buried in an internal file.
- Never declare the same interface in two places. Find where it belongs and import it everywhere else.

### No `any`

`any` is banned except in three narrow situations:

1. A third-party API or library pattern that structurally requires it and cannot be overridden without unreasonable cost (document with an inline comment explaining why).
2. A JSON parse boundary where the shape is genuinely unknown - use `unknown` here first, then narrow with a type guard before use.
3. A dynamic loader pattern (e.g. lazy-loaded component props) where the type system cannot express the shape - document inline.

For everything else: use `unknown` and narrow, or add a generic constraint.

### Let inference work - don't annotate what TypeScript already knows

When TypeScript can infer the type from the initial value with no ambiguity, do NOT write an explicit generic. Writing it is noise, not clarity. This rule is universal - it applies in React, Vue, Nuxt, Pinia, Zustand, Redux, and plain TypeScript equally.

**React**

```ts
// inferred - never annotate
useState(false)           // boolean
useState('')              // string
useState(0)               // number
useRef<HTMLDivElement>()  // OK - DOM refs need the element type since null is the default
useMemo(() => 42, [])     // number, inferred

// WRONG
useState<boolean>(false)
useState<string>('')
useState<number>(0)
```

**Vue 3 / Nuxt**

```ts
// inferred - never annotate
const open = ref(false)       // Ref<boolean>
const name = ref('')          // Ref<string>
const count = ref(0)          // Ref<number>

// WRONG
const open = ref<boolean>(false)
const name = ref<string>('')

// annotate when ambiguous or too narrow
const user = ref<User | null>(null)   // null alone infers Ref<null>
const items = ref<Item[]>([])         // [] alone infers never[] or unknown[]
const map = reactive<Record<string, Item>>({})
```

**Pinia**

```ts
// state properties with clear primitives - no annotation needed
state: () => ({
  loading: false,     // boolean
  query: '',          // string
  page: 1,            // number
})

// annotate when ambiguous
state: () => ({
  user: null as User | null,
  items: [] as Item[],
})
```

**Zustand**

```ts
// annotate the store interface, not individual primitives inside it
interface BearState {
  count: number
  name: string
  user: User | null
}

const useStore = create<BearState>()((set) => ({
  count: 0,
  name: '',
  user: null,
}))
```

**Redux / RTK**

```ts
// slice state - annotate the interface, not each field
interface CartState {
  items: CartItem[]
  total: number
}

const initialState: CartState = { items: [], total: 0 }

// useSelector - annotate only when the selector return type is ambiguous
const count = useSelector((state: RootState) => state.counter.value)  // inferred as number
```

**The general rule across all frameworks:**

Annotate the shape once at its definition (the `interface`, the store type, the component props). After that, let inference carry it. Repeating the type at every call site is noise.

When inference IS ambiguous or would produce `never[]`, `null`, or an overly wide type, then annotate explicitly:

```ts
// ambiguous - always annotate
useState<Item[]>([])
ref<User | null>(null)
reactive<Record<string, Session>>({})
useState<Session | null>(null)
```

### Return types

Functions that return anything non-trivial should have an explicit return type annotation. This is especially important for:

- Custom hooks (always annotate the return type)
- Utility functions in shared packages
- Functions whose return type would otherwise be inferred as a wide type like `string | undefined | null`

### Generics

- Prefer constrained generics (`<T extends SomeBase>`) over unconstrained `<T>` to document the minimum contract.
- When wrapping a generic structure, thread the type parameter through rather than widening it to a looser type.


<!-- END:nextjs-agent-rules -->
