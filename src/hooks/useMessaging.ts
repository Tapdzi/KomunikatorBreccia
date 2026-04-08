import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-store';
import * as crypto from '../lib/crypto';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  encrypted_content: string;
  content_iv: string;
  encrypted_message_key: string;
  created_at: string;
  decrypted_content?: string;
  sender_username?: string;
}

export function useMessaging(receiverId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, privateKey } = useAuth();

  useEffect(() => {
    if (!user || !receiverId || !privateKey) return;

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${user.id}:${receiverId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        handleNewMessage(payload.new as Message);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, receiverId, privateKey]);

  async function fetchMessages() {
    if (!user || !receiverId || !privateKey) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(username)
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) console.error('Error fetching messages:', error);
    if (data) {
      const decrypted = await Promise.all(data.map(async (msg) => {
        try {
          return await decryptMessage(msg);
        } catch (e) {
          console.error('Failed to decrypt message', e);
          return { ...msg, decrypted_content: '[Błąd deszyfrowania]' };
        }
      }));
      setMessages(decrypted);
    }
    setLoading(false);
  }

  async function handleNewMessage(msg: Message) {
    if (msg.sender_id !== receiverId) return;
    try {
      const decrypted = await decryptMessage(msg);
      setMessages(prev => [...prev, decrypted]);
    } catch (e) {
       console.error('Failed to decrypt new message', e);
    }
  }

  async function decryptMessage(msg: any): Promise<Message> {
    if (!privateKey) return msg;

    // 1. Decrypt Message Key
    const messageKey = await crypto.decryptMessageKey(msg.encrypted_message_key, privateKey);
    // 2. Decrypt Content
    const content = await crypto.decryptData(msg.encrypted_content, msg.content_iv, messageKey);

    return {
      ...msg,
      decrypted_content: content,
      sender_username: msg.sender?.username
    };
  }

  const sendMessage = async (content: string) => {
    if (!user || !receiverId || !privateKey) return;

    // 1. Get recipient public key
    const { data: profile } = await supabase
      .from('profiles')
      .select('public_key')
      .eq('id', receiverId)
      .single();

    if (!profile) throw new Error('Nie znaleziono publicznego klucza odbiorcy');

    const recipientPubKey = await crypto.importPublicKey(profile.public_key);

    // 2. Encrypt message
    const msgKey = await crypto.generateMessageKey();
    const { encrypted: encContent, iv: contentIv } = await crypto.encryptData(content, msgKey);
    const encMsgKey = await crypto.encryptMessageKey(msgKey, recipientPubKey);

    // 3. Send to Supabase
    const { data, error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: receiverId,
      encrypted_content: encContent,
      content_iv: contentIv,
      encrypted_message_key: encMsgKey
    }).select().single();

    if (error) throw error;
    
    // Add to local state (optimistic or after fetch)
    const newMessage = {
      ...data,
      decrypted_content: content,
      sender_username: 'Ty'
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return { messages, sendMessage, loading };
}
