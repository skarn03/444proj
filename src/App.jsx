import { useMemo, useState } from "react";

/** -----------------------------
 * Helpers
 * ----------------------------- */
const months = [
  "january","february","march","april","may","june",
  "july","august","september","october","november","december",
];

const brands = ["pepsi","starbucks","shell"];

const elementSymbols = new Set([
  "He","Li","Be","Ne","Na","Mg","Al","Si","Cl","Ar","Ca","Sc","Ti","Cr","Mn",
  "Fe","Co","Ni","Cu","Zn","Ga","Ge","As","Se","Br","Kr","Rb","Sr","Zr","Nb",
  "Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn","Sb","Te","Xe","Cs","Ba","La",
  "Ce","Pr","Nd","Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb","Lu","Hf",
  "Ta","Re","Os","Ir","Pt","Au","Hg","Tl","Pb","Bi","Po","At","Rn","Fr","Ra",
  "Ac","Th","Pa","Np","Pu","Am","Cm","Bk","Cf","Es","Fm","Md","No","Lr"
]);

const atomicNumber = {
  H:1, He:2, Li:3, Be:4, B:5, C:6, N:7, O:8, F:9, Ne:10,
  Na:11, Mg:12, Al:13, Si:14, P:15, S:16, Cl:17, Ar:18, K:19, Ca:20,
  Sc:21, Ti:22, V:23, Cr:24, Mn:25, Fe:26, Co:27, Ni:28, Cu:29, Zn:30
};

function romanToInt(s) {
  if (!s) return 0;
  const map = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
  let total = 0;
  for (let i=0; i<s.length; i++){
    const v = map[s[i]];
    const nxt = map[s[i+1]] || 0;
    total += v < nxt ? -v : v;
  }
  return total;
}

function extractRomanTokens(str) {
  const tokens = [];
  const up = str.toUpperCase();
  let cur = "";
  const isRomanChar = (c) => "IVXLCDM".includes(c);
  for (const c of up) {
    if (isRomanChar(c)) cur += c;
    else {
      if (cur.length > 0) tokens.push(cur);
      cur = "";
    }
  }
  if (cur.length > 0) tokens.push(cur);
  return tokens.filter(t => t.length > 0);
}

function sumDigits(str) {
  let s = 0;
  for (const ch of str) if (/\d/.test(ch)) s += Number(ch);
  return s;
}

function countEmoji(str, emoji) {
  return str.split(emoji).length - 1;
}

function isPrime(n) {
  if (n < 2) return false;
  for (let i=2; i*i<=n; i++) if (n % i === 0) return false;
  return true;
}

function containsAffirmation(str) {
  const lc = str.toLowerCase();
  return lc.includes("i am loved") || lc.includes("i am worthy") || lc.includes("i am enough");
}

function containsTwoLetterElementSymbol(str) {
  for (let i=0; i<str.length-1; i++) {
    const pair = str[i] + str[i+1];
    const norm = pair[0].toUpperCase() + pair[1].toLowerCase();
    if (elementSymbols.has(norm)) return true;
  }
  return false;
}

function sumAtomicNumbersInString(str) {
  let sum = 0;
  for (let i=0; i<str.length; i++) {
    const one = str[i].toUpperCase();
    if (atomicNumber[one]) sum += atomicNumber[one];
    if (i < str.length - 1) {
      const two = str[i].toUpperCase() + str[i+1].toLowerCase();
      if (atomicNumber[two]) sum += atomicNumber[two];
    }
  }
  return sum;
}

/** -----------------------------
 * Rules (easy → chaotic)
 * ----------------------------- */
function buildRules(forbidden) {
  return [
    // BASIC
    { id:"len5", label:"At least 5 characters.", test:v=>v.length>=5 },
    { id:"num", label:"Must include a number.", test:v=>/\d/.test(v) },
    { id:"upper", label:"Must include an uppercase letter.", test:v=>/[A-Z]/.test(v) },
    { id:"special", label:"Must include a special character.", test:v=>/[^A-Za-z0-9\s]/.test(v) },

    // INTERMEDIATE FUN
    { id:"digitSum25", label:"Digits must sum to 25.", test:v=>sumDigits(v)===25 },
    { id:"month", label:"Include a month name (e.g., March).", test:v=>{
      const lc=v.toLowerCase(); return months.some(m=>lc.includes(m));
    }},
    { id:"romanPresent", label:"Include a Roman numeral (I,V,X,L,C,D,M).", test:v=>{
      const toks = extractRomanTokens(v);
      return toks.length>0;
    }},
    { id:"brand", label:"Include one of: pepsi, starbucks, or shell.", test:v=>{
      const lc=v.toLowerCase(); return brands.some(b=>lc.includes(b));
    }},
    { id:"romanProduct35", label:"Roman numerals must multiply to 35.", test:v=>{
      const toks = extractRomanTokens(v);
      if (toks.length < 2) return false;
      const vals = toks.map(romanToInt).filter(n=>n>1);
      if (vals.length < 2) return false;
      const prod = vals.reduce((a,b)=>a*b,1);
      return prod === 35; // e.g., V(5) * VII(7)
    }},

    // ADVANCED CHAOS (offline)
    { id:"twoLetterElem", label:"Include a two-letter element symbol (e.g., He, Na, Fe).", test:v=>containsTwoLetterElementSymbol(v) },
    { id:"egg", label:"Protect Paul the 🥚 (must include 🥚).", test:v=>v.includes("🥚") },
    { id:"noFire", label:"No fire emoji allowed (🔥).", test:v=>!v.includes("🔥") },
    { id:"weights4", label:"Add 4 of the weightlifter emoji 🏋️.", test:v=>countEmoji(v,"🏋️")>=4 || countEmoji(v,"🏋️‍♂️")>=4 || countEmoji(v,"🏋️‍♀️")>=4 },
    { id:"affirm", label:'Include one affirmation ("i am loved" / "i am worthy" / "i am enough").', test:v=>containsAffirmation(v) },
    { id:"atomic200", label:"Sum of atomic numbers in the password ≥ 200 (recognized symbols).", test:v=>sumAtomicNumbersInString(v) >= 200 },

    // META
    { id:"forbidden", label: `You may NOT use these letters: ${forbidden.join(", ")}`, test:v=>{
      const lc=v.toLowerCase(); return !lc.includes(forbidden[0]) && !lc.includes(forbidden[1]);
    }},
    { id:"lenShown", label:"Password must include its own length as a number (e.g., “13”).", test:v=>{
      const n = v.length.toString();
      return v.includes(n);
    }},
    { id:"primeLen", label:"Password length must be a prime number.", test:v=>isPrime(v.length) },
  ];
}

/** Progressive reveal */
function evaluateAndSlice(value, rules) {
  const results = rules.map(r => ({ id:r.id, label:r.label, valid:r.test(value) }));
  const firstFail = results.findIndex(x=>!x.valid);
  const count = firstFail === -1 ? results.length : firstFail + 1;
  return { results, visible: results.slice(0, count) };
}

/** -----------------------------
 * UI Bits
 * ----------------------------- */
function CheckIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 3L13.3 8.2 18 6 15.8 10.7 21 12 15.8 13.3 18 18 13.3 15.8 12 21 10.7 15.8 6 18 8.2 13.3 3 12 8.2 10.7 6 6 10.7 8.2 12 3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LockIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9 10V7a3 3 0 0 1 6 0v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KeyIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle
        cx="8"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M11 12h6l2 2-2 2-1.5-1.5L14 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GaugeIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 4a9 9 0 0 0-9 9 1 1 0 0 0 1 1h2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 4a9 9 0 0 1 9 9 1 1 0 0 1-1 1h-2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 12 16 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RuleItem({ label, valid, isCurrent }) {
  return (
    <li
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-2",
        "border transition-all duration-400 ease-in-out",
        valid
          ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-100 shadow-[0_0_16px_rgba(234,179,8,0.18)]"
          : "border-zinc-700/80 bg-zinc-900/70 text-zinc-200",
        isCurrent && !valid ? "animate-[blink_1.2s_ease-in-out_infinite]" : "",
        !valid &&
          "hover:border-yellow-500/60 hover:bg-zinc-900/90 hover:-translate-y-[1px]"
      ].join(" ")}
    >
      {valid ? (
        <span className="shrink-0 rounded-md bg-yellow-500/20 p-1.5 text-yellow-400 transition-all duration-300 ease-out">
          <CheckIcon className="h-4 w-4" />
        </span>
      ) : (
        <span className="shrink-0 rounded-md bg-zinc-800 p-1.5 text-zinc-300 transition-all duration-300 ease-out">
          <AlertIcon className="h-4 w-4" />
        </span>
      )}

      <span className={valid ? "font-medium tracking-wide" : "tracking-wide"}>
        {label}
      </span>
    </li>
  );
}

/** -----------------------------
 * App
 * ----------------------------- */
export default function App() {
  const [password, setPassword] = useState("");

  const forbidden = useMemo(() => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const a = alphabet[Math.floor(Math.random() * alphabet.length)];
    let b = a;
    while (b === a) b = alphabet[Math.floor(Math.random() * alphabet.length)];
    return [a, b];
  }, []);

  const RULES = useMemo(() => buildRules(forbidden), [forbidden]);
  const { results, visible } = useMemo(
    () => evaluateAndSlice(password, RULES),
    [password, RULES]
  );

  const satisfied = visible.filter((r) => r.valid).length;
  const currentIndex = visible.length - 1;
  const allDone = results.every((r) => r.valid);
  const progress = results.length === 0 ? 0 : (satisfied / results.length) * 100;

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-black text-yellow-50 selection:bg-yellow-500 selection:text-black"
      style={{
        fontFamily:
          '"Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* big soft glows */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-[-8rem] h-72 w-72 rounded-full bg-yellow-500/15 blur-3xl" />
        <div className="absolute right-[-6rem] top-20 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pt-10 animate-[fadeIn_650ms_ease-in-out]">
        {/* TOP BAR / HEADER */}
        <header className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-yellow-200/90 animate-[slideDown_500ms_ease-in-out]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-300" />
              <span className="flex items-center gap-1">
                <SparkIcon className="h-3 w-3" />
                Live Rules Engine
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-yellow-100 drop-shadow-[0_0_20px_rgba(250,204,21,0.25)]">
                Password <span className="text-yellow-400">Chaos</span>
              </h1>
              <span className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-yellow-500/15 text-yellow-300 shadow-[0_0_16px_rgba(234,179,8,0.4)] animate-[popIn_420ms_ease-out]">
                <LockIcon className="h-4 w-4" />
              </span>
            </div>

            <p className="max-w-xl text-sm sm:text-base text-zinc-300">
              Type a password and watch the rules light up in real time. When a
              rule fails, the next level stays locked until you fix it.
            </p>
          </div>

          <div className="flex gap-3 self-start md:self-auto animate-[fadeIn_700ms_ease-in-out]">
            <div className="flex items-center gap-3 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 shadow-[0_0_26px_rgba(234,179,8,0.28)] transition-all duration-500 ease-in-out hover:-translate-y-[2px] hover:shadow-[0_0_32px_rgba(234,179,8,0.4)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-500/25 text-yellow-50">
                <GaugeIcon className="h-4 w-4" />
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
                  Rules Complete
                </div>
                <div className="mt-1 text-lg font-semibold text-yellow-50">
                  {Math.min(satisfied, results.length)} / {results.length}
                </div>
              </div>
            </div>

 
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="grid flex-1 gap-6 md:gap-7 lg:gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] items-start">
          {/* LEFT: input / helper */}
          <section className="space-y-4 md:space-y-5 animate-[fadeIn_700ms_ease-in-out]">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4 sm:p-5 shadow-[0_0_32px_rgba(0,0,0,0.75)] transition-all duration-500 ease-in-out hover:-translate-y-[2px] hover:shadow-[0_0_40px_rgba(234,179,8,0.18)]">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs sm:text-sm text-yellow-200/90">
                  <LockIcon className="h-3.5 w-3.5" />
                  Enter a password
                </span>
                <div className="relative">
                  <div className="pointer-events-none absolute -inset-[2px] rounded-xl opacity-0 ring-2 ring-yellow-500/60 transition-opacity duration-300 peer-focus-within:opacity-100" />
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="peer w-full rounded-xl bg-zinc-900/80 border border-zinc-700 text-base sm:text-lg md:text-xl px-4 sm:px-5 py-3 sm:py-3.5 text-yellow-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/60 focus:border-yellow-500/50 transition-all duration-300 ease-out"
                    placeholder="Start typing something legendary…"
                    aria-label="Password input"
                  />
                  <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
                </div>
              </label>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <CheckIcon className="h-3.5 w-3.5 text-yellow-300" />
                  <span>
                    <span className="font-semibold text-yellow-300">
                      {Math.min(satisfied, results.length)}
                    </span>
                    <span> / {results.length} rules satisfied</span>
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <GaugeIcon className="h-3.5 w-3.5 text-yellow-300" />
                  <span>
                    Length:{" "}
                    <span className="font-medium text-yellow-200">
                      {password.length}
                    </span>
                  </span>
                </span>
              </div>

              {/* progress bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/80">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-400 transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* helper chips (kept empty for now, but styled for future) */}
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-zinc-400" />
            </div>

            {/* How it works panel */}
            <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/5 p-4 text-xs sm:text-sm text-yellow-100/90 shadow-[0_0_24px_rgba(234,179,8,0.16)] transition-all duration-500 ease-in-out hover:-translate-y-[2px] hover:border-yellow-300/50">
              <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-yellow-300/90">
                <SparkIcon className="h-3 w-3" />
                How it works
              </div>
              <p className="leading-relaxed">
                Rules unlock in sequence. When one fails, new rules stop revealing
                until you fix it. Tune the password until every rule on the right
                is glowing.
              </p>
            </div>

            {allDone && (
              <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm sm:text-base text-yellow-200 shadow-[0_0_30px_rgba(234,179,8,0.25)] animate-[popIn_350ms_ease-out]">
                All rules satisfied. Paul is proud. 🥚
              </div>
            )}
          </section>

          {/* RIGHT: rule feed */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4 sm:p-5 md:p-6 shadow-[0_0_32px_rgba(0,0,0,0.85)] transition-all duration-500 ease-in-out hover:-translate-y-[2px] hover:shadow-[0_0_40px_rgba(234,179,8,0.18)] animate-[fadeIn_750ms_ease-in-out]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm sm:text-base font-semibold tracking-wide text-yellow-100">
                  <SparkIcon className="h-4 w-4 text-yellow-300" />
                  Live Rule Feed
                </h2>
                <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-400">
                  Each line is evaluated every keystroke. The current rule pulses
                  until you satisfy it.
                </p>
              </div>
            </div>

            <div className="relative mt-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900/40">
              <ul className="space-y-2 sm:space-y-3">
                {visible.map((r, i) => (
                  <div
                    key={r.id}
                    className="animate-[fadeInUp_400ms_ease-out] [animation-fill-mode:both]"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <RuleItem
                      label={r.label}
                      valid={r.valid}
                      isCurrent={i === currentIndex && !r.valid}
                    />
                  </div>
                ))}
              </ul>

              <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-yellow-500/40 via-yellow-500/0 to-yellow-500/40" />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
