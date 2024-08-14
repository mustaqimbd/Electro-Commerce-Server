const generateSlug = (value: string, trimSlug?: string) => {
  return trimSlug
    ? trimSlug.replace(/\s+/g, " ").trim().toLowerCase().split(" ").join("-")
    : value.replace(/\s+/g, " ").trim().toLowerCase().split(" ").join("-");
};

export default generateSlug;
