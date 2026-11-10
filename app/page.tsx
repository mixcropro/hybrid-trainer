'use client';
import { useState, useEffect } from 'react';
import { Activity, Heart, Moon, Send, Plus, CheckCircle2, Dumbbell, Bike, Flame, ShieldAlert } from 'lucide-react';

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ atl: 45, ctl: 52, tsb: 7 });

  // Forma za unos novog treninga
  const [showForm, setShowForm] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    sport_type: 'bike',
    title: '',
    duration_minutes: 60,
    distance_km: '',
    avg_power_watts: '',
    avg_hr: '',
    rpe: 7,
    notes: ''
  });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/workouts');
      const data = await res.json();
      if (data.activities) setActivities(data.activities);
      if (data.scheduled) setScheduled(data.scheduled);
    } catch (e) {
      console.error('Greška pri učitavanju podataka:', e);
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
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
        if (data.metrics) setMetrics(data.metrics);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: 'Greška pri preuzimanju odgovora.' }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Došlo je do greške u komunikaciji.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newWorkout,
          date: new Date().toISOString().split('T')[0],
          duration_minutes: Number(newWorkout.duration_minutes),
          distance_km: newWorkout.distance_km ? Number(newWorkout.distance_km) : null,
          avg_power_watts: newWorkout.avg_power_watts ? Number(newWorkout.avg_power_watts) : null,
          avg_hr: newWorkout.avg_hr ? Number(newWorkout.avg_hr) : null,
          rpe: Number(newWorkout.rpe)
        }),
      });
      if (res.ok) {
        setShowForm(false);
        fetchData();
      }
    } catch (err) {
      console.error('Greška pri spremanju:', err);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Hibridni AI Trener</h1>
          <p className="text-slate-400 text-sm">Triatlon & Snaga | Analitika Akutnog Umora i Budućeg Plana</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Logiraj Trening
        </button>
      </header>

      {/* Metrički Dashboard (Banister Model & Garmin) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center space-x-2 text-blue-400 mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Fitness (CTL)</span>
          </div>
          <p className="text-2xl font-bold">{metrics.ctl} <span className="text-xs text-slate-400 font-normal">TSS/dan</span></p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center space-x-2 text-amber-400 mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Umor (ATL 7d)</span>
          </div>
          <p className="text-2xl font-bold">{metrics.atl} <span className="text-xs text-slate-400 font-normal">TSS/dan</span></p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center space-x-2 text-emerald-400 mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Forma (TSB)</span>
          </div>
          <p className={`text-2xl font-bold ${metrics.tsb < -15 ? 'text-red-400' : 'text-emerald-400'}`}>
            {metrics.tsb > 0 ? `+${metrics.tsb}` : metrics.tsb}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center space-x-2 text-indigo-400 mb-1">
            <Moon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Kvaliteta Sna</span>
          </div>
          <p className="text-2xl font-bold">85 <span className="text-xs text-slate-400 font-normal">/100</span></p>
        </div>
      </div>

      {/* Modal za ručni unos odrađenog treninga */}
      {showForm && (
        <form onSubmit={handleAddWorkout} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
          <h3 className="text-sm font-semibold text-white">Zabilježi odrađeni trening</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Sport</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                value={newWorkout.sport_type}
                onChange={(e) => setNewWorkout({ ...newWorkout, sport_type: e.target.value })}
              >
                <option value="bike">Bicikl</option>
                <option value="run">Trčanje</option>
                <option value="swim">Plivanje</option>
                <option value="strength">Teretana / Snaga</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Naziv treninga</label>
              <input
                type="text"
                required
                placeholder="npr. VO2Max Intervali"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                value={newWorkout.title}
                onChange={(e) => setNewWorkout({ ...newWorkout, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Trajanje (min)</label>
              <input
                type="number"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                value={newWorkout.duration_minutes}
                onChange={(e) => setNewWorkout({ ...newWorkout, duration_minutes: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Subjektivni umor (RPE 1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                value={newWorkout.rpe}
                onChange={(e) => setNewWorkout({ ...newWorkout, rpe: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-slate-400">Odustani</button>
            <button type="submit" className="bg-blue-600 px-4 py-1.5 rounded text-xs text-white font-medium">Spremi u povijest</button>
          </div>
        </form>
      )}

      {/* Main Grid: Kalendar & Odrađeni Treninzi + Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lijevi stupac: Kalendar i povijest */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Planirani Treninzi
            </h3>
            <div className="space-y-2">
              {scheduled.length === 0 ? (
                <p className="text-xs text-slate-500">Nema planiranih treninga.</p>
              ) : (
                scheduled.map((item) => (
                  <div key={item.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-200">{item.title}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">{item.sport_type}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{item.description}</p>
                    <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                      <span>{item.scheduled_date}</span>
                      <span>Plan TSS: {item.planned_tss}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Odrađeno u zadnje vrijeme
            </h3>
            <div className="space-y-2">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500">Nema zabilježenih odrađenih treninga.</p>
              ) : (
                activities.slice(0, 4).map((act) => (
                  <div key={act.id} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-200">{act.title}</p>
                      <p className="text-[10px] text-slate-500">{act.date} • {act.duration_minutes} min • RPE: {act.rpe}/10</p>
                    </div>
                    <span className="font-mono text-emerald-400 text-xs">+{act.tss || 0} TSS</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Desni stupac: AI Chat Trener sa svim uvidima */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[560px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                <Bike className="w-8 h-8 stroke-1 text-slate-400" />
                <p className="text-xs max-w-sm">
                  Pitaj trenera o prilagodbi tjednog plana, odrađenim intervalima ili reci npr. <br/>
                  <span className="text-blue-400 italic">"Ne slažem se s odmorom danas, odradit ću teški čučanj."</span>
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-950 text-slate-400 border border-slate-800 p-3 rounded-2xl rounded-bl-none text-xs animate-pulse">
                  Trener izračunava akumulirani zamor i kompenzaciju opterećenja...
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Unesi pitanje ili zatraži prilagodbu plana..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}