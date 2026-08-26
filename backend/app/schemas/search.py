from pydantic import BaseModel


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5


class SearchResult(BaseModel):
    content: str
    document_id: str


class AskRequest(BaseModel):
    question: str
    top_k: int = 5


class AskResponse(BaseModel):
    answer: str


class AskSource(BaseModel):
    content: str
    document_id: str


class AskResponse(BaseModel):
    answer: str
    sources: list[AskSource]