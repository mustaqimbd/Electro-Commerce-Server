export const warrantyDuration = (duration: string) => {
  const date = new Date(); // Get the current date as the starting point
  function addDurationToDate(duration: string) {
    // Split the duration string into number and unit
    const durationArray = duration.split(" ");
    const number = parseInt(durationArray[0]);
    const unit = durationArray[1];
    // Calculate the end date based on the unit
    const endDate = new Date(date);
    switch (unit) {
      case "days":
        endDate.setDate(date.getDate() + number);
        break;
      case "weeks":
        endDate.setDate(date.getDate() + number * 7);
        break;
      case "months":
        endDate.setMonth(date.getMonth() + number);
        break;
      case "years":
        endDate.setFullYear(date.getFullYear() + number);
        break;
      default:
        return null;
    }
    return endDate;
  }

  const startDate = date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const endDate = addDurationToDate(duration)?.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return { startDate, endDate };
};
