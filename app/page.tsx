"use client";

import React, { useState, useEffect } from 'react';

const GUARDS = ["רועי", "רון", "שלו", "עידן", "טום", "רוי", ""];
const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const SHIFTS = [
  { time: "05:00-09:00", count: 1 },
  { time: "09:00-13:00", count: 1 },
  { time: "13:00-17:00", count: 1 },
  { time: "17:00-21:00", count: 1 },
  { time: "21:00-01:00", count: 2 },
  { time: "01:00-05:00", count: 2 },
];

const initialSchedule: string[][][] = [
  [["עידן"], ["רוי"], ["עידן"], ["רוי"], ["רועי", "רון"], ["שלו", "טום"]],
  [["שלו"], ["טום"], ["שלו"], ["טום"], ["עידן", "רוי"], ["רועי", "רון"]],
  [["רועי"], ["רון"], ["רועי"], ["רון"], ["שלו", "טום"], ["עידן", "רוי"]],
  [["עידן"], ["רוי"], ["עידן"], ["רוי"], ["רועי", "רון"], ["שלו", "טום"]],
  [["שלו"], ["טום"], ["שלו"], ["טום"], ["עידן", "רוי"], ["רועי", "רון"]],
  [["רועי"], ["רון"], ["רועי"], ["רון"], ["שלו", "טום"], ["עידן", "רוי"]],
  [["עידן"], ["רוי"], ["עידן"], ["רוי"], ["רועי", "רון"], ["שלו", "טום"]]
];

export default function ScheduleBoard() {
  const [schedule, setSchedule] = useState<string[][][]>(initialSchedule);
  const [isLoaded, setIsLoaded] = useState(false);

  // טעינת הנתונים שנשמרו בדפדפן (Local Storage) בעת עליית העמוד
  useEffect(() => {
    const savedSchedule = localStorage.getItem("guardScheduleData");
    if (savedSchedule) {
      setSchedule(JSON.parse(savedSchedule));
    }
    setIsLoaded(true);
  }, []);

  // פונקציה לעדכון השומר ושמירה אוטומטית (כאן הוספנו את הגדרות ה-TypeScript: number, string)
  const updateGuard = (dayIndex: number, shiftIndex: number, slotIndex: number, newName: string) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex][shiftIndex][slotIndex] = newName;
    setSchedule(newSchedule);
    // שמירת המידע לדפדפן כדי שלא יימחק ברענון
    localStorage.setItem("guardScheduleData", JSON.stringify(newSchedule));
  };

  // מונע בעיות תצוגה בין השרת ללקוח בטעינה ראשונית
  if (!isLoaded) return null;

  return (
    <div className="p-4 bg-gray-50 min-h-screen text-right" dir="rtl">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">סידור שמירות שבועי</h1>
      
      <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
        <table className="min-w-full bg-white text-sm text-center">
          <thead className="bg-blue-800 text-white">
            <tr>
              <th className="py-3 px-2 border border-blue-900">שעות / ימים</th>
              {DAYS.map((day, i) => (
                <th key={i} className="py-3 px-2 border border-blue-900 w-32">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map((shift, shiftIndex) => (
              <tr key={shiftIndex} className="hover:bg-blue-50 transition-colors">
                <td className="py-2 px-2 border border-gray-300 font-semibold bg-gray-100">
                  {shift.time}
                  <div className="text-xs text-gray-500 font-normal">
                    ({shift.count === 1 ? 'שומר אחד' : '2 שומרים'})
                  </div>
                </td>
                
                {DAYS.map((_, dayIndex) => (
                  <td key={dayIndex} className="py-2 px-2 border border-gray-300 align-top">
                    {Array.from({ length: shift.count }).map((_, slotIndex) => (
                      <select
                        key={slotIndex}
                        className={`w-full mb-1 p-1 border rounded cursor-pointer ${
                          shift.count === 2 ? 'bg-purple-100 border-purple-300' : 'bg-green-50 border-green-300'
                        }`}
                        value={schedule[dayIndex][shiftIndex][slotIndex] || ""}
                        onChange={(e) => updateGuard(dayIndex, shiftIndex, slotIndex, e.target.value)}
                      >
                        <option value="" disabled>בחר...</option>
                        {GUARDS.map(guard => (
                          <option key={guard} value={guard}>{guard}</option>
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