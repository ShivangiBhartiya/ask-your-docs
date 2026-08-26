from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from app.core.config import settings
from app.database.session import get_db

from app.schemas.user import UserResponse, UserCreate
from app.models import User, Document
from app.schemas.document import DocumentResponse
from app.utils.security import hash_password, verify_password, create_access_token
from app.dependencies.auth import get_current_user
from app.services.document_parser import extract_text
from app.services.document_ingestion import ingest_document
from app.schemas.search import SearchRequest, SearchResult
from app.services.embedding_service import generate_embedding
from app.repositories.document_chunk_repository import search_similar_chunks
from app.schemas.search import AskRequest, AskResponse
from app.services.rag_service import answer_question
from app.repositories.document_repository import (
    get_document_by_id,
    get_documents_by_user,
    delete_document as delete_document_from_db
)

from pathlib import Path
import shutil
from uuid import uuid4, UUID

router = APIRouter()
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}"
    }

@router.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@router.get("/users", response_model=list[UserResponse])
def get_users(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User).all()
    return users

@router.post("/users")
def create_user(user: UserCreate, db = Depends(get_db)):
    password_hash = hash_password(user.password)

    new_user = User(
        email=user.email,
        password_hash=password_hash
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db=Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        db_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={"sub": str(db_user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/documents/upload", response_model=DocumentResponse)
def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    file_path = UPLOAD_DIR / f"{uuid4()}_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text(str(file_path))

    document = Document(
        filename=file.filename,
        file_path=str(file_path),
        content=text,
        user_id=current_user.id,
    )

    db.add(document)
    db.commit()
    db.refresh(document)
    ingest_document(
        db=db,
        document_id=document.id,
        text=text,
    )

    return document


@router.get("/documents", response_model=list[DocumentResponse])
def get_documents(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    return get_documents_by_user(
        db,
        current_user.id,
    )


@router.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    document = get_document_by_id(
        db,
        document_id,
        current_user.id,
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    return document

@router.delete("/documents/{document_id}")
def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    document = get_document_by_id(
        db,
        document_id,
        current_user.id,
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    file_path = Path(document.file_path)

    if file_path.exists():
        file_path.unlink()

    delete_document_from_db(db, document)

    return {"message": "Document deleted successfully"}


@router.post("/documents/search", response_model=list[SearchResult])
def search_documents(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    query_embedding = generate_embedding(request.query)

    chunks = search_similar_chunks(
        db=db,
        query_embedding=query_embedding,
        user_id=current_user.id,
        top_k=request.top_k,
    )

    return [
        SearchResult(
            content=chunk.content,
            document_id=str(chunk.document_id),
        )
        for chunk in chunks
    ]


@router.post("/documents/ask", response_model=AskResponse)
def ask_documents(
    request: AskRequest,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    return answer_question(
        db=db,
        question=request.question,
        user_id=current_user.id,
        top_k=request.top_k,
    )