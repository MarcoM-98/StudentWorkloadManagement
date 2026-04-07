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
  return (
    <div className="bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-zinc-200 mb-4 flex justify-between items-center">
      <div>
        <h3 className="text-md font-bold">{title}</h3>
        <p className="text-sm text-zinc-500">Due: {new Date(dueDate).toLocaleDateString()}</p>
      </div>
      <div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          Priority: {priorityPercentage}%
        </span>
      </div>
    </div>
  );
}