import React, { useState, useRef, useEffect } from 'react';
import { awsLogger, AwsCloudLog } from '../../services/awsLogger';
import { ChevronDown, ChevronUp, Terminal, Wifi, WifiOff, Trash2 } from 'lucide-react';

const SERVICE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Cognito':     { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/30' },
  'APIGateway':  { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  'Lambda':      { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  'DynamoDB':    { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   border: 'border-cyan-500/30' },
  'SNS':         { bg: 'bg-pink-500/10',   text: 'text-pink-400',   border: 'border-pink-500/30' },
  'EventBridge': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'S3':          { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/30' },
};

const STATUS_STYLE: Record<string, string> = {
  '200 OK':        'text-emerald-400',
  'Success':       'text-emerald-300',
  'Published':     'text-teal-400',
  'Authenticated': 'text-blue-300',
};

export const AwsLiveConsoleDrawer: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<AwsCloudLog[]>([]);
  const [paused, setPaused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = awsLogger.subscribe((newEvents) => {
      if (!paused) setEvents(newEvents.slice(0, 25));
    });
    return unsub;
  }, [paused]);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, open]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      {/* ── Toggle Tab ──────────────────────────────────────────── */}
      <div className="flex justify-center">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-5 py-1.5 bg-[#0a101f]/95 border border-[#FF9900]/25 border-b-0 rounded-t-xl text-xs font-bold text-[#FF9900] hover:bg-[#111827] transition-colors backdrop-blur-xl"
        >
          <div className="relative flex items-center">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            <span className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-60" style={{ animationDuration: '1.5s' }} />
          </div>
          <Terminal className="w-3.5 h-3.5" />
          AWS Live Console
          {events.length > 0 && (
            <span className="bg-[#FF9900]/20 text-[#FF9900] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              {events.length}
            </span>
          )}
          {open ? <ChevronDown className="w-3.5 h-3.5 ml-1" /> : <ChevronUp className="w-3.5 h-3.5 ml-1" />}
        </button>
      </div>

      {/* ── Console Drawer ───────────────────────────────────────── */}
      <div
        className="aws-terminal transition-all duration-300 overflow-hidden"
        style={{ maxHeight: open ? '260px' : '0px', opacity: open ? 1 : 0 }}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#FF9900]/10 bg-[#FF9900]/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[11px] font-bold font-mono text-[#FF9900]/70">CloudWatch Logs Stream — ap-south-1</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaused(!paused)}
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                paused
                  ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                  : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
              }`}
            >
              {paused ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              {paused ? 'PAUSED' : 'LIVE'}
            </button>
            <button
              onClick={() => { awsLogger.clearLogs(); setEvents([]); }}
              className="text-slate-600 hover:text-slate-400 transition-colors p-1"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Log entries */}
        <div className="overflow-y-auto font-mono" style={{ maxHeight: '196px' }}>
          {events.length === 0 ? (
            <div className="py-6 text-center text-slate-600 text-[11px]">
              No events yet. Perform an action to see live AWS service logs here.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.02]">
              {events.map((ev, i) => {
                const svc = SERVICE_COLORS[ev.service] ?? { bg: 'bg-slate-700/30', text: 'text-slate-400', border: 'border-slate-700/50' };
                const statusStyle = STATUS_STYLE[ev.status] ?? 'text-slate-400';
                return (
                  <div
                    key={ev.id ?? i}
                    className="flex items-start gap-3 px-4 py-2 hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-[10px] text-slate-600 font-mono shrink-0 mt-0.5 tabular-nums w-16">
                      {ev.timestamp}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${svc.bg} ${svc.text} ${svc.border}`}>
                      {ev.service}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0 min-w-[120px] truncate">{ev.action}</span>
                    <span className="text-[11px] text-slate-300 leading-tight flex-1 truncate">
                      {ev.details}
                    </span>
                    <span className={`text-[10px] font-bold shrink-0 tabular-nums ${statusStyle}`}>
                      {ev.status} · {ev.latencyMs}ms
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};
