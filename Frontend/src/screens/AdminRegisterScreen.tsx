import React from 'react';
import { Card, Button, Input } from '../components/UI';
import { ShieldCheck, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../components/Common';
import imaraLogo from '../assets/imara.jpg';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';

export function AdminRegisterScreen() {
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'ADMIN' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      setUser(data.user, data.token);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary p-4 relative">
      <div className="absolute top-8 right-8 flex items-center gap-4">
        <Link to="/" className="text-sm font-medium text-text-secondary hover:text-accent-primary flex items-center gap-1">
          <ArrowLeft size={16} /> Retour
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex flex-col p-8 sm:p-12 w-full max-w-md bg-bg-secondary rounded-3xl shadow-xl border border-border">
        <div className="w-full space-y-12">
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center mx-auto mb-4">
              <img src={imaraLogo} alt="Logo Imara" className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">Inscription Admin</h2>
              <p className="text-text-secondary mt-2">Créez votre compte administrateur</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                {error}
              </div>
            )}
            <Input 
              label="Nom complet" 
              placeholder="Ex: Jean Dupont" 
              icon={User} 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input 
              label="Email" 
              placeholder="admin@imara.cd" 
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
            
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? 'Création en cours...' : 'Créer mon compte'}
            </Button>
          </form>

          <p className="text-center text-sm text-text-muted">
            Déjà un compte ? <Link to="/" className="text-accent-primary font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
