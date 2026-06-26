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
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-teal" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink">Script</h3>
        </div>

        {project?.scriptData ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-ink">{project.scriptData.title || project.topic}</p>
              <p className="mt-1 text-sm text-steel">{project.scriptData.hook}</p>
            </div>
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
