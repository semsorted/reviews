const WORKING_DAYS_PER_MONTH = 26;

export function estimateReviews(customersPerDay: number, reviewsPerHundred: number, months: number): number {
  return Math.round((customersPerDay * reviewsPerHundred * WORKING_DAYS_PER_MONTH * months) / 100);
}
