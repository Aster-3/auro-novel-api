export interface FindAndCountType<T> {
  data: T[];
  count: number;
  currentPage: number;
  lastPage: number;
}
