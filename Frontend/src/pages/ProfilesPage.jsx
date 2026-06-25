import { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Save, Trash2, UserRoundCog } from 'lucide-react';
import { toast } from 'sonner';
import {
  createProfile,
  deleteProfile,
  listProfiles,
  updateProfile
} from '../api/videoApi.js';

const initialProfileForm = {
  name: 'Developer Explainer',
  language: 'Hinglish',
  duration: 60,
  targetAudience: 'beginner developers',
  style: 'educational',
  avatarId: 'default-avatar',
  voiceId: '',
  toneNotes: 'Simple, practical, and developer-friendly.',
  commonPhrases: '',
  teachingStyle: 'Explain with examples and avoid unnecessary theory.',
  hookStyle: 'Start with a practical problem developers recognize.'
};

const inputClass =
  'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/10';

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-teal hover:text-teal disabled:cursor-not-allowed disabled:opacity-60';

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60';

const buildPayload = (form) => ({
  name: form.name,
  language: form.language,
  targetAudience: form.targetAudience,
  style: form.style,
  duration: Number(form.duration) || 60,
  avatarId: form.avatarId,
  voiceId: form.voiceId,
  toneNotes: form.toneNotes,
  commonPhrases: form.commonPhrases,
  teachingStyle: form.teachingStyle,
  hookStyle: form.hookStyle
});

const ProfilesPage = () => {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [form, setForm] = useState(initialProfileForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId),
    [profiles, selectedProfileId]
  );

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      setProfiles(await listProfiles());
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const applyProfile = (profileId) => {
    setSelectedProfileId(profileId);
    const profile = profiles.find((item) => item.id === profileId);

    if (!profile) {
      setForm(initialProfileForm);
      return;
    }

    setForm({
      name: profile.name || '',
      language: profile.language || 'English',
      duration: profile.duration || 60,
      targetAudience: profile.targetAudience || '',
      style: profile.style || 'educational',
      avatarId: profile.avatarId || '',
      voiceId: profile.voiceId || '',
      toneNotes: profile.toneNotes || '',
      commonPhrases: profile.commonPhrases || '',
      teachingStyle: profile.teachingStyle || '',
      hookStyle: profile.hookStyle || ''
    });
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Profile name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const profile = await createProfile(buildPayload(form));
      setProfiles((current) => [profile, ...current]);
      setSelectedProfileId(profile.id);
      toast.success('Creator profile created.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedProfile) {
      toast.error('Select a profile first.');
      return;
    }

    setIsSaving(true);
    try {
      const profile = await updateProfile(selectedProfile.id, buildPayload(form));
      setProfiles((current) => current.map((item) => (item.id === profile.id ? profile : item)));
      toast.success('Creator profile updated.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProfile) {
      toast.error('Select a profile first.');
      return;
    }

    setIsSaving(true);
    try {
      await deleteProfile(selectedProfile.id);
      setProfiles((current) => current.filter((item) => item.id !== selectedProfile.id));
      setSelectedProfileId('');
      setForm(initialProfileForm);
      toast.success('Creator profile deleted.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <h1 className="text-lg font-semibold text-ink">Creator Profiles</h1>
            <p className="mt-1 text-sm text-steel">
              Select a saved profile or start a new one. Editing happens in the form below.
            </p>
          </div>

          <label className="grid min-w-72 flex-1 gap-1.5">
            <span className="text-sm font-semibold text-ink">Saved Profile</span>
            <select
              className={inputClass}
              value={selectedProfileId}
              onChange={(event) => applyProfile(event.target.value)}
            >
              <option value="">Create new profile</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} · {profile.language} · {profile.style} · {profile.duration}s
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={fetchProfiles}
            disabled={isLoading}
            className={secondaryButtonClass}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedProfileId('');
              setForm(initialProfileForm);
            }}
            className={secondaryButtonClass}
          >
            New Blank
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <UserRoundCog className="h-5 w-5 text-teal" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-ink">
                {selectedProfile ? 'Edit Profile' : 'Create Profile'}
              </h2>
            </div>
            <p className="mt-1 text-sm text-steel">
              These values become reusable defaults on the Create Video page.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-ink">Profile Name</span>
              <input className={inputClass} value={form.name} onChange={(event) => updateField('name', event.target.value)} />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-ink">Avatar ID</span>
              <input className={inputClass} value={form.avatarId} onChange={(event) => updateField('avatarId', event.target.value)} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-ink">Language</span>
              <input className={inputClass} value={form.language} onChange={(event) => updateField('language', event.target.value)} />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-ink">Duration</span>
              <input
                className={inputClass}
                type="number"
                min="15"
                max="600"
                value={form.duration}
                onChange={(event) => updateField('duration', event.target.value)}
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-ink">Audience</span>
              <input
                className={inputClass}
                value={form.targetAudience}
                onChange={(event) => updateField('targetAudience', event.target.value)}
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-ink">Style</span>
              <select className={inputClass} value={form.style} onChange={(event) => updateField('style', event.target.value)}>
                <option value="educational">Educational</option>
                <option value="explainer">Explainer</option>
                <option value="product-demo">Product demo</option>
                <option value="training">Training</option>
                <option value="storytelling">Storytelling</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-ink">Voice ID</span>
            <input
              className={inputClass}
              value={form.voiceId}
              onChange={(event) => updateField('voiceId', event.target.value)}
              placeholder="Optional for now"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-ink">Tone Notes</span>
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={form.toneNotes}
              onChange={(event) => updateField('toneNotes', event.target.value)}
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-ink">Common Phrases</span>
            <textarea
              className={`${inputClass} min-h-16 resize-y`}
              value={form.commonPhrases}
              onChange={(event) => updateField('commonPhrases', event.target.value)}
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-ink">Teaching Style</span>
            <textarea
              className={`${inputClass} min-h-16 resize-y`}
              value={form.teachingStyle}
              onChange={(event) => updateField('teachingStyle', event.target.value)}
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-ink">Hook Style</span>
            <textarea
              className={`${inputClass} min-h-16 resize-y`}
              value={form.hookStyle}
              onChange={(event) => updateField('hookStyle', event.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={handleCreate} disabled={isSaving} className={primaryButtonClass}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Save New Profile
          </button>

          <button type="button" onClick={handleUpdate} disabled={isSaving || !selectedProfile} className={secondaryButtonClass}>
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            Update Selected
          </button>

          <button type="button" onClick={handleDelete} disabled={isSaving || !selectedProfile} className={secondaryButtonClass}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete Selected
          </button>
        </div>
      </section>
    </div>
  );
};

export default ProfilesPage;
