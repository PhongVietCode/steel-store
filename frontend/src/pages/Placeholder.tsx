interface PlaceholderProps {
  title: string;
  stage: number;
}

export function PlaceholderPage({ title, stage }: PlaceholderProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-neutral-500">
        Trang này sẽ được hoàn thiện ở giai đoạn {stage}.
      </p>
    </div>
  );
}
