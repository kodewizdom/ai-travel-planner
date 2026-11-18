import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Compass, Sparkles, Send } from 'lucide-react';
import TripForm from './TripForm';

export default function ChatPanel({
  isMobile,
  mobileActiveTab,
  chatScrollRef,
  messagesEndRef,
  messages,
  isLoading,
  inputText,
  setInputText,
  handleSendMessage,
  tripFormProps,
  hasSearched,
  onViewItinerary
}) {
  return (
    <div className={`panel-left ${isMobile && mobileActiveTab !== 'planner' ? 'hidden-mobile' : ''}`}>
      {/* Scrollable Chat Area */}
      <div className="chat-feed" ref={chatScrollRef}>
        {/* INITIAL GREETING MESSAGE & EMBEDDED TRIP PLANNER INPUT CARD */}
        <div className="message-row assistant intro-row">
          {/* BOT GREETING SPEECH BUBBLE */}
          <div className="bot-welcome-row">
            <div className="avatar-bot-round">
              <Bot size={22} />
            </div>
            <div className="bot-speech-bubble">
              <div className="bubble-heading">Hi!</div>
              <div className="bubble-text">I'm your travel assistant.</div>
              <div className="bubble-text">Where would you like to go?</div>
            </div>
          </div>

          <p className="bot-prompt-lead">
            Great! I can help plan your trip. Fill in the details below to get started.
          </p>

          {/* TRIP INPUT FORM CARD EMBEDDED IN CHAT */}
          <TripForm {...tripFormProps} />
        </div>

        {/* QUICK SHORTCUT BANNER FOR MOBILE WHEN ITINERARY IS READY */}
        {isMobile && hasSearched && (
          <div className="mobile-itinerary-banner">
            <button
              type="button"
              className="mobile-itinerary-jump-btn"
              onClick={onViewItinerary}
            >
              <Compass size={15} />
              <span>View Live Itinerary & Bookings</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        )}

        {/* CONVERSATION MESSAGES */}
        {messages.map((msg, index) => {
          if (msg.isInternal) {
            return (
              <div key={index} className="trip-pill-row">
                <div className="trip-pill-tag">
                  <Compass size={14} />
                  <span>{msg.summary}</span>
                </div>
              </div>
            );
          }

          return (
            <div key={index} className={`message-row ${msg.role}`}>
              <div className={msg.role === 'user' ? 'avatar-user' : 'avatar-bot'}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="message-bubble-wrapper">
                <div className="message-bubble markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {(msg.content || '').replace(/<br\s*\/?>/gi, '\n\n')}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}

        {/* SIMPLE LOADING IN CHAT */}
        {isLoading && (
          <div className="message-row assistant">
            <div className="avatar-bot">
              <Bot size={16} />
            </div>
            <div className="message-bubble-wrapper">
              <div className="message-bubble loading">
                <span>Thinking…</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ================= BOTTOM PROMPT INPUT SECTION ================= */}
      <div className="chat-prompt-bar clean-bar">
        <form className="clean-prompt-form" onSubmit={handleSendMessage}>
          <div className="clean-input-inner">
            <Sparkles size={16} className="clean-sparkle-icon" />
            <input
              type="text"
              placeholder="Ask anything..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="clean-circle-send"
              disabled={isLoading || !inputText.trim()}
              title="Send message"
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
