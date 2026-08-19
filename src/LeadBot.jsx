import { useState, useEffect, useRef } from 'react';
import Icon from './Icon.jsx';
import { WA_LINK, AREAS } from './siteConfig.js';
import './LeadBot.css';

// Scripted lead-qualification chat — not an LLM, just a small state machine
// that walks the visitor through a few questions and hands off to WhatsApp,
// same zero-backend pattern as the hero form in Home.jsx (window.open on
// wa.me with a pre-filled message). Kept as its own component so it can
// mount once in SiteFooter and appear on every marketing/blog page.
const STEPS = [
  { key: 'name',     type: 'text',
    bot: () => "Hi! I'm the Painter Boys estimate assistant. I can get you a free quote in under a minute — what's your name?",
    placeholder: 'Your name', validate: v => v.trim().length > 1 },
  { key: 'phone',    type: 'tel',
    bot: a => `Nice to meet you, ${a.name.split(' ')[0]}! What's the best WhatsApp number to reach you on?`,
    placeholder: '10-digit phone number', validate: v => /^\d{10}$/.test(v.replace(/\D/g, '')) },
  { key: 'project',  type: 'choice',
    bot: () => 'What kind of project is this?',
    options: ['Interior Painting', 'Exterior Painting', 'Waterproofing', 'Premium Finishes', 'Commercial Space', 'Not sure yet'] },
  { key: 'area',     type: 'choice',
    bot: () => 'Which area are you in?',
    options: AREAS },
  { key: 'timeline', type: 'choice',
    bot: () => 'Last one — when are you looking to start?',
    options: ['Immediately', 'Within 2 weeks', 'Within a month', 'Just exploring'] },
];

function buildWaMessage(a) {
  return `Hi! I'd like a free painting estimate.\nName: ${a.name}\nPhone: ${a.phone}\nProject: ${a.project}\nArea: ${a.area}\nTimeline: ${a.timeline}`;
}

export default function LeadBot() {
  const [open, setOpen]         = useState(false);
  const [stepIdx, setStepIdx]   = useState(0);
  const [answers, setAnswers]   = useState({});
  const [messages, setMessages] = useState([]);
  const [typing, setTyping]     = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [inputErr, setInputErr] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sent, setSent]         = useState(false);
  const scrollRef = useRef(null);

  const started = messages.length > 0;

  useEffect(() => {
    if (open && !started) askStep(0, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  function pushBotMessage(text) {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { from: 'bot', text }]);
    }, 500);
  }

  function askStep(idx, a) {
    const step = STEPS[idx];
    pushBotMessage(step.bot(a));
  }

  function handleAnswer(displayText, rawValue) {
    const step = STEPS[stepIdx];
    const nextAnswers = { ...answers, [step.key]: rawValue };
    setAnswers(nextAnswers);
    setMessages(m => [...m, { from: 'user', text: displayText }]);
    setInputVal('');
    setInputErr(false);

    const nextIdx = stepIdx + 1;
    if (nextIdx < STEPS.length) {
      setStepIdx(nextIdx);
      askStep(nextIdx, nextAnswers);
    } else {
      setStepIdx(nextIdx);
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages(m => [...m, { from: 'bot', text: `Perfect — I've got everything I need, ${nextAnswers.name.split(' ')[0]}. Tap below and I'll open WhatsApp with your details so our team can send a free estimate.` }]);
        setFinished(true);
      }, 500);
    }
  }

  function submitText(e) {
    e.preventDefault();
    const step = STEPS[stepIdx];
    if (!step.validate(inputVal)) { setInputErr(true); return; }
    handleAnswer(inputVal.trim(), inputVal.trim());
  }

  function sendToWhatsApp() {
    window.open(`${WA_LINK}?text=${encodeURIComponent(buildWaMessage(answers))}`, '_blank');
    setSent(true);
  }

  function restart() {
    setStepIdx(0); setAnswers({}); setMessages([]); setFinished(false); setSent(false);
    askStep(0, {});
  }

  const currentStep = STEPS[stepIdx];

  return (
    <>
      <button className="lb-fab" onClick={() => setOpen(o => !o)} aria-label={open ? 'Close chat' : 'Get a free estimate'}>
        <Icon name={open ? 'close' : 'chat'} size={24} />
      </button>

      {open && (
        <div className="lb-panel" role="dialog" aria-label="Free estimate assistant">
          <div className="lb-head">
            <div className="lb-head-avatar"><Icon name="chat" size={16} /></div>
            <div>
              <div className="lb-head-title">Painter Boys Assistant</div>
              <div className="lb-head-sub">Usually replies instantly</div>
            </div>
            <button className="lb-head-close" onClick={() => setOpen(false)} aria-label="Close chat"><Icon name="close" size={16} /></button>
          </div>

          <div className="lb-body" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`lb-msg lb-msg-${m.from}`}>{m.text}</div>
            ))}
            {typing && (
              <div className="lb-msg lb-msg-bot lb-typing"><span /><span /><span /></div>
            )}

            {!typing && !finished && currentStep && currentStep.type === 'choice' && (
              <div className="lb-choices">
                {currentStep.options.map(o => (
                  <button key={o} className="lb-choice-btn" onClick={() => handleAnswer(o, o)}>{o}</button>
                ))}
              </div>
            )}

            {!typing && finished && !sent && (
              <button className="lb-choice-btn lb-send-btn" onClick={sendToWhatsApp}>
                <Icon name="whatsapp" size={16} />Send on WhatsApp →
              </button>
            )}

            {sent && (
              <div className="lb-done">
                <Icon name="badgeCheck" size={26} />
                <p>Sent! Continue the chat in WhatsApp — our team will follow up shortly.</p>
                <button className="lb-restart" onClick={restart}>Start a new estimate</button>
              </div>
            )}
          </div>

          {!typing && !finished && currentStep && (currentStep.type === 'text' || currentStep.type === 'tel') && (
            <form className="lb-input-row" onSubmit={submitText}>
              <input
                className={`lb-input${inputErr ? ' lb-input-err' : ''}`}
                type={currentStep.type === 'tel' ? 'tel' : 'text'}
                placeholder={currentStep.placeholder}
                value={inputVal}
                onChange={e => { setInputVal(e.target.value); setInputErr(false); }}
                autoFocus
              />
              <button className="lb-send" type="submit" aria-label="Send"><Icon name="send" size={16} /></button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
