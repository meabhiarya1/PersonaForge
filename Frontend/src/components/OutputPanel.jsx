import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Film, Loader2, Music, Subtitles } from 'lucide-react';
import CopyButton from './CopyButton.jsx';
import StatusBadge from './StatusBadge.jsx';
import { formatDateTime } from '../utils/date.js';

const AssetLink = ({ label, href, icon: Icon }) => {
  const disabled = !href;

  return (
    <a
      href={href || undefined}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm transition ${
        disabled
          ? 'pointer-events-none border-line bg-mist/50 text-slate-400'
          : 'border-line bg-white text-ink hover:border-teal hover:text-teal'
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
    </a>
  );
};

const formatJsonForCopy = (value) => {
  if (!value) return '';
  return JSON.stringify(value, null, 2);
};

const SectionCard = ({ title, children }) => (
  <div className="rounded-lg bg-white p-3 ring-1 ring-line">
    <p className="text-xs font-semibold uppercase tracking-wide text-steel">{title}</p>
    <div className="mt-2">{children}</div>
  </div>
);

const OutputPanel = ({ project, jobId }) => {
  const [videoState, setVideoState] = useState('idle');

  useEffect(() => {
    if (project?.finalVideoUrl) {
      setVideoState('loading');
    } else {
      setVideoState('idle');
    }
  }, [project?.finalVideoUrl]);

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Project Output</h2>
          <p className="mt-1 text-sm text-steel">Generated script, media links, and render result.</p>
          {project?.createdAt ? (
            <p className="mt-1 text-xs font-medium text-steel">Created {formatDateTime(project.createdAt)}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={project?.id} label="Copy Project ID" />
          <CopyButton value={jobId} label="Copy Job ID" />
          {project?.status ? <StatusBadge status={project.status} /> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <AssetLink label="Generated audio file" href={project?.audioUrl} icon={Music} />
        <AssetLink label="Generated avatar video" href={project?.avatarVideoUrl} icon={Film} />
        <AssetLink label="Generated captions file" href={project?.captionUrl} icon={Subtitles} />
        <AssetLink label="Final rendered MP4" href={project?.finalVideoUrl} icon={ExternalLink} />
      </div>

      <div className="mt-5 rounded-lg border border-line bg-slate-50/70 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-ink">Content Analysis</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton value={formatJsonForCopy(project?.analysisData)} label="Copy Analysis" />
            {project?.inputType ? (
              <span className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-steel">
                {project.inputType === 'reference_text' ? 'Reference text' : 'Simple prompt'}
              </span>
            ) : null}
          </div>
        </div>

        {project?.inputType === 'reference_text' ? (
          <div className="mb-3 rounded-lg border border-line bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-steel">Source Snapshot</p>
              <CopyButton value={project?.referenceText} label="Copy Source" />
            </div>
            <p className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap text-xs leading-5 text-steel">
              {project?.referenceText || 'Reference text is not available.'}
            </p>
          </div>
        ) : null}

        {project?.analysisData ? (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <SectionCard title="Summary">
              <p className="text-sm leading-6 text-ink">{project.analysisData.summary || 'No summary returned.'}</p>
            </SectionCard>

            <SectionCard title="Key Points">
              {(project.analysisData.keyPoints || []).length ? (
                <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-ink">
                {(project.analysisData.keyPoints || []).map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              ) : (
                <p className="text-sm text-steel">No key points returned.</p>
              )}
            </SectionCard>

            <SectionCard title="Scene Ideas">
              {(project.analysisData.sceneIdeas || []).length ? (
                <ol className="space-y-2 text-sm leading-6 text-ink">
                  {project.analysisData.sceneIdeas.map((scene, index) => (
                    <li key={`${scene.scene || index}-${scene.message || scene.purpose}`}>
                      <span className="font-semibold">
                        {scene.scene ? `Scene ${scene.scene}` : `Scene ${index + 1}`}
                        {scene.purpose ? ` · ${scene.purpose}` : ''}
                      </span>
                      {scene.message ? <p className="text-steel">{scene.message}</p> : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-steel">No scene ideas returned.</p>
              )}
            </SectionCard>

            <SectionCard title="Missing Context">
              {(project.analysisData.missingContext || []).length ? (
                <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-ink">
                  {project.analysisData.missingContext.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-steel">No major missing context detected.</p>
              )}
            </SectionCard>

            {(project.analysisData.contentWarnings || []).length ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Content Warnings</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-800">
                  {project.analysisData.contentWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {project.analysisData.suggestedAngle ? (
              <SectionCard title="Suggested Angle">
                <p className="text-sm leading-6 text-ink">{project.analysisData.suggestedAngle}</p>
              </SectionCard>
            ) : null}

            {project.analysisData.mainIdea ? (
              <SectionCard title="Main Idea">
                <p className="text-sm leading-6 text-ink">{project.analysisData.mainIdea}</p>
              </SectionCard>
            ) : null}
          </div>
        ) : project?.inputType === 'reference_text' ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Reference Text mode was selected, but analysis is not available yet. It should appear after script generation starts.
          </div>
        ) : (
          <p className="text-sm text-steel">
            Analysis appears here when the video is created with Reference Text mode.
          </p>
        )}
      </div>

      {project?.alignmentData ? (
        <div className="mt-5 rounded-lg border border-line bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-ink">Input Alignment</h3>
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton value={formatJsonForCopy(project.alignmentData)} label="Copy Alignment" />
              <span className="rounded-full border border-line bg-mist px-2.5 py-1 text-xs font-semibold text-steel">
                {Math.round((project.alignmentData.alignmentScore || 0) * 100)}% · {project.alignmentData.risk}
              </span>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <SectionCard title="Intent">
              <p className="text-sm font-semibold text-ink">{project.alignmentData.intent || 'Unknown'}</p>
            </SectionCard>
            <SectionCard title="Recommendation">
              <p className="text-sm font-semibold text-ink">{project.alignmentData.recommendation || 'Unknown'}</p>
            </SectionCard>
            <SectionCard title="Topics Detected">
              {(project.alignmentData.topicsDetected || []).length ? (
                <p className="text-sm text-ink">{project.alignmentData.topicsDetected.join(', ')}</p>
              ) : (
                <p className="text-sm text-steel">No topics listed.</p>
              )}
            </SectionCard>
          </div>
          <p className="mt-3 text-sm leading-6 text-steel">{project.alignmentData.relationship}</p>
          {project.userIntent ? (
            <p className="mt-3 rounded-lg border border-line bg-mist/50 px-3 py-2 text-sm text-ink">
              <span className="font-semibold">Confirmed intent:</span> {project.userIntent}
            </p>
          ) : null}
        </div>
      ) : null}

      {project?.finalVideoUrl ? (
        <div className="mt-5 overflow-hidden rounded-lg border border-line bg-black">
          <div className="relative aspect-video">
            {videoState === 'loading' ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 text-white">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Loading final video...
                </div>
              </div>
            ) : null}

            {videoState === 'error' ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/85 px-6 text-center text-white">
                <div>
                  <p className="text-sm font-semibold">Video preview could not load.</p>
                  <a
                    href={project.finalVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-ink"
                  >
                    Open MP4 directly
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            ) : null}

            <video
              key={project.finalVideoUrl}
              src={project.finalVideoUrl}
              controls
              preload="metadata"
              className="h-full w-full"
              onLoadedData={() => setVideoState('ready')}
              onCanPlay={() => setVideoState('ready')}
              onError={() => setVideoState('error')}
            />
          </div>
        </div>
      ) : project?.status === 'completed' ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This project is completed, but the final video URL is missing. Check the worker logs or render step output.
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-line bg-mist/40 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-ink">No final video yet</p>
          <p className="mt-1 text-sm text-steel">
            The preview will appear here after rendering completes.
          </p>
        </div>
      )}

      <div className="mt-5 rounded-lg border border-line bg-mist/40 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-ink">Script</h3>
          </div>
          <CopyButton value={project?.scriptData?.script} label="Copy Script" />
        </div>

        {project?.scriptData ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-ink">{project.scriptData.title || project.topic}</p>
              <p className="mt-1 text-sm text-steel">{project.scriptData.hook}</p>
            </div>
            {project.scriptData.durationMeta ? (
              <div className="grid gap-2 rounded-lg border border-line bg-white p-3 text-xs text-steel sm:grid-cols-3">
                <span>
                  Target: <strong className="text-ink">{project.scriptData.durationMeta.requestedDuration}s</strong>
                </span>
                <span>
                  Words: <strong className="text-ink">{project.scriptData.durationMeta.actualWords}</strong>
                </span>
                <span>
                  Estimate: <strong className="text-ink">{project.scriptData.durationMeta.estimatedDuration}s</strong>
                </span>
              </div>
            ) : null}
            {project.scriptData.qualityMeta ? (
              <div className="rounded-lg border border-line bg-white p-3">
                <div className="grid gap-2 text-xs text-steel sm:grid-cols-2 lg:grid-cols-4">
                  <span>
                    Scenes:{' '}
                    <strong className="text-ink">
                      {project.scriptData.qualityMeta.sceneCount}/{project.scriptData.qualityMeta.targetSceneCount}
                    </strong>
                  </span>
                  <span>
                    Language: <strong className="text-ink">{project.scriptData.qualityMeta.language}</strong>
                  </span>
                  <span>
                    Style: <strong className="text-ink">{project.scriptData.qualityMeta.style}</strong>
                  </span>
                  <span>
                    Audience: <strong className="text-ink">{project.scriptData.qualityMeta.targetAudience}</strong>
                  </span>
                </div>
                {project.scriptData.qualityMeta.structure ? (
                  <p className="mt-2 text-xs leading-5 text-steel">
                    Structure: <strong className="text-ink">{project.scriptData.qualityMeta.structure}</strong>
                  </p>
                ) : null}
              </div>
            ) : null}
            {(project.scriptData.scenes || []).length ? (
              <div className="rounded-lg border border-line bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-steel">Generated Scene Plan</p>
                <ol className="mt-2 space-y-2 text-sm leading-6 text-ink">
                  {project.scriptData.scenes.map((scene) => (
                    <li key={`${scene.sceneNumber}-${scene.purpose}-${scene.text}`}>
                      <span className="font-semibold">
                        Scene {scene.sceneNumber}
                        {scene.purpose ? ` · ${scene.purpose}` : ''}
                      </span>
                      <p className="text-steel">{scene.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            <p className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-sm leading-6 text-steel ring-1 ring-line">
              {project.scriptData.script}
            </p>
          </div>
        ) : (
          <p className="text-sm text-steel">Script output will appear after the script generation step.</p>
        )}

      </div>

      {project?.errorMessage ? (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Generation failed</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-700">{project.errorMessage}</p>
          <p className="mt-3 text-xs text-red-700/80">
            Retry from the UI will be added as a controlled backend action, so failed projects do not accidentally reuse stale temp files.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default OutputPanel;
