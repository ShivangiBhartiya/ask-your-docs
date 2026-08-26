from sqlalchemy.orm import Session

from app.repositories.document_chunk_repository import search_similar_chunks
from app.services.embedding_service import generate_embedding
from app.services.llm_service import generate_answer
from app.schemas.search import AskResponse, AskSource


def answer_question(
    db: Session,
    question: str,
    user_id,
    top_k: int = 5,
) -> AskResponse:


    query_embedding = generate_embedding(question)

    chunks = search_similar_chunks(
        db=db,
        query_embedding=query_embedding,
        user_id=user_id,
        top_k=top_k,
    )

    if not chunks:
        return AskResponse(
            answer="I couldn't find that information in the uploaded documents.",
            sources=[],
        )

    context = "\n\n".join(
        chunk.content
        for chunk in chunks
    )

    prompt = f"""
You are a helpful assistant answering questions about a user's documents.

Answer the question using ONLY the provided context.

If the answer cannot be found in the context, say:
"I couldn't find that information in the uploaded documents."

Do not make up information.

Context:
{context}

Question:
{question}

Answer:
"""

    answer = generate_answer(prompt)

    sources = [
        AskSource(
            content=chunk.content,
            document_id=str(chunk.document_id),
        )
        for chunk in chunks
    ]

    return AskResponse(
        answer=answer,
        sources=sources,
    )