/**
 * Converts a numeric amount into Indian Currency words format
 * Example: 18450.75 -> "Indian Rupees Eighteen Thousand Four Hundred Fifty and Seventy-Five Paise Only"
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanThousand(num: number): string {
  let str = '';
  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    str += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  }
  if (num > 0) {
    str += ones[num] + ' ';
  }
  return str.trim();
}

export function numberToIndianWords(amount: number): string {
  if (amount === 0) return 'Indian Rupees Zero Only';

  const rounded = Math.round(amount * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  let rupeesStr = '';

  const crore = Math.floor(rupees / 10000000);
  let rem = rupees % 10000000;

  const lakh = Math.floor(rem / 100000);
  rem %= 100000;

  const thousand = Math.floor(rem / 1000);
  rem %= 1000;

  const hundred = rem;

  if (crore > 0) {
    rupeesStr += convertLessThanThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    rupeesStr += convertLessThanThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    rupeesStr += convertLessThanThousand(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    rupeesStr += convertLessThanThousand(hundred) + ' ';
  }

  rupeesStr = rupeesStr.trim();
  if (!rupeesStr) rupeesStr = 'Zero';

  let result = `Indian Rupees ${rupeesStr}`;

  if (paise > 0) {
    result += ` and ${convertLessThanThousand(paise)} Paise`;
  }

  result += ' Only';
  return result;
}
