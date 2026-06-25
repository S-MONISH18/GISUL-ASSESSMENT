import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Brain,
  Sun,
  Moon,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  LogOut,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
  RotateCcw,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
  Target,
  ChevronRight,
  BarChart3,
  Plus,
  AlertCircle,
  BookMarked,
  Mail,
  Lock,
  User,
  Cpu,
  GitBranch,
  Layers,
  Trash2,
} from "lucide-react";
import api from "../lib/api";

// ── Themes ─────────────────────────────────────────────────────────────────

type Theme = "dark" | "light" | "reading";

const themeVars: Record<Theme, Record<string, string>> = {
  dark: {
    "--background": "#06060f",
    "--foreground": "#ebebff",
    "--card": "#0e0e22",
    "--card-foreground": "#ebebff",
    "--primary": "#7c3aed",
    "--primary-foreground": "#ffffff",
    "--secondary": "#1a1a3a",
    "--secondary-foreground": "#ebebff",
    "--muted": "#12122a",
    "--muted-foreground": "#8888bb",
    "--accent": "#a3e635",
    "--accent-foreground": "#06060f",
    "--border": "rgba(124,58,237,0.2)",
    "--input-background": "#12122a",
    "--ring": "#7c3aed",
    "--popover": "#0e0e22",
    "--popover-foreground": "#ebebff",
  },
  light: {
    "--background": "#f6f5ff",
    "--foreground": "#0a0a1a",
    "--card": "#ffffff",
    "--card-foreground": "#0a0a1a",
    "--primary": "#7c3aed",
    "--primary-foreground": "#ffffff",
    "--secondary": "#ede9ff",
    "--secondary-foreground": "#0a0a1a",
    "--muted": "#f0eeff",
    "--muted-foreground": "#5e5e80",
    "--accent": "#5b21b6",
    "--accent-foreground": "#ffffff",
    "--border": "rgba(124,58,237,0.14)",
    "--input-background": "#ede9ff",
    "--ring": "#7c3aed",
    "--popover": "#ffffff",
    "--popover-foreground": "#0a0a1a",
  },
  reading: {
    "--background": "#f7f2e8",
    "--foreground": "#2c1f0e",
    "--card": "#fef9ef",
    "--card-foreground": "#2c1f0e",
    "--primary": "#9b6b3a",
    "--primary-foreground": "#fef9ef",
    "--secondary": "#ebe3d5",
    "--secondary-foreground": "#2c1f0e",
    "--muted": "#e8e0d0",
    "--muted-foreground": "#7a6550",
    "--accent": "#c9943a",
    "--accent-foreground": "#2c1f0e",
    "--border": "rgba(139,94,60,0.22)",
    "--input-background": "#ebe3d5",
    "--ring": "#9b6b3a",
    "--popover": "#fef9ef",
    "--popover-foreground": "#2c1f0e",
  },
};

// ── Types ──────────────────────────────────────────────────────────────────

type AppView = "dashboard" | "generate" | "review";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  status: "new" | "known" | "not_known";
}

interface CardSet {
  id: string;
  title: string;
  subject: string;
  cardCount: number;
  lastReviewed: string;
  progress: number;
}

// ── Data ───────────────────────────────────────────────────────────────────

const SAMPLE_NOTES = `Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of glucose. Chlorophyll is the pigment in plants that absorbs light energy and is responsible for the green color of leaves. The process occurs in the chloroplasts of plant cells, which contain stacked membrane structures called thylakoids. The light-dependent reactions happen in the thylakoid membranes and produce ATP and NADPH, while the Calvin cycle occurs in the stroma and uses these molecules to fix carbon dioxide into glucose. Photosynthesis is the foundation of most food chains on Earth, converting solar energy into chemical energy stored in organic compounds. Without photosynthesis, there would be no oxygen in the atmosphere and no basis for life as we know it.`;

const SAMPLE_CARDS: Flashcard[] = [
  {
    id: "1",
    question: "What is photosynthesis and what are its primary inputs and outputs?",
    answer:
      "Photosynthesis is the process by which plants convert sunlight, water, and CO₂ into glucose and oxygen. It is the foundation of most food chains on Earth.",
    status: "new",
  },
  {
    id: "2",
    question: "What is chlorophyll and why is it important?",
    answer:
      "Chlorophyll is the pigment in plant cells that absorbs light energy, enabling photosynthesis. It gives leaves their green color.",
    status: "new",
  },
  {
    id: "3",
    question: "Where do the light-dependent reactions occur in the plant cell?",
    answer:
      "The light-dependent reactions occur in the thylakoid membranes inside chloroplasts, producing ATP and NADPH.",
    status: "new",
  },
  {
    id: "4",
    question: "What is the Calvin cycle and where does it take place?",
    answer:
      "The Calvin cycle occurs in the stroma of chloroplasts. It uses ATP and NADPH from light-dependent reactions to fix CO₂ into glucose.",
    status: "new",
  },
  {
    id: "5",
    question: "What are thylakoids and what is their function?",
    answer:
      "Thylakoids are stacked membrane structures inside chloroplasts where the light-dependent reactions of photosynthesis occur, converting light energy into chemical energy.",
    status: "new",
  },
  {
    id: "6",
    question: "What molecules are produced by the light-dependent reactions?",
    answer:
      "The light-dependent reactions produce ATP and NADPH, which are energy-carrying molecules used to power the Calvin cycle.",
    status: "new",
  },
  {
    id: "7",
    question: "Why is photosynthesis essential for life on Earth?",
    answer:
      "Photosynthesis produces the oxygen in our atmosphere and forms the base of most food chains by converting solar energy into chemical energy stored in glucose.",
    status: "new",
  },
  {
    id: "8",
    question: "What is the stroma and what process occurs there?",
    answer:
      "The stroma is the fluid-filled space inside a chloroplast surrounding the thylakoids. The Calvin cycle takes place in the stroma, using ATP and NADPH to fix CO₂ into glucose.",
    status: "new",
  },
  {
    id: "9",
    question: "How does water contribute to photosynthesis?",
    answer:
      "Water is split during the light-dependent reactions in a process called photolysis, releasing electrons, protons, and oxygen gas as a byproduct.",
    status: "new",
  },
  {
    id: "10",
    question: "What gives plant leaves their green color?",
    answer:
      "The green color of leaves comes from chlorophyll, the primary photosynthetic pigment that absorbs red and blue light while reflecting green light.",
    status: "new",
  },
];

const SAMPLE_SETS: CardSet[] = [
  {
    id: "1",
    title: "Photosynthesis",
    subject: "Biology",
    cardCount: 4,
    lastReviewed: "2 hours ago",
    progress: 75,
  },
  {
    id: "2",
    title: "French Revolution",
    subject: "History",
    cardCount: 8,
    lastReviewed: "Yesterday",
    progress: 40,
  },
  {
    id: "3",
    title: "Linear Algebra",
    subject: "Mathematics",
    cardCount: 6,
    lastReviewed: "1 week ago",
    progress: 60,
  },
  {
    id: "4",
    title: "JavaScript Async",
    subject: "Computer Science",
    cardCount: 5,
    lastReviewed: "Never",
    progress: 0,
  },
];

const SUBJECT_COLORS: Record<string, string> = {
  Biology: "text-green-400 bg-green-500/10 border-green-500/20",
  History: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  Mathematics: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "Computer Science": "text-violet-400 bg-violet-500/10 border-violet-500/20",
};

// ── Theme Switcher ─────────────────────────────────────────────────────────

function ThemeSwitcher({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (t: Theme) => void;
}) {
  const options: { id: Theme; icon: React.ReactNode; label: string }[] = [
    { id: "dark", icon: <Moon size={14} />, label: "Dark" },
    { id: "light", icon: <Sun size={14} />, label: "Light" },
    { id: "reading", icon: <BookOpen size={14} />, label: "Reading" },
  ];
  return (
    <div className="flex items-center gap-0.5 p-1 rounded-lg bg-secondary border border-border">
      {options.map(({ id, icon, label }) => (
        <button
          key={id}
          title={label}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-all ${
            theme === id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Login Page ─────────────────────────────────────────────────────────────

function LoginPage({
  theme,
  onThemeChange,
  onLogin,
}: {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  onLogin: (email: string) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validate() {
    if (!email.includes("@")) return "Enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (mode === "signup" && name.trim().length < 2) return "Enter your full name.";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        // Step 1: create account
        await api.post('/auth/signup', { email, password });
        // Step 2: immediately login to get a token (signup doesn't return one)
        const loginRes = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', loginRes.data.access_token);
        onLogin(name.split(" ")[0]);
      } else {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.access_token);
        onLogin(email.split("@")[0]);
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Brain size={14} className="text-primary-foreground" />
          </div>
          <span
            className="text-sm font-black text-foreground"
            style={{ fontFamily: "'Unbounded', sans-serif" }}
          >
            FlashMind
          </span>
        </div>
        <ThemeSwitcher theme={theme} onChange={onThemeChange} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left brand panel */}
        <div
          className="hidden lg:flex flex-col justify-between w-[52%] p-14 relative overflow-hidden"
          style={{
            background:
              theme === "reading"
                ? "linear-gradient(135deg, #9b6b3a 0%, #c9943a 100%)"
                : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #0ea5e9 100%)",
          }}
        >
          {/* Grid texture */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {/* Glow */}
          <div className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full bg-white/10 blur-[100px]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 mb-8 backdrop-blur-sm border border-white/20">
              <Sparkles size={12} className="text-white" />
              <span className="text-white/90 text-xs font-mono">
                AI-Powered Flashcard Learning
              </span>
            </div>
            <h1
              className="text-5xl font-black text-white leading-[1.05] mb-5"
              style={{ fontFamily: "'Unbounded', sans-serif" }}
            >
              Study smarter,
              <br />
              not harder.
            </h1>
            <p className="text-white/75 text-lg leading-relaxed max-w-md">
              Paste your notes. Our NLP pipeline extracts key concepts,
              generates Q&A pairs, and builds a weighted review deck
              tailored to what you need to learn.
            </p>
          </div>

          {/* Features */}
          <div className="relative flex flex-col gap-4">
            {[
              { icon: Zap, text: "Instant AI-generated flashcards from any notes" },
              { icon: Target, text: "Spaced repetition — struggling cards surface first" },
              { icon: BarChart3, text: "Track retention across every study session" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-white" />
                </div>
                <span className="text-white/80 text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* Floating card preview */}
          <div className="absolute bottom-16 right-10 w-72 opacity-90 hidden xl:block">
            <div
              className="rounded-2xl border border-white/20 p-5 backdrop-blur-md"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-yellow-300" />
                <span className="font-mono text-[10px] text-white/60 uppercase tracking-widest">
                  Question · 2 of 4
                </span>
              </div>
              <p className="text-white text-sm font-medium leading-relaxed mb-4">
                What is the role of chlorophyll in photosynthesis?
              </p>
              <div className="flex gap-2">
                <div className="flex-1 py-2 rounded-lg border border-white/20 text-center text-white/60 font-mono text-xs">
                  Still Learning
                </div>
                <div className="flex-1 py-2 rounded-lg border border-yellow-300/40 text-center text-yellow-300 font-mono text-xs">
                  Got It ✓
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px]">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3">
                <Brain size={22} className="text-primary-foreground" />
              </div>
              <h2
                className="text-xl font-black"
                style={{ fontFamily: "'Unbounded', sans-serif" }}
              >
                FlashMind
              </h2>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl font-bold text-foreground mb-1.5">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === "login"
                  ? "Sign in to access your flashcard sets"
                  : "Start generating AI flashcards in seconds"}
              </p>
            </div>

            {/* Tab toggle */}
            <div className="flex p-1 rounded-xl bg-secondary border border-border mb-6">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-mono transition-all ${
                    mode === m
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "Log In" : "Sign Up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === "signup" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Johnson"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <AlertCircle size={14} className="text-destructive flex-shrink-0" />
                    <span className="text-xs text-destructive">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all mt-1"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === "login" ? "Signing in…" : "Creating account…"}
                  </>
                ) : (
                  <>
                    {mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-border text-center">
              <button
                onClick={() => onLogin("Guest")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Continue without account →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Flip Card ──────────────────────────────────────────────────────────────

function FlipCard({
  card,
  onKnown,
  onNotKnown,
  index,
  total,
  onDelete,
}: {
  card: Flashcard;
  onKnown: () => void;
  onNotKnown: () => void;
  index: number;
  total: number;
  onDelete?: (id: string) => void;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="w-full flex items-center gap-3">
        <span className="font-mono text-xs text-muted-foreground w-12">
          {index + 1} / {total}
        </span>
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "var(--accent)" }}
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <span className="font-mono text-xs text-muted-foreground w-10 text-right">
          {Math.round(((index + 1) / total) * 100)}%
        </span>
      </div>

      {/* 3D card wrapper with top controls */}
      <div className="w-full flex justify-end mb-1">
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Delete this card permanently?")) {
                onDelete(card.id);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
            Delete
          </button>
        )}
      </div>

      {/* 3D card */}
      <div
        className="w-full cursor-pointer select-none"
        style={{ perspective: "1200px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full"
          style={{
            height: "300px",
            transformStyle: "preserve-3d",
            transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border border-border flex flex-col items-center justify-center p-10 gap-4"
            style={{
              backfaceVisibility: "hidden",
              backgroundColor: "var(--card)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "var(--accent)" }}
              />
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                Question
              </span>
            </div>
            <p className="text-xl font-medium text-center text-foreground leading-relaxed">
              {card.question}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-muted-foreground">
              <RotateCcw size={13} />
              <span className="text-xs font-mono">tap to reveal answer</span>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-10 gap-4"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              backgroundColor: "var(--secondary)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "var(--primary)" }}
              />
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                Answer
              </span>
            </div>
            <p className="text-lg text-center text-foreground leading-relaxed">
              {card.answer}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 w-full">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFlipped(false);
            onNotKnown();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/8 transition-colors font-mono text-sm"
        >
          <XCircle size={16} />
          Still Learning
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFlipped(false);
            onKnown();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-mono text-sm transition-colors"
          style={{
            border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
            color: "var(--accent)",
          }}
        >
          <CheckCircle size={16} />
          Got It
        </button>
      </div>

      <p className="text-xs font-mono text-muted-foreground">
        Tap the card to flip · then mark how well you know it
      </p>
    </div>
  );
}

// ── Preview Card ───────────────────────────────────────────────────────────

function PreviewCard({ card, delay, onDelete }: { card: Flashcard; delay: number; onDelete?: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-primary/40 transition-all group"
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded-full border"
              style={{
                color: "var(--accent)",
                borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--accent) 8%, transparent)",
              }}
            >
              Q
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {expanded ? "Hide answer" : "Tap to reveal answer"}
            </span>
          </div>
          <p className="text-sm text-foreground font-medium leading-relaxed whitespace-pre-wrap">
            {card.question}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete this card permanently?")) {
                  onDelete(card.id);
                }
              }}
              className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors flex-shrink-0"
              title="Delete Card"
            >
              <Trash2 size={14} />
            </button>
          )}
          <ChevronRight
            size={14}
            className={`text-muted-foreground transition-transform duration-300 flex-shrink-0 ${expanded ? "rotate-90" : ""}`}
          />
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-border">
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded-full border mr-2"
                style={{
                  color: "var(--primary)",
                  borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)",
                }}
              >
                A
              </span>
              <span className="text-sm text-muted-foreground">{card.answer}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Dashboard Set Card ─────────────────────────────────────────────────────

function SetCard({
  set,
  onReview,
  onDelete,
}: {
  set: CardSet;
  onReview: () => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 hover:border-primary/40 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <span
            className={`font-mono text-[10px] px-2.5 py-1 rounded-full border mb-2 inline-block ${
              SUBJECT_COLORS[set.subject] ??
              "text-muted-foreground bg-muted border-border"
            }`}
          >
            {set.subject}
          </span>
          <h3 className="text-base font-bold text-foreground">{set.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete the set "${set.title}" and all its cards?`)) {
                  onDelete(set.id);
                }
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
              title="Delete Set"
            >
              <Trash2 size={14} />
            </button>
          )}
        <div className="text-right">
          <div
            className="text-2xl font-black"
            style={{
              fontFamily: "'Unbounded', sans-serif",
              color: "var(--primary)",
            }}
          >
            {set.cardCount}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">cards</div>
        </div>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[10px] text-muted-foreground">
            Retention
          </span>
          <span
            className="font-mono text-[10px]"
            style={{ color: set.progress > 0 ? "var(--accent)" : "var(--muted-foreground)" }}
          >
            {set.progress}%
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${set.progress}%`,
              backgroundColor: set.progress > 0 ? "var(--accent)" : "var(--muted-foreground)",
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <Clock size={11} className="text-muted-foreground" />
          <span className="font-mono text-[10px] text-muted-foreground">
            {set.lastReviewed}
          </span>
        </div>
        <button
          onClick={onReview}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all"
          style={{
            backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
            color: "var(--primary)",
            border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              "var(--primary)";
            (e.currentTarget as HTMLElement).style.color =
              "var(--primary-foreground)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              "color-mix(in srgb, var(--primary) 12%, transparent)";
            (e.currentTarget as HTMLElement).style.color = "var(--primary)";
          }}
        >
          <BookMarked size={12} />
          Review
        </button>
      </div>
    </motion.div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Student");
  const [view, setView] = useState<AppView>("dashboard");
  const [history, setHistory] = useState<AppView[]>([]);

  // ── Restore session on page load ──────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode the email/name from token payload (base64)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Token has sub = user_id; we just keep a generic display name
        setIsLoggedIn(true);
        setUserName(localStorage.getItem('userName') || 'Student');
      } catch {
        // Token is corrupted, clear it
        localStorage.removeItem('token');
      }
    }
  }, []);

  function navigate(next: AppView) {
    setHistory((h) => [...h, view]);
    setView(next);
  }

  function goBack() {
    const prev = history[history.length - 1] ?? "dashboard";
    setHistory((h) => h.slice(0, -1));
    setView(prev);
  }

  // Generate state
  const [notes, setNotes] = useState("");
  const [cardCount, setCardCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([]);
  const [dashboardSets, setDashboardSets] = useState<CardSet[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalCards: 0,
    avgRetention: 0,
    totalReviews: 0,
    streak: 0,
  });

  useEffect(() => {
    if (isLoggedIn && view === "dashboard") {
      // Fetch sets with per-set retention
      api.get('/flashcards/sets')
        .then(res => {
          setDashboardSets(res.data.sets.map((s: any) => ({
            id: s.set_id,
            title: s.title,
            subject: "Generated",
            cardCount: s.card_count,
            lastReviewed: s.last_reviewed,
            progress: s.retention,
          })));
        })
        .catch(console.error);

      // Fetch real-time stats
      api.get('/flashcards/stats')
        .then(res => {
          setDashboardStats({
            totalCards:   res.data.total_cards,
            avgRetention: res.data.avg_retention,
            totalReviews: res.data.total_reviews,
            streak:       res.data.streak,
          });
        })
        .catch(console.error);
    }
  }, [isLoggedIn, view]);

  // Review state
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewDone, setReviewDone] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("Photosynthesis");

  const MAX_CHARS = 10000;
  const charCount = notes.length;
  const charOk = charCount >= 100 && charCount <= MAX_CHARS;

  function handleLogin(name: string) {
    const displayName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    setUserName(displayName);
    localStorage.setItem('userName', displayName); // persist for session restore
    setIsLoggedIn(true);
    setHistory([]);
    setView("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    setNotes("");
    setGeneratedCards([]);
    setDashboardSets([]);
    setHistory([]);
    setView("dashboard");
  }

  async function handleGenerate() {
    if (!charOk) return;
    setGenerating(true);
    setGeneratedCards([]);
    try {
      const res = await api.post('/flashcards/generate', { notes });
      setGeneratedCards(res.data.flashcards);
      setReviewTitle(res.data.title);
    } catch (error: any) {
      console.error(error);
      const detail = error.response?.data?.detail || "Failed to generate flashcards.";
      alert(detail);
    } finally {
      setGenerating(false);
    }
  }

  async function startReviewSession(setId: string) {
    try {
      const res = await api.get(`/flashcards/sets/${setId}`);
      setReviewTitle(res.data.title);
      setReviewCards(res.data.flashcards);
      setReviewIndex(0);
      setReviewDone(false);
      setKnownCount(0);
      navigate("review");
    } catch (error) {
      console.error(error);
      alert("Failed to load review session.");
    }
  }

  function startReview(title = "Photosynthesis", cards?: Flashcard[]) {
    setReviewTitle(title);
    setReviewCards((cards ?? SAMPLE_CARDS.slice(0, cardCount)).map((c) => ({ ...c, status: "new" })));
    setReviewIndex(0);
    setReviewDone(false);
    setKnownCount(0);
    navigate("review");
  }

  async function handleKnown() {
    setKnownCount((k) => k + 1);
    const cardId = reviewCards[reviewIndex].id;
    try {
      await api.patch(`/flashcards/${cardId}/review`, { status: "known" });
    } catch (error) { console.error(error); }
    advance();
  }

  async function handleNotKnown() {
    const cardId = reviewCards[reviewIndex].id;
    try {
      await api.patch(`/flashcards/${cardId}/review`, { status: "not_known" });
    } catch (error) { console.error(error); }
    advance();
  }

  function advance() {
    if (reviewIndex + 1 >= reviewCards.length) {
      setReviewDone(true);
    } else {
      setReviewIndex((i) => i + 1);
    }
  }

  function resetReview() {
    setReviewIndex(0);
    setReviewDone(false);
    setKnownCount(0);
    setReviewCards((cards) =>
      cards.map((c) => ({ ...c, status: "new" }))
    );
  }

  async function handleDeleteGeneratedCard(id: string) {
    try {
      await api.delete(`/flashcards/${id}`);
      setGeneratedCards((prev) => prev.filter((c) => c.id !== id));
      
      // Also update dashboardSets to decrement count
      setDashboardSets(sets => 
        sets.map(s => {
          // If the set of this card matches the title we just generated
          if (s.title === reviewTitle) {
            return { ...s, cardCount: Math.max(0, s.cardCount - 1) };
          }
          return s;
        })
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete card");
    }
  }

  async function handleDeleteReviewCard(id: string) {
    try {
      await api.delete(`/flashcards/${id}`);
      
      // Remove from current review cards
      setReviewCards((prev) => {
        const nextCards = prev.filter((c) => c.id !== id);
        // If we are at or past the end, snap index back
        if (reviewIndex >= nextCards.length) {
           setReviewIndex(Math.max(0, nextCards.length - 1));
           if (nextCards.length === 0) setReviewDone(true);
        }
        return nextCards;
      });

      // Update dashboard set count
      setDashboardSets(sets => 
        sets.map(s => s.title === reviewTitle ? { ...s, cardCount: Math.max(0, s.cardCount - 1) } : s)
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete card");
    }
  }

  async function handleDeleteSet(id: string) {
    try {
      await api.delete(`/flashcards/sets/${id}`);
      setDashboardSets((prev) => prev.filter((s) => s.id !== id));
      
      // Update real-time stats locally or refetch
      api.get('/flashcards/stats')
        .then(res => {
          setDashboardStats({
            totalCards:   res.data.total_cards,
            avgRetention: res.data.avg_retention,
            totalReviews: res.data.total_reviews,
            streak:       res.data.streak,
          });
        })
        .catch(console.error);

    } catch (err) {
      console.error(err);
      alert("Failed to delete set");
    }
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  // ── Render auth ──────────────────────────────────────────────────────────

  if (!isLoggedIn) {
    return (
      <div style={themeVars[theme] as React.CSSProperties}>
        <LoginPage
          theme={theme}
          onThemeChange={setTheme}
          onLogin={handleLogin}
        />
      </div>
    );
  }

  // ── Render app ───────────────────────────────────────────────────────────

  return (
    <div
      style={themeVars[theme] as React.CSSProperties}
      className="min-h-screen bg-background text-foreground"
    >
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border backdrop-blur-xl bg-background/85">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-4">
          {/* Logo */}
          <button
            onClick={() => setView("dashboard")}
            className="flex items-center gap-2.5 mr-4 flex-shrink-0"
          >
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Brain size={14} className="text-primary-foreground" />
            </div>
            <span
              className="text-sm font-black text-foreground hidden sm:block"
              style={{ fontFamily: "'Unbounded', sans-serif" }}
            >
              FlashMind
            </span>
          </button>

          {/* Page tabs */}
          <div className="flex items-center gap-1">
            {(["dashboard", "generate"] as const).map((v) => (
              <button
                key={v}
                onClick={() => navigate(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-mono transition-colors ${
                  view === v
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "dashboard" ? "My Sets" : "Generate"}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Theme switcher */}
          <ThemeSwitcher theme={theme} onChange={setTheme} />

          {/* User + logout */}
          <div className="flex items-center gap-3 pl-2 border-l border-border ml-1">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {userName.charAt(0)}
              </div>
              <span className="text-sm font-medium text-foreground hidden md:block">
                {userName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-14">
        <AnimatePresence mode="wait">
          {/* ── DASHBOARD ───────────────────────────────────────────────── */}
          {view === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-6xl mx-auto px-6 py-12"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
                <div>
                  <p className="font-mono text-xs text-muted-foreground mb-1">
                    {greeting},
                  </p>
                  <h1
                    className="text-4xl font-black text-foreground"
                    style={{ fontFamily: "'Unbounded', sans-serif" }}
                  >
                    {userName}.
                  </h1>
                  <p className="text-muted-foreground mt-2 text-sm">
                    You have {dashboardSets.length} card sets ·{" "}
                    {dashboardSets.filter((s) => s.lastReviewed === "Never").length} not yet started
                  </p>
                </div>
                <button
                  onClick={() => navigate("generate")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all self-start sm:self-auto"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  <Plus size={15} />
                  New Set
                </button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { label: "Total Cards", value: String(dashboardStats.totalCards), icon: FileText },
                  { label: "Avg Retention", value: `${dashboardStats.avgRetention}%`, icon: Target },
                  { label: "Reviews Done", value: String(dashboardStats.totalReviews), icon: BarChart3 },
                  { label: "Streak", value: dashboardStats.streak > 0 ? `${dashboardStats.streak} day${dashboardStats.streak !== 1 ? 's' : ''}` : "—", icon: Zap },
                ].map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }}>
                        <Icon size={14} style={{ color: "var(--primary)" }} />
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">
                        {label}
                      </span>
                    </div>
                    <div
                      className="text-2xl text-foreground mb-0.5"
                      style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.15 }}
                    >
                      {value}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sets grid */}
              <div className="mb-4">
                <div className="font-mono text-xs text-muted-foreground mb-4">
                  CARD SETS
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dashboardSets.map((set, i) => (
                    <motion.div
                      key={set.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <SetCard
                        set={set}
                        onReview={() => startReviewSession(set.id)}
                        onDelete={handleDeleteSet}
                      />
                    </motion.div>
                  ))}

                  {/* Add new card */}
                  <motion.button
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dashboardSets.length * 0.06 }}
                    onClick={() => navigate("generate")}
                    className="rounded-2xl border border-dashed border-border flex flex-col items-center justify-center gap-3 p-8 min-h-[200px] hover:border-primary/50 hover:bg-secondary/30 transition-all group text-muted-foreground hover:text-foreground"
                  >
                    <div className="w-10 h-10 rounded-xl border border-border group-hover:border-primary/40 flex items-center justify-center transition-colors">
                      <Plus size={18} />
                    </div>
                    <span className="font-mono text-xs">Generate new set</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── GENERATE ────────────────────────────────────────────────── */}
          {view === "generate" && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-5xl mx-auto px-6 py-12"
            >
              <div className="mb-8">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-5 group"
                >
                  <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span className="font-mono text-xs">Back</span>
                </button>
                <div className="font-mono text-xs text-muted-foreground mb-2">
                  GENERATE
                </div>
                <h1
                  className="text-3xl font-black text-foreground mb-2"
                  style={{ fontFamily: "'Unbounded', sans-serif" }}
                >
                  Paste your notes.
                </h1>
                <p className="text-muted-foreground text-sm">
                  100 – 10,000 characters · any subject · any language
                </p>
              </div>

              <div className="flex flex-col gap-4">

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, MAX_CHARS))}
                    placeholder="Paste your study notes here — lecture summaries, textbook excerpts, research notes, meeting transcripts…"
                    className="w-full resize-none rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground p-5 text-sm leading-relaxed focus:outline-none transition-colors"
                    style={{
                      minHeight: "260px",
                      borderColor: charCount > MAX_CHARS * 0.9 && charCount < MAX_CHARS
                        ? "var(--accent)"
                        : undefined,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "color-mix(in srgb, var(--primary) 60%, transparent)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />

                  {/* Char meter */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min((charCount / MAX_CHARS) * 100, 100)}%`,
                            backgroundColor:
                              charCount < 100
                                ? "var(--muted-foreground)"
                                : charCount > MAX_CHARS * 0.9
                                ? "#f59e0b"
                                : "var(--accent)",
                          }}
                        />
                      </div>
                      <span
                        className="font-mono text-[11px]"
                        style={{
                          color:
                            charCount < 100
                              ? "var(--muted-foreground)"
                              : charCount > MAX_CHARS * 0.9
                              ? "#f59e0b"
                              : "var(--accent)",
                        }}
                      >
                        {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Under-textarea hints */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setNotes(SAMPLE_NOTES)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-xs font-mono"
                  >
                    <FileText size={13} />
                    Load sample
                  </button>
                  {notes.length > 0 && (
                    <button
                      onClick={() => { setNotes(""); setGeneratedCards([]); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/30 transition-colors text-xs font-mono"
                    >
                      <XCircle size={13} />
                      Clear
                    </button>
                  )}
                  <div className="flex-1" />
                  {charCount > 0 && charCount < 100 && (
                    <span className="font-mono text-xs text-red-400">
                      {100 - charCount} more chars needed
                    </span>
                  )}
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={!charOk || generating}
                  className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating flashcards…
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      Generate Flashcards
                    </>
                  )}
                </button>
              </div>

              {/* Generated cards preview */}
              <AnimatePresence>
                {generatedCards.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="mt-12"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <div className="font-mono text-xs text-muted-foreground mb-1">
                          PREVIEW
                        </div>
                        <h2 className="text-xl font-bold">
                          {generatedCards.length} of {generatedCards.length} cards generated
                        </h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={goBack}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Save to Sets
                          <CheckCircle size={13} />
                        </button>
                        <button
                          onClick={() => startReview("Generated Set", generatedCards)}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                          style={{
                            backgroundColor: "var(--accent)",
                            color: "var(--accent-foreground)",
                          }}
                        >
                          <BookOpen size={14} />
                          Start Review
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {generatedCards.map((card, i) => (
                        <PreviewCard
                          key={card.id}
                          card={card}
                          delay={i * 0.07}
                          onDelete={handleDeleteGeneratedCard}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── REVIEW ──────────────────────────────────────────────────── */}
          {view === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-2xl mx-auto px-6 py-12"
            >
              {!reviewDone ? (
                <>
                  <div className="mb-10">
                    <button
                      onClick={goBack}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
                    >
                      <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                      <span className="font-mono text-xs">Back</span>
                    </button>
                    <div className="text-center">
                      <div className="font-mono text-xs text-muted-foreground mb-2">
                        REVIEW SESSION
                      </div>
                      <h1
                        className="text-3xl font-black"
                        style={{ fontFamily: "'Unbounded', sans-serif" }}
                      >
                        {reviewTitle}
                      </h1>
                      <p className="text-muted-foreground text-sm mt-2">
                        Tap the card to flip, then mark your confidence
                      </p>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={reviewIndex}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.22 }}
                    >
                      <FlipCard
                        card={reviewCards[reviewIndex]}
                        onKnown={handleKnown}
                        onNotKnown={handleNotKnown}
                        index={reviewIndex}
                        total={reviewCards.length}
                        onDelete={handleDeleteReviewCard}
                      />
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-8 pt-6 border-t border-border flex justify-between">
                    <button
                      onClick={goBack}
                      className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                      Exit session
                    </button>
                    <div className="flex gap-1.5">
                      {reviewCards.map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full transition-all"
                          style={{
                            backgroundColor:
                              i < reviewIndex
                                ? "var(--accent)"
                                : i === reviewIndex
                                ? "var(--primary)"
                                : "var(--secondary)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-12"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                    }}
                  >
                    <CheckCircle size={30} style={{ color: "var(--accent)" }} />
                  </div>

                  <h2
                    className="text-3xl font-black mb-2"
                    style={{ fontFamily: "'Unbounded', sans-serif" }}
                  >
                    Session Complete!
                  </h2>
                  <p className="text-muted-foreground mb-10">
                    You reviewed all {reviewCards.length} cards in{" "}
                    <span className="font-semibold text-foreground">
                      {reviewTitle}
                    </span>
                  </p>

                  {/* Score */}
                  <div className="flex gap-12 mb-8">
                    <div>
                      <div
                        className="text-5xl font-black mb-1"
                        style={{
                          fontFamily: "'Unbounded', sans-serif",
                          color: "var(--accent)",
                        }}
                      >
                        {knownCount}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        Got It
                      </div>
                    </div>
                    <div className="w-px bg-border" />
                    <div>
                      <div
                        className="text-5xl font-black mb-1 text-red-400"
                        style={{ fontFamily: "'Unbounded', sans-serif" }}
                      >
                        {reviewCards.length - knownCount}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        Still Learning
                      </div>
                    </div>
                  </div>

                  {/* Retention bar */}
                  <div className="w-full max-w-xs mb-3">
                    <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: "var(--accent)" }}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.round((knownCount / reviewCards.length) * 100)}%`,
                        }}
                        transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground mb-10">
                    {Math.round((knownCount / reviewCards.length) * 100)}%
                    retention this session
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={resetReview}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                    >
                      <RotateCcw size={14} />
                      Review Again
                    </button>
                    <button
                      onClick={goBack}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: "var(--primary)",
                        color: "var(--primary-foreground)",
                      }}
                    >
                      Back to Sets
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

        {/* Footer */}
        <footer className="border-t border-border mt-6">
                  </footer>
      </div>
    </div>
  );
}
