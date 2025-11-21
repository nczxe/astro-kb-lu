// 正确导入Runtime类型并使用Cloudflare提供的Env
import type { Runtime } from "@astrojs/cloudflare";
import type { Env } from "../worker-configuration";

declare namespace App {
  interface Locals extends Runtime<Env> {}
}
