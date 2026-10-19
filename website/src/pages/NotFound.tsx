import { useI18n } from '../i18n';
import { href } from '../lib/router';

export function NotFound() {
  const { t } = useI18n();
  return (
    <div class="not-found">
      <h1 tabIndex={-1}>{t.person.notFound}</h1>
      <p class="lede">{t.person.notFoundText}</p>
      <p>
        <a href={href('/')}>{t.person.backToEveryone}</a>
      </p>
    </div>
  );
}
