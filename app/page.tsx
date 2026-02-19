"use client";

import React, { useState, useEffect } from 'react';

const GUARDS = ["רועי", "רון", "שלו", "עידן", "טום", "רוי"];
const DAYS = ["חמישי", "שישי", "שבת", "ראשון", "שני", "שלישי", "רביעי", "חמישי (סיום)"];
const SHIFTS = [
  { time: "05:00-09:00", count: 1 },
  { time: "09:00-13:00", count: 1 },
  { time: "13:00-17:00", count: 1 },
  { time: "17:00-21:00", count: 1 },
  { time: "21:00-01:00", count: 2 },
  { time: "01:00-05:00", count: 2 },
];

// מפת צבעים לכל שומר - מותאם למצב כהה (רקע, טקסט ומסגרת)
const GUARD_COLORS: Record<string, string> = {
  "רועי": "bg-red-900/60 text-red-100 border-red-700",
  "רון": "bg-blue-900/60 text-blue-100 border-blue-700",
  "שלו": "bg-emerald-900/60 text-emerald-100 border-emerald-700",
  "עידן": "bg-orange-900/60 text-orange-100 border-orange-700",
  "טום": "bg-purple-900/60 text-purple-100 border-purple-700",
  "רוי": "bg-pink-900/60 text-pink-100 border-pink-700",
  "": "bg-gray-800 text-gray-400 border-gray-600"
};

const initialSchedule: string[][][] = [
  [["שלו"], ["טום"], ["רועי"], ["רון"], ["שלו", "טום"], ["עידן", "רוי"]],
  [["רועי"], ["רון"], ["עידן"], ["רוי"], ["רועי", "רון"], ["שלו", "טום"]],
  [["עידן"], ["רוי"], ["שלו"], ["טום"], ["עידן", "רוי"], ["רועי", "רון"]],
  [["שלו"], ["טום"], ["רועי"], ["רון"], ["שלו", "טום"], ["עידן", "רוי"]],
  [["רועי"], ["רון"], ["עידן"], ["רוי"], ["רועי", "רון"], ["שלו", "טום"]],
  [["עידן"], ["רוי"], ["שלו"], ["טום"], ["עידן", "רוי"], ["רועי", "רון"]],
  [["שלו"], ["טום"], ["רועי"], ["רון"], ["שלו", "טום"], ["עידן", "רוי"]],
  [["רועי"], ["רון"], [], [], [], []]
];

export default function ScheduleBoard() {
  const [schedule, setSchedule] = useState<string[][][]>(initialSchedule);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedSchedule = localStorage.getItem("guardScheduleDataColors");
    if (savedSchedule) {
      setSchedule(JSON.parse(savedSchedule));
    }
    setIsLoaded(true);
  }, []);

  const updateGuard = (dayIndex: number, shiftIndex: number, slotIndex: number, newName: string) => {
    const newSchedule = JSON.parse(JSON.stringify(schedule));
    newSchedule[dayIndex][shiftIndex][slotIndex] = newName;
    setSchedule(newSchedule);
    localStorage.setItem("guardScheduleDataColors", JSON.stringify(newSchedule));
  };

  const getShiftCounts = () => {
    const counts: Record<string, number> = {};
    GUARDS.forEach(g => counts[g] = 0);
    
    schedule.forEach(day => {
      day.forEach(shift => {
        shift.forEach(guard => {
          if (guard && counts[guard] !== undefined) {
            counts[guard]++;
          }
        });
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  if (!isLoaded) return null;

  return (
    <div className="p-4 bg-gray-950 min-h-screen text-right text-gray-100 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          סידור שמירות צבעוני
        </h1>
        
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
                      {schedule[dayIndex][shiftIndex].length === 0 ? (
                         <div className="text-gray-700 font-medium py-2 flex items-center justify-center h-full">-</div>
                      ) : (
                        schedule[dayIndex][shiftIndex].map((guardName, slotIndex) => {
                          const colorClass = guardName ? GUARD_COLORS[guardName] : GUARD_COLORS[""];
                          
                          return (
                            <select
                              key={slotIndex}
                              className={`w-full mb-1.5 p-2 border rounded-md cursor-pointer outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium text-center appearance-none ${colorClass}`}
                              value={guardName || ""}
                              onChange={(e) => updateGuard(dayIndex, shiftIndex, slotIndex, e.target.value)}
                            >
                              <option value="" disabled className="bg-gray-900 text-gray-500">בחר שומר...</option>
                              {GUARDS.map(guard => (
                                <option key={guard} value={guard} className="bg-gray-800 text-white text-base">
                                  {guard}
                                </option>
                              ))}
                            </select>
                          );
                        })
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="max-w-2xl mx-auto bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-200">סטטיסטיקת משמרות לשומר</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {getShiftCounts().map(([name, count]) => (
              <div 
                key={name} 
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${GUARD_COLORS[name]}`}
              >
                <span className="text-lg font-bold mb-1">{name}</span>
                <span className="text-2xl font-black bg-black/30 px-3 py-1 rounded-md">{count}</span>
                <span className="text-xs mt-1 opacity-80">משמרות</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}