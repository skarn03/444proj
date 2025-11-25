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
  // Two-letter symbols (a good chunk; extend if you like)
  "He","Li","Be","Ne","Na","Mg","Al","Si","Cl","Ar","Ca","Sc","Ti","Cr","Mn",
  "Fe","Co","Ni","Cu","Zn","Ga","Ge","As","Se","Br","Kr","Rb","Sr","Zr","Nb",
  "Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn","Sb","Te","Xe","Cs","Ba","La",
  "Ce","Pr","Nd","Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb","Lu","Hf",
  "Ta","Re","Os","Ir","Pt","Au","Hg","Tl","Pb","Bi","Po","At","Rn","Fr","Ra",
  "Ac","Th","Pa","Np","Pu","Am","Cm","Bk","Cf","Es","Fm","Md","No","Lr"
]);

// A small mapping (first 30 elements) for atomic number sums; expand as needed
const atomicNumber = {
  H:1, He:2, Li:3, Be:4, B:5, C:6, N:7, O:8, F:9, Ne:10,
  Na:11, Mg:12, Al:13, Si:14, P:15, S:16, Cl:17, Ar:18, K:19, Ca:20,
  Sc:21, Ti:22, V:23, Cr:24, Mn:25, Fe:26, Co:27, Ni:28, Cu:29, Zn:30
};

// Roman numeral conversion
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

// Extract contiguous roman tokens like "V", "VII", "X" from a string
function extractRomanTokens(str) {
  const tokens = [];
  const up = str.toUpperCase();
  let cur = "";
  const isRomanChar = (c) => "IVXLCDM".includes(c);
  for (const c of up) {
    if (isRomanChar(c)) {
      cur += c;
    } else {
      if (cur.length > 0) tokens.push(cur), (cur = "");
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
  // simple count by splitting
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
  // Check any 2-char window as a valid element symbol (case-sensitive like periodic)
  for (let i=0; i<str.length-1; i++) {
    const pair = str[i] + str[i+1];
    // Normalize periodic-case: first uppercase, second lowercase
    const norm = pair[0].toUpperCase() + pair[1].toLowerCase();
    if (elementSymbols.has(norm)) return true;
  }
  return false;
}

function sumAtomicNumbersInString(str) {
  // Scan 1- or 2-letter symbols (periodic-case) and sum known atomic numbers
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
 * Rules (from easy → chaotic)
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

    // ADVANCED CHAOS (but still offline)
    { id:"twoLetterElem", label:"Include a two-letter element symbol (e.g., He, Na, Fe).", test:v=>containsTwoLetterElementSymbol(v) },
    { id:"egg", label:"Protect Paul the 🥚 (must include 🥚).", test:v=>v.includes("🥚") },
    { id:"noFire", label:"No fire emoji allowed (🔥).", test:v=>!v.includes("🔥") },
    { id:"weights4", label:"Add 4 of the weightlifter emoji 🏋️.", test:v=>countEmoji(v,"🏋️")>=4 || countEmoji(v,"🏋️‍♂️")>=4 || countEmoji(v,"🏋️‍♀️")>=4 },
    { id:"affirm", label:'Include one affirmation ("i am loved" / "i am worthy" / "i am enough").', test:v=>containsAffirmation(v) },
    { id:"atomic200", label:"Sum of atomic numbers in the password ≥ 200 (based on recognized symbols).", test:v=>sumAtomicNumbersInString(v) >= 200 },

    // META PUZZLES
    { id:"forbidden", label: `You may NOT use these letters: ${forbidden.join(", ")}`, test:v=>{
      const lc=v.toLowerCase(); return !lc.includes(forbidden[0]) && !lc.includes(forbidden[1]);
    }},
    { id:"lenShown", label:"Password must include its own length as a number (e.g., '13').", test:v=>{
      const n = v.length.toString();
      return v.includes(n);
    }},
    { id:"primeLen", label:"Password length must be a prime number.", test:v=>isPrime(v.length) },
  ];
}

/** Progressive reveal: show through first failing rule */
function evaluateAndSlice(value, rules) {
  const results = rules.map(r => ({ id:r.id, label:r.label, valid:r.test(value) }));
  const firstFail = results.findIndex(x=>!x.valid);
  const count = firstFail === -1 ? results.length : firstFail + 1;
  return { results, visible: results.slice(0, count) };
}

function RuleItem({ label, valid, isCurrent }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <span
        className={[
          "inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]",
          valid ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                : "border-slate-500 bg-slate-900 text-slate-300",
          isCurrent && !valid ? "animate-pulse" : "",
        ].join(" ")}
      >
        {valid ? "✓" : "!"}
      </span>
      <span className={valid ? "text-emerald-300" : "text-slate-300"}>{label}</span>
      {isCurrent && !valid && <span className="ml-auto text-[10px] text-slate-500">(current)</span>}
    </li>
  );
}

export default function App() {
  const [password, setPassword] = useState("");

  // Randomly pick 2 forbidden letters once
  const forbidden = useMemo(() => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const a = alphabet[Math.floor(Math.random()*alphabet.length)];
    let b = a;
    while (b === a) b = alphabet[Math.floor(Math.random()*alphabet.length)];
    return [a,b];
  }, []);

  const RULES = useMemo(() => buildRules(forbidden), [forbidden]);

  const { results, visible } = useMemo(
    () => evaluateAndSlice(password, RULES),
    [password, RULES]
  );
  const satisfied = visible.filter(r=>r.valid).length;
  const currentIndex = visible.length - 1;
  const allDone = results.every(r=>r.valid);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="max-w-md w-full mx-4 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
        <h1 className="text-2xl font-bold mb-2 text-emerald-400">Password Chaos (Dev Build)</h1>
        <p className="text-sm text-slate-400 mb-4">
          Start simple. It gets weirder. Break an earlier rule and you’ll get bumped back.
        </p>

        <label className="block mb-3">
          <span className="text-sm text-slate-200">Enter a password</span>
          <input
            type="text"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Start typing..."
            aria-label="Password input"
          />
        </label>

        <div className="mb-2 text-xs text-slate-400">
          {Math.min(satisfied, results.length)}/{results.length} rules satisfied
        </div>

        <ul className="space-y-2">
          {visible.map((r, i) => (
            <RuleItem
              key={r.id}
              label={r.label}
              valid={r.valid}
              isCurrent={i === currentIndex && !r.valid}
            />
          ))}
        </ul>

        {allDone && (
          <div className="mt-4 text-sm text-emerald-300">
            All rules satisfied. Paul is proud. 🥚
          </div>
        )}
      </div>
    </div>
  );
}
