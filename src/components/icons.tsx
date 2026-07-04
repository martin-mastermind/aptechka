import type { SVGProps } from 'react';

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const IconSearch = () => (
  <Svg>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.8-3.8" />
  </Svg>
);

export const IconGear = () => (
  <Svg>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08A1.7 1.7 0 0 0 10.12 3V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51.88Z" />
  </Svg>
);

export const IconBack = () => (
  <Svg>
    <path d="M15 18l-6-6 6-6" />
  </Svg>
);

export const IconPlus = () => (
  <Svg width="26" height="26">
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconCamera = () => (
  <Svg width="26" height="26">
    <path d="M4 8h2.5l1.5-2.5h8L17.5 8H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="3.4" />
  </Svg>
);

export const IconTrash = () => (
  <Svg>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 12a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-12" />
  </Svg>
);

export const IconPencil = () => (
  <Svg>
    <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3ZM14.5 7.5l3 3" />
  </Svg>
);

export const IconSparkle = () => (
  <Svg fill="currentColor" stroke="none">
    <path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9L12 3Z" />
    <path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6L15.5 18.5l2.6-.9L19 15Z" />
  </Svg>
);
