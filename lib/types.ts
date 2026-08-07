export type PoemMeta = {
  id: string;
  t: string;
  a: string;
  c: string;
  r: string;
  s: string;
};

export type CollectionMeta = {
  key: string;
  name: string;
  short: string;
  dynasty: string;
  desc: string;
  count: number;
};

// [LETTER-POETRY-PLAN-002] 索引元数据：仅选集与总量，正文/诗目在 D1 与服务端 API
export type PoetryIndex = {
  generatedAt: string;
  total: number;
  collections: CollectionMeta[];
};

export type Poem = PoemMeta & {
  p: string[];
  notes?: string[];
  tr?: string;
};

export type MengxueDoc = {
  id: string;
  title: string;
  author: string;
  paragraphs: string[];
  /** 分卷信息（古文观止按卷分组，如「卷一・周文」），其余蒙学无此字段 */
  section?: string;
};

export type Author = {
  name: string;
  ids: string[];
};
// [LETTER-POETRY-PLAN-002] D1 数据行类型（客户端/服务端共用，避免客户端触碰 cloudflare:workers）
export type PoemRow = {
  id: string;
  title: string;
  author: string;
  collection: string;
  rhythmic: string;
  section: string;
  text: string;
  notes: string;
  tr: string;
};
// [LETTER-POETRY-PLAN-009] 策展（季节/主题）
export type CurationGroup = {
  slug: string;
  kind: "season" | "theme";
  name: string;
  title: string;
  desc: string;
  ids: string[];
};

export type CurationIndex = {
  generatedAt: string;
  groups: CurationGroup[];
};