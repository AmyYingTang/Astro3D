export const astronomicalScore = (lightYears) => {
  if (lightYears < 5000) {
    return Math.round((2.0 + (lightYears / 5000) * 3.0) * 10) / 10;
  } else if (lightYears < 200000) {
    return Math.round((5.0 + ((lightYears - 5000) / 195000) * 2.0) * 10) / 10;
  } else {
    const score = 7.0 + Math.min((lightYears - 200000) / 28800000, 1) * 3.0;
    return Math.round(score * 10) / 10;
  }
};