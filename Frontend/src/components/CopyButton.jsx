import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const CopyButton = ({ value, label = 'Copy' }) => {
  const [copied, setCopied] = useState(false);
  const disabled = !value;

  const handleCopy = async () => {
    if (disabled) return;

    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied.`);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-steel transition hover:border-teal hover:text-teal disabled:cursor-not-allowed disabled:opacity-50"
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {label}
    </button>
  );
};

export default CopyButton;
