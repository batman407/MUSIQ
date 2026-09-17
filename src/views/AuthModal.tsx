import React, { useState } from 'react';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Mail, Lock, User as UserIcon } from 'lucide-react';
import { storageService } from '../services/storageService';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onSuccess
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      id: 'usr-' + Date.now(),
      name: name.trim() || email.split('@')[0] || 'Musician',
      email: email || 'creator@musiq.audio',
      role: 'Classical Musician'
    };
    storageService.setUser(user);
    onSuccess(user);
    onClose();
  };

  const handleOAuth = (provider: 'google' | 'apple') => {
    const user: User = {
      id: `usr-${provider}-${Date.now()}`,
      name: `${provider === 'google' ? 'Google' : 'Apple'} Creator`,
      email: `creator@${provider}.com`,
      role: 'Classical Musician'
    };
    storageService.setUser(user);
    onSuccess(user);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'signin' ? 'Sign In to MUSIQ' : 'Create Your MUSIQ Account'}
      maxWidth="sm"
    >
      <div className="space-y-4">
        {/* Social Logins */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-[#18181D] hover:bg-[#27272D] text-sm text-[#F4F1EA] border border-[#27272D] transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-3.1c-.2-.7-.4-1.5-.4-2.3z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.2 7.5 23 12 23z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-[#18181D] hover:bg-[#27272D] text-sm text-[#F4F1EA] border border-[#27272D] transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.71-.93 2.73 1.01.08 2.03-.5 2.63-1.23"/>
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center py-2">
          <div className="border-t border-[#27272D] w-full" />
          <span className="bg-[#111114] px-3 text-[11px] font-mono text-[#9A9AA3] uppercase tracking-wider absolute">
            or email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs text-[#9A9AA3] mb-1">Your Name</label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3 top-3 text-[#9A9AA3]" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-[#18181D] border border-[#27272D] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F4F1EA] focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-[#9A9AA3] mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-[#9A9AA3]" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="creator@music.com"
                className="w-full bg-[#18181D] border border-[#27272D] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F4F1EA] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#9A9AA3] mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-[#9A9AA3]" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#18181D] border border-[#27272D] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F4F1EA] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" fullWidth className="mt-2">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-xs text-[#9A9AA3] hover:text-[#A78BFA] transition-colors"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
