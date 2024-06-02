export class DateTime extends Date {
  addMinutes(minutes: number): DateTime {
    this.setMinutes(this.getMinutes() + minutes);
    return this;
  }

  addHours(hours: number): DateTime {
    this.setHours(this.getHours() + hours);
    return this;
  }

  subtractMinutes(minutes: number): DateTime {
    this.setMinutes(this.getMinutes() + minutes);
    return this;
  }
}
