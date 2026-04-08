import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth-store';
import { supabase } from '../lib/supabase';
import { useMessaging } from '../hooks/useMessaging';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Search, 
  LogOut, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  MoreVertical,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Lock as LockIcon
} from 'lucide-react';

export const Chat: React.FC = () => {
  const { user, profile, signOut, mnemonic } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const { messages, sendMessage } = useMessaging(selectedUser?.id);
  const [showSettings, setShowSettings] = useState(false);

  // Settings states
  const [showMnemonic, setShowMnemonic] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchProfiles() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.id)
      .order('username', { ascending: true });
    if (data) setProfiles(data);
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser) return;
    
    try {
      await sendMessage(messageInput);
      setMessageInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.username.toLowerCase().includes(search.toLowerCase())
  );

  const isVerified = true; // Clerk users are verified/active

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-dark)' }}>
      {/* Sidebar */}
      <AnimatePresence mode="popLayout">
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ 
              width: '320px', 
              borderRight: '1px solid var(--border-main)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-panel)',
              zIndex: 10
            }}
          >
            {/* Sidebar Header */}
            <div style={{ padding: '32px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/Logo.png" alt="B" style={{ width: '32px' }} />
                    <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.03em' }}>Breccia</h2>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowSettings(true)} style={{ color: 'var(--text-dim)', padding: '4px' }}>
                        <SettingsIcon size={20} />
                    </button>
                    <button onClick={() => signOut()} style={{ color: 'var(--text-dim)', padding: '4px' }}>
                        <LogOut size={20} />
                    </button>
                </div>
              </div>

              {/* Profile Card */}
              <div style={{ 
                  padding: '16px', 
                  backgroundColor: 'var(--bg-surface)', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: 'var(--accent-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  color: 'black',
                  fontSize: '16px'
                }}>
                  {profile?.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.username}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isVerified ? 'var(--accent-success)' : 'var(--accent-gold)' }}></div>
                    <p style={{ fontSize: '12px', color: 'var(--text-sub)', fontWeight: '600' }}>
                        {isVerified ? 'Verified' : 'Identity Pending'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="luxury-input-modern"
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            {/* Contact List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 8px' }}>
                <p style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Conversations
                </p>
                <Plus size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
              
              {filteredProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedUser(p)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    backgroundColor: selectedUser?.id === p.id ? 'var(--bg-surface)' : 'transparent',
                    marginBottom: '4px',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ 
                    width: '42px', 
                    height: '42px', 
                    borderRadius: 'var(--radius-sm)', 
                    backgroundColor: 'var(--bg-element)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-sub)',
                    border: '1px solid var(--border-main)'
                  }}>
                    <UserIcon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: selectedUser?.id === p.id ? 'var(--accent-gold)' : 'white' }}>
                      {p.username}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Secure encryption active
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: 'var(--bg-dark)' }}>
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            style={{ 
              position: 'absolute', 
              left: '24px', 
              top: '24px', 
              zIndex: 5,
              padding: '10px',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-main)',
              color: 'var(--text-dim)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <ChevronRight size={20} />
          </button>
        )}

        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div style={{ 
              padding: '24px 40px', 
              borderBottom: '1px solid var(--border-main)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-panel)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: 'var(--radius-sm)', 
                        backgroundColor: 'var(--bg-element)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-gold)',
                        border: '1px solid var(--border-main)'
                    }}>
                  <UserIcon size={24} />
                </div>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800' }}>{selectedUser.username}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={14} color="var(--accent-success)" />
                        <span style={{ fontSize: '12px', color: 'var(--accent-success)', fontWeight: '700' }}>Encryption active</span>
                    </div>
                </div>
              </div>
              <button style={{ color: 'var(--text-dim)' }}>
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}
            >
              <div className="flex-center" style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', border: '1px solid var(--border-main)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                   Verified End-to-End Handshake
                </span>
              </div>
              
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  style={{ 
                    alignSelf: msg.sender_id === user?.id ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender_id === user?.id ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '700' }}>
                    {msg.sender_id === user?.id ? '' : selectedUser.username}
                  </div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bubble ${msg.sender_id === user?.id ? 'bubble-me' : 'bubble-them'}`}
                  >
                    {msg.decrypted_content}
                  </motion.div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div style={{ padding: '0 40px 40px 40px' }}>
              <form 
                onSubmit={handleSend}
                style={{ 
                  display: 'flex', 
                  gap: '12px',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-panel)',
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-main)'
                }}
              >
                <input
                  type="text"
                  placeholder={`Message ${selectedUser.username}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '12px 16px',
                    color: 'white',
                    fontSize: '15px'
                  }}
                />
                <button 
                  type="submit"
                  className="action-button"
                  style={{ 
                    width: '44px',
                    height: '44px',
                    padding: 0
                  }}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-center" style={{ flex: 1, flexDirection: 'column', color: 'var(--text-muted)', gap: '16px' }}>
            <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <MessageCircle size={64} style={{ color: 'var(--bg-element)', strokeWidth: 1 }} />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-dim)' }}>Your secure space.</h2>
                <p style={{ marginTop: '8px', fontSize: '15px' }}>Select a contact from the list to start messaging.</p>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', 
              inset: 0, 
              backgroundColor: 'rgba(0,0,0,0.95)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              zIndex: 100,
              padding: '24px'
            }}
          >
            <motion.div 
              style={{ padding: '56px', width: '100%', maxWidth: '440px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-main)', borderRadius: 'var(--radius-lg)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '24px' }}>Settings</h1>
                <button onClick={() => { setShowSettings(false); setShowMnemonic(false); }} style={{ color: 'var(--text-dim)' }}><ChevronLeft size={24} /></button>
              </div>

              {/* Recovery & Security Section */}
              <div style={{ marginBottom: '40px' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: '800', letterSpacing: '0.1em' }}>Recovery & Security</div>
                
                <div style={{ padding: '24px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-main)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <LockIcon size={20} color="var(--accent-gold)" />
                        <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Recovery Phrase</h3>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '16px' }}>
                        Your 24-word phrase is the only way to recover your messages on a new device.
                    </p>
                    
                    {!showMnemonic ? (
                        <button 
                            onClick={() => setShowMnemonic(true)}
                            className="action-button"
                            style={{ padding: '8px 16px', fontSize: '12px', width: 'auto' }}
                        >
                            View Phrase
                        </button>
                    ) : (
                        <div style={{ 
                            padding: '16px', 
                            backgroundColor: 'var(--bg-dark)', 
                            borderRadius: 'var(--radius-sm)', 
                            border: '1px solid var(--border-main)',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            color: 'var(--accent-gold)',
                            wordBreak: 'break-all',
                            lineHeight: '1.6'
                        }}>
                            {mnemonic || 'Phrase not available in this session.'}
                        </div>
                    )}
                </div>
              </div>

              <div style={{ marginBottom: '40px' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: '800', letterSpacing: '0.1em' }}>Privacy Details</div>
                <div style={{ padding: '20px 0', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>End-to-End Encryption</span>
                        <ShieldCheck size={18} color="var(--accent-success)" />
                    </div>
                </div>
              </div>

              <button 
                onClick={() => { setShowSettings(false); setShowMnemonic(false); }}
                className="action-button"
                style={{ 
                    width: '100%', 
                    backgroundColor: 'var(--bg-element)', 
                    color: 'white',
                    border: '1px solid var(--border-main)',
                    height: '52px'
                }}
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
