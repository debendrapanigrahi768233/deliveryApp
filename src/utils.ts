const calculateDiscount = (price: number, percentage: number) => {
  return (price * percentage) / 100;
};

export default calculateDiscount;
