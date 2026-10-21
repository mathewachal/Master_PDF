import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
import pikepdf

router = APIRouter(prefix="/security", tags=["Security & Encryption"])


@router.post("/protect")
async def protect_pdf(
    file: UploadFile = File(...),
    user_password: str = Form(""),
    owner_password: str = Form(""),
    allow_printing: bool = Form(True),
    allow_modifications: bool = Form(False),
):
    """
    Encrypts a PDF using AES-256 encryption with optional user and owner passwords,
    enforcing document permission flags.
    """
    if not user_password and not owner_password:
        raise HTTPException(status_code=400, detail="At least a user or owner password is required")

    try:
        content = await file.read()
        in_stream = io.BytesIO(content)

        with pikepdf.open(in_stream) as pdf:
            permissions = pikepdf.Permissions(
                accessibility=True,
                extract=allow_modifications,
                modify_annotation=allow_modifications,
                modify_assembly=allow_modifications,
                modify_form=allow_modifications,
                modify_other=allow_modifications,
                print_highres=allow_printing,
                print_lowres=allow_printing,
            )

            encryption = pikepdf.Encryption(
                user=user_password,
                owner=owner_password or user_password,
                allow=permissions,
                aes=True,
                R=6,  # 256-bit AES encryption
            )

            out_stream = io.BytesIO()
            pdf.save(out_stream, encryption=encryption)
            out_stream.seek(0)

            return Response(
                content=out_stream.getvalue(),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="protected_{file.filename or "document.pdf"}"'
                },
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to encrypt PDF: {str(e)}")


@router.post("/unlock")
async def unlock_pdf(
    file: UploadFile = File(...),
    password: str = Form(...),
):
    """
    Removes password protection and encryption from a PDF when the valid password is supplied.
    """
    try:
        content = await file.read()
        in_stream = io.BytesIO(content)

        try:
            with pikepdf.open(in_stream, password=password) as pdf:
                out_stream = io.BytesIO()
                # Saving without encryption object produces an unlocked/unencrypted PDF
                pdf.save(out_stream)
                out_stream.seek(0)

                return Response(
                    content=out_stream.getvalue(),
                    media_type="application/pdf",
                    headers={
                        "Content-Disposition": f'attachment; filename="unlocked_{file.filename or "document.pdf"}"'
                    },
                )
        except pikepdf.PasswordError:
            raise HTTPException(status_code=401, detail="Invalid password provided")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unlock PDF: {str(e)}")
