export interface Med {
  id: string;
  name: string;
  ingredient: string; // действующее вещество
  form: string; // таблетки, сироп, мазь…
  dosage: string; // как принимать
  indications: string; // от чего помогает
  contraindications: string;
  tags: string[]; // симптомы: «головная боль», «температура»…
  qty: number;
  unit: string; // шт, мл, пак…
  lowStock: number; // порог «заканчивается», 0 = выкл
  expiry: string | null; // 'YYYY-MM'
  location: string; // где лежит
  notes: string;
  photo?: Blob;
  createdAt: number;
  updatedAt: number;
}

export interface AiResult {
  name?: string;
  ingredient?: string;
  form?: string;
  dosage?: string;
  indications?: string;
  contraindications?: string;
  tags?: string[];
  error?: string;
}
