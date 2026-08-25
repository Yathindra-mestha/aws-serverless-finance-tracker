export const formatCurrency = (
  amount: number,
  currencyCode: string = 'INR',
  symbol: string = '₹'
): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formattedNum = '';

  if (currencyCode === 'INR') {
    // Indian numbering format (e.g. 1,00,000.00)
    formattedNum = absAmount.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
  } else {
    // Standard international numbering format (e.g. 100,000.00)
    formattedNum = absAmount.toLocaleString('en-US', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
  }

  return `${isNegative ? '-' : ''}${symbol}${formattedNum}`;
};

export const formatPercentage = (val: number, decimals: number = 0): string => {
  if (isNaN(val) || !isFinite(val)) return '0%';
  return `${val.toFixed(decimals)}%`;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatMonth = (monthYearStr: string): string => {
  if (!monthYearStr) return '';
  try {
    const [year, month] = monthYearStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return monthYearStr;
  }
};

export const getCurrentMonthYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
