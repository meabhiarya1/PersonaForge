import { useState } from 'react';
import { Loader2, Play, WandSparkles } from 'lucide-react';
import { toast } from 'sonner';
import { generateVideo } from '../api/videoApi.js';

const initialForm = {
  topic: 'Explain JavaScript closures',
  notes: 'Explain in a simple way with one practical example',
  language: 'Hinglish',
  duration: 60,
  targetAudience: 'beginner developers',
  style: 'educational',
  avatarId: 'default-avatar'
};

const inputClass =
  'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/10';

const GenerationForm = ({ onCreated }) => {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.topic.trim()) {
      toast.error('Topic is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        duration: Number(form.duration) || 60
      };
      const created = await generateVideo(payload);
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
          <p className="mt-1 text-sm text-steel">Prompt, audience, style, and avatar configuration.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
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
          <span className="text-sm font-semibold text-ink">Notes</span>
          <textarea
            className={`${inputClass} min-h-24 resize-y`}
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            placeholder="Audience, examples, tone, and important points"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
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
            </select>
          </label>
        </div>

        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-ink">Avatar ID</span>
          <input
            className={inputClass}
            value={form.avatarId}
            onChange={(event) => updateField('avatarId', event.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
        Start Generation
      </button>
    </form>
  );
};

export default GenerationForm;
