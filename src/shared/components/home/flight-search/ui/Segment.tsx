export default function Segment({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-4 py-3 min-h-[72px] flex flex-col justify-center ${className}`}>
      {children}
    </div>
  );
}
