import React from 'react';
import { Card, Button, Input } from '../components/UI';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { PexelsImage, ThemeToggle } from '../components/Common';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';

export function LoginScreen() {
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la connexion');
      }

      setUser(data.user, data.token);
      if (data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'AGENT') {
        navigate('/agent/dashboard');
      } else {
        throw new Error("Accès non autorisé pour ce profil");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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
              <h2 className="text-3xl font-bold tracking-tight">Connexion</h2>
              <p className="text-text-secondary mt-2">Connectez-vous pour accéder à votre espace</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                {error}
              </div>
            )}
            <Input 
              label="Email" 
              placeholder="email@imara.cd" 
              icon={Mail} 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input 
              label="Mot de passe" 
              placeholder="••••••••" 
              icon={Lock} 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <p className="text-sm text-text-muted">
              Pas encore de compte ? <Link to="/admin/register" className="text-accent-primary font-medium hover:underline">S'inscrire</Link>
            </p>
            <p className="text-xs text-text-muted">
              Besoin d'aide ? <span className="font-medium text-text-secondary">support@imara-access.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
