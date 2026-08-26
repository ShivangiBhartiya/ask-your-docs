from app.database.base import Base
from uuid import UUID, uuid4
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime, ForeignKey
from datetime import datetime

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(
            primary_key=True,
            default=uuid4,
    )

    filename: Mapped[str] = mapped_column(
            nullable=False,
    )

    file_path: Mapped[str] = mapped_column(
            nullable=False,
    )

    content: Mapped[str] = mapped_column(
        nullable=False,
        default="",
)

    user_id: Mapped[UUID] = mapped_column(
            ForeignKey("users.id"),
            nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
            DateTime(timezone=True),
            nullable=False,
            default=datetime.utcnow,
    )
