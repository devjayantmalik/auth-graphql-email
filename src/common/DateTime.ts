export class DateTime extends Date {
  subtractMinutes(minutes: number): DateTime {
    this.setMinutes(this.getMinutes() + minutes);
    return this;
  }
}
