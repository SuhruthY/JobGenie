export interface Job {
  title: string;
  companyName: string;
  applicationLink: string | null;
  pubDate: number | null;
  expiryDate: number | null;
  minSalary: number | null;
  maxSalary: number | null;
  currency: string | null;
  locationRestrictions: string[];
  description: string;
  employmentType: string | null;
  companyLogo: string | null;
  _provider: string;
  _salary: string | null;
  _posted: string;
  _expiresIn: number;
  _expiryStatus: string;
  _snippet: string;
}
