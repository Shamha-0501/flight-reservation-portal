export abstract class Migration {
  abstract up(): Promise<void> | void;
  abstract down(): Promise<void> | void;
}
