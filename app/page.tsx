"use client";

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUzQmyZv8Y_8JRjK5iV80T68g5fzJBTOk",
  authDomain: "guard-schedule.firebaseapp.com",
  projectId: "guard-schedule",
  storageBucket: "guard-schedule.firebasestorage.app",
  messagingSenderId: "538986053667",
  appId: "1:538986053667:web:7279603a60afba6ac1b196"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const UNMANNED = "לא מאויישת";
const DEFAULT_GUARDS = ["סולד", "רון", "שלו", "עידן", "טום", "רוי"];

const DAYS = ["חמישי", "שישי", "שבת", "ראשון", "שני", "שלישי", "רביעי", "חמישי (סיום)"];
const SHIFTS = [
  { time: "05:00-09:00", count: 1 },
  { time: "09:00-13:00", count: 1 },
  { time: "13:00-17:00", count: 1 },
  { time: "17:00-21:00", count: 1 },
  { time: "21:00-01:00", count: 2 },
  { time: "01:00-05:00", count: 2 },
];

const COLOR_POOL = [
  "bg-red-900/60 text-red-100 border-red-700",
  "bg-blue-900/60 text-blue-100 border-blue-700",
  "bg-emerald-900/60 text-emerald-100 border-emerald-700",
  "bg-orange-900/60 text-orange-100 border-orange-700",
  "bg-purple-900/60 text-purple-100 border-purple-700",
  "bg-pink-900/60 text-pink-100 border-pink-700",
  "bg-yellow-900/60 text-yellow-100 border-yellow-700",
  "bg-cyan-900/60 text-cyan-100 border-cyan-700",
  "bg-lime-900/60 text-lime-100 border-lime-700",
  "bg-indigo-900/60 text-indigo-100 border-indigo-700",
  "bg-teal-900/60 text-teal-100 border-teal-700",
  "bg-rose-900/60 text-rose-100 border-rose-700",
];
const UNMANNED_COLOR = "bg-gray-800 text-gray-400 border-gray-600 border-dashed";

function buildColorMap(guards: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  guards.forEach((g, i) => { map[g] = COLOR_POOL[i % COLOR_POOL.length]; });
  map[UNMANNED] = UNMANNED_COLOR;
  return map;
}

const initialSchedule: string[][][] = [
  [[UNMANNED], [UNMANNED], [UNMANNED], ["שלו"], ["סולד", "רון"], ["טום", "רוי"]],
  [["עידן"], ["רון"], ["שלו"], ["רוי"], ["סולד", "רון"], ["שלו", "עידן"]],
  [["טום"], ["רוי"], ["רון"], ["סולד"], ["טום", "רוי"], ["שלו", "עידן"]],
  [["סולד"], ["רון"], ["רוי"], ["עידן"], ["סולד", "רון"], ["טום", "רוי"]],
  [["שלו"], ["עידן"], ["רון"], ["טום"], ["שלו", "עידן"], ["סולד", "רון"]],
  [["טום"], ["שלו"], ["עידן"], ["סולד"], ["טום", "רוי"], ["שלו", "עידן"]],
  [["סולד"], ["טום"], ["רוי"], ["עידן"], ["סולד", "רון"], ["טום", "רוי"]],
  [["שלו"], ["סולד"], [UNMANNED], [UNMANNED], [UNMANNED, UNMANNED], [UNMANNED, UNMANNED]]
];

export default function ScheduleBoard() {
  const [schedule, setSchedule] = useState<string[][][]>(initialSchedule);
  const [guards, setGuards] = useState<string[]>(DEFAULT_GUARDS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [newGuardName, setNewGuardName] = useState("");
  const [showGuardManager, setShowGuardManager] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const colorMap = buildColorMap(guards);
  const allGuardOptions = [...guards, UNMANNED];

  useEffect(() => {
    const docRef = doc(db, "schedules", "main_schedule_v4");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSchedule(JSON.parse(data.scheduleData));
        if (data.guards) setGuards(JSON.parse(data.guards));
      } else {
        setDoc(docRef, {
          scheduleData: JSON.stringify(initialSchedule),
          guards: JSON.stringify(DEFAULT_GUARDS),
        });
      }
      setIsLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  const saveToFirebase = async (newSchedule: string[][][], newGuards: string[]) => {
    try {
      await setDoc(doc(db, "schedules", "main_schedule_v4"), {
        scheduleData: JSON.stringify(newSchedule),
        guards: JSON.stringify(newGuards),
      });
    } catch (err) {
      console.error("Error saving:", err);
    }
  };

  const updateGuard = async (dayIndex: number, shiftIndex: number, slotIndex: number, newName: string) => {
    const newSchedule = JSON.parse(JSON.stringify(schedule));
    newSchedule[dayIndex][shiftIndex][slotIndex] = newName;
    setSchedule(newSchedule);
    await saveToFirebase(newSchedule, guards);
  };

  const addGuard = async () => {
    const name = newGuardName.trim();
    if (!name) { setError("יש להזין שם"); return; }
    if (guards.includes(name)) { setError("שומר זה כבר קיים"); return; }
    if (name === UNMANNED) { setError("שם לא תקין"); return; }
    const newGuards = [...guards, name];
    setGuards(newGuards);
    setNewGuardName("");
    setError("");
    await saveToFirebase(schedule, newGuards);
  };

  const removeGuard = async (name: string) => {
    const newSchedule: string[][][] = schedule.map(day =>
      day.map(shift => shift.map(g => (g === name ? UNMANNED : g)))
    );
    const newGuards = guards.filter(g => g !== name);
    setGuards(newGuards);
    setSchedule(newSchedule);
    setConfirmRemove(null);
    await saveToFirebase(newSchedule, newGuards);
  };

  const getShiftCounts = () => {
    const counts: Record<string, number> = {};
    guards.forEach(g => (counts[g] = 0));
    schedule.forEach(day => {
      day.forEach(shift => {
        shift.forEach(guard => {
          if (guard && guard !== UNMANNED && counts[guard] !== undefined) counts[guard]++;
        });
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  if (!isLoaded) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white text-2xl font-bold">
      טוען נתונים...
    </div>
  );

  return (
    <div className="p-4 bg-gray-950 min-h-screen text-right text-gray-100 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 flex-1 text-center">
            לוז שמירות
          </h1>
          <button
            onClick={() => { setShowGuardManager(v => !v); setError(""); setConfirmRemove(null); }}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            <span>👥</span>
            ניהול שומרים
          </button>
        </div>

        {/* Guard Manager Panel */}
        {showGuardManager && (
          <div className="mb-8 bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-200 mb-4">מאגר השומרים</h2>

            {/* Current Guards */}
            <div className="flex flex-wrap gap-2 mb-5 min-h-[2.5rem]">
              {guards.length === 0 && (
                <span className="text-gray-500 text-sm italic">אין שומרים במאגר</span>
              )}
              {guards.map(name => (
                <div key={name} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium text-sm ${colorMap[name]}`}>
                  <span>{name}</span>
                  {confirmRemove === name ? (
                    <span className="flex items-center gap-1 mr-1">
                      <button
                        onClick={() => removeGuard(name)}
                        className="bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-0.5 rounded font-bold"
                      >
                        אישור
                      </button>
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-0.5 rounded"
                      >
                        ביטול
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmRemove(name)}
                      className="opacity-60 hover:opacity-100 transition-opacity text-base leading-none"
                      title={`הסר את ${name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Warning */}
            {confirmRemove && (
              <p className="text-yellow-400 text-sm mb-4 bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-3 py-2">
                ⚠️ הסרת <strong>{confirmRemove}</strong> תחליף את כל המשמרות שלו ב&quot;לא מאויישת&quot;. האם להמשיך?
              </p>
            )}

            {/* Add Guard */}
            <div className="flex gap-2 items-start">
              <div className="flex-1 max-w-xs">
                <input
                  ref={inputRef}
                  type="text"
                  value={newGuardName}
                  onChange={e => { setNewGuardName(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && addGuard()}
                  placeholder="שם שומר חדש"
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
              </div>
              <button
                onClick={addGuard}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                + הוסף שומר
              </button>
            </div>
          </div>
        )}

        {/* Schedule Table */}
        <div className="overflow-x-auto shadow-2xl rounded-xl border border-gray-800 mb-12">
          <table className="min-w-full bg-gray-900 text-sm text-center border-collapse">
            <thead className="bg-black text-gray-300">
              <tr>
                <th className="py-4 px-3 border border-gray-800 font-semibold">שעות / ימים</th>
                {DAYS.map((day, i) => (
                  <th key={i} className="py-4 px-3 border border-gray-800 w-36 font-semibold">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHIFTS.map((shift, shiftIndex) => (
                <tr key={shiftIndex} className="hover:bg-gray-800/50 transition-colors border-b border-gray-800">
                  <td className="py-3 px-3 border-l border-gray-800 font-semibold bg-black/40">
                    <span className="text-gray-200 text-base">{shift.time}</span>
                    <div className="text-xs text-gray-500 font-normal mt-1">
                      ({shift.count === 1 ? 'שומר אחד' : '2 שומרים'})
                    </div>
                  </td>
                  {DAYS.map((_, dayIndex) => (
                    <td key={dayIndex} className="py-3 px-2 border-l border-gray-800 align-top transition-colors">
                      {schedule[dayIndex][shiftIndex].map((guardName, slotIndex) => {
                        const colorClass = (guardName && colorMap[guardName]) ? colorMap[guardName] : UNMANNED_COLOR;
                        return (
                          <select
                            key={slotIndex}
                            className={`w-full mb-1.5 p-2 border rounded-md cursor-pointer outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium text-center appearance-none ${colorClass}`}
                            value={guardName || UNMANNED}
                            onChange={(e) => updateGuard(dayIndex, shiftIndex, slotIndex, e.target.value)}
                          >
                            {allGuardOptions.map(guard => (
                              <option key={guard} value={guard} className="bg-gray-800 text-white text-base">
                                {guard}
                              </option>
                            ))}
                          </select>
                        );
                      })}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Statistics */}
        <div className="max-w-2xl mx-auto bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-200">סטטיסטיקת משמרות לשומר</h2>
          {guards.length === 0 ? (
            <p className="text-center text-gray-500 py-4">אין שומרים במאגר — הוסף שומרים כדי לראות סטטיסטיקות</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {getShiftCounts().map(([name, count]) => (
                <div
                  key={name}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border ${colorMap[name] || UNMANNED_COLOR}`}
                >
                  <span className="text-lg font-bold mb-1">{name}</span>
                  <span className="text-2xl font-black bg-black/30 px-3 py-1 rounded-md">{count}</span>
                  <span className="text-xs mt-1 opacity-80">משמרות</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
