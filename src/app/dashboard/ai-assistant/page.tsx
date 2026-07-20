'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from '../session-provider';
import { Bot, Send, User, CornerDownLeft } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  widget?: any;
}

export default function AIAssistantPage() {
  const { user } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const isEmployee = user?.role === 'Employee';

  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: isEmployee
            ? `Hello ${user.name}! I am your personal AI Assistant. Ask me about your remaining leave balance, active training courses, or latest payslip details.`
            : `Hello ${user.name}! I am your AI HR Assistant. I can execute real-time queries against your HR database collections. 
  
Try asking one of the suggested queries below or type a natural language question.`
        }
      ]);
    }
  }, [user, isEmployee, messages.length]);

  const suggestionChips = isEmployee
    ? [
        'How many leave days do I have left?',
        "What's my next training deadline?",
        'Show me my last payslip summary'
      ]
    : [
        'Who is on leave next week?',
        'Show me employees due for a performance review',
        "What's our total payroll cost this month?",
        'Which department has the highest attendance rate?'
      ];

  // Auto-scroll chat messages container only, leaving viewport untouched
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend })
      });

      if (res.ok) {
        const data = await res.json();
        // Artificial delay for premium feel typing indicator
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: data.reply,
            widget: data.widget
          }]);
        }, 800);
      } else {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Sorry, I failed to process that request due to a server error.'
        }]);
      }
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: 'Network error. Please make sure the server is reachable.'
      }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      <div className="chat-window" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="chat-header-area">
          <div className="chat-avatar">
            <Bot size={22} />
          </div>
          <div>
            <div className="chat-header-title">Workforcely AI Reasoning System</div>
            <div className="chat-header-status">
              <span className="chat-status-dot"></span>
              Live Database Connected
            </div>
          </div>
        </div>

        {/* Scrollable Message Feed */}
        <div className="chat-messages" ref={chatMessagesRef}>
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.sender === 'user' ? 'message-user' : 'message-assistant'}`}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: msg.sender === 'user' ? 'var(--primary-light)' : 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: msg.sender === 'user' ? 'var(--primary)' : 'var(--text-secondary)',
                flexShrink: 0
              }}>
                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="message-bubble" style={{ whiteSpace: 'pre-line' }}>
                  {msg.text}
                </div>

                {/* Render widget details */}
                {msg.widget && (
                  <div className="message-widget">
                    {msg.widget.type === 'table' && (
                      <table className="widget-table">
                        <thead>
                          <tr>
                            {msg.widget.headers.map((h: string) => <th key={h}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.widget.rows.map((row: any, rIdx: number) => (
                            <tr key={rIdx}>
                              {Object.values(row).map((val: any, cIdx: number) => (
                                <td key={cIdx}>{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {msg.widget.type === 'summary' && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '10px',
                        marginTop: '10px'
                      }}>
                        {Object.entries(msg.widget.data).map(([key, val]: any) => (
                          <div key={key} style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-sm)'
                          }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{key}</div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator Bubble */}
          {isTyping && (
            <div className="message message-assistant">
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}>
                <Bot size={16} />
              </div>
              <div className="typing-bubble">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="chat-suggestions">
          {suggestionChips.map(chip => (
            <button
              key={chip}
              className="suggestion-chip"
              disabled={isTyping}
              onClick={() => handleSendMessage(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* TextInput Area */}
        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            placeholder={isEmployee ? "Ask about your leave, training, or payslip..." : "Ask AI HR Assistant..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isTyping}
          />
          <button
            className="chat-send-btn"
            onClick={() => handleSendMessage(inputValue)}
            disabled={isTyping || !inputValue.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
