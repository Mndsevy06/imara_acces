import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Car, Settings, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/UI';
import { PexelsImage, ThemeToggle } from '../components/Common';
import { useAuthStore } from '../store/useStore';
import { UserRole } from '../types';
import { cn } from '../lib/utils';

export function ProfileSelectScreen() {
  const navigate = useNavigate();
  const setRole = useAuthStore((state) => state.setRole);

  const handleSelect = (role: UserRole) => {
    setRole(role);
    if (role === 'ADMIN') navigate('/admin/login');
    else if (role === 'AGENT') navigate('/agent/login');
    else navigate('/member/login');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg-primary">
      <div className="hidden lg:block relative">
        <PexelsImage query="campus" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-8 border border-white/20"
          >
            <ShieldCheck size={48} className="text-white" />
          </motion.div>
          <h1 className="text-5xl font-bold mb-4 tracking-tight">Imara Access</h1>
          <p className="text-xl text-white/80 max-w-md">
            Gestion intelligente des flux de véhicules pour le complexe Imara / ECOPO.
          </p>
        </div>
      </div>

      <div className="flex flex-col p-8 lg:p-16 relative">
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Imara / ECOPO</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">Bienvenue</h2>
            <p className="text-text-secondary">Sélectionnez votre profil pour continuer</p>
          </div>

          <div className="space-y-4">
            <ProfileCard
              icon={ShieldCheck}
              title="Agent de Sécurité"
              description="Contrôle d'accès et gestion des portails."
              onClick={() => handleSelect('AGENT')}
              variant="blue"
            />
            <ProfileCard
              icon={Car}
              title="Adhérent / Usager"
              description="Guidage intelligent vers votre parking."
              onClick={() => handleSelect('MEMBER')}
              variant="indigo"
            />
            <ProfileCard
              icon={Settings}
              title="Administrateur"
              description="Configuration et monitoring du système."
              onClick={() => handleSelect('ADMIN')}
              variant="slate"
            />
          </div>
        </div>

        <div className="mt-16 text-center text-sm text-text-muted">
          © 2026 Imara Access Control • v1.0.0
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ 
  icon: Icon, 
  title, 
  description, 
  onClick,
  variant 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  onClick: () => void;
  variant: 'blue' | 'indigo' | 'slate';
}) {
  const colors = {
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
    indigo: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10",
    slate: "text-slate-500 bg-slate-50 dark:bg-slate-500/10"
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left group"
    >
      <Card className="p-6 transition-all group-hover:border-accent-primary group-hover:shadow-lg group-hover:-translate-y-1">
        <div className="flex items-center gap-5">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", colors[variant])}>
            <Icon size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
          </div>
          <div className="text-text-muted group-hover:text-accent-primary transition-colors">
            <ArrowRight size={20} />
          </div>
        </div>
      </Card>
    </button>
  );
}
