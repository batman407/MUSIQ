import React, { useState } from 'react';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { storageService } from '../services/storageService';
import { User } from '../types';
import { Music, Users, GraduationCap, PenTool, Compass } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (role: string) => void;
}

const ROLES: { id: User['role']; label: string; desc: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'Choir Director', label: 'Choir Director / Vocalist', desc: 'Reading SATB sheet music, rehearsing harmony parts and sol-fa', icon: Users },
  { id: 'Classical Musician', label: 'Classical Musician', desc: 'Digitizing sheet music, practicing parts, adjusting tempo', icon: Music },
  { id: 'Composer', label: 'Composer', desc: 'Transcribing paper scores to MusicXML for Sibelius, Dorico, Finale', icon: PenTool },
  { id: 'Arranger', label: 'Arranger / Orchestrator', desc: 'Harmonic transcription, part extraction and notation editing', icon: PenTool },
  { id: 'Band Director', label: 'Band Director', desc: 'Score study, transposing instruments and ensemble preparation', icon: Music },
  { id: 'Music Student', label: 'Music Student / Educator', desc: 'Learning music theory, sight-reading, tonic sol-fa and note names', icon: GraduationCap },
  { id: 'Other', label: 'Other Creator', desc: 'Exploring sheet music digitization and rehearsal playback', icon: Compass }
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [selectedRole, setSelectedRole] = useState<User['role']>('Choir Director');

  const handleFinish = (roleToSave: string) => {
    const user = storageService.getUser() || {
      id: 'usr-default',
      name: 'Creator',
      email: 'creator@musiq.audio',
      role: 'Choir Director'
    };
    user.role = roleToSave as User['role'];
    storageService.setUser(user);
    onComplete(roleToSave);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Welcome to MUSIQ"
      maxWidth="lg"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-[#F4F1EA]">What brings you to MUSIQ?</h3>
          <p className="text-sm text-[#9A9AA3] mt-1">
            We'll tailor your score transcription tools, playback preferences, and notation views.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {ROLES.map(role => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isSelected 
                    ? 'bg-[#18181D] border-[#8B5CF6] violet-glow-sm' 
                    : 'bg-[#111114] border-[#27272D] hover:border-[#383842]'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-[#8B5CF6] text-white' : 'bg-[#18181D] text-[#9A9AA3]'}`}>
                  <Icon size={18} />
                </div>
                <div className="text-left">
                  <div className={`text-sm font-semibold ${isSelected ? 'text-[#F4F1EA]' : 'text-[#9A9AA3]'}`}>
                    {role.label}
                  </div>
                  <div className="text-xs text-[#6E6E77] mt-0.5 leading-snug">
                    {role.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#27272D]/60">
          <button
            type="button"
            onClick={() => handleFinish('Choir Director')}
            className="text-xs text-[#9A9AA3] hover:text-[#F4F1EA] cursor-pointer"
          >
            Skip for now
          </button>
          <Button
            variant="primary"
            size="md"
            onClick={() => handleFinish(selectedRole)}
          >
            Continue to MUSIQ
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export default OnboardingModal;
