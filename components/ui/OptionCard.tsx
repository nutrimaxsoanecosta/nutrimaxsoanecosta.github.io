interface OptionCardProps {
  id: string;
  value: string;
  selected: boolean;
  type?: 'radio' | 'checkbox';
  onSelect: () => void;
}

export function OptionCard({ id, value, selected, type = 'radio', onSelect }: OptionCardProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center justify-between w-full p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
        selected
          ? 'bg-[rgba(27,83,43,0.06)] border-[#1b532b] text-[#1b532b] font-semibold shadow-[0_0_0_1px_#1b532b]'
          : 'bg-[#ffffff] border-[#e2e5e2] text-[#2d312e] hover:bg-[rgba(73,138,40,0.04)] hover:border-[#498a28]'
      }`}
    >
      <span className="text-base">{value}</span>
      <input
        type={type}
        id={id}
        checked={selected}
        onChange={onSelect}
        className={`h-5 w-5 accent-[#1b532b] cursor-pointer ${
          type === 'checkbox' ? 'rounded' : 'rounded-full'
        }`}
      />
    </label>
  );
}