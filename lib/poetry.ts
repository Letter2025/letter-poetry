import metaJson from "./generated/collections-meta.json";
import mengxueJson from "./generated/mengxue.json";
import authorsJson from "./generated/authors.json";
import themesJson from "./generated/themes.json";
import type { Author, CollectionMeta, CurationGroup, MengxueDoc, PoetryIndex } from "./types";

// [LETTER-POETRY-PLAN-002] 构建期小元数据（bundle）；正文/诗目数据在 D1，通过 lib/db.ts 查询
export function getIndex(): PoetryIndex {
  return metaJson as PoetryIndex;
}

export function getCollections(): CollectionMeta[] {
  return metaJson.collections as CollectionMeta[];
}

export function getCollectionMeta(key: string): CollectionMeta | undefined {
  return getCollections().find((c) => c.key === key);
}

export function getMengxue(): MengxueDoc[] {
  return mengxueJson as MengxueDoc[];
}

export function getMengxueDoc(id: string): MengxueDoc | null {
  return getMengxue().find((d) => d.id === id) ?? null;
}

export function getAuthors(): Author[] {
  return authorsJson as Author[];
}

export function getAuthor(name: string): Author | null {
  return getAuthors().find((x) => x.name === name) ?? null;
}
// [LETTER-POETRY-PLAN-009] 策展数据（季节/主题）
export function getThemes(): CurationGroup[] {
  return themesJson.groups as CurationGroup[];
}

export function getTheme(slug: string): CurationGroup | undefined {
  return getThemes().find((g) => g.slug === slug);
}