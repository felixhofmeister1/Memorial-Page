/* eslint-disable @next/next/no-img-element -- images are resized when uploaded; no runtime optimisation needed */
import { getLocale } from 'next-intl/server';
import { formatDate } from '@/lib/dates';
import { publicImageUrl } from '@/lib/media';
import type { PublicTribute } from '@/lib/data/public';

export async function TributeList({ tributes, emptyText }: { tributes: PublicTribute[]; emptyText: string }) {
  const locale = await getLocale();
  if (tributes.length === 0) return <p className="text-muted">{emptyText}</p>;

  return (
    <ol className="divide-y divide-line">
      {tributes.map((tribute) => {
        const photo = publicImageUrl(tribute.photo_url);
        return (
          <li key={tribute.id} className="py-6 first:pt-0">
            <article>
              <p className="whitespace-pre-line">{tribute.message}</p>
              {photo && <img src={photo} alt="" className="mt-3 max-h-96 w-auto" loading="lazy" />}
              <footer className="mt-3 text-small">
                <span className="font-semibold">{tribute.author_name}</span>
                {tribute.author_relation && <span className="text-muted">, {tribute.author_relation}</span>}
                <span className="text-muted">
                  {' · '}
                  <time dateTime={tribute.created_at}>{formatDate(tribute.created_at, locale)}</time>
                </span>
              </footer>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
