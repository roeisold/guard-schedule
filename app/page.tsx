"use client";

import React, { useState } from 'react';

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

// שיבוץ התחלתי שעונה על כל האילוצים שלך (זוגות בלילה, חלוקה שווה, ושלו לא שומר בשישי בבוקר)
const initialSchedule = [
  [["עידן"], ["רוי"], ["עידן"], ["רוי"], ["רועי", "רון"], ["שלו", "טום"]], // ראשון
  [["שלו"], ["טום"], ["שלו"], ["טום"], ["עידן", "רוי"], ["רועי", "רון"]], // שני
  [["רועי"], ["רון"], ["רועי"], ["רון"], ["שלו", "טום"], ["עידן", "רוי"]], // שלישי
  [["עידן"], ["רוי"], ["עידן"], ["רוי"], ["רועי", "רון"], ["שלו", "טום"]], // רביעי
  [["שלו"], ["טום"], ["שלו"], ["טום"], ["עידן", "רוי"], ["רועי", "רון"]], // חמישי
  [["רועי"], ["רון"], ["רועי"], ["רון"], ["שלו", "טום"], ["עידן", "רוי"]], // שישי (שלו פנוי בבוקר)
  [["עידן"], ["רוי"], ["עידן"], ["רוי"], ["רועי", "רון"], ["שלו", "טום"]]  // שבת
];

export default function ScheduleBoard() {
  const [schedule, setSchedule] = useState(initialSchedule);

  // פונקציה לעדכון שם השומר במערך
  const updateGuard = (dayIndex, shiftIndex, slotIndex, newName) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex][shiftIndex][slotIndex] = newName;
    setSchedule(newSchedule);
  };

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
                    {/* יצירת רשימה נפתחת כמספר השומרים הדרושים באותה משמרת */}
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