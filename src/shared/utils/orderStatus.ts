export interface OrderStatusMeta {
  step: number;
  label: string;
  icon: string;
  badgeClass: string;
  softClass: string;
  textClass: string;
  selectClass: string;
  chevronClass: string;
  dotClass: string;
}

export const ORDER_STATUS_OPTIONS: OrderStatusMeta[] = [
  {
    step: 0,
    label: 'Đang xử lý',
    icon: 'fa-spinner',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
    softClass: 'bg-amber-50 text-amber-500',
    textClass: 'text-amber-600',
    selectClass: 'bg-chart-1/10 text-chart-1 border-chart-1/20 hover:bg-chart-1/20',
    chevronClass: 'text-chart-1',
    dotClass: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
  },
  {
    step: 1,
    label: 'Đã xác nhận',
    icon: 'fa-clipboard-check',
    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-200/50',
    softClass: 'bg-blue-50 text-blue-500',
    textClass: 'text-blue-600',
    selectClass: 'bg-chart-2/10 text-chart-2 border-chart-2/20 hover:bg-chart-2/20',
    chevronClass: 'text-chart-2',
    dotClass: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
  },
  {
    step: 5,
    label: 'Đang đóng gói',
    icon: 'fa-box-open',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 border-indigo-200/50',
    softClass: 'bg-indigo-50 text-indigo-500',
    textClass: 'text-indigo-600',
    selectClass: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20',
    chevronClass: 'text-indigo-500',
    dotClass: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
  },
  {
    step: 2,
    label: 'Đang giao',
    icon: 'fa-truck-fast',
    badgeClass: 'bg-purple-500/10 text-purple-600 border-purple-200/50',
    softClass: 'bg-purple-50 text-purple-500',
    textClass: 'text-purple-600',
    selectClass: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
    chevronClass: 'text-primary',
    dotClass: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
  },
  {
    step: 3,
    label: 'Đã giao',
    icon: 'fa-circle-check',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50',
    softClass: 'bg-emerald-50 text-emerald-500',
    textClass: 'text-emerald-600',
    selectClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20',
    chevronClass: 'text-emerald-500',
    dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
  },
  {
    step: 6,
    label: 'Giao thất bại',
    icon: 'fa-triangle-exclamation',
    badgeClass: 'bg-slate-500/10 text-slate-600 border-slate-200/50',
    softClass: 'bg-slate-100 text-slate-500',
    textClass: 'text-slate-600',
    selectClass: 'bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20',
    chevronClass: 'text-slate-500',
    dotClass: 'bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.4)]'
  },
  {
    step: 4,
    label: 'Đã hủy',
    icon: 'fa-circle-xmark',
    badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-200/50',
    softClass: 'bg-rose-50 text-rose-500',
    textClass: 'text-rose-600',
    selectClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20',
    chevronClass: 'text-rose-500',
    dotClass: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
  }
];

export const ORDER_PROGRESS_STEPS = [0, 1, 5, 2, 3];

const ORDER_STATUS_BY_LABEL = new Map(
  ORDER_STATUS_OPTIONS.map((status) => [status.label.toLowerCase(), status.step])
);

export const normalizeOrderStatusStep = (step?: number, status?: string): number => {
  if (typeof step === 'number') {
    if (step === -1) return 4;
    if (ORDER_STATUS_OPTIONS.some((option) => option.step === step)) return step;
  }

  if (status) {
    return ORDER_STATUS_BY_LABEL.get(status.toLowerCase()) ?? 0;
  }

  return 0;
};

export const getOrderStatusMeta = (step?: number, status?: string): OrderStatusMeta => {
  const normalizedStep = normalizeOrderStatusStep(step, status);
  return ORDER_STATUS_OPTIONS.find((option) => option.step === normalizedStep) ?? ORDER_STATUS_OPTIONS[0];
};

export const isOrderActiveStep = (step?: number, status?: string): boolean => {
  const normalizedStep = normalizeOrderStatusStep(step, status);
  return [0, 1, 5, 2].includes(normalizedStep);
};

export const getOrderProgressIndex = (step?: number, status?: string): number => {
  const normalizedStep = normalizeOrderStatusStep(step, status);

  if (normalizedStep === 6) {
    return ORDER_PROGRESS_STEPS.indexOf(2);
  }

  if (normalizedStep === 4) {
    return -1;
  }

  return ORDER_PROGRESS_STEPS.indexOf(normalizedStep);
};
