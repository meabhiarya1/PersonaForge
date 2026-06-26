import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Play, RefreshCw, UserRoundCog, WandSparkles } from 'lucide-react';
import { toast } from 'sonner';
import { generateVideo, listProfiles } from '../api/videoApi.js';

const initialForm = {
  inputType: 'simple_prompt',
  topic: 'Explain JavaScript closures',
  notes: 'Explain in a simple way with one practical example',
  referenceText: '',
  language: 'Hinglish',
  duration: 60,
  targetAudience: 'beginner developers',
  style: 'educational',
  avatarId: 'default-avatar',
  toneNotes: '',
  commonPhrases: '',
  teachingStyle: '',
  hookStyle: ''
};

const inputClass =
  'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/10';

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-teal hover:text-teal disabled:cursor-not-allowed disabled:opacity-60';

const buildGeneratePayload = (form) => ({
  topic: form.topic,
  inputType: form.inputType,
  referenceText: form.inputType === 'reference_text' ? form.referenceText : '',
  notes: [
    form.notes,
    form.toneNotes ? `Tone preference: ${form.toneNotes}` : '',
    form.commonPhrases ? `Common phrases to reuse naturally: ${form.commonPhrases}` : '',
    form.teachingStyle ? `Teaching style: ${form.teachingStyle}` : '',
    form.hookStyle ? `Hook style: ${form.hookStyle}` : ''
  ]
    .filter(Boolean)
    .join('\n\n'),
  language: form.language,
  duration: Number(form.duration) || 60,
  targetAudience: form.targetAudience,
  style: form.style,
  avatarId: form.avatarId
});

const applyProfileToForm = (profile, currentForm) => ({
  ...currentForm,
  language: profile.language || currentForm.language,
  duration: profile.duration || currentForm.duration,
  targetAudience: profile.targetAudience || currentForm.targetAudience,
  style: profile.style || currentForm.style,
  avatarId: profile.avatarId || currentForm.avatarId,
  toneNotes: profile.toneNotes || '',
  commonPhrases: profile.commonPhrases || '',
  teachingStyle: profile.teachingStyle || '',
  hookStyle: profile.hookStyle || ''
});

const GenerationForm = ({ onCreated }) => {
  const [form, setForm] = useState(initialForm);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const fetchProfiles = async () => {
    setIsLoadingProfiles(true);
    try {
      setProfiles(await listProfiles());
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleProfileSelect = (profileId) => {
    setSelectedProfileId(profileId);
    const profile = profiles.find((item) => item.id === profileId);

    if (!profile) return;

    setForm((current) => applyProfileToForm(profile, current));
    toast.success(`Applied profile: ${profile.name}`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.topic.trim()) {
      toast.error('Topic is required.');
      return;
    }

    if (form.inputType === 'reference_text' && form.referenceText.trim().length < 50) {
      toast.error('Reference text should be at least 50 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await generateVideo(buildGeneratePayload(form));
      toast.success('Video generation job created.');
      onCreated(created);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <WandSparkles className="h-5 w-5 text-teal" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-ink">Create Video</h2>
          </div>
          <p className="mt-1 text-sm text-steel">
            Generate from a prompt, or let PersonaForge analyze pasted reference content first.
          </p>
        </div>
      </div>

      <section className="mt-5 rounded-lg border border-line bg-slate-50/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink">Apply Creator Profile</h3>
            <p className="text-xs text-steel">Manage profiles on the Profiles page.</p>
          </div>
          <Link to="/profiles" className={secondaryButtonClass}>
            <UserRoundCog className="h-3.5 w-3.5" aria-hidden="true" />
            Manage
          </Link>
        </div>

        <div className="mt-3 grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-steel">Saved profile</span>
            <select
              className={inputClass}
              value={selectedProfileId}
              onChange={(event) => handleProfileSelect(event.target.value)}
            >
              <option value="">Use manual settings</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={fetchProfiles}
            disabled={isLoadingProfiles}
            className={secondaryButtonClass}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingProfiles ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh Profiles
          </button>
        </div>
      </section>

      <div className="mt-5 grid gap-4">
        <section className="rounded-lg border border-line bg-slate-50/70 p-3">
          <h3 className="text-sm font-semibold text-ink">Input Mode</h3>
          <p className="mt-1 text-xs text-steel">
            Phase 3.1 adds a content analysis step before script generation when reference text is selected.
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {[
              {
                value: 'simple_prompt',
                title: 'Simple Prompt',
                description: 'Use topic and notes directly.'
              },
              {
                value: 'reference_text',
                title: 'Reference Text',
                description: 'Analyze pasted article/notes first.'
              }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField('inputType', option.value)}
                className={`rounded-lg border p-3 text-left transition ${
                  form.inputType === option.value
                    ? 'border-teal/40 bg-teal/10 text-teal'
                    : 'border-line bg-white text-ink hover:border-teal/40'
                }`}
              >
                <span className="block text-sm font-semibold">{option.title}</span>
                <span className="mt-1 block text-xs text-steel">{option.description}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-ink">Topic</span>
            <input
              className={inputClass}
              value={form.topic}
              onChange={(event) => updateField('topic', event.target.value)}
              placeholder="Explain JavaScript closures"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-ink">Avatar ID</span>
            <input
              className={inputClass}
              value={form.avatarId}
              onChange={(event) => updateField('avatarId', event.target.value)}
            />
          </label>
        </div>

        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-ink">Notes</span>
          <textarea
            className={`${inputClass} min-h-24 resize-y`}
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            placeholder="Audience, examples, tone, and important points"
          />
        </label>

        {form.inputType === 'reference_text' ? (
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-ink">Reference Text / Article Paste</span>
            <textarea
              className={`${inputClass} min-h-48 resize-y`}
              value={form.referenceText}
              onChange={(event) => updateField('referenceText', event.target.value)}
              placeholder="Paste article content, long notes, documentation, or reference material. PersonaForge will summarize it, extract key points, and use it to write the script."
            />
            <span className="text-xs text-steel">
              {form.referenceText.trim().length} / 20000 characters
            </span>
          </label>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-ink">Language</span>
            <input
              className={inputClass}
              value={form.language}
              onChange={(event) => updateField('language', event.target.value)}
            />
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
            <select
              className={inputClass}
              value={form.style}
              onChange={(event) => updateField('style', event.target.value)}
            >
              <option value="educational">Educational</option>
              <option value="explainer">Explainer</option>
              <option value="product-demo">Product demo</option>
              <option value="training">Training</option>
              <option value="storytelling">Storytelling</option>
            </select>
          </label>
        </div>

        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-ink">Tone Notes</span>
          <textarea
            className={`${inputClass} min-h-20 resize-y`}
            value={form.toneNotes}
            onChange={(event) => updateField('toneNotes', event.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
        Start Generation
      </button>
    </form>
  );
};

export default GenerationForm;
