import { StoryRole } from "./Roles";

export class StoryGenerator {
  generate() {
    console.log("Story generated");
    return new Map<string, StoryRole>();
  }
}
