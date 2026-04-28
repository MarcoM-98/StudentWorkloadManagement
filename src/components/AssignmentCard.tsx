"use client";
import {useState, useEffect} from "react"; // added useEffect to synchronize saving with an external system (mongodb)
import { generateResources } from "@/lib/resourceGenerator";
import { useAuth } from "@/contexts/AuthContext";
import { withFirebaseUserHeaders } from "@/lib/apiHeaders";
type AssignmentProps = {
    id: string; // mongodb _id
    title: string;
    dueDate: string;
    duration: number;
    priorityPercentage: number;
    priorityWord: string; // this will be the low, medium and immediate words
    customPercentage?: number | null; // this may exist or not, if it does it allows the user to custom type a number
    onUpdate?: () => void; // this tells the page/dashboard that we have change something and to refresh the list
    suggestedDate?: string; // tells the suggested date
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
userUniversity = "Texas State University"}: AssignmentProps) {
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [showHelp, setShowHelp] = useState(false);
    const resources = generateResources(userUniversity, userMajor, courseCode, title, keywords);
    const [dismissedLateWarning, setDismissedLateWarning] = useState(false);

    // 1. Safe display for text (e.g., "5/1/2026")
    const safeFormatDate = (dateString?: string) => {
        if (!dateString) return "No date";
        const [year, month, day] = dateString.split('T')[0].split('-');
        return `${Number(month)}/${Number(day)}/${year}`;
    };

    // 2. Safe display for the Edit Form Input (e.g., "2026-05-01")
    const formatForInput = (dateString?: string) => {
        if (!dateString) return "";
        return dateString.split('T')[0];
    };
    
    // state initialization with fallbacks to prevent "uncontrolled" errors such as empty string or 0 on duration 
    // also react does not like when an input switches from an uncontrolled to a controlled value
    // so this function will use a fallback that if data is missing it stays "controlled" (with a fallback value)
    const [editData, setEditData] = useState({
        title: title || "",
        dueDate: formatForInput(dueDate),
        duration: (duration ?? duration > 0) ? duration : 60,
        priority: priorityWord || "low",
        customPercentage: customPercentage ?? null,
        plannedDate: formatForInput(plannedDate)
        });

        useEffect(() => {
        setDismissedLateWarning(false);
    }, [plannedDate, dueDate]);

        useEffect(()=> {
            if(!isEditing) // only autosave if user is actually editing
            return;
            
        const delayDebounceFn = setTimeout(async () => { // Start a 1-second timer of inactivity before executing
            setIsSaving(true); // show a "Saving..." indicator to the user
            try { // try block to sends an asynchronous network request to our route using the specific assignment ID
                if (!currentUser?.uid) {
                    return;
                }

                const response = await fetch(`/api/assignments/${id}`, {
                    method: 'PATCH',  // Specifies a partial update (PATCH) rather than replacing the whole document like title, date,time etc
                    headers: withFirebaseUserHeaders(currentUser.uid, { 'Content-Type': 'application/json' }), // tells the server to expect a json formatted data/file
                    body: JSON.stringify({ // Converts our JavaScript object into a string for transmission except duration, it will be sent as a number
                        title: editData.title,
                        dueDate: editData.dueDate,
                        duration: Number(editData.duration),
                        priority: editData.priority, // this is the low, medium, immediate option which will be saved
                        customPercentage: editData.customPercentage, // this is where it will save the custom number
                        plannedDate: editData.plannedDate ? editData.plannedDate : null
                    }),
                });
        
                if (response.ok && onUpdate) {// If the server confirms the save and onUpdate will 
                }
            } catch (error) {
                console.error("Auto-save failed:", error); // If the network is down or the server crashes, log the error to the console for debugging
            } finally {
                setTimeout(() => setIsSaving(false), 500); // waits 500ms before removing the "Saving" text so it doesn't flicker too fast
            }
        }, 1000); // The "Debounce" duration;  1 second 

        //core of the debounce logic. 
        // If the user types another character before the 1-second timer finishes, 
        // this line kills the old timer and resets the clock.
        return () => clearTimeout(delayDebounceFn);

    }, [currentUser?.uid, editData, isEditing, id, onUpdate]); // Dependency Array: Tells React to re-run this entire block whenever any of these 4 values change

        const handleSave = (e: React.MouseEvent) => {
            e.stopPropagation();
    //close the edit mode
    setIsEditing(false);
    if (onUpdate) {
            onUpdate(); // Trigger the dashboard refresh when closing the card/assignment
        }
    // 2. Log the data to the console to show locally that it saved we can move this line or change this line
    console.log("Local Edit Captured:", editData);

};
if (isEditing) {
    return (
      <> 
        {isSaving && <p className="text-[10px] text-blue-500 font-bold animate-pulse mb-1 ml-1">Autosaving...</p>}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border-2 border-blue-500 mb-4 shadow-md transition-all">
      {/*banner and display bar title*/}
        <div className="space-y-3">
          <input
            className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-1 focus:ring-blue-500"
            value={editData.title || ""} // fallback for missing title
            onChange={(e) => setEditData({ ...editData, title: e.target.value })} 
            placeholder="Assignment Title"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
            {/* banner and display bar due date*/}
              <label className="text-[10px] uppercase text-zinc-500 ml-1">Due Date</label>
              <input
                type="date"
                className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 outline-none"
                value={editData.dueDate || ""} // fallback for missing due date
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
            {/* The Priority Controls (Side-by-Side) */}
            <div className="flex gap-4 col-span-2"> 
              
              {/* Priority dropdown menu */}
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

              {/*  custom input number */}
              <div className="w-28">
                  <label className="text-[10px] uppercase text-zinc-500 ml-1"> Custom %</label>
                  <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="None"
                      className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 outline-none"
                      // If it's null, show a blank box (""). Otherwise, show the number.
                      value={editData.customPercentage ?? ""} 
                      onChange={(e) => {
                          const val = e.target.value;
                          // If they delete the number, save it as null to use the base priority
                          setEditData({ ...editData, customPercentage: val ? parseInt(val) : null });
                      }}
                  />
              </div>

            </div>
            <div>
            {/* banner and display bar for duration */ }
              <label className="text-[10px] uppercase text-zinc-500 ml-1">Duration (min)</label>
              <input
                type="number"
                className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 outline-none"
                value={editData.duration ?? 0} // fallback for missing duration
                onChange={(e) => setEditData({ ...editData, duration: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 text-sm pt-1">
            <button 
                onClick={(e) => { e.stopPropagation();   // Reset the typing back to to what it was before
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
    </>
    );
}
const plannedStr = formatForInput(plannedDate);
const dueStr = formatForInput(dueDate);
const suggestedStr = formatForInput(suggestedDate);
// Did the user manually push the plan past the deadline?
const isPastDeadline = Boolean(plannedStr && dueStr && plannedStr > dueStr);

// Does the math engine have a new idea?
const hasNewSuggestion = Boolean(suggestedStr && suggestedStr !== (plannedStr || dueStr));

// Show the box if EITHER of those things are true
const showWarningBox = hasNewSuggestion || (isPastDeadline && !dismissedLateWarning);
const isActuallyLate = isPastDeadline || isDelayed;
// Calculate how much time is left today
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
              {/* If they accepted a suggestion, show their Planned date as primary */}
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
         e.stopPropagation(); // Prevents opening the edit mode when clicking the button
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
            // Triggers the memory state to hide the box, keeping the late date
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
            e.stopPropagation(); // Prevents the card from opening edit mode
            if (onComplete) onComplete(); 
          }}
          className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 text-xs font-bold rounded-md transition-colors"
        >
          ✓ Mark as Done
        </button>
    </div>
    </div>

        {/* the UI for the smart links/assistant */}
      <div className="w-full mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
    {/*  If the AI labeled this a syllabus or schedule, it hides the buttons and just shows a small "Reference Document" tag. */}
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
                onClick={(e) => e.stopPropagation()} // Prevents clicking the grid from opening the edit mode
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
