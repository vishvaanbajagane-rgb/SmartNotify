import type { SenderType } from "@/lib/types";

interface SenderFieldsProps {
  senderName: string;
  onSenderNameChange: (value: string) => void;
  senderType: SenderType;
  onSenderTypeChange: (value: SenderType) => void;
}

export function SenderFields({
  senderName,
  onSenderNameChange,
  senderType,
  onSenderTypeChange,
}: SenderFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="sender_name" className="mb-1.5 block text-xs text-text-muted">
          Sender name
        </label>
        <input
          id="sender_name"
          required
          value={senderName}
          onChange={(e) => onSenderNameChange(e.target.value)}
          placeholder="e.g. Unknown Sender"
          className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-notify focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="sender_type" className="mb-1.5 block text-xs text-text-muted">
          Sender type
        </label>
        <select
          id="sender_type"
          value={senderType}
          onChange={(e) => onSenderTypeChange(e.target.value as SenderType)}
          className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm text-text-primary focus:border-notify focus:outline-none"
        >
          <option value="contact">Contact</option>
          <option value="business">Business</option>
          <option value="group">Group</option>
        </select>
      </div>
    </div>
  );
}
