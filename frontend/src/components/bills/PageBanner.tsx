import { ArrowDownLeft, ArrowUpRight, Box, TrendingUp } from 'lucide-react';

type Mode = 'sale' | 'import';

const COPY: Record<
  Mode,
  {
    title: string;
    subtitle: string;
    flow: string;
    Icon: typeof TrendingUp;
    FlowIcon: typeof ArrowUpRight;
    classes: {
      wrap: string;
      title: string;
      subtitle: string;
      flow: string;
      iconBox: string;
    };
  }
> = {
  sale: {
    title: 'Bán hàng · Xuất kho',
    subtitle: 'Lập hóa đơn bán — chọn sản phẩm, chốt đơn cho khách hàng',
    flow: 'Hàng ra · Thu tiền',
    Icon: TrendingUp,
    FlowIcon: ArrowUpRight,
    classes: {
      wrap: 'border-[#ffd5bd] bg-[#fff3ec]',
      title: 'text-[#7a3a08]',
      subtitle: 'text-[#b5610a]',
      flow: 'bg-[#ffe2d1] text-[#b5450a]',
      iconBox: 'bg-accent text-white',
    },
  },
  import: {
    title: 'Nhập hàng · Nhập kho',
    subtitle: 'Lập đơn mua hàng loạt — chọn sản phẩm, đặt nhà cung cấp',
    flow: 'Hàng vào · Chi tiền',
    Icon: Box,
    FlowIcon: ArrowDownLeft,
    classes: {
      wrap: 'border-[#b8e2e6] bg-[#e8f6f7]',
      title: 'text-[#0a4d54]',
      subtitle: 'text-[#0a5a63]',
      flow: 'bg-[#d2eef0] text-[#0a5a63]',
      iconBox: 'bg-[#0e7c86] text-white',
    },
  },
};

export function PageBanner({ mode }: { mode: Mode }) {
  const { title, subtitle, flow, Icon, FlowIcon, classes } = COPY[mode];

  return (
    <div
      className={`mb-[18px] flex items-center gap-[14px] rounded-[9px] border px-[18px] py-[13px] ${classes.wrap}`}
    >
      <div
        className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[9px] ${classes.iconBox}`}
      >
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div
          className={`text-[16px] font-bold tracking-[0.04em] uppercase ${classes.title}`}
        >
          {title}
        </div>
        <div className={`mt-[3px] text-[12px] ${classes.subtitle}`}>{subtitle}</div>
      </div>
      <div
        className={`ml-auto inline-flex items-center gap-[7px] rounded-full px-[14px] py-2 text-[12px] font-semibold whitespace-nowrap ${classes.flow}`}
      >
        <FlowIcon size={15} strokeWidth={2.2} />
        {flow}
      </div>
    </div>
  );
}
