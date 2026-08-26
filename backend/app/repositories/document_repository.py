from sqlalchemy.orm import Session
from app.models.document import Document


def get_document_by_id(
    db: Session,
    document_id,
    user_id,
):
    return (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == user_id,
        )
        .first()
    )


def get_documents_by_user(
    db: Session,
    user_id,
):
    return (
        db.query(Document)
        .filter(Document.user_id == user_id)
        .all()
    )

def delete_document(
    db: Session,
    document: Document,
):
    db.delete(document)
    db.commit()

