"use client";
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import HomePage from '@/components/HomePage';

export default function Page() {
  const { userLoggedIn } = useAuth();

  if (userLoggedIn) {
    return <HomePage />;
  }

  return <AuthForm />;
}