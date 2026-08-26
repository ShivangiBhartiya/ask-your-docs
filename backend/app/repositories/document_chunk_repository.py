from sqlalchemy.orm import Session

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