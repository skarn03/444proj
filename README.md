# Password Chaos

Password Chaos is an interactive password puzzle and rule-based challenge built with React. Instead of checking all password rules at once, the app reveals rules progressively. When the user satisfies the current rule, the next rule unlocks. As the puzzle continues, the constraints shift from simple security checks to creative logic tasks, live API-based rules, emoji safety conditions, and even a small real-time game involving a Grandpa character who must safely reach his house.

This project shows how password validation can become an engaging and educational experience instead of just a plain error message.

---

## ✨ Features

- **Progressive Rule System**  
  Rules unlock one by one as the user satisfies them.

- **Core Game-Shaping Rules**  
  - Minimum length 5  
  - One lowercase and one uppercase letter  
  - One digit and one special character  
  - Digit sum equals 25  
  - Include a month name and a sponsor word  
  - Include a two-letter chemical symbol  
  - Atomic number sum threshold  
  - Forbidden letters and vowel requirement  

- **API-Based Rules**  
  - Dictionary definition requirement  
  - Detroit temperature rule using Open-Meteo API  

- **Grandpa Rule (Mini-Game)**  
  - Password becomes: `core_left + 👴 + core_right + 🏠`  
  - Grandpa auto-walks to the right  
  - Stones 🪨 spawn randomly  
  - If password contains `👴🪨` Grandpa “stumbles” and resets  
  - Rule passes when the password ends in `…👴🏠` with no stones  

- **User Experience Enhancements**  
  - Live Rule Feed  
  - Progress bar  
  - Sound effects for rule success or failure  
  - Dark glowing theme with animations and snowflakes  

---

## 🧠 How It Works

Password Chaos is powered by a dynamic rule engine.  
Each rule contains an ID, a label, and a test function that evaluates the current password.  
The system detects the first failing rule and reveals only rules up to that point.  
Rules can be toggled on or off for testing.

The Grandpa mechanic uses timers, random stone generation, and string reconstruction every time the user types or the game updates.

---

## 🛠 Tech Stack

- **Frontend:** React  
- **APIs:** Dictionary API, Open-Meteo Weather API  
- **Styling:** Tailwind-style utility classes  
- **Extras:** Snowflake animation, sound effects  

---

## 🚀 Getting Started
1. Clone the repository
Go into the project directory: cd password-chaos

2. Install dependencies
npm install

3. Run the development server
npm run dev


Then open the shown local URL in your browser, for example:

http://localhost:5173

## 🧪 Concepts Demonstrated

1. String processing and pattern matching

2. Progressive rule-based validation

3. Asynchronous data fetching and error handling

4. Timers and stateful animation logic

5. Random events used in a UI context

6. Modular and testable rule design

## 👥 Team Members

Sahil, Macrus, Turjo
