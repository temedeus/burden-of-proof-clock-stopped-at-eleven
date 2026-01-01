export interface PlayerTheory {
  suspect: string;
  weapon: string;
  time: string;
}

export class DeductionSystem {
  evaluate(_theory: PlayerTheory): boolean {
    // placeholder logic
    return true;
  }
}
