export const terminalStatuses = new Set(['completed', 'failed']);

export const statusLabels = {
  queued: 'Queued',
  processing: 'Processing',
  script_generated: 'Script ready',
  voice_generated: 'Voice ready',
  awaiting_avatar: 'Avatar processing',
  avatar_generated: 'Avatar ready',
  caption_generated: 'Captions ready',
  rendering: 'Rendering',
  completed: 'Completed',
  failed: 'Failed'
};

export const statusTone = {
  queued: 'bg-slate-100 text-slate-700 border-slate-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  script_generated: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  voice_generated: 'bg-teal-50 text-teal-700 border-teal-200',
  awaiting_avatar: 'bg-violet-50 text-violet-700 border-violet-200',
  avatar_generated: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  caption_generated: 'bg-amber-50 text-amber-700 border-amber-200',
  rendering: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-700 border-red-200'
};

export const pipelineSteps = [
  'queued',
  'processing',
  'script_generated',
  'voice_generated',
  'awaiting_avatar',
  'avatar_generated',
  'caption_generated',
  'rendering',
  'completed'
];
