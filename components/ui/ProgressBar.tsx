interface ProgressBarProps {
  progress: number;
  isAnimating?: boolean;
}

export function ProgressBar({ progress, isAnimating }: ProgressBarProps) {
  return (
    <div
      className={`w-full bg-[#c39a2b]/20 h-2 rounded-full mb-2 overflow-hidden transition-opacity duration-400 ease-out ${
        isAnimating ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className="bg-[#c39a2b] h-full transition-all duration-800 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}