const createOrderId = () => {
  const getRandomLetter = () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
    return alphabet[Math.floor(Math.random() * alphabet.length)];
  };
  const date = new Date();
  const timestamp = date.getTime();
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  const randomLetters = Array.from({ length: 6 }, getRandomLetter).join("");
  const orderId = `${String(date.getFullYear()).slice(2)}${date.getMonth() + 1}${randomLetters}${randomNum}${String(timestamp).split("").reverse().join("")}`;
  return orderId.slice(0, 15);
};

export default createOrderId;
