import React, { useState } from 'react';
import { useAuth } from '../lib/auth-store';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  AlertTriangle, 
  ArrowRight,
  Key as KeyIcon,
  Loader2,
  Lock as LockIcon
} from 'lucide-react';

/**
 * AuthForm now exclusively handles the "Fortress" (E2EE) phases:
 * 1. Setup (Generation of mnemonic)
 * 2. Unlock (Restoration from mnemonic)
 */
export const AuthForm: React.FC = () => {
  const { user, profile, privateKey, initializeE2EE } = useAuth();
  
  const [step, setStep] = useState<'setup_choice' | 'view_mnemonic'>('setup_choice');
  const [generatedPhrase, setGeneratedPhrase] = useState<string | null>(null);
  const [inputPhrase, setInputPhrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is authenticated with Clerk but hasn't set up E2EE keys in Supabase
  if (user && !profile?.public_key) {
    const handleStartSetup = async () => {
        setIsLoading(true);
        try {
            const phrase = await initializeE2EE();
            setGeneratedPhrase(phrase);
            setStep('view_mnemonic');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
      <div className="flex-center" style={{ minHeight: '100vh', padding: '40px' }}>
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}
        >
            {step === 'setup_choice' ? (
                <>
                    <div style={{ marginBottom: '40px' }}>
                        <div className="flex-center" style={{ marginBottom: '24px' }}>
                            <div style={{ padding: '20px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--accent-gold)' }}>
                                <ShieldCheck size={48} color="var(--accent-gold)" />
                            </div>
                        </div>
                        <h1 style={{ marginBottom: '16px' }}>Initialize Fortress</h1>
                        <p>Welcome, <strong>{user.username || user.primaryEmailAddress?.emailAddress}</strong>. To enable zero-knowledge encryption, you must generate your unique recovery phrase.</p>
                    </div>
                    
                    <button 
                        onClick={handleStartSetup}
                        disabled={isLoading}
                        className="action-button" 
                        style={{ width: '100%', height: '56px' }}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Generate Secure Keys'}
                    </button>
                    {error && <p style={{ color: 'var(--accent-danger)', marginTop: '16px' }}>{error}</p>}
                </>
            ) : (
                <>
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{ marginBottom: '12px' }}>Recovery Phrase</h2>
                        <div style={{ padding: '16px', backgroundColor: 'rgba(255, 69, 58, 0.1)', border: '1px solid var(--accent-danger)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
                            <AlertTriangle size={24} color="var(--accent-danger)" />
                            <p style={{ fontSize: '13px', color: 'white', textAlign: 'left' }}>
                                Write this down. If you lose this 24-word phrase, your messages will be lost forever. <strong>No one can recover it for you.</strong>
                            </p>
                        </div>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: '8px', 
                        padding: '24px', 
                        backgroundColor: 'var(--bg-panel)', 
                        border: '1px solid var(--border-main)', 
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '24px',
                        textAlign: 'left'
                    }}>
                        {generatedPhrase?.split(' ').map((word, i) => (
                            <div key={i} style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                                <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>{i + 1}.</span>
                                <span style={{ fontWeight: '600', color: 'white' }}>{word}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(generatedPhrase || '');
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            style={{ 
                                flex: 1,
                                height: '52px',
                                backgroundColor: 'var(--bg-element)',
                                border: '1px solid var(--border-main)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                borderRadius: 'var(--radius-sm)',
                                color: 'white'
                            }}
                        >
                            {copied ? <Check size={18} color="var(--accent-success)" /> : <Copy size={18} />}
                            {copied ? 'Copied' : 'Copy Phrase'}
                        </button>
                        <button 
                            onClick={() => window.location.reload()}
                            className="action-button"
                            style={{ flex: 1 }}
                        >
                            I Have Saved It <ArrowRight size={18} />
                        </button>
                    </div>
                </>
            )}
        </motion.div>
      </div>
    );
  }

  // If user is authenticated but privateKey is missing (new session)
  if (user && !privateKey) {
    const handleRecover = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await initializeE2EE(inputPhrase);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '40px' }}>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}
            >
                <div style={{ marginBottom: '40px' }}>
                    <div className="flex-center" style={{ marginBottom: '24px' }}>
                        <div style={{ padding: '20px', backgroundColor: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)' }}>
                            <LockIcon size={48} color="var(--accent-gold)" />
                        </div>
                    </div>
                    <h1>Unlock Fortress</h1>
                    <p>Encryption keys are missing for this session. Enter your 24-word recovery phrase to unlock your messages.</p>
                </div>

                <form onSubmit={handleRecover}>
                    <textarea 
                        placeholder="Enter your 24-word phrase here..."
                        value={inputPhrase}
                        onChange={(e) => setInputPhrase(e.target.value)}
                        style={{
                            width: '100%',
                            height: '120px',
                            backgroundColor: 'var(--bg-panel)',
                            border: '1px solid var(--border-main)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px',
                            color: 'white',
                            fontSize: '14px',
                            marginBottom: '24px',
                            resize: 'none',
                            fontFamily: 'inherit'
                        }}
                    />
                    
                    {error && <p style={{ color: 'var(--accent-danger)', fontSize: '14px', marginBottom: '24px' }}>{error}</p>}

                    <button type="submit" disabled={isLoading} className="action-button" style={{ width: '100%', height: '56px' }}>
                        {isLoading ? <Loader2 className="animate-spin" /> : (
                            <>
                                Unlock Messages <KeyIcon size={18} style={{ marginLeft: '8px' }} />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
  }

  return null;
};
