/* eslint-disable @next/next/no-img-element -- images are resized when uploaded; no runtime optimisation needed */
import { getLocale } from 'next-intl/server';
import { formatDate } from '@/lib/dates';
import { publicImageUrl } from '@/lib/media';
import type { PublicTribute } from '@/lib/data/public';

/** Tributes read like short letters: the words first, signed at the end. */
export async function TributeList({ tributes, emptyText }: { tributes: PublicTribute[]; emptyText: string }) {
  const locale = await getLocale();
  if (tributes.length === 0) return <p className="italic text-muted">{emptyText}</p>;

  return (
    <ol className="divide-y divide-line border-t border-line">
      {tributes.map((tribute) => {
        const photo = publicImageUrl(tribute.photo_url);
        return (
          <li key={tribute.id} className="py-9">
            <article>
              <p className="whitespace-pre-line text-[1.1875rem] leading-[1.7]">{tribute.message}</p>
              {photo && <img src={photo} alt="" className="print mt-5 max-h-[28rem] w-auto" loading="lazy" />}
              <footer className="ui mt-5 flex flex-wrap items-baseline gap-x-2 text-[0.9375rem]">
                <span aria-hidden="true" className="text-muted">
                  —
                </span>
                <span>
                  <span className="font-semibold">{tribute.author_name}</span>
                  {tribute.author_relation && <span className="text-muted">, {tribute.author_relation}</span>}
                </span>
                <time dateTime={tribute.created_at} className="w-full pl-5 text-small text-muted sm:ml-auto sm:w-auto sm:pl-0">
                  {formatDate(tribute.created_at, locale)}
                </time>
              </footer>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
