import React from 'react';
import { Card, Button, Input } from '../components/UI';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { PexelsImage, ThemeToggle } from '../components/Common';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';

export function AdminLoginScreen() {
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ id: '1', name: 'Super Admin', role: 'ADMIN', email: 'admin@imara.cd' });
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg-primary">
      <div className="hidden lg:block relative">
        <PexelsImage query="campus" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="absolute bottom-16 left-16 text-white max-w-md">
          <h1 className="text-5xl font-bold mb-4">Focus sur l'essentiel.</h1>
          <p className="text-xl text-white/80">Pilotez la sécurité de votre établissement avec une précision inégalée.</p>
        </div>
      </div>

      <div className="flex flex-col p-8 lg:p-24 relative justify-center bg-bg-secondary">
        <div className="absolute top-8 right-8">
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full mx-auto space-y-12">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-accent-primary rounded-xl flex items-center justify-center">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Interface Administrateur</h2>
              <p className="text-text-secondary mt-2">Accédez au centre de contrôle du système</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <Input 
              label="Email" 
              placeholder="admin@imara.cd" 
              icon={Mail} 
              type="email"
              required
            />
            <Input 
              label="Mot de passe" 
              placeholder="••••••••" 
              icon={Lock} 
              type="password"
              required
            />
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary" />
                <span className="text-sm text-text-secondary">Se souvenir de moi</span>
              </label>
              <button type="button" className="text-sm font-medium text-accent-primary hover:underline underline-offset-4">
                Mot de passe oublié ?
              </button>
            </div>

            <Button type="submit" size="lg" className="w-full">
              Se connecter
            </Button>
          </form>

          <p className="text-center text-sm text-text-muted">
            Besoin d'aide ? Contactez le support technique <br/> 
            <span className="font-medium text-text-secondary">support@imara-access.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
