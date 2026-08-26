from sqlalchemy.orm import Session

from app.services.text_chunker import chunk_text
from app.services.embedding_service import generate_embeddings
from app.repositories.document_chunk_repository import create_chunks


def ingest_document(
    db: Session,
    document_id,
    text: str,
):
    chunks = chunk_text(text)

    if not chunks:
        return []

    embeddings = generate_embeddings(chunks)

    return create_chunks(
        db=db,
        document_id=document_id,
        chunks=chunks,
        embeddings=embeddings,
    )