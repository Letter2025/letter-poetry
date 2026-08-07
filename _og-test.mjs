import { ImageResponse } from "@vercel/og";
import React from "react";

const img = new ImageResponse(
  React.createElement("div", { style: { width: "100%", height: "100%", backgroundColor: "#0d1117", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 } }, "Hello OG 中文测试"),
  { width: 400, height: 200 }
);
const buf = await img.arrayBuffer();
console.log("bytes:", buf.byteLength);
const fs = await import("fs");
fs.writeFileSync("E:/aicode/web/_og-local.png", Buffer.from(buf));
console.log("written");