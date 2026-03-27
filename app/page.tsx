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

type Shift = { time: string; count: number };

const DEFAULT_SHIFTS: Shift[] = [
  { time: "05:00-09:00", count: 1 },
  { time: "09:00-13:00", count: 1 },
  { time: "13:00-17:00", count: 1 },
  { time: "17:00-21:00", count: 1 },
  { time: "21:00-01:00", count: 2 },
  { time: "01:00-05:00", count: 2 },
];

const DAYS = ["חמישי", "שישי", "שבת", "ראשון", "שני", "שלישי", "רביעי", "חמישי (סיום)"];

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

// Build initial schedule from given shifts
function buildEmptySchedule(shifts: Shift[]): string[][][] {
  return DAYS.map(() => shifts.map(s => Array(s.count).fill(UNMANNED)));
}

const INITIAL_SCHEDULE: string[][][] = [
  [[UNMANNED], [UNMANNED], [UNMANNED], ["שלו"], ["סולד", "רון"], ["טום", "רוי"]],
  [["עידן"], ["רון"], ["שלו"], ["רוי"], ["סולד", "רון"], ["שלו", "עידן"]],
  [["טום"], ["רוי"], ["רון"], ["סולד"], ["טום", "רוי"], ["שלו", "עידן"]],
  [["סולד"], ["רון"], ["רוי"], ["עידן"], ["סולד", "רון"], ["טום", "רוי"]],
  [["שלו"], ["עידן"], ["רון"], ["טום"], ["שלו", "עידן"], ["סולד", "רון"]],
  [["טום"], ["שלו"], ["עידן"], ["סולד"], ["טום", "רוי"], ["שלו", "עידן"]],
  [["סולד"], ["טום"], ["רוי"], ["עידן"], ["סולד", "רון"], ["טום", "רוי"]],
  [["שלו"], ["סולד"], [UNMANNED], [UNMANNED], [UNMANNED, UNMANNED], [UNMANNED, UNMANNED]]
];

// Panel type: null | 'guards' | 'shifts'
type PanelType = null | 'guards' | 'shifts';

export default function ScheduleBoard() {
  const [schedule, setSchedule] = useState<string[][][]>(INITIAL_SCHEDULE);
  const [guards, setGuards] = useState<string[]>(DEFAULT_GUARDS);
  const [shifts, setShifts] = useState<Shift[]>(DEFAULT_SHIFTS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  // Guard manager state
  const [newGuardName, setNewGuardName] = useState("");
  const [confirmRemoveGuard, setConfirmRemoveGuard] = useState<string | null>(null);
  const [guardError, setGuardError] = useState("");

  // Shift manager state
  const [newShiftTime, setNewShiftTime] = useState("");
  const [newShiftCount, setNewShiftCount] = useState(1);
  const [editingShift, setEditingShift] = useState<number | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editCount, setEditCount] = useState(1);
  const [confirmRemoveShift, setConfirmRemoveShift] = useState<number | null>(null);
  const [shiftError, setShiftError] = useState("");

  const guardInputRef = useRef<HTMLInputElement>(null);
  const colorMap = buildColorMap(guards);
  const allGuardOptions = [...guards, UNMANNED];

  useEffect(() => {
    const docRef = doc(db, "schedules", "main_schedule_v5");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSchedule(JSON.parse(data.scheduleData));
        if (data.guards) setGuards(JSON.parse(data.guards));
        if (data.shifts) setShifts(JSON.parse(data.shifts));
      } else {
        setDoc(docRef, {
          scheduleData: JSON.stringify(INITIAL_SCHEDULE),
          guards: JSON.stringify(DEFAULT_GUARDS),
          shifts: JSON.stringify(DEFAULT_SHIFTS),
        });
      }
      setIsLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  const save = async (newSchedule: string[][][], newGuards: string[], newShifts: Shift[]) => {
    try {
      await setDoc(doc(db, "schedules", "main_schedule_v5"), {
        scheduleData: JSON.stringify(newSchedule),
        guards: JSON.stringify(newGuards),
        shifts: JSON.stringify(newShifts),
      });
    } catch (err) {
      console.error("Error saving:", err);
    }
  };

  // ── Schedule cell update ──
  const updateGuardCell = async (dayIdx: number, shiftIdx: number, slotIdx: number, val: string) => {
    const s = JSON.parse(JSON.stringify(schedule));
    s[dayIdx][shiftIdx][slotIdx] = val;
    setSchedule(s);
    await save(s, guards, shifts);
  };

  // ── Guard management ──
  const addGuard = async () => {
    const name = newGuardName.trim();
    if (!name) { setGuardError("יש להזין שם"); return; }
    if (guards.includes(name)) { setGuardError("שומר זה כבר קיים"); return; }
    if (name === UNMANNED) { setGuardError("שם לא תקין"); return; }
    const newGuards = [...guards, name];
    setGuards(newGuards);
    setNewGuardName("");
    setGuardError("");
    await save(schedule, newGuards, shifts);
  };

  const removeGuard = async (name: string) => {
    const newSchedule = schedule.map(day => day.map(shift => shift.map(g => g === name ? UNMANNED : g)));
    const newGuards = guards.filter(g => g !== name);
    setGuards(newGuards);
    setSchedule(newSchedule);
    setConfirmRemoveGuard(null);
    await save(newSchedule, newGuards, shifts);
  };

  // ── Shift management ──
  const addShift = async () => {
    const time = newShiftTime.trim();
    if (!time) { setShiftError("יש להזין שעות"); return; }
    if (newShiftCount < 1 || newShiftCount > 10) { setShiftError("מספר שומרים: 1-10"); return; }
    const newShift: Shift = { time, count: newShiftCount };
    const newShifts = [...shifts, newShift];
    // Append new slot to every day
    const newSchedule = schedule.map(day => [...day, Array(newShiftCount).fill(UNMANNED)]);
    setShifts(newShifts);
    setSchedule(newSchedule);
    setNewShiftTime("");
    setNewShiftCount(1);
    setShiftError("");
    await save(newSchedule, guards, newShifts);
  };

  const removeShift = async (idx: number) => {
    const newShifts = shifts.filter((_, i) => i !== idx);
    const newSchedule = schedule.map(day => day.filter((_, i) => i !== idx));
    setShifts(newShifts);
    setSchedule(newSchedule);
    setConfirmRemoveShift(null);
    await save(newSchedule, guards, newShifts);
  };

  const startEditShift = (idx: number) => {
    setEditingShift(idx);
    setEditTime(shifts[idx].time);
    setEditCount(shifts[idx].count);
    setShiftError("");
  };

  const saveEditShift = async (idx: number) => {
    const time = editTime.trim();
    if (!time) { setShiftError("יש להזין שעות"); return; }
    if (editCount < 1 || editCount > 10) { setShiftError("מספר שומרים: 1-10"); return; }

    const oldCount = shifts[idx].count;
    const newShifts = shifts.map((s, i) => i === idx ? { time, count: editCount } : s);

    // Adjust slot arrays for count change
    const newSchedule = schedule.map(day =>
      day.map((shift, i) => {
        if (i !== idx) return shift;
        if (editCount > oldCount) {
          // Add extra slots
          return [...shift, ...Array(editCount - oldCount).fill(UNMANNED)];
        } else {
          // Trim extra slots
          return shift.slice(0, editCount);
        }
      })
    );

    setShifts(newShifts);
    setSchedule(newSchedule);
    setEditingShift(null);
    setShiftError("");
    await save(newSchedule, guards, newShifts);
  };

  // ── Statistics ──
  const getShiftCounts = () => {
    const counts: Record<string, number> = {};
    guards.forEach(g => (counts[g] = 0));
    schedule.forEach(day => {
      day.forEach(shift => {
        shift.forEach(g => {
          if (g && g !== UNMANNED && counts[g] !== undefined) counts[g]++;
        });
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const togglePanel = (panel: PanelType) => {
    setActivePanel(p => p === panel ? null : panel);
    setGuardError(""); setShiftError("");
    setConfirmRemoveGuard(null); setConfirmRemoveShift(null);
    setEditingShift(null);
  };

  if (!isLoaded) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white text-2xl font-bold">
      טוען נתונים...
    </div>
  );

  return (
    <div className="p-4 bg-gray-950 min-h-screen text-right text-gray-100 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 flex-1 text-center">
            לוז שמירות
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => togglePanel('guards')}
              className={`flex items-center gap-2 border font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${activePanel === 'guards' ? 'bg-blue-700 border-blue-500 text-white' : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200'}`}
            >
              👥 ניהול שומרים
            </button>
            <button
              onClick={() => togglePanel('shifts')}
              className={`flex items-center gap-2 border font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${activePanel === 'shifts' ? 'bg-emerald-700 border-emerald-500 text-white' : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200'}`}
            >
              🕐 ניהול משמרות
            </button>
          </div>
        </div>

        {/* ── Guard Manager Panel ── */}
        {activePanel === 'guards' && (
          <div className="mb-8 bg-gray-900 border border-blue-800/60 rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-200 mb-4">מאגר השומרים</h2>
            <div className="flex flex-wrap gap-2 mb-5 min-h-[2.5rem]">
              {guards.length === 0 && <span className="text-gray-500 text-sm italic">אין שומרים במאגר</span>}
              {guards.map(name => (
                <div key={name} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium text-sm ${colorMap[name]}`}>
                  <span>{name}</span>
                  {confirmRemoveGuard === name ? (
                    <span className="flex items-center gap-1 mr-1">
                      <button onClick={() => removeGuard(name)} className="bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-0.5 rounded font-bold">אישור</button>
                      <button onClick={() => setConfirmRemoveGuard(null)} className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-0.5 rounded">ביטול</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmRemoveGuard(name)} className="opacity-60 hover:opacity-100 transition-opacity text-base leading-none" title={`הסר את ${name}`}>×</button>
                  )}
                </div>
              ))}
            </div>
            {confirmRemoveGuard && (
              <p className="text-yellow-400 text-sm mb-4 bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-3 py-2">
                ⚠️ הסרת <strong>{confirmRemoveGuard}</strong> תחליף את כל המשמרות שלו ב&quot;לא מאויישת&quot;. האם להמשיך?
              </p>
            )}
            <div className="flex gap-2 items-start">
              <div className="flex-1 max-w-xs">
                <input ref={guardInputRef} type="text" value={newGuardName}
                  onChange={e => { setNewGuardName(e.target.value); setGuardError(""); }}
                  onKeyDown={e => e.key === "Enter" && addGuard()}
                  placeholder="שם שומר חדש"
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {guardError && <p className="text-red-400 text-xs mt-1">{guardError}</p>}
              </div>
              <button onClick={addGuard} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">+ הוסף שומר</button>
            </div>
          </div>
        )}

        {/* ── Shift Manager Panel ── */}
        {activePanel === 'shifts' && (
          <div className="mb-8 bg-gray-900 border border-emerald-800/60 rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-200 mb-4">ניהול משמרות</h2>

            {/* Existing shifts list */}
            <div className="space-y-2 mb-5">
              {shifts.length === 0 && <p className="text-gray-500 text-sm italic">אין משמרות מוגדרות</p>}
              {shifts.map((shift, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
                  {editingShift === idx ? (
                    // Edit mode
                    <div className="flex items-center gap-3 flex-1 flex-wrap">
                      <input
                        type="text" value={editTime}
                        onChange={e => setEditTime(e.target.value)}
                        placeholder="שעות (למשל 08:00-12:00)"
                        className="bg-gray-700 border border-gray-500 text-gray-100 rounded px-2 py-1 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left ltr"
                        dir="ltr"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">שומרים:</span>
                        <button onClick={() => setEditCount(c => Math.max(1, c - 1))} className="w-7 h-7 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded text-gray-200 font-bold text-lg leading-none flex items-center justify-center">−</button>
                        <span className="text-white font-bold w-5 text-center">{editCount}</span>
                        <button onClick={() => setEditCount(c => Math.min(10, c + 1))} className="w-7 h-7 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded text-gray-200 font-bold text-lg leading-none flex items-center justify-center">+</button>
                      </div>
                      <button onClick={() => saveEditShift(idx)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded font-bold">שמור</button>
                      <button onClick={() => { setEditingShift(null); setShiftError(""); }} className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-1.5 rounded">ביטול</button>
                    </div>
                  ) : (
                    // Display mode
                    <>
                      <span className="text-gray-200 font-semibold text-sm ltr font-mono flex-1" dir="ltr">{shift.time}</span>
                      <span className="text-gray-400 text-xs">{shift.count === 1 ? 'שומר אחד' : `${shift.count} שומרים`}</span>
                      <div className="flex gap-1.5 mr-auto">
                        <button onClick={() => startEditShift(idx)} className="text-xs bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 px-2.5 py-1 rounded transition-colors">✏️ עריכה</button>
                        {confirmRemoveShift === idx ? (
                          <>
                            <button onClick={() => removeShift(idx)} className="text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded font-bold">אישור מחיקה</button>
                            <button onClick={() => setConfirmRemoveShift(null)} className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2.5 py-1 rounded">ביטול</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmRemoveShift(idx)} className="text-xs bg-gray-700 hover:bg-red-900/50 border border-gray-600 hover:border-red-700 text-gray-300 hover:text-red-300 px-2.5 py-1 rounded transition-colors">🗑 הסר</button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {confirmRemoveShift !== null && (
              <p className="text-yellow-400 text-sm mb-4 bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-3 py-2">
                ⚠️ מחיקת המשמרת תסיר את כל נתוני השיבוץ שלה מכל הימים.
              </p>
            )}

            {shiftError && <p className="text-red-400 text-xs mb-3">{shiftError}</p>}

            {/* Add new shift */}
            <div className="border-t border-gray-700 pt-4 mt-2">
              <p className="text-gray-400 text-sm mb-3 font-medium">הוספת משמרת חדשה</p>
              <div className="flex gap-2 items-end flex-wrap">
                <div>
                  <label className="text-gray-500 text-xs block mb-1">שעות (למשל 08:00-12:00)</label>
                  <input
                    type="text" value={newShiftTime}
                    onChange={e => { setNewShiftTime(e.target.value); setShiftError(""); }}
                    onKeyDown={e => e.key === "Enter" && addShift()}
                    placeholder="08:00-12:00"
                    className="bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">מספר שומרים</label>
                  <div className="flex items-center gap-2 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2">
                    <button onClick={() => setNewShiftCount(c => Math.max(1, c - 1))} className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 font-bold text-base leading-none flex items-center justify-center">−</button>
                    <span className="text-white font-bold w-5 text-center text-sm">{newShiftCount}</span>
                    <button onClick={() => setNewShiftCount(c => Math.min(10, c + 1))} className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 font-bold text-base leading-none flex items-center justify-center">+</button>
                  </div>
                </div>
                <button onClick={addShift} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">+ הוסף משמרת</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Schedule Table ── */}
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
              {shifts.map((shift, shiftIndex) => (
                <tr key={shiftIndex} className="hover:bg-gray-800/50 transition-colors border-b border-gray-800">
                  <td className="py-3 px-3 border-l border-gray-800 font-semibold bg-black/40 whitespace-nowrap">
                    <span className="text-gray-200 text-base font-mono" dir="ltr">{shift.time}</span>
                    <div className="text-xs text-gray-500 font-normal mt-1">
                      ({shift.count === 1 ? 'שומר אחד' : `${shift.count} שומרים`})
                    </div>
                  </td>
                  {DAYS.map((_, dayIndex) => (
                    <td key={dayIndex} className="py-3 px-2 border-l border-gray-800 align-top">
                      {(schedule[dayIndex]?.[shiftIndex] ?? Array(shift.count).fill(UNMANNED)).map((guardName, slotIndex) => {
                        const colorClass = (guardName && colorMap[guardName]) ? colorMap[guardName] : UNMANNED_COLOR;
                        return (
                          <select
                            key={slotIndex}
                            className={`w-full mb-1.5 p-2 border rounded-md cursor-pointer outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium text-center appearance-none ${colorClass}`}
                            value={guardName || UNMANNED}
                            onChange={e => updateGuardCell(dayIndex, shiftIndex, slotIndex, e.target.value)}
                          >
                            {allGuardOptions.map(guard => (
                              <option key={guard} value={guard} className="bg-gray-800 text-white text-base">{guard}</option>
                            ))}
                          </select>
                        );
                      })}
                    </td>
                  ))}
                </tr>
              ))}
              {shifts.length === 0 && (
                <tr>
                  <td colSpan={DAYS.length + 1} className="py-10 text-gray-500 text-center">
                    אין משמרות — פתח את ניהול משמרות כדי להוסיף
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Statistics ── */}
        <div className="max-w-2xl mx-auto bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-200">סטטיסטיקת משמרות לשומר</h2>
          {guards.length === 0 ? (
            <p className="text-center text-gray-500 py-4">אין שומרים במאגר</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {getShiftCounts().map(([name, count]) => (
                <div key={name} className={`flex flex-col items-center justify-center p-4 rounded-lg border ${colorMap[name] || UNMANNED_COLOR}`}>
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
