export interface Activity {
  id: string;
  name: string;
  /** Ids of the activities whose output this one needs. */
  deps: string[];
}

/** A sequence of activity ids; rows and columns of the matrix share it. */
export type Order = string[];

/** Row `row` needs the output of column `col`. */
export interface Mark {
  row: string;
  col: string;
}

/** A mark above the diagonal; `span` is how many positions it sits above. */
export interface FeedbackMark extends Mark {
  span: number;
}
