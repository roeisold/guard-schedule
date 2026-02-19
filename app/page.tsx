"use client";

import React, { useState, useEffect } from 'react';

const GUARDS = ["רועי", "רון", "שלו", "עידן", "טום", "רוי", ""];
const DAYS = ["חמישי", "שישי", "שבת", "ראשון", "שני", "שלישי", "רביעי"];
const SHIFTS = [
  { time: "05:00-09:00", count: 1 },
  { time: "09:00-13:00", count: 1 },
  { time: "13:00-17:00", count: 1 },
  { time: "17:00-21:00", count: 1 },
  { time: "21:00-01:00", count: 2 },
  { time: "01:00-05:00", count: 2 },
];

// שיבוץ שוויוני מחושב מראש: מתחיל מחמישי, זוגות נשמרים בלילה, ושלו פנוי בשישי מ-5 עד 13
const initialSchedule: string[][][] = [
  [["עידן"], ["רוי"], ["עידן"], ["רוי"], ["רועי", "רון"], ["שלו", "טום"]], // חמישי
  [["עידן"], ["רוי"], ["טום"], ["שלו"], ["עידן", "רוי"], ["רועי", "רון"]], // שישי
  [["שלו"], ["טום"], ["רועי"], ["רון"], ["שלו", "טום"], ["עידן", "רוי"]], // שבת
  [["רועי"], ["רון"], ["עידן"], ["רוי"], ["רועי", "רון"], ["שלו", "טום"]], // ראשון
  [["עידן"], ["רוי"], ["שלו"], ["טום"], ["עידן", "רוי"], ["רועי", "רון"]], // שני
  [["שלו"], ["טום"], ["רועי"], ["רון"], ["שלו", "טום"], ["עידן", "רוי"]], // שלישי
  [["רועי"], ["רון"], ["עידן"], ["רוי"], ["רועי", "רון"], ["שלו", "טום"]]  // רביעי
];

export default function ScheduleBoard() {
  const [schedule, setSchedule] = useState<string[][][]>(initialSchedule);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedSchedule = localStorage.getItem("guardScheduleDataDark");
    if (savedSchedule) {
      setSchedule(JSON.parse(savedSchedule));
    }
    setIsLoaded(true);
  }, []);

  const updateGuard = (dayIndex: number, shiftIndex: number, slotIndex: number, newName: string) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex][shiftIndex][slotIndex] = newName;
    setSchedule(newSchedule);
    localStorage.setItem("guardScheduleDataDark", JSON.stringify(newSchedule));
  };

  if (!isLoaded) return null;

  return (
    <div className="p-4 bg-gray-900 min-h-screen text-right text-gray-100" dir="rtl">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-400">סידור שמירות שבועי</h1>
      
      <div className="overflow-x-auto shadow-2xl rounded-lg border border-gray-700">
        <table className="min-w-full bg-gray-800 text-sm text-center">
          <thead className="bg-gray-950 text-blue-300">
            <tr>
              <th className="py-3 px-2 border border-gray-700">שעות / ימים</th>
              {DAYS.map((day, i) => (
                <th key={i} className="py-3 px-2 border border-gray-700 w-32">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map((shift, shiftIndex) => (
              <tr key={shiftIndex} className="hover:bg-gray-750 transition-colors border-b border-gray-700">
                <td className="py-2 px-2 border-l border-gray-700 font-semibold bg-gray-900">
                  <span className="text-gray-200">{shift.time}</span>
                  <div className="text-xs text-gray-400 font-normal mt-1">
                    ({shift.count === 1 ? 'שומר אחד' : '2 שומרים'})
                  </div>
                </td>
                
                {DAYS.map((_, dayIndex) => (
                  <td key={dayIndex} className="py-2 px-2 border-l border-gray-700 align-top bg-gray-800 hover:bg-gray-700 transition-colors">
                    {Array.from({ length: shift.count }).map((_, slotIndex) => (
                      <select
                        key={slotIndex}
                        className={`w-full mb-1 p-1.5 border rounded cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          shift.count === 2 
                            ? 'bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600' 
                            : 'bg-zinc-800 border-zinc-600 text-zinc-100 hover:bg-zinc-700'
                        }`}
                        value={schedule[dayIndex][shiftIndex][slotIndex] || ""}
                        onChange={(e) => updateGuard(dayIndex, shiftIndex, slotIndex, e.target.value)}
                      >
                        <option value="" disabled className="text-gray-400">בחר...</option>
                        {GUARDS.map(guard => (
                          <option key={guard} value={guard} className="bg-gray-800 text-white">
                            {guard}
                          </option>
                        ))}
                      </select>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}