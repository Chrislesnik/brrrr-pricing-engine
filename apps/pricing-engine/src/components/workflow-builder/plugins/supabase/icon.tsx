export function SupabaseIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-label="Supabase logo"
      className={className}
      viewBox="0 0 109 113"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Supabase</title>
      <defs>
        <linearGradient id="supabase-grad-a" x1="53.974" x2="94.163" y1="54.974" y2="71.829" gradientUnits="userSpaceOnUse">
          <stop stopColor="#249361" />
          <stop offset="1" stopColor="#3ECF8E" />
        </linearGradient>
        <linearGradient id="supabase-grad-b" x1="36.156" x2="54.484" y1="30.578" y2="65.081" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3ECF8E" />
          <stop offset="1" stopColor="#249361" />
        </linearGradient>
      </defs>
      <path
        fill="url(#supabase-grad-a)"
        d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
      />
      <path
        fill="url(#supabase-grad-b)"
        d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
      />
    </svg>
  );
}
