export interface FindAndCountType<T> {
  items: T[];
  total: number;
  currentPage: number;
  lastPage: number;
  nextPage: number | null;
}
