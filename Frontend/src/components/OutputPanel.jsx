import { ExternalLink, FileText, Film, Music, Subtitles } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';

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

const OutputPanel = ({ project }) => {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Project Output</h2>
          <p className="mt-1 text-sm text-steel">Generated script, media links, and render result.</p>
        </div>
        {project?.status ? <StatusBadge status={project.status} /> : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <AssetLink label="Audio file" href={project?.audioUrl} icon={Music} />
        <AssetLink label="Avatar video" href={project?.avatarVideoUrl} icon={Film} />
        <AssetLink label="Captions file" href={project?.captionUrl} icon={Subtitles} />
        <AssetLink label="Final MP4" href={project?.finalVideoUrl} icon={ExternalLink} />
      </div>

      {project?.finalVideoUrl ? (
        <div className="mt-5 overflow-hidden rounded-lg border border-line bg-black">
          <video src={project.finalVideoUrl} controls className="aspect-video w-full" />
        </div>
      ) : null}

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

        {project?.errorMessage ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {project.errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default OutputPanel;
