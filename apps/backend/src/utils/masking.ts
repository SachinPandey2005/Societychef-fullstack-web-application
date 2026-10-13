export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `*@${domain}`;
  
  const first = local[0];
  const last = local[local.length - 1];
  return `${first}***${last}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 4) return phone;
  const last4 = phone.slice(-4);
  return `+** *** *** ${last4}`;
};

export const maskCreditCard = (cardNumber: string): string => {
  if (!cardNumber || cardNumber.length < 4) return cardNumber;
  const last4 = cardNumber.slice(-4);
  return `**** **** **** ${last4}`;
};
