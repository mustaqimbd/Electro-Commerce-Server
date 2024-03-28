export const convertIso = (
  inputDate: string,
  isStart: boolean = true
): Date | undefined => {
  const isoDateString = inputDate + "T00:00:00.000Z";
  const convertedDate = new Date(isoDateString);
  if (!isNaN(convertedDate.getTime())) {
    if (isStart) {
      convertedDate.setUTCHours(0, 0, 0, 0);
    } else {
      convertedDate.setUTCHours(23, 59, 59, 999);
    }
    return convertedDate;
  } else {
    return undefined;
  }
};
