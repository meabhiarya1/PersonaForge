import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Film, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { listVideoProjects } from '../api/videoApi.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDateTime } from '../utils/date.js';

const VideoLibraryPage = () => {
  const [videos, setVideos] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedVideo = useMemo(
    () => videos.find((video) => video.id === selectedId) || videos[0],
    [selectedId, videos]
  );

  const loadVideos = async () => {
    setLoading(true);
    try {
      const projects = await listVideoProjects({ status: 'completed', limit: 50 });
      setVideos(projects);
      setSelectedId((currentId) => {
        if (projects.some((project) => project.id === currentId)) return currentId;
        return projects[0]?.id || '';
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Video Library</p>
            <h1 className="mt-2 text-2xl font-semibold text-ink">Completed Videos</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Browse completed renders, open a video in a larger preview, and check when each video was created.
            </p>
          </div>
          <button
            type="button"
            onClick={loadVideos}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-teal hover:text-teal"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
            Refresh
          </button>
        </div>
      </div>

      {loading && !videos.length ? (
        <div className="rounded-lg border border-line bg-white p-6 text-center text-sm text-steel shadow-sm">
          Loading video library...
        </div>
      ) : null}

      {!loading && !videos.length ? (
        <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center shadow-sm">
          <Film className="mx-auto h-8 w-8 text-teal" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-ink">No completed videos yet</h2>
          <p className="mt-2 text-sm text-steel">
            Once a generation reaches completed status, it will appear here.
          </p>
        </div>
      ) : null}

      {selectedVideo ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">{selectedVideo.topic}</h2>
                <p className="mt-1 text-sm text-steel">Created {formatDateTime(selectedVideo.createdAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedVideo.status} />
                {selectedVideo.finalVideoUrl ? (
                  <a
                    href={selectedVideo.finalVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-teal hover:text-teal"
                  >
                    Open MP4
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>

            {selectedVideo.finalVideoUrl ? (
              <div className="overflow-hidden rounded-lg border border-line bg-black">
                <video
                  key={selectedVideo.finalVideoUrl}
                  src={selectedVideo.finalVideoUrl}
                  controls
                  preload="metadata"
                  className="aspect-video w-full"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-line bg-mist/40 px-4 py-12 text-center text-sm text-steel">
                Final MP4 URL is missing for this completed project.
              </div>
            )}
          </section>

          <aside className="rounded-lg border border-line bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-ink">Videos</h2>
              <span className="text-xs font-semibold text-steel">{videos.length} completed</span>
            </div>

            <div className="grid max-h-[680px] gap-2 overflow-auto pr-1">
              {videos.map((video) => {
                const active = video.id === selectedVideo.id;

                return (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => setSelectedId(video.id)}
                    className={`rounded-lg border p-3 text-left transition ${
                      active
                        ? 'border-teal/40 bg-teal/10 text-teal'
                        : 'border-line bg-white text-ink hover:border-teal/40'
                    }`}
                  >
                    <p className="truncate text-sm font-semibold">{video.topic}</p>
                    <p className="mt-1 text-xs text-steel">{formatDateTime(video.createdAt)}</p>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
};

export default VideoLibraryPage;
