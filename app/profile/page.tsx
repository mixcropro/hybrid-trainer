'use client';
import { useState, useEffect } from 'react';
import { Activity, Heart, Moon, Send, Calendar, History, User, MessageSquare, Dumbbell, Bike, Footprints, Flame, RefreshCw } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'planner'>('dashboard');
  
  // Chat state
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Data state
  const [activities, setActivities] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [filterSport, setFilterSport] = useState<string>('all');
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/workouts');
      const data = await res.json();
      if (data.activities) setActivities(data.activities);
      if (data.scheduled) setScheduled(data.scheduled);
    } catch (e) {
      console.error('Greška pri učitavanju:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (data.reply) setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Greška u komunikaciji.' }]);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = filterSport === 'all' 
    ? activities 
    : activities.filter(a => a.sport_type === filterSport || a.raw_garmin_type?.includes(filterSport));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Gornja traka s Navigacijskim Tabovima */}
      <header className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Hibridni AI Trener</h1>
          <p className="text-slate-400 text-sm">Garmin Connect Auto-Sync & Analitika Treninga</p>
        </div>

        {/* Tab gumbi */}
        <nav className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> AI Trener & Chat
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'history' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Povijest Aktivnosti ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'planner' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Kalendar Treninga
          </button>
          <a
            href="/profile"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-slate-400 hover:text-slate-200"
          >
            <User className="w-3.5 h-3.5" /> Profil
          </a>
        </nav>
      </header>

      {/* ---------------- TAB 1: DASHBOARD & CHAT ---------------- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Biometrijske Kartice */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
              <Heart className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-xs text-slate-400">HRV Status</p>
                <p className="text-sm font-semibold">Balanced (62 ms)</p>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
              <Moon className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-xs text-slate-400">Kvaliteta Sna</p>
                <p className="text-sm font-semibold">85 / 100</p>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
              <Activity className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-400">Akutni Umor (ATL)</p>
                <p className="text-sm font-semibold">48 TSS/dan</p>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
              <Flame className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-xs text-slate-400">Forma (TSB)</p>
                <p className="text-sm font-semibold text-emerald-400">+6 (Optimalno)</p>
              </div>
            </div>
          </div>

          {/* AI Chat Sučelje */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[520px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                  <Activity className="w-8 h-8 stroke-1 text-slate-400" />
                  <p className="text-xs max-w-md">
                    Pitaj trenera bilo što – ima potpun uvid u sve Garmin sinhronizirane aktivnosti, oporavak i tvoj profil.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && <div className="text-xs text-slate-400 animate-pulse p-2">Trener izračunava parametre oporavka i treninga...</div>}
            </div>

            <div className="p-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                placeholder="Npr. Kako da uskladim treadmill trčanje i čučanj ovaj tjedan?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: POVIJEST AKTIVNOSTI (SVI SPORTOVI) ---------------- */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filteri po sportu */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <span className="text-xs font-semibold text-slate-400">Filtriraj po aktivnostima:</span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['all', 'run', 'bike', 'swim', 'strength', 'walk'].map((sport) => (
                <button
                  key={sport}
                  onClick={() => setFilterSport(sport)}
                  className={`px-3 py-1 rounded-lg capitalize text-xs font-medium transition-colors ${
                    filterSport === sport ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {sport === 'all' ? 'Sve aktivnosti' : sport}
                </button>
              ))}
            </div>
          </div>

          {/* Tablica / Lista Sinhroniziranih Aktivnosti */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white">Garmin Automatski Registrirani Treninzi</h3>
              <span className="text-xs text-slate-500">Prikazano: {filteredActivities.length} treninga</span>
            </div>

            <div className="divide-y divide-slate-800">
              {filteredActivities.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nema evidentiranih treninga za odabrani filter. Pokreni `python scripts/sync_garmin.py` za automatsko povlačenje.
                </div>
              ) : (
                filteredActivities.map((act) => (
                  <div key={act.id} className="p-4 hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-100">{act.title}</span>
                        <span className="px-2 py-0.5 bg-slate-800 text-[10px] text-slate-300 rounded font-mono uppercase">
                          {act.raw_garmin_type || act.sport_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {act.date} • Trajanje: <span className="text-slate-200 font-medium">{act.duration_minutes} min</span>
                        {act.distance_km && ` • Udaljenost: ${act.distance_km} km`}
                        {act.avg_power_watts && ` • Snaga: ${act.avg_power_watts} W`}
                        {act.avg_hr && ` • Puls: ${act.avg_hr} bpm`}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      {act.calories && <span className="text-slate-400">{act.calories} kcal</span>}
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-mono font-semibold">
                        +{act.tss || 0} TSS
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 3: KALENDAR & PLANER ---------------- */}
      {activeTab === 'planner' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-white">Zakazani Budući Treninzi & Korekcije Plana</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scheduled.map((item) => (
              <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">{item.title}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-800 text-slate-400 rounded">{item.sport_type}</span>
                </div>
                <p className="text-xs text-slate-400">{item.description}</p>
                <div className="flex justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-900">
                  <span>{item.scheduled_date}</span>
                  <span className="text-blue-400 font-mono">Plan TSS: {item.planned_tss}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}