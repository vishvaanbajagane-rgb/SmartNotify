import type { Message } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = { text: "Text", image: "Image", voice: "Voice" };

export function MessagePreviewTable({ messages }: { messages: Message[] }) {
  if (messages.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-text-muted">
            <th className="px-4 py-3 font-medium">Sender</th>
            <th className="px-4 py-3 font-medium">Content</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Forwards</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((m) => (
            <tr key={m.id} className="border-b border-border last:border-0">
              <td className="max-w-[140px] truncate px-4 py-3 text-text-primary">
                {m.sender_name}
              </td>
              <td className="max-w-[360px] truncate px-4 py-3 text-text-muted">{m.content}</td>
              <td className="px-4 py-3 text-text-muted">{TYPE_LABEL[m.message_type]}</td>
              <td className="px-4 py-3 font-mono text-xs text-text-muted">{m.forward_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
