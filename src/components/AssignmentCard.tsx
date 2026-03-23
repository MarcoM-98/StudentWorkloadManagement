type AssignmentProps = {
    title: string;
    dueDate: string;
    priorityPercentage: number;

};

export default function AssignmentCard({ title, dueDate, priorityPercentage }: AssignmentProps) {
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