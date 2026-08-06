import indexJson from "./generated/index.json";
import collectionsJson from "./generated/collections.json";
import mengxueJson from "./generated/mengxue.json";
import type { CollectionMeta, MengxueDoc, Poem, PoetryIndex } from "./types";

export function getIndex(): PoetryIndex {
  return indexJson as PoetryIndex;
}

export function getCollections(): CollectionMeta[] {
  return indexJson.collections as CollectionMeta[];
}

export function getCollection(key: string): Poem[] {
  return (collectionsJson as Record<string, Poem[]>)[key] ?? [];
}

export function getPoem(id: string): Poem | null {
  const key = id.split("-")[0];
  const list = getCollection(key);
  return list.find((p) => p.id === id) ?? null;
}

export function getMengxue(): MengxueDoc[] {
  return mengxueJson as MengxueDoc[];
}

export function getMengxueDoc(id: string): MengxueDoc | null {
  return getMengxue().find((d) => d.id === id) ?? null;
}