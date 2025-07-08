const isRtl = (text) => {
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F]/;
  return rtlRegex.test(text);
};

export default isRtl;