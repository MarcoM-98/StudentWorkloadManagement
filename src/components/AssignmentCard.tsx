"use client";
import {useState} from "react";

type AssignmentProps = {
    id: string;
    title: string;
    dueDate: string;
    duration: number;
    priorityPercentage: number;
    onUpdate?: () => void; // this tells the page/dashboard that we have change something and to refresh the list

};

export default function AssignmentCard({ id, title, dueDate, duration, priorityPercentage, onUpdate }: AssignmentProps) {
    const [isEditing, setIsEditing] = useState(false);
    
    // state initialization with fallbacks to prevent "uncontrolled" errors such as empty string or 0 on duration 
    // also react does not like when an input switches from an uncontrolled to a controlled value
    // so this function will use a fallback that if data is missing it stays "controlled" (with a fallback value)
    const [editData, setEditData] = useState({
        title: title || "",
        dueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : "", // convert object to standarlized string
        duration: duration ?? 0
        });
        const handleSave = (e: React.MouseEvent) => {
            e.stopPropagation();
    //close the edit mode
    setIsEditing(false);
    // 2. Log the data to the console to show locally that it saved
    console.log("Local Edit Captured (Not yet saved to DB):", editData);

};
if (isEditing) {
    return (
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
                onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} 
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

  return (
    <div 
    className="bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-zinc-200 mb-4 flex justify-between items-center"
    onClick={() => setIsEditing(true)}
    >
      <div>
        <h3 className="text-md font-bold">{editData.title}</h3>
        <p className="text-sm text-zinc-500">Due: {editData.dueDate ? new Date(editData.dueDate).toLocaleDateString(): "No date"} • {editData.duration} mins </p>
      </div>
      <div className="flex flex-col items-end">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          Priority: {priorityPercentage}%
        </span>
      </div>
    </div>
);
}