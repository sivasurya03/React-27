import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
            <li>
              {item.to && index < items.length - 1 ? (
                <Link to={item.to} className="rounded transition hover:text-fg">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-fg">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
