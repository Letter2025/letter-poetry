import { Fragment } from "react";

// [LETTER-POETRY-PLAN-006] 搜索关键词高亮（split/join，安全，React 自动转义）
export function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const parts = text.split(q);
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p}
          {i < parts.length - 1 && <mark>{q}</mark>}
        </Fragment>
      ))}
    </>
  );
}