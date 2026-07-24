import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader, { NotificationBell } from '@/components/layout/PageHeader';
import ProfileCard from '@/components/dashboard/ProfileCard';
import MedicineCard from '@/components/dashboard/MedicineCard';
import AlertCard from '@/components/dashboard/AlertCard';
import RiskCard from '@/components/dashboard/RiskCard';
import AIHealthScoreCard from '@/components/dashboard/AIHealthScoreCard';
import AIInsightsCard from '@/components/dashboard/AIInsightsCard';
import MedicationTimeline from '@/components/dashboard/MedicationTimeline';
import FutureRiskCard from '@/components/dashboard/FutureRiskCard';
import MedicationReminderCard from '@/components/dashboard/MedicationReminderCard';
import TodaysMedicines from '@/components/dashboard/TodaysMedicines';
import AdherenceCalendar from '@/components/dashboard/AdherenceCalendar';
import { todayMedicines } from '@/data/mockData';

interface Medicine {
  _id: string;
  name: string;
  dose: string;
  frequency: string;
  time: string;
  status: 'taken' | 'pending' | 'missed';
}

interface Alert {
  _id: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
  status: string;
}

interface Risk {
  score: number;
  level: 'Low' | 'Medium' | 'High';
  adherence: number;
  recommendation: string;
}

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [risk, setRisk] = useState<Risk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setDemoDefaults = () => {
    const mockMeds = (todayMedicines || []).map(m => ({
      _id: m.id,
      name: m.name,
      dose: m.dose,
      frequency: 'Daily',
      time: m.time,
      status: m.status,
    }));
    setMedicines(mockMeds as Medicine[]);
    setRisk({
      score: 18,
      level: 'Low',
      adherence: 94,
      recommendation: 'Maintain current schedule and hydrations.',
    });
    setAlerts([
      {
        _id: 'demo_alert_1',
        type: 'HEALTH_STABLE',
        severity: 'LOW',
        message: 'Medication adherence is optimal at 94%.',
        createdAt: new Date().toISOString(),
        status: 'ACTIVE',
      },
    ]);
  };

  const fetchData = async () => {
    if (user?.isDemo) {
      setDemoDefaults();
      setLoading(false);
      return;
    }

    try {
      const [medRes, riskRes, alertsRes] = await Promise.all([
        api.get<Medicine[]>('/medicines'),
        api.get<Risk>('/risk/latest'),
        api.get<Alert[]>('/alerts'),
      ]);
      setMedicines(medRes.data || []);
      setRisk(riskRes.data || null);
      setAlerts(alertsRes.data || []);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setMedicines([]);
      setRisk(null);
      setAlerts([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="patient">
        <div className="flex h-screen items-center justify-center text-neon animate-pulse">
          Loading dashboard...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="patient">
        <div className="p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="rounded bg-neon px-4 py-2 text-sm font-medium hover:bg-neon/80"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="patient">
      <Routes>
        {/* Main patient dashboard overview */}
        <Route
          path="/"
          element={
            <>
              <PageHeader
                badge="Live monitoring active"
                title={`Good morning, ${user?.name || 'Patient'}`}
                subtitle="Here’s your health snapshot for today."
                action={<NotificationBell />}
              />

              {/* Profile */}
              <ProfileCard name={user?.name} email={user?.email} role={user?.role} />

              {/* Smart Medication Reminders & Adherence */}
              <div className="mt-6 space-y-6">
                {medicines.length > 0 && (
                  <MedicationReminderCard
                    medicineName={medicines[0].name}
                    scheduledTime={medicines[0].time}
                    priority={medicines[0].priority as any}
                  />
                )}
                <TodaysMedicines medicines={medicines as any[]} />
                <AIHealthScoreCard />
                <div className="grid gap-6 md:grid-cols-2">
                  <AIInsightsCard />
                  <FutureRiskCard />
                </div>
                <AdherenceCalendar />
                <MedicationTimeline />
              </div>

              {/* Risk */}
              {risk && <RiskCard risk={risk} />}
            </>
          }
        />

        {/* Medications view */}
        <Route
          path="/medications"
          element={
            <section className="mt-6 space-y-6">
              <PageHeader title="Medications" subtitle="Prescribed medicines schedule and log alarms." />
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Add Medicine form */}
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Add Medication Schedule</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const target = e.target as HTMLFormElement;
                      const name = (target.elements.namedItem('medName') as HTMLInputElement).value;
                      const dosage = (target.elements.namedItem('medDose') as HTMLInputElement).value;
                      const frequency = (target.elements.namedItem('medFreq') as HTMLInputElement).value;
                      const reminderTime = (target.elements.namedItem('medTime') as HTMLInputElement).value;
                      const priority = (target.elements.namedItem('priority') as HTMLSelectElement).value;

                      try {
                        await api.post('/medicines', {
                          name,
                          dosage,
                          frequency,
                          reminderTime,
                          priority,
                          startDate: new Date()
                        });
                        alert('Medication added successfully!');
                        fetchData();
                      } catch (err: any) {
                        alert(err.response?.data?.message || 'Error adding medication.');
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Medicine Name</label>
                      <input name="medName" required className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-neon focus:outline-none" placeholder="e.g. Lipitor, Metformin" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Dosage</label>
                        <input name="medDose" required className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-neon focus:outline-none" placeholder="e.g. 10mg" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Time</label>
                        <input name="medTime" required className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-neon focus:outline-none" placeholder="e.g. 08:00, 21:00" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Frequency</label>
                      <input name="medFreq" required className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-neon focus:outline-none" placeholder="e.g. Once daily, Twice daily" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Priority</label>
                      <select name="priority" required className="w-full rounded-xl border border-white/10 bg-base-900 p-3 text-sm text-white focus:border-neon focus:outline-none">
                        <option value="CRITICAL" className="bg-base-900 text-white">Critical</option>
                        <option value="HIGH" className="bg-base-900 text-white">High</option>
                        <option value="MEDIUM" className="bg-base-900 text-white">Medium</option>
                        <option value="LOW" className="bg-base-900 text-white">Low</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full rounded-xl bg-neon py-3 text-xs font-bold text-black hover:bg-neon/90 transition-all">
                      Add to Schedule
                    </button>
                  </form>
                </div>

                {/* Active Medicines List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Active Prescriptions</h3>
                  <div className="grid gap-4 sm:grid-cols-1">
                    {medicines.map((m) => (
                      <MedicineCard key={m._id} medicine={m} />
                    ))}
                    {medicines.length === 0 && (
                      <p className="text-slate-400">No active medications registered. Add one using the form.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          }
        />

        {/* Activity logs view */}
        <Route
          path="/activity"
          element={
            <section className="mt-6 space-y-6">
              <PageHeader title="Activity Logs" subtitle="View your daily adherence logs." />
              <MedicationTimeline />
              
              {/* Fallback empty view with CTA if no logs exist */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
                <p className="text-slate-400 mb-4">No health activity or medication logs recorded yet.</p>
                <a
                  href="/dashboard/patient/medications"
                  className="inline-flex items-center justify-center rounded-xl bg-neon px-5 py-2.5 text-xs font-bold text-black hover:bg-neon/90 transition-all"
                >
                  Start Your Activity (Add Medicine)
                </a>
              </div>
            </section>
          }
        />

        {/* Alerts view */}
        <Route
          path="/alerts"
          element={
            <section className="mt-6">
              <PageHeader title="Active Alerts" subtitle="Important health safety alerts and updates." />
              <div className="space-y-3">
                {alerts.map((a) => (
                  <AlertCard key={a._id} alert={a} />
                ))}
                {alerts.length === 0 && (
                  <p className="text-slate-400">No safety alerts generated. Vitals remain stable.</p>
                )}
              </div>
            </section>
          }
        />

        {/* Family Access view */}
        <Route
          path="/family"
          element={
            <section className="mt-6">
              <PageHeader title="Family Circle & Care Connections" subtitle="Connect family members to watch over you." />
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Connection Form */}
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Add Family Caregiver</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const target = e.target as HTMLFormElement;
                      const name = (target.elements.namedItem('familyName') as HTMLInputElement).value;
                      const relation = (target.elements.namedItem('relation') as HTMLInputElement).value;
                      const email = (target.elements.namedItem('familyEmail') as HTMLInputElement).value;
                      const phone = (target.elements.namedItem('familyPhone') as HTMLInputElement).value;

                      try {
                        const res = await api.put('/auth/profile/update', {
                          familyDetails: { name, relation, email, phone, connected: false }
                        });
                        alert('Caregiver info saved. They can now link to your profile using ' + email);
                        window.location.reload();
                      } catch (err: any) {
                        alert(err.response?.data?.message || 'Error updating profile');
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
                      <input name="familyName" required className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-neon focus:outline-none" placeholder="e.g. John Doe" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Relationship</label>
                      <input name="relation" required className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-neon focus:outline-none" placeholder="e.g. Spouse, Son" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                      <input name="familyEmail" type="email" required className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-neon focus:outline-none" placeholder="caregiver@email.com" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Phone Number</label>
                      <input name="familyPhone" type="tel" required className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-neon focus:outline-none" placeholder="+1234567890" />
                    </div>
                    <button type="submit" className="w-full rounded-xl bg-neon py-3 text-xs font-bold text-black hover:bg-neon/90 transition-all">
                      Connect Caregiver
                    </button>
                  </form>
                </div>

                {/* Connection Status */}
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Connected Family Vitals</h3>
                  {user?.familyDetails?.name ? (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-300">Name: <strong className="text-white">{user.familyDetails.name}</strong></p>
                      <p className="text-sm text-slate-300">Relation: <strong className="text-white">{user.familyDetails.relation}</strong></p>
                      <p className="text-sm text-slate-300">Email: <strong className="text-white">{user.familyDetails.email}</strong></p>
                      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium ${user.familyDetails.connected ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                        {user.familyDetails.connected ? 'Linked' : 'Awaiting Connection'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No caregiver connected. Fill in the details to invite.</p>
                  )}
                </div>
              </div>
            </section>
          }
        />

        {/* Doctor & Disease Setup view */}
        <Route
          path="/clinical-setup"
          element={
            <section className="mt-6">
              <PageHeader title="Doctor & Disease Setup" subtitle="Edit details and connect clinicians." />
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Disease Info and Doctor Form */}
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Clinician details</h3>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const target = e.target as HTMLFormElement;
                        const name = (target.elements.namedItem('docName') as HTMLInputElement).value;
                        const specialty = (target.elements.namedItem('docSpec') as HTMLInputElement).value;
                        const email = (target.elements.namedItem('docEmail') as HTMLInputElement).value;
                        const phone = (target.elements.namedItem('docPhone') as HTMLInputElement).value;

                        try {
                          await api.put('/auth/profile/update', {
                            doctorDetails: { name, specialty, email, phone, connected: false }
                          });
                          alert('Clinician info saved. They can now link to your profile using ' + email);
                          window.location.reload();
                        } catch (err: any) {
                          alert(err.response?.data?.message || 'Error updating profile');
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Doctor Name</label>
                        <input name="docName" required className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-neon focus:outline-none" placeholder="Dr. Smith" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Specialty</label>
                        <input name="docSpec" required className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-neon focus:outline-none" placeholder="Cardiologist" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Doctor Email</label>
                        <input name="docEmail" type="email" required className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-neon focus:outline-none" placeholder="doctor@hospital.com" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Doctor Phone</label>
                        <input name="docPhone" type="tel" required className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-neon focus:outline-none" placeholder="+1234567890" />
                      </div>
                      <button type="submit" className="w-full rounded-xl bg-neon py-3 text-xs font-bold text-black hover:bg-neon/90 transition-all">
                        Link Doctor
                      </button>
                    </form>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Disease details</h3>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const target = e.target as HTMLFormElement;
                        const condition = (target.elements.namedItem('condition') as HTMLInputElement).value;
                        const severity = (target.elements.namedItem('severity') as HTMLSelectElement).value;
                        const diagnosedYear = (target.elements.namedItem('year') as HTMLInputElement).value;

                        try {
                          await api.put('/auth/profile/update', {
                            diseaseInfo: { condition, severity, diagnosedYear }
                          });
                          alert('Disease details updated.');
                          window.location.reload();
                        } catch (err: any) {
                          alert(err.response?.data?.message || 'Error updating profile');
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Condition</label>
                        <input name="condition" required className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-neon focus:outline-none" placeholder="e.g. Hypertension, Diabetes" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Severity</label>
                        <select name="severity" required className="w-full rounded-xl border border-white/10 bg-base-900 p-3 text-sm text-white focus:border-neon focus:outline-none">
                          <option value="Mild" className="bg-base-900 text-white">Mild</option>
                          <option value="Moderate" className="bg-base-900 text-white">Moderate</option>
                          <option value="Severe" className="bg-base-900 text-white">Severe</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Diagnosed Year</label>
                        <input name="year" required className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-neon focus:outline-none" placeholder="2023" />
                      </div>
                      <button type="submit" className="w-full rounded-xl bg-neon py-3 text-xs font-bold text-black hover:bg-neon/90 transition-all">
                        Update Vitals
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </section>
          }
        />

        {/* Settings view */}
        <Route
          path="/settings"
          element={
            <section className="mt-6">
              <PageHeader title="Profile Settings" subtitle="Your core account properties." />
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm text-slate-300">Name: <strong className="text-white">{user?.name}</strong></p>
                <p className="text-sm text-slate-300 mt-2">Email: <strong className="text-white">{user?.email}</strong></p>
              </div>
            </section>
          }
        />
      </Routes>
    </DashboardLayout>
  );
}
