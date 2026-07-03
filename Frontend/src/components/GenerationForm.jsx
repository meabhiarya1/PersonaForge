import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ClipboardPaste,
  FileUp,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  UserRoundCog,
  WandSparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { checkInputIntent, extractSourceMaterial, generateVideo, listProfiles } from '../api/videoApi.js';

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

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const buildGeneratePayload = (form, alignmentCheck = null, userIntent = '') => ({
  topic: form.topic,
  inputType: form.inputType,
  referenceText: form.inputType === 'reference_text' ? form.referenceText : '',
  userIntent: form.inputType === 'reference_text' ? userIntent : '',
  alignmentData: form.inputType === 'reference_text' ? alignmentCheck : null,
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
  const [isCheckingIntent, setIsCheckingIntent] = useState(false);
  const [alignmentCheck, setAlignmentCheck] = useState(null);
  const [userIntent, setUserIntent] = useState('');
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [sourceFiles, setSourceFiles] = useState([]);
  const [pastedSourceText, setPastedSourceText] = useState('');
  const [isExtractingSource, setIsExtractingSource] = useState(false);
  const [sourceExtraction, setSourceExtraction] = useState(null);

  const resetAlignment = () => {
    setAlignmentCheck(null);
    setUserIntent('');
  };

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));

    if (['topic', 'notes', 'referenceText', 'inputType'].includes(field)) {
      resetAlignment();
    }
  };

  const appendSourceFiles = (files) => {
    const nextFiles = Array.from(files || []);
    if (!nextFiles.length) return;

    setSourceFiles((current) => [...current, ...nextFiles].slice(0, 8));
    updateField('inputType', 'reference_text');
    setSourceExtraction(null);
  };

  const removeSourceFile = (indexToRemove) => {
    setSourceFiles((current) => current.filter((_, index) => index !== indexToRemove));
    setSourceExtraction(null);
  };

  const handleReferencePaste = (event) => {
    const imageFiles = Array.from(event.clipboardData?.items || [])
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter(Boolean);

    if (!imageFiles.length) return;

    event.preventDefault();
    appendSourceFiles(imageFiles);
    toast.success('Screenshot image added. Click Extract into Reference Text.');
  };

  const runSourceExtraction = async () => {
    if (!sourceFiles.length && !pastedSourceText.trim()) {
      toast.error('Upload a PDF/image, paste a screenshot, or add text first.');
      return;
    }

    setIsExtractingSource(true);
    try {
      const result = await extractSourceMaterial({
        files: sourceFiles,
        pastedText: pastedSourceText
      });

      updateField('inputType', 'reference_text');
      updateField('referenceText', result.extractedText);
      setSourceExtraction(result);
      toast.success('Source extracted into Reference Text.');

      if (result.warnings?.length) {
        toast.warning(result.warnings[0]);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsExtractingSource(false);
    }
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

  const validateRequiredInput = () => {
    if (!form.topic.trim()) {
      toast.error('Topic is required.');
      return false;
    }

    if (form.inputType === 'reference_text' && form.referenceText.trim().length < 50) {
      toast.error('Reference text should be at least 50 characters.');
      return false;
    }

    return true;
  };

  const runIntentCheck = async () => {
    if (!validateRequiredInput()) return;

    setIsCheckingIntent(true);
    try {
      const result = await checkInputIntent(buildGeneratePayload(form, null, userIntent));
      setAlignmentCheck(result);
      toast.success('Input intent checked.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsCheckingIntent(false);
    }
  };

  const canConfirmAlignment =
    form.inputType !== 'reference_text' ||
    ['continue', 'warn_continue'].includes(alignmentCheck?.recommendation);

  const submitGeneration = async () => {
    if (!validateRequiredInput()) return;

    if (form.inputType === 'reference_text' && !canConfirmAlignment) {
      await runIntentCheck();
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await generateVideo(buildGeneratePayload(form, alignmentCheck, userIntent));
      toast.success('Video generation job created.');
      onCreated(created);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.inputType === 'reference_text' && !alignmentCheck) {
      await runIntentCheck();
      return;
    }

    await submitGeneration();
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
                title: 'Reference / Upload',
                description: 'Analyze pasted text, PDF, or screenshots first.'
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
          <>
            <section className="rounded-lg border border-line bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileUp className="h-4 w-4 text-teal" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-ink">Source Extraction</h3>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-steel">
                    Upload selectable-text PDFs or JPG/PNG/WebP screenshots. You can also paste a screenshot directly into the Reference Text box.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={runSourceExtraction}
                  disabled={isExtractingSource}
                  className={secondaryButtonClass}
                >
                  {isExtractingSource ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Extract into Reference Text
                </button>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-steel">Upload sources</span>
                  <input
                    className={inputClass}
                    type="file"
                    multiple
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      appendSourceFiles(event.target.files);
                      event.target.value = '';
                    }}
                  />
                  <span className="text-xs text-steel">Up to 8 files. PDF, JPG, PNG, and WebP are supported.</span>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-steel">Optional pasted source text</span>
                  <textarea
                    className={`${inputClass} min-h-24 resize-y`}
                    value={pastedSourceText}
                    onChange={(event) => {
                      setPastedSourceText(event.target.value);
                      setSourceExtraction(null);
                    }}
                    placeholder="Paste raw text here if you want it merged with uploaded PDFs/images."
                  />
                </label>
              </div>

              {sourceFiles.length ? (
                <div className="mt-3 grid gap-2">
                  {sourceFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs text-steel"
                    >
                      <span className="font-semibold text-ink">{file.name}</span>
                      <div className="flex items-center gap-3">
                        <span>{file.type || 'unknown'} · {formatBytes(file.size)}</span>
                        <button
                          type="button"
                          onClick={() => removeSourceFile(index)}
                          className="font-semibold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {sourceExtraction ? (
                <div className="mt-3 rounded-lg border border-teal/20 bg-teal/5 p-3 text-xs leading-5 text-steel">
                  <p className="font-semibold text-ink">
                    Extracted {sourceExtraction.characterCount} characters from {sourceExtraction.sourceCount} source(s).
                  </p>
                  {sourceExtraction.sources?.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {sourceExtraction.sources.map((source) => (
                        <li key={`${source.type}-${source.label}`}>
                          {source.label} · {source.type} · {source.characterCount} characters
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {sourceExtraction.warnings?.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-700">
                      {sourceExtraction.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </section>

            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-ink">Reference Text</span>
              <textarea
                className={`${inputClass} min-h-48 resize-y`}
                value={form.referenceText}
                onChange={(event) => updateField('referenceText', event.target.value)}
                onPaste={handleReferencePaste}
                placeholder="Paste source text here, or paste a screenshot image directly into this box. PersonaForge will summarize it, extract key points, and use it to write the script."
              />
              <span className="text-xs text-steel">
                {form.referenceText.trim().length} / 20000 characters
              </span>
            </label>

            <section className="rounded-lg border border-line bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-teal" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-ink">Input Intent & Alignment Guard</h3>
                  </div>
                  <p className="mt-1 text-xs text-steel">
                    Check whether your topic, notes, and reference text should be used together before spending generation credits.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={runIntentCheck}
                  disabled={isCheckingIntent}
                  className={secondaryButtonClass}
                >
                  {isCheckingIntent ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {alignmentCheck ? 'Re-check Score' : 'Check Intent'}
                </button>
              </div>

              {alignmentCheck ? (
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-line bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-steel">Score</p>
                      <p className="mt-1 text-2xl font-semibold text-ink">
                        {Math.round((alignmentCheck.alignmentScore || 0) * 100)}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-line bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-steel">Risk</p>
                      <p className="mt-1 text-sm font-semibold capitalize text-ink">{alignmentCheck.risk}</p>
                    </div>
                    <div className="rounded-lg border border-line bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-steel">Recommendation</p>
                      <p className="mt-1 text-sm font-semibold text-ink">{alignmentCheck.recommendation}</p>
                    </div>
                  </div>

                  {alignmentCheck.relationship ? (
                    <p className="rounded-lg border border-line bg-white px-3 py-2 text-sm leading-6 text-steel">
                      {alignmentCheck.relationship}
                    </p>
                  ) : null}

                  {alignmentCheck.recommendation === 'ask_user' ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      <div className="flex gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{alignmentCheck.question}</span>
                      </div>
                    </div>
                  ) : null}

                  {alignmentCheck.suggestedReplies?.length ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {alignmentCheck.suggestedReplies.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => setUserIntent(reply)}
                          className="rounded-lg border border-line bg-white px-3 py-2 text-left text-xs font-semibold text-ink transition hover:border-teal hover:text-teal"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-ink">Your clarification / exact intent</span>
                    <textarea
                      className={`${inputClass} min-h-20 resize-y`}
                      value={userIntent}
                      onChange={(event) => setUserIntent(event.target.value)}
                      placeholder="Example: Explain both closures and hoisting together, but use hoisting only as background context."
                    />
                  </label>

                  <p className="text-xs text-steel">
                    If you edit or choose a clarification, click Re-check Score. When the recommendation becomes continue or warn_continue, generation can proceed.
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-xs text-steel">
                  First click Check Intent. If PersonaForge detects a mismatch, you can choose a suggested reply or type your exact intent.
                </p>
              )}
            </section>
          </>
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
        disabled={isSubmitting || isCheckingIntent}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting || isCheckingIntent ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
        {form.inputType === 'reference_text' && !alignmentCheck
          ? 'Check Intent First'
          : form.inputType === 'reference_text' && !canConfirmAlignment
            ? 'Clarify and Re-check Before Generation'
            : 'Start Generation'}
      </button>
    </form>
  );
};

export default GenerationForm;
