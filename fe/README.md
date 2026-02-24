# Workflow Frontend - React

Frontend UI cho workflow management với AG-UI protocol.

Sử dụng **Create React App** thay vì Vite.

## Cài đặt

```bash
npm install
```

## Chạy Development Server

```bash
npm start
```

App sẽ chạy tại: http://localhost:3000

## Testing với Playwright MCP

```bash
# Install Playwright browsers (lần đầu)
npx playwright install

# Run tests
npm test

# Run tests với UI mode
npm run test:ui

# Debug tests
npx playwright test --debug
```

## Features

### 1. Workflow List
- Hiển thị danh sách workflows từ LangGraph server
- Refresh để load lại danh sách
- Click vào workflow để xem chi tiết

### 2. Workflow Detail
- Input JSON object để chuẩn bị đầu vào
- Upload files (optional)
- Trigger workflow execution

### 3. Workflow Run
- Hiển thị real-time execution progress
- Show từng step đang chạy
- Display output của mỗi step
- Show current state của workflow
- Display messages trong conversation

## Cấu trúc

```
src/
├── components/
│   └── Layout.tsx          # Main layout component
├── pages/
│   ├── WorkflowList.tsx    # Danh sách workflows
│   ├── WorkflowDetail.tsx  # Chi tiết & trigger workflow
│   └── WorkflowRun.tsx     # Real-time execution view
├── services/
│   └── langgraph.ts        # LangGraph API client
├── App.tsx                 # Main app with routing
└── main.tsx               # Entry point
```

## Build Production

```bash
npm run build
# hoặc
pnpm build
```

Build output sẽ ở folder `dist/`
