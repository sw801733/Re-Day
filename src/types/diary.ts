export interface ParsedDiarySections {
  facts?: string;
  actions?: string;
  thoughts?: string;
  lessons?: string;
  discomforts?: string;
  nextSteps?: string;
  oneLine?: string;
}

export interface ParsedDiaryEntry {
  id: string;
  title: string;
  date: string;
  exercise?: string;
  condition?: string;
  rawContent: string;
  sections: ParsedDiarySections;
  nextStepsList: string[];
  summarySourceText: string;
}
