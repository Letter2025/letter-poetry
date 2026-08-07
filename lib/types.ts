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

export type PoetryIndex = {
  generatedAt: string;
  total: number;
  collections: CollectionMeta[];
  poems: PoemMeta[];
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