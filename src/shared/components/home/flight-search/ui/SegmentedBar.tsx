function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function SegmentedBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("bg-white rounded-2xl shadow overflow-visible", className)}>
      {/* keep the “gap” padding */}
      <div className="p-2 overflow-visible">
        {/* IMPORTANT: no overflow-hidden here */}
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-xl bg-white overflow-visible">
          {children}
        </div>
      </div>
    </div>
  );
}
