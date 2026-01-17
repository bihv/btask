import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            src="/mello-icon-only.svg"
            alt="Mello Logo"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="font-semibold">Mello</span>
        </>
      ),
    },
  };
}
