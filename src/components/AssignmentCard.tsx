
"use client";
import { useState, useEffect } from "react"; 
import { generateResources } from "@/lib/resourceGenerator";

// Auth Imports
import { useAuth } from "@/contexts/AuthContext";
import { withFirebaseUserHeaders } from "@/lib/apiHeaders";

type AssignmentProps = {
    id: string; 
    title: string;
    dueDate: string;
    duration: number;
    priorityPercentage: number;
    priorityWord: string; 
    customPercentage?: number | null; 
    onUpdate?: () => void; 
    suggestedDate?: string; 
    onAcceptSuggestion?: (id: string, newDate: string) => void;
    isDelayed?: boolean;
    isCritical?: boolean;
    courseCode?: string;
    keywords?: string[];
    isActionable?: boolean;
    userMajor?: string;
    userUniversity?: string;
    onComplete?: () => void;
    plannedDate?: string;
    dailyMinutesUsed?: number;
    maxDailyMinutes?: number;  
};

export default function AssignmentCard({ id, title, dueDate, duration, priorityPercentage, priorityWord, customPercentage, onUpdate, 
suggestedDate, onAcceptSuggestion, isDelayed, isCritical, courseCode = "", keywords = [], isActionable = true, userMajor = "Undeclared", 
userUniversity = "Texas State University", onComplete, plannedDate, dailyMinutesUsed = 0, maxDailyMinutes = 360}: AssignmentProps) {
    
    const { currentUser } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const resources = generateResources(userUniversity, userMajor, courseCode, title, keywords);
    const [dismissedLateWarning, setDismissedLateWarning] = useState(false);

    const safeFormatDate = (dateString?: string) => {
        if (!dateString) return "No date";
        const [year, month, day] = dateString.split('T')[0].split('-');
        return `${Number(month)}/${Number(day)}/${year}`;
    };

    const formatForInput = (dateString?: string) => {
        if (!dateString) return "";
        return dateString.split('T')[0];
    };
    
    const [editData, setEditData] = useState({
        title: title || "",
        dueDate: formatForInput(dueDate),
        duration: (duration ?? duration > 0) ? duration : 60,
        priority: priorityWord || "low",
        customPercentage: customPercentage ?? null,
        plannedDate: formatForInput(plannedDate)
    });

    // Keep plannedDate in sync if it changes externally
    useEffect(() => {
        setEditData((prev) => ({
            ...prev,
            plannedDate: formatForInput(plannedDate),
        }));
    }, [plannedDate]);

    useEffect(() => {
        setDismissedLateWarning(false);
    }, [plannedDate, dueDate]);

    // --- UPDATED: Strict Manual Save ---
    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        try {
            if (!currentUser?.uid) return; 

            // Send the exact data the user typed directly to the database
            const response = await fetch(`/api/assignments/${id}`, {
                method: 'PATCH',  
                headers: withFirebaseUserHeaders(currentUser.uid, {
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({ 
                    title: editData.title,
                    dueDate: editData.dueDate,
                    duration: Number(editData.duration),
                    priority: editData.priority, 
                    customPercentage: editData.customPercentage, 
                    plannedDate: editData.plannedDate ? editData.plannedDate : null
                }),
            });
    
            // If successful, close the edit window and trigger the dashboard refresh
            if (response.ok) {
                setIsEditing(false);
                if (onUpdate) onUpdate(); 
            }
        } catch (error) {
            console.error("Manual save failed:", error); 
        }
    };

    if (isEditing) {
        return (
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border-2 border-blue-500 mb-4 shadow-md transition-all">
              <div className="space-y-3">
                <input
                  className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-1 focus:ring-blue-500"
                  value={editData.title || ""} 
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })} 
                  placeholder="Assignment Title"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase text-zinc-500 ml-1">Due Date</label>
                    <input
                      type="date"
                      className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 outline-none"
                      value={editData.dueDate || ""} 
                      onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-blue-500 font-bold ml-1">Planned Date</label>
                    <input
                      type="date"
                      className="w-full p-2 rounded border border-blue-200 dark:bg-zinc-800 dark:border-blue-900/50 outline-none focus:ring-1 focus:ring-blue-500"
                      value={editData.plannedDate || ""} 
                      onChange={(e) => setEditData({ ...editData, plannedDate: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-4 col-span-2"> 
                    <div className="flex-1">
                        <label className="text-[10px] uppercase text-zinc-500 ml-1">Base Priority</label>
                        <select
                            className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 outline-none cursor-pointer"
                            value={editData.priority}
                            onChange={(e) => setEditData({ ...editData, priority: e.target.value, customPercentage:null,})}
                        >
                            <option value="low">Low (20%)</option>
                            <option value="medium">Medium (50%)</option>
                            <option value="IMMEDIATE">IMMEDIATE (100%)</option>
                        </select>
                    </div>
                    <div className="w-28">
                        <label className="text-[10px] uppercase text-zinc-500 ml-1"> Custom %</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="None"
                            className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 outline-none"
                            value={editData.customPercentage ?? ""} 
                            onChange={(e) => {
                                const val = e.target.value;
                                setEditData({ ...editData, customPercentage: val ? parseInt(val) : null });
                            }}
                        />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-zinc-500 ml-1">Duration (min)</label>
                    <input
                      type="number"
                      className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 outline-none"
                      value={editData.duration ?? 0} 
                      onChange={(e) => setEditData({ ...editData, duration: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-sm pt-1">
                  <button 
                      onClick={(e) => { e.stopPropagation(); 
                              setEditData({
                                  title: title || "",
                                  dueDate: formatForInput(dueDate),
                                  duration: (duration ?? duration > 0) ? duration : 60,
                                  priority: priorityWord || "low",
                                  customPercentage: customPercentage ?? null,
                                  plannedDate: formatForInput(plannedDate)
                              });
                              setIsEditing(false); 
                          }} 
                          className="text-zinc-500 hover:text-zinc-700 px-2 py-1"
                      >
                      Cancel
                  </button>
                  <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition-colors">
                      Save Changes
                  </button>
                </div>
              </div>
            </div>
        );
    }

    const plannedStr = formatForInput(plannedDate);
    const dueStr = formatForInput(dueDate);
    const suggestedStr = formatForInput(suggestedDate);

    const isPastDeadline = Boolean(plannedStr && dueStr && plannedStr > dueStr);
    const hasNewSuggestion = Boolean(suggestedStr && suggestedStr !== (plannedStr || dueStr));

    const showWarningBox = hasNewSuggestion || (isPastDeadline && !dismissedLateWarning);
    const isActuallyLate = isPastDeadline || isDelayed;

    const minutesRemaining = maxDailyMinutes - dailyMinutesUsed;
    const isOverCapacity = minutesRemaining < 0;
    const capacityText = isOverCapacity 
        ? `${Math.abs(minutesRemaining)} mins over limit` 
        : `${minutesRemaining} mins left today`;
    const capacityColor = isOverCapacity 
        ? "text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30" 
        : "text-green-700 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/30";

    return (
        <div 
        className="bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 mb-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-900 transition-colors"
        onClick={() => setIsEditing(true)}
        >
         <div className="flex justify-between items-start">
          <div>
            <h3 className="text-md font-bold">{title}</h3>
            <div className="flex flex-col mt-1 gap-1">
              {plannedDate ? (
                <>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    Planned For: {safeFormatDate(plannedDate)}
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${capacityColor}`}>
                    {capacityText}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500 line-through">
                    Official Deadline: {safeFormatDate(dueDate)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-zinc-500 flex items-center gap-2">
                  Due: {safeFormatDate(dueDate)} • {duration} mins
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${capacityColor}`}>
                  {capacityText}
                  </span>
                </p>
            )}
            </div>
           {showWarningBox && (
            <div className={`mt-2 p-2 rounded border flex justify-between items-center ${
              isActuallyLate ? 'bg-red-50 dark:bg-red-900/20 border-red-200' : 
              isCritical ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200' : 
              'bg-blue-50 dark:bg-zinc-800 border-blue-100'
            }`}>
             <div>
              <p className={`text-[10px] font-bold uppercase ${
                isActuallyLate ? 'text-red-600' : 
                isCritical ? 'text-yellow-600' : 
                'text-blue-500'
              }`}>
                {isActuallyLate ? 'Late Warning - Reschedule' : isCritical ? 'Critical Deadline' : 'Optimization Suggestion'}
              </p>
              <p className={`text-sm font-semibold ${
                isActuallyLate ? 'text-red-700 dark:text-red-400' : 
                isCritical ? 'text-yellow-700 dark:text-yellow-400' : 
                'text-blue-600'
              }`}>
                {isPastDeadline && !hasNewSuggestion 
                    ? `Must complete by: ${safeFormatDate(dueDate)}` 
                    : `Reschedule to: ${safeFormatDate(suggestedDate)}`}
              </p>
            </div>
            {hasNewSuggestion ? (
            <button
             onClick={(e) => {
             e.stopPropagation(); 
             const fixDate = (isPastDeadline && !hasNewSuggestion) ? dueDate : suggestedDate;
             onAcceptSuggestion?.(id, formatForInput(fixDate));
          }}
          className={`ml-4 px-3 py-1 text-white text-xs font-bold rounded transition-colors ${
               isDelayed ? 'bg-red-600 hover:bg-red-700' : 
               isCritical ? 'bg-yellow-600 hover:bg-yellow-700' : 
               'bg-blue-600 hover:bg-blue-700'
          }`}
          
        >
          Accept
        </button>
    ) : (
        <div className="flex gap-2 ml-4">
        <button
         onClick={(e) => {
            e.stopPropagation(); 
            onAcceptSuggestion?.(id, formatForInput(dueDate));
            }}
            className="px-3 py-1 text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 text-xs font-bold rounded transition-colors"
            >
            Fix Date
            </button>
            <button
            onClick={(e) => {
                e.stopPropagation(); 
                setDismissedLateWarning(true); 
                }}
                className="px-3 py-1 text-white text-xs font-bold rounded transition-colors bg-red-600 hover:bg-red-700"
                >
                Keep Late
                </button>
                </div>
           )}
        </div>
        )}
        </div>
          <div className="flex flex-col items-end gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              Priority: {priorityPercentage}%
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation(); 
                if (onComplete) onComplete(); 
              }}
              className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 text-xs font-bold rounded-md transition-colors"
            >
              ✓ Mark as Done
            </button>
        </div>
        </div>
    
          <div className="w-full mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {!isActionable ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-500 font-medium"> Course Reference Document</p>
            ) : (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowHelp(!showHelp); }}
                  className="text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  {showHelp ? "▼ Hide Study Resources" : "💡 Need Help Studying?"}
                </button>
    
                {showHelp && (
                  <div 
                    className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800" 
                    onClick={(e) => e.stopPropagation()} 
                  >
                    <div>
                      <p className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase mb-2 border-b dark:border-zinc-700 pb-1">📺 Videos</p>
                      <div className="flex flex-col gap-2">
                        {resources.videos.map((link, i) => (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:underline">{link.name} </a>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-green-600 dark:text-green-500 uppercase mb-2 border-b dark:border-zinc-700 pb-1">📚 Reading</p>
                      <div className="flex flex-col gap-2">
                        {resources.reading.map((link, i) => (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 hover:underline">{link.name} </a>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase mb-2 border-b dark:border-zinc-700 pb-1">🔍 Search</p>
                      <div className="flex flex-col gap-2">
                        {resources.general.map((link, i) => (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 hover:underline">{link.name} </a>
                        ))}
                        </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
    );
}