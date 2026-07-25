'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './companion.module.css';

export default function CompanionPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi, I'm your RecovrAI companion 💚 I'm here to listen, support, and help you navigate your recovery journey. You can type or use the microphone to talk to me. What's on your mind today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDeafMode, setIsDeafMode] = useState(false);

  // Auto-Submit Countdown States
  const [submitCountdown, setSubmitCountdown] = useState(0);
  const [countdownActive, setCountdownActive] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalizedTranscriptRef = useRef('');
  const latestTranscriptRef = useRef('');
  const shouldListenRef = useRef(false);
  const manualStopRef = useRef(false);
  const textareaRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const audioStreamRef = useRef(null);
  const selectedVoiceRef = useRef(null); // Locked once at startup — prevents voice changing between messages

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading, router]);

  // Lock in the TTS voice once at startup so it never changes between messages
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      // Prefer Google/Microsoft Natural English voices for consistency
      const preferred = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft'))
      );
      selectedVoiceRef.current = preferred || voices.find((v) => v.lang.startsWith('en')) || voices[0];
    }

    pickVoice(); // may already be populated on Firefox/Safari
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pickVoice);
  }, []);

  // Clean up mic and countdown on unmount
  useEffect(() => {
    return () => {
      stopAudioStream();
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Auto-scroll to latest message dynamically (slides up and down on key events)
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  // Countdown timer effect
  useEffect(() => {
    if (countdownActive && submitCountdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setSubmitCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            setCountdownActive(false);
            sendMessage(); // Auto-submit!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [countdownActive, submitCountdown]);

  // Initialize Speech Recognition (Chrome / Edge — requires HTTPS or localhost)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language?.startsWith('en')
      ? navigator.language
      : 'en-IN';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalizedTranscriptRef.current += text;
        } else {
          interim += text;
        }
      }

      const full = (finalizedTranscriptRef.current + interim).trim();
      latestTranscriptRef.current = full;
      setInput(full);
      setSpeechError('');
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;

      shouldListenRef.current = false;
      manualStopRef.current = false;
      stopAudioStream();
      setIsListening(false);

      const errorMessages = {
        'not-allowed': 'Microphone permission denied. Allow mic access in your browser settings.',
        'no-speech': 'No speech detected. Try speaking closer to the microphone.',
        network: 'Voice input needs an internet connection (Chrome uses online speech recognition).',
        'audio-capture': 'No microphone found. Check that a mic is connected.',
        'service-not-allowed': 'Speech recognition is blocked. Use Chrome or Edge on desktop.',
      };
      setSpeechError(errorMessages[event.error] || `Voice input error: ${event.error}`);
    };

    recognition.onend = () => {
      if (manualStopRef.current) {
        manualStopRef.current = false;
        shouldListenRef.current = false;
        stopAudioStream();
        setIsListening(false);

        const transcript = latestTranscriptRef.current.trim();
        if (transcript) {
          setInput(transcript);
          setSubmitCountdown(3);
          setCountdownActive(true);
        }
        return;
      }

      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          shouldListenRef.current = false;
          stopAudioStream();
          setIsListening(false);
        }
        return;
      }

      stopAudioStream();
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  function stopAudioStream() {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  }


  function cancelCountdown() {
    setCountdownActive(false);
    setSubmitCountdown(0);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }

  async function toggleListening() {
    if (!recognitionRef.current) {
      setSpeechError('Speech recognition is not supported. Please use Chrome or Edge on desktop.');
      return;
    }

    if (isListening) {
      manualStopRef.current = true;
      shouldListenRef.current = false;
      setIsListening(false);
      recognitionRef.current.stop();
      return;
    }

    setSpeechError('');
    finalizedTranscriptRef.current = '';
    latestTranscriptRef.current = '';
    manualStopRef.current = false;
    cancelCountdown();
    setInput('');

    try {
      stopAudioStream();
      audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setSpeechError('Microphone access denied. Click the lock icon in your address bar and allow the microphone.');
      return;
    }

    try {
      shouldListenRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      stopAudioStream();
      shouldListenRef.current = false;
      if (err.name === 'InvalidStateError') {
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            shouldListenRef.current = true;
            recognitionRef.current.start();
            setIsListening(true);
          } catch {
            setSpeechError('Could not start voice input. Wait a moment and try again.');
          }
        }, 200);
      } else {
        setSpeechError('Could not start voice input. Please try again.');
      }
    }
  }

  function speakText(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      // Clean markdown characters (*, #, _) and strip emojis so they are not read aloud
      const cleanText = text
        .replace(/[\*\#\_\`]/g, '')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        .replace(/\p{Extended_Pictographic}/gu, '') // Strip emojis like 💚 and 🧘
        .replace(/\s+/g, ' ') // Collapse double spaces
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1;

      // Reuse the locked voice from startup — never re-query getVoices() here
      if (selectedVoiceRef.current) utterance.voice = selectedVoiceRef.current;

      // GC defense: store reference on window to prevent garbage collection mid-speech
      window._activeSpeechUtterance = utterance;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        window._activeSpeechUtterance = null;
      };
      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        setIsSpeaking(false);
        window._activeSpeechUtterance = null;
      };

      window.speechSynthesis.speak(utterance);
    }
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }

  async function sendMessage(e, overrideText) {
    e?.preventDefault();
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    cancelCountdown(); // Stop any ticking countdowns
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          userContext: {
            recoveryStage: profile?.recoveryStage,
            primarySubstance: profile?.primarySubstance,
            isDeaf: isDeafMode,
          },
        }),
      });

      if (!res.ok) throw new Error('API request failed');

      const data = await res.json();
      const aiMessage = { role: 'assistant', content: data.response };
      setMessages((prev) => [...prev, aiMessage]);

      // Auto-speak the response only if not in Deaf Mode
      if (!isDeafMode) {
        speakText(data.response);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. If you're in crisis, please call 988.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Enter to send (Shift+Enter for newline)
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  if (loading || !user) {
    return (
      <div className="flex flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className={`page-content ${styles.companion}`}>
      <div className={styles.chatContainer}>
        {/* Chat Header */}
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderInfo}>
            <div className={styles.avatarContainer}>
              <span className={styles.avatar}>💚</span>
              <span className={styles.onlineDot} />
            </div>
            <div>
              <h1 className={styles.chatTitle}>AI Recovery Companion</h1>
              <p className={styles.chatSubtitle}>
                {isLoading ? 'Thinking...' : isSpeaking && !isDeafMode ? '🔊 Speaking...' : 'Online • Voice-enabled'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsDeafMode(!isDeafMode);
                stopSpeaking();
              }}
              className={`btn btn-sm ${isDeafMode ? 'btn-primary' : 'btn-secondary'}`}
              aria-label="Toggle Deaf & Hard of Hearing Mode"
              style={{ fontSize: '0.8rem', padding: '6px 12px', minHeight: '36px' }}
            >
              🧏 {isDeafMode ? 'Deaf Mode: ON' : 'Deaf Mode: OFF'}
            </button>
            {isSpeaking && !isDeafMode && (
              <button onClick={stopSpeaking} className="btn btn-ghost btn-sm" aria-label="Stop speaking" style={{ minHeight: '36px' }}>
                🔇 Stop
              </button>
            )}
          </div>
        </div>

        {/* Deaf Mode Banner */}
        {isDeafMode && (
          <div className={styles.deafBanner}>
            <div className={styles.deafBannerText}>
              <span>🧏</span>
              <span><strong>Deaf Accessibility Active:</strong> Visual coping aids and gesture translation enabled.</span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button 
                type="button"
                onClick={() => {
                  const hasBreathing = messages.some(m => m.id === 'breathing-guide');
                  if (hasBreathing) {
                    setMessages(prev => prev.filter(m => m.id !== 'breathing-guide'));
                  } else {
                    setMessages(prev => [
                      ...prev,
                      {
                        id: 'breathing-guide',
                        role: 'assistant',
                        content: 'Visual Breathing Guide. Follow the expansion of the circular pacer below.',
                        isVisualGuide: true
                      }
                    ]);
                  }
                }} 
                className="btn btn-primary btn-sm animate-pulse"
                style={{ fontSize: '0.75rem', minHeight: '32px', padding: '6px 12px' }}
              >
                🧘 Visual Breathing Pacer
              </button>
            </div>
          </div>
        )}



        {/* Messages */}
        <div className={styles.messageList} role="log" aria-live="polite" aria-label="Chat messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.message} ${
                msg.role === 'user' ? styles.userMessage : styles.aiMessage
              } animate-fade-in`}
            >
              {msg.role === 'assistant' && (
                <span className={styles.msgAvatar}>💚</span>
              )}
              <div
                className={styles.msgBubble}
                style={msg.isVisualGuide ? { width: '100%', maxWidth: '400px', borderLeft: '4px solid var(--primary-500)', background: 'var(--bg-secondary)' } : {}}
              >
                {msg.isVisualGuide ? (
                  <div>
                    <p style={{ fontWeight: '600', marginBottom: '12px', fontSize: '0.95rem' }}>{msg.content}</p>
                    <div className={styles.breatheContainer}>
                      <div className={styles.breatheCircle} />
                      <div className={styles.breatheLabel}>Inhale ... Hold ... Exhale</div>
                    </div>
                  </div>
                ) : (
                  <p className={styles.msgText}>{msg.content}</p>
                )}
                {msg.role === 'assistant' && !isDeafMode && !msg.isVisualGuide && (
                  <button
                    type="button"
                    onClick={() => speakText(msg.content)}
                    className={styles.speakBtn}
                    aria-label="Read message aloud"
                    title="Read aloud"
                  >
                    🔊
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className={`${styles.message} ${styles.aiMessage}`}>
              <span className={styles.msgAvatar}>💚</span>
              <div className={styles.msgBubble}>
                <div className={styles.typingIndicator}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Visual Fallback / Gesture Quick-Tap Panel for Deaf Mode */}
        {isDeafMode && messages.length <= 1 && (
          <div className={styles.fallbackGridBox}>
            <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Quick-Tap Coping Options (Zero-Typing):
            </p>
            <div className={styles.quickTapButtons}>
              {[
                { emoji: '😰', label: 'Anxious', text: 'I am feeling highly anxious right now.' },
                { emoji: '🚭', label: 'Craving', text: 'I am having a strong craving.' },
                { emoji: '🚨', label: 'Need Help', text: 'I need immediate help/crisis advice.' },
                { emoji: '🤝', label: 'Lonely', text: 'I feel lonely and need someone to talk to.' }
              ].map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  className={styles.quickTapBtn}
                  onClick={() => {
                    setInput(opt.text);
                    setSubmitCountdown(3);
                    setCountdownActive(true);
                  }}
                >
                  <span>{opt.emoji}</span> {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggested prompts */}
        {!isDeafMode && messages.length <= 1 && (
          <div className={styles.suggestions}>
            {[
              "I'm having a craving right now",
              'I need coping strategies',
              'Tell me about recovery stages',
              "I'm feeling anxious today",
            ].map((s) => (
              <button
                key={s}
                type="button"
                className={styles.suggestionChip}
                onClick={() => {
                  sendMessage(null, s);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={sendMessage} className={styles.inputArea}>
          {isListening && (
            <div className={styles.visualMicFeedback}>
              <div className={styles.micWaveBar} />
              <div className={styles.micWaveBar} style={{ animationDelay: '0.2s' }} />
              <div className={styles.micWaveBar} style={{ animationDelay: '0.4s' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: '600' }}>
                Listening… tap ⏹️ when you&apos;re done speaking
              </span>
            </div>
          )}

          {speechError && (
            <div className={styles.speechErrorBanner} role="alert">
              ⚠️ {speechError}
            </div>
          )}

          {/* Auto-Submit Countdown Overlay */}
          {countdownActive && (
            <div className={styles.countdownOverlay}>
              <span>🚀 Auto-sending in <strong>{submitCountdown}s</strong>...</span>
              <button 
                type="button" 
                onClick={cancelCountdown} 
                className={`btn btn-secondary btn-sm ${styles.cancelCountdownBtn}`}
              >
                Cancel Send
              </button>
            </div>
          )}

          <div className={styles.inputWrapper}>
            <textarea
              ref={textareaRef}
              className={styles.chatInput}
              placeholder={isListening ? 'Listening...' : 'Type or use voice input...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
              aria-label="Chat message input"
              id="chat-input"
            />
            <div className={styles.inputActions}>
              <button
                type="button"
                onClick={toggleListening}
                className={`${styles.voiceBtn} ${isListening ? styles.listening : ''}`}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                title="Voice input"
                id="voice-btn"
              >
                {isListening ? '⏹️' : '🎤'}
              </button>
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                id="send-btn"
              >
                ➤
              </button>
            </div>
          </div>
          <p className={styles.disclaimer}>
            AI companion — not a substitute for professional help. Crisis? Call 988.
          </p>
        </form>
      </div>
    </div>
  );
}
