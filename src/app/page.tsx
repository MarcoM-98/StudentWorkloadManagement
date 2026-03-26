"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AssignmentCard from "@/components/AssignmentCard";
import OverloadBanner from "@/components/OverloadBanner";

// We define the shape of the data thats going to show
type Task = {
  _id: string;
  title: string;
  dueDate: string;
  priorityPercentage: number;
};
export default function Home() {
  return (
    // This wraps the page in the Sidebar and Header created in SCRUM-54
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-black p-8 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            Welcome to GitYourWorkDone
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            The dashboard skeleton is successfully up and running! 
            <br /><br />
            (SCRUM-53 components and SCRUM-56 logic will be merged into this space later when i get time).
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}