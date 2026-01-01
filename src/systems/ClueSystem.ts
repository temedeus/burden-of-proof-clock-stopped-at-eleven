export class ClueSystem {
  private discovered = new Set<string>();

  addClue(id: string) {
    this.discovered.add(id);
    console.log("Clue discovered:", id);
  }

  hasClue(id: string): boolean {
    return this.discovered.has(id);
  }
}
