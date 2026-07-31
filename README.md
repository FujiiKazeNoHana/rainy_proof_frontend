# rainy_proof_frontend

Rainy Proof 独立前端。技术栈：Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui。

目录与后端包结构对齐：按**开发者**（`ergo` / `yemin`）与**功能**分包，功能间零业务依赖。

## 信息架构

```text
/                     开发者门户（ERGO 标识为主入口，预留好友位）
/<owner>              开发者工作区 / 功能画廊
/<owner>/<feature>    具体功能页
```

## 开发

```bash
npm install
npm run dev
```

- 门户：[http://localhost:3000](http://localhost:3000)
- ERGO 工作区：[http://localhost:3000/ergo](http://localhost:3000/ergo)
- 排序可视化：[http://localhost:3000/ergo/sort-viz](http://localhost:3000/ergo/sort-viz)

```bash
npm test
npm run build
```

## 目录

```text
src/
├── app/                         # 路由壳
│   ├── page.tsx                 # 开发者门户
│   ├── ergo/page.tsx            # ERGO 功能画廊
│   └── yemin/page.tsx           # 好友命名空间占位
├── features/
│   ├── developers.ts            # 开发者注册表
│   ├── catalog.ts               # 功能注册表
│   ├── ergo/thanos_sort/
│   └── yemin/
└── shared/                      # 薄公共层（brand / ui / api-client）
```

## 新增约定

| 动作 | 做法 |
| --- | --- |
| 好友加入 | 在 `developers.ts` 设为 `ready`，补 brand mark，加 `features/<id>/` |
| 新功能 | `features/<owner>/<feature_snake>/` + `app/<owner>/<feature-kebab>/` + 写入 `catalog.ts` |
| API（二期） | `/api/<owner>/<feature_snake>/...` |
