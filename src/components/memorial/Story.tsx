/** Plain text with blank lines between paragraphs; single line breaks are kept. */
export function Story({ text, lang, className = '' }: { text: string | null; lang?: string | null; className?: string }) {
  if (!text?.trim()) return null;
  const paragraphs = text.trim().split(/\n\s*\n/);
  return (
    <div lang={lang ?? undefined} className={`prose-story ${className}`}>
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="whitespace-pre-line">
          {paragraph.trim()}
        </p>
      ))}
    </div>
  );
}
