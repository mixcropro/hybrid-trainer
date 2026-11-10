'use client';
import { useState, useEffect } from 'react';
import { Activity, Heart, Moon, Send, Calendar, History, User, MessageSquare, Flame, RefreshCw, Save } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'planner' | 'profile'>('dashboard');
  
  // Chat state (Trajno se čuva u memoriji dok prebacuješ tabove)
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Data & Sync state
  const [activities, setActivities] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [filterSport, setFilterSport] = useState<string>('all');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Profile State
  const [profile, setProfile] = useState<any>({
    age: 28,
    weight_kg: 81,
    height_cm: 179,
    ftp_watts: 250,
    lthr_bpm: 168,
    max_hr: 188,
    squat_1rm_kg: 120,
    deadlift_1rm_kg: 140,
    active_injuries: 'Nema aktivnih ozljeda.',
    target_events: 'Ironman 70.3 / Polumaraton',
  });
  const [profileSaved, setProfileSaved] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/workouts');
      const data = await res.json();
      if (data.activities) setActivities(data.activities);
      if (data.scheduled) setScheduled(data.scheduled);

      const profRes = await fetch('/api/profile');
      const profData = await profRes.json();
      if (profData.profile) setProfile(profData.profile);
    } catch (e) {
      console.error('Greška pri dohvaćanju podataka:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGarminSync = async () => {
    setSyncing(true);
    setSyncMessage('Povezujem se s Garmin Connectom...');
    try {
      const res = await fetch('/api/garmin/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage('Sinkronizacija uspješna!');
        await fetchData();
      } else {
        setSyncMessage(`Upozorenje: ${data.error || 'Provjeri Garmin ključ'}`);
      }
    } catch (err) {
      setSyncMessage('Greška pri spajanju na Garmin API.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 4000);
    }
  };

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
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Greška u komunikaciji s AI trenerom.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch (err) {
      console.error('Greška pri spremanju profila:', err);
    }
  };

  const filteredActivities = filterSport === 'all' 
    ? activities 
    : activities.filter(a => a.sport_type === filterSport || a.raw_garmin_type?.includes(filterSport));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Header s Navigacijom */}
      <header className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Hibridni AI Trener</h1>
          <p className="text-slate-400 text-xs">Garmin Connect Personal API • Analitika i Adaptivni Plan</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sinkroniziraj Garmin Gumb */}
          <button
            onClick={handleGarminSync}
            disabled={syncing}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sinkronizacija...' : 'Sinkroniziraj Garmin'}
          </button>

          {/* Navigacijski Tabovi */}
          <nav className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> AI Trener
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'history' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Povijest ({activities.length})
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'planner' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Kalendar
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'profile' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Profil
            </button>
          </nav>
        </div>
      </header>

      {syncMessage && (
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-xs">
          {syncMessage}
        </div>
      )}

      {/* ---------------- TAB 1: DASHBOARD & AI TRENER CHAT (S KONTINUITETOM MEMORIJE) ---------------- */}
      <div className={activeTab === 'dashboard' ? 'space-y-6 block' : 'hidden'}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
            <Heart className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">HRV Status</p>
              <p className="text-sm font-bold text-slate-100">Balanced (62 ms)</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
            <Moon className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Kvaliteta Sna</p>
              <p className="text-sm font-bold text-slate-100">85 / 100</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Umor (ATL 7d)</p>
              <p className="text-sm font-bold text-slate-100">45 TSS/dan</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
            <Flame className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Forma (TSB)</p>
              <p className="text-sm font-bold text-emerald-400">+7 (Optimalno)</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                <Activity className="w-8 h-8 stroke-1 text-slate-400" />
                <p className="text-xs max-w-md">
                  Postavi pitanje AI treneru. Ima potpun uvid u sve Garmin sinkronizirane aktivnosti, oporavak i tvoj profil.
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
            {loading && <div className="text-xs text-slate-400 animate-pulse p-2">Trener analizira biometriju i priprema odgovor...</div>}
          </div>

          <div className="p-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              placeholder="Unesi pitanje ili zatraži prilagodbu tjednog plana..."
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

      {/* ---------------- TAB 2: POVIJEST AKTIVNOSTI ---------------- */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <span className="text-xs font-semibold text-slate-400">Filtriraj po sportu:</span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['all', 'run', 'bike', 'swim', 'strength', 'walk'].map((sport) => (
                <button
                  key={sport}
                  onClick={() => setFilterSport(sport)}
                  className={`px-3 py-1 rounded-lg capitalize text-xs font-medium transition-colors ${
                    filterSport === sport ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {sport === 'all' ? 'Svi treninzi' : sport}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white">Zabilježene Aktivnosti</h3>
              <span className="text-xs text-slate-500">Ukupno: {filteredActivities.length}</span>
            </div>

            <div className="divide-y divide-slate-800">
              {filteredActivities.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nema zabilježenih treninga za ovaj filter. Klikni "Sinkroniziraj Garmin".
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
                        {act.distance_km && ` • Distanca: ${act.distance_km} km`}
                        {act.avg_power_watts && ` • Snaga: ${act.avg_power_watts} W`}
                        {act.avg_hr && ` • Puls: ${act.avg_hr} bpm`}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
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
          <h3 className="text-sm font-semibold text-white">Zakazani Budući Treninzi</h3>
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

      {/* ---------------- TAB 4: 360° PROFIL SPORTAŠA ---------------- */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-white">Postavke 360° Profila Sportaša</h3>
            {profileSaved && <span className="text-xs text-emerald-400 font-medium">Spremljeno u Supabase!</span>}
          </div>

          <section className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
            <h4 className="font-semibold text-white text-xs">Osnovna Biometrija</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Dob (godine)</label>
                <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={profile.age} onChange={(e) => setProfile({...profile, age: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Masa (kg)</label>
                <input type="number" step="0.1" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={profile.weight_kg} onChange={(e) => setProfile({...profile, weight_kg: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Visina (cm)</label>
                <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={profile.height_cm} onChange={(e) => setProfile({...profile, height_cm: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Ciljane utrke</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={profile.target_events} onChange={(e) => setProfile({...profile, target_events: e.target.value})} />
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
            <h4 className="font-semibold text-white text-xs">Fiziološki Pragovi (Triatlon)</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">FTP Bicikl (W)</label>
                <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={profile.ftp_watts} onChange={(e) => setProfile({...profile, ftp_watts: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">LTHR Prag Pulsa (bpm)</label>
                <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={profile.lthr_bpm} onChange={(e) => setProfile({...profile, lthr_bpm: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Max HR (bpm)</label>
                <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={profile.max_hr} onChange={(e) => setProfile({...profile, max_hr: Number(e.target.value)})} />
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
            <h4 className="font-semibold text-white text-xs">Zdravlje & Teretana</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Aktivne ozljede</label>
                <textarea rows={2} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white resize-none" value={profile.active_injuries} onChange={(e) => setProfile({...profile, active_injuries: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Čučanj 1RM (kg)</label>
                  <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={profile.squat_1rm_kg} onChange={(e) => setProfile({...profile, squat_1rm_kg: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Mrtvo Dizanje 1RM (kg)</label>
                  <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={profile.deadlift_1rm_kg} onChange={(e) => setProfile({...profile, deadlift_1rm_kg: Number(e.target.value)})} />
                </div>
              </div>
            </div>
          </section>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg font-semibold flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Spremi Ažurirani Profil
          </button>
        </form>
      )}

    </main>
  );
}