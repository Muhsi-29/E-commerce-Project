export const RETURN_REASONS = [
  { value: 'DAMAGED', label: 'Arrived damaged' },
  { value: 'WRONG_ITEM', label: 'Wrong item received' },
  { value: 'NOT_AS_DESCRIBED', label: 'Not as described' },
  { value: 'NO_LONGER_NEEDED', label: 'No longer needed' },
  { value: 'OTHER', label: 'Other' },
];

// "WRONG_ITEM" -> "Wrong item received"
export const returnReasonLabel = (reason: string) => RETURN_REASONS.find(r => r.value === reason)?.label ?? reason;
