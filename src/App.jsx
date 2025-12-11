import { useMemo, useState, useRef, useEffect } from "react";
import Snowflakes from "./Snowflakes";

/** -----------------------------
 * Constants
 * ----------------------------- */
const DICT_WORDS = ["chaos", "winter", "cipher", "galaxy", "quantum"];

const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const brands = ["pepsi", "starbucks", "shell"];

const elementSymbols = new Set([
  "He","Li","Be","Ne","Na","Mg","Al","Si","Cl","Ar","Ca","Sc","Ti","Cr","Mn",
  "Fe","Co","Ni","Cu","Zn","Ga","Ge","As","Se","Br","Kr","Rb","Sr","Zr","Nb",
  "Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn","Sb","Te","Xe","Cs","Ba","La",
  "Ce","Pr","Nd","Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb","Lu","Hf",
  "Ta","Re","Os","Ir","Pt","Au","Hg","Tl","Pb","Bi","Po","At","Rn","Fr","Ra",
  "Ac","Th","Pa","Np","Pu","Am","Cm","Bk","Cf","Es","Fm","Md","No","Lr"
]);

const atomicNumber = {
  H: 1, He: 2, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, F: 9, Ne: 10,
  Na: 11, Mg: 12, Al: 13, Si: 14, P: 15, S: 16, Cl: 17, Ar: 18, K: 19, Ca: 20,
  Sc: 21, Ti: 22, V: 23, Cr: 24, Mn: 25, Fe: 26, Co: 27, Ni: 28, Cu: 29, Zn: 30,
};

/** -----------------------------
 * Helper functions
 * ----------------------------- */

// Sum of all decimal digits in the string
function sumDigits(str) {
  let s = 0;
  for (const ch of str) {
    if (/\d/.test(ch)) s += Number(ch);
  }
  return s;
}

// Does a string start with a letter?
function startsWithLetter(str) {
  return /^[A-Za-z]/.test(str);
}

// No character repeated 3 or more times in a row
function noTripleRepeat(str) {
  return !/(.)\1\1/.test(str);
}

// Count emoji occurrences
function countEmoji(str, emoji) {
  if (!str) return 0;
  return str.split(emoji).length - 1;
}

// Includes a month name
function containsMonth(str) {
  const lc = str.toLowerCase();
  return months.some((m) => lc.includes(m));
}

// Includes one of the sponsor brand names
function containsBrand(str) {
  const lc = str.toLowerCase();
  return brands.some((b) => lc.includes(b));
}

function containsTwoLetterElementSymbol(str) {
  for (let i = 0; i < str.length - 1; i++) {
    const pair = str[i] + str[i + 1];
    const norm = pair[0].toUpperCase() + pair[1].toLowerCase();
    if (elementSymbols.has(norm)) return true;
  }
  return false;
}

function sumAtomicNumbersInString(str) {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    const one = str[i].toUpperCase();
    if (atomicNumber[one]) sum += atomicNumber[one];
    if (i < str.length - 1) {
      const two = str[i].toUpperCase() + str[i + 1].toLowerCase();
      if (atomicNumber[two]) sum += atomicNumber[two];
    }
  }
  return sum;
}

// Grandpa rule: 👴 and 🏠 must be adjacent and there must be no 🪨
function grandpaRuleTest(str) {
  const g = str.indexOf("👴");
  const h = str.lastIndexOf("🏠");
  if (g === -1 || h === -1) return false;
  if (h <= g) return false;
  if (str.includes("🪨")) return false;
  return h - g === 1;
}

/** -----------------------------
 * Rule Builder (easy → hard, cohesive)
 * ----------------------------- */
function buildBaseRules(forbidden) {
  return [
    // 1–5: basic password stuff
    {
      id: "len5",
      label: "Your password must be at least 5 characters long.",
      test: (v) => v.length >= 5,
    },
    {
      id: "lower",
      label: "Include at least one lowercase letter.",
      test: (v) => /[a-z]/.test(v),
    },
    {
      id: "upper",
      label: "Include at least one uppercase letter.",
      test: (v) => /[A-Z]/.test(v),
    },
    {
      id: "digit",
      label: "Include at least one number.",
      test: (v) => /\d/.test(v),
    },
    {
      id: "special",
      label: "Include at least one special character (like !, @, #, $, %, &).",
      test: (v) => /[!@#$%^&*()[\]{};:'",.<>/?\\|`~_\-+=]/.test(v),
    },

    // 6–9: light constraints, still human-readable
    {
      id: "digitSum25",
      label: "All the digits in your password must add up to exactly 25.",
      test: (v) => {
        const digits = v.match(/\d/g);
        if (!digits) return false;
        return sumDigits(v) === 25;
      },
    },
    {
      id: "monthName",
      label: "Include the name of a month (like March or October).",
      test: (v) => containsMonth(v),
    },
    {
      id: "sponsorBrand",
      label: "Include one of our sponsors: pepsi, starbucks, or shell.",
      test: (v) => containsBrand(v),
    },

    // 10–12: event/emoji/game rules
    {
      id: "fireSafety",
      label:
        "If your password ever contains 🔥, you must also include 💧 or 🧯 to put it out.",
      test: (v) => {
        if (!v.includes("🔥")) return true;
        return v.includes("💧") || v.includes("🧯");
      },
    },
    {
      id: "noTriples",
      label: "No character may repeat 3 or more times in a row (no aaa, 111, !!!).",
      test: (v) => noTripleRepeat(v),
    },

    // 13–15: slightly more “language/regex” flavored
    {
      id: "startsWithLetter",
      label: "Your password must start with a letter or emoji.",
      test: (v) => v.length > 0 && !v[0].match(/\s/),
    },
    {
      id: "minTwoWords",
      label: "Include at least two 'words' separated by a space (e.g., hello WORLD7!).",
      test: (v) => v.trim().split(/\s+/).filter(Boolean).length >= 2,
    },

    // 16–18: nerdy / chemistry rules
    {
      id: "twoLetterElement",
      label: "Include a two-letter chemical element symbol (like He, Na, or Fe).",
      test: (v) => containsTwoLetterElementSymbol(v),
    },
    {
      id: "atomicSum",
      label:
        "The chemical element symbols in your password must have atomic numbers that add up to at least 120.",
      test: (v) => sumAtomicNumbersInString(v) >= 120,
    },
    {
      id: "strongEnough",
      label: "Your password must show its strength: include at least 3 🏋️ emojis.",
      test: (v) =>
        countEmoji(v, "🏋️") +
          countEmoji(v, "🏋️‍♂️") +
          countEmoji(v, "🏋️‍♀️") >= 3,
    },

    // 19–21: meta / language shape
    {
      id: "forbidden",
      label: `A sacrifice must be made. You may NOT use these letters anywhere: ${forbidden.join(
        ", "
      )}.`,
      test: (v) => {
        const lc = v.toLowerCase();
        return !lc.includes(forbidden[0]) && !lc.includes(forbidden[1]);
      },
    },
    {
      id: "vowelCount",
      label: "Include at least 5 vowels in total (a, e, i, o, u, any case).",
      test: (v) => {
        const m = v.match(/[aeiouAEIOU]/g);
        return m && m.length >= 5;
      },
    },
    {
      id: "noWhitespaceEnd",
      label: "Your password may not start or end with a space.",
      test: (v) => !(v.startsWith(" ") || v.endsWith(" ")),
    },
  ];
}

/** Progressive reveal (with rule activation) */
function evaluateAndSlice(value, rules, activeRuleIds) {
  const results = rules.map((r) => {
    const isActive = activeRuleIds ? activeRuleIds.has(r.id) : true;
    const valid = isActive ? r.test(value) : true; // disabled rules auto-pass
    return { id: r.id, label: r.label, valid, isActive };
  });

  const firstFail = results.findIndex((x) => !x.valid);
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

function RuleItem({ label, valid, isCurrent, isActive, onToggle }) {
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
          "hover:border-yellow-500/60 hover:bg-zinc-900/90 hover:-translate-y-[1px]",
        !isActive ? "opacity-60 border-dashed" : "",
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

      <span
        className={
          valid
            ? "font-medium tracking-wide text-sm sm:text-[0.9rem]"
            : "tracking-wide text-sm sm:text-[0.9rem]"
        }
      >
        {!isActive && (
          <span className="mr-1 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-400">
            Off
          </span>
        )}
        {label}
      </span>

      <button
        type="button"
        onClick={onToggle}
        className="ml-auto text-[10px] sm:text-[11px] rounded-full border border-zinc-600 px-2 py-0.5 hover:border-yellow-400 hover:text-yellow-300 transition-colors"
      >
        {isActive ? "Disable" : "Enable"}
      </button>
    </li>
  );
}

/** -----------------------------
 * App
 * ----------------------------- */
export default function App() {
  const [password, setPassword] = useState("");
  const [grandpaInitialized, setGrandpaInitialized] = useState(false);
  const [grandpaMessage, setGrandpaMessage] = useState("");

  // Forbidden letters (static for this session)
  const forbidden = useMemo(() => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const a = alphabet[Math.floor(Math.random() * alphabet.length)];
    let b = a;
    while (b === a) b = alphabet[Math.floor(Math.random() * alphabet.length)];
    return [a, b];
  }, []);

  // Base rules
  const baseRules = useMemo(() => buildBaseRules(forbidden), [forbidden]);

  /* -----------------------------
   * API STATE: DICTIONARY
   * ----------------------------- */
  const dictWord = useMemo(
    () => DICT_WORDS[Math.floor(Math.random() * DICT_WORDS.length)],
    []
  );

  const [dictData, setDictData] = useState({
    word: dictWord,
    definition: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchDictionary() {
      try {
        setDictData((prev) => ({ ...prev, loading: true, error: null }));
        const res = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${dictWord}`
        );
        if (!res.ok) throw new Error("Dictionary fetch failed");
        const data = await res.json();
        const def =
          data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition ||
          "No definition found.";
        if (!cancelled) {
          setDictData({
            word: dictWord,
            definition: def,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setDictData({
            word: dictWord,
            definition: null,
            loading: false,
            error: err.message || "Dictionary error",
          });
        }
      }
    }

    fetchDictionary();
    return () => {
      cancelled = true;
    };
  }, [dictWord]);

  /* -----------------------------
   * API STATE: WEATHER (Detroit, °F)
   * ----------------------------- */
  const [weatherData, setWeatherData] = useState({
    tempF: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        setWeatherData((prev) => ({ ...prev, loading: true, error: null }));
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=42.3314&longitude=-83.0458&current=temperature_2m&temperature_unit=fahrenheit"
        );
        if (!res.ok) throw new Error("Weather fetch failed");
        const data = await res.json();
        const tempF = data?.current?.temperature_2m ?? null;
        if (!cancelled) {
          setWeatherData({
            tempF,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setWeatherData({
            tempF: null,
            loading: false,
            error: err.message || "Weather error",
          });
        }
      }
    }

    fetchWeather();
    return () => {
      cancelled = true;
    };
  }, []);

  /* -----------------------------
   * API-BASED RULES
   * ----------------------------- */
  const apiRules = useMemo(() => {
    const rules = [];

    // Dictionary rule
    if (dictData.loading) {
      rules.push({
        id: "dictRule",
        label: "Loading a secret dictionary word…",
        test: () => false,
      });
    } else if (dictData.error || !dictData.definition) {
      rules.push({
        id: "dictRule",
        label: "Dictionary rule skipped (offline).",
        test: () => true,
      });
    } else {
      rules.push({
        id: "dictRule",
        label: `Include the English word that matches this definition: “${dictData.definition}”.`,
        test: (v) => v.toLowerCase().includes(dictData.word.toLowerCase()),
      });
    }

    // Weather rule
    if (weatherData.loading) {
      rules.push({
        id: "weatherRule",
        label: "Fetching Detroit's current temperature…",
        test: () => false,
      });
    } else if (weatherData.error || weatherData.tempF == null) {
      rules.push({
        id: "weatherRule",
        label: "Weather rule skipped (offline).",
        test: () => true,
      });
    } else {
      const rounded = Math.round(weatherData.tempF * 10) / 10; // 1 decimal
      const tolerance = 3; // ±3°F allowed

      rules.push({
        id: "weatherRule",
        label: `Include a number within ±${tolerance}°F of Detroit's current temperature (${rounded.toFixed(
          1
        )}°F).`,
        test: (v) => {
          const matches = v.match(/-?\d+(\.\d+)?/g);
          if (!matches) return false;
          return matches.some((m) => {
            const n = parseFloat(m);
            if (Number.isNaN(n)) return false;
            return Math.abs(n - rounded) <= tolerance;
          });
        },
      });
    }

    return rules;
  }, [dictData, weatherData]);

  /* -----------------------------
   * GAME-BASED RULES (Grandpa in password)
   * ----------------------------- */
  const gameRules = useMemo(
    () => [
      {
        id: "grandpaHome",
        label:
          "Grandpa must reach home: your password must contain 👴 and 🏠 next to each other with no stones 🪨 anywhere.",
        test: (v) => grandpaRuleTest(v),
      },
    ],
    []
  );

  const RULES = useMemo(
    () => [...baseRules, ...gameRules, ...apiRules],
    [baseRules, gameRules, apiRules]
  );

  /* -----------------------------
   * Rule activation (Enable / Disable)
   * ----------------------------- */
  const [activeRuleIds, setActiveRuleIds] = useState(() => new Set());

  // Keep activeRuleIds in sync with RULES
  useEffect(() => {
    setActiveRuleIds((prev) => {
      const next = new Set(prev);
      const ruleIdSet = new Set(RULES.map((r) => r.id));

      for (const id of next) {
        if (!ruleIdSet.has(id)) next.delete(id);
      }
      RULES.forEach((r) => {
        if (!next.has(r.id)) next.add(r.id);
      });

      return next;
    });
  }, [RULES]);

  const handleToggleRule = (id) => {
    setActiveRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { results, visible } = useMemo(
    () => evaluateAndSlice(password, RULES, activeRuleIds),
    [password, RULES, activeRuleIds]
  );

  const activeResults = results.filter((r) => r.isActive);
  const satisfied = activeResults.filter((r) => r.valid).length;
  const allDone =
    activeResults.length > 0 && satisfied === activeResults.length;
  const progress =
    activeResults.length === 0 ? 0 : (satisfied / activeResults.length) * 100;
  const currentIndex = visible.length - 1;

  // --- SOUND EFFECTS ---
  const correctSoundRef = useRef(null);
  const incorrectSoundRef = useRef(null);
  const previousVisibleRef = useRef(null);

  useEffect(() => {
    const currentVisible = visible.map((r) => r.valid);
    const prev = previousVisibleRef.current;

    let shouldPlayCorrect = false;
    let shouldPlayIncorrect = false;

    if (prev) {
      const len = Math.min(prev.length, currentVisible.length);

      for (let i = 0; i < len; i++) {
        if (!prev[i] && currentVisible[i]) {
          shouldPlayCorrect = true;
        } else if (prev[i] && !currentVisible[i]) {
          shouldPlayIncorrect = true;
        }
      }

      if (currentVisible.length < prev.length) {
        for (let i = currentVisible.length; i < prev.length; i++) {
          if (prev[i]) {
            shouldPlayIncorrect = true;
            break;
          }
        }
      }
    }

    previousVisibleRef.current = currentVisible;

    if (shouldPlayCorrect && correctSoundRef.current) {
      correctSoundRef.current.currentTime = 0;
      correctSoundRef.current.play().catch(() => {});
    }

    if (shouldPlayIncorrect && incorrectSoundRef.current) {
      incorrectSoundRef.current.currentTime = 0;
      incorrectSoundRef.current.play().catch(() => {});
    }
  }, [visible]);

  /* -----------------------------
   * GRANDPA INITIAL INJECTION
   * ----------------------------- */
  const handlePasswordChange = (raw) => {
    setGrandpaMessage("");
    if (!grandpaInitialized) {
      if (raw.length === 0) {
        setPassword("");
        return;
      }
      // First time: wrap whatever they typed with 👴 ... 🏠
      const wrapped = "👴" + raw + "🏠";
      setPassword(wrapped);
      setGrandpaInitialized(true);
      setGrandpaMessage(
        "We added Grandpa 👴 at the start and his home 🏠 at the end. Keep the path clear of stones 🪨!"
      );
    } else {
      setPassword(raw);
    }
  };

  /* -----------------------------
   * GRANDPA MOVEMENT (every ~12s)
   * ----------------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setPassword((prev) => {
        if (!activeRuleIds.has("grandpaHome")) return prev;
        const g = prev.indexOf("👴");
        const h = prev.lastIndexOf("🏠");
        if (g === -1 || h === -1 || h <= g) return prev;

        // Already at home (adjacent)
        if (h - g === 1) return prev;

        const nextChar = prev[g + 1];

        // If the next step is a stone, Grandpa stumbles and the game resets
        if (nextChar === "🪨") {
          setGrandpaMessage("Grandpa tripped on a stone 🪨 and the game reset!");
          setGrandpaInitialized(false);
          return "";
        }

        const chars = [...prev];
        const temp = chars[g + 1];
        chars[g + 1] = "👴";
        chars[g] = temp;
        return chars.join("");
      });
    }, 12000); // move every 12 seconds

    return () => clearInterval(interval);
  }, [activeRuleIds]);

  /* -----------------------------
   * STONE SPAWNING (every ~10s)
   * ----------------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setPassword((prev) => {
        if (!activeRuleIds.has("grandpaHome")) return prev;
        const g = prev.indexOf("👴");
        const h = prev.lastIndexOf("🏠");
        if (g === -1 || h === -1 || h <= g + 1) {
          return prev; // too short path or invalid
        }

        // Don't spawn stones once Grandpa is at home
        if (h - g === 1) return prev;

        const candidates = [];
        for (let i = g + 1; i < h; i++) {
          const ch = prev[i];
          if (ch === "👴" || ch === "🏠" || ch === "🪨") continue;

          // no adjacent stones
          const left = i > 0 ? prev[i - 1] : null;
          const right = i + 1 < prev.length ? prev[i + 1] : null;
          if (left === "🪨" || right === "🪨") continue;

          // not right next to Grandpa (give user reaction time)
          if (i === g + 1 || i === g - 1) continue;

          candidates.push(i);
        }

        if (candidates.length === 0) return prev;

        const pos = candidates[Math.floor(Math.random() * candidates.length)];
        return prev.slice(0, pos) + "🪨" + prev.slice(pos);
      });
    }, 10000); // spawn every 10 seconds

    return () => clearInterval(interval);
  }, [activeRuleIds]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-black text-yellow-50 font-display selection:bg-yellow-500 selection:text-black">
      {/* Audio elements */}
      <audio ref={correctSoundRef} src="/sounds/correct.mp3" preload="auto" />
      <audio
        ref={incorrectSoundRef}
        src="/sounds/incorrect.mp3"
        preload="auto"
      />

      {/* Snowflakes effect */}
      <Snowflakes />

      {/* big soft glows */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-[-8rem] h-72 w-72 rounded-full bg-yellow-500/15 blur-3xl" />
        <div className="absolute right-[-6rem] top-20 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
      </div>

      {/* main container with 2s ease-in-out animation */}
      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pt-10 animate-[fadeInUp_2s_ease-in-out]">
        {/* TOP BAR / HEADER */}
        <header className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3 w-1/2">
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

             {/* Grandpa status / hint */}
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs sm:text-sm text-yellow-100 shadow-[0_0_24px_rgba(0,0,0,0.7)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-500/15 text-xl">
                👴
              </div>
              <div className="flex-1">
                <div className="font-semibold tracking-wide text-yellow-200">
                  Grandpa&apos;s Journey
                </div>
                <div className="mt-0.5 text-[11px] sm:text-xs text-yellow-100/80">
                  We place 👴 at the very start and 🏠 at the very end of your
                  password the first time you type. Stones 🪨 appear between
                  them over time. Delete the stones before Grandpa walks into
                  one or the whole game resets.
                </div>
                {grandpaMessage && (
                  <div className="mt-1 text-[11px] text-yellow-200/90">
                    {grandpaMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 self-start md:self-auto animate-[fadeIn_700ms_ease-in-out] w-1/2">
            <div className="flex items-center gap-3 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 shadow-[0_0_26px_rgba(234,179,8,0.28)] transition-all duration-500 ease-in-out hover:-translate-y-[2px] hover:shadow-[0_0_32px_rgba(234,179,8,0.4)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-500/25 text-yellow-50">
                <GaugeIcon className="h-4 w-4" />
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
                  Rules Complete
                </div>
                <div className="mt-1 flex justify-start text-lg font-semibold text-yellow-50">
                  {satisfied} / {activeResults.length || results.length}
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
                    onChange={(e) => handlePasswordChange(e.target.value)}
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
                      {satisfied}
                    </span>
                    <span>
                      {" "}
                      / {activeResults.length || results.length} rules satisfied
                    </span>
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
            </div>

            {/* How it works panel */}
            <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/5 p-4 text-xs sm:text-sm text-yellow-100/90 shadow-[0_0_24px_rgba(234,179,8,0.16)] transition-all duration-500 ease-in-out hover:-translate-y-[2px] hover:border-yellow-300/50">
              <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-yellow-300/90">
                <SparkIcon className="h-3 w-3" />
                How it works
              </div>
              <p className="leading-relaxed">
                Rules unlock in order. When one fails, new rules stop revealing
                until you fix it. You can temporarily disable any rule for
                demonstrations. Grandpa&apos;s rule behaves just like the
                others, but under the hood we&apos;re mutating your password
                string, spawning 🪨, and walking 👴 toward 🏠 over time.
              </p>
            </div>

            {allDone && (
              <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm sm:text-base text-yellow-200 shadow-[0_0_30px_rgba(234,179,8,0.25)] animate-[popIn_350ms_ease-out]">
                All active rules satisfied. The language is accepted. Grandpa is
                standing safely by his house. 👴🏠
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
                  Each rule is evaluated on every keystroke. The current rule
                  pulses until you satisfy it. Use the toggle on the right to
                  Disable / Enable rules mid-game.
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
                      isActive={r.isActive}
                      onToggle={() => handleToggleRule(r.id)}
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
