# Workflow Backend - LangGraph Server

Backend server sử dụng LangGraph với AG-UI protocol.

## Cài đặt

```bash
# Tạo virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt
```

## Cấu hình

1. Copy `.env.example` thành `.env`
2. Điền API keys của bạn

## Chạy server

```bash
# Development mode
langgraph dev --port 8123

# Production mode
langgraph serve --port 8123
```

Server sẽ chạy tại: http://localhost:8123

## API Endpoints

- `GET /assistants` - Danh sách workflows
- `GET /assistants/{assistant_id}` - Chi tiết workflow
- `GET /assistants/{assistant_id}/graph` - Thông tin graph
- `POST /threads` - Tạo thread mới
- `POST /threads/{thread_id}/runs` - Chạy workflow
- `GET /threads/{thread_id}/runs/{run_id}` - Trạng thái run
- `GET /threads/{thread_id}/runs/{run_id}/stream` - Stream events

## Tham khảo

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [AG-UI Protocol](https://docs.ag-ui.com/)
