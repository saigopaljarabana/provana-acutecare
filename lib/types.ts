export type Role = 'nurse' | 'doctor' | 'attending';

export type GovernanceOutcome = 'SERVE' | 'REFUSE' | 'BLOCK' | 'ROUTE';

export type GovernedAction =
  | 'order_antibiotics'
  | 'order_tpa'
  | 'activate_mtp'
  | 'escalate_to_doctor'
  | 'render_protocol';
