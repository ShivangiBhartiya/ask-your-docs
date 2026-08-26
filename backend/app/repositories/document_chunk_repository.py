from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.document_chunk import DocumentChunk


def create_chunks(
    db: Session,
    document_id,
    chunks: list[str],
    embeddings: list[list[float]],
) -> list[DocumentChunk]:

    document_chunks = []

    for chunk_text, embedding in zip(chunks, embeddings):
        document_chunk = DocumentChunk(
            document_id=document_id,
            content=chunk_text,
            embedding=embedding,
        )

        db.add(document_chunk)
        document_chunks.append(document_chunk)

    db.commit()

    for chunk in document_chunks:
        db.refresh(chunk)

    return document_chunks


def search_similar_chunks(
    db: Session,
    query_embedding: list[float],
    user_id,
    top_k: int = 5,
    max_distance: float = 0.8,
) -> list[DocumentChunk]:

    distance = DocumentChunk.embedding.cosine_distance(
        query_embedding
    )

    return (
        db.query(DocumentChunk)
        .join(Document)
        .filter(
            Document.user_id == user_id,
            distance <= max_distance,
        )
        .order_by(distance)
        .limit(top_k)
        .all()
    )